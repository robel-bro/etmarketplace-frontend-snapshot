import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../../hooks/useCart';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { cart, updateQuantity, removeFromCart, isLoading } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                      <div className="flex items-start justify-between mb-4">
                        <Dialog.Title className="text-base font-semibold text-text-primary">
                          Shopping Cart
                        </Dialog.Title>
                        <button
                          onClick={onClose}
                          className="p-1 hover:bg-surface-hover rounded-md text-text-muted hover:text-text-primary"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-4">
                        {isLoading ? (
                          <p className="text-text-muted text-sm text-center py-8">Loading cart…</p>
                        ) : !cart?.items?.length ? (
                          <p className="text-text-muted text-sm text-center py-8">Your cart is empty</p>
                        ) : (
                          <ul className="divide-y divide-border-light">
                            {cart.items.map((item) => {
                              const stock = item.stock ?? 0;
                              const isMaxQty = item.quantity >= stock && stock > 0;
                              const isMinQty = item.quantity <= 1;

                              return (
                                <li key={item.id} className="py-4 flex">
                                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border-light bg-surface-hover">
                                    <img
                                      src={item.image || 'https://placehold.co/100x100?text=No+Image'}
                                      alt={item.title}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/100x100?text=Error';
                                      }}
                                    />
                                  </div>

                                  <div className="ml-3 flex flex-1 flex-col">
                                    <div className="flex justify-between">
                                      <h4 className="text-sm font-medium text-text-primary line-clamp-1">
                                        {item.title}
                                      </h4>
                                      <p className="ml-2 text-sm font-semibold text-text-primary whitespace-nowrap">
                                        ETB {(item.price * item.quantity).toLocaleString()}
                                      </p>
                                    </div>
                                    {stock > 0 && (
                                      <p className="text-xs text-text-muted mt-1">{stock} available</p>
                                    )}
                                    <div className="flex flex-1 items-end justify-between mt-2">
                                      <div className="flex items-center border border-border-light rounded-sm">
                                        <button
                                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                          disabled={isMinQty}
                                          className="px-2 py-0.5 text-text-primary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                          −
                                        </button>
                                        <span className="px-2 py-0.5 text-sm font-medium text-text-primary">{item.quantity}</span>
                                        <button
                                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                          disabled={isMaxQty}
                                          className="px-2 py-0.5 text-text-primary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                          +
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-xs font-medium text-red-600 hover:text-red-800"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>

                    {cart?.items?.length > 0 && (
                      <div className="border-t border-border-light px-4 py-4 sm:px-5">
                        <div className="flex justify-between text-sm font-semibold text-text-primary mb-1">
                          <p>Subtotal</p>
                          <p>ETB {(cart.total ?? 0).toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-text-muted mb-4">
                          Shipping calculated at checkout.
                        </p>
                        <button
                          onClick={handleCheckout}
                          className="w-full bg-brand hover:bg-brand-hover active:bg-brand-active text-white py-2.5 rounded-md font-semibold text-sm transition-colors"
                        >
                          Checkout
                        </button>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CartDrawer;