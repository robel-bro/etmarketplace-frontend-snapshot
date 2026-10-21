import React from 'react';

const ReviewStep = ({
  onBack,
  onPlaceOrder,
  selectedAddress,
  selectedRate,
  selectedMethod,
  cart,
  couponCode,
  isPlacing,
  addressText,
}: any) => {
  const subtotal =
    cart?.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) || 0;

  // Use `charge` consistently; fallback to `cost`
  const shippingCost = selectedRate
    ? Number(selectedRate.charge || selectedRate.cost || 0)
    : 0;

  const sellerSubsidy = selectedRate?.seller_subsidy || selectedRate?.subsidy || 0;
  const platformMarkup = selectedRate?.platform_markup || 0;

  // These will come from a future summary endpoint or order response.
  // For review before placing, we display 0 if not provided.
  const serviceFee = 0;
  const vatAmount = 0;
  const couponDiscount = 0;

  const total =
    subtotal + shippingCost + serviceFee + vatAmount - couponDiscount;

  const address = addressText || selectedAddress?.full_address || 'Address not available';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Review Your Order</h2>

      <div className="space-y-4">
        <div className="border rounded-xl p-4">
          <h3 className="font-medium mb-2">Shipping Address</h3>
          <p className="text-sm text-gray-600">{address}</p>
        </div>

        <div className="border rounded-xl p-4">
          <h3 className="font-medium mb-2">Shipping Method</h3>
          <p className="text-sm text-gray-600">
            {selectedRate?.delivery_label || selectedRate?.name || 'Standard'} (ETB{' '}
            {shippingCost.toFixed(2)}) •{' '}
            {selectedRate?.estimated_delivery_label ||
              `${selectedRate?.estimated_days || selectedRate?.days || 1} day(s)`}
          </p>
        </div>

        <div className="border rounded-xl p-4">
          <h3 className="font-medium mb-2">Payment Method</h3>
          <p className="text-sm text-gray-600 capitalize">
            {selectedMethod?.replace('_', ' ') || 'Not selected'}
          </p>
        </div>

        {couponCode && (
          <div className="border rounded-xl p-4 bg-green-50">
            <h3 className="font-medium mb-2">Coupon Applied</h3>
            <p className="text-sm text-green-700">{couponCode}</p>
          </div>
        )}

        <div className="border rounded-xl p-4">
          <h3 className="font-medium mb-2">Order Items</h3>
          {cart?.items.map((item: any) => {
            const originalPrice =
              item.original_price != null ? item.original_price : item.originalPrice || item.price;
            const hasDiscount = originalPrice > item.price;
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (originalPrice - item.price) * item.quantity;

            return (
              <div key={item.id} className="py-2 border-b border-gray-100 last:border-0">
                <div className="flex justify-between text-sm">
                  <span className="pr-4">
                    {item.title} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    ETB {itemTotal.toFixed(2)}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-xs text-green-600 mt-0.5">
                    <span>Discount</span>
                    <span>-ETB {itemDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}

          <div className="border-t mt-2 pt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>ETB {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>ETB {shippingCost.toFixed(2)}</span>
            </div>
            {sellerSubsidy > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Seller Delivery Subsidy</span>
                <span>-ETB {sellerSubsidy.toFixed(2)}</span>
              </div>
            )}
            {platformMarkup > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span>ETB {platformMarkup.toFixed(2)}</span>
              </div>
            )}
            {serviceFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Service Fee</span>
                <span>ETB {serviceFee.toFixed(2)}</span>
              </div>
            )}
            {vatAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">VAT (15%)</span>
                <span>ETB {vatAmount.toFixed(2)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon Discount</span>
                <span>-ETB {couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>ETB {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="border px-6 py-2 rounded-lg hover:bg-gray-50">
          Back
        </button>
        <button
          onClick={onPlaceOrder}
          disabled={isPlacing}
          className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isPlacing ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;