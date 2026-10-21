import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  TruckIcon,
  ClockIcon,
  MapPinIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Elegant background pattern (unchanged)
const EthiopianPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="ethio-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <path d="M25 25 L35 35 M50 25 L60 35 M75 25 L85 35 M25 75 L35 65 M50 75 L60 65 M75 75 L85 65" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-slate-900" />
        <circle cx="30" cy="30" r="2.5" fill="currentColor" className="text-slate-900" />
        <circle cx="70" cy="70" r="2.5" fill="currentColor" className="text-slate-900" />
        <circle cx="70" cy="30" r="1.5" fill="currentColor" className="text-slate-900" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#ethio-pattern)" />
  </svg>
);

// Guardian data (unchanged)
const guardians = [
  {
    name: 'Telebirr',
    title: 'Lightning of Shewa',
    status: 'active',
    icon: '⚡',
    gradient: 'from-amber-500 via-yellow-500 to-orange-500',
    description: 'Instant mobile payments with lightning-fast processing.',
    lore: 'Swift as the highland storms, Telebirr ensures your payments are completed in milliseconds.',
    stats: '2M+ transactions',
  },
  {
    name: 'Banks',
    title: 'Rock of Axum',
    status: 'active',
    icon: '🏛️',
    gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    description: 'Traditional banking security with modern technology.',
    lore: 'Standing firm like ancient stelae, providing unshakeable protection for your funds.',
    stats: '15+ partners',
  },
  {
    name: 'M‑Pesa',
    title: 'The East Wind',
    status: 'coming soon',
    icon: '🌪️',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    description: 'Revolutionary mobile money from the East.',
    lore: 'Bringing powerful financial freedom with every transaction.',
    stats: 'Launching Q3',
  },
  {
    name: 'Chapa',
    title: 'The New Star',
    status: 'coming soon',
    icon: '✨',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    description: 'Next-generation payment solutions.',
    lore: 'A rising star illuminating the future of digital payments.',
    stats: 'Launching Q4',
  },
];

// Journey steps (unchanged)
const journey = [
  { step: 1, title: 'Order Placed', description: 'Your journey begins', icon: '📋', amharic: 'ትእዛዝ ተቀምጧል' },
  { step: 2, title: 'Payment Secured', description: 'Funds safely held in escrow', icon: '🛡️', amharic: 'ክፍያ ተጠብቋል' },
  { step: 3, title: 'Preparing', description: 'Merchant processing your order', icon: '📦', amharic: 'ዝግጅት ላይ' },
  { step: 4, title: 'On the Way', description: 'Package in transit', icon: '🚚', amharic: 'በመንገድ ላይ' },
  { step: 5, title: 'Delivered', description: 'Successfully completed', icon: '✅', amharic: 'ደርሷል' },
];

// Testimonials (unchanged)
const testimonials = [
  { 
    name: 'Abebe Kebede', 
    text: 'The security and transparency gave me complete peace of mind. Outstanding service!', 
    region: 'Addis Ababa',
    rating: 5,
    avatar: '👨🏾'
  },
  { 
    name: 'Tigist Mekonnen', 
    text: 'Fast, reliable, and trustworthy. This is the future of safe online shopping.', 
    region: 'Bahir Dar',
    rating: 5,
    avatar: '👩🏾'
  },
  { 
    name: 'Yonas Desta', 
    text: 'Exceptional protection at every step. I recommend this to all my friends and family.', 
    region: 'Jimma',
    rating: 5,
    avatar: '👨🏾‍💼'
  },
];

// Ethiopian proverbs (unchanged)
const proverbs = [
  'Trust is the foundation of all commerce',
  'A promise kept builds a thousand bridges',
  'Safety in transaction, prosperity in business',
];

