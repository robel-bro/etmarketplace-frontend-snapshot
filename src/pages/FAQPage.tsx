import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    q: 'How do I create an account?',
    a: 'Click "Sign Up" on the top right. You can register with your email or phone number. After verification, you can start shopping.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Telebirr, Chapa, bank transfers, and cash on delivery (in select cities). All payments are secure.',
  },
  {
    q: 'How can I track my order?',
    a: 'Log in to your account, go to "Order History", and click "Track" on the order. You’ll receive SMS updates.',
  },
  {
    q: 'What is your return policy?',
    a: 'You can return items within 14 days of delivery. Items must be unused. See our Returns page for details.',
  },
  {
    q: 'How do I become a seller?',
    a: 'Register as a seller from your dashboard, upload your business license and national ID, and we’ll verify within 24 hours.',
  },
  {
    q: 'Is my personal information safe?',
    a: 'Absolutely. We use SSL encryption and never share your data. Read our Privacy Policy for more.',
  },
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container-marketplace py-8 max-w-3xl mx-auto">
        <h1 className="text-product-title font-semibold text-text-primary mb-6">
          Frequently Asked Questions
        </h1>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="card-product overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-surface-hover transition-colors"
              >
                <span className={`text-sm font-semibold ${openIndex === idx ? 'text-brand' : 'text-text-primary'}`}>
                  {faq.q}
                </span>
                <ChevronDownIcon
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === idx ? 'rotate-180 text-brand' : 'text-text-muted'
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-text-secondary leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;