import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import api from '../../../lib/axios';

interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  link: string;
  start_date: string;
  end_date: string;
  display_order: number;
  is_active: boolean;
  image_url: string;
}

const HeroBannersPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: banners, isLoading } = useQuery<HeroBanner[]>(
    'adminHeroBanners',
    () => api.get('/admin/hero_banners').then(res => res.data)
  );

  const createMutation = useMutation(
    (formData: FormData) =>
      api.post('/admin/hero_banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminHeroBanners');
        setShowModal(false);
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, formData }: { id: number; formData: FormData }) =>
      api.put(`/admin/hero_banners/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminHeroBanners');
        setShowModal(false);
        setEditingBanner(null);
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/admin/hero_banners/${id}`),
    { onSuccess: () => queryClient.invalidateQueries('adminHeroBanners') }
  );

  const reorderMutation = useMutation(
    (order: number[]) => api.post('/admin/hero_banners/reorder', { order }),
    { onSuccess: () => queryClient.invalidateQueries('adminHeroBanners') }
  );

  const handleSave = (formData: FormData) => {
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newBanners = [...(banners || [])];
    const [draggedItem] = newBanners.splice(draggedIndex, 1);
    newBanners.splice(dropIndex, 0, draggedItem);

    const order = newBanners.map(b => b.id);
    reorderMutation.mutate(order);
    setDraggedIndex(null);
  };

  if (isLoading) return <div className="text-center py-20 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Hero Banners</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          <PlusIcon className="w-4 h-4" /> Add Banner
        </button>
      </div>

      <div className="card p-4">
        <div className="space-y-2">
          {banners?.map((banner, idx) => (
            <div
              key={banner.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition cursor-move"
            >
              <div className="cursor-grab w-8 flex justify-center">
                <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{banner.title}</h3>
                <p className="text-xs text-gray-500 truncate">{banner.subtitle}</p>
                <div className="text-xs text-gray-400 mt-0.5">
                  {new Date(banner.start_date).toLocaleDateString()} –{' '}
                  {new Date(banner.end_date).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    banner.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingBanner(banner);
                    setShowModal(true);
                  }}
                  className="text-gray-500 hover:text-[var(--color-orange-500)] transition"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(banner.id)}
                  className="text-gray-500 hover:text-red-500 transition"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {(!banners || banners.length === 0) && (
            <div className="text-center py-12 text-gray-400 text-sm">No banners yet</div>
          )}
        </div>
      </div>

      {showModal && (
        <BannerModal
          banner={editingBanner}
          onClose={() => {
            setShowModal(false);
            setEditingBanner(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

/* ───── Modal Component ───── */
const BannerModal = ({ banner, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    link: banner?.link || '',
    start_date: banner?.start_date?.slice(0, 16) || '',
    end_date: banner?.end_date?.slice(0, 16) || '',
    is_active: banner?.is_active ?? true,
    display_order: banner?.display_order || 0,
    image: null as File | null,
  });

  const [preview, setPreview] = useState(banner?.image_url || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined && key !== 'image') {
        formData.append(`hero_banner[${key}]`, value as any);
      }
    });
    if (form.image) {
      formData.append('hero_banner[image]', form.image);
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-100"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {banner ? 'Edit Banner' : 'Add Banner'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-premium mt-1"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Subtitle</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="input-premium mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Link (URL)</label>
            <input
              type="url"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className="input-premium mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Start Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="input-premium mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">End Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="input-premium mt-1"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 text-xs"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 w-28 h-28 object-cover rounded-lg border"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-gray-300 text-[var(--color-orange-500)] focus:ring-[var(--color-orange-500)]"
            />
            <label className="text-xs text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default HeroBannersPage;