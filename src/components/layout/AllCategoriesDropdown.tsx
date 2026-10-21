import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  children?: Category[];
}

const AllCategoriesDropdown = ({ categories }: { categories: Category[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center space-x-1 py-2 px-3 bg-primary-50 rounded-full text-primary-700 hover:bg-primary-100 transition">
        <span>All Categories</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-screen max-w-4xl bg-white shadow-xl rounded-2xl border border-gray-100 p-6 z-50">
          <div className="grid grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div key={cat.id}>
                <Link
                  to={`/products?category=${cat.id}`}
                  className="font-semibold text-gray-800 hover:text-primary-600"
                >
                  {cat.name}
                </Link>
                {cat.children && cat.children.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {cat.children.slice(0, 5).map((sub) => (
                      <li key={sub.id}>
                        <Link
                          to={`/products?category=${sub.id}`}
                          className="text-sm text-gray-600 hover:text-primary-600"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCategoriesDropdown;