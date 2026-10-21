// src/pages/LoginPage.tsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'staff' ? 'staff' : 'customer';
  const [mode, setMode] = useState<'customer' | 'staff'>(initialMode);

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = identifier.trim();
    if (!trimmed || !password.trim()) {
      setError(
        mode === 'staff'
          ? 'Please enter both email and password.'
          : 'Please enter both phone number and password.'
      );
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(trimmed, password, mode === 'staff' ? 'staff' : 'customer');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        (mode === 'staff' ? 'Invalid email or password.' : 'Invalid phone or password.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const switchToStaff = () => {
    setMode('staff');
    setIdentifier('');
    setPassword('');
    setError('');
  };

  const switchToCustomer = () => {
    setMode('customer');
    setIdentifier('');
    setPassword('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left illustration */}
      <div className="relative w-full lg:w-1/2 h-48 lg:h-full flex items-center justify-center bg-gray-50">
        <img
          src="/images/welcome/login.svg"
          alt="Login"
          className="w-3/5 max-w-xs lg:max-w-md h-auto object-contain"
        />
        <button
          onClick={goBack}
          className="absolute top-6 left-6 p-2 rounded-full bg-white/80 hover:bg-white text-gray-600 shadow-md transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-14 py-8 lg:py-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {mode === 'staff' ? (
            <>
              <h2 className="text-3xl font-black text-gray-900 mb-1">Staff Login</h2>
              <p className="text-gray-500 mb-6">Sign in with your staff email</p>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    required
                    autoComplete="email"
                    className="w-full h-12 px-4 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    autoComplete="current-password"
                    className="w-full h-12 px-4 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                  />
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-gray-500 hover:text-brand font-medium transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-cta w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={switchToCustomer}
                  className="text-sm text-gray-500 hover:text-brand font-medium transition"
                >
                  ← Back to Customer Login
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-black text-gray-900 mb-1">Welcome Back</h2>
              <p className="text-gray-500 mb-6">Sign in with your phone number</p>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    required
                    autoComplete="tel"
                    className="w-full h-12 px-4 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    autoComplete="current-password"
                    className="w-full h-12 px-4 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                  />
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-gray-500 hover:text-brand font-medium transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-cta w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-brand hover:underline">Sign up for free</Link>
              </p>

              {/* Discreet staff login link */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={switchToStaff}
                  className="text-xs text-gray-300 hover:text-gray-500 transition"
                >
                  Staff Login
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;