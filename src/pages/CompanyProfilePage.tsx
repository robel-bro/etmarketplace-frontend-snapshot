// et_marketplace_frontend/src/pages/CompanyProfilePage.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FunnelIcon } from "@heroicons/react/24/outline";
import api from "../lib/axios";
import ReviewList from "../components/features/reviews/ReviewList";
import VendorFilterPanel from "../components/features/vendors/VendorFilterPanel";

/* ── Filter state interface ── */
export interface VendorFilterState {
  search: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  selectedCategories: string[];
  selectedRatings: number[];
  selectedDelivery: string[];
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
const toNum = (v: any) => Number(v || 0);
const fmtETB = (n: number) =>
  `ETB ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const joinAttrs = (attrs: Record<string, string>) => Object.values(attrs).join(" · ");

/* ══════════════════════════════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════════════════════════════ */
const AnimCounter = ({
  to,
  duration = 1200,
  decimals = 0,
  suffix = "",
}: {
  to: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
}) => {
  const [val, setVal] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const t0Ref = useRef(0);

  const run = useCallback(() => {
    t0Ref.current = 0;
    const step = (ts: number) => {
      if (!t0Ref.current) t0Ref.current = ts;
      const pct = Math.min((ts - t0Ref.current) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(parseFloat((ease * to).toFixed(decimals)));
      if (pct < 1) rafRef.current = requestAnimationFrame(step);
      else setVal(to);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [to, duration, decimals]);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    if (spanRef.current) io.observe(spanRef.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [run]);

  return (
    <span ref={spanRef} className="tabular-nums text-black">
      {decimals > 0 ? val.toFixed(decimals) : val.toLocaleString("en-US")}
      {suffix}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════
   STAR ROW
══════════════════════════════════════════════════════════════ */
const StarRow = ({ n, size = "sm" }: { n: number; size?: "sm" | "md" | "lg" }) => {
  const dim = size === "lg" ? "w-5 h-5" : size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`${dim} flex-shrink-0 ${i <= Math.round(n) ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════
   BADGE / CHIP
══════════════════════════════════════════════════════════════ */
type BadgeVariant = "verified" | "platinum" | "gold" | "bulk" | "enterprise" | "deal" | "free";

const BADGE_CLS: Record<BadgeVariant, string> = {
  verified:   "bg-emerald-50  text-emerald-700 ring-1 ring-emerald-200",
  platinum:   "bg-violet-50   text-violet-700  ring-1 ring-violet-200",
  gold:       "bg-amber-50    text-amber-700   ring-1 ring-amber-200",
  bulk:       "bg-blue-50     text-blue-700    ring-1 ring-blue-200",
  enterprise: "bg-slate-100   text-slate-700   ring-1 ring-slate-200",
  deal:       "bg-red-50      text-red-600     ring-1 ring-red-200",
  free:       "bg-emerald-50  text-emerald-700 ring-1 ring-emerald-200",
};

const Chip = ({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${BADGE_CLS[variant]}`}>
    {children}
  </span>
);

/* ══════════════════════════════════════════════════════════════
   MICRO LABEL
══════════════════════════════════════════════════════════════ */
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold tracking-[0.14em] text-black uppercase mb-0.5">
    {children}
  </p>
);

/* ══════════════════════════════════════════════════════════════
   HAIRLINE DIVIDER
══════════════════════════════════════════════════════════════ */
const HR = ({ className = "" }: { className?: string }) => (
  <hr className={`border-gray-100 ${className}`} />
);

/* ══════════════════════════════════════════════════════════════
   INFO CARD
══════════════════════════════════════════════════════════════ */
const InfoCard = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
      <div className="w-0.5 h-4 bg-[#F97519] rounded-full flex-shrink-0" />
      <h3 className="text-[11px] font-bold tracking-[0.12em] text-black uppercase">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   SECTION HEAD
══════════════════════════════════════════════════════════════ */
const SectionHead = ({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 mb-6">
    <div>
      <h2 className="text-xl font-extrabold text-black tracking-tight leading-none">{title}</h2>
      {sub && <p className="text-xs text-black mt-1">{sub}</p>}
    </div>
    {action}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════════ */
const EmptySlate = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center py-28 gap-4">
    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <p className="text-sm text-black font-medium">{text}</p>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   PRODUCT CARD (now clickable)
══════════════════════════════════════════════════════════════ */
const ProductCard = ({
  product,
  showDealBadge = false,
  onNavigate,
}: {
  product: any;
  showDealBadge?: boolean;
  onNavigate: (id: number) => void;
}) => {
  const img = product.image_urls?.[0];
  const p = toNum(product.effective_price ?? product.price);
  const variants = product.variants || [];
  const discountPct =
    product.original_price && product.original_price > p
      ? Math.round(100 - (p / product.original_price) * 100)
      : 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => onNavigate(product.id)}
      className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden
                 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/60
                 transition-all duration-200 cursor-pointer shadow-sm"
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-50 overflow-hidden flex-shrink-0">
        {img ? (
          <img
            src={img}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}

        {/* Deal badge */}
        {showDealBadge && discountPct > 0 && (
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-[#F97519] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
              -{discountPct}%
            </span>
          </div>
        )}

        {/* Free shipping */}
        {product.free_shipping && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 bg-white/95 shadow-sm text-emerald-600
                             text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12L19 8" />
              </svg>
              Free
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-[13px] font-semibold text-black leading-snug line-clamp-2
                       group-hover:text-[#F97519] transition-colors duration-150">
          {product.title}
        </h3>

        {product.description && (
          <p className="text-[11px] text-black mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {variants.slice(0, 3).map((v: any, i: number) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 bg-gray-100 text-black rounded-md border border-gray-300 font-medium"
              >
                {joinAttrs(v.attributes)}
              </span>
            ))}
            {variants.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-black rounded-md border border-gray-300">
                +{variants.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-2.5 space-y-1">
            {Object.entries(product.specifications)
              .slice(0, 2)
              .map(([k, v]: [string, any]) => (
                <div key={k} className="text-[10px] text-black">
                  <span className="font-semibold">{k}:</span> {v}
                </div>
              ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-gray-100 mt-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <StarRow n={product.rating} size="sm" />
                <span className="text-[11px] font-semibold text-black tabular-nums">
                  {product.rating}
                </span>
                <span className="text-[11px] text-black">
                  ({product.reviews_count?.toLocaleString()})
                </span>
              </div>
              {product.sold_count > 0 && (
                <p className="text-[10px] text-black tabular-nums">
                  {product.sold_count.toLocaleString()} sold
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[15px] font-extrabold text-[#F97519] leading-none tabular-nums">
                {fmtETB(p)}
              </div>
              {product.original_price && product.original_price > p && (
                <div className="text-[10px] text-black line-through tabular-nums mt-0.5">
                  {fmtETB(product.original_price)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════
   PACKAGE CARD
══════════════════════════════════════════════════════════════ */
const PackageCard = ({ pkg }: { pkg: any }) => {
  const savings = pkg.original_price - pkg.price;
  const pct = Math.round((savings / pkg.original_price) * 100);
  const img = pkg.image_urls?.[0];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden
                 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/60
                 transition-all duration-200 cursor-pointer shadow-sm"
    >
      <div className="relative h-44 bg-gray-50 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={pkg.name}
            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12L19 8M10 12v4M14 12v4" />
            </svg>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-[#F97519] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
            Save {pct}%
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-[13px] font-semibold text-black leading-snug line-clamp-2
                       group-hover:text-[#F97519] transition-colors">
          {pkg.name}
        </h3>
        {pkg.description && (
          <p className="text-[11px] text-black mt-1.5 line-clamp-2 leading-relaxed">
            {pkg.description}
          </p>
        )}
        <HR className="my-3" />
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-extrabold text-[#F97519] tabular-nums">
            {fmtETB(pkg.price)}
          </span>
          <span className="text-xs text-black line-through tabular-nums">
            {fmtETB(pkg.original_price)}
          </span>
        </div>
        <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
          You save {fmtETB(savings)}
        </p>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════
   TAB ICONS
══════════════════════════════════════════════════════════════ */
type Tab = "products" | "deals" | "packages" | "about" | "reviews";

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  products: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  deals: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  packages: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12h12L19 8M10 12v4M14 12v4" />
    </svg>
  ),
  about: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  reviews: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

/* ══════════════════════════════════════════════════════════════
   CATEGORY MAP (global, built once)
══════════════════════════════════════════════════════════════ */
let categoryMap: Record<string, string[]> = {};

const buildCategoryMap = (categories: any[]) => {
  const map: Record<string, string[]> = {};
  const rootNodes = categories.filter((c: any) => !c.parent_id && !c.ancestry);
  const getChildren = (parentId: number | null): any[] =>
    categories.filter((c: any) => c.parent_id === parentId);
  const walk = (node: any, parentName: string) => {
    const currentName = node.name;
    if (!map[parentName]) map[parentName] = [];
    map[parentName].push(currentName);
    getChildren(node.id).forEach(child => walk(child, currentName));
  };
  rootNodes.forEach(root => {
    map[root.name] = [root.name];
    getChildren(root.id).forEach(child => walk(child, root.name));
  });
  categoryMap = map;
};

const defaultFilters: VendorFilterState = {
  search: '',
  sort: '',
  minPrice: '',
  maxPrice: '',
  selectedCategories: [],
  selectedRatings: [],
  selectedDelivery: [],
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
const CompanyProfilePage = () => {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();

  const companyId =
    routeId ||
    new URLSearchParams(window.location.search).get("id") ||
    window.location.pathname.split("/").filter(Boolean).pop() ||
    "";

  const [tab, setTab] = useState<Tab>("products");
  const [scrolled, setScrolled] = useState(false);

  // Separate filter state for products/deals and packages
  const [productFilters, setProductFilters] = useState<VendorFilterState>(defaultFilters);
  const [packageFilters, setPackageFilters] = useState<VendorFilterState>(defaultFilters);
  const [productFilterOpen, setProductFilterOpen] = useState(false);
  const [packageFilterOpen, setPackageFilterOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Data fetching
  const { data: company, isLoading, error } = useQuery(
    ["vendor", companyId],
    () => api.get(`/api/v1/vendors/${companyId}`).then((res) => res.data),
    { staleTime: 5 * 60 * 1000, enabled: !!companyId }
  );

  const { data: filterMeta } = useQuery(
    ['vendorFilterOptions', companyId],
    () => api.get(`/api/v1/vendors/${companyId}/filter_options`).then(res => res.data),
    { enabled: !!companyId }
  );

  const { data: allCategories } = useQuery('allCategories', () =>
    api.get('/categories').then(res => res.data)
  );
  useEffect(() => { if (allCategories) buildCategoryMap(allCategories); }, [allCategories]);

  const allProducts = company?.products || [];
  const allDeals = company?.discounts || [];
  const allPackages = company?.packages || [];

  // ======= IDENTICAL filtering logic as FindShopPage =======
  const applyProducts = useCallback(
    (list: any[]) => {
      if (!list || list.length === 0) return [];
      const f = productFilters;
      let filtered = [...list];

      if (f.search.trim()) {
        filtered = filtered.filter(item => item.title?.toLowerCase().includes(f.search.toLowerCase()));
      }

      if (f.selectedCategories.length > 0) {
        const expanded = new Set<string>();
        f.selectedCategories.forEach(sel => {
          expanded.add(sel);
          if (categoryMap[sel]) categoryMap[sel].forEach(sub => expanded.add(sub));
        });
        filtered = filtered.filter(item => {
          const cat = item.category?.name || '';
          return expanded.has(cat);
        });
      }

      if (f.selectedDelivery.length > 0) {
        filtered = filtered.filter(item => f.selectedDelivery.includes(item.delivery_label));
      }

      if (f.minPrice) {
        filtered = filtered.filter(item => toNum(item.effective_price || item.price) >= Number(f.minPrice));
      }
      if (f.maxPrice) {
        filtered = filtered.filter(item => toNum(item.effective_price || item.price) <= Number(f.maxPrice));
      }

      if (f.selectedRatings.length > 0) {
        const minR = Math.min(...f.selectedRatings);
        filtered = filtered.filter(item => (item.rating || 0) >= minR);
      }

      switch (f.sort) {
        case 'price_asc': filtered.sort((a,b) => toNum(a.effective_price||a.price) - toNum(b.effective_price||b.price)); break;
        case 'price_desc': filtered.sort((a,b) => toNum(b.effective_price||b.price) - toNum(a.effective_price||a.price)); break;
        case 'rating': filtered.sort((a,b) => (b.rating||0) - (a.rating||0)); break;
        case 'newest': filtered.sort((a,b) => (b.id||0) - (a.id||0)); break;
      }
      return filtered;
    },
    [productFilters]
  );

  const applyPackages = useCallback(
    (list: any[]) => {
      if (!list || list.length === 0) return [];
      const f = packageFilters;
      let filtered = [...list];

      if (f.search.trim()) {
        filtered = filtered.filter(item => item.name?.toLowerCase().includes(f.search.toLowerCase()));
      }

      if (f.selectedCategories.length > 0) {
        const expanded = new Set<string>();
        f.selectedCategories.forEach(sel => {
          expanded.add(sel);
          if (categoryMap[sel]) categoryMap[sel].forEach(sub => expanded.add(sub));
        });
        filtered = filtered.filter(item => {
          const itemCats = item.categories?.map((c: any) => c.name) || [];
          return itemCats.some(name => expanded.has(name));
        });
      }

      if (f.selectedDelivery.length > 0) {
        filtered = filtered.filter(item => f.selectedDelivery.includes(item.delivery_label));
      }

      if (f.minPrice) {
        filtered = filtered.filter(item => toNum(item.price) >= Number(f.minPrice));
      }
      if (f.maxPrice) {
        filtered = filtered.filter(item => toNum(item.price) <= Number(f.maxPrice));
      }

      switch (f.sort) {
        case 'price_asc': filtered.sort((a,b) => toNum(a.price) - toNum(b.price)); break;
        case 'price_desc': filtered.sort((a,b) => toNum(b.price) - toNum(a.price)); break;
      }
      return filtered;
    },
    [packageFilters]
  );

  const filteredProducts = useMemo(() => applyProducts(allProducts), [allProducts, applyProducts]);
  const filteredDeals = useMemo(() => applyProducts(allDeals), [allDeals, applyProducts]);
  const filteredPackages = useMemo(() => applyPackages(allPackages), [allPackages, applyPackages]);

  // Early returns after hooks
  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] text-black text-sm">
        No company ID provided.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="w-10 h-10 border-4 border-[#F97519] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] text-black text-sm">
        Company not found.
      </div>
    );
  }

  const lat = company.latitude ? parseFloat(company.latitude) : null;
  const lng = company.longitude ? parseFloat(company.longitude) : null;
  const mapSrc =
    lat && lng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`
      : null;

  const tabCount: Partial<Record<Tab, number>> = {
    products: filteredProducts.length,
    deals: filteredDeals.length,
    packages: filteredPackages.length,
    reviews: company.reviews_count || 0,
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans antialiased" style={{ colorScheme: "light" }}>
      {/* ═══ STICKY HEADER ═══ */}
      <header
        className="sticky top-0 z-50 bg-white transition-all duration-200"
        style={{
          borderBottom: scrolled ? "1px solid #E5E7EB" : "1px solid transparent",
          boxShadow: scrolled ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-black hover:text-black transition-colors text-sm font-medium flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>

          <AnimatePresence>
            {scrolled && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-2.5 flex-shrink-0"
              >
                <div className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                  {company.logo_url && (
                    <img src={company.logo_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="text-sm font-bold text-black truncate max-w-[160px] hidden sm:block">
                  {company.business_name}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <nav className="flex-1 flex justify-center overflow-x-auto">
            <div className="flex items-center gap-0.5">
              {(["products", "deals", "packages", "about", "reviews"] as Tab[]).map((key) => {
                const active = tab === key;
                const count = tabCount[key];
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
                      active ? "text-[#F97519] bg-orange-50" : "text-black hover:text-black hover:bg-gray-50"
                    }`}
                  >
                    <span className={active ? "text-[#F97519]" : "text-black"}>{TAB_ICONS[key]}</span>
                    <span className="hidden sm:inline">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    {count !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                          active ? "bg-orange-100 text-[#F97519]" : "bg-gray-100 text-black"
                        }`}
                      >
                        {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              className="hidden sm:flex items-center gap-2 bg-[#F97519] hover:bg-orange-500 text-white text-[13px] font-bold px-4 py-2 rounded-lg transition-colors flex-shrink-0 shadow-sm shadow-orange-200"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Contact Now
            </a>
          )}
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="bg-white border-b border-gray-200">
        <div className="relative h-52 md:h-64 bg-gray-100 overflow-hidden">
          {company.banner_url && (
            <img src={company.banner_url} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="flex flex-col sm:flex-row items-start gap-5 -mt-12 relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-gray-200 shadow-xl overflow-hidden flex-shrink-0">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.business_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-black text-2xl font-extrabold">
                  {company.business_name[0]}
                </div>
              )}
            </div>

            <div className="flex-1 pt-1 sm:mt-9">
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {company.is_verified && (
                  <Chip variant="verified">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </Chip>
                )}
                {company.membership_tier === "platinum" && <Chip variant="platinum">◆ Platinum</Chip>}
                {company.membership_tier === "gold" && <Chip variant="gold">◆ Gold</Chip>}
                {company.is_bulk_supplier && <Chip variant="bulk">Bulk Supplier</Chip>}
                {company.is_company && <Chip variant="enterprise">Enterprise</Chip>}
                {company.established_year && (
                  <Chip variant="enterprise">Est. {company.established_year}</Chip>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight leading-none">
                {company.business_name}
              </h1>
              <p className="text-[13px] text-black mt-2 max-w-2xl leading-relaxed line-clamp-2">
                {company.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center gap-1.5 text-[12px] text-black bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <StarRow n={company.rating} size="sm" />
                  <span className="font-bold text-black">{company.rating}</span>
                  <span className="text-black">({company.reviews_count?.toLocaleString()} reviews)</span>
                </div>
                {company.city && (
                  <div className="flex items-center gap-1.5 text-[12px] text-black bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                    <svg className="w-3.5 h-3.5 text-[#F97519]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {company.city}, {company.country}
                  </div>
                )}
                {company.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {company.phone}
                  </a>
                )}
              </div>

              {company.categories && company.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {company.categories.map((c: any) => (
                    <span
                      key={typeof c === "string" ? c : c.name}
                      className="text-[11px] px-2 py-0.5 bg-orange-50 text-[#F97519] border border-orange-200 rounded-full font-medium"
                    >
                      {typeof c === "string" ? c : c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { label: "Avg. Rating", to: company.rating || 0, decimals: 1 },
              { label: "Total Reviews", to: company.reviews_count || 0, decimals: 0, suffix: "" },
              { label: "Active Products", to: company.products_count || 0, decimals: 0 },
              { label: "Fulfilled Orders", to: company.total_sales || 0, decimals: 0, suffix: "+" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="px-6 py-5"
              >
                <Label>{s.label}</Label>
                <div className="text-2xl font-extrabold text-black tracking-tight leading-none">
                  <AnimCounter to={s.to} decimals={s.decimals} suffix={s.suffix || ""} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filter button for product/deal/package tabs */}
        {(tab === "products" || tab === "deals") && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setProductFilterOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition shadow-sm"
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>
          </div>
        )}
        {tab === "packages" && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setPackageFilterOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition shadow-sm"
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {tab === "products" && (
            <motion.div key="products" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
              <SectionHead title="Product Catalog" sub={`${filteredProducts.length} active listings`} />
              {filteredProducts.length === 0 ? (
                <EmptySlate text="No products match your filters." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((p: any) => (
                    <ProductCard key={p.id} product={p} onNavigate={(id) => navigate(`/products/${id}`)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "deals" && (
            <motion.div key="deals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SectionHead
                title="Active Deals"
                sub={`${filteredDeals.length} offers`}
                action={
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Live Deals
                  </span>
                }
              />
              {filteredDeals.length === 0 ? (
                <EmptySlate text="No deals match your filters." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDeals.map((p: any) => (
                    <ProductCard key={p.id} product={p} showDealBadge onNavigate={(id) => navigate(`/products/${id}`)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "packages" && (
            <motion.div key="packages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SectionHead title="Bundle Packages" sub={`${filteredPackages.length} curated bundles`} />
              {filteredPackages.length === 0 ? (
                <EmptySlate text="No packages match your filters." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPackages.map((pkg: any) => (
                    <PackageCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "about" && (
            <motion.div key="about" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-5xl">
              <SectionHead title={`About ${company.business_name}`} sub="Company profile & policies" />
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 space-y-4">
                  <InfoCard title="Company Overview">
                    <p className="text-sm text-black leading-relaxed">{company.description || "A trusted wholesale supplier."}</p>
                    <HR className="my-4" />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {[
                        { label: "Address", val: company.business_address },
                        { label: "City", val: company.city },
                        { label: "Phone", val: company.phone },
                        { label: "Email", val: company.email },
                        { label: "Website", val: company.website },
                        { label: "Established", val: company.established_year?.toString() },
                        { label: "Membership", val: company.membership_tier?.toUpperCase() },
                        { label: "Verified", val: company.is_verified ? "✓ Yes" : "No" },
                        { label: "Bulk Supplier", val: company.is_bulk_supplier ? "✓ Yes" : "No" },
                      ]
                        .filter((f) => f.val)
                        .map((f) => (
                          <div key={f.label}>
                            <Label>{f.label}</Label>
                            <p className="text-sm text-black font-semibold">{f.val}</p>
                          </div>
                        ))}
                    </div>
                  </InfoCard>

                  {[
                    { title: "Returns Policy", body: company.return_policy },
                    { title: "Shipping Policy", body: company.shipping_policy },
                    { title: "Payment Policy", body: company.payment_policy },
                  ].map((pol) => (
                    <InfoCard key={pol.title} title={pol.title}>
                      <p className="text-sm text-black leading-relaxed">{pol.body || "Not specified."}</p>
                    </InfoCard>
                  ))}
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <InfoCard title="Location">
                    {mapSrc ? (
                      <>
                        <div className="rounded-lg overflow-hidden border border-gray-100 aspect-square w-full">
                          <iframe
                            title="Vendor Location"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            src={mapSrc}
                            className="w-full h-full"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex items-start gap-2 mt-3">
                          <svg className="w-4 h-4 text-[#F97519] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-black leading-relaxed">
                            {company.business_address}, {company.city}, {company.country}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-black text-sm">
                        No location data available.
                      </div>
                    )}
                  </InfoCard>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "reviews" && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl">
              <SectionHead title="Customer Reviews" sub={`${company.reviews_count} verified reviews`} />
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <ReviewList vendorId={Number(companyId)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {company.logo_url && (
              <div className="w-7 h-7 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                <img src={company.logo_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-xs text-black font-medium">
              {company.business_name} · {company.city}, {company.country}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-black flex-wrap justify-center">
            {company.established_year && <span>Est. {company.established_year}</span>}
            <span>·</span>
            <span className="text-[#F97519] font-bold">
              ◆ {company.membership_tier?.toUpperCase()}
            </span>
            {company.is_verified && (
              <>
                <span>·</span>
                <span className="text-emerald-700 font-semibold">✓ Verified Supplier</span>
              </>
            )}
            <span>·</span>
            <span>Powered by ET Marketplace</span>
          </div>
        </div>
      </footer>

      {/* ═══ FILTER PANELS (key forces remount when meta loads) ═══ */}
      {filterMeta && (
        <>
          <VendorFilterPanel
            key={`products-${JSON.stringify(filterMeta?.products?.delivery_options)}`}
            open={productFilterOpen}
            onClose={() => setProductFilterOpen(false)}
            filters={productFilters}
            onApply={setProductFilters}
            meta={filterMeta}
            section="products"
            categoryMap={categoryMap}
          />
          <VendorFilterPanel
            key={`packages-${JSON.stringify(filterMeta?.packages?.delivery_options)}`}
            open={packageFilterOpen}
            onClose={() => setPackageFilterOpen(false)}
            filters={packageFilters}
            onApply={setPackageFilters}
            meta={filterMeta}
            section="packages"
            categoryMap={categoryMap}
          />
        </>
      )}
    </div>
  );
};

export default CompanyProfilePage;