import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../../../lib/axios';

// -------- Compact Collection Modal --------
const CollectionModal = ({ collection, onClose, onSave }: any) => {
  const [form, setForm] = useState({
    name: collection?.name || '',
    slug: collection?.slug || '',
    description: collection?.description || '',
    auto_criteria: collection?.auto_criteria
      ? JSON.stringify(collection.auto_criteria, null, 2)
      : '{}',
    is_active: collection?.is_active ?? true,
    start_date: collection?.start_date?.slice(0, 16) || '',
    end_date: collection?.end_date?.slice(0, 16) || '',
    display_order: collection?.display_order || 0,
    cover_image: null as File | null,
  });
  const [preview, setPreview] = useState(collection?.cover_image_url || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, cover_image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'auto_criteria') {
          try {
            formData.append(`collection[${key}]`, JSON.stringify(JSON.parse(value as string)));
          } catch {
            formData.append(`collection[${key}]`, value as string);
          }
        } else {
          formData.append(`collection[${key}]`, value as any);
        }
      }
    });
    onSave(formData);
  };

  const inputClass =
    'w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand';
  const textareaClass =
    'w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-lg rounded-[var(--radius-md)] bg-white shadow-elevated max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
          <h2 className="text-base font-semibold text-text-primary">
            {collection ? 'Edit Collection' : 'Add Collection'}
          </h2>
          <button onClick={onClose} className="rounded-[var(--radius-sm)] p-1 hover:bg-surface-hover">
            <XMarkIcon className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-primary">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-primary">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-primary">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={textareaClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-primary">Auto Criteria (JSON)</label>
            <textarea
              rows={3}
              value={form.auto_criteria}
              onChange={(e) => setForm({ ...form, auto_criteria: e.target.value })}
              className={textareaClass + ' font-mono'}
              placeholder='{"category_ids": [1,2]}'
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-primary">Start Date</label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-primary">End Date</label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-primary">Cover Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-surface-hover file:text-xs file:font-medium file:text-text-secondary hover:file:bg-gray-200"
            />
            {preview && (
              <img src={preview} alt="Preview" className="mt-2 h-16 w-16 rounded-lg object-cover border border-border-light" />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-primary">Display Order</label>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 0 })}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-border-light text-brand focus:ring-brand"
            />
            <label className="text-xs text-text-primary">Active</label>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-border-light px-5 py-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-xs font-medium">
            Cancel
          </button>
          <button type="submit" onClick={handleSubmit} className="btn-cta px-4 py-2 text-xs font-semibold">
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// -------- Main Page --------
const CollectionsPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: collections = [], isLoading } = useQuery('adminCollections', () =>
    api.get('/admin/collections').then((res) => res.data)
  );

  const createMutation = useMutation(
    (formData: FormData) =>
      api.post('/admin/collections', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    { onSuccess: () => { queryClient.invalidateQueries('adminCollections'); setShowModal(false); } }
  );

  const updateMutation = useMutation(
    ({ id, formData }: any) =>
      api.put(`/admin/collections/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    { onSuccess: () => { queryClient.invalidateQueries('adminCollections'); setShowModal(false); setEditing(null); } }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/admin/collections/${id}`),
    { onSuccess: () => queryClient.invalidateQueries('adminCollections') }
  );

  const handleSave = (formData: FormData) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleRefresh = (id: number) => {
    api.post(`/admin/collections/${id}/refresh_products`).then(() => {
      queryClient.invalidateQueries('adminCollections');
    });
  };

  if (isLoading) return <div className="text-sm text-text-muted py-10 text-center">Loading collections…</div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-product-title font-semibold text-text-primary">Collections</h1>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="btn-cta inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add Collection
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {collections.map((collection: any) => (
          <div key={collection.id} className="card-product p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-text-primary">{collection.name}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    collection.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-text-secondary'
                  }`}
                >
                  {collection.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-text-muted">Slug: {collection.slug}</p>
              <p className="text-xs text-text-muted line-clamp-2">{collection.description}</p>
              {collection.cover_image_url && (
                <img
                  src={collection.cover_image_url}
                  alt={collection.name}
                  className="mt-2 h-16 w-full object-cover rounded-[var(--radius-sm)] border border-border-light"
                />
              )}
            </div>
            {/* Buttons: Refresh | Edit | Delete */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border-light">
              <button
                onClick={() => handleRefresh(collection.id)}
                className="text-xs font-medium text-green-600 hover:text-green-700"
              >
                Refresh
              </button>
              <button
                onClick={() => { setEditing(collection); setShowModal(true); }}
                className="text-brand hover:text-brand-hover text-xs font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => { if (window.confirm('Delete this collection?')) deleteMutation.mutate(collection.id); }}
                className="text-red-500 hover:text-red-600 text-xs font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <CollectionModal
            collection={editing}
            onClose={() => { setShowModal(false); setEditing(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollectionsPage;