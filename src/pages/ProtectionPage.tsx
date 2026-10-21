import { Link } from 'react-router-dom';
import { ShieldCheckIcon, LockClosedIcon, CurrencyDollarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ProtectionPage = () => (
  <div className="min-h-screen bg-[#F5F5F5]">
    <div className="container-marketplace py-8 max-w-3xl mx-auto">
      <h1 className="text-product-title font-semibold text-text-primary mb-2">Buyer Protection</h1>
      <p className="text-body-sm text-text-secondary mb-6">
        Every purchase on ET Marketplace is protected from click to delivery. If your order doesn’t arrive or isn’t as described, we’ll refund you.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {[
          { icon: ShieldCheckIcon, title: 'Payment Security', desc: 'Your funds are held in escrow until you confirm satisfaction.' },
          { icon: LockClosedIcon, title: 'Data Privacy', desc: 'Your personal and financial data is encrypted and never shared.' },
          { icon: CurrencyDollarIcon, title: 'Money‑Back Guarantee', desc: 'Full refund if your order is not delivered or is significantly different from the description.' },
          { icon: CheckCircleIcon, title: 'Quality Assurance', desc: 'We verify sellers and monitor product listings for authenticity.' },
        ].map((item, idx) => (
          <div key={idx} className="card-product p-4">
            <div className="w-10 h-10 bg-brand-light rounded-[var(--radius-sm)] flex items-center justify-center mb-3">
              <item.icon className="w-5 h-5 text-brand" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">{item.title}</h3>
            <p className="text-sm text-text-secondary">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link to="/order-protection" className="btn-cta px-6 py-3 text-sm font-semibold">
          Learn More About Order Protection
        </Link>
      </div>
    </div>
  </div>
);

export default ProtectionPage;