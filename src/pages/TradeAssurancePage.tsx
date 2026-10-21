import { useState } from 'react';
import { Link } from 'react-router-dom';   // ← added
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon,
  ArrowPathIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const TradeAssurancePage = () => {
  const [orderAmount, setOrderAmount] = useState(1000);
  const [coverage, setCoverage] = useState(80);
  const [protectionFee, setProtectionFee] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);
  const [orderId, setOrderId] = useState('');

  const calculateFee = () => {
    const fee = (orderAmount * coverage) / 100 * 0.02;
    setProtectionFee(Math.round(fee));
    setIsCalculated(true);
  };

  const features = [
    {
      icon: ShieldCheckIcon,
      title: 'Payment Protection',
      description: 'Your funds are secured in escrow until you confirm satisfaction'
    },
    {
      icon: ClockIcon,
      title: 'On-Time Guarantee',
      description: 'Full refund if delivery exceeds the guaranteed timeframe'
    },
    {
      icon: DocumentCheckIcon,
      title: 'Quality Assurance',
      description: 'Protected against items not matching product descriptions'
    },
    {
      icon: ArrowPathIcon,
      title: 'Easy Refunds',
      description: 'Streamlined dispute resolution with automated refund processing'
    }
  ];

  const stats = [
    { value: '₦2.4B+', label: 'Protected Transactions' },
    { value: '50K+', label: 'Active Users' },
    { value: '99.8%', label: 'Success Rate' },
    { value: '24/7', label: 'Support Available' }
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1521790797524-b2497295b8a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Business handshake"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/75"></div>

        <div className="relative container-padded py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-[var(--color-orange-50)] px-3 py-1.5 rounded-full mb-4">
              <LockClosedIcon className="w-4 h-4 text-[var(--color-orange-500)]" />
              <span className="text-xs font-medium text-[var(--color-orange-600)]">Trusted by 50,000+ Businesses</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight text-gray-900">
              Trade Assurance
            </h1>
            <p className="text-base text-gray-600 mb-4">
              Secure your transactions with comprehensive payment protection
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="card p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-padded py-10">
        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            How Trade Assurance Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card p-5 flex flex-col items-start"
              >
                <div className="w-12 h-12 bg-[var(--color-orange-50)] rounded-lg flex items-center justify-center mb-3">
                  <feature.icon className="w-6 h-6 text-[var(--color-orange-500)]" />
                </div>
                <h3 className="font-semibold text-base mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Calculator & Coverage Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Coverage Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card p-6 space-y-4"
          >
            <ShieldCheckIcon className="w-12 h-12 text-[var(--color-orange-500)] mb-2" />
            <h2 className="text-xl font-bold text-gray-900">What is Trade Assurance?</h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              We protect your payments until you confirm order satisfaction. Your funds are held in secure escrow and only released when you approve the transaction.
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold text-base text-gray-900">Coverage Includes:</h3>
              <div className="space-y-2">
                {[
                  'Order not received within guaranteed timeframe',
                  'Item significantly different from description',
                  'Quality issues reported within 14 days',
                  'Damaged goods upon delivery',
                  'Missing items from order'
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Protection Calculator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card p-6"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 bg-[var(--color-orange-50)] rounded-lg flex items-center justify-center">
                <CalculatorIcon className="w-5 h-5 text-[var(--color-orange-500)]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Protection Calculator</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Order Amount (ETB)
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={orderAmount}
                    onChange={(e) => {
                      setOrderAmount(Number(e.target.value));
                      setIsCalculated(false);
                    }}
                    className="input-premium !pl-9 !py-2.5 !text-sm"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Coverage Percentage
                  </label>
                  <span className="text-lg font-semibold text-gray-900">{coverage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={coverage}
                  onChange={(e) => {
                    setCoverage(Number(e.target.value));
                    setIsCalculated(false);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-orange-500)]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="bg-[var(--surface-page)] rounded-lg p-3 space-y-1.5 border border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Amount:</span>
                  <span className="font-medium">ETB {orderAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Coverage:</span>
                  <span className="font-medium">{coverage}% (ETB {((orderAmount * coverage) / 100).toLocaleString()})</span>
                </div>
              </div>

              <button
                onClick={calculateFee}
                className="btn-primary w-full py-2.5 text-sm"
              >
                Calculate Protection Fee
              </button>

              <AnimatePresence>
                {isCalculated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-green-50 rounded-lg p-4 border border-green-200"
                  >
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-600 mb-1">Protection Fee</p>
                      <p className="text-2xl font-bold text-gray-900 mb-0.5">
                        ETB {protectionFee.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">2% of covered amount</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="font-semibold text-base mb-2 text-gray-900">Activate Protection</h3>
                <p className="text-xs text-gray-600 mb-3">
                  Enter your order ID to activate instant protection coverage.
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter Order ID (e.g., ORD-1234)"
                    className="input-premium !py-2 !text-sm"
                  />
                  <button
                    disabled={!orderId}
                    className="btn-primary w-full py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Activate Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Trust Banner – now links to /sell */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-premium p-8 text-center bg-[var(--color-orange-50)] border border-[var(--color-orange-200)]"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Protect Your Transactions?</h3>
          <p className="text-gray-600 text-sm mb-5 max-w-xl mx-auto">
            Join thousands of businesses who trust Trade Assurance for secure, worry-free transactions.
          </p>
          <Link
            to="/sell"
            className="btn-primary px-6 py-2.5 text-sm inline-block"
          >
            Get Started Today
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default TradeAssurancePage;