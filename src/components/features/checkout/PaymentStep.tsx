interface PaymentStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

const PaymentStep = ({ onNext, onBack }: PaymentStepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Payment Method</h2>
      <div className="space-y-2">
        <label className="flex items-center gap-2 p-3 border rounded-lg">
          <input type="radio" name="payment" value="telebirr" defaultChecked />
          <span>Telebirr</span>
        </label>
        <label className="flex items-center gap-2 p-3 border rounded-lg">
          <input type="radio" name="payment" value="chapa" />
          <span>Chapa</span>
        </label>
        <label className="flex items-center gap-2 p-3 border rounded-lg">
          <input type="radio" name="payment" value="cod" />
          <span>Cash on Delivery</span>
        </label>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => onNext({ method: 'telebirr' })}
          className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
};

export default PaymentStep;