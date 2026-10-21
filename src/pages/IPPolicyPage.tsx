const IPPolicyPage = () => (
  <div className="min-h-screen bg-[#F5F5F5]">
    <div className="container-marketplace py-8 max-w-3xl mx-auto">
      <h1 className="text-product-title font-semibold text-text-primary mb-2">Intellectual Property Policy</h1>
      <p className="text-body-sm text-text-muted mb-6">Last updated: {new Date().getFullYear()}</p>

      <div className="card-product p-5 space-y-4 text-sm text-text-secondary leading-relaxed">
        <p>
          ET Marketplace respects the intellectual property rights of others and expects our users to do the same.
          We comply with all applicable laws, including the Ethiopian Intellectual Property Proclamation.
        </p>

        <h3 className="text-lg font-semibold text-text-primary mt-4">Trademarks</h3>
        <p>
          All trademarks, logos, and brand names displayed on ET Marketplace are the property of their respective owners.
          Unauthorised use is prohibited.
        </p>

        <h3 className="text-lg font-semibold text-text-primary mt-4">Copyright</h3>
        <p>
          Product images, descriptions, and all content on the platform are protected by copyright. Sellers must not
          upload content they do not own. If you believe your copyright has been infringed, please contact us immediately.
        </p>

        <h3 className="text-lg font-semibold text-text-primary mt-4">Reporting Infringement</h3>
        <p>
          To report a violation, email{' '}
          <a href="mailto:legal@etmarketplace.com" className="text-brand hover:text-brand-hover underline">
            legal@etmarketplace.com
          </a>{' '}
          with a detailed description and evidence of the infringement. We will investigate and take appropriate action
          within 5 business days.
        </p>
      </div>
    </div>
  </div>
);

export default IPPolicyPage;