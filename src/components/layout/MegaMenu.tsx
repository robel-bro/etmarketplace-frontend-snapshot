import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  image?: string;
  children?: Category[];
}

const MegaMenu = ({ categories, isDropdown = false }: { categories: Category[]; isDropdown?: boolean }) => {
  if (!Array.isArray(categories)) return null;

  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  return (
    <nav className={`${!isDropdown ? 'bg-white border-b border-gray-200' : ''} overflow-x-hidden`}>
      <div className={`${!isDropdown ? 'container mx-auto px-4' : ''}`}>
        <ul className="flex space-x-8 overflow-visible">
          {categories.map((cat) => (
            <li
              key={cat.id}
              onMouseEnter={() => setActiveCategory(cat.id)}
              onMouseLeave={() => setActiveCategory(null)}
              className="relative"
            >
              <button className="flex items-center space-x-1 py-4 text-gray-700 hover:text-primary-600 font-medium">
                <span>{cat.name}</span>
                {cat.children && cat.children.length > 0 && (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>

              <AnimatePresence>
                {activeCategory === cat.id && cat.children && cat.children.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 -translate-x-1/2 mt-0 w-[calc(100vw-2rem)] max-w-7xl bg-white shadow-xl rounded-b-2xl border border-gray-100 p-6 z-50"
                  >
                    <div className="grid grid-cols-4 gap-6 max-h-[70vh] overflow-y-auto">
                      {cat.children.map((sub) => (
                        <div key={sub.id}>
                          <Link
                            to={`/products?category=${sub.id}`}
                            className="block group"
                          >
                            {sub.image && (
                              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-2">
                                <img
                                  src={sub.image}
                                  alt={sub.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <h4 className="font-medium text-gray-800 group-hover:text-primary-600 transition">
                              {sub.name}
                            </h4>
                          </Link>

                          {sub.children && sub.children.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {sub.children.slice(0, 4).map((sub2) => (
                                <li key={sub2.id}>
                                  <Link
                                    to={`/products?category=${sub2.id}`}
                                    className="text-sm text-gray-600 hover:text-primary-600"
                                  >
                                    {sub2.name}
                                  </Link>
                                </li>
                              ))}
                              {sub.children.length > 4 && (
                                <li>
                                  <Link
                                    to={`/products?category=${sub.id}`}
                                    className="text-xs text-primary-600 hover:underline"
                                  >
                                    View all →
                                  </Link>
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default MegaMenu;