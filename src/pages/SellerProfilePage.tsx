import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useState } from 'react';
import { StarIcon } from '@heroicons/react/20/solid';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, BuildingOfficeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import api from '../lib/axios';
import PremiumProductCard from '../components/features/products/PremiumProductCard';
import ContactSellerModal from '../components/shop/ContactSellerModal';
import { useAuth } from '../hooks/useAuth';
import ReviewList from '../components/features/reviews/ReviewList';
import ReviewForm from '../components/features/reviews/ReviewForm';

const SellerProfilePage = () => {
  const { sellerId } = useParams();
  const { user } = useAuth();
  const [showContactModal, setShowContactModal] = useState(false);

  const { data: seller, isLoading } = useQuery(['seller', sellerId], () =>
    api.get(`/vendors/${sellerId}`).then(res => res.data)
  );

  const { data: products } = useQuery(['sellerProducts', sellerId], () =>
    api.get(`/products?vendor=${sellerId}`).then(res => res.data.data)
  );

  if (isLoading) return <div className="text-center py-20">Loading...</div>;
  if (!seller) return <div className="text-center py-20">Seller not found</div>;

  const averageRating = seller.average_rating ? Number(seller.average_rating) : 0;
  const reviewsCount = seller.total_reviews_count ? Number(seller.total_reviews_count) : 0;
  const membershipTier = seller.membership_tier;
  const isCompany = seller.is_company; // you can use vendor.is_company from API
  const totalSales = seller.total_sales || 0;
  const productsCount = seller.products_count || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main profile card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-4xl">
            {seller.business_name?.charAt(0) || 'S'}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              {seller.business_name}
              {membershipTier && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  membershipTier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                  membershipTier === 'gold' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {membershipTier.toUpperCase()}
                </span>
              )}
              {isCompany && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  COMPANY
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">{seller.user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <StarIcon
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} ({reviewsCount} reviews)
              </span>
              <span className="text-sm text-gray-500 mx-2">|</span>
              <span className="text-sm text-gray-600">{totalSales} sales</span>
              <span className="text-sm text-gray-500 mx-2">|</span>
              <span className="text-sm text-gray-600">{productsCount} products</span>
            </div>
            {seller.business_address && (
              <p className="text-sm text-gray-500 mt-2">{seller.business_address}</p>
            )}
            {user ? (
              <button
                onClick={() => setShowContactModal(true)}
                className="mt-4 flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                <EnvelopeIcon className="w-5 h-5" /> Contact Seller
              </button>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Please <a href="/login" className="text-primary-600">log in</a> to contact this seller.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Supplier / Company extra details */}
      {(seller.is_bulk_supplier || isCompany) && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5" />
            {isCompany ? 'Company Details' : 'Bulk Supplier Details'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <BuildingOfficeIcon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Business Name</p>
                <p className="text-gray-600">{seller.business_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPinIcon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                <p className="text-gray-600">{seller.business_address || 'Ethiopia'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <PhoneIcon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <p className="text-gray-600">{seller.phone || 'Not provided'}</p>
              </div>
            </div>
            {isCompany && (
              <div className="flex items-start gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Verified Company</p>
                  <p className="text-gray-600">Trade license verified</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-4">Products from this seller</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products?.map(product => (
          <PremiumProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Shop Reviews */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Shop Reviews</h2>
        <ReviewList vendorId={Number(sellerId)} />
        <div className="mt-4">
          <ReviewForm vendorId={Number(sellerId)} onSuccess={() => window.location.reload()} />
        </div>
      </div>

      {showContactModal && (
        <ContactSellerModal
          seller={seller}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </div>
  );
};

export default SellerProfilePage;