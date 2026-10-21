import { CheckIcon } from '@heroicons/react/24/solid';

const steps = ['Address', 'Shipping', 'Payment', 'Review'];

const CheckoutSteps = ({ currentStep }) => {
  return (
    <div className="flex justify-between mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={step} className="flex-1 text-center relative">
            <div className={`flex items-center justify-center w-8 h-8 mx-auto rounded-full text-sm font-semibold ${
              isActive ? 'bg-primary-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {isCompleted ? <CheckIcon className="w-4 h-4" /> : stepNumber}
            </div>
            <p className={`mt-2 text-sm ${isActive ? 'font-medium text-gray-800' : 'text-gray-500'}`}>{step}</p>
          </div>
        );
      })}
    </div>
  );
};

export default CheckoutSteps;