// et_marketplace_frontend/src/components/features/products/ActiveFilters.tsx

import { XMarkIcon } from '@heroicons/react/24/outline';

// Helper: replace any occurrence of "Shipping" with "Delivery" (display only)
const displayDelivery = (text: string) => text.replace(/Shipping/gi, 'Delivery');

interface ActiveFiltersProps {
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;
}

const ActiveFilters = ({ searchParams, setSearchParams }: ActiveFiltersProps) => {
  const filters: { key: string; label: string; value: string; paramKey: string; paramValue?: string }[] = [];

  // Category (multiple)
  searchParams.getAll('category').forEach(catId => {
    filters.push({
      key: `category_${catId}`,
      label: 'Category',
      value: catId,
      paramKey: 'category',
      paramValue: catId,
    });
  });

  // Price range
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  if (priceMin || priceMax) {
    filters.push({
      key: 'price',
      label: 'Price',
      value: `ETB ${priceMin || 0} – ${priceMax || '∞'}`,
      paramKey: 'price',
    });
  }

  // Brand (multiple)
  searchParams.getAll('brand').forEach(brand => {
    filters.push({
      key: `brand_${brand}`,
      label: 'Brand',
      value: brand,
      paramKey: 'brand',
      paramValue: brand,
    });
  });

  // Rating (multiple)
  searchParams.getAll('rating').forEach(r => {
    filters.push({
      key: `rating_${r}`,
      label: 'Rating',
      value: `${r}★ & up`,
      paramKey: 'rating',
      paramValue: r,
    });
  });

  // Delivery (multiple) – replace "Shipping" with "Delivery"
  searchParams.getAll('delivery').forEach(option => {
    filters.push({
      key: `delivery_${option}`,
      label: 'Delivery',
      value: displayDelivery(option),
      paramKey: 'delivery',
      paramValue: option,
    });
  });

  // Dynamic attributes
  const knownKeys = [
    'q',
    'category',
    'price_min',
    'price_max',
    'rating',
    'brand',
    'delivery',
    'sort',
    'page',
    'limit',
    'offset',
  ];
  const attrKeys = new Set<string>();
  searchParams.forEach((_, key) => {
    if (!knownKeys.includes(key)) attrKeys.add(key);
  });
  attrKeys.forEach(key => {
    searchParams.getAll(key).forEach(val => {
      filters.push({
        key: `${key}_${val}`,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: displayDelivery(val),
        paramKey: key,
        paramValue: val,
      });
    });
  });

  const removeFilter = (filter: (typeof filters)[0]) => {
    const newParams = new URLSearchParams(searchParams);
    if (filter.paramKey === 'price') {
      newParams.delete('price_min');
      newParams.delete('price_max');
    } else if (filter.paramValue) {
      const current = newParams.getAll(filter.paramKey);
      const updated = current.filter(v => v !== filter.paramValue);
      newParams.delete(filter.paramKey);
      updated.forEach(v => newParams.append(filter.paramKey, v));
    } else {
      newParams.delete(filter.paramKey);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearAll = () => {
    const newParams = new URLSearchParams();
    if (searchParams.get('q')) newParams.set('q', searchParams.get('q')!);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map(f => (
        <div
          key={f.key}
          className="bg-gray-100 rounded-lg px-3 py-1 text-sm flex items-center gap-1"
        >
          <span className="text-gray-700">
            {f.label}: {f.value}
          </span>
          <button
            onClick={() => removeFilter(f)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={clearAll} className="text-sm text-primary-600 hover:underline">
        Clear all
      </button>
    </div>
  );
};

export default ActiveFilters;