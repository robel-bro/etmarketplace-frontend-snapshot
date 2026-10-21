import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

const inputClass =
  'w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container-marketplace py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto card-product p-6 md:p-8"
        >
          <h1 className="text-product-title font-semibold text-text-primary mb-2">Contact Us</h1>
          <p className="text-body-sm text-text-secondary mb-6">
            We'd love to hear from you. Whether you have a question about our services, need help with an order,
            or just want to share feedback – our team is here for you.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-brand-light flex items-center justify-center flex-shrink-0">
                  <EnvelopeIcon className="w-5 h-5 text-brand" />
                </div>
                <span className="text-sm text-text-secondary">support@etmarketplace.com</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-brand-light flex items-center justify-center flex-shrink-0">
                  <PhoneIcon className="w-5 h-5 text-brand" />
                </div>
                <span className="text-sm text-text-secondary">+251 11 123 4567</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-brand-light flex items-center justify-center flex-shrink-0">
                  <MapPinIcon className="w-5 h-5 text-brand" />
                </div>
                <span className="text-sm text-text-secondary">Bole, Addis Ababa, Ethiopia</span>
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Business Hours</h3>
                <div className="space-y-1 text-xs text-text-muted">
                  <p>Monday – Friday: 8:00 AM – 6:00 PM</p>
                  <p>Saturday: 9:00 AM – 2:00 PM</p>
                  <p>Sunday: Closed (but our website is always open!)</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Your Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                    required
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass}
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Message</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
                    required
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-cta w-full py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>

                <AnimatePresence>
                  {status === 'success' && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-green-600 text-center font-medium"
                    >
                      Message sent! We'll get back to you soon.
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;