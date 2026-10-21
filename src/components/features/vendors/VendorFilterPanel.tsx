import { useState, useEffect, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface VendorFilterState {
  search: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  selectedCategories: string[];
  selectedRatings: number[];
  selectedDelivery: string[];
}

const defaultFilters: VendorFilterState = {
  search: '',
  sort: '',
  minPrice: '',
  maxPrice: '',
  selectedCategories: [],
  selectedRatings: [],
  selectedDelivery: [],
};

const sortOptions = [
  { label: 'Default', value: '' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Newest', value: 'newest' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  filters: VendorFilterState;
  onApply: (f: VendorFilterState) => void;
  meta: any;
  section: string;
  categoryMap: Record<string, string[]>;
}

export default function VendorFilterPanel({
  open,
  onClose,
  filters,
  onApply,
  meta,
  section,
  categoryMap,
}: Props) {
  const sectionMeta = meta?.[section] || {};
  const vendorCategoriesRaw = sectionMeta.categories || [];
  const ratings = sectionMeta.ratings || [];
  const priceRange = sectionMeta.price_range || { min: 0, max: 0 };
  const deliveryOptions = (sectionMeta.delivery_options || []).filter(
    (o: any) => o.label && o.label.trim() !== ''
  );

  // Enrich categories using the global category tree
  const enrichedCategories = useMemo(() => {
    if (!vendorCategoriesRaw.length || Object.keys(categoryMap).length === 0)
      return vendorCategoriesRaw.filter((c: any) => c.name && c.name.trim() !== '');
    const countByName: Record<string, number> = {};
    vendorCategoriesRaw.forEach((c: any) => {
      countByName[c.name] = c.count;
    });
    vendorCategoriesRaw.forEach((cat: any) => {
      const name = cat.name;
      Object.entries(categoryMap).forEach(([parent, children]) => {
        if (children.includes(name) && parent !== name) {
          countByName[parent] = (countByName[parent] || 0) + cat.count;
        }
      });
    });
    return Object.entries(countByName)
      .filter(([name]) => name && name.trim() !== '')
      .map(([name, count]) => ({ name, count }));
  }, [vendorCategoriesRaw, categoryMap]);

  const [local, setLocal] = useState(filters);
  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  const toggleCategory = (cat: string) => {
    setLocal(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(cat)
        ? prev.selectedCategories.filter(c => c !== cat)
        : [...prev.selectedCategories, cat],
    }));
  };

  const toggleRating = (star: number) => {
    setLocal(prev => ({
      ...prev,
      selectedRatings: prev.selectedRatings.includes(star)
        ? prev.selectedRatings.filter(r => r !== star)
        : [...prev.selectedRatings, star],
    }));
  };

  const toggleDelivery = (label: string) => {
    setLocal(prev => ({
      ...prev,
      selectedDelivery: prev.selectedDelivery.includes(label)
        ? prev.selectedDelivery.filter(d => d !== label)
        : [...prev.selectedDelivery, label],
    }));
  };

  const handleApply = () => {
    onApply({ ...local });
    onClose();
  };

  const handleReset = () => {
    setLocal(defaultFilters);
    onApply(defaultFilters);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-80 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-bold">Filters</h2>
          <button onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Search */}
          <div>
            <label className="text-sm font-semibold">Search</label>
            <input
              type="text"
              value={local.search}
              onChange={e => setLocal({ ...local, search: e.target.value })}
              placeholder="Search..."
              className="w-full h-10 border rounded px-3 mt-1"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-semibold">Sort By</label>
            <select
              value={local.sort}
              onChange={e => setLocal({ ...local, sort: e.target.value })}
              className="w-full h-10 border rounded px-3 mt-1"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div>
            <label className="text-sm font-semibold">Price (ETB)</label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={local.minPrice}
                onChange={e => setLocal({ ...local, minPrice: e.target.value })}
                placeholder={`Min ${priceRange.min}`}
                className="w-full h-10 border rounded px-3"
              />
              <input
                type="number"
                value={local.maxPrice}
                onChange={e => setLocal({ ...local, maxPrice: e.target.value })}
                placeholder={`Max ${priceRange.max}`}
                className="w-full h-10 border rounded px-3"
              />
            </div>
          </div>

          {/* Delivery */}
          {deliveryOptions.length > 0 && (
            <div>
              <label className="text-sm font-semibold">Delivery</label>
              <div className="space-y-1 mt-1">
                {deliveryOptions.map((opt: any) => (
                  <label key={opt.label} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={local.selectedDelivery.includes(opt.label)}
                      onChange={() => toggleDelivery(opt.label)}
                    />
                    {opt.label} ({opt.count})
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Enriched categories */}
          {enrichedCategories.length > 0 && (
            <div>
              <label className="text-sm font-semibold">Category</label>
              <div className="space-y-1 mt-1">
                {enrichedCategories.map((cat: any) => (
                  <label key={cat.name} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={local.selectedCategories.includes(cat.name)}
                      onChange={() => toggleCategory(cat.name)}
                    />
                    {cat.name} ({cat.count})
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Ratings */}
          {ratings.length > 0 && (
            <div>
              <label className="text-sm font-semibold">Rating</label>
              <div className="space-y-1 mt-1">
                {ratings.map((r: any) => (
                  <label key={r.star} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={local.selectedRatings.includes(r.star)}
                      onChange={() => toggleRating(r.star)}
                    />
                    {r.star}★ & up ({r.count})
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-4 py-3 flex gap-3">
          <button onClick={handleReset} className="flex-1 py-2 border rounded">
            Reset
          </button>
          <button onClick={handleApply} className="flex-1 py-2 bg-orange-500 text-white rounded">
            Apply
          </button>
        </div>
      </div>
    </>
  );
}