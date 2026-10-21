// src/pages/seller/PackagesPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';
import PremiumPackageCard from '../../components/features/packages/PremiumPackageCard';
import PackageBuilder from '../../components/seller/PackageBuilder';
import DeleteConfirmModal from '../../components/seller/DeleteConfirmModal';

const PackagesPage = () => {
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const showToast = (msg: string) => {
    setToast({ message: msg });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: packages, isLoading } = useQuery(
    'sellerPackages',
    async () => {
      const res = await api.get('/packages?vendor=me');
      const body = res.data;
      return Array.isArray(body) ? body : body.data || [];
    }
  );

  const createPackageMutation = useMutation(
    (formData: FormData) => api.post('/packages', formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellerPackages');
        setShowBuilder(false);
        showToast('Package created successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.errors?.join(', ') ||
                        error?.response?.data?.error ||
                        error.message ||
                        'Failed to create package.';
        showToast(message);
      },
    }
  );

  const updatePackageMutation = useMutation(
    ({ id, formData }: { id: number; formData: FormData }) =>
      api.put(`/packages/${id}`, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellerPackages');
        setShowBuilder(false);
        setEditingPackage(null);
        showToast('Package updated successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.errors?.join(', ') ||
                        error?.response?.data?.error ||
                        error.message ||
                        'Failed to update package.';
        showToast(message);
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/packages/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellerPackages');
        setDeleteTarget(null);
        showToast('Package deleted');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.error ||
                        error.message ||
                        'Failed to delete package.';
        showToast(message);
      },
    }
  );

  const handleSave = (formData: FormData): Promise<void> => {
    if (editingPackage) {
      return updatePackageMutation.mutateAsync({
        id: editingPackage.id,
        formData,
      });
    } else {
      return createPackageMutation.mutateAsync(formData);
    }
  };

  if (isLoading) return <div className="text-center py-10 text-sm text-text-muted">Loading packages...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-product-title font-semibold text-text-primary">Packages</h1>
        <button
          onClick={() => setShowBuilder(true)}
          className="btn-cta px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <PlusIcon className="w-4 h-4" /> Create Package
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {packages?.map((pkg: any) => (
          <div key={pkg.id} className="relative group">
            <PremiumPackageCard
              id={pkg.id}
              name={pkg.name}
              image_urls={pkg.image_urls}
              price={pkg.price}
              originalPrice={pkg.original_price}
              vendor={pkg.vendor?.business_name ?? 'Unknown'}
              rating={pkg.rating}
              reviewsCount={pkg.reviews_count}
              stock={pkg.stock_display || pkg.available_stock?.toString() || pkg.stock}
              itemsCount={pkg.items_count}
              discountPercent={pkg.discount_percentage}
              freeDelivery={pkg.free_delivery}
              deliveryLabel={pkg.delivery_label}
            />

            <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditingPackage(pkg);
                  setShowBuilder(true);
                }}
                className="p-1.5 bg-white rounded-full shadow-card hover:bg-surface-hover"
                title="Edit"
              >
                <PencilIcon className="w-4 h-4 text-text-secondary" />
              </button>
              <button
                onClick={() => setDeleteTarget(pkg)}
                className="p-1.5 bg-white rounded-full shadow-card hover:bg-red-50"
                title="Delete"
              >
                <TrashIcon className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showBuilder && (
        <PackageBuilder
          onClose={() => {
            setShowBuilder(false);
            setEditingPackage(null);
          }}
          onSave={handleSave}
          initialData={editingPackage}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={`Delete package "${deleteTarget.name}"?`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-white hover:text-gray-300">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;