const SortBar = ({ searchParams, setSearchParams }) => {
  const handleSort = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', value);
    setSearchParams(newParams);
  };

  const currentSort = searchParams.get('sort') || 'relevance';

  return (
    <div className="flex justify-end items-center mb-4 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-sm">
      <span className="text-sm text-gray-600 mr-2">Sort by:</span>
      <select
        value={currentSort}
        onChange={(e) => handleSort(e.target.value)}
        className="border-0 bg-transparent text-sm font-medium focus:ring-0"
      >
        <option value="relevance">Relevance</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="newest">Newest</option>
        <option value="rating">Top Rated</option>
        <option value="best_sellers">Best Sellers</option>
      </select>
    </div>
  );
};

export default SortBar;