import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  BellAlertIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from 'react-query';
import api from '../lib/axios';
import AccountDetails from '../components/profile/AccountDetails';
import AddressBook from '../components/profile/AddressBook';
import OrderHistory from '../components/profile/OrderHistory';
import PriceAlertsPage from './PriceAlertsPage';
import { useAuth } from '../hooks/useAuth';

const tabs = [
  { name: 'Account', icon: UserIcon, component: AccountDetails },
  { name: 'Addresses', icon: MapPinIcon, component: AddressBook },
  { name: 'Orders', icon: ClipboardDocumentListIcon, component: OrderHistory },
  { name: 'Price Alerts', icon: BellAlertIcon, component: PriceAlertsPage },
];

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ActiveComponent = tabs[activeTab].component;

  // Fetch vendor data (will be null if user is not a seller)
  const { data: vendor } = useQuery(
    'vendorProfile',
    () => api.get('/api/v1/vendors/me').then(res => res.data),
    { enabled: !!user }
  );

  const isSeller = !!vendor;
  const avatarUrl = vendor?.logo_url || user?.avatar_url || '';
  const displayName = user?.full_name || user?.name || '';
  const phone = user?.phone || '';
  const shopDescription = vendor?.description || '';

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/account');
      await logout();
      // Redirect to home after logout
      window.location.href = '/';
    } catch (err) {
      alert('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-[#F5F5F5]">
      <div className="container-marketplace py-4">
        <h1 className="text-product-title font-semibold text-text-primary mb-4">My Profile</h1>

        {/* Profile header – visible always */}
        <div className="card-product p-5 mb-4 flex flex-col sm:flex-row items-center gap-4">
          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-brand"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center text-2xl font-bold">
              {displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold text-text-primary">{displayName}</h2>
            {phone && <p className="text-sm text-text-secondary mt-1">{phone}</p>}

            {/* Shop description (seller only) – no dashboard button */}
            {isSeller && shopDescription && (
              <p className="text-xs text-text-muted mt-2 max-w-md">{shopDescription}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sidebar */}
          <div className="card-product p-3 space-y-1 h-fit md:sticky md:top-24 md:self-start flex flex-col">
            {tabs.map((tab, index) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(index)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-left text-sm transition ${
                  activeTab === index
                    ? 'bg-brand text-white font-medium'
                    : 'hover:bg-surface-hover text-text-secondary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}

            {/* Delete Account Button */}
            <div className="mt-auto pt-4 border-t border-border-light">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-left text-sm text-red-600 hover:bg-red-50 transition font-medium"
              >
                <TrashIcon className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-3 card-product p-4"
          >
            <ActiveComponent />
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-bold text-text-primary mb-2">Delete Account</h3>
            <p className="text-sm text-text-secondary mb-4">
              Are you sure you want to permanently deactivate your account? This action cannot be undone. Your data will be retained in accordance with our Privacy Policy.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;