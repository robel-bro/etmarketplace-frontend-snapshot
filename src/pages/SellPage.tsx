import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  TruckIcon,
  StarIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const benefits = [
  {
    title: 'Reach Thousands of Buyers',
    description: 'Connect with over 50,000 monthly shoppers across Ethiopia through our growing marketplace platform.',
    icon: UsersIcon,
  },
  {
    title: 'Powerful Analytics',
    description: 'Track sales, monitor inventory levels, and gain customer insights through our comprehensive dashboard.',
    icon: ChartBarIcon,
  },
  {
    title: 'Fast, Secure Payouts',
    description: 'Receive earnings directly to your bank account or Telebirr within 48 hours of order completion.',
    icon: CurrencyDollarIcon,
  },
  {
    title: 'Trusted & Secure',
    description: 'Enterprise-grade security with SSL encryption protects your business and customer data.',
    icon: ShieldCheckIcon,
  },
];

const howItWorks = [
  {
    title: 'Create Account',
    description: 'Complete our simple registration process in under 5 minutes.',
    icon: BuildingStorefrontIcon,
  },
  {
    title: 'Get Verified',
    description: 'Our team verifies your business details within 24 hours.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'List Products',
    description: 'Add your products with photos, descriptions, and competitive pricing.',
    icon: CogIcon,
  },
  {
    title: 'Start Earning',
    description: 'Begin selling to customers nationwide and grow your revenue.',
    icon: BanknotesIcon,
  },
];

const testimonials = [
  {
    name: 'Abebe Kebede',
    business: 'Abebe Electronics',
    text: 'Our sales tripled within the first month. The platform is intuitive and the support team is exceptionally responsive.',
    rating: 5,
  },
  {
    name: 'Tigist Mekonnen',
    business: 'Tigist Fashion',
    text: 'ET Marketplace made it incredibly simple to bring my boutique online. Managing orders has never been easier.',
    rating: 5,
  },
  {
    name: 'Yonas Desta',
    business: 'Yonas Coffee',
    text: 'Fair commission structure and excellent seller support. My coffee now reaches customers throughout Ethiopia.',
    rating: 5,
  },
];

const stats = [
  { value: '15,000+', label: 'Active Sellers' },
  { value: '50,000+', label: 'Products Sold' },
  { value: '200,000+', label: 'Active Buyers' },
];

const valueCards = [
  {
    icon: CurrencyDollarIcon,
    title: 'No Listing Fees',
    description: 'List as many products as you want without paying a single birr. You only pay a small commission when you make a sale.',
  },
  {
    icon: BanknotesIcon,
    title: 'Fast 48‑Hour Payouts',
    description: 'Your earnings reach your bank or Telebirr account within two business days—always on time.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Buyer Protection Included',
    description: 'Every transaction is covered by our buyer protection programme, so you can sell with confidence.',
  },
  {
    icon: TruckIcon,
    title: 'Discounted Shipping',
    description: 'Access pre‑negotiated rates with leading Ethiopian couriers and pass the savings to your customers.',
  },
  {
    icon: CogIcon,
    title: 'Powerful Seller Tools',
    description: 'Manage inventory, track orders, and view real‑time analytics from one intuitive dashboard.',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Sell On‑the‑Go',
    description: 'Our platform works perfectly on mobile, so you can manage your business anywhere, anytime.',
  },
];

const SellPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determine destination and button label based on auth state
  const isSeller = user?.roles?.includes('seller');
  const isBuyer = user && !isSeller;

  const ctaDestination = isSeller ? '/seller' : isBuyer ? '/seller-setup' : '/register';
  const ctaLabel = isSeller ? 'Go to Dashboard' : isBuyer ? 'Complete Seller Setup' : 'Get Started Today';

  const handleCtaClick = () => {
    navigate(ctaDestination);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1765371513492-264506c3ad09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Professional workspace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-800/80"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Start Selling on <span className="text-slate-300">ET Marketplace</span>
            </h1>
            <p className="text-base md:text-lg text-slate-200 mb-6 leading-relaxed">
              Join Ethiopia's fastest‑growing multi‑vendor marketplace. Reach thousands of customers, grow your business, and sell with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCtaClick}
                className="bg-slate-700 text-white px-6 py-2.5 rounded-lg hover:bg-slate-600 transition shadow-lg flex items-center gap-2 text-sm font-semibold"
              >
                {ctaLabel} <ArrowRightIcon className="w-4 h-4" />
              </button>
              <a
                href="#benefits"
                className="border-2 border-white text-white px-6 py-2.5 rounded-lg hover:bg-white/10 transition backdrop-blur-sm text-sm font-semibold"
              >
                Learn More
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Four simple steps to start your online business
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {howItWorks.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                  <step.icon className="w-7 h-7 text-slate-700" />
                </div>
                <div className="text-xs font-semibold text-slate-500 mb-1">Step {idx + 1}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div id="benefits" className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1771350395584-4d3c364b2278?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Business cityscape"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Why Sell With Us</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Everything you need to succeed in online commerce
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Rich Value Section */}
      <div className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Transparent, Fair & Simple</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              No hidden fees. No confusing plans. Just everything you need to sell successfully.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {valueCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <card.icon className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Trusted by Ethiopian Sellers</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Join thousands of successful businesses growing on our platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-50 rounded-xl p-6 border border-gray-200"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="border-t border-gray-200 pt-3">
                  <div className="font-bold text-gray-900 text-sm">{testimonial.name}</div>
                  <div className="text-xs text-gray-500">{testimonial.business}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1765371515218-0a4c992ba8e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Modern office"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/90"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-base md:text-lg text-slate-200 mb-6 max-w-2xl mx-auto">
            Join thousands of sellers growing their business on ET Marketplace
          </p>
          <button
            onClick={handleCtaClick}
            className="bg-white text-slate-900 px-6 py-2.5 rounded-lg hover:bg-slate-100 transition shadow-lg inline-flex items-center gap-2 text-sm font-semibold"
          >
            {ctaLabel} <ArrowRightIcon className="w-4 h-4" />
          </button>
          <p className="text-xs text-slate-300 mt-3">Free to sign up • No hidden fees • 24‑hour verification</p>
        </div>
      </div>
    </div>
  );
};

export default SellPage;