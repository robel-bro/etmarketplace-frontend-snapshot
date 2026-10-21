import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { XMarkIcon, PlusIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import api from '../../lib/axios';

const PackageFormModal = ({ package: initialPackage, onClose, onSuccess }) => {
  console.log('🔧 PackageFormModal RENDERED (video section should appear)');

  const [name, setName] = useState(initialPackage?.name || '');
  const [description, setDescription] = useState(initialPackage?.description || '');
  const [price, setPrice] = useState(initialPackage?.price || '');
  const [status, setStatus] = useState(initialPackage?.status || 'active');

  // Images & Videos state
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialPackage?.image_urls || []);
  const [existingVideos, setExistingVideos] = useState<string[]>(initialPackage?.video_urls || []);
  const [imageIds, setImageIds] = useState<number[]>(initialPackage?.image_ids || []);
  const [videoIds, setVideoIds] = useState<number[]>(initialPackage?.video_ids || []);

  // Discount
  const [discountType, setDiscountType] = useState(initialPackage?.discount_type || 'percentage');
  const [discountValue, setDiscountValue] = useState(initialPackage?.discount_value || '');
  const [discountStart, setDiscountStart] = useState(initialPackage?.discount_start || '');
  const [discountEnd, setDiscountEnd] = useState(initialPackage?.discount_end || '');

  // Shipping
  const [sellerPaysShipping, setSellerPaysShipping] = useState(initialPackage?.seller_pays_shipping || false);
  const [shippingSubsidyType, setShippingSubsidyType] = useState(initialPackage?.shipping_subsidy_type || 'full');
  const [shippingSubsidyValue, setShippingSubsidyValue] = useState(initialPackage?.shipping_subsidy_value || '');

  // Categories & Products
  const [categoryId, setCategoryId] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(
    initialPackage?.products?.map((p: any) => p.id) || []
  );

  // Features
  const [features, setFeatures] = useState<string[]>(initialPackage?.features || []);

  const { data: categories } = useQuery('categories', () =>
    api.get('/categories').then(res => res.data)
  );

  const { data: sellerProducts } = useQuery(
    'my-products',
    () => api.get('/products?vendor=me&per_page=100').then(res => res.data?.data || []),
    { enabled: true }
  );

  const mutation = useMutation(
    (formData: FormData) => {
      if (initialPackage) {
        return api.put(`/packages/${initialPackage.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        return api.post('/packages', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
    },
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    }
  );

  const toggleProduct = (id: number) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const addFeature = () => setFeatures([...features, '']);
  const removeFeature = (i: number) => setFeatures(features.filter((_, idx) => idx !== i));
  const updateFeature = (i: number, val: string) => {
    const updated = [...features];
    updated[i] = val;
    setFeatures(updated);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('📹 Video files selected:', files.length);
    const maxSize = 50 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`${file.name} exceeds 50MB limit.`);
        return false;
      }
      return true;
    });
    if (videos.length + validFiles.length > 3) {
      alert('Maximum 3 videos allowed.');
      return;
    }
    setVideos([...videos, ...validFiles]);
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (index: number) => {
    setExistingVideos(existingVideos.filter((_, i) => i !== index));
    setVideoIds(videoIds.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || selectedProductIds.length === 0) {
      alert('Name, price, and at least one product are required.');
      return;
    }

    const formData = new FormData();
    formData.append('package[name]', name);
    formData.append('package[description]', description);
    formData.append('package[price]', price);
    formData.append('package[status]', status);

    if (discountValue) {
      formData.append('package[discount_type]', discountType);
      formData.append('package[discount_value]', discountValue);
      if (discountStart) formData.append('package[discount_start]', discountStart);
      if (discountEnd) formData.append('package[discount_end]', discountEnd);
    }

    formData.append('package[seller_pays_shipping]', sellerPaysShipping.toString());
    if (sellerPaysShipping) {
      formData.append('package[shipping_subsidy_type]', shippingSubsidyType);
      if (shippingSubsidyType === 'percentage') {
        formData.append('package[shipping_subsidy_value]', shippingSubsidyValue);
      }
    }

    if (categoryId) formData.append('package[category_ids][]', categoryId);

    selectedProductIds.forEach(id => formData.append('package[product_ids][]', id.toString()));

    formData.append('package[features]', JSON.stringify(features.filter(f => f.trim())));

    if (initialPackage) {
      if (imageIds.length > 0) formData.append('package[keep_image_ids]', imageIds.join(','));
      if (videoIds.length > 0) formData.append('package[keep_video_ids]', videoIds.join(','));
    }

    images.forEach(img => formData.append('package[images][]', img));
    videos.forEach(file => formData.append('package[videos][]', file));

    mutation.mutate(formData);
  };

  console.log('🎬 Video section state:', { videosCount: videos.length, existingVideosCount: existingVideos.length });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{initialPackage ? 'Edit Package' : 'Create Package'}</h2>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Package Name *" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-2" required />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg p-2" rows={3} />
          <input type="number" placeholder="Price *" value={price} onChange={e => setPrice(e.target.value)} className="w-full border rounded-lg p-2" required />
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border rounded-lg p-2">
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border rounded-lg p-2">
            <option value="">Select Category (optional)</option>
            {Array.isArray(categories) && categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <div>
            <label className="block text-sm font-medium mb-1">Products *</label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {sellerProducts?.map((prod: any) => (
                <label key={prod.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(prod.id)}
                    onChange={() => toggleProduct(prod.id)}
                  />
                  {prod.title} - {prod.effective_price || prod.price} ETB
                </label>
              ))}
              {(!sellerProducts || sellerProducts.length === 0) && (
                <p className="text-sm text-gray-500">No products found.</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="border rounded-lg p-2">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            <input
              type="number"
              placeholder="Discount Value"
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              className="border rounded-lg p-2 flex-1"
            />
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={sellerPaysShipping} onChange={e => setSellerPaysShipping(e.target.checked)} />
            I will pay delivery
          </label>
          {sellerPaysShipping && (
            <div className="flex gap-2">
              <select value={shippingSubsidyType} onChange={e => setShippingSubsidyType(e.target.value)} className="border rounded-lg p-2">
                <option value="full">Full delivery</option>
                <option value="percentage">Percentage of delivery</option>
              </select>
              {shippingSubsidyType === 'percentage' && (
                <input
                  type="number"
                  placeholder="%"
                  value={shippingSubsidyValue}
                  onChange={e => setShippingSubsidyValue(e.target.value)}
                  className="border rounded-lg p-2 w-20"
                />
              )}
            </div>
          )}

          <div>
            <div className="flex justify-between">
              <label className="block text-sm font-medium">Features</label>
              <button type="button" onClick={addFeature} className="text-blue-600 text-sm"><PlusIcon className="w-4 h-4 inline" /> Add</button>
            </div>
            {features.map((feat, i) => (
              <div key={i} className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={feat}
                  onChange={e => updateFeature(i, e.target.value)}
                  className="flex-1 border rounded-lg p-2"
                  placeholder="Feature"
                />
                <button type="button" onClick={() => removeFeature(i)} className="text-red-500">✕</button>
              </div>
            ))}
          </div>

          {/* Images Section */}
          <div>
            <label className="block text-sm font-medium mb-1">Images</label>
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {existingImages.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="" className="w-full h-20 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => {
                        setExistingImages(existingImages.filter((_, i) => i !== idx));
                        setImageIds(imageIds.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-0 right-0 bg-white text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={e => setImages(Array.from(e.target.files || []))}
              className="text-sm"
            />
          </div>

          {/* ★ VIDEO DEBUG BANNER – do we reach this point? ★ */}
          <div style={{ backgroundColor: 'red', padding: '10px', color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
            🎬 DEBUG: Video section below (videos: {videos.length}, existingVideos: {existingVideos.length})
          </div>

          {/* Videos Section */}
          <div>
            <label className="block text-sm font-medium mb-1">Videos (max 3, 50MB each)</label>
            {existingVideos.length > 0 && (
              <div className="space-y-1 mb-2">
                {existingVideos.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-gray-100 px-2 py-1 rounded">
                    <span>Video {idx + 1}</span>
                    <span className="text-gray-500">(existing)</span>
                    <button type="button" onClick={() => removeExistingVideo(idx)} className="text-red-500 hover:text-red-700">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 text-sm font-medium transition">
                <VideoCameraIcon className="w-4 h-4" />
                Choose Videos
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  multiple
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-500">{videos.length}/3 new videos</span>
            </div>
            {videos.length > 0 && (
              <div className="space-y-1">
                {videos.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-gray-100 px-2 py-1 rounded">
                    <span className="truncate">{file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                    <button type="button" onClick={() => removeVideo(idx)} className="text-red-500 hover:text-red-700">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg w-full" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PackageFormModal;