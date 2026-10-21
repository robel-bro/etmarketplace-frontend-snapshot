import { useQuery } from 'react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import api from '../../../lib/axios';
import { PremiumProductCard } from '../products/PremiumProductCard';

const ProductCarousel = ({ endpoint }: { endpoint: string }) => {
  const { data: response, isLoading } = useQuery(['carousel', endpoint], () =>
    api.get(endpoint).then(res => res.data)
  );

  if (isLoading) return <div>Loading...</div>;
  
  // Extract the product array – handle both paginated and plain array responses
  const products = response?.data || response || [];
  if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <Swiper
      modules={[Navigation]}
      spaceBetween={16}
      slidesPerView={2}
      navigation
      breakpoints={{
        640: { slidesPerView: 3 },
        1024: { slidesPerView: 4 },
        1280: { slidesPerView: 5 },
      }}
    >
      {products.map((product) => (
        <SwiperSlide key={product.id}>
          <PremiumProductCard
            id={product.id}
            image={product.image_urls?.[0] || product.images?.[0] || '/placeholder.jpg'}
            title={product.title}
            vendor={product.vendor?.business_name || product.shop_name || 'Unknown Vendor'}
            price={product.price}
            originalPrice={product.original_price}
            rating={product.rating || 4.5}
            reviews={product.reviews_count || 0}
            isFlashSale={product.is_flash_sale}
            flashSaleEndsAt={product.flash_sale_ends_at}
            isSuperDeal={product.is_super_deal}
            superDealEndsAt={product.super_deal_ends_at}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ProductCarousel;