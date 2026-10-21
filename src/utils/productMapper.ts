import { Product } from '../components/features/products/ProductCard';

/**
 * Maps an API product object to the Product interface expected by ProductCard.
 * @param apiProduct - Raw product data from the backend
 * @returns Mapped product ready for the card component
 */
export const mapApiProductToCard = (apiProduct: any): Product => {
  // Get image URL (first image from array, or fallback)
  let imageUrl = '/placeholder.jpg';
  if (apiProduct.image_urls && Array.isArray(apiProduct.image_urls) && apiProduct.image_urls.length > 0) {
    const firstImage = apiProduct.image_urls[0];
    // If the image path is relative, prepend the API base URL
    if (firstImage && !firstImage.startsWith('http')) {
      // Use environment variable for backend URL (adjust if needed)
      const baseUrl = import.meta.env.VITE_API_URL || '';
      imageUrl = `${baseUrl}${firstImage}`;
    } else if (firstImage) {
      imageUrl = firstImage;
    }
  }

  // Ensure all numeric fields are valid numbers
  const price = Number(apiProduct.price) || 0;
  const originalPrice = apiProduct.original_price ? Number(apiProduct.original_price) : undefined;
  const rating = typeof apiProduct.rating === 'number' ? apiProduct.rating : 0;
  const reviewCount = Number(apiProduct.reviews_count) || 0;
  const orders = Number(apiProduct.sold_count) || 0;

  return {
    id: apiProduct.id,
    image: imageUrl,
    title: apiProduct.title || 'Untitled Product',
    price: price,
    originalPrice: originalPrice,
    rating: rating,
    reviewCount: reviewCount,
    orders: orders,
    freeShipping: apiProduct.free_shipping === true,
    discount: apiProduct.discount ? Number(apiProduct.discount) : undefined,
  };
};