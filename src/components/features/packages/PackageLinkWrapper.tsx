// src/components/features/packages/PackageLinkWrapper.tsx
import { Link } from 'react-router-dom';
import PremiumPackageCard from './PremiumPackageCard';

const PackageLinkWrapper = ({ package: pkg, ...rest }: any) => {
  return (
    <Link to={`/packages/${pkg.id}`} className="block w-full group">
      <PremiumPackageCard
        id={pkg.id}
        name={pkg.name}
        description={pkg.description}
        images={pkg.image_urls || pkg.images}
        price={pkg.price}
        originalPrice={pkg.original_price}
        itemsCount={pkg.items_count}
        vendor={pkg.vendor?.business_name || pkg.vendor || 'Store'}
        vendorBadge={pkg.vendor?.badge ?? null}
        rating={pkg.rating}
        reviewsCount={pkg.reviews_count}
        stock={pkg.stock}
        features={pkg.features || []}
        shippingType={pkg.shipping_type}
        shippingValue={pkg.shipping_value}
        // ★ Pass delivery fields from package API
        free_delivery={pkg.free_delivery}
        delivery_label={pkg.delivery_label}
        out_of_stock={pkg.out_of_stock}
        {...rest}
      />
    </Link>
  );
};

export default PackageLinkWrapper;