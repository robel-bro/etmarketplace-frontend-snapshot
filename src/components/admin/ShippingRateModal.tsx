import { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ShippingRateModal = ({ rate, onClose, onSave }) => {
  const [form, setForm] = useState(rate || {
    region: '',
    zone: '',
    woreda: '',
    standardRate: '',
    expressRate: '',
    standardDays: '',
    expressDays: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{rate ? 'Edit Shipping Rate' : 'Add Shipping Rate'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Region</label>
            <input
              type="text"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Zone (optional)</label>
            <input
              type="text"
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Woreda (optional)</label>
            <input
              type="text"
              value={form.woreda}
              onChange={(e) => setForm({ ...form, woreda: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Standard Rate (ETB)</label>
              <input
                type="number"
                value={form.standardRate}
                onChange={(e) => setForm({ ...form, standardRate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Express Rate (ETB)</label>
              <input
                type="number"
                value={form.expressRate}
                onChange={(e) => setForm({ ...form, expressRate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Standard Days</label>
              <input
                type="number"
                value={form.standardDays}
                onChange={(e) => setForm({ ...form, standardDays: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Express Days</label>
              <input
                type="number"
                value={form.expressDays}
                onChange={(e) => setForm({ ...form, expressDays: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ShippingRateModal;