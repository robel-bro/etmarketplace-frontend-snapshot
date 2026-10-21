import { useCart } from '../../../hooks/useCart';

interface ReviewStepProps {
  onBack: () => void;
  onSubmit: () => void;
  addressId: string;
  shippingMethod: string;
  paymentMethod: string;
}

const ReviewStep = ({ onBack, onSubmit, addressId, shippingMethod, paymentMethod }: ReviewStepProps) => {
  const { cart } = useCart();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Review Your Order</h2>
      <div className="border-t border-b py-4">
        <h3 className="font-semibold mb-2">Items</h3>
        {cart?.items.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.title} x {item.quantity}</span>
            <span>ETB {item.total}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-2">
          <span>Subtotal</span>
          <span>ETB {cart?.total_price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>ETB 50</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Total</span>
          <span>ETB {(cart?.total_price || 0) + 50}</span>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
        >
          Place Order
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;