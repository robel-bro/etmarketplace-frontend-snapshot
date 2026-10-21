import { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { StarIcon, CheckCircleIcon } from '@heroicons/react/20/solid';
import api from '../../../lib/axios';
import { buildCategoryTree } from '../../../utils/categoryHelpers';

const EnhancedFilterSidebar = ({ searchParams, setSearchParams }) => {
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    api.get('/categories').then(res => {
      const tree = buildCategoryTree(res.data);
      setCategories(tree);
    });
  }, []);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const renderCategories = (cats, level = 0) => {
    return cats.map(cat => (
      <div key={cat.id} className="mb-1">
        <label className="flex items-center gap-2 text-sm" style={{ marginLeft: level * 12 }}>
          <input
            type="checkbox"
            checked={selectedCategories.includes(cat.id)}
            onChange={(e) => {
              const newSelected = e.target.checked
                ? [...selectedCategories, cat.id]
                : selectedCategories.filter(id => id !== cat.id);
              setSelectedCategories(newSelected);
              // You can update URL param with comma-separated IDs or keep local state only
            }}
            className="rounded text-primary-600"
          />
          <span>{cat.name}</span>
        </label>
        {cat.children && cat.children.length > 0 && (
          <div>{renderCategories(cat.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
      {/* Supplier Features */}
      <div>
        <h3 className="font-bold text-lg mb-3">Supplier Features</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded text-primary-600" />
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span>Verified Supplier</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded text-primary-600" />
            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
            <span>PRO Supplier</span>
          </label>
        </div>
      </div>

      {/* Store Reviews */}
      <div>
        <h3 className="font-bold text-lg mb-3">Store Reviews</h3>
        <div className="space-y-2">
          {[5,4,3,2,1].map(star => (
            <label key={star} className="flex items-center gap-2">
              <input type="checkbox" className="rounded text-primary-600" />
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className={`w-4 h-4 ${i < star ? 'text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-600">& up</span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-bold text-lg mb-3">Categories</h3>
        <div className="max-h-60 overflow-y-auto">
          {renderCategories(categories)}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-bold text-lg mb-3">Price (ETB)</h3>
        <Slider
          range
          min={0}
          max={10000}
          value={priceRange}
          onChange={setPriceRange}
          onChangeComplete={(val) => {
            updateFilter('price_min', val[0]);
            updateFilter('price_max', val[1]);
          }}
          trackStyle={[{ backgroundColor: '#0284c7' }]}
          handleStyle={[{ borderColor: '#0284c7' }, { borderColor: '#0284c7' }]}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>ETB {priceRange[0]}</span>
          <span>ETB {priceRange[1]}</span>
        </div>
      </div>

      {/* Min Order */}
      <div>
        <h3 className="font-bold text-lg mb-3">Min. Order</h3>
        <select className="w-full border rounded-lg px-3 py-2">
          <option>Any</option>
          <option>1 piece</option>
          <option>5 pieces</option>
          <option>10 pieces</option>
        </select>
      </div>

      {/* Clear All */}
      <button
        onClick={() => setSearchParams({})}
        className="w-full bg-gray-100 py-2 rounded-lg hover:bg-gray-200 transition"
      >
        Clear All
      </button>
    </div>
  );
};

export default EnhancedFilterSidebar;