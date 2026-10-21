import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const articles = [
  {
    id: 'create-account',
    category: 'Getting Started',
    title: 'How to create an account',
    icon: '📝',
    content: `Creating an account on ET Marketplace is quick and easy. Follow these steps:

1. Click on the "Sign Up" button at the top right corner.
2. You can register using either your email address or phone number.
   • If using email: enter your email and create a password.
   • If using phone: enter your phone number (e.g., +251911223344) and create a password.
3. Click "Register". You will receive a verification code via SMS or email.
4. Enter the verification code to activate your account.
5. Once verified, you can start shopping immediately.

💡 Tip: Adding your national ID and phone number later will speed up checkout.`,
  },
  {
    id: 'track-order',
    category: 'Orders',
    title: 'Track your order',
    icon: '🚚',
    content: `Tracking your order is simple:

• After placing an order, you will receive an SMS and email with your order ID.
• Log in to your account and go to "Profile" → "Order History".
• Find your order and click "Track".
• You will see the current status: Pending, Processing, Shipped, or Delivered.
• Once shipped, a tracking link may appear – click it to see real‑time location.

If you have any issues, contact our support team with your order ID.`,
  },
  {
    id: 'payment-methods',
    category: 'Payments',
    title: 'Payment methods explained',
    icon: '💰',
    content: `We offer several secure payment options:

• **Telebirr** – Instant mobile money transfer. Select Telebirr at checkout, enter your phone number, and confirm the payment on your phone.
• **Chapa** – Online payment via card or mobile. You'll be redirected to Chapa's secure page to complete the transaction.
• **Cash on Delivery** – Pay in cash when your order arrives. Available in most cities. A small convenience fee may apply.

All payments are protected by our Trade Assurance program. If you don't receive your order or it's not as described, we'll refund you.`,
  },
  {
    id: 'returns',
    category: 'Returns',
    title: 'Return policy',
    icon: '🔄',
    content: `We want you to be completely satisfied. If you need to return an item:

• You have **14 days** from delivery to initiate a return.
• Items must be unused, in original packaging, with all tags attached.
• To start a return, go to "Order History", find the order, and click "Return".
• Select the reason and submit. Our support team will review and approve within 24 hours.
• Once approved, you'll receive a return label via email. Ship the item back.
• After we receive the item, your refund will be processed within 5 business days.

Note: Some items (like perishable goods) are non‑returnable. See individual product pages for details.`,
  },
];

const HelpCenterPage = () => {
  const [search, setSearch] = useState('');

  const filteredArticles = articles.filter(
    a =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#F5F5F5]">
      <div className="container-marketplace py-6 max-w-4xl mx-auto">
        <h1 className="text-section-title font-bold text-text-primary text-center mb-2">How can we help you?</h1>
        <p className="text-body text-text-secondary text-center mb-6">Search our help articles or browse by category</p>

        {/* Search */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white focus:ring-2 focus:ring-brand focus:border-transparent transition"
          />
          {search && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-light text-brand px-2 py-0.5 rounded-full text-xs font-medium">
              {filteredArticles.length} results
            </div>
          )}
        </div>

        {/* Article Grid */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {filteredArticles.map((a) => (
            <Link
              key={a.id}
              to={`/help/${a.id}`}
              className="card-product p-4 group hover:border-brand/30 hover:shadow-elevated transition-all"
            >
              <div className="text-2xl mb-1">{a.icon}</div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">{a.category}</p>
              <h3 className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors">
                {a.title}
              </h3>
            </Link>
          ))}
        </div>

        {/* Video Tutorial */}
        <div className="card-product bg-brand-light border border-brand/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-text-primary mb-0.5">Watch our video guide</h2>
            <p className="text-sm text-text-secondary">Learn how to navigate ET Marketplace in 5 minutes.</p>
          </div>
          <button className="btn-cta py-2 px-4 text-sm font-semibold inline-flex items-center gap-2">
            <span>▶</span> Play Video
          </button>
        </div>
      </div>
    </div>
  );
};

// Article Detail Page
export const HelpArticlePage = () => {
  const { articleId } = useParams();
  const article = articles.find(a => a.id === articleId);

  if (!article) {
    return (
      <div className="bg-[#F5F5F5] py-20">
        <div className="max-w-sm mx-auto text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">Article not found</h2>
          <Link to="/help" className="text-sm font-medium text-brand hover:underline">
            Back to Help Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F5]">
      <div className="container-marketplace py-6 max-w-2xl mx-auto">
        <Link to="/help" className="text-sm font-medium text-brand hover:underline mb-4 inline-block">
          ← Back to Help Center
        </Link>
        <div className="card-product p-5">
          <div className="text-3xl mb-2">{article.icon}</div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{article.category}</p>
          <h1 className="text-product-title font-semibold text-text-primary mb-3">{article.title}</h1>
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{article.content}</div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;