// 📁 VerifyDeliveryPage.tsx
import { useState } from 'react';
import api from '../lib/axios';

type Lang = 'en' | 'am';
type Step = 'pickup' | 'delivery' | 'done';

const translations: Record<Lang, Record<string, string>> = {
  en: {
    heading: 'ET Marketplace',
    subheading: 'Delivery Verification',
    greeting: 'Hi, Rider! 👋',
    pickupInstruction: 'Enter the Order ID and the seller’s pickup PIN.',
    deliveryInstruction: 'Enter the Order ID and the buyer’s 4‑digit PIN.',
    orderLabel: 'Order ID',
    orderPlaceholder: 'e.g. 42',
    pickupPinLabel: 'Seller Pickup PIN',
    deliveryPinLabel: 'Buyer Delivery PIN',
    pinPlaceholder: '••••',
    confirmPickupBtn: 'Confirm Pickup',
    confirmDeliveryBtn: 'Yes, Delivered!',
    verifyingBtn: 'Checking…',
    clearBtn: 'Start Over',
    successTitle: 'All done! ✅',
    successMsg: 'Delivery verified successfully.',
    errorGeneric: 'Oops! That didn’t work. Double‑check and try again.',
    step1: 'Pickup',
    step2: 'Delivery',
    step3: 'Complete',
    footer:
      'This page is for delivery riders only. At pickup use the seller code; at delivery use the buyer code.',
  },
  am: {
    heading: 'ኢት ማርኬት',
    subheading: 'የማድረስ ማረጋገጫ',
    greeting: 'ሰላም፣ አሽከርካሪ! 👋',
    pickupInstruction: 'የትዕዛዝ ቁጥሩን እና የሻጩን የመልቀሚያ ፒን ያስገቡ።',
    deliveryInstruction: 'የትዕዛዝ ቁጥሩን እና የገዢውን 4 አሃዝ ፒን ያስገቡ።',
    orderLabel: 'የትዕዛዝ ቁጥር',
    orderPlaceholder: 'ለምሳሌ 42',
    pickupPinLabel: 'የሻጭ የመልቀሚያ ፒን',
    deliveryPinLabel: 'የገዢ የመድረሻ ፒን',
    pinPlaceholder: '••••',
    confirmPickupBtn: 'መልቀም አረጋግጥ',
    confirmDeliveryBtn: 'አዎ፣ ማድረስ ተፈጽሟል!',
    verifyingBtn: 'በመመርመር ላይ…',
    clearBtn: 'እንደገና ጀምር',
    successTitle: 'ሁሉም ተጠናቋል! ✅',
    successMsg: 'ማድረስ በተሳካ ሁኔታ ተረጋግጧል።',
    errorGeneric: 'ይቅርታ! ማረጋገጡ አልተሳካም። ቁጥሮቹን ደግመው ያረጋግጡ።',
    step1: 'መልቀም',
    step2: 'መድረስ',
    step3: 'ተጠናቋል',
    footer:
      'ይህ ገጽ ለማድረስ አሽከርካሪዎች ብቻ ነው። በመልቀሚያ ጊዜ የሻጭ ኮድ፣ በማድረስ ጊዜ የገዢ ኮድ ይጠቀሙ።',
  },
};

const VerifyDeliveryPage = () => {
  const [step, setStep] = useState<Step>('pickup');
  const [orderId, setOrderId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [lang, setLang] = useState<Lang>('en');

  const t = translations[lang];

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !pin.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const endpoint = '/api/v1/delivery_verifications/verify_pin';
      const res = await api.post(endpoint, {
        order_id: orderId,
        pin,
        step: step === 'pickup' ? 'pickup' : 'delivery',
      });
      setResult({ success: true, message: res.data.message || t.successMsg });
      setOrderId('');
      setPin('');

      if (step === 'pickup') {
        setStep('delivery');
      } else {
        setStep('done');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || t.errorGeneric;
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep('pickup');
    setOrderId('');
    setPin('');
    setResult(null);
  };

  // Dynamic labels based on current step
  const instructionText = step === 'pickup' ? t.pickupInstruction : step === 'delivery' ? t.deliveryInstruction : '';
  const pinLabel = step === 'pickup' ? t.pickupPinLabel : t.deliveryPinLabel;
  const confirmBtnText = step === 'pickup' ? t.confirmPickupBtn : step === 'delivery' ? t.confirmDeliveryBtn : t.clearBtn;

  const progressSteps = [
    { id: 'pickup', label: t.step1, completed: step === 'delivery' || step === 'done' },
    { id: 'delivery', label: t.step2, completed: step === 'done' },
    { id: 'done', label: t.step3, completed: step === 'done' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          {progressSteps.map((p, idx) => (
            <div key={p.id} className="flex items-center">
              <div className={`flex flex-col items-center ${idx === 1 ? 'mx-2' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  p.completed ? 'bg-green-500 text-white' : step === p.id ? 'bg-[#FF7A00] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {p.completed ? '✓' : idx + 1}
                </div>
                <span className="text-[10px] mt-1 font-semibold text-gray-500">{p.label}</span>
              </div>
              {idx < progressSteps.length - 1 && (
                <div className={`w-10 h-0.5 ${p.completed ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Soft truck illustration (hidden when done) */}
        {step !== 'done' && (
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-white shadow-lg shadow-orange-100 flex items-center justify-center mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-[#FF7A00]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800">{t.heading}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t.subheading}</p>
          </div>
        )}

        {/* Done screen */}
        {step === 'done' ? (
          <div className="bg-white border border-green-100 rounded-2xl px-6 py-10 shadow-lg shadow-green-100/60 animate-fade-in text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t.successTitle}</h2>
            <p className="text-sm text-gray-600">{t.successMsg}</p>
            <button
              onClick={resetAll}
              className="mt-6 text-sm font-semibold text-[#FF7A00] hover:underline"
            >
              {t.clearBtn}
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-6 shadow-lg shadow-gray-100/60 relative">
            <button
              onClick={() => setLang(lang === 'en' ? 'am' : 'en')}
              className="absolute top-3 right-3 text-xs font-semibold text-gray-400 hover:text-[#FF7A00] transition-colors"
            >
              {lang === 'en' ? 'አማ' : 'EN'}
            </button>

            <p className="text-base font-semibold text-gray-700 mb-0.5">{t.greeting}</p>
            <p className="text-sm text-gray-500 mb-5">{instructionText}</p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t.orderLabel}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t.orderPlaceholder}
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {pinLabel}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder={t.pinPlaceholder}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent focus:bg-white tracking-[0.5em] text-center transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#FF7A00] to-[#D84315] hover:from-[#E86A12] hover:to-[#C0392B] text-white py-3 rounded-xl font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-orange-200"
                >
                  {loading ? t.verifyingBtn : confirmBtnText}
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-5 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  {t.clearBtn}
                </button>
              </div>
            </form>

            {result && !result.success && (
              <div className="mt-5 text-center font-semibold rounded-xl px-4 py-3 bg-red-50 text-red-600 border border-red-100">
                {result.message}
              </div>
            )}
          </div>
        )}

        {step !== 'done' && (
          <p className="text-sm text-gray-400 mt-6 text-center max-w-xs mx-auto leading-relaxed">
            {t.footer}
          </p>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default VerifyDeliveryPage;