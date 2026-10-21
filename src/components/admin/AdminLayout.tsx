// src/components/admin/AdminLayout.tsx
import { useEffect } from 'react';   // ★ added
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
  TagIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  TicketIcon,
  TruckIcon,
  FolderIcon,
  SparklesIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowUturnLeftIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

// Each navigation item has a `key` that matches a permission string
const navigation = [
  { key: 'dashboard',         name: 'Dashboard',         href: '/admin',                    icon: HomeIcon },
  { key: 'users',             name: 'Users',             href: '/admin/users',              icon: UsersIcon },
  { key: 'sub_admins',        name: 'Sub-Admins',        href: '/admin/sub-admins',         icon: ShieldCheckIcon },
  { key: 'sellers',           name: 'Sellers',           href: '/admin/vendors',            icon: ShoppingBagIcon },
  { key: 'products',          name: 'Products',          href: '/admin/products',           icon: TagIcon },
  { key: 'packages',          name: 'Packages',          href: '/admin/packages',           icon: ShoppingBagIcon },
  { key: 'orders',            name: 'Orders',            href: '/admin/orders',             icon: DocumentTextIcon },
  { key: 'categories',        name: 'Categories',        href: '/admin/categories',         icon: TagIcon },
  { key: 'announcements',     name: 'Announcements',     href: '/admin/announcements',      icon: MegaphoneIcon },
  { key: 'promo_codes',       name: 'Promo Codes',       href: '/admin/promo-codes',        icon: TicketIcon },
  { key: 'logistics',         name: 'Logistics',         href: '/admin/logistics-partners', icon: TruckIcon },
  { key: 'cod_collection',    name: 'COD Collections',   href: '/admin/cod-collection',     icon: ClipboardDocumentCheckIcon },
  { key: 'manual_dispatches', name: 'Manual Dispatches', href: '/admin/manual-dispatches',  icon: ClipboardDocumentListIcon },
  { key: 'payment_gateways',  name: 'Payment Gateways',  href: '/admin/payment-gateways',   icon: CreditCardIcon },
  { key: 'partner_payouts',   name: 'Partner Payouts',   href: '/admin/partner-payouts',    icon: BanknotesIcon },
  { key: 'payouts',           name: 'Seller Payouts',    href: '/admin/payouts',            icon: CurrencyDollarIcon },
  { key: 'financial_ledger',  name: 'Financial Ledger',  href: '/admin/financial-ledger',   icon: ScaleIcon },
  { key: 'return_policies',   name: 'Return Policies',   href: '/admin/return-policies',    icon: ArrowUturnLeftIcon },
  { key: 'legal_pages',       name: 'Legal Pages',       href: '/admin/legal-pages',        icon: DocumentTextIcon },
  { key: 'collections',       name: 'Collections',       href: '/admin/collections',        icon: FolderIcon },
  { key: 'disputes',          name: 'Disputes',          href: '/admin/disputes',           icon: ExclamationTriangleIcon },
  { key: 'reports',           name: 'Reports',           href: '/admin/reports',            icon: ChartBarIcon },
  { key: 'membership_plans',  name: 'Membership Plans',  href: '/admin/membership-plans',   icon: SparklesIcon },
  { key: 'settings',          name: 'Settings',          href: '/admin/settings',            icon: Cog6ToothIcon },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Determine if user is main admin (full access)
  const isMainAdmin = user?.roles?.includes('admin') || user?.role === 'admin';

  // For sub-admin, use permissions; fallback to empty array
  const permissions = user?.permissions || [];

  // Build allowed navigation keys for sub-admin
  const allowedKeys = new Set<string>();
  if (isMainAdmin) {
    navigation.forEach(item => allowedKeys.add(item.key));
  } else {
    permissions.forEach(p => {
      allowedKeys.add(p);

      // "payouts" should unlock both seller and partner payouts
      if (p === 'payouts') {
        allowedKeys.add('partner_payouts');
      }
    });
  }

  const filteredNavigation = navigation.filter(item => allowedKeys.has(item.key));

  // ★ Redirect /admin to first allowed section if user lacks dashboard permission
  useEffect(() => {
    if (isMainAdmin) return;
    if (location.pathname === '/admin' && !allowedKeys.has('dashboard') && filteredNavigation.length > 0) {
      navigate(filteredNavigation[0].href, { replace: true });
    }
  }, [location.pathname, isMainAdmin, allowedKeys, filteredNavigation, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <style>{`
        .admin-nav-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .admin-nav-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="flex h-screen bg-[var(--surface-page)]">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-64 bg-white border-r border-gray-100 flex flex-col"
        >
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-500 mt-1">Manage your marketplace</p>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 admin-nav-scroll">
            {filteredNavigation.length > 0 ? (
              filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    to={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[var(--color-orange-50)] text-[var(--color-orange-600)]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-[var(--color-orange-500)]' : 'text-gray-400'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {isActive && (
                      <motion.div
                        layoutId="adminActiveIndicator"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="w-2 h-2 bg-white rounded-full shadow-sm"
                      />
                    )}
                  </Link>
                );
              })
            ) : (
              <div className="px-3 py-6 text-sm text-gray-500 text-center">
                No access granted.
              </div>
            )}
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
    </>
  );
};

export default AdminLayout;