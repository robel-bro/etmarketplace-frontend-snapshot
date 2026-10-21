import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';

interface Category {
  id: number;
  name: string;
  image?: string;
  image_url?: string;
  parent_id: number | null;
  children?: Category[];
  product_count?: number;
}

const buildCategoryTree = (categories: Category[]): Category[] => {
  const map = new Map<number, Category>();
  const roots: Category[] = [];

  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addingParentId, setAddingParentId] = useState<number | null>(null);
  const [isAddingRoot, setIsAddingRoot] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: categoriesFlat, isLoading } = useQuery(
    'adminCategories',
    () => api.get('/admin/categories').then(res => res.data),
    { staleTime: 5 * 60 * 1000 }
  );

  const categories = categoriesFlat ? buildCategoryTree(categoriesFlat) : [];

  const createCategory = useMutation(
    (newCategory: { name: string; parent_id: number | null }) => {
      const formData = new FormData();
      formData.append('category[name]', newCategory.name);
      if (newCategory.parent_id) formData.append('category[parent_id]', newCategory.parent_id.toString());
      if (selectedFile) formData.append('category[image]', selectedFile);
      return api.post('/admin/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminCategories');
        queryClient.invalidateQueries('categories');
        closeModal();
      },
    }
  );

  const updateCategory = useMutation(
    (updated: { id: number; name: string }) => {
      const formData = new FormData();
      formData.append('category[name]', updated.name);
      if (selectedFile) formData.append('category[image]', selectedFile);
      return api.put(`/admin/categories/${updated.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminCategories');
        queryClient.invalidateQueries('categories');
        closeModal();
      },
    }
  );

  const deleteCategory = useMutation(
    (id: number) => api.delete(`/admin/categories/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminCategories');
        queryClient.invalidateQueries('categories');
      },
    }
  );

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedIds(newExpanded);
  };

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

  const handleAdd = () => {
    if (!newCategoryName.trim()) return;
    createCategory.mutate({ name: newCategoryName, parent_id: addingParentId });
  };

  const handleUpdate = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    updateCategory.mutate({ id: editingCategory.id, name: editingCategory.name });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this category and all its subcategories?')) {
      deleteCategory.mutate(id);
    }
  };

  const closeModal = () => {
    setIsAddingRoot(false);
    setAddingParentId(null);
    setEditingCategory(null);
    setNewCategoryName('');
    setImagePreview(null);
    setSelectedFile(null);
  };

  const renderCategory = (cat: Category, depth = 0) => {
    const isExpanded = expandedIds.has(cat.id);
    const hasChildren = cat.children && cat.children.length > 0;

    return (
      <div key={cat.id} className="select-none">
        <div
          className={`flex items-center justify-between py-1.5 px-2 hover:bg-surface-hover rounded-[var(--radius-sm)] transition ${
            depth > 0 ? 'ml-5' : ''
          }`}
        >
          <div className="flex items-center flex-1 gap-2">
            <button
              onClick={() => toggleExpand(cat.id)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDownIcon className="w-3.5 h-3.5 text-text-muted" />
                ) : (
                  <ChevronRightIcon className="w-3.5 h-3.5 text-text-muted" />
                )
              ) : (
                <span className="w-3.5 h-3.5" />
              )}
            </button>
            <img
              src={cat.image_url || cat.image || '/placeholder.jpg'}
              alt={cat.name}
              className="w-6 h-6 rounded object-cover"
            />
            <span className="text-sm font-medium text-text-primary">
              {cat.name}
            </span>
            <span className="text-[10px] text-text-muted bg-surface-hover px-1.5 py-0.5 rounded-full">
              ID:{cat.id}
            </span>
            <span className="text-[10px] text-text-muted ml-1">
              ({cat.product_count ?? 0} products)
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setAddingParentId(cat.id);
                setImagePreview(null);
                setSelectedFile(null);
              }}
              className="p-1 text-text-muted hover:text-brand rounded hover:bg-brand-light"
              title="Add subcategory"
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setEditingCategory(cat);
                setImagePreview(cat.image_url || cat.image || null);
                setSelectedFile(null);
              }}
              className="p-1 text-text-muted hover:text-brand rounded hover:bg-brand-light"
              title="Edit"
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="p-1 text-text-muted hover:text-red-500 rounded hover:bg-red-50"
              title="Delete"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="border-l-2 border-border-light ml-6">
            {cat.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) return <div className="text-center py-20 text-sm text-text-muted">Loading categories…</div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-product-title font-semibold text-text-primary">Categories</h1>
        <button
          onClick={() => {
            setIsAddingRoot(true);
            setImagePreview(null);
            setSelectedFile(null);
          }}
          className="btn-cta px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add Root Category
        </button>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddingRoot || addingParentId !== null || editingCategory) && (
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-text-primary">
                  {editingCategory ? 'Edit Category' : isAddingRoot ? 'New Root Category' : 'Add Subcategory'}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-surface-hover rounded-[var(--radius-sm)]">
                  <XMarkIcon className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-text-primary">Category Name</label>
                  <input
                    type="text"
                    value={editingCategory ? editingCategory.name : newCategoryName}
                    onChange={(e) => {
                      if (editingCategory) {
                        setEditingCategory({ ...editingCategory, name: e.target.value });
                      } else {
                        setNewCategoryName(e.target.value);
                      }
                    }}
                    className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-primary">Category Image</label>
                  <div className="mt-1 flex items-center gap-3">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-12 h-12 rounded object-cover border border-border-light"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="block w-full text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius-sm)] file:border-0 file:text-xs file:font-medium file:bg-brand-light file:text-brand hover:file:bg-brand/10"
                    />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">Upload an image (PNG, JPG, up to 2MB).</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={closeModal} className="btn-secondary px-4 py-2 text-xs">Cancel</button>
                <button
                  onClick={() => {
                    if (editingCategory) handleUpdate();
                    else handleAdd();
                  }}
                  className="btn-cta px-4 py-2 text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tree */}
      <div className="card-product p-4">
        {categories.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-10">
            No categories yet. Click “Add Root Category” to create one.
          </p>
        ) : (
          categories.map(cat => renderCategory(cat))
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;