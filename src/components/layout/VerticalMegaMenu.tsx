import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  HomeModernIcon,
  GiftTopIcon,
  ShoppingBagIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline';

// Map category names to icons (you can extend)
const categoryIcons: Record<string, JSX.Element> = {
  Electronics: <ComputerDesktopIcon className="w-5 h-5" />,
  'Mobile Phones': <DevicePhoneMobileIcon className="w-5 h-5" />,
  Fashion: <ShoppingBagIcon className="w-5 h-5" />,
  'Home & Living': <HomeModernIcon className="w-5 h-5" />,
  Sports: <GiftTopIcon className="w-5 h-5" />,
  Machinery: <WrenchIcon className="w-5 h-5" />,
};

interface Category {
  id: number;
  name: string;
  icon?: string;
  children?: Category[];
}

const VerticalMegaMenu = ({ categories }: { categories: Category[] }) => {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-bold mb-4 px-2">Categories</h3>
      <ul className="space-y-1">
        {categories.map((cat) => (
          <li
            key={cat.id}
            onMouseEnter={() => setActiveCategory(cat.id)}
            onMouseLeave={() => setActiveCategory(null)}
            className="relative"
          >
            <Link
              to={`/products?category=${cat.id}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-primary-50 group"
            >
              <span className="flex items-center gap-3">
                {categoryIcons[cat.name] || <span className="w-5 h-5" />}
                <span className="text-gray-700 group-hover:text-primary-600">{cat.name}</span>
              </span>
              {cat.children && cat.children.length > 0 && (
                <span className="text-gray-400 group-hover:text-primary-600">›</span>
              )}
            </Link>

            {/* Multi‑column dropdown */}
            <AnimatePresence>
              {activeCategory === cat.id && cat.children && cat.children.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-full top-0 ml-2 w-[600px] bg-white shadow-xl rounded-xl border border-gray-100 p-6 z-50"
                >
                  <div className="grid grid-cols-3 gap-6">
                    {cat.children.map((sub) => (
                      <div key={sub.id}>
                        <Link
                          to={`/products?category=${sub.id}`}
                          className="font-semibold text-gray-800 hover:text-primary-600 block mb-2"
                        >
                          {sub.name}
                        </Link>
                        {sub.children && sub.children.length > 0 && (
                          <ul className="space-y-1">
                            {sub.children.slice(0, 5).map((sub2) => (
                              <li key={sub2.id}>
                                <Link
                                  to={`/products?category=${sub2.id}`}
                                  className="text-sm text-gray-600 hover:text-primary-600"
                                >
                                  {sub2.name}
                                </Link>
                              </li>
                            ))}
                            {sub.children.length > 5 && (
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
                  {/* Promotional banner */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-3 rounded-lg text-center">
                      <span className="text-sm font-medium">🔥 Hot Deals in {cat.name}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VerticalMegaMenu;