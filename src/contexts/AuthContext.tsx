// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { initCable, disconnectCable } from '../lib/cable';   // ★ ActionCable integration

interface User {
  id: number;
  phone?: string;
  email?: string;                  // ★ for sub-admins
  full_name: string;
  roles: string[];
  permissions?: string[];          // ★ sub-admin permissions
  new_user: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string, mode?: 'customer' | 'staff') => Promise<void>;
  setSession: (user: User, accessToken: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  markWelcomeComplete: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

const USER_KEY = 'auth_user';
const TOKEN_KEY = 'access_token';
const REFRESH_COOKIE_NAME = 'refresh_token'; // used only in API; not stored in localStorage

/**
 * Safely parse JSON from localStorage
 */
function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [loading, setLoading] = useState(true);

  // Refresh user profile from backend
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/session');
      const userData = res.data.user || null;
      setUser(userData);
      if (userData) {
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      setUser(null);
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  // On mount: try to restore session from access token or refresh cookie
  useEffect(() => {
    const attemptSilentRefresh = async () => {
      try {
        const res = await api.post('/refresh'); // sends refresh cookie automatically via axios with credentials
        const { access_token } = res.data;
        if (access_token) {
          localStorage.setItem(TOKEN_KEY, access_token);
          initCable(access_token);               // ★ start WebSocket with new token
          await refreshUser();
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        disconnectCable();
      } finally {
        setLoading(false);
      }
    };

    const accessToken = localStorage.getItem(TOKEN_KEY);
    if (accessToken) {
      // Already have an access token – start cable and refresh profile
      initCable(accessToken);                    // ★ reconnect on reload
      refreshUser().finally(() => setLoading(false));
    } else {
      attemptSilentRefresh();
    }
  }, [refreshUser]);

  /**
   * Enhanced login – supports both phone (customer) and email (staff/sub-admin)
   * Sends the appropriate field based on the mode or presence of '@'
   */
  const login = async (identifier: string, password: string, mode?: 'customer' | 'staff') => {
    const isEmail = mode === 'staff' || identifier.includes('@');
    const payload = isEmail
      ? { email: identifier, password }
      : { phone: identifier, password };

    const res = await api.post('/login', payload);
    const { access_token, user: userData } = res.data;
    if (!access_token || !userData) throw new Error('Invalid credentials');

    setSession(userData, access_token);
  };

  // Set session after login / OTP verification
  const setSession = (userData: User, accessToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    initCable(accessToken);                     // ★ start WebSocket for new session
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  // Mark welcome as completed
  const markWelcomeComplete = async () => {
    const res = await api.patch('/users/welcome');
    const updatedUser = res.data.user;
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      await api.delete('/logout');               // clears refresh cookie on server
    } catch (_) {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    disconnectCable();                           // ★ disconnect WebSocket on logout
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        setSession,
        logout,
        refreshUser,
        markWelcomeComplete,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};