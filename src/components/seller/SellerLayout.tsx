import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const navigation = [
  { name: 'Dashboard', href: '/seller', icon: HomeIcon },
  { name: 'Products', href: '/seller/products', icon: CubeIcon },
  { name: 'Orders', href: '/seller/orders', icon: ShoppingBagIcon },
  { name: 'Membership', href: '/seller/membership', icon: UserGroupIcon },
  { name: 'Payouts', href: '/seller/payouts', icon: CreditCardIcon },
  { name: 'Packages', href: '/seller/packages', icon: GiftIcon },
  { name: 'Settings', href: '/seller/settings', icon: Cog6ToothIcon },
];

const SellerLayout = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[var(--surface-page)]">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-64 bg-white border-r border-gray-100 flex flex-col"
      >
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Seller Central</h2>
          <p className="text-xs text-gray-500 mt-1">Manage your store</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--color-orange-50)] text-[var(--color-orange-600)]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <item.icon
                    className={`w-4 h-4 mr-3 ${
                      isActive ? 'text-[var(--color-orange-500)]' : 'text-gray-400'
                    }`}
                  />
                  {item.name}
                </div>

                {/* Bouncing white dot – only on active item */}
                {isActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 10,
                    }}
                    className="w-2 h-2 rounded-full bg-white shadow-md"
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2.5 w-full text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3 text-gray-400" />
            Logout
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SellerLayout;