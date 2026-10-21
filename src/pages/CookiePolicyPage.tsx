import { Link } from 'react-router-dom';

const CookiePolicyPage = () => (
  <div className="min-h-screen bg-[#F5F5F5]">
    <div className="container-marketplace py-8 max-w-3xl mx-auto">
      <h1 className="text-product-title font-semibold text-text-primary mb-2">Cookie Policy</h1>
      <p className="text-body-sm text-text-muted mb-6">Last updated: {new Date().getFullYear()}</p>

      <div className="card-product p-5 space-y-4 text-sm text-text-secondary leading-relaxed">
        <p>
          ET Marketplace uses cookies and similar technologies to enhance your browsing experience, analyse site traffic,
          and personalise content. By continuing to use our site, you consent to our use of cookies.
        </p>

        <h3 className="text-lg font-semibold text-text-primary mt-4">What Are Cookies?</h3>
        <p>
          Cookies are small text files stored on your device when you visit a website. They help the site remember your
          preferences, keep you signed in, and understand how you interact with the platform.
        </p>

        <h3 className="text-lg font-semibold text-text-primary mt-4">How We Use Cookies</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><span className="font-semibold text-text-primary">Essential Cookies:</span> Required for core functionality like login, cart, and checkout.</li>
          <li><span className="font-semibold text-text-primary">Analytics Cookies:</span> Help us understand how users navigate the site so we can improve it.</li>
          <li><span className="font-semibold text-text-primary">Preference Cookies:</span> Remember your language, region, and display settings.</li>
          <li><span className="font-semibold text-text-primary">Marketing Cookies:</span> Used to show relevant promotions and measure ad performance.</li>
        </ul>

        <h3 className="text-lg font-semibold text-text-primary mt-4">Managing Cookies</h3>
        <p>
          You can disable cookies through your browser settings. However, some features of ET Marketplace may not function
          properly without them.
        </p>

        <h3 className="text-lg font-semibold text-text-primary mt-4">Contact Us</h3>
        <p>
          If you have questions about this policy, please contact us at{' '}
          <a href="mailto:support@etmarketplace.com" className="text-brand hover:text-brand-hover underline">
            support@etmarketplace.com
          </a>.
        </p>
      </div>
    </div>
  </div>
);

export default CookiePolicyPage;