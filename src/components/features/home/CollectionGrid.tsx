import { Link } from 'react-router-dom';
import CollectionCard from '../../features/collections/CollectionCard';

const CollectionGrid = ({ collections }: { collections: any[] }) => {
  if (!collections || collections.length === 0) return null;

  return (
    <section className="py-4">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Collections</h2>
          <p className="text-sm text-text-muted">Curated bundles with everything you need</p>
        </div>
        <Link
          to="/collections"
          className="text-sm font-medium text-brand hover:text-brand-hover transition-colors"
        >
          View all collections →
        </Link>
      </div>

      {/* One premium card per row */}
      <div className="flex flex-col gap-4">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
};

export default CollectionGrid;