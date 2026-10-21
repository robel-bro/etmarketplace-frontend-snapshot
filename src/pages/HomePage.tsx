// src/pages/HomePage.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Smartphone,
  Laptop,
  Home,
  Shirt,
  Sparkles,
  Dumbbell,
  BookOpen,
  Music,
  Palette,
  Wrench,
  Car,
  Plane,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Leaf,
  Tag,
  Baby,
  Coffee,
  Camera,
  Watch,
  Gamepad2,
  PawPrint,
  UtensilsCrossed,
  Building2,
  Gem,
  Armchair,
  Sofa,
  Refrigerator,
  AirVent,
  ShoppingBag,
  Footprints,
  Glasses,
  Headphones,
  Gift,
  Package,
  Hammer,
  Paintbrush,
  Cpu,
  CircuitBoard,
  Printer,
  Keyboard,
  Mouse,
  Monitor,
  Tablet,
  Tv,
} from 'lucide-react';
import api from '../lib/axios';
import HeroCarousel from '../components/features/home/HeroCarousel';
import ProductCard from '../components/features/products/ProductCard';
import PackageLinkWrapper from '../components/features/packages/PackageLinkWrapper';
import CollectionCard from '../components/features/collections/CollectionCard';

/* ────────── Helpers ────────── */
const normalizeProducts = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter((p: any) => p && p.id);
  if (data.data && Array.isArray(data.data)) return data.data.filter((p: any) => p && p.id);
  if (data.products && Array.isArray(data.products)) return data.products.filter((p: any) => p && p.id);
  return [];
};

/* ────────── Accurate Category Icons (lucide-react) ────────── */
const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();

  // Electronics & Devices
  if (lower.includes('smartphone') || lower.includes('mobile') || lower.includes('phone') || lower.includes('cell')) return Smartphone;
  if (lower.includes('laptop') || lower.includes('notebook') || lower.includes('computer') || lower.includes('desktop')) return Laptop;
  if (lower.includes('tablet') || lower.includes('ipad')) return Tablet;
  if (lower.includes('television') || lower.includes('tv') || lower.includes('screen')) return Tv;
  if (lower.includes('camera') || lower.includes('photography') || lower.includes('photo')) return Camera;
  if (lower.includes('watch') || lower.includes('wearable')) return Watch;
  if (lower.includes('gaming') || lower.includes('game') || lower.includes('console')) return Gamepad2;
  if (lower.includes('headphone') || lower.includes('audio') || lower.includes('earbud')) return Headphones;
  if (lower.includes('printer') || lower.includes('printing')) return Printer;
  if (lower.includes('keyboard') || lower.includes('mouse') || lower.includes('peripheral')) return Keyboard;
  if (lower.includes('monitor') || lower.includes('display')) return Monitor;
  if (lower.includes('cpu') || lower.includes('processor') || lower.includes('component')) return Cpu;

  // Home & Furniture
  if (lower.includes('home') || lower.includes('furniture') || lower.includes('living') || lower.includes('house')) return Home;
  if (lower.includes('sofa') || lower.includes('couch') || lower.includes('armchair')) return Sofa;
  if (lower.includes('kitchen') || lower.includes('cookware') || lower.includes('utensil')) return UtensilsCrossed;
  if (lower.includes('refrigerator') || lower.includes('fridge') || lower.includes('appliance')) return Refrigerator;
  if (lower.includes('air conditioner') || lower.includes('ac') || lower.includes('cooling')) return AirVent;
  if (lower.includes('garden') || lower.includes('plant') || lower.includes('outdoor')) return Leaf;

  // Fashion & Apparel
  if (lower.includes('fashion') || lower.includes('clothing') || lower.includes('apparel') || lower.includes('shirt') || lower.includes('dress')) return Shirt;
  if (lower.includes('shoes') || lower.includes('footwear') || lower.includes('sneaker')) return Footprints;
  if (lower.includes('bag') || lower.includes('handbag') || lower.includes('backpack')) return ShoppingBag;
  if (lower.includes('glasses') || lower.includes('eyewear') || lower.includes('sunglasses')) return Glasses;
  if (lower.includes('jewelry') || lower.includes('jewellery') || lower.includes('accessory')) return Gem;
  if (lower.includes('baby') || lower.includes('kids') || lower.includes('children')) return Baby;

  // Beauty & Health
  if (lower.includes('beauty') || lower.includes('makeup') || lower.includes('cosmetic') || lower.includes('skincare')) return Sparkles;
  if (lower.includes('health') || lower.includes('medical') || lower.includes('pharmacy') || lower.includes('wellness')) return HeartPulse;

  // Sports & Fitness
  if (lower.includes('sport') || lower.includes('fitness') || lower.includes('gym') || lower.includes('exercise')) return Dumbbell;

  // Books & Education
  if (lower.includes('book') || lower.includes('literature') || lower.includes('reading')) return BookOpen;
  if (lower.includes('education') || lower.includes('school') || lower.includes('training') || lower.includes('course')) return GraduationCap;

  // Music & Art
  if (lower.includes('music') || lower.includes('instrument') || lower.includes('audio')) return Music;
  if (lower.includes('art') || lower.includes('craft') || lower.includes('painting') || lower.includes('drawing')) return Palette;

  // Tools & Hardware
  if (lower.includes('tool') || lower.includes('hardware') || lower.includes('diy') || lower.includes('repair')) return Wrench;
  if (lower.includes('hammer') || lower.includes('construction')) return Hammer;

  // Vehicles & Travel
  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('auto') || lower.includes('motorcycle')) return Car;
  if (lower.includes('travel') || lower.includes('flight') || lower.includes('airline')) return Plane;

  // Business & Office
  if (lower.includes('business') || lower.includes('office') || lower.includes('corporate')) return Briefcase;

  // Pets
  if (lower.includes('pet') || lower.includes('animal')) return PawPrint;

  // Food & Beverage
  if (lower.includes('coffee') || lower.includes('tea') || lower.includes('beverage')) return Coffee;

  // Gifts
  if (lower.includes('gift') || lower.includes('present')) return Gift;

  // Default
  return Tag;
};

