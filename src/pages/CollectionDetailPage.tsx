import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ChevronRight } from 'lucide-react';
import api from '../lib/axios';
import ProductCard from '../components/features/products/ProductCard';

const CollectionDetailPage = () => {
  const { id } = useParams();   // this is the slug

  const { data: collection, isLoading, isError } = useQuery(
    ['collection', id],
    () => api.get(`/api/v1/collections/${id}`).then(res => res.data),
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="bg-[#F5F5F5] py-20 text-center text-text-muted text-sm">
        Loading collection…
      </div>
    );
  }

  if (isError || !collection || collection.error) {
    return (
      <div className="bg-[#F5F5F5] py-20 text-center text-text-muted">
        <p className="text-product-title font-semibold text-text-primary">Collection not found</p>
        <Link to="/all-products?tab=collections" className="text-sm text-brand hover:underline mt-2 inline-block">
          Back to collections
        </Link>
      </div>
    );
  }

  const coverImage = collection.cover_image_url || 'https://via.placeholder.com/800x400?text=No+Image';
  const products = collection.products || [];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Breadcrumb */}
      <div className="border-b border-border-light bg-white">
        <div className="container-marketplace py-1.5">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Link to="/" className="hover:text-text-primary">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/all-products?tab=collections" className="hover:text-text-primary">Collections</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-text-primary truncate">{collection.name}</span>
          </div>
        </div>
      </div>

      {/* Collection Header – full-width image with overlay */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={coverImage}
          alt={collection.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-white/80 max-w-2xl text-sm md:text-base">
              {collection.description}
            </p>
          )}
          {collection.label && (
            <span className="inline-block mt-3 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full w-fit">
              {collection.label}
            </span>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container-marketplace py-6">
        <h2 className="text-product-title font-semibold text-text-primary mb-4">
          Products in this collection
          <span className="text-text-muted text-sm font-normal ml-2">
            ({products.length})
          </span>
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm">
            No products in this collection yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetailPage;