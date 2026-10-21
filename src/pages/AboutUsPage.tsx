import { motion } from 'framer-motion';

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container-marketplace py-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-product p-6 md:p-8"
        >
          <h1 className="text-product-title font-semibold text-text-primary mb-4">
            About ET Marketplace
          </h1>

          <div className="space-y-4 text-body-sm text-text-secondary leading-relaxed">
            <p>
              Welcome to{' '}
              <span className="font-semibold text-brand">
                ET Marketplace
              </span>{' '}
              – Ethiopia's premier multi‑vendor e‑commerce platform. We were born from a
              simple idea: to connect Ethiopian buyers with trusted sellers, while
              celebrating our rich culture and heritage.
            </p>

            <p>
              Our journey began in Addis Ababa, inspired by the traditional{' '}
              <em>‘gabaya’</em> (market) where communities gather to trade goods and
              stories. We've taken that spirit online, creating a digital space where
              quality products meet genuine trust.
            </p>

            <h2 className="text-lg font-semibold text-text-primary mt-6">
              Our Mission
            </h2>
            <p>
              To empower Ethiopian commerce with technology that builds trust,
              simplifies selling, and delights buyers. We believe every transaction is a
              covenant, and we protect it with the same honour as a coffee ceremony.
            </p>

            <h2 className="text-lg font-semibold text-text-primary mt-6">
              Why Choose Us?
            </h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>✅ Verified sellers with Ethiopian business licenses</li>
              <li>✅ Secure payments via Telebirr, Chapa, and bank transfer</li>
              <li>✅ Nationwide delivery with real‑time tracking</li>
              <li>✅ Customer support in Amharic and English</li>
              <li>✅ A marketplace rooted in Ethiopian values</li>
            </ul>

            <p className="mt-6 text-center text-base italic text-text-muted">
              "እምነት ከሌለ ንግድ የለም" – Without trust, there is no trade.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUsPage;