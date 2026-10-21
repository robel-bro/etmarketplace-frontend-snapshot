// src/lib/axios.ts
import axios from 'axios';
import { getNavigate } from './navigation';

// Remove all console logs in production (optional, can be controlled via env)
if (import.meta.env.PROD) {
  console.log = () => {};
}

// Use environment variable for the API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,            // send httpOnly refresh cookie automatically
  timeout: 30000,                   // 30-second timeout to prevent hanging
  headers: {
    Accept: 'application/json',
  },
});

// 🔐 Attach access token (from localStorage) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ⚡ Auto‑refresh on 401 – but NOT for auth endpoints
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const AUTH_ROUTES = ['/login', '/refresh', '/send_otp', '/verify_otp', '/sign_up'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ★ Immediately reject 401 on auth endpoints – no refresh loop
    if (
      error.response?.status === 401 &&
      AUTH_ROUTES.some((route) => originalRequest.url?.includes(route))
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue while another refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // The httpOnly cookie is sent automatically – just call refresh
        const { data } = await axios.post(
          `${API_BASE_URL}/refresh`,
          {},                        // no body needed, cookie does the job
          { withCredentials: true }
        );

        const newAccessToken = data.access_token;
        localStorage.setItem('access_token', newAccessToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh failed – clear everything and go to home/login
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        const navigate = getNavigate();
        if (navigate) {
          navigate('/');
        } else {
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors (or 401 on auth endpoints), just reject
    return Promise.reject(error);
  },
);

export default api;