const OrderProtectionPage = () => {
  const [selectedGuardian, setSelectedGuardian] = useState<typeof guardians[0] | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [simulating, setSimulating] = useState(false);
  const [proverbIndex, setProverbIndex] = useState(0);

  // Rotate proverbs
  useEffect(() => {
    const interval = setInterval(() => {
      setProverbIndex((prev) => (prev + 1) % proverbs.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleTrack = () => {
    if (!trackingId.trim()) return;
    setTrackingResult({
      id: trackingId,
      status: 'On the Way',
      step: 4,
      estimatedDelivery: new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: 'Adama Sorting Center',
      progress: 70,
    });
    setCurrentStep(4);
  };

  const handleSimulate = () => {
    setSimulating(true);
    setCurrentStep(1);
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          setSimulating(false);
          return 5;
        }
        return prev + 1;
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] relative overflow-hidden">
      <EthiopianPattern />
      
      {/* Background orbs – kept subtle */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-brand-light/30 to-amber-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-brand-light/30 to-amber-100/30 rounded-full blur-3xl" />

      <div className="container-marketplace py-12 relative z-10 max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-block mb-4 px-6 py-2 bg-brand-light rounded-full border border-brand/20"
          >
            <span className="text-sm font-semibold text-brand">🛡️ Premium Order Protection</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-3 tracking-tight">
            የእምነት ቃል ኪዳን
          </h1>
          <p className="text-2xl md:text-3xl text-text-secondary mb-3 font-light">The Covenant of Trust</p>
          <motion.p
            key={proverbIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-base text-text-secondary italic mt-4 max-w-2xl mx-auto"
          >
            "{proverbs[proverbIndex]}"
          </motion.p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16"
        >
          {[
            { label: 'Protected Orders', value: '50K+', icon: '🛡️' },
            { label: 'Success Rate', value: '99.9%', icon: '✓' },
            { label: 'Active Users', value: '25K+', icon: '👥' },
            { label: 'Payment Methods', value: '4+', icon: '💳' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="card-product p-5 text-center"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-text-primary mb-1">{stat.value}</div>
              <div className="text-xs text-text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Order Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <div className="card-product p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                <TruckIcon className="w-5 h-5 text-white" />
              </div>
              Track Your Order
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter order ID (e.g., ORD-12345)"
                className="flex-1 h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
              />
              <button
                onClick={handleTrack}
                className="btn-cta px-6 py-2.5 text-sm font-semibold flex items-center gap-2"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                Track
              </button>
            </div>

            <AnimatePresence>
              {trackingResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 p-4 bg-brand-light rounded-[var(--radius-md)] border border-brand/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-text-primary text-base">Order #{trackingResult.id}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        Status: <span className="text-brand font-semibold">{trackingResult.status}</span>
                      </p>
                    </div>
                    <div className="bg-white text-text-secondary px-3 py-1 rounded-full text-xs font-semibold border border-border-light">
                      In Transit
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <MapPinIcon className="w-4 h-4 text-text-muted" />
                      <span>Current: {trackingResult.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <ClockIcon className="w-4 h-4 text-text-muted" />
                      <span>Est. delivery: {trackingResult.estimatedDelivery}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span className="font-medium">Progress</span>
                      <span className="font-semibold">{trackingResult.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${trackingResult.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="bg-brand h-2 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* The Guardians */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Payment Guardians</h2>
            <p className="text-sm text-text-secondary max-w-2xl mx-auto">
              Secure, trusted payment methods protecting your every transaction
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {guardians.map((g, idx) => (
              <motion.div
                key={g.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedGuardian(g)}
                className="card-product p-5 cursor-pointer group hover:border-brand transition-all"
              >
                <div className="relative z-10">
                  <div className="text-4xl mb-3">{g.icon}</div>
                  <h3 className="text-lg font-bold text-text-primary mb-1">{g.name}</h3>
                  <p className="text-xs text-text-muted italic mb-2">{g.title}</p>
                  
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      g.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {g.status === 'active' ? '● Active' : '○ Coming Soon'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-text-secondary mb-3 leading-relaxed">{g.description}</p>
                  
                  <div className="pt-3 border-t border-border-light">
                    <p className="text-xs text-text-muted font-medium">{g.stats}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Guardian Details Modal */}
        <AnimatePresence>
          {selectedGuardian && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGuardian(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="card-product p-6 max-w-lg w-full bg-white"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`text-5xl p-4 bg-gradient-to-br ${selectedGuardian.gradient} rounded-2xl`}>
                    {selectedGuardian.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-text-primary mb-1">{selectedGuardian.name}</h3>
                    <p className="text-base text-text-secondary italic mb-2">{selectedGuardian.title}</p>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      selectedGuardian.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedGuardian.status === 'active' ? '● Active Now' : '○ Coming Soon'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-4 bg-surface-hover rounded-[var(--radius-md)]">
                    <p className="text-text-primary leading-relaxed text-sm">{selectedGuardian.lore}</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-brand-light rounded-[var(--radius-md)]">
                    <div>
                      <p className="text-xs text-text-muted mb-1">Statistics</p>
                      <p className="text-base font-semibold text-text-primary">{selectedGuardian.stats}</p>
                    </div>
                    {selectedGuardian.status === 'active' && (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGuardian(null)}
                  className="mt-4 w-full btn-secondary"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Journey & Simulator */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Journey Path */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card-product p-5"
          >
            <h2 className="text-xl font-bold text-text-primary mb-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-white" />
              </div>
              Order Journey
            </h2>
            <div className="space-y-4">
              {journey.map((step) => (
                <div key={step.step} className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                      step.step <= currentStep 
                        ? 'bg-brand text-white' 
                        : 'bg-gray-100 text-text-muted'
                    }`}>
                      {step.step}
                    </div>
                    {step.step < journey.length && (
                      <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-4 ${
                        step.step < currentStep ? 'bg-brand' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-text-primary text-sm mb-0.5">{step.title}</p>
                    <p className="text-xs text-text-secondary">{step.description}</p>
                    <p className="text-xs text-text-muted">{step.amharic}</p>
                  </div>
                  <div className="text-2xl opacity-50">{step.icon}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Simulator */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card-product p-5"
          >
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              Live Simulation
            </h2>
            <p className="text-sm text-text-secondary mb-5 leading-relaxed">
              Experience the complete journey of a protected order from placement to delivery in real-time.
            </p>
            
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="btn-cta w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Simulating...
                </>
              ) : (
                'Start Simulation'
              )}
            </button>
            
            {simulating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5"
              >
                <div className="p-4 bg-brand-light rounded-[var(--radius-md)] border border-brand/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{journey[currentStep-1].icon}</div>
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{journey[currentStep-1].title}</p>
                      <p className="text-xs text-text-secondary">{journey[currentStep-1].description}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span className="font-medium">Progress</span>
                      <span className="font-semibold">Step {currentStep} of 5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        animate={{ width: `${currentStep * 20}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="bg-brand h-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Trusted by Thousands</h2>
            <p className="text-sm text-text-secondary">Real experiences from our valued customers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="card-product p-5 border-l-4 border-brand"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-lg">★</span>
                  ))}
                </div>
                
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  "{t.text}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-light rounded-full flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.region}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Why Choose Us</h2>
            <p className="text-sm text-text-secondary">Industry-leading protection and service</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheckIcon, title: 'Bank-Grade Security', description: 'Your payments are protected with enterprise-level encryption and security protocols.' },
              { icon: TruckIcon, title: 'Real-Time Tracking', description: 'Monitor your order at every step with live updates and precise location tracking.' },
              { icon: ClockIcon, title: '24/7 Support', description: 'Our dedicated team is always available to assist you with any questions or concerns.' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="card-product p-5"
              >
                <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-product p-10 text-center bg-brand-light border border-brand/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-brand/5" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
              Ready to Experience Secure Shopping?
            </h2>
            <p className="text-sm text-text-secondary mb-6 max-w-xl mx-auto">
              Join thousands of satisfied customers who trust us with their orders every day.
            </p>
            <Link
              to="/"
              className="btn-cta px-8 py-3 rounded-lg text-sm font-semibold shadow-md inline-flex items-center gap-2"
            >
              <span>ጀምር</span>
              <span>Start Your Journey</span>
              <span className="text-lg">→</span>
            </Link>
            <p className="mt-4 text-xs text-text-muted">Every order is a sacred bond of trust</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderProtectionPage;