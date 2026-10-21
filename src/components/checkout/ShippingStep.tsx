import { useState, useEffect } from 'react';
import api from '../../lib/axios';

interface ShippingOption {
  partner_id: number;
  delivery_label: string;          // Standard, Express, Next Day
  estimated_days: number;
  estimated_delivery: string;      // ISO datetime
  estimated_delivery_label: string; // "Today by 05:30 PM"
  charge: number;
  delivery_speed: number;
  id: string;
}

interface DeliveryStepProps {
  onNext: () => void;
  onBack: () => void;
  selectedAddress: number | null;
  selectedRate: ShippingOption | null;
  setSelectedRate: (rate: ShippingOption) => void;
}

const DeliveryStep = ({ onNext, onBack, selectedAddress, selectedRate, setSelectedRate }: DeliveryStepProps) => {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedAddress) {
      setError('Please select a delivery address first.');
      return;
    }

    const fetchOptions = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.post('/checkout/shipping_options', { address_id: selectedAddress });
        const mapped: ShippingOption[] = (res.data || []).map((opt: any) => ({
          partner_id: opt.partner_id,
          delivery_label: opt.delivery_label,
          estimated_days: opt.estimated_days,
          estimated_delivery: opt.estimated_delivery,
          estimated_delivery_label: opt.estimated_delivery_label,
          charge: opt.charge,
          delivery_speed: opt.delivery_speed,
          id: opt.partner_id.toString(),
        }));
        setOptions(mapped);
      } catch (err: any) {
        console.error('Shipping options error:', err);
        setError('Could not load shipping options. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, [selectedAddress]);

  const handleNext = () => {
    if (!selectedRate) {
      alert('Please select a shipping method.');
      return;
    }
    onNext();
  };

  if (loading) return <div className="text-center py-8 text-sm text-text-muted">Calculating delivery options…</div>;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={() => setError('')} className="text-brand text-xs mt-2 hover:underline">Try again</button>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-muted">No delivery options available for this address.</p>
        <p className="text-xs text-text-muted mt-1">Please try a different address or contact support.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">Delivery Method</h2>
      <div className="space-y-2">
        {options.map(opt => {
          const isSelected = selectedRate?.id === opt.id;
          const deliveryTimeText = opt.estimated_delivery_label || `${opt.estimated_days} day(s)`;

          return (
            <label
              key={opt.id}
              className={`flex items-center p-3 border rounded-[var(--radius-sm)] cursor-pointer transition ${
                isSelected ? 'border-brand bg-brand-light' : 'border-border-light hover:border-brand'
              }`}
              onClick={() => setSelectedRate(opt)}
            >
              <input type="radio" name="shipping" checked={isSelected} onChange={() => setSelectedRate(opt)} className="mr-3 accent-brand" />
              <div className="flex-1">
                <p className="font-medium text-sm text-text-primary">{opt.delivery_label}</p>
                <p className="text-xs text-text-secondary">{deliveryTimeText}</p>
              </div>
              <p className="text-base font-bold text-text-primary">ETB {opt.charge}</p>
            </label>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-secondary px-4 py-2 text-sm">Back</button>
        <button onClick={handleNext} disabled={!selectedRate} className="btn-cta px-4 py-2 text-sm disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

export default DeliveryStep;