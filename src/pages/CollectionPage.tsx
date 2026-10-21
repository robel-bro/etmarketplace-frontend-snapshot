import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../lib/axios';
import ProductCard from '../components/features/products/ProductCard';

const CollectionPage = () => {
  const { slug } = useParams();
  const { data: collection, isLoading } = useQuery(['collection', slug], () =>
    api.get(`/api/v1/collections/${slug}`).then(res => res.data)
  );

  if (isLoading) return <div className="text-center py-20 text-text-muted">Loading collection…</div>;
  if (!collection) return <div className="text-center py-20 text-text-muted">Collection not found</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {collection.cover_image_url && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img src={collection.cover_image_url} alt={collection.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="container-marketplace py-6">
        <h1 className="text-product-title font-semibold text-text-primary mb-1">{collection.name}</h1>
        {collection.description && <p className="text-body-sm text-text-secondary mb-6">{collection.description}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {collection.products?.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollectionPage;