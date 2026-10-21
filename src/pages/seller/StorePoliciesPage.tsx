import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const StorePoliciesPage = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState({
    returnPolicy: 'We accept returns within 14 days of delivery.',
    shippingPolicy: 'Orders are shipped within 2 business days.',
    paymentPolicy: 'We accept Telebirr, Chapa, and cash on delivery.',
  });
  const [saveStatus, setSaveStatus] = useState('idle');

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Store Policies</h1>

      <div className="card p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Return Policy
            </label>
            <textarea
              rows={4}
              value={policies.returnPolicy}
              onChange={(e) =>
                setPolicies({ ...policies, returnPolicy: e.target.value })
              }
              className="input-premium text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Shipping Policy
            </label>
            <textarea
              rows={4}
              value={policies.shippingPolicy}
              onChange={(e) =>
                setPolicies({ ...policies, shippingPolicy: e.target.value })
              }
              className="input-premium text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Payment Policy
            </label>
            <textarea
              rows={4}
              value={policies.paymentPolicy}
              onChange={(e) =>
                setPolicies({ ...policies, paymentPolicy: e.target.value })
              }
              className="input-premium text-sm"
            />
          </div>

          <div className="flex justify-end items-center gap-3 pt-2">
            {saveStatus === 'success' && (
              <span className="text-xs text-green-600 font-medium">Saved!</span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-xs text-gray-500">Saving…</span>
            )}
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-xs font-semibold"
            >
              Save Policies
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StorePoliciesPage;