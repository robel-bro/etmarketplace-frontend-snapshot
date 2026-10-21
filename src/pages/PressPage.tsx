const PressPage = () => (
  <div className="min-h-screen bg-[#F5F5F5]">
    <div className="container-marketplace py-8 max-w-3xl mx-auto">
      <h1 className="text-product-title font-semibold text-text-primary mb-2">Press & News</h1>
      <p className="text-body-sm text-text-secondary mb-6">
        Latest updates, announcements, and media resources from ET Marketplace.
      </p>

      <div className="space-y-3">
        {[
          { date: 'April 2026', title: 'ET Marketplace Reaches 50,000 Monthly Shoppers', desc: 'Our platform continues to grow, connecting more buyers and sellers across Ethiopia.' },
          { date: 'March 2026', title: 'New Payment Integration: Telebirr Now Available', desc: 'Customers can now pay instantly with Telebirr, Ethiopia’s leading mobile money service.' },
          { date: 'January 2026', title: 'Seller Dashboard 2.0 Launched', desc: 'A complete redesign of our seller tools, featuring real‑time analytics and bulk product upload.' },
        ].map((item, idx) => (
          <div key={idx} className="card-product p-4">
            <p className="text-xs text-text-muted mb-1">{item.date}</p>
            <h3 className="text-base font-semibold text-text-primary mb-1">{item.title}</h3>
            <p className="text-sm text-text-secondary">{item.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-text-secondary">
        For media inquiries, contact{' '}
        <a href="mailto:press@etmarketplace.com" className="text-brand hover:text-brand-hover underline">
          press@etmarketplace.com
        </a>.
      </p>
    </div>
  </div>
);

export default PressPage;