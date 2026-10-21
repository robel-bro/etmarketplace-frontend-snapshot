import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, ClockIcon, ArrowUturnLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ReturnsPage = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container-marketplace py-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-product-title font-semibold text-text-primary mb-2">Returns & Refunds</h1>
          <p className="text-body-sm text-text-secondary mb-6">
            We want you to be completely satisfied with your purchase. If something isn't right, our returns policy has you covered.
          </p>

          {/* Key points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {[
              { icon: ClockIcon, title: '14‑Day Return Window', desc: 'Initiate a return within 14 days of delivery.' },
              { icon: ShieldCheckIcon, title: 'Free Returns', desc: 'Eligible items can be returned for free.' },
              { icon: ArrowUturnLeftIcon, title: 'Easy Process', desc: 'Request a return from your Order History with one click.' },
              { icon: ExclamationTriangleIcon, title: 'Some Exclusions', desc: 'Perishable, personalised, or digital items are non‑returnable.' },
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

          {/* How to return */}
          <div className="card-product p-5 mb-4">
            <h2 className="text-lg font-semibold text-text-primary mb-3">How to Return an Item</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
              <li>Log in to your account and go to <span className="font-medium text-text-primary">Order History</span>.</li>
              <li>Find the order and click <span className="font-medium text-text-primary">Return</span>.</li>
              <li>Select the reason and submit your request.</li>
              <li>We'll approve within 24 hours and email you a return label.</li>
              <li>Ship the item back (free for eligible returns).</li>
            </ol>
          </div>

          {/* Refund timeline */}
          <div className="card-product p-5 mb-4">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Refund Timeline</h2>
            <p className="text-sm text-text-secondary">
              Once we receive the returned item, your refund will be processed within{' '}
              <span className="font-semibold text-text-primary">5 business days</span>. Refunds go back to your original payment method.
            </p>
          </div>

          {/* Non-returnable items */}
          <div className="card-product p-5 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Non‑Returnable Items</h2>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
              <li>Perishable goods (food, flowers)</li>
              <li>Personalised or custom‑made items</li>
              <li>Digital products (e‑books, software)</li>
            </ul>
          </div>

          {/* Contact link */}
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              For any questions, contact our support team at{' '}
              <a href="mailto:support@etmarketplace.com" className="text-brand font-medium hover:underline">
                support@etmarketplace.com
              </a>.
            </p>
            <Link to="/help" className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 text-sm mt-4">
              Visit Help Center
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReturnsPage;