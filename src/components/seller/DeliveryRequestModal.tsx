import { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, TruckIcon } from '@heroicons/react/24/outline';

interface Props {
  orderId: number;
  onClose: () => void;
  onSubmit: (vehicleType: string, packageDetails?: string) => void;
}

const DeliveryRequestModal = ({ orderId, onClose, onSubmit }: Props) => {
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [packageDetails, setPackageDetails] = useState('');

  const handleSubmit = () => {
    onSubmit(vehicleType, packageDetails || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Request Delivery</h3>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Order #{orderId} – Choose a delivery partner type to pick up and deliver the items.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="motorcycle">Motorcycle</option>
              <option value="car">Car</option>
              <option value="truck">Truck</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Package Details (optional)</label>
            <textarea
              value={packageDetails}
              onChange={(e) => setPackageDetails(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="e.g., weight 5kg, dimensions 30x20x15 cm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-[var(--color-orange-500)] text-white rounded-lg hover:bg-orange-600 flex items-center gap-2">
            <TruckIcon className="w-4 h-4" /> Send Request
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeliveryRequestModal;