// src/components/checkout/PaymentStep.tsx
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import api from '../../lib/axios';

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
  selectedMethod: string | null;
  setSelectedMethod: (method: string) => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
}

const PaymentStep = ({
  onNext,
  onBack,
  selectedMethod,
  setSelectedMethod,
  couponCode,
  setCouponCode,
}: PaymentStepProps) => {
  const {
    data: gateways,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    'activePaymentGateways',
    () => api.get('/checkout/payment_options').then((res) => res.data),
    { staleTime: 60 * 1000 }
  );

  const methods = gateways || [];

  // Auto‑select first method (useEffect to avoid setState during render)
  useEffect(() => {
    if (methods.length > 0 && !selectedMethod) {
      setSelectedMethod(methods[0].provider);
    }
  }, [methods, selectedMethod, setSelectedMethod]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Select Payment Method</h2>

      {isLoading ? (
        <div className="text-center py-4 text-[var(--text-muted)] text-sm">
          Loading payment methods…
        </div>
      ) : isError ? (
        <div className="text-center py-4 text-red-500 text-sm space-y-2">
          <p>Failed to load payment methods.</p>
          <button
            onClick={() => refetch()}
            className="text-sm underline hover:text-red-700"
          >
            Retry
          </button>
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-4 text-red-500 text-sm">
          No payment methods available.
        </div>
      ) : (
        <div className="space-y-2">
          {methods.map((method: any) => (
            <label
              key={method.provider}
              className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${
                selectedMethod === method.provider
                  ? 'border-[var(--brand)] bg-[var(--brand-light)]'
                  : 'border-[var(--border-light)] hover:border-[var(--brand)]'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={selectedMethod === method.provider}
                onChange={() => setSelectedMethod(method.provider)}
                className="mt-1"
              />
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {method.provider === 'cash_on_delivery' ? '💵' : '💳'}
                </span>
                <span className="font-medium text-sm text-[var(--text-primary)]">
                  {method.name}
                </span>
                {method.supports_refunds && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Refunds
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Coupon code field */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Coupon Code (optional)
        </label>
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="w-full border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          placeholder="Enter coupon code"
        />
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="btn-secondary px-6 py-2 text-sm"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedMethod}
          className="btn-cta px-6 py-2 text-sm disabled:opacity-50"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
};

export default PaymentStep;