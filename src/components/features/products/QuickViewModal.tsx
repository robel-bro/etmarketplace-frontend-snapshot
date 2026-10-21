import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery } from 'react-query';
import api from '../../../lib/axios';
import { useCart } from '../../../hooks/useCart';
import { useWishlist } from '../../../hooks/useWishlist';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface QuickViewModalProps {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal = ({ productId, isOpen, onClose }: QuickViewModalProps) => {
  const { data: product, isLoading } = useQuery(
    ['product', productId],
    () => api.get(`/products/${productId}`).then(res => res.data),
    { enabled: !!productId }
  );
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const wishlisted = productId ? isInWishlist(productId) : false;

  const images = product?.images?.length ? product.images : ['/placeholder.jpg'];

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        {/* Modal Panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {isLoading ? (
                  <div className="p-8 text-center">Loading...</div>
                ) : product ? (
                  <div className="relative">
                    <button
                      onClick={onClose}
                      className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>

                    <div className="grid md:grid-cols-2">
                      {/* Image Gallery */}
                      <div className="p-6">
                        <Swiper
                          modules={[Navigation, Pagination]}
                          navigation
                          pagination={{ clickable: true }}
                          className="rounded-xl"
                        >
                          {images.map((src, idx) => (
                            <SwiperSlide key={idx}>
                              <img src={src} alt={product.title} className="w-full h-64 object-cover" />
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>

                      {/* Product Info */}
                      <div className="p-6">
                        <h3 className="text-2xl font-bold text-gray-800">{product.title}</h3>
                        {/* ✅ Fixed: optional chaining and fallback */}
                        <p className="text-gray-500 mt-1">by {product.vendor?.business_name || 'Unknown Seller'}</p>
                        <div className="mt-4 flex items-baseline gap-4">
                          <span className="text-3xl font-bold text-primary-600">ETB {product.price}</span>
                          {product.stock > 0 ? (
                            <span className="text-green-600">In Stock</span>
                          ) : (
                            <span className="text-red-600">Out of Stock</span>
                          )}
                        </div>
                        <p className="mt-4 text-gray-700 line-clamp-3">{product.description}</p>

                        <div className="mt-6 flex gap-4">
                          <button
                            onClick={() => addToCart(product, 1)}
                            disabled={product.stock === 0}
                            className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => wishlisted ? removeFromWishlist(product.id) : addToWishlist(product)}
                            className="px-4 border rounded-xl hover:bg-gray-50"
                          >
                            {wishlisted ? '❤️' : '🤍'}
                          </button>
                        </div>
                        <a
                          href={`/product/${product.id}`}
                          onClick={onClose}
                          className="mt-4 inline-block text-primary-600 hover:underline"
                        >
                          View Full Details →
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">Product not found.</div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default QuickViewModal;