// src/components/features/products/FilterSidebar.tsx
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useLocation } from 'react-router-dom';
import { Search, X, ChevronDown, SlidersHorizontal, Star } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { ScrollArea } from '../../ui/scroll-area';
import { Separator } from '../../ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import api from '../../../lib/axios';

const displayDelivery = (text: string) => text.replace(/Shipping/gi, 'Delivery');

interface FilterSidebarProps {
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;
  onClose?: () => void;
  isMobile?: boolean;
  currentCategoryId?: number;
  type?: 'product' | 'package';
}

export default function FilterSidebar({
  searchParams,
  setSearchParams,
  onClose,
  isMobile = false,
  currentCategoryId,
  type = 'product',
}: FilterSidebarProps) {
  const location = useLocation();

  const initialCategories = searchParams.getAll('category').map(Number);
  const initialBrands = searchParams.getAll('brand');
  const initialRatings = searchParams.getAll('rating').map(Number);
  const initialDelivery = searchParams.getAll('delivery');
  const initialSortBy = searchParams.get('sort') || 'relevance';
  const initialPriceMin = Number(searchParams.get('price_min')) || 0;
  const initialPriceMax = Number(searchParams.get('price_max')) || 10000;

  const [brandSearch, setBrandSearch] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isBrandOpen, setIsBrandOpen] = useState(true);
  const [isRatingOpen, setIsRatingOpen] = useState(true);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(true);
  const [priceMinDraft, setPriceMinDraft] = useState('');
  const [priceMaxDraft, setPriceMaxDraft] = useState('');
  const [openAttributes, setOpenAttributes] = useState<Record<string, boolean>>({});

  // ★ Ultimate category source
  const mostSpecificCategoryId = useMemo(() => {
    if (initialCategories.length > 0) return initialCategories[initialCategories.length - 1];
    if (currentCategoryId != null) return currentCategoryId;
    const match = location.pathname.match(/\/category\/(\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  }, [initialCategories, currentCategoryId, location.pathname]);

  const searchQuery = searchParams.get('q') || '';

  const filterEndpoint = type === 'package' ? '/packages/filter_options' : '/products/filter_options';

  const { data: filterData } = useQuery(
    ['filterOptions', mostSpecificCategoryId, searchQuery, type, searchParams.toString()],
    async () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('category');
      if (mostSpecificCategoryId) params.set('category', String(mostSpecificCategoryId));
      if (searchQuery) params.set('q', searchQuery);
      const res = await api.get(filterEndpoint, { params });
      return res.data;
    },
    { staleTime: 2 * 60 * 1000 }
  );

  // ★ Normalise brands: accept both string array and object array
  const rawBrands: any[] = filterData?.brands || [];
  const brands = useMemo(() => {
    return rawBrands.map(item => {
      if (typeof item === 'string') return { name: item, count: undefined };
      return { name: item.name, count: item.count };
    });
  }, [rawBrands]);

  const categories = filterData?.categories || [];
  const priceRange = filterData?.price_range || { min: 0, max: 10000 };
  const ratings = filterData?.ratings || [];
  const deliveryOptions: { label: string; count: number }[] = filterData?.delivery_options || [];
  const dynamicAttributes = type === 'product' ? (filterData?.attributes || {}) : {};

  const updateFilters = useCallback(
    (updates: Record<string, any>) => {
      const newParams = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
          newParams.delete(key);
        } else if (Array.isArray(value)) {
          newParams.delete(key);
          value.forEach(v => newParams.append(key, String(v)));
        } else {
          newParams.set(key, String(value));
        }
      }
      newParams.set('page', '1');
      setSearchParams(newParams);
      if (isMobile && onClose) onClose();
    },
    [searchParams, setSearchParams, isMobile, onClose]
  );

  const toggleCategory = (id: number) => {
    const next = initialCategories.includes(id) ? initialCategories.filter(x => x !== id) : [...initialCategories, id];
    updateFilters({ category: next });
  };
  const toggleBrand = (name: string) => {
    const next = initialBrands.includes(name) ? initialBrands.filter(b => b !== name) : [...initialBrands, name];
    updateFilters({ brand: next });
  };
  const toggleRating = (rating: number) => {
    const next = initialRatings.includes(rating) ? initialRatings.filter(r => r !== rating) : [...initialRatings, rating];
    updateFilters({ rating: next });
  };
  const toggleDelivery = (label: string) => {
    const next = initialDelivery.includes(label) ? initialDelivery.filter(l => l !== label) : [...initialDelivery, label];
    updateFilters({ delivery: next });
  };

  const applyPriceFilter = () => {
    const min = priceMinDraft ? Math.max(0, Number(priceMinDraft)) : 0;
    const max = priceMaxDraft ? Math.min(priceRange.max, Number(priceMaxDraft)) : priceRange.max;
    if (min === 0 && max === priceRange.max) {
      updateFilters({ price_min: undefined, price_max: undefined });
    } else {
      updateFilters({ price_min: min, price_max: max });
    }
  };
  const handlePriceKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); applyPriceFilter(); } };
  const resetPrice = () => { setPriceMinDraft(''); setPriceMaxDraft(''); updateFilters({ price_min: undefined, price_max: undefined }); };
  const setSortBy = (value: string) => updateFilters({ sort: value });
  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    newParams.set('page', '1');
    setSearchParams(newParams);
    if (isMobile && onClose) onClose();
  };

  const activeFilterCount = initialCategories.length + initialBrands.length + initialRatings.length + initialDelivery.length;
  const filteredBrands = brands.filter(b => b.name && b.name.toLowerCase().includes(brandSearch.toLowerCase()));

  return (
    <div className={`w-full bg-white border border-border-light rounded-[var(--radius-md)] shadow-card ${isMobile ? 'h-full' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-border-light">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-text-secondary" />
            <h2 className="font-semibold text-text-primary text-base">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1 bg-brand text-white text-sm px-2 py-1">{activeFilterCount}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearAllFilters} disabled={activeFilterCount === 0} className="text-sm text-text-muted hover:text-text-primary px-3 py-1">
            Clear All
          </Button>
        </div>
        <Select value={initialSortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full h-9 text-sm border-border-light"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance" className="text-sm">Most Relevant</SelectItem>
            <SelectItem value="price_asc" className="text-sm">Price: Low to High</SelectItem>
            <SelectItem value="price_desc" className="text-sm">Price: High to Low</SelectItem>
            <SelectItem value="rating" className="text-sm">Highest Rated</SelectItem>
            <SelectItem value="newest" className="text-sm">Newest First</SelectItem>
            <SelectItem value="best_sellers" className="text-sm">Best Sellers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className={isMobile ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-200px)]'}>
        <div className="p-4 space-y-4">
          {/* Categories */}
          <Collapsible open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-1.5 text-text-primary font-semibold text-sm">
              Category <ChevronDown className={`w-4 h-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {categories.length > 0 ? (
                <div className="space-y-1">
                  {categories.map((cat: any) => {
                    const selected = initialCategories.includes(cat.id);
                    return (
                      <div key={cat.id} className="flex items-center space-x-2 py-0.5">
                        <Checkbox id={`cat-${cat.id}`} checked={selected} onCheckedChange={() => toggleCategory(cat.id)} />
                        <Label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer flex-1 text-text-secondary">
                          {cat.name} {cat.count !== undefined && <span className="text-text-muted ml-1">({cat.count})</span>}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-text-muted py-2">No subcategories</div>
              )}
            </CollapsibleContent>
          </Collapsible>
          <Separator />

          {/* Price Range */}
          <Collapsible open={isPriceOpen} onOpenChange={setIsPriceOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-1.5 text-text-primary font-semibold text-sm">
              Price Range <ChevronDown className={`w-4 h-4 transition-transform ${isPriceOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="price-min"
                  name="price_min"
                  type="text"
                  inputMode="numeric"
                  value={priceMinDraft}
                  onChange={e => setPriceMinDraft(e.target.value)}
                  onBlur={applyPriceFilter}
                  onKeyDown={handlePriceKeyDown}
                  placeholder={`Min (${priceRange.min})`}
                  className="w-full h-8 px-3 py-1 text-sm border border-border-light rounded-sm focus:ring-1 focus:ring-brand focus:border-brand"
                />
                <span className="text-text-muted text-sm">-</span>
                <input
                  id="price-max"
                  name="price_max"
                  type="text"
                  inputMode="numeric"
                  value={priceMaxDraft}
                  onChange={e => setPriceMaxDraft(e.target.value)}
                  onBlur={applyPriceFilter}
                  onKeyDown={handlePriceKeyDown}
                  placeholder={`Max (${priceRange.max})`}
                  className="w-full h-8 px-3 py-1 text-sm border border-border-light rounded-sm focus:ring-1 focus:ring-brand focus:border-brand"
                />
              </div>
              <button onClick={resetPrice} className="text-sm text-brand hover:text-brand-hover">Reset price</button>
            </CollapsibleContent>
          </Collapsible>
          <Separator />

          {/* Brands */}
          {brands.length > 0 && (
            <>
              <Collapsible open={isBrandOpen} onOpenChange={setIsBrandOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between py-1.5 text-text-primary font-semibold text-sm">
                  Brand <ChevronDown className={`w-4 h-4 transition-transform ${isBrandOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                      id="brand-search"
                      name="brand"
                      placeholder="Search brands..."
                      value={brandSearch}
                      onChange={e => setBrandSearch(e.target.value)}
                      className="pl-8 pr-8 h-8 text-sm border-border-light"
                    />
                    {brandSearch && (
                      <button onClick={() => setBrandSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                        <X className="w-4 h-4 text-text-muted hover:text-text-primary" />
                      </button>
                    )}
                  </div>
                  <ScrollArea className="h-36">
                    <div className="space-y-1">
                      {filteredBrands.length > 0 ? filteredBrands.map(brand => (
                        <div key={brand.name} className="flex items-center space-x-2">
                          <Checkbox id={`brand-${brand.name}`} checked={initialBrands.includes(brand.name)} onCheckedChange={() => toggleBrand(brand.name)} />
                          <Label htmlFor={`brand-${brand.name}`} className="text-sm cursor-pointer flex-1 text-text-secondary">{brand.name}</Label>
                        </div>
                      )) : <p className="text-sm text-text-muted py-2">No brands found</p>}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

          {/* Dynamic Attributes (only products) */}
          {type === 'product' && Object.entries(dynamicAttributes).map(([key, values]) => {
            if (key === 'brand') return null;
            const isOpen = openAttributes[key] ?? false;
            const setIsOpen = (open: boolean) => setOpenAttributes(prev => ({ ...prev, [key]: open }));
            return (
              <div key={key}>
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between py-1.5 text-text-primary font-semibold text-sm capitalize">
                    {displayDelivery(key)} <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <ScrollArea className="max-h-36">
                      <div className="space-y-1">
                        {(values as any[]).map(val => {
                          const displayKey = val.value ?? String(val);
                          return (
                            <div key={`attr-${key}-${displayKey}`} className="flex items-center space-x-2">
                              <Checkbox id={`attr-${key}-${displayKey}`} checked={searchParams.getAll(key).includes(displayKey)} onCheckedChange={() => {
                                const current = searchParams.getAll(key);
                                const next = current.includes(displayKey) ? current.filter(v => v !== displayKey) : [...current, displayKey];
                                updateFilters({ [key]: next });
                              }} />
                              <Label htmlFor={`attr-${key}-${displayKey}`} className="text-sm cursor-pointer flex-1 text-text-secondary">{displayKey}</Label>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
                <Separator />
              </div>
            );
          })}

          {/* Rating */}
          {ratings.length > 0 && (
            <>
              <Collapsible open={isRatingOpen} onOpenChange={setIsRatingOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between py-1.5 text-text-primary font-semibold text-sm">
                  Rating <ChevronDown className={`w-4 h-4 transition-transform ${isRatingOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-1">
                  {ratings.map((rating: number) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <Checkbox id={`rating-${rating}`} checked={initialRatings.includes(rating)} onCheckedChange={() => toggleRating(rating)} />
                      <Label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer flex-1 flex items-center gap-1">
                        <div className="flex items-center">
                          {Array.from({ length: Math.floor(rating) }).map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                          {Array.from({ length: 5 - Math.floor(rating) }).map((_, i) => <Star key={`empty-${i}`} className="w-4 h-4 text-border-light" />)}
                        </div>
                        <span className="ml-1 text-text-muted">& Up</span>
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

          {/* Delivery */}
          {deliveryOptions.length > 0 && (
            <>
              <Collapsible open={isDeliveryOpen} onOpenChange={setIsDeliveryOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between py-1.5 text-text-primary font-semibold text-sm">
                  Delivery <ChevronDown className={`w-4 h-4 transition-transform ${isDeliveryOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-1">
                  {deliveryOptions.map(option => (
                    <div key={option.label} className="flex items-center space-x-2">
                      <Checkbox id={`delivery-${option.label}`} checked={initialDelivery.includes(option.label)} onCheckedChange={() => toggleDelivery(option.label)} />
                      <Label htmlFor={`delivery-${option.label}`} className="text-sm cursor-pointer flex-1 text-text-secondary">{displayDelivery(option.label)}</Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="p-4 border-t border-border-light bg-surface-hover">
          <div className="flex flex-wrap gap-2">
            {initialCategories.map(id => {
              const name = categories.find((c:any) => c.id === id)?.name || `Cat ${id}`;
              return <Badge key={id} variant="secondary" className="pl-3 pr-1.5 py-1.5 gap-1.5 text-sm bg-white border-border-light text-text-secondary">{name}<button onClick={() => toggleCategory(id)}><X className="w-4 h-4" /></button></Badge>;
            })}
            {initialBrands.map(b => <Badge key={b} variant="secondary" className="pl-3 pr-1.5 py-1.5 gap-1.5 text-sm bg-white border-border-light text-text-secondary">{b}<button onClick={() => toggleBrand(b)}><X className="w-4 h-4" /></button></Badge>)}
            {initialRatings.map(r => <Badge key={r} variant="secondary" className="pl-3 pr-1.5 py-1.5 gap-1.5 text-sm bg-white border-border-light text-text-secondary">{r}+★<button onClick={() => toggleRating(r)}><X className="w-4 h-4" /></button></Badge>)}
            {initialDelivery.map(d => <Badge key={d} variant="secondary" className="pl-3 pr-1.5 py-1.5 gap-1.5 text-sm bg-white border-border-light text-text-secondary">{displayDelivery(d)}<button onClick={() => toggleDelivery(d)}><X className="w-4 h-4" /></button></Badge>)}
          </div>
        </div>
      )}
    </div>
  );
};