import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container-marketplace py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto card-product p-6 md:p-8"
        >
          <h1 className="text-product-title font-semibold text-text-primary mb-2">
            Terms of Service
          </h1>
          <p className="text-xs text-text-muted mb-6">Last updated: March 2026</p>

          <div className="space-y-5 text-sm text-text-secondary leading-relaxed">
            <p>
              Welcome to ET Marketplace! By accessing or using our platform, you agree to be bound
              by these Terms of Service. Please read them carefully before using our services.
            </p>

            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">1. Accounts</h2>
              <p>
                To access certain features, you must create an account. You are responsible for
                maintaining the confidentiality of your login credentials and for all activities
                that occur under your account. You must be at least 18 years old to register as a
                seller.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">2. Transactions</h2>
              <p>
                ET Marketplace acts as a venue for buyers and sellers to transact. We are not a
                party to the sale contract but provide a secure environment for transactions. All
                payments are processed through trusted gateways (Telebirr, Chapa, etc.) and are
                protected by our Trade Assurance programme.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">3. Seller Obligations</h2>
              <p>
                Sellers must provide accurate product descriptions, maintain current stock levels,
                and ship orders within the stated processing time. Failure to meet these obligations
                may result in account suspension or termination.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">4. Prohibited Items</h2>
              <p>
                You may not list or sell items that violate Ethiopian law or our policies, including
                but not limited to counterfeit goods, weapons, illegal substances, stolen property,
                or any item that infringes the intellectual property rights of others.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">5. Buyer Protection</h2>
              <p>
                All purchases on ET Marketplace are covered by our Buyer Protection programme. If
                your order does not arrive or is significantly different from the description, you
                may be eligible for a full refund. See our{' '}
                <Link to="/protection" className="text-brand hover:text-brand-hover underline font-medium">
                  Buyer Protection
                </Link>{' '}
                page for details.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">6. Privacy</h2>
              <p>
                Your privacy is important to us. Our{' '}
                <Link to="/privacy" className="text-brand hover:text-brand-hover underline font-medium">
                  Privacy Policy
                </Link>{' '}
                explains how we collect, use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">7. Intellectual Property</h2>
              <p>
                All content on ET Marketplace, including the logo, design, and software, is the
                property of ET Marketplace or its licensors. You may not copy, modify, or distribute
                any part of the platform without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, ET Marketplace shall not be liable for any
                indirect, incidental, or consequential damages arising from your use of the platform
                or any transactions conducted through it.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">9. Changes to Terms</h2>
              <p>
                We may update these Terms of Service from time to time. We will notify you of any
                material changes by posting the new terms on this page. Your continued use of the
                platform after such changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">10. Contact</h2>
              <p>
                For questions about these Terms, contact us at{' '}
                <a href="mailto:legal@etmarketplace.com" className="text-brand hover:text-brand-hover underline font-medium">
                  legal@etmarketplace.com
                </a>.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;