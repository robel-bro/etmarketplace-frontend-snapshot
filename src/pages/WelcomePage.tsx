// src/pages/WelcomePage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    image: '/images/welcome/welcome_slide1.svg',
    tagline: 'Shop Local',
    headline: 'Discover Ethiopia’s\nFinest Marketplace',
    subtext:
      'Browse thousands of quality‑verified products from trusted Ethiopian sellers. Every shop is vetted – we require valid business licenses and official documentation before a seller can list. Shop with confidence knowing every product meets our strict quality standards.',
    accent: '#F97316',
  },
  {
    image: '/images/welcome/welcome_slide2.svg',
    tagline: 'Fast Delivery',
    headline: 'Reliable Delivery\nto Your Doorstep',
    subtext:
      'We partner with multiple carriers including EthioPost and private logistics providers to give you the fastest, most affordable delivery options. Track your order in real time from dispatch to doorstep – anywhere in Ethiopia.',
    accent: '#2563EB',
  },
  {
    image: '/images/welcome/welcome_slide3.svg',
    tagline: 'Secure Payments',
    headline: 'Pay with\nConfidence',
    subtext:
      'Choose from Telebirr, Chapa, CBE Birr, bank transfer, or cash on delivery. Every transaction is encrypted and protected. Your payment data is never stored – we use certified payment gateways with end‑to‑end security.',
    accent: '#16A34A',
  },
  {
    image: '/images/welcome/welcome_slide4.svg',
    tagline: 'Sell & Grow',
    headline: 'Turn Your Passion\nInto Profit',
    subtext:
      'Open your free storefront in minutes. Upload your business license and national ID – our team verifies documents within 24 hours. Access powerful tools: inventory management, sales analytics, promotional campaigns, and direct customer messaging.',
    accent: '#DC2626',
  },
  {
    image: '/images/welcome/welcome_slide5.svg',
    tagline: 'Join the Family',
    headline: 'Welcome to\nET Marketplace',
    subtext:
      'Ethiopia’s most trusted online marketplace – built for buyers and sellers who demand quality, security, and reliability. Create your free account, browse as a guest, or sign in to your existing account.',
    accent: '#F97316',
  },
];

const WELCOME_KEY = 'has_seen_welcome';

export default function WelcomePage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    if (!isLast) goTo(current + 1);
  }, [current, isLast, goTo]);

  const prev = () => {
    if (current > 0) goTo(current - 1);
  };

  useEffect(() => {
    if (!autoPlay || isLast) return;
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, isLast, next]);

  const handleDismiss = (path: string) => {
    localStorage.setItem(WELCOME_KEY, 'true');
    navigate(path, { replace: true });
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };
  const transition = { duration: 0.5, ease: 'easeInOut' };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-white overflow-hidden"
      onMouseEnter={() => setAutoPlay(false)}
      onMouseLeave={() => setAutoPlay(true)}
    >
      {/* Skip */}
      {!isLast && (
        <div className="absolute top-6 right-6 z-30">
          <button
            onClick={() => goTo(SLIDES.length - 1)}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition"
          >
            Skip
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Illustration section */}
        <div className="relative w-full lg:w-1/2 h-64 lg:h-full flex items-center justify-center bg-gray-50">
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={current}
              src={slide.image}
              alt=""
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="w-4/5 max-w-sm lg:max-w-md h-auto object-contain"
              style={{ maxHeight: '70vh' }}
            />
          </AnimatePresence>
        </div>

        {/* Text & CTAs */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-8 lg:py-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-md"
            >
              {/* Tag pill */}
              <div
                className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                style={{ background: `${slide.accent}15`, color: slide.accent }}
              >
                {slide.tagline}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
                {slide.headline.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < slide.headline.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </h1>

              <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-8">
                {slide.subtext}
              </p>

              {!isLast ? (
                <button
                  onClick={next}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:brightness-110"
                  style={{ background: slide.accent }}
                >
                  Continue
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button
                    onClick={() => handleDismiss('/register')}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:brightness-110"
                    style={{ background: slide.accent }}
                  >
                    Create Free Account
                  </button>
                  <button
                    onClick={() => handleDismiss('/')}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                  >
                    Browse as Guest
                  </button>
                  <button
                    onClick={() => handleDismiss('/login')}
                    className="w-full py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition"
                  >
                    Already have an account? <span style={{ color: slide.accent }}>Sign in</span>
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav: dots + arrows */}
      <div className="h-16 flex items-center justify-between px-6 sm:px-10 lg:px-14 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: idx === current ? 28 : 8,
                height: 8,
                background: idx === current ? slide.accent : '#E5E7EB',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={current === 0}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            disabled={isLast}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}