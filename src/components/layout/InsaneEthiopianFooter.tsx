import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaTelegramPlane,
  FaArrowUp,
  FaGooglePlay,
  FaApple,
} from 'react-icons/fa';
import {
  FiMail,
  FiMapPin,
  FiPhone,
  FiClock,
} from 'react-icons/fi';
import {
  ShieldCheckIcon,
  TruckIcon,
  UserGroupIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';

const InsaneEthiopianFooter = () => {
  const [categories, setCategories] = useState([]);
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle');
  const [currentTime, setCurrentTime] = useState(new Date());

  // fetch categories
  useEffect(() => {
    api
      .get('/categories')
      .then((res) => {
        let cats = Array.isArray(res.data) ? res.data : res.data.data || [];
        const topCategories = cats.filter((c) => {
          if (c.parent_id !== undefined) return !c.parent_id;
          if (c.ancestry !== undefined) return !c.ancestry;
          return true;
        });
        setCategories(topCategories);
      })
      .catch((err) => console.error('Failed to load categories for footer', err));
  }, []);

  // Real-time clock (updates every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    setNewsletterStatus('loading');
    // Simulate API call
    setTimeout(() => {
      setNewsletterStatus('success');
      setEmail('');
      setTimeout(() => setNewsletterStatus('idle'), 3000);
    }, 1000);
  };

  const socials = [
    { Icon: FaFacebookF, href: '#', label: 'Facebook', color: '#1877F2' },
    { Icon: FaTwitter, href: '#', label: 'Twitter', color: '#1DA1F2' },
    { Icon: FaInstagram, href: '#', label: 'Instagram', color: '#E4405F' },
    { Icon: FaYoutube, href: '#', label: 'YouTube', color: '#FF0000' },
    { Icon: FaTelegramPlane, href: '#', label: 'Telegram', color: '#0088cc' },
  ];

  const companyLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Careers', path: '/careers' },
    { name: 'Press & News', path: '/press' },
    { name: 'Partnerships', path: '/partners' },
  ];

  const helpLinks = [
    { name: 'Help Center', path: '/help' },
    { name: 'Track My Order', path: '/track' },
    { name: 'How to Buy', path: '/how-to-buy' },
    { name: 'Shipping & Delivery', path: '/shipping' },
    { name: 'Returns & Refunds', path: '/returns' },
    { name: 'FAQs', path: '/faq' },
  ];

  const policyLinks = [
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Cookie Policy', path: '/cookies' },
    { name: 'Buyer Protection', path: '/protection' },
    { name: 'Intellectual Property', path: '/ip-policy' },
  ];

  const paymentMethods = [
    { name: 'Telebirr' },
    { name: 'CBE' },
    { name: 'Dashen Bank' },
    { name: 'Amole' },
    { name: 'Cash on Delivery' },
  ];

  const contactInfo = [
    { Icon: FiPhone, text: '+251 911 223344', href: 'tel:+251911223344' },
    { Icon: FiMail, text: 'support@etmarketplace.com', href: 'mailto:support@etmarketplace.com' },
    { Icon: FiMapPin, text: 'Bole Road, Addis Ababa', href: '#' },
  ];

  const features = [
    { Icon: ShieldCheckIcon, title: 'Secure Payment', desc: '100% protected transactions' },
    { Icon: TruckIcon, title: 'Fast Delivery', desc: 'Nationwide shipping' },
    { Icon: UserGroupIcon, title: 'Legitimate Shops', desc: '100% verified sellers' },
    { Icon: CheckBadgeIcon, title: 'Reliable Shopping', desc: 'Trusted marketplace' },
  ];

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <>
      {/* Force download button text to white despite global a{color:inherit} */}
      <style>{`
        .footer-download-btn,
        .footer-download-btn * {
          color: #ffffff !important;
        }
      `}</style>

      <footer className="bg-white text-text-primary text-[13px]">
        {/* Feature bar */}
        <div className="border-b border-[var(--border-light)] bg-surface-hover">
          <div className="container-marketplace py-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {features.map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-md bg-brand-light flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-[13px] text-text-primary">{title}</p>
                    <p className="text-[11px] text-text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter – orange background with white subscribe button */}
        <div className="bg-[#F97519] text-white">
          <div className="container-marketplace py-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
              <div className="text-center md:text-left">
                <h3 className="text-sm font-bold mb-0.5">Newsletter</h3>
                <p className="text-xs text-orange-100">Get exclusive deals and new product launches</p>
              </div>
              <form onSubmit={handleNewsletterSubmit} className="w-full md:max-w-md">
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-2.5 py-1.5 rounded-md text-gray-900 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={newsletterStatus === 'loading'}
                    className="px-4 py-1.5 bg-white text-[#F97519] font-semibold rounded-md hover:bg-gray-100 transition disabled:opacity-50 text-xs whitespace-nowrap"
                  >
                    {newsletterStatus === 'loading' ? '...' : 'Subscribe'}
                  </button>
                </div>
                {newsletterStatus === 'success' && (
                  <p className="text-orange-100 text-[11px] mt-1.5 flex items-center gap-1">
                    <span>✓</span> Subscribed successfully
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Main columns */}
        <div className="container-marketplace py-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Brand + social + app downloads */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="inline-block mb-1.5">
                <h2 className="text-base font-bold text-text-primary">ET Marketplace</h2>
              </Link>
              <p className="text-[13px] text-text-secondary leading-snug mb-2">
                Ethiopia's premier marketplace connecting buyers and sellers.
              </p>

              {/* Social Media Icons */}
              <div className="flex gap-1.5 mb-3">
                {socials.map(({ Icon, href, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    style={{ backgroundColor: `${color}10`, color: color }}
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:opacity-80 transition"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>

              {/* App Download Buttons */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-normal">
                  Download Our App
                </p>
                <a
                  href="#"
                  className="footer-download-btn flex items-center gap-1.5 bg-gray-900 px-2.5 py-1.5 rounded-md text-[13px] font-medium hover:bg-gray-800 transition"
                >
                  <FaGooglePlay className="w-3.5 h-3.5" />
                  <span>Google Play</span>
                </a>
                <a
                  href="#"
                  className="footer-download-btn flex items-center gap-1.5 bg-gray-900 px-2.5 py-1.5 rounded-md text-[13px] font-medium hover:bg-gray-800 transition"
                >
                  <FaApple className="w-3.5 h-3.5" />
                  <span>App Store</span>
                </a>
              </div>
            </div>

            {/* Top Categories */}
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-2">Top Categories</h3>
              <ul className="space-y-1">
                {categories.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <Link to={`/category/${cat.id}`} className="text-[13px] text-text-secondary hover:text-brand transition">
                      {cat.name}
                    </Link>
                  </li>
                ))}
                {categories.length === 0 && <li className="text-[13px] text-text-muted">Loading…</li>}
              </ul>
            </div>

            {/* Help & Support */}
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-2">Help & Support</h3>
              <ul className="space-y-1">
                {helpLinks.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-[13px] text-text-secondary hover:text-brand transition">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-2">Policies</h3>
              <ul className="space-y-1">
                {policyLinks.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-[13px] text-text-secondary hover:text-brand transition">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact + Company */}
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-2">Contact</h3>
              <ul className="space-y-1.5">
                {contactInfo.map(({ Icon, text, href }) => (
                  <li key={text}>
                    <a href={href} className="flex items-start gap-1 text-[13px] text-text-secondary hover:text-brand transition">
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-text-muted" />
                      <span>{text}</span>
                    </a>
                  </li>
                ))}
                <li className="flex items-start gap-1 text-[13px] text-text-secondary">
                  <FiClock className="w-4 h-4 mt-0.5 flex-shrink-0 text-text-muted" />
                  <span>Mon - Sun: 24/7</span>
                </li>
              </ul>
              <div className="mt-3">
                <h4 className="text-sm font-bold text-text-primary mb-2">Company</h4>
                <ul className="space-y-1">
                  {companyLinks.map((link) => (
                    <li key={link.name}>
                      <Link to={link.path} className="text-[13px] text-text-secondary hover:text-brand transition">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-[var(--border-light)] bg-surface-hover">
          <div className="container-marketplace py-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5">
              <p className="text-sm font-bold text-text-primary uppercase tracking-wide">We Accept</p>
              <div className="flex flex-wrap gap-1">
                {paymentMethods.map((method, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 border border-[var(--border-medium)] rounded text-[13px] font-medium text-text-secondary bg-white"
                  >
                    {method.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar with real-time clock */}
        <div className="border-t border-[var(--border-light)]">
          <div className="container-marketplace py-2">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-1.5">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <p>© {new Date().getFullYear()} ET Marketplace. All rights reserved.</p>
                <Link to="/sitemap" className="hover:text-text-primary transition">Sitemap</Link>
                <span className="hidden sm:inline text-border-light">|</span>
                <span className="hidden sm:inline font-mono">{formattedTime} EAT</span>
              </div>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-6 h-6 bg-gray-800 hover:bg-gray-900 rounded-md flex items-center justify-center text-white shadow-card transition"
                aria-label="Scroll to top"
              >
                <FaArrowUp className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default InsaneEthiopianFooter;