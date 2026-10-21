const CareersPage = () => (
  <div className="min-h-screen bg-[#F5F5F5]">
    <div className="container-marketplace py-8 max-w-3xl mx-auto">
      <h1 className="text-product-title font-semibold text-text-primary mb-2">Careers</h1>
      <p className="text-body-sm text-text-secondary mb-6">
        Join our team and help shape the future of e‑commerce in Ethiopia.
      </p>

      <div className="card-product p-5 space-y-4 text-sm text-text-secondary leading-relaxed mb-6">
        <p>
          We’re looking for passionate individuals to help us grow ET Marketplace. We offer competitive salaries,
          flexible working hours, and a chance to make a real impact.
        </p>
        <h3 className="text-lg font-semibold text-text-primary mt-4">Current Openings</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Senior Software Engineer – Addis Ababa</li>
          <li>Customer Support Specialist – Remote</li>
          <li>Digital Marketing Manager – Addis Ababa</li>
          <li>Logistics Coordinator – Addis Ababa</li>
        </ul>
        <p className="mt-4">
          Send your CV and cover letter to{' '}
          <a href="mailto:careers@etmarketplace.com" className="text-brand hover:text-brand-hover underline">
            careers@etmarketplace.com
          </a>.
        </p>
      </div>
    </div>
  </div>
);

export default CareersPage;