/* ────────── Shop by Category – Simple Icon Above Name (No Cards) ────────── */
const CategoryRow = () => {
  const { data: categories, isLoading } = useQuery(
    'categories',
    () => api.get('/categories').then(res => res.data),
    { staleTime: 0, refetchOnMount: true }
  );

  const mainCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.filter((c: any) => !c.parent_id && !c.ancestry);
  }, [categories]);

  if (isLoading || !mainCategories.length) return null;

  return (
    <div className="relative py-3">
      <div
        className="flex gap-6 overflow-x-auto scrollbar-none pb-2 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {mainCategories.map((cat: any) => {
          const Icon = getCategoryIcon(cat.name);
          return (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="flex-shrink-0 flex flex-col items-center text-center group"
            >
              {/* Simple icon, no card */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                <Icon className="w-8 h-8 sm:w-9 sm:h-9 text-gray-700 group-hover:text-orange-500 transition-colors duration-200" />
              </div>
              <span className="mt-1 text-xs sm:text-sm font-medium text-gray-800 group-hover:text-brand leading-tight whitespace-nowrap">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
      <style>{`.scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

/* ────────── Flash Sale Section ────────── */
const FlashDealSection = ({ products, name }: { products: any[]; name: string }) => {
  if (!products || products.length === 0) return null;

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const deadline = useMemo(() => {
    for (const p of products) {
      if (p.flash_sale_ends_at) {
        const ts = new Date(p.flash_sale_ends_at).getTime();
        if (!isNaN(ts)) return ts;
      }
    }
    return Date.now() + 2 * 60 * 60 * 1000;
  }, [products]);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  useEffect(() => {
    if (totalPages > 1) {
      const interval = setInterval(() => setCurrentPage(prev => (prev + 1) % totalPages), 5000);
      return () => clearInterval(interval);
    }
  }, [totalPages]);

  const displayed = products.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const countdownString = [
    timeLeft.days > 0 ? `${timeLeft.days}d` : '',
    `${String(timeLeft.hours).padStart(2, '0')}h`,
    `${String(timeLeft.minutes).padStart(2, '0')}m`,
    `${String(timeLeft.seconds).padStart(2, '0')}s`,
  ].filter(Boolean).join(' ');

  return (
    <section className="py-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wide">
            {countdownString}
          </span>
          <h2 className="text-lg font-bold text-text-primary">{name}</h2>
        </div>
        <Link to="/products/flash-sales" className="text-xs font-medium text-brand hover:text-brand-hover">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {displayed.map(p => (
          <div key={p.id}><ProductCard product={p} /></div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentPage ? 'bg-brand w-6' : 'bg-gray-300'}`} />
          ))}
        </div>
      )}
    </section>
  );
};

