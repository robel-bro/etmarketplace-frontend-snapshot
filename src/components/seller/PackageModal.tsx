import { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, SparklesIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation } from 'react-query';
import api from '../../lib/axios';

interface PackageModalProps {
  pkg?: any; // for editing
  onClose: () => void;
  onSave: () => void; // callback after successful save
}

const PackageModal = ({ pkg, onClose, onSave }: PackageModalProps) => {
  // Mode: 'new' = create a product on the fly, 'existing' = select from existing products
  const [mode, setMode] = useState<'new' | 'existing'>('existing');

  // Package fields
  const [packageName, setPackageName] = useState(pkg?.name || '');
  const [packageDescription, setPackageDescription] = useState(pkg?.description || '');
  const [packagePrice, setPackagePrice] = useState(pkg?.price || '');
  const [packageStock, setPackageStock] = useState(pkg?.stock || ''); // optional
  const [packageImages, setPackageImages] = useState<{ file: File; preview: string }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    pkg?.categories?.map((c: any) => c.id) || []
  );

  // For new product creation
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productImages, setProductImages] = useState<{ file: File; preview: string }[]>([]);
  const [productMainCategory, setProductMainCategory] = useState('');
  const [productSubCategory, setProductSubCategory] = useState('');

  // For existing product selection
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(
    pkg?.products?.map((p: any) => p.id) || []
  );

  // AI loading states
  const [aiLoadingPackage, setAiLoadingPackage] = useState(false);
  const [aiLoadingProduct, setAiLoadingProduct] = useState(false);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery(
    'categories',
    () => api.get('/categories').then(res => res.data)
  );

  // Fetch seller's products (for existing mode)
  const { data: sellerProducts, isLoading: productsLoading } = useQuery(
    'sellerProducts',
    () => api.get('/vendor/products').then(res => res.data),
    { staleTime: 5 * 60 * 1000 }
  );

  // Mutation to create a product (used in 'new' mode)
  const createProductMutation = useMutation(
    (formData: FormData) => api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  );

  // Mutation to create/update a package
  const savePackageMutation = useMutation(
    (data: any) => {
      if (pkg) {
        return api.put(`/packages/${pkg.id}`, { package: data });
      } else {
        return api.post('/packages', { package: data });
      }
    },
    {
      onSuccess: () => {
        onSave();
        onClose();
      },
    }
  );

  // Build category tree (ancestry based)
  const buildCategoryTree = (cats: any[]): any[] => {
    const tree: any[] = [];
    const map: { [key: string]: any } = {};
    cats.forEach(cat => (map[cat.id] = { ...cat, children: [] }));
    cats.forEach(cat => {
      if (cat.ancestry) {
        const parentId = cat.ancestry.split('/').pop();
        if (map[parentId]) map[parentId].children.push(map[cat.id]);
        else tree.push(map[cat.id]);
      } else {
        tree.push(map[cat.id]);
      }
    });
    return tree;
  };

  const categoryTree = categories ? buildCategoryTree(categories) : [];

  const renderCategoryTree = (nodes: any[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} style={{ marginLeft: level * 20 }} className="mb-1">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedCategoryIds.includes(node.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCategoryIds([...selectedCategoryIds, node.id]);
              } else {
                setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== node.id));
              }
            }}
            className="rounded text-primary-600"
          />
          <span className="text-sm">{node.name}</span>
        </label>
        {node.children && renderCategoryTree(node.children, level + 1)}
      </div>
    ));
  };

  // AI description generation
  const generateAIDescription = (target: 'package' | 'product') => {
    const setLoading = target === 'package' ? setAiLoadingPackage : setAiLoadingProduct;
    const setDescription = target === 'package' ? setPackageDescription : setProductDescription;
    setLoading(true);
    setTimeout(() => {
      const suggestions = [
        'This premium package combines quality and value, perfect for everyday use.',
        'Experience the best of Ethiopian craftsmanship with this curated selection.',
        'A must‑have bundle for those who appreciate style and functionality.',
      ];
      setDescription(suggestions[Math.floor(Math.random() * suggestions.length)]);
      setLoading(false);
    }, 1000);
  };

  // Image upload handlers
  const handlePackageImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + packageImages.length > 6) {
      alert('You can upload a maximum of 6 images.');
      return;
    }
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPackageImages([...packageImages, ...newImages]);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + productImages.length > 6) {
      alert('You can upload a maximum of 6 images.');
      return;
    }
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setProductImages([...productImages, ...newImages]);
  };

  const removeImage = (setter: React.Dispatch<any>, images: any[], index: number) => {
    URL.revokeObjectURL(images[index].preview);
    setter(images.filter((_, i) => i !== index));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate package fields
    if (!packageName.trim()) {
      alert('Package name is required.');
      return;
    }
    if (!packageDescription.trim()) {
      alert('Package description is required.');
      return;
    }
    if (!packagePrice || parseFloat(packagePrice) <= 0) {
      alert('Valid package price is required.');
      return;
    }
    if (selectedCategoryIds.length === 0) {
      alert('Select at least one category for the package.');
      return;
    }

    let productIds: number[] = [];

    if (mode === 'new') {
      // Validate new product fields
      if (!productTitle.trim()) {
        alert('Product title is required.');
        return;
      }
      if (!productDescription.trim()) {
        alert('Product description is required.');
        return;
      }
      if (!productPrice || parseFloat(productPrice) <= 0) {
        alert('Valid product price is required.');
        return;
      }
      if (!productMainCategory) {
        alert('Select a main category for the product.');
        return;
      }

      // Prepare product FormData
      const formData = new FormData();
      formData.append('product[title]', productTitle);
      formData.append('product[description]', productDescription);
      formData.append('product[price]', productPrice);
      formData.append('product[stock]', productStock || '0');
      const categoryId = productSubCategory || productMainCategory;
      formData.append('product[category_id]', categoryId);
      productImages.forEach((img, idx) => {
        formData.append(`product[images][]`, img.file);
      });

      try {
        const response = await createProductMutation.mutateAsync(formData);
        productIds = [response.data.id];
      } catch (error) {
        alert('Failed to create product. Check console.');
        console.error(error);
        return;
      }
    } else {
      // existing mode
      if (selectedProductIds.length === 0) {
        alert('Select at least one existing product.');
        return;
      }
      productIds = selectedProductIds;
    }

    // Prepare package data
    const packageData: any = {
      name: packageName,
      description: packageDescription,
      price: packagePrice,
      stock: packageStock || 0,
      category_ids: selectedCategoryIds,
      product_ids: productIds,
      status: pkg?.status || 'active',
    };

    // Add package images if any (you may need to adjust backend to accept package images)
    // For simplicity, we skip package images for now.

    savePackageMutation.mutate(packageData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-3xl w-full my-8 p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{pkg ? 'Edit Package' : 'Create Package'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode selection (only for new package) */}
          {!pkg && (
            <div className="flex gap-4 border-b pb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="existing"
                  checked={mode === 'existing'}
                  onChange={() => setMode('existing')}
                />
                <span>Select existing products</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="new"
                  checked={mode === 'new'}
                  onChange={() => setMode('new')}
                />
                <span>Create new product</span>
              </label>
            </div>
          )}

          {/* Package details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Package Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">Package Name</label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Package Description</label>
                <button
                  type="button"
                  onClick={() => generateAIDescription('package')}
                  disabled={aiLoadingPackage}
                  className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {aiLoadingPackage ? 'Thinking...' : 'AI Suggest'}
                </button>
              </div>
              <textarea
                rows={3}
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (ETB)</label>
                <input
                  type="number"
                  value={packagePrice}
                  onChange={(e) => setPackagePrice(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock (optional)</label>
                <input
                  type="number"
                  value={packageStock}
                  onChange={(e) => setPackageStock(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border rounded-lg"
                  min="0"
                />
              </div>
            </div>

            {/* Package categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Package Categories</label>
              {categoriesLoading ? (
                <div>Loading categories...</div>
              ) : (
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 bg-white">
                  {categoryTree.length > 0 ? (
                    renderCategoryTree(categoryTree)
                  ) : (
                    <p className="text-gray-500">No categories available.</p>
                  )}
                </div>
              )}
            </div>

            {/* Package images (optional) – you can enable if backend supports */}
            {false && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package Images (optional)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-2">
                    <PhotoIcon className="w-5 h-5 text-gray-600" />
                    <span>Choose Images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePackageImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">{packageImages.length}/6 images</span>
                </div>
                <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-2">
                  {packageImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img.preview} alt="" className="w-full h-20 object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => removeImage(setPackageImages, packageImages, idx)}
                        className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product selection / creation */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-4">
              {mode === 'new' ? 'Create New Product' : 'Select Existing Products'}
            </h3>

            {mode === 'existing' ? (
              // Existing products checklist
              <div className="max-h-60 overflow-y-auto border rounded-lg p-3 bg-white">
                {productsLoading ? (
                  <div>Loading products...</div>
                ) : sellerProducts && sellerProducts.length > 0 ? (
                  sellerProducts.map((product: any) => (
                    <label key={product.id} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds([...selectedProductIds, product.id]);
                          } else {
                            setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                          }
                        }}
                        className="rounded text-primary-600"
                      />
                      <span className="text-sm">{product.title} (ETB {product.price})</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500">You have no products. Switch to "Create new product" mode.</p>
                )}
              </div>
            ) : (
              // New product creation fields
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Title</label>
                  <input
                    type="text"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Product Description</label>
                    <button
                      type="button"
                      onClick={() => generateAIDescription('product')}
                      disabled={aiLoadingProduct}
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      {aiLoadingProduct ? 'Thinking...' : 'AI Suggest'}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                {/* Product categories (main + sub) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Main Category</label>
                  <select
                    value={productMainCategory}
                    onChange={(e) => {
                      setProductMainCategory(e.target.value);
                      setProductSubCategory('');
                    }}
                    className="mt-1 block w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Main Category</option>
                    {categories?.filter((c: any) => !c.parent_id).map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {productMainCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subcategory (optional)</label>
                    <select
                      value={productSubCategory}
                      onChange={(e) => setProductSubCategory(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">None</option>
                      {categories?.filter((c: any) => c.parent_id === parseInt(productMainCategory)).map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Price (ETB)</label>
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <input
                      type="number"
                      value={productStock}
                      onChange={(e) => setProductStock(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-lg"
                      required
                      min="0"
                    />
                  </div>
                </div>

                {/* Product images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Images (up to 6)</label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-2">
                      <PhotoIcon className="w-5 h-5 text-gray-600" />
                      <span>Choose Images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleProductImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-sm text-gray-500">{productImages.length}/6 images</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-2">
                    {productImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img.preview} alt="" className="w-full h-20 object-cover rounded-lg border" />
                        <button
                          type="button"
                          onClick={() => removeImage(setProductImages, productImages, idx)}
                          className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status (only for edit) */}
          {pkg && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={pkg.status}
                onChange={(e) => (pkg.status = e.target.value)} // you'll need proper state for editing
                className="mt-1 block w-full px-3 py-2 border rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={savePackageMutation.isLoading || createProductMutation.isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {savePackageMutation.isLoading ? 'Saving...' : 'Save Package'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PackageModal;