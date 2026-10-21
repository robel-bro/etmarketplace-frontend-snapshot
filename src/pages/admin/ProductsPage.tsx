// src/pages/admin/ProductsPage.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';

const statusTabClass = (tab: string, active: string) =>
  `px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition border ${
    tab === active
      ? 'bg-brand text-white border-brand shadow-card'
      : 'bg-white text-text-secondary border-border-light hover:border-border-medium'
  }`;

const AdminProductsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [page, setPage] = useState(1);
  const perPage = 50;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery(
    ['adminProducts', page, search, statusFilter],
    () =>
      api.get('/admin/products', {
        params: {
          page,
          per_page: perPage,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      }).then(res => res.data),
    {
      keepPreviousData: true,
      staleTime: 30 * 1000,
    }
  );

  const products = response?.data || [];
  const meta = response?.meta;
  const totalCount = meta?.total_count || 0;

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Toggle product status: active <-> archived (inactive)
  const toggleStatus = useMutation(
    (product: any) => {
      const newStatus = product.status === 'active' ? 'archived' : 'active';
      return api.patch(`/admin/products/${product.id}`, { product: { status: newStatus } });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminProducts');
        clearMessages();
        setSuccessMsg('Product status updated.');
      },
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.error || 'Failed to update product status.');
      },
    }
  );

  // Delete product
  const deleteProduct = useMutation(
    (id: number) => api.delete(`/admin/products/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminProducts');
        setDeleteTarget(null);
        clearMessages();
        setSuccessMsg('Product deleted successfully.');
      },
      onError: (err: any, id) => {
        // If 404, product already gone – treat as success
        if (err.response?.status === 404) {
          queryClient.setQueryData<any>(
            ['adminProducts', page, search, statusFilter],
            (old: any) => ({
              ...old,
              data: (old?.data || []).filter((p: any) => p.id !== id),
            })
          );
          setDeleteTarget(null);
          setSuccessMsg('Product was already deleted.');
        } else {
          setErrorMsg(err.response?.data?.error || 'Failed to delete product.');
        }
      },
    }
  );

  const handleDelete = (id: number) => deleteProduct.mutate(id);
  const handleToggle = (product: any) => toggleStatus.mutate(product);

  const totalPages = meta ? Math.ceil(totalCount / perPage) : 1;

  if (isLoading && !response) {
    return <div className="text-sm text-text-muted py-10 text-center">Loading products…</div>;
  }

  if (isError) {
    console.error('adminProducts error:', error);
    return (
      <div className="text-sm text-red-500 py-10 text-center">
        Failed to load products.{' '}
        <button onClick={() => queryClient.invalidateQueries('adminProducts')} className="underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-product-title font-semibold text-text-primary">Products</h1>
        <span className="text-xs text-text-muted">{totalCount} total</span>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={clearMessages} className="text-red-500 hover:text-red-700">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span className="flex items-center gap-1">
            <CheckCircleIcon className="w-4 h-4" /> {successMsg}
          </span>
          <button onClick={clearMessages} className="text-green-500 hover:text-green-700">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search + Status Tabs */}
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search products by name or seller..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-10 pl-9 pr-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => { setStatusFilter('all'); setPage(1); }} className={statusTabClass('all', statusFilter)}>
            All
          </button>
          <button onClick={() => { setStatusFilter('active'); setPage(1); }} className={statusTabClass('active', statusFilter)}>
            Active
          </button>
          <button onClick={() => { setStatusFilter('archived'); setPage(1); }} className={statusTabClass('archived', statusFilter)}>
            Inactive
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card-product overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover border-b border-border-light">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Product</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Seller</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Price</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Stock</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Status</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-text-muted">
                  No products found.
                </td>
              </tr>
            )}
            {products.map((product: any) => (
              <tr key={product.id} className="hover:bg-surface-hover transition">
                <td className="px-4 py-3 flex items-center gap-3">
                  <img
                    src={product.image_urls?.[0] || '/placeholder.jpg'}
                    alt={product.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <span className="text-sm font-medium text-text-primary">{product.title}</span>
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  {product.vendor?.business_name || 'Unknown'}
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-text-primary">
                  ETB {product.effective_price?.toLocaleString() || '—'}
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  {product.stock_display || '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      product.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-text-secondary'
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => handleToggle(product)}
                    disabled={toggleStatus.isLoading}
                    className="text-xs font-medium text-brand hover:text-brand-hover"
                  >
                    {product.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(product)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1 || isLoading}
            className="inline-flex items-center gap-1 text-xs font-medium text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>
          <span className="text-xs text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!meta?.next_page || isLoading}
            className="inline-flex items-center gap-1 text-xs font-medium text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="card-product p-5 max-w-md w-full"
            >
              <h2 className="text-base font-semibold text-text-primary mb-2">Delete Product</h2>
              <p className="text-sm text-text-secondary mb-5">
                Are you sure you want to delete "{deleteTarget.title}"?
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary px-4 py-2 text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget.id)}
                  disabled={deleteProduct.isLoading}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition disabled:opacity-50"
                >
                  {deleteProduct.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductsPage;