const PartnersPage = () => (
  <div className="min-h-screen bg-[var(--surface-page)]">
    <div className="container-padded py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Partnerships</h1>
      <p className="text-sm text-gray-600 mb-8">
        We collaborate with leading brands, logistics providers, and technology companies to bring the best experience to our customers.
      </p>

      <div className="card p-6 space-y-4 text-sm text-gray-700 leading-relaxed mb-10">
        <p>
          ET Marketplace partners with banks, mobile money providers, and courier services to offer seamless
          payments and fast delivery. We’re always looking for new partners to expand our reach.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-4">Our Partners</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><span className="font-semibold">Telebirr</span> – Mobile payments</li>
          <li><span className="font-semibold">Dashen Bank</span> – Banking services</li>
          <li><span className="font-semibold">Ethio Telecom</span> – Connectivity</li>
          <li><span className="font-semibold">Ethiopian Postal Service</span> – Nationwide delivery</li>
        </ul>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Become a Partner</h3>
        <p>
          If you’re interested in a partnership, email us at{' '}
          <a href="mailto:partners@etmarketplace.com" className="text-[var(--color-orange-500)] hover:underline">
            partners@etmarketplace.com
          </a>.
        </p>
      </div>
    </div>
  </div>
);

export default PartnersPage;