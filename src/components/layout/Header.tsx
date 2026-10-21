// src/components/layout/Header.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MagnifyingGlassIcon, ShoppingCartIcon, HeartIcon, UserIcon, ChevronDownIcon,
  ArrowsRightLeftIcon, Bars3Icon, QrCodeIcon, BuildingStorefrontIcon,
  ShieldCheckIcon, BuildingOfficeIcon, TagIcon, CubeIcon,
  ArchiveBoxIcon, FireIcon, SparklesIcon,
  RectangleGroupIcon, CubeTransparentIcon, HandRaisedIcon,
  CurrencyDollarIcon, LifebuoyIcon, ShieldExclamationIcon, ShoppingBagIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useWishlist } from '../../hooks/useWishlist';
import { useComparison } from '../../contexts/ComparisonContext';
import AllCategoriesMegaMenu from './AllCategoriesMegaMenu';
import SearchFilterBar from '../features/search/SearchFilterBar';
import api from '../../lib/axios';
import { buildCategoryTree } from '../../utils/categoryHelpers';
import { expandSynonyms } from '../../utils/searchSynonyms';
import NotificationBell from '../common/NotificationBell';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = () => {
  const { t } = useTranslation();
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const { items: compareItems } = useComparison();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{
    products: any[];
    packages: any[];
    categories: any[];
    brands: any[];
    popular_searches: any[];
  }>({ products: [], packages: [], categories: [], brands: [], popular_searches: [] });
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [rollingPlaceholder, setRollingPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [cartBump, setCartBump] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const ignoreApiRef = useRef(false);
  const lastNavigationRef = useRef(0);

  const placeholderTexts = [
    'iPhone 15 Pro Max', 'Nike Air Max 270', 'Samsung Galaxy S24',
    'MacBook Pro M3', 'Sony WH-1000XM5', 'Organic Coffee Beans', 'Leather Handbag',
  ];

  // Rolling placeholder
  useEffect(() => {
    if (searchQuery.trim() !== '') { setRollingPlaceholder(''); return; }
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim() === '') setRollingPlaceholder(placeholderTexts[placeholderIndex]);
  }, [placeholderIndex, searchQuery]);

  // Cart bump
  useEffect(() => {
    if (cart && cart.item_count > 0) {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cart?.item_count]);

  // Fetch categories
  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        let cats: any[] = [];
        if (Array.isArray(res.data)) cats = res.data;
        else if (res.data?.data && Array.isArray(res.data.data)) cats = res.data.data;
        setCategories(Array.isArray(cats) ? buildCategoryTree(cats) : []);
      })
      .catch(() => setCategories([]));
  }, []);

  // Suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2 || ignoreApiRef.current) {
      setSuggestions({ products: [], packages: [], categories: [], brands: [], popular_searches: [] });
      return;
    }
    try {
      const expanded = expandSynonyms(query);
      const res = await api.get('/api/v1/suggestions', { params: { q: expanded } });
      const data = res.data || {};
      setSuggestions({
        products: data.products || [],
        packages: data.packages || [],
        categories: data.categories || [],
        brands: data.brands || [],
        popular_searches: data.popular_searches || [],
      });
    } catch {
      setSuggestions({ products: [], packages: [], categories: [], brands: [], popular_searches: [] });
    }
  }, []);

  useEffect(() => {
    ignoreApiRef.current = false;
    clearTimeout(debounceRef.current!);
    debounceRef.current = setTimeout(() => fetchSuggestions(searchQuery), 300);
    return () => clearTimeout(debounceRef.current!);
  }, [searchQuery, fetchSuggestions]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSuggestions({ products: [], packages: [], categories: [], brands: [], popular_searches: [] });
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync with URL
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const q = params.get('q') || '';
      setSearchQuery(q);
    } else {
      setSearchQuery('');
    }
    setSuggestions({ products: [], packages: [], categories: [], brands: [], popular_searches: [] });
    ignoreApiRef.current = true;
    lastNavigationRef.current = Date.now();
    const timer = setTimeout(() => { ignoreApiRef.current = false; }, 600);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Roles
  const isSeller = user && ( (user.role_mask & 2) !== 0 || user.role?.toLowerCase() === 'seller' || user.roles?.includes('seller') || user.is_seller );
  const isAdmin = user && ( (user.role_mask & 4) !== 0 || user.role?.toLowerCase() === 'admin' || user.roles?.includes('admin') || user.is_admin );
  const isSubAdmin = user && ( (user.role_mask & 8) !== 0 || user.role?.toLowerCase() === 'sub_admin' || user.roles?.includes('sub_admin') ); // ? ADDED
  const isCompany = user && (user.isCompany || user.role?.toLowerCase() === 'company' || user.roles?.includes('company'));
  const isPartner = user?.logistics_partner ? true : false;

  const getDashboardInfo = () => {
    if (isAdmin) return { label: 'Admin Panel', icon: ShieldCheckIcon, href: '/admin' };
    if (isSubAdmin) return { label: 'Staff Panel', icon: ShieldCheckIcon, href: '/admin' }; // ? ADDED
    if (isSeller) return { label: 'My Shop', icon: BuildingStorefrontIcon, href: '/seller' };
    if (isCompany) return { label: 'B2B Portal', icon: BuildingOfficeIcon, href: '/company/dashboard' };
    return null;
  };
  const dashboardInfo = getDashboardInfo();

  const handleMouseEnter = () => { clearTimeout(closeTimeoutRef.current!); setIsCategoriesOpen(true); };
  const handleMouseLeave = () => { closeTimeoutRef.current = setTimeout(() => setIsCategoriesOpen(false), 200); };
  const goToCompare = () => navigate('/compare');

  const handleQrMouseEnter = () => { clearTimeout(qrTimeoutRef.current!); setShowQR(true); };
  const handleQrMouseLeave = () => { qrTimeoutRef.current = setTimeout(() => setShowQR(false), 200); };

  const submitSearch = (query: string) => {
    if (query.trim()) {
      setSuggestions({ products: [], packages: [], categories: [], brands: [], popular_searches: [] });
      ignoreApiRef.current = true;
      lastNavigationRef.current = Date.now();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      if (user) {
        api.post('/api/v1/saved_searches', { query: query.trim() }).catch(() => {});
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(searchQuery);
  };

  const NotificationBadge = ({ count }: { count?: number }) => {
    if (!count) return null;
    return (
      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white bg-red-600 rounded-full flex items-center justify-center ring-1 ring-white">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  const hasSuggestions =
    suggestions.products.length > 0 ||
    suggestions.packages.length > 0 ||
    suggestions.categories.length > 0 ||
    suggestions.brands.length > 0 ||
    suggestions.popular_searches.length > 0;

  const navigationLinks = (
    <>
      <Link to="/find-shop" className="flex items-center gap-1 hover:text-[#F97519] transition-colors"><BuildingStorefrontIcon className="w-3.5 h-3.5"/> Find Shop</Link>
      <Link to="/all-products" className="flex items-center gap-1 hover:text-[#F97519] transition-colors"><RectangleGroupIcon className="w-3.5 h-3.5"/> All Products</Link>
      <Link to="/packages" className="flex items-center gap-1 hover:text-[#F97519] transition-colors"><CubeTransparentIcon className="w-3.5 h-3.5"/> Packages</Link>
      <Link to="/trade-assurance" className="flex items-center gap-1 hover:text-[#F97519] transition-colors"><ShieldExclamationIcon className="w-3.5 h-3.5"/> Trade Assurance</Link>
      <Link to="/sell" className="flex items-center gap-1 hover:text-[#F97519] transition-colors"><CurrencyDollarIcon className="w-3.5 h-3.5"/> Sell on ET Marketplace</Link>
      <Link to="/buyer-central" className="flex items-center gap-1 hover:text-[#F97519] transition-colors"><ShoppingBagIcon className="w-3.5 h-3.5"/> Buyer Central</Link>
      <Link to="/help" className="flex items-center gap-1 hover:text-[#F97519] transition-colors"><LifebuoyIcon className="w-3.5 h-3.5"/> Help Center</Link>
      <Link to="/order-protection" className="flex items-center gap-1 hover:text-[#F97519] transition-colors"><HandRaisedIcon className="w-3.5 h-3.5"/> Order Protection</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
      {/* -- TOP BAR -- */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-marketplace py-2 flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src="/images/logo.png" className="h-10 w-auto" alt="ET Marketplace" />
            <div className="hidden lg:block border-l border-gray-300 pl-2 ml-2">
              <p className="text-[11px] font-medium text-gray-900 leading-tight">Ethiopia's</p>
              <p className="text-[11px] font-bold text-orange-600 leading-tight">Largest Marketplace</p>
            </div>
          </Link>

          {/* Search bar */}
          <div
            ref={searchContainerRef}
            className="flex-1 max-w-3xl mx-2 relative rounded-full overflow-hidden border-2 border-[#F97519] shadow-[0_0_8px_rgba(249,117,25,0.3)] focus-within:ring-2 focus-within:ring-[#F97519]/50 focus-within:shadow-[0_0_12px_rgba(249,117,25,0.5)] transition-shadow duration-200"
          >
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative flex items-center">
                <input
                  id="header-search"
                  name="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={rollingPlaceholder || 'Search products...'}
                  className="w-full py-1.5 pl-5 px-12 text-[13px] font-medium bg-white border-0 focus:outline-none rounded-l-full text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-[#F97519] text-white hover:bg-[#E86A12] transition-colors active:scale-95"
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="w-3.5 h-3.5" />
                </button>

                {hasSuggestions && searchQuery.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[var(--border-light)] rounded-md shadow-elevated z-[60] max-h-[420px] overflow-y-auto">
                    {suggestions.categories.length > 0 && (
                      <div className="px-2 py-1.5">
                        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Categories</div>
                        {suggestions.categories.map((cat: any) => (
                          <button key={cat.id} onClick={() => { setSearchQuery(cat.name); submitSearch(cat.name); }} className="flex w-full items-center gap-2 px-2 py-1 rounded-sm hover:bg-surface-hover transition-colors">
                            <TagIcon className="w-3.5 h-3.5 text-text-muted" /><span className="text-[13px] text-text-primary">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestions.products.length > 0 && (
                      <div className="px-2 py-1.5">
                        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Products</div>
                        {suggestions.products.map((prod: any) => (
                          <Link key={prod.id} to={`/product/${prod.id}`} onClick={() => setSuggestions({ products: [], packages: [], categories: [], brands: [], popular_searches: [] })} className="flex items-center gap-2 px-2 py-1 rounded-sm hover:bg-surface-hover transition-colors">
                            {prod.image_url ? <img src={prod.image_url} alt="" className="w-7 h-7 rounded object-cover" /> : <CubeIcon className="w-7 h-7 text-text-muted" />}
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] text-text-primary truncate">{prod.title}</div>
                              {prod.price && <div className="text-[11px] text-text-secondary">ETB {prod.price}</div>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {suggestions.packages.length > 0 && (
                      <div className="px-2 py-1.5">
                        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Packages</div>
                        {suggestions.packages.map((pkg: any) => (
                          <Link key={pkg.id} to={`/packages/${pkg.id}`} onClick={() => setSuggestions({ products: [], packages: [], categories: [], brands: [], popular_searches: [] })} className="flex items-center gap-2 px-2 py-1 rounded-sm hover:bg-surface-hover transition-colors">
                            {pkg.image_url ? <img src={pkg.image_url} alt="" className="w-7 h-7 rounded object-cover" /> : <ArchiveBoxIcon className="w-7 h-7 text-text-muted" />}
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] text-text-primary truncate">{pkg.name}</div>
                              {pkg.price && <div className="text-[11px] text-text-secondary">ETB {pkg.price}</div>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {suggestions.brands.length > 0 && (
                      <div className="px-2 py-1.5">
                        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Brands</div>
                        {suggestions.brands.map((brand: any, idx: number) => (
                          <button key={idx} onClick={() => submitSearch(brand.name)} className="flex w-full items-center gap-2 px-2 py-1 rounded-sm hover:bg-surface-hover transition-colors">
                            <BuildingStorefrontIcon className="w-3.5 h-3.5 text-text-muted" /><span className="text-[13px] text-text-primary">{brand.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestions.popular_searches.length > 0 && (
                      <div className="px-2 py-1.5 bg-surface-hover border-t border-[var(--border-light)]">
                        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Popular Searches</div>
                        {suggestions.popular_searches.map((item: any, idx: number) => (
                          <button key={idx} onClick={() => submitSearch(item.query)} className="flex items-center gap-2 w-full px-2 py-1 text-[13px] text-text-primary hover:bg-white rounded-sm">
                            <FireIcon className="w-3.5 h-3.5 text-[#F97519]" />{item.query}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-[var(--border-light)]">
                      <button type="submit" className="w-full px-2 py-1.5 text-[13px] text-text-secondary hover:text-[#F97519] flex items-center gap-2 transition-colors">
                        <MagnifyingGlassIcon className="w-3.5 h-3.5" />See all results for "<span className="font-medium text-text-primary">{searchQuery}</span>"
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Desktop right icons */}
          <div className="hidden md:flex items-center gap-2 text-[13px] font-medium text-gray-900 flex-shrink-0">
            <div className="relative flex items-center gap-1 hover:text-[#F97519] transition-colors cursor-pointer">
              <NotificationBell /><span className="hidden lg:inline">Notifications</span>
            </div>
            <div className="relative" onMouseEnter={handleQrMouseEnter} onMouseLeave={handleQrMouseLeave}>
              <button className="flex items-center gap-1 hover:text-[#F97519] transition-colors">
                <QrCodeIcon className="w-4 h-4" /><span className="hidden xl:inline">Get App</span>
              </button>
              {showQR && (
                <div className="absolute right-0 top-full mt-2 bg-white shadow-elevated border border-[var(--border-light)] rounded-md p-2 z-50" onMouseEnter={handleQrMouseEnter} onMouseLeave={handleQrMouseLeave}>
                  <img src="/images/app-qr.png" alt="Download App" className="w-24 h-24 object-contain rounded" />
                  <p className="text-[11px] text-text-muted text-center mt-1">Scan to download</p>
                </div>
              )}
            </div>
            {dashboardInfo && (
              <Link to={dashboardInfo.href} className="flex items-center gap-1 hover:text-[#F97519] transition-colors">
                <dashboardInfo.icon className="w-4 h-4" /><span className="hidden xl:inline">{dashboardInfo.label}</span>
              </Link>
            )}
            {isPartner && (
              <Link to="/partner/board" className="flex items-center gap-1 hover:text-[#F97519] transition-colors">
                <TruckIcon className="w-4 h-4" /><span className="hidden xl:inline">Partner</span>
              </Link>
            )}
            <Link to="/wishlist" className="relative flex items-center gap-1 hover:text-[#F97519] transition-colors">
              <HeartIcon className="w-4 h-4" /><span className="hidden lg:inline">Wishlist</span>
              <NotificationBadge count={wishlist.items.length} />
            </Link>
            <button onClick={goToCompare} className="relative flex items-center gap-1 hover:text-[#F97519] transition-colors">
              <ArrowsRightLeftIcon className="w-4 h-4" /><span className="hidden lg:inline">Compare</span>
              <NotificationBadge count={compareItems.length} />
            </button>
            <Link to="/cart" className={`relative flex items-center gap-1 hover:text-[#F97519] transition-colors ${cartBump ? 'animate-bump' : ''}`}>
              <ShoppingCartIcon className="w-4 h-4" /><span className="hidden sm:inline">Cart</span>
              <NotificationBadge count={cart?.item_count || 0} />
            </Link>
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-[#F97519] transition-colors">
                  <UserIcon className="w-4 h-4" />
                  <div className="text-left hidden sm:block">
                    <div className="text-[10px] leading-tight text-gray-500">Welcome</div>
                    <div className="flex items-center gap-0.5 font-medium text-[12px]">{user.name || 'User'}<ChevronDownIcon className="w-3 h-3" /></div>
                  </div>
                </button>
                <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div className="bg-white shadow-elevated border border-[var(--border-light)] rounded-md py-1 min-w-[160px]">
                    <Link to="/profile" className="block px-3 py-1.5 text-[13px] text-text-primary hover:bg-surface-hover">My Profile</Link>
                    <Link to="/orders" className="block px-3 py-1.5 text-[13px] text-text-primary hover:bg-surface-hover">My Orders</Link>
                    <div className="border-t border-[var(--border-light)] my-0.5"></div>
                    <button onClick={() => { logout(); navigate('/'); }} className="block w-full text-left px-3 py-1.5 text-[13px] text-text-primary hover:bg-surface-hover">Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="font-medium hover:text-[#F97519] transition-colors whitespace-nowrap">Sign in / Register</Link>
            )}
          </div>

          {/* Mobile right: cart icon + hamburger */}
          <div className="flex md:hidden items-center gap-2 flex-shrink-0">
            <Link to="/cart" className={`relative p-1 hover:text-[#F97519] ${cartBump ? 'animate-bump' : ''}`}>
              <ShoppingCartIcon className="w-5 h-5" />
              <NotificationBadge count={cart?.item_count || 0} />
            </Link>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-900 hover:text-[#F97519]">
                  <Bars3Icon className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-4/5 max-w-sm p-0 bg-white text-gray-900">
                <div className="flex flex-col h-full">
                  <div className="flex items-center p-4 border-b">
                    <span className="font-semibold text-lg">Menu</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</p>
                      <div className="flex flex-col gap-2">
                        {navigationLinks}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</p>
                      {user ? (
                        <>
                          <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-1.5 text-sm text-gray-900 hover:text-[#F97519]">
                            <UserIcon className="w-4 h-4" /> My Profile
                          </Link>
                          <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-1.5 text-sm text-gray-900 hover:text-[#F97519]">
                            <ArchiveBoxIcon className="w-4 h-4" /> My Orders
                          </Link>
                          <button onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }} className="flex items-center gap-2 py-1.5 text-sm text-gray-900 hover:text-[#F97519]">
                            <UserIcon className="w-4 h-4" /> Logout
                          </button>
                        </>
                      ) : (
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-1.5 text-sm text-gray-900 hover:text-[#F97519]">
                          <UserIcon className="w-4 h-4" /> Sign in / Register
                        </Link>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Links</p>
                      <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-1.5 text-sm text-gray-900 hover:text-[#F97519]">
                        <HeartIcon className="w-4 h-4" /> Wishlist {wishlist.items.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{wishlist.items.length}</span>}
                      </Link>
                      <button onClick={() => { goToCompare(); setMobileMenuOpen(false); }} className="flex items-center gap-2 py-1.5 text-sm text-gray-900 hover:text-[#F97519]">
                        <ArrowsRightLeftIcon className="w-4 h-4" /> Compare {compareItems.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{compareItems.length}</span>}
                      </button>
                      <div className="flex items-center gap-2 py-1.5 text-sm text-gray-900 hover:text-[#F97519]">
                        <NotificationBell /> Notifications
                      </div>
                      <div className="flex items-center gap-2 py-1.5 text-sm text-gray-600">
                        <QrCodeIcon className="w-4 h-4" /> Get App (QR)
                      </div>
                      {dashboardInfo && (
                        <Link to={dashboardInfo.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-1.5 text-sm font-medium text-[#F97519]">
                          <dashboardInfo.icon className="w-4 h-4" /> {dashboardInfo.label}
                        </Link>
                      )}
                      {isPartner && (
                        <Link to="/partner/board" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-1.5 text-sm font-medium text-[#F97519]">
                          <TruckIcon className="w-4 h-4" /> Partner Dashboard
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* -- BOTTOM NAVIGATION – now white background, dark text -- */}
      <nav className="hidden md:block bg-white text-gray-900 border-b border-gray-200 relative" onMouseLeave={handleMouseLeave}>
        <div className="container-marketplace flex justify-between py-2 text-[13px] font-medium">
          {location.pathname === '/search' ? (
            <SearchFilterBar />
          ) : (
            <div className="flex items-center gap-5">
              <div className="relative" onMouseEnter={handleMouseEnter}>
                <button className="flex items-center gap-1.5 font-semibold hover:text-[#F97519] transition-colors">
                  <Bars3Icon className="w-4 h-4" />All Categories
                </button>
              </div>
              {navigationLinks}
            </div>
          )}
          <div className="flex items-center gap-5">
            {/* right side links can be left empty or duplicated; currently empty */}
          </div>
        </div>
        {isCategoriesOpen && (
          <div className="absolute left-0 right-0 top-full z-[60]" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <AllCategoriesMegaMenu categories={categories} onClose={() => setIsCategoriesOpen(false)} />
          </div>
        )}
      </nav>

      <style>{`
        @keyframes bump { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        .animate-bump { animation: bump 0.3s ease-in-out; }
      `}</style>
    </header>
  );
};

export default Header;