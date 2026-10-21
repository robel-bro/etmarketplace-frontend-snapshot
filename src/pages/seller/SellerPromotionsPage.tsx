import { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../lib/axios';
import PromoCodeModal from '../../components/admin/PromoCodeModal';
import DeleteConfirmModal from '../../components/seller/DeleteConfirmModal';

const mockPromoCodes = [
  { id: 1, code: 'SELLER10', type: 'percentage', value: 10, usageLimit: 50, usedCount: 12, startDate: '2026-03-01', endDate: '2026-04-01', status: 'active' },
  { id: 2, code: 'FLASH20', type: 'fixed', value: 200, usageLimit: 10, usedCount: 3, startDate: '2026-03-15', endDate: '2026-03-20', status: 'active' },
];

const SellerPromotionsPage = () => {
  const [promoCodes, setPromoCodes] = useState(mockPromoCodes);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: products } = useQuery('sellerProducts', () => api.get('/vendor/products').then(res => res.data));

  const handleSave = (codeData) => {
    if (editingCode) {
      setPromoCodes(prev => prev.map(c => c.id === editingCode.id ? { ...c, ...codeData } : c));
    } else {
      setPromoCodes(prev => [{ id: Date.now(), ...codeData }, ...prev]);
    }
    setShowModal(false);
    setEditingCode(null);
  };

  const handleDelete = (id) => {
    setPromoCodes(prev => prev.filter(c => c.id !== id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Promotions</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <PlusIcon className="w-4 h-4" /> Create Promo Code
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Valid</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {promoCodes.map(code => (
              <tr key={code.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-2.5 text-xs font-medium text-gray-900">{code.code}</td>
                <td className="px-4 py-2.5 text-xs text-gray-600 capitalize">{code.type}</td>
                <td className="px-4 py-2.5 text-xs text-gray-600">
                  {code.type === 'percentage' ? `${code.value}%` : `ETB ${code.value}`}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600">
                  {code.usedCount} / {code.usageLimit || '∞'}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600">
                  {code.startDate} – {code.endDate}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                    code.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {code.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right space-x-2">
                  <button
                    onClick={() => { setEditingCode(code); setShowModal(true); }}
                    className="text-[var(--color-orange-500)] hover:text-[var(--color-orange-600)]"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(code)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <PromoCodeModal
          code={editingCode}
          onClose={() => { setShowModal(false); setEditingCode(null); }}
          onSave={handleSave}
          sellerMode={true}
          sellerProducts={products}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={`Delete promo code "${deleteTarget.code}"?`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default SellerPromotionsPage;