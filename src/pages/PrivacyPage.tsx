import { motion } from 'framer-motion';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container-marketplace py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-product-title font-semibold text-text-primary mb-4">Privacy Policy</h1>

          <div className="card-product p-6 space-y-5 text-sm text-text-secondary leading-relaxed">
            <p className="text-xs text-text-muted">Last updated: March 2026</p>

            <p>
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal
              information.
            </p>

            <h2 className="text-lg font-semibold text-text-primary mt-4">Information We Collect</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Account details: name, email, phone, national ID (for verification).</li>
              <li>Transaction data: orders, payment methods, shipping address.</li>
              <li>Technical data: IP address, browser type, cookies.</li>
            </ul>

            <h2 className="text-lg font-semibold text-text-primary mt-4">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>To process orders and payments.</li>
              <li>To verify seller identities and prevent fraud.</li>
              <li>To improve our platform and personalize your experience.</li>
              <li>To send you updates (with your consent).</li>
            </ul>

            <h2 className="text-lg font-semibold text-text-primary mt-4">Data Security</h2>
            <p>
              We use industry‑standard encryption (SSL) and store sensitive data securely. Your national ID is used
              only for verification and never shared.
            </p>

            <h2 className="text-lg font-semibold text-text-primary mt-4">Your Rights</h2>
            <p>
              You may access, correct, or delete your personal data by contacting us. You can unsubscribe from
              marketing emails anytime.
            </p>

            <p className="mt-6">
              For privacy concerns, email{' '}
              <a
                href="mailto:privacy@etmarketplace.com"
                className="text-brand hover:text-brand-hover underline font-medium"
              >
                privacy@etmarketplace.com
              </a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPage;