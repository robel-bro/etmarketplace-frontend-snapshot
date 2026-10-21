import { TruckIcon, ClockIcon, MapPinIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const ShippingPage = () => (
  <div className="min-h-screen bg-[#F5F5F5]">
    <div className="container-marketplace py-8 max-w-3xl mx-auto">
      <h1 className="text-product-title font-semibold text-text-primary mb-2">Shipping & Delivery</h1>
      <p className="text-body-sm text-text-secondary mb-6">
        We partner with Ethiopia's leading courier services to deliver your orders quickly and safely.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {[
          { icon: TruckIcon, title: 'Nationwide Delivery', desc: 'We deliver to every region of Ethiopia, including Addis Ababa, Bahir Dar, Jimma, Mekelle, and more.' },
          { icon: ClockIcon, title: 'Fast Processing', desc: 'Orders are processed within 24 hours. Most items arrive within 2‑5 business days.' },
          { icon: MapPinIcon, title: 'Real‑time Tracking', desc: 'Track your package from our warehouse to your doorstep with live updates.' },
          { icon: ShieldCheckIcon, title: 'Secure Packaging', desc: 'All items are carefully packed to prevent damage during transit.' },
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

      <h2 className="text-lg font-semibold text-text-primary mb-3">Delivery Fees</h2>
      <div className="card-product p-4 mb-6">
        <ul className="space-y-2 text-sm text-text-secondary">
          <li>• Free delivery for orders over <span className="font-semibold text-text-primary">ETB 1,000</span>.</li>
          <li>• Orders below ETB 1,000: flat fee of <span className="font-semibold text-text-primary">ETB 150</span>.</li>
          <li>• Express delivery available in Addis Ababa for <span className="font-semibold text-text-primary">ETB 300</span>.</li>
        </ul>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-3">Returns & Refunds</h2>
      <p className="text-body-sm text-text-secondary mb-4">
        If you're not satisfied with your order, you may return it within 14 days. See our full{' '}
        <Link to="/returns" className="text-brand hover:text-brand-hover underline">
          Return Policy
        </Link>.
      </p>
    </div>
  </div>
);

export default ShippingPage;