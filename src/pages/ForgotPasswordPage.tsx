// src/pages/ForgotPasswordPage.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/axios';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // ── Password strength rules ──────────────────────────────────
  const passwordRules = useMemo(() => [
    { label: 'At least 8 characters', passed: newPassword.length >= 8 },
    { label: 'One uppercase letter',  passed: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter',  passed: /[a-z]/.test(newPassword) },
    { label: 'One number',            passed: /\d/.test(newPassword) },
    { label: 'One special character', passed: /[^a-zA-Z0-9]/.test(newPassword) },
  ], [newPassword]);

  const allRulesPassed = passwordRules.every(r => r.passed);
  const showRules = newPassword.length > 0;

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/login');
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phone.trim();
    if (!cleanedPhone.startsWith('+251') || cleanedPhone.length !== 13) {
      setError('Enter a valid Ethiopian phone number (+251 followed by 9 digits).');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/passwords/send_reset_code', { phone: cleanedPhone });
      setMessage('A reset code has been sent to your phone number.');
      setStep('code');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Enter the 6‑digit reset code.');
      return;
    }
    if (!allRulesPassed) {
      setError('Please meet all password requirements.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/passwords/reset', {
        phone: phone.trim(),
        code: code.trim(),
        password: newPassword,
      });
      setMessage('Password has been reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Illustration */}
      <div className="relative w-full lg:w-1/2 h-48 lg:h-full flex items-center justify-center bg-gray-50">
        <img
          src="/images/welcome/login.svg"
          alt="Secure"
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

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-14 py-8 lg:py-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <h2 className="text-3xl font-black text-gray-900 mb-1">Reset Password</h2>
          <p className="text-gray-500 mb-8">
            {step === 'phone'
              ? 'Enter your phone number to receive a reset code.'
              : 'Enter the code we sent you and your new password.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg">
              {message}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+251 911 223 344"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(''); }}
                  required
                  className="w-full h-12 px-4 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-cta w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6‑digit code"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                  required
                  className="w-full h-12 px-4 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition tracking-[0.5em] text-center text-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  required
                  className="w-full h-12 px-4 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                />
                {/* ── Password strength rules ── */}
                {showRules && (
                  <div className="mt-2 space-y-1">
                    {passwordRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${rule.passed ? 'bg-green-500' : 'bg-gray-300'}`}>
                          {rule.passed ? '✓' : '·'}
                        </span>
                        <span className={rule.passed ? 'text-green-700' : 'text-gray-500'}>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-cta w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
              >
                ← Back to phone entry
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;