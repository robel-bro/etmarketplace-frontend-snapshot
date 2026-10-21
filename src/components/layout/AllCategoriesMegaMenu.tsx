// src/components/layout/AllCategoriesMegaMenu.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  ChevronRight,
  Package,
  Shirt,
  Laptop,
  Home,
  Dumbbell,
  Sparkles,
  Gamepad2,
  BookOpen,
  Gem,
  Car,
  TreePine,
  PawPrint,
  Apple,
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Fashion: Shirt,
  Electronics: Laptop,
  Home: Home,
  Sports: Dumbbell,
  Beauty: Sparkles,
  Toys: Gamepad2,
  Books: BookOpen,
  Jewelry: Gem,
  Automotive: Car,
  Garden: TreePine,
  Pet: PawPrint,
  Food: Apple,
};

const getIcon = (categoryName: string): React.ElementType => {
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) {
      return Icon;
    }
  }
  return Package;
};

interface Category {
  id: number;
  name: string;
  image_url?: string;
  children?: Category[];
  ancestry?: string;
}

interface AllCategoriesMegaMenuProps {
  categories: Category[];
  onClose?: () => void;
}

const buildCategoryTree = (categories: Category[]): Category[] => {
  if (!Array.isArray(categories) || categories.length === 0) return [];
  if (categories[0]?.children !== undefined) return categories;
  const map: Record<number, Category> = {};
  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });
  const tree: Category[] = [];
  categories.forEach((cat) => {
    let parentId: number | null = null;
    if (cat.ancestry) {
      const parts = cat.ancestry.split('/');
      const last = parts[parts.length - 1];
      if (last) parentId = parseInt(last, 10);
    }
    if (parentId && map[parentId]) {
      map[parentId].children!.push(map[cat.id]);
    } else {
      tree.push(map[cat.id]);
    }
  });
  return tree;
};

const AllCategoriesMegaMenu = ({ categories, onClose }: AllCategoriesMegaMenuProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = 'hidden';
    return () => {
      setIsVisible(false);
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 150);
    document.body.style.overflow = '';
  };

  const handleNavigate = (path: string) => {
    handleClose();
    navigate(path);
  };

  if (!categoryTree.length) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-150 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: 'auto', bottom: 0 }}
        onClick={handleClose}
      />

      {/* Mega Menu Panel */}
      <div
        ref={menuRef}
        className={`relative z-40 bg-white shadow-2xl border-t border-gray-200 transition-all duration-150 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <div className="container-marketplace">
          <div className="flex">
            {/* LEFT SIDEBAR – scrollbar hidden */}
            <div className="w-60 bg-gray-50 border-r border-gray-200 max-h-[70vh] overflow-hidden flex-shrink-0">
              <div
                className="h-full overflow-y-auto"
                style={{
                  marginRight: '-17px',
                  paddingRight: '17px',
                }}
              >
                <div className="py-0.5">
                  {categoryTree.map((category) => {
                    const IconComponent = getIcon(category.name);
                    const isHovered = hoveredCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onMouseEnter={() => setHoveredCategory(category.id)}
                        onClick={() => handleNavigate(`/category/${category.id}`)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 transition-colors duration-100 ${
                          isHovered
                            ? 'bg-white text-black font-semibold border-r-2 border-orange-500 shadow-sm'
                            : 'text-black hover:bg-white hover:text-orange-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <IconComponent className={`w-4 h-4 flex-shrink-0 ${isHovered ? 'text-orange-500' : 'text-gray-400'}`} />
                          <span className="text-sm truncate">{category.name}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isHovered ? 'text-orange-500' : 'text-gray-400'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL – with refined CSS scrollbar */}
            <div className="flex-1 min-w-0 bg-white max-h-[70vh] overflow-y-auto mega-scroll">
              {hoveredCategory && (
                <div className="p-5">
                  {(() => {
                    const category = categoryTree.find((c) => c.id === hoveredCategory);
                    if (!category) return null;
                    const subCategories = category.children || [];

                    return (
                      <>
                        <div className="mb-4 pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const IconComp = getIcon(category.name);
                              return <IconComp className="w-5 h-5 text-orange-500" />;
                            })()}
                            <h3 className="text-lg font-bold text-black">{category.name}</h3>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 ml-7">
                            Browse our {category.name.toLowerCase()} collection
                          </p>
                        </div>

                        {subCategories.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 justify-items-center">
                            {subCategories.map((sub) => {
                              const SubIcon = getIcon(sub.name);
                              return (
                                <Link
                                  key={sub.id}
                                  to={`/category/${sub.id}`}
                                  onClick={handleClose}
                                  className="group flex flex-col items-center text-center w-28"
                                >
                                  {/* Circle – 96px */}
                                  <div className="relative w-24 h-24 rounded-full bg-gray-100 border border-gray-200 group-hover:border-orange-500 group-hover:shadow-md flex items-center justify-center overflow-hidden transition-all duration-200 mb-2">
                                    {sub.image_url ? (
                                      <img
                                        src={sub.image_url}
                                        alt={sub.name}
                                        className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-110"
                                      />
                                    ) : (
                                      <SubIcon className="w-10 h-10 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                    )}
                                  </div>
                                  {/* Name – pure black text */}
                                  <h4 className="text-xs font-medium text-black group-hover:text-orange-500 transition-colors line-clamp-2 leading-tight">
                                    {sub.name}
                                  </h4>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            No subcategories yet
                          </div>
                        )}

                        {/* View All button REMOVED */}
                      </>
                    );
                  })()}
                </div>
              )}

              {!hoveredCategory && (
                <div className="h-full min-h-[350px] flex items-center justify-center bg-gray-50">
                  <div className="text-center px-4">
                    <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Menu className="w-7 h-7 text-orange-500" />
                    </div>
                    <h3 className="text-base font-semibold text-black mb-1">Explore Categories</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      Hover over a category to preview its products
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Refined CSS for the right panel scrollbar (on‑hover appearance) */}
        <style>{`
          .mega-scroll {
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: transparent transparent;
          }
          .mega-scroll:hover {
            scrollbar-color: rgba(0,0,0,0.2) transparent;
          }
          .mega-scroll::-webkit-scrollbar {
            width: 4px;
            background: transparent;
          }
          .mega-scroll::-webkit-scrollbar-track {
            background: transparent;
            border: none;
            box-shadow: none;
          }
          .mega-scroll::-webkit-scrollbar-thumb {
            background: transparent;
            border-radius: 8px;
            min-height: 30px;
            transition: background 0.3s ease;
          }
          .mega-scroll:hover::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.2);
          }
          .mega-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.35);
          }
        `}</style>
      </div>
    </>
  );
};

export default AllCategoriesMegaMenu;