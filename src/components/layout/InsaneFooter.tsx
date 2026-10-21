import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import confetti from 'canvas-confetti';
import Globe from 'react-globe.gl';
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaTelegramPlane,
} from 'react-icons/fa';

const InsaneFooter = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [rates] = useState({ USD: 0.018, EUR: 0.016, GBP: 0.014 });
  const [amount, setAmount] = useState(100);
  const [showWheel, setShowWheel] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [visitorCount] = useState(2847);
  const [coffeeFact, setCoffeeFact] = useState('');
  const [showFact, setShowFact] = useState(false);
  const [holidayCountdown, setHolidayCountdown] = useState('');
  const [reviews] = useState([
    { user: 'Abebe', comment: 'Best marketplace in Ethiopia!', rating: 5 },
    { user: 'Tigist', comment: 'Fast delivery and great prices.', rating: 5 },
    { user: 'Yonas', comment: 'I found everything I needed.', rating: 4 },
  ]);
  const [currentReview, setCurrentReview] = useState(0);
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { triggerOnce: true, threshold: 0.1 });
  const canvasRef = useRef(null);
  const globeRef = useRef();

  // Personalized greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Countdown to Ethiopian New Year (Enkutatash – September 11)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      let year = now.getFullYear();
      let enkutatash = new Date(year, 8, 11); // September 11
      if (now > enkutatash) {
        enkutatash = new Date(year + 1, 8, 11);
      }
      const diff = enkutatash.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setHolidayCountdown(`${days}d ${hours}h ${minutes}m`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, []);

  // Particle background (Ethiopian flag colors)
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = 400;
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    }));

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = 400;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Spin wheel logic
  const spinWheel = () => {
    const prizes = ['10% OFF', '20% OFF', 'Free Shipping', 'No Prize', 'ETB 50 Gift', 'Try Again'];
    const random = Math.floor(Math.random() * prizes.length);
    setCoupon(prizes[random]);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  // Coffee fact
  const getCoffeeFact = () => {
    const facts = [
      'Ethiopia is the birthplace of coffee.',
      'Coffee ceremonies are a daily tradition.',
      'Ethiopia produces some of the finest Arabica beans.',
      'Coffee was discovered by a goat herder named Kaldi.',
      'Ethiopian coffee is known for its fruity and floral notes.',
    ];
    setCoffeeFact(facts[Math.floor(Math.random() * facts.length)]);
    setShowFact(true);
    setTimeout(() => setShowFact(false), 5000);
  };

  // Globe data
  const globeData = [
    { lat: 9.0243, lng: 38.7468, label: 'Addis Ababa' },
    { lat: 11.5742, lng: 37.3614, label: 'Bahir Dar' },
    { lat: 13.4967, lng: 39.4767, label: 'Mekelle' },
    { lat: 6.6111, lng: 39.3417, label: 'Jimma' },
  ];

  // Animation on view
  useEffect(() => {
    if (inView) controls.start('visible');
  }, [controls, inView]);

  return (
    <motion.footer
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, staggerChildren: 0.1 } },
      }}
      className="relative bg-gray-900 text-gray-300 pt-16 pb-8 mt-16 overflow-hidden"
    >
      {/* Particle canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ height: '400px' }} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Top row: personalized greeting + currency converter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">
              {greeting}, {user?.email_address || 'Guest'}!
            </h2>
            <p className="text-sm text-gray-400">Welcome to ET Marketplace</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl mt-4 md:mt-0">
            <label className="text-sm">Currency converter (mock)</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-20 bg-gray-700 text-white px-2 py-1 rounded"
              />
              <span>ETB =</span>
              <span>{amount * rates.USD} USD</span>
              <span>{amount * rates.EUR} EUR</span>
            </div>
          </div>
        </div>

        {/* Main grid: 5 columns with interactive elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Column 1: Live visitor + holiday countdown */}
          <div>
            <h3 className="text-white font-bold mb-2">Live Now</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span>{visitorCount} shoppers online</span>
            </div>
            <div>
              <h4 className="text-sm text-gray-400">Next: Enkutatash</h4>
              <p className="text-2xl font-bold text-primary-400">{holidayCountdown}</p>
            </div>
          </div>

          {/* Column 2: Spin the wheel */}
          <div>
            <h3 className="text-white font-bold mb-2">Win a Prize!</h3>
            <button
              onClick={() => setShowWheel(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-full hover:bg-primary-700 transition"
            >
              Spin the Wheel 🎡
            </button>
            {coupon && <p className="mt-2 text-sm text-green-400">You won: {coupon}</p>}
          </div>

          {/* Column 3: Coffee fact */}
          <div>
            <h3 className="text-white font-bold mb-2">Ethiopian Coffee</h3>
            <button
              onClick={getCoffeeFact}
              className="bg-amber-700 text-white px-4 py-2 rounded-full hover:bg-amber-800 transition flex items-center gap-2"
            >
              ☕ Get a Fact
            </button>
            {showFact && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm bg-amber-900/50 p-2 rounded"
              >
                {coffeeFact}
              </motion.p>
            )}
          </div>

          {/* Column 4: Latest review */}
          <div>
            <h3 className="text-white font-bold mb-2">What Buyers Say</h3>
            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-sm">"{reviews[currentReview].comment}"</p>
              <p className="text-xs text-gray-400 mt-1">– {reviews[currentReview].user}</p>
            </div>
            <div className="flex gap-1 mt-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentReview(i)}
                  className={`w-2 h-2 rounded-full ${
                    i === currentReview ? 'bg-primary-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Column 5: Social + secret easter egg */}
          <div>
            <h3 className="text-white font-bold mb-2">Join Us</h3>
            <div className="flex space-x-3">
              {[FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaTelegramPlane].map((Icon, idx) => (
                <a key={idx} href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition">
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={() => confetti({ particleCount: 300, spread: 100, origin: { y: 0.5 } })}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                🥚 Secret? Click here
              </button>
            </div>
          </div>
        </div>

        {/* 3D Globe */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <h3 className="text-white font-bold mb-4 text-center">We Deliver Across Ethiopia</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <Globe
              ref={globeRef}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
              labelsData={globeData}
              labelLat={d => d.lat}
              labelLng={d => d.lng}
              labelText={d => d.label}
              labelSize={1}
              labelDotRadius={0.5}
              labelColor={() => 'rgba(255, 255, 255, 0.8)'}
              labelResolution={2}
            />
          </div>
        </div>

        {/* Bottom bar with dynamic year and all legal links */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
          <p>&copy; {new Date().getFullYear()} ET Marketplace. Powered by 🇪🇹</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 md:mt-0 justify-center">
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/cookies" className="hover:underline">Cookies</Link>
            <Link to="/protection" className="hover:underline">Buyer Protection</Link>
            <Link to="/returns" className="hover:underline">Returns</Link>
            <Link to="/shipping" className="hover:underline">Shipping</Link>
            <Link to="/ip-policy" className="hover:underline">IP Policy</Link>
            <Link to="/sitemap" className="hover:underline">Sitemap</Link>
          </div>
        </div>
      </div>

      {/* Spin wheel modal */}
      {showWheel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Spin to Win!</h3>
            <div className="flex justify-center mb-6">
              <div className="relative w-48 h-48">
                {/* Simple CSS wheel representation */}
                <div className="absolute inset-0 rounded-full border-8 border-primary-500 animate-spin-slow"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={spinWheel}
                    className="bg-primary-600 text-white px-6 py-3 rounded-full hover:bg-primary-700"
                  >
                    SPIN
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => setShowWheel(false)} className="text-gray-400 hover:text-white">
              Close
            </button>
          </div>
        </div>
      )}
    </motion.footer>
  );
};

export default InsaneFooter;