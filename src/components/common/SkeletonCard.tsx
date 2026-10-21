const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-3 sm:p-4 animate-pulse">
    {/* Image placeholder */}
    <div className="relative w-full pb-[100%] bg-stone-200 rounded-lg mb-3" />
    {/* Title lines */}
    <div className="space-y-2 mb-3">
      <div className="h-4 bg-stone-200 rounded w-full" />
      <div className="h-4 bg-stone-200 rounded w-4/5" />
    </div>
    {/* Price */}
    <div className="h-6 bg-stone-200 rounded w-1/3 mb-3" />
    {/* Rating + sold */}
    <div className="flex items-center justify-between mb-2">
      <div className="h-3 bg-stone-200 rounded w-1/4" />
      <div className="h-3 bg-stone-200 rounded w-1/5" />
    </div>
    {/* Free shipping badge placeholder */}
    <div className="h-5 bg-stone-200 rounded w-1/3" />
  </div>
);

export default SkeletonCard;