import { useState } from 'react';
import { motion } from 'framer-motion';
import { FunnelIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline';

const mockSuppliers = [
  { id: 1, name: 'Abebe Electronics', location: 'Addis Ababa', categories: ['Electronics'], rating: 4.5, products: 120, verified: true },
  { id: 2, name: 'Tigist Fashion', location: 'Bahir Dar', categories: ['Fashion'], rating: 4.8, products: 340, verified: true },
  { id: 3, name: 'Yonas Coffee', location: 'Jimma', categories: ['Food & Beverage'], rating: 5.0, products: 45, verified: false },
  { id: 4, name: 'Meron Cosmetics', location: 'Addis Ababa', categories: ['Beauty'], rating: 4.2, products: 78, verified: true },
];

const categories = ['Electronics', 'Fashion', 'Food & Beverage', 'Beauty'];
const locations = ['Addis Ababa', 'Bahir Dar', 'Jimma', 'Hawassa'];

const FindSupplierPage = () => {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [suppliers] = useState(mockSuppliers);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || s.categories.some(c => selectedCategories.includes(c));
    const matchesLocation = !selectedLocation || s.location === selectedLocation;
    const matchesRating = s.rating >= minRating;
    return matchesSearch && matchesCategory && matchesLocation && matchesRating;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Find Suppliers</h1>
        <p className="text-gray-600 mb-8">Discover verified suppliers across Ethiopia.</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 h-fit">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FunnelIcon className="w-5 h-5" /> Filters
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Supplier name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="rounded text-primary-600"
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => <option key={loc}>{loc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="0">Any</option>
                  <option value="3">3★ & up</option>
                  <option value="4">4★ & up</option>
                  <option value="4.5">4.5★ & up</option>
                </select>
              </div>
            </div>
          </div>

          {/* Supplier Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSuppliers.map(supplier => (
              <motion.div
                key={supplier.id}
                whileHover={{ y: -5 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-5 border border-white/30"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800">{supplier.name}</h3>
                  {supplier.verified && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Verified</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{supplier.location}</p>
                <p className="text-xs text-gray-500 mb-3">{supplier.categories.join(', ')}</p>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className={`w-4 h-4 ${i < Math.floor(supplier.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">{supplier.rating}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{supplier.products} products</p>
                <button className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition">
                  Contact Supplier
                </button>
              </motion.div>
            ))}
            {filteredSuppliers.length === 0 && (
              <p className="text-center text-gray-500 col-span-full">No suppliers match your filters.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindSupplierPage;