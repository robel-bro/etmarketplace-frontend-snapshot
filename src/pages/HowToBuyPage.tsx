import { Link } from 'react-router-dom';
import { ShoppingCartIcon, CreditCardIcon, TruckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const steps = [
  {
    icon: ShoppingCartIcon,
    title: '1. Find Your Product',
    desc: 'Browse our catalogue or use the search bar to discover millions of products from trusted sellers across Ethiopia.',
  },
  {
    icon: CreditCardIcon,
    title: '2. Place Your Order',
    desc: 'Select your preferred variation, choose a payment method (Telebirr, bank transfer, or cash on delivery), and confirm your order.',
  },
  {
    icon: TruckIcon,
    title: '3. We Deliver',
    desc: 'Your order is processed and shipped within 24 hours. Track your package in real‑time from your account dashboard.',
  },
  {
    icon: CheckCircleIcon,
    title: '4. Enjoy Your Purchase',
    desc: 'Receive your items and confirm satisfaction. Our buyer protection ensures a full refund if anything goes wrong.',
  },
];

const HowToBuyPage = () => (
  <div className="min-h-screen bg-[#F5F5F5]">
    <div className="container-marketplace py-8 max-w-3xl mx-auto">
      <h1 className="text-product-title font-semibold text-text-primary mb-2">How to Buy</h1>
      <p className="text-body-sm text-text-secondary mb-6">
        Shopping on ET Marketplace is simple and secure. Follow these four easy steps.
      </p>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="card-product p-4 flex gap-4">
            <div className="w-10 h-10 bg-brand-light rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0">
              <step.icon className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary mb-1">{step.title}</h3>
              <p className="text-sm text-text-secondary">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link to="/all-products" className="btn-cta px-6 py-3 text-sm font-semibold">
          Start Shopping
        </Link>
      </div>
    </div>
  </div>
);

export default HowToBuyPage;