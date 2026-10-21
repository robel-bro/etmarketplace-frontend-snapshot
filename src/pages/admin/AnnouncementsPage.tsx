import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';

const AnnouncementsPage = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcement_type: 'announcement',
    active: true,
    start_date: '',
    end_date: '',
    link: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch announcements
  const { data: announcements = [], isLoading, isError } = useQuery(
    'adminAnnouncements',
    () => api.get('/admin/announcements').then(res => res.data)
  );

  // Create / Update mutation
  const saveMutation = useMutation(
    (data: any) => {
      const formDataToSend = new FormData();
      formDataToSend.append('announcement[title]', data.title);
      formDataToSend.append('announcement[content]', data.content);
      formDataToSend.append('announcement[announcement_type]', data.announcement_type);
      formDataToSend.append('announcement[active]', data.active);
      formDataToSend.append('announcement[start_date]', data.start_date);
      formDataToSend.append('announcement[end_date]', data.end_date);
      formDataToSend.append('announcement[link]', data.link || '');
      if (selectedFile) formDataToSend.append('announcement[image]', selectedFile);

      if (editing) {
        return api.put(`/admin/announcements/${editing.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        return api.post('/admin/announcements', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminAnnouncements');
        closeModal();
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => api.delete(`/admin/announcements/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminAnnouncements');
        setDeleteTarget(null);
      },
    }
  );

  // Toggle active
  const toggleMutation = useMutation(
    (ann: any) =>
      api.put(`/admin/announcements/${ann.id}`, {
        announcement: { active: !ann.active },
      }),
    { onSuccess: () => queryClient.invalidateQueries('adminAnnouncements') }
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = (type: 'announcement' | 'banner' = 'announcement') => {
    setEditing(null);
    setFormData({
      title: '',
      content: '',
      announcement_type: type,
      active: true,
      start_date: '',
      end_date: '',
      link: '',
    });
    setImagePreview(null);
    setSelectedFile(null);
    setModalOpen(true);
  };

  const openEditModal = (ann: any) => {
    setEditing(ann);
    setFormData({
      title: ann.title,
      content: ann.content,
      announcement_type: ann.announcement_type,
      active: ann.active,
      start_date: ann.start_date,
      end_date: ann.end_date,
      link: ann.link || '',
    });
    setImagePreview(ann.image_url || null);
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;
    saveMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const toggleActive = (ann: any) => {
    toggleMutation.mutate(ann);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setSelectedFile(null);
    setImagePreview(null);
  };

  if (isLoading) return <div className="text-sm text-text-muted py-10 text-center">Loading announcements…</div>;
  if (isError) return <div className="text-sm text-red-500 py-10 text-center">Failed to load announcements.</div>;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <h1 className="text-product-title font-semibold text-text-primary">Announcements & Banners</h1>
        <div className="flex gap-2">
          <button
            onClick={() => openAddModal('announcement')}
            className="btn-cta px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            New Announcement
          </button>
          <button
            onClick={() => openAddModal('banner')}
            className="btn-secondary px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            New Banner
          </button>
        </div>
      </div>

      {/* Listing */}
      <div className="space-y-2">
        {announcements.map((a: any) => (
          <motion.div key={a.id} layout className="card-product p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {a.announcement_type === 'banner' && a.image_url && (
                  <img src={a.image_url} alt={a.title} className="w-14 h-14 rounded object-cover border border-border-light" />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-text-primary">{a.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      a.announcement_type === 'banner'
                        ? 'bg-brand-light text-brand'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {a.announcement_type}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{a.content}</p>
                  {a.link && (
                    <p className="text-[10px] text-text-muted mt-0.5">Link: {a.link}</p>
                  )}
                  <p className="text-[10px] text-text-muted mt-1">{a.start_date} – {a.end_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  a.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-text-secondary'
                }`}>
                  {a.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => toggleActive(a)}
                  className="text-xs font-medium text-text-muted hover:text-brand"
                >
                  {a.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => openEditModal(a)} className="text-text-muted hover:text-text-primary">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(a)} className="text-text-muted hover:text-red-500">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-[var(--radius-md)] shadow-elevated max-w-lg w-full p-5"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-text-primary">
                  {editing ? 'Edit' : 'New'} {formData.announcement_type === 'banner' ? 'Banner' : 'Announcement'}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-surface-hover rounded-[var(--radius-sm)]">
                  <XMarkIcon className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Link (optional)</label>
                  <input
                    type="text"
                    placeholder="https://example.com or /category/electronics"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Type</label>
                  <select
                    value={formData.announcement_type}
                    onChange={(e) => setFormData({ ...formData, announcement_type: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="banner">Banner</option>
                  </select>
                </div>
                {formData.announcement_type === 'banner' && (
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Banner Image</label>
                    <div className="flex items-center gap-4">
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded object-cover border border-border-light" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-surface-hover file:text-text-secondary hover:file:bg-gray-200"
                      />
                    </div>
                    <p className="text-[10px] text-text-muted mt-1">Recommended size 1200×400. PNG or JPG.</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-border-light text-brand focus:ring-brand"
                  />
                  <label className="text-xs text-text-primary">Active immediately</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={closeModal} className="btn-secondary px-4 py-2 text-xs font-medium">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-cta px-4 py-2 text-xs font-semibold">
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-[var(--radius-md)] shadow-elevated max-w-md w-full p-5"
            >
              <h2 className="text-base font-semibold text-text-primary mb-2">Delete {deleteTarget.announcement_type}</h2>
              <p className="text-sm text-text-secondary mb-5">Are you sure you want to delete "{deleteTarget.title}"?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary px-4 py-2 text-xs font-medium">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteTarget.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-[var(--radius-sm)] text-xs font-semibold transition">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsPage;