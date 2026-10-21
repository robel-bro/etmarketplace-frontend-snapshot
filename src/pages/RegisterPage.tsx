// src/pages/RegisterPage.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type UserType = 'buyer' | 'seller';
type Step = 'registration' | 'otp';

const ALLOWED_REGIONS = ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Bahir Dar', 'Hawassa'];

const RegisterPage = () => {
  const [userType, setUserType] = useState<UserType>('buyer');
  const [step, setStep] = useState<Step>('registration');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBulkSupplier, setIsBulkSupplier] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);   // ★ for strength checklist
  const navigate = useNavigate();
  const { setSession } = useAuth();

  // Legal toggles & modals
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [showFullPrivacy, setShowFullPrivacy] = useState(false);
  const [fullTermsContent, setFullTermsContent] = useState('');
  const [fullPrivacyContent, setFullPrivacyContent] = useState('');

  // Geolocation
  const [detectedRegion, setDetectedRegion] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState('');

  // Clear any old session on mount
  useEffect(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
  }, []);

  // Geolocation effect (unchanged)
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const address = data.address || {};
          const city = address.city || address.town || address.state || '';
          const region = city || address.state || '';
          if (region) {
            const matched = ALLOWED_REGIONS.some(r =>
              region.toLowerCase().includes(r.toLowerCase())
            );
            if (matched) {
              setDetectedRegion(region);
              setLocationError('');
            } else {
              setLocationError(
                `We don't currently serve your area (${region}). We only operate in: ${ALLOWED_REGIONS.join(
                  ', '
                )}`
              );
            }
          } else {
            setLocationError(
              'Could not determine your location. Please select your region manually.'
            );
          }
        } catch {
          setLocationError('Could not verify your location. Please select your region manually.');
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationError('Location access denied. Please select your region manually.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  // Legal content fetcher
  const fetchFullLegalContent = async (key: string) => {
    try {
      const res = await api.get(`/legal/${key}`);
      return res.data.body || '';
    } catch {
      return 'Could not load the document.';
    }
  };

  const handleShowFullTerms = async () => {
    if (!fullTermsContent) {
      const content = await fetchFullLegalContent('terms');
      setFullTermsContent(content);
    }
    setShowFullTerms(true);
  };

  const handleShowFullPrivacy = async () => {
    if (!fullPrivacyContent) {
      const content = await fetchFullLegalContent('privacy');
      setFullPrivacyContent(content);
    }
    setShowFullPrivacy(true);
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const isValidEthiopianPhone = (number: string): boolean => {
    const cleaned = number.replace(/\D/g, '');
    return /^[79]\d{8}$/.test(cleaned);
  };

  // ── Password strength checks ──────────────────────
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
  };

  const allPasswordChecksPass = Object.values(passwordChecks).every(Boolean);

  // Registration submission
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phone.replace(/\D/g, '');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!isValidEthiopianPhone(cleanedPhone)) {
      setError('Please enter a valid Ethiopian phone number (9 digits, starting with 9 or 7).');
      return;
    }
    if (!allPasswordChecksPass) {
      setError('Password does not meet the requirements. Please check the rules below.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the terms and policies to continue.');
      return;
    }
    if (locationError && !detectedRegion) {
      setError(locationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/sign_up', {
        user: {
          phone: `+251${cleanedPhone}`,
          full_name: fullName.trim(),
          password,
          password_confirmation: password,
          role: userType,
        },
        region: detectedRegion,
      });
      setStep('otp');
    } catch (err: any) {
      setError(
        err.response?.data?.errors?.join(', ') ||
          err.response?.data?.error ||
          'Registration failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  // OTP verification
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/verify_otp', {
        phone: `+251${phone.replace(/\D/g, '')}`,
        code,
      });
      const { user: userData, access_token, refresh_token } = response.data;
      setSession(userData, access_token, refresh_token);

      if (userType === 'seller') {
        navigate('/seller-setup', { state: { isBulkSupplier } });
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const resendOtp = async () => {
    try {
      await api.post('/send_otp', { phone: `+251${phone.replace(/\D/g, '')}` });
      alert('OTP resent');
    } catch (err) {
      console.log('Resend failed');
    }
  };

  // Terms & Privacy summaries (same as before)
  const termsSummary = (
    <div className="text-xs text-text-secondary leading-relaxed space-y-2 pr-1">
      <p>
        <strong>Platform Role:</strong> ET Marketplace connects buyers with independent sellers. We are not the seller of listed products. Sellers are independently responsible for quality, legality, and tax obligations.
      </p>
      <p>
        <strong>Seller Obligations:</strong> Sellers must comply with Ethiopian trade regulations, accept orders within 60 minutes, honour return policies, and pay applicable commissions.
      </p>
      <p>
        <strong>Buyer Obligations:</strong> Buyers must provide accurate delivery info, pay via approved methods, and inspect items upon delivery.
      </p>
      <p>
        <strong>Disputes:</strong> Disputes are mediated by ET Marketplace and, if unresolved, settled under Ethiopian law.
      </p>
      <p className="text-brand font-medium">
        <button type="button" onClick={handleShowFullTerms} className="hover:underline text-brand text-xs font-medium">
          Read full Terms of Service →
        </button>
      </p>
    </div>
  );

  const privacySummary = (
    <div className="text-xs text-text-secondary leading-relaxed space-y-2 pr-1">
      <p>
        <strong>Data We Collect:</strong> Phone number, full name, location data, delivery addresses.
      </p>
      <p>
        <strong>Usage:</strong> Order fulfilment, communication, platform safety, and legal compliance.
      </p>
      <p>
        <strong>Sharing:</strong> Delivery address and phone are shared with sellers and logistics partners solely for order fulfilment. No data is sold.
      </p>
      <p>
        <strong>Your Rights:</strong> Access, correct, or delete your data. Contact privacy@etmarketplace.com.
      </p>
      <p className="text-brand font-medium">
        <button type="button" onClick={handleShowFullPrivacy} className="hover:underline text-brand text-xs font-medium">
          Read full Privacy Policy →
        </button>
      </p>
    </div>
  );

  const FullLegalModal = ({ title, content, onClose }: { title: string; content: string; onClose: () => void }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover">
            <XMarkIcon className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-text-secondary leading-relaxed space-y-4">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        <div className="p-4 border-t border-border-light text-right">
          <button onClick={onClose} className="btn-cta px-4 py-2 text-sm">Close</button>
        </div>
      </motion.div>
    </div>
  );

  // Loading state while detecting location
  if (locationLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-brand border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-gray-500">Detecting your location…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left illustration */}
      <div className="relative w-full lg:w-1/2 h-48 lg:h-full flex items-center justify-center bg-gray-50">
        <img
          src="/images/welcome/register.svg"
          alt="Register"
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
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-14 py-8 lg:py-0 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {step === 'registration' ? (
            <>
              <h2 className="text-3xl font-black text-gray-900 mb-1">Create Account</h2>
              <p className="text-gray-500 mb-6">Join ET Marketplace today</p>

              {/* User type switch */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setUserType('buyer')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                    userType === 'buyer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Buyer
                </button>
                <button
                  onClick={() => setUserType('seller')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
                    userType === 'seller' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Seller
                </button>
              </div>

              {locationError && !detectedRegion && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <ShieldCheckIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{locationError}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <ShieldCheckIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmitRegistration} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full h-11 px-4 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="flex items-center border border-gray-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-brand focus-within:border-brand transition overflow-hidden">
                    <div className="flex items-center gap-1 px-3 border-r border-gray-300 bg-gray-50 rounded-l-xl">
                      <span className="text-lg">🇪🇹</span>
                      <span className="text-sm font-medium text-gray-700">+251</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="9XX XXX XXX"
                      value={phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setPhone(digits);
                      }}
                      maxLength={9}
                      required
                      className="flex-1 h-11 px-4 text-sm bg-transparent focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Ethio Telecom (9XX) or Safaricom (7XX) – 9 digits</p>
                </div>

                {/* ── Password with strength checklist ── */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    className="w-full h-11 px-4 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                  />
                  {passwordFocused && password.length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs space-y-1">
                      <p className={`${passwordChecks.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                        ✓ At least 8 characters
                      </p>
                      <p className={`${passwordChecks.hasUpper ? 'text-green-600' : 'text-gray-400'}`}>
                        ✓ One uppercase letter
                      </p>
                      <p className={`${passwordChecks.hasLower ? 'text-green-600' : 'text-gray-400'}`}>
                        ✓ One lowercase letter
                      </p>
                      <p className={`${passwordChecks.hasDigit ? 'text-green-600' : 'text-gray-400'}`}>
                        ✓ One number
                      </p>
                      <p className={`${passwordChecks.hasSpecial ? 'text-green-600' : 'text-gray-400'}`}>
                        ✓ One special character
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full h-11 px-4 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                  />
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>

                {userType === 'seller' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBulkSupplier}
                      onChange={(e) => setIsBulkSupplier(e.target.checked)}
                      className="h-4 w-4 text-brand border-gray-300 rounded focus:ring-brand"
                    />
                    <span className="text-sm text-gray-600">I am a bulk supplier (wholesale)</span>
                  </label>
                )}

                {/* Inline legal accordions */}
                <div className="space-y-2 pt-2">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowTerms(!showTerms)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                      <span>📜 {userType === 'seller' ? 'Seller Agreement & Terms' : 'Terms of Service'}</span>
                      {showTerms ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {showTerms && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-3 py-2 border-t border-gray-200 bg-white"
                        >
                          {termsSummary}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowPrivacy(!showPrivacy)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                      <span>🔒 Privacy Policy</span>
                      {showPrivacy ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {showPrivacy && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-3 py-2 border-t border-gray-200 bg-white"
                        >
                          {privacySummary}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 mt-0.5 text-brand border-gray-300 rounded focus:ring-brand"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    {userType === 'seller'
                      ? 'I have read and agree to the Seller Agreement, Terms of Service, and Privacy Policy. I understand that ET Marketplace is a platform intermediary and I am responsible for my own tax and legal obligations.'
                      : 'I have read and agree to the Terms of Service, Privacy Policy, and Buyer Protection policy.'}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || (!!locationError && !detectedRegion) || !agreedToTerms}
                  className="btn-cta w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Continue'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-brand hover:underline">Sign in</Link>
              </p>
            </>
          ) : (
            /* OTP Step */
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-1">Verify Phone</h2>
              <p className="text-gray-500 mb-6">
                Enter the 6‑digit code sent to +251 {phone.replace(/\D/g, '')}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <ShieldCheckIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2 justify-between mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand transition"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="btn-cta w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                onClick={resendOtp}
                className="mt-3 text-sm text-brand hover:underline block w-full text-center"
              >
                Resend Code
              </button>

              <button
                onClick={() => setStep('registration')}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 mt-2"
              >
                ← Back to registration
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Full legal modals */}
      {showFullTerms && (
        <FullLegalModal
          title="Terms of Service"
          content={fullTermsContent}
          onClose={() => setShowFullTerms(false)}
        />
      )}
      {showFullPrivacy && (
        <FullLegalModal
          title="Privacy Policy"
          content={fullPrivacyContent}
          onClose={() => setShowFullPrivacy(false)}
        />
      )}
    </div>
  );
};

export default RegisterPage;