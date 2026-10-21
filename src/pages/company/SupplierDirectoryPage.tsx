import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline';
import api from '../../lib/axios';
import { useAuth } from '../../hooks/useAuth';

const SupplierDirectoryPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: suppliers, isLoading } = useQuery(['b2b-suppliers', search, category], () =>
    api.get('/company/suppliers', { params: { search, category } }).then(res => res.data)
  );

  const handleContact = (supplierId) => {
    // Redirect to messaging with pre-filled recipient
    window.location.href = `/company/messages?recipient=${supplierId}`;
  };

  if (isLoading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Supplier Directory</h1>
      <p className="text-gray-600 mb-8">Find verified business suppliers for your company.</p>

      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers?.map(supp => (
          <motion.div
            key={supp.id}
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-5 border border-white/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl">
                {supp.business_name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg">{supp.business_name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-600">{supp.rating || 'New'}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{supp.description || 'Business supplier'}</p>
            <div className="mt-4 flex gap-2">
              <Link to={`/company/supplier/${supp.id}`} className="flex-1 text-center bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition">
                View Profile
              </Link>
              <button
                onClick={() => handleContact(supp.id)}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Contact
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SupplierDirectoryPage;