/* ────────── Super + Hot Deals Combined Section ────────── */
const SuperHotCombinedSection = ({
  superProducts,
  hotProducts,
}: {
  superProducts: any[];
  hotProducts: any[];
}) => {
  if (!superProducts.length && !hotProducts.length) return null;

  const [superStart, setSuperStart] = useState(0);
  const [hotStart, setHotStart] = useState(0);

  useEffect(() => {
    if (!superProducts.length && !hotProducts.length) return;
    const interval = setInterval(() => {
      if (superProducts.length > 0) {
        setSuperStart(prev => (prev + 2) % superProducts.length);
      }
      if (hotProducts.length > 0) {
        setHotStart(prev => (prev + 2) % hotProducts.length);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [superProducts.length, hotProducts.length]);

  const displayedSuper = superProducts.length > 0
    ? Array.from({ length: Math.min(3, superProducts.length) }, (_, i) =>
        superProducts[(superStart + i) % superProducts.length]
      )
    : [];
  const displayedHot = hotProducts.length > 0
    ? Array.from({ length: Math.min(3, hotProducts.length) }, (_, i) =>
        hotProducts[(hotStart + i) % hotProducts.length]
      )
    : [];
  const combined = [...displayedSuper, ...displayedHot];

  if (!combined.length) return null;

  return (
    <section className="py-1">
      <div className="flex gap-4 mb-2">
        {superProducts.length > 0 && (
          <Link to="/products/super-deals" className="text-lg font-extrabold text-purple-700 hover:underline">
            Super Deals
          </Link>
        )}
        {hotProducts.length > 0 && (
          <Link to="/products/hot-deals" className="text-lg font-extrabold text-red-500 hover:underline">
            Hot Deals
          </Link>
        )}
      </div>
      <div key={`${superStart}-${hotStart}`} className="flex gap-2 overflow-x-auto scrollbar-none pb-2 animate-in fade-in duration-500">
        {combined.map((p: any) => (
          <div key={p.id} className="flex-shrink-0 w-48 sm:w-52">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <style>{`.scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
    </section>
  );
};

/* ────────── New Arrivals ────────── */
const NewArrivalsSection = ({ products, name }: { products: any[]; name: string }) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-1">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-text-primary">{name}</h2>
        <Link to="/products/new-arrivals" className="text-xs font-medium text-brand">View All →</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {products.slice(0, 15).map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
};

/* ────────── Trending ────────── */
const TopTrendSection = ({ initialProducts, hasMore, name }: any) => {
  if (!initialProducts || initialProducts.length === 0) return null;

  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(hasMore);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !more) return;
    setLoading(true);
    try {
      const res = await api.get(`/products?sort=trending&limit=15&offset=${page * 15}`);
      const newProds = normalizeProducts(res.data);
      if (!newProds.length) setMore(false);
      else { setProducts(prev => [...prev, ...newProds]); setPage(p => p + 1); }
    } catch { setMore(false); }
    finally { setLoading(false); }
  };

  return (
    <section className="py-1">
      <h2 className="text-lg font-bold text-text-primary mb-2">{name}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
      </div>
      {more && (
        <div className="text-center mt-2">
          <button onClick={loadMore} disabled={loading} className="text-xs font-medium text-brand">
            {loading ? 'Loading...' : 'View More →'}
          </button>
        </div>
      )}
    </section>
  );
};

/* ────────── Package Carousel ────────── */
const PackageCarousel = ({ bundles }: { bundles: any[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (!bundles.length) return null;

  return (
    <section className="py-1">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-bold text-text-primary">Bundle Packages</h2>
        <Link to="/packages" className="text-xs font-medium text-brand hover:text-brand-hover">View All →</Link>
      </div>
      <div className="relative group">
        {bundles.length > 5 && (
          <>
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-1.5 rounded-full shadow-card hover:bg-white transition opacity-0 group-hover:opacity-100">
              <ChevronLeft className="w-3.5 h-3.5 text-text-secondary" />
            </button>
            <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-1.5 rounded-full shadow-card hover:bg-white transition opacity-0 group-hover:opacity-100">
              <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
            </button>
          </>
        )}
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {bundles.map((pkg: any) => (
            <div
              key={pkg.id}
              className="snap-start flex-shrink-0 bg-blue-50 rounded-xl p-1
                         w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.4rem)] lg:w-[calc(20%-0.4rem)]"
            >
              <PackageLinkWrapper package={pkg} compact={true} />
            </div>
          ))}
        </div>
      </div>
      <style>{`.scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
    </section>
  );
};

/* ────────── Featured Sellers – Larger Circle & Text, 5 per Slide ────────── */
const FeaturedSellersSection = ({ vendors, name }: { vendors: any[]; name: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalSellers = vendors.length;

  if (totalSellers === 0) return null;

  return (
    <section className="relative py-4 overflow-hidden rounded-3xl">
      {/* Artistic background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#fff3e0] via-[#fce4ec] to-[#e3f2fd]" />
      <div className="absolute top-0 left-0 w-80 h-80 bg-[#ffccbc] opacity-50 rounded-full -translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-72 h-72 bg-[#b3e5fc] opacity-40 rounded-full translate-x-1/3 -translate-y-1/4 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#d1c4e9] opacity-40 rounded-full -translate-x-1/2 translate-y-1/3 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-56 h-56 bg-[#c8e6c9] opacity-50 rounded-full translate-x-1/4 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 z-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sellerPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#ffffff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sellerPattern)" />
        </svg>
      </div>

      <div className="relative z-10 px-5 py-5">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight font-serif">
                {name}
              </h2>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-white/70 text-gray-700 border border-gray-300 shadow-sm backdrop-blur-sm">
                {totalSellers} {totalSellers === 1 ? 'Seller' : 'Sellers'}
              </span>
            </div>
            <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
          </div>
          <p className="text-center text-xs sm:text-sm text-gray-600 mt-1.5 italic tracking-wide">
            Handpicked sellers you can trust
          </p>
        </div>

        {/* Horizontal scroll – 5 per view on desktop */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-none pb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {vendors.map((vendor: any) => (
            <Link
              key={vendor.id}
              to={vendor.is_company ? `/company/${vendor.id}` : `/seller/${vendor.id}`}
              className="flex-shrink-0 w-56 sm:w-64 md:w-72 lg:w-[calc(20%-1rem)] flex flex-col items-center text-center group"
            >
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full bg-white p-1 shadow-lg ring-2 ring-white/70 group-hover:ring-orange-300 transition-all duration-300">
                  <img
                    src={vendor.logo_url || 'https://placehold.co/128x128?text=Logo'}
                    alt={vendor.business_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 mx-auto w-5/6 bg-white/90 backdrop-blur-sm rounded-full shadow px-2 py-1">
                  <span className="block text-sm sm:text-base font-bold text-gray-800 truncate">
                    {vendor.business_name}
                  </span>
                </div>
                {vendor.is_verified && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 shadow">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>

              {vendor.description && (
                <p className="mt-3 w-full text-sm text-gray-700 line-clamp-2 leading-snug">
                  {vendor.description}
                </p>
              )}

              <div className="mt-2 w-full">
                <div className="flex items-center justify-center gap-1 text-base">
                  <Star className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-gray-800">
                    {Number(vendor.rating ?? 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-center gap-1 mt-1 flex-wrap">
                  {vendor.badge && (
                    <span className={`text-sm px-2 py-0.5 rounded-full font-bold border ${
                      vendor.badge === 'platinum' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      vendor.badge === 'gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {vendor.badge.toUpperCase()}
                    </span>
                  )}
                  {vendor.is_company && (
                    <span className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                      COMPANY
                    </span>
                  )}
                </div>
                {vendor.total_sales > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {vendor.total_sales.toLocaleString()} sales
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <style>{`.scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </section>
  );
};

/* ─────────────────── HomePage ─────────────────── */
const HomePage = () => {
  const { data: banners } = useQuery('banners', () =>
    api.get('/api/v1/banners').then(r => r.data)
  );

  const { data: homepageData, isLoading } = useQuery(
    'homepage',
    () => api.get('/api/v1/homepage').then(r => r.data),
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) return (
    <div className="flex justify-center items-center h-64 bg-[#F5F5F5]">
      <div className="text-text-muted text-sm">Loading marketplace...</div>
    </div>
  );

  const promotionalSections = homepageData?.promotional_sections || [];
  const collections = homepageData?.collections || [];

  const packagesSection = promotionalSections.find(
    (s: any) => s?.section_type?.toString().toLowerCase().trim() === 'packages'
  );
  const bundles = packagesSection?.packages || [];

  const superSection = promotionalSections.find(
    (s: any) => s?.section_type?.toLowerCase() === 'super_deal'
  );
  const hotSection = promotionalSections.find(
    (s: any) => s?.section_type?.toLowerCase() === 'hot_deal'
  );
  const superProducts = superSection?.products || [];
  const hotProducts = hotSection?.products || [];

  const nameFromType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const renderSection = (type: string) => {
    const normalizedType = type.toLowerCase();
    const section = promotionalSections.find(
      (s: any) => s?.section_type?.toString().toLowerCase().trim() === normalizedType
    );

    if (!section) {
      const topLevel = homepageData?.[normalizedType] || homepageData?.[type];
      if (Array.isArray(topLevel) && topLevel.length > 0) {
        if (normalizedType === 'featured_vendors' || normalizedType === 'featured_sellers') {
          return (
            <FeaturedSellersSection key={type} vendors={topLevel} name={nameFromType(type)} />
          );
        }
        return (
          <section key={type} className="py-1">
            <h2 className="text-lg font-bold text-text-primary mb-2">{nameFromType(type)}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {topLevel.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        );
      }
      return null;
    }

    const prods = section.products || [];
    const name = section.name || nameFromType(type);

    if (prods.length === 0 && !section.vendors?.length) return null;

    switch (normalizedType) {
      case 'flash_sale':
        return <FlashDealSection key={type} products={prods} name={name} />;
      case 'trending':
        return <TopTrendSection key={type} initialProducts={prods} hasMore={false} name={name} />;
      case 'best_sellers':
        return (
          <section key={type} className="py-1">
            <h2 className="text-lg font-bold text-text-primary mb-2">{name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {prods.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        );
      case 'new_arrivals':
        return <NewArrivalsSection key={type} products={prods} name={name} />;
      case 'featured_vendors':
      case 'featured_sellers':
        return <FeaturedSellersSection key={type} vendors={section.vendors || []} name={name} />;
      default:
        if (normalizedType === 'super_deal' || normalizedType === 'hot_deal') return null;
        if (normalizedType === 'packages') return null;
        return (
          <section key={type} className="py-1">
            <h2 className="text-lg font-bold text-text-primary mb-2">{name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {prods.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        );
    }
  };

  return (
    <div className="w-full bg-[#F5F5F5]">
      <style>{`.hero-carousel .swiper-button-prev, .hero-carousel .swiper-button-next, .hero-carousel .carousel-arrow, .hero-carousel .slick-arrow { display: none !important; }`}</style>
      {banners && banners.length > 0 && (
        <div className="hero-carousel shadow-elevated">
          <div className="max-h-48 sm:max-h-64 md:max-h-none overflow-hidden">
            <HeroCarousel banners={banners} />
          </div>
        </div>
      )}
      <div className="w-full px-2 sm:px-4 py-2">
        <CategoryRow />

        <div className="mt-2 space-y-1">
          {renderSection('flash_sale')}

          <SuperHotCombinedSection superProducts={superProducts} hotProducts={hotProducts} />

          <PackageCarousel bundles={bundles} />
          {renderSection('new_arrivals')}
          {renderSection('featured_vendors')}
          {renderSection('featured_sellers')}

          {collections.length > 0 && (
            <section className="py-1">
              <div className="flex flex-col gap-2">
                {collections.map((col: any) => <CollectionCard key={col.id} collection={col} />)}
              </div>
            </section>
          )}

          {renderSection('trending')}
          {renderSection('best_sellers')}

          {promotionalSections
            .filter((s: any) => {
              const t = s?.section_type?.toString().toLowerCase().trim();
              if (!t) return false;
              const handledTypes = [
                'flash_sale', 'super_deal', 'hot_deal', 'new_arrivals',
                'trending', 'best_sellers', 'featured_vendors', 'featured_sellers',
                'packages'
              ];
              return !handledTypes.includes(t);
            })
            .map((sec: any) => renderSection(sec.section_type?.toString().toLowerCase().trim()))
          }
        </div>
      </div>
    </div>
  );
};

export default HomePage;