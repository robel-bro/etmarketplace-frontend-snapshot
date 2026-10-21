import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Sparkles } from 'lucide-react';
import ProductCard from '../products/ProductCard';   // ← this path is correct

interface PromotionalSectionProps {
  section?: {
    id: number;
    name: string;
    slug: string;
    section_type: string;
    products: any[];
    flash_sale_ends_at?: string;
  };
  delay?: number;
}

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-4 text-white">
      <div className="text-center">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
          <span className="text-2xl font-bold">{timeLeft.days}</span>
        </div>
        <span className="text-xs block mt-1">Days</span>
      </div>
      <div className="text-center">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
          <span className="text-2xl font-bold">{timeLeft.hours}</span>
        </div>
        <span className="text-xs block mt-1">Hours</span>
      </div>
      <div className="text-center">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
          <span className="text-2xl font-bold">{timeLeft.minutes}</span>
        </div>
        <span className="text-xs block mt-1">Mins</span>
      </div>
      <div className="text-center">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
          <span className="text-2xl font-bold">{timeLeft.seconds}</span>
        </div>
        <span className="text-xs block mt-1">Secs</span>
      </div>
    </div>
  );
};

const TrendingProductCard = ({ product }: { product: any }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
  >
    <img
      src={product.image_urls?.[0] || '/placeholder.jpg'}
      alt={product.title}
      className="w-full h-48 object-cover"
    />
    <div className="p-3">
      <h3 className="font-medium text-gray-800 line-clamp-2 text-sm">{product.title}</h3>
      <p className="text-red-600 font-bold mt-1">ETB {Number(product.price).toFixed(2)}</p>
    </div>
  </motion.div>
);

const PromotionalSection = ({ section, delay = 0 }: PromotionalSectionProps) => {
  // ★ Safety guard – if no section, render nothing
  if (!section) return null;

  const { name, slug, section_type, products, flash_sale_ends_at } = section;
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  // ---------- FLASH SALE ----------
  if (section_type === 'flash_sale') {
    const targetDate = flash_sale_ends_at
      ? new Date(flash_sale_ends_at)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return (
      <section className="py-12 bg-[#FFF5F5]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">⚡ Limited Time</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{name}</h2>
            </div>
            <CountdownTimer targetDate={targetDate} />
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 w-max">
              {products.map(product => (
                <div key={product.id} className="w-64 flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
          {slug && (
            <div className="text-center mt-4">
              <Link to={`/promotions/${slug}`} className="text-red-600 hover:underline">View All →</Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ---------- HOT DEALS / SUPER DEAL ----------
  if (section_type === 'hot_deals' || section_type === 'super_deal') {
    return (
      <section className="py-12 bg-[#FFF9E6]">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {slug && (
            <div className="text-center mt-6">
              <Link to={`/promotions/${slug}`} className="text-red-600 hover:underline">View All →</Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ---------- BEST SELLERS ----------
  if (section_type === 'best_sellers') {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">🏆 {name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map(product => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                {product.sold_count && (
                  <span className="absolute bottom-2 right-2 text-xs bg-gray-800 text-white px-2 py-0.5 rounded-full">
                    {product.sold_count} sold
                  </span>
                )}
              </div>
            ))}
          </div>
          {slug && (
            <div className="text-center mt-6">
              <Link to={`/promotions/${slug}`} className="text-red-600 hover:underline">View All →</Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ---------- TRENDING NOW ----------
  if (section_type === 'trending') {
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!scrollRef.current) return;
      const startX = e.pageX - scrollRef.current.offsetLeft;
      const scrollLeft = scrollRef.current.scrollLeft;
      const onMouseMove = (e: MouseEvent) => {
        const x = e.pageX - scrollRef.current!.offsetLeft;
        const walk = (x - startX) * 2;
        scrollRef.current!.scrollLeft = scrollLeft - walk;
      };
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
    return (
      <section className="py-12 bg-[#F7F7F7]">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{name}</h2>
          </div>
          <div
            ref={scrollRef}
            className="overflow-x-auto pb-4 cursor-grab active:cursor-grabbing scroll-smooth"
            onMouseDown={handleMouseDown}
          >
            <div className="flex gap-4 w-max">
              {products.map(product => (
                <div key={product.id} className="w-64 flex-shrink-0">
                  <TrendingProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
          {slug && (
            <div className="text-center mt-4">
              <Link to={`/promotions/${slug}`} className="text-red-600 hover:underline">View All →</Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ---------- NEW ARRIVALS ----------
  if (section_type === 'new_arrivals') {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">✨ {name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {slug && (
            <div className="text-center mt-6">
              <Link to={`/promotions/${slug}`} className="text-red-600 hover:underline">View All →</Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ---------- STAFF PICKS (custom) ----------
  if (section_type === 'custom') {
    return (
      <section className="py-12 bg-[#FAFAFA]">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{name}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map(product => (
              <div key={product.id} className="relative">
                <div className="absolute -top-2 -left-2 z-10 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">Editor's Pick</div>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          {slug && (
            <div className="text-center mt-6">
              <Link to={`/promotions/${slug}`} className="text-red-600 hover:underline">View All →</Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Fallback
  return null;
};

export default PromotionalSection;