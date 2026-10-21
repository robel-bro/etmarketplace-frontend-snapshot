import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, TruckIcon, ClockIcon, MapPinIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const TrackOrderPage = () => {
  const [orderId, setOrderId] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      navigate(`/order-tracking/${orderId.trim()}`);
    }
  };

  return (
    <div className="bg-[#F5F5F5]">
      <div className="container-marketplace py-8 max-w-2xl mx-auto">
        <h1 className="text-product-title font-semibold text-text-primary mb-1">Track Your Order</h1>
        <p className="text-body-sm text-text-secondary mb-5">
          Enter your order ID to see the current status and location of your delivery.
        </p>

        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. ORD-12345"
            className="flex-1 h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
          <button type="submit" className="btn-cta px-5 py-2.5 text-sm font-semibold flex items-center gap-2">
            <MagnifyingGlassIcon className="w-4 h-4" />
            Track
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: ClockIcon, title: 'Real‑time Updates', desc: 'Know exactly where your package is at every step.' },
            { icon: MapPinIcon, title: 'Precise Location', desc: 'See the current sorting centre or delivery hub.' },
            { icon: ShieldCheckIcon, title: 'Secure & Reliable', desc: 'Protected by our Trade Assurance programme.' },
          ].map((item, idx) => (
            <div key={idx} className="card-product p-4 text-center">
              <div className="w-10 h-10 bg-brand-light rounded-[var(--radius-sm)] flex items-center justify-center mx-auto mb-2">
                <item.icon className="w-5 h-5 text-brand" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">{item.title}</h3>
              <p className="text-xs text-text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link to="/help" className="text-sm font-medium text-brand hover:text-brand-hover underline">
            Need help? Visit our Help Center
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;