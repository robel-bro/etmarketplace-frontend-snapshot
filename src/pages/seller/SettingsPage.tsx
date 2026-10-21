// src/pages/seller/SettingsPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';
import { useAuth } from '../../hooks/useAuth';

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // ---------- Fetch own vendor data ----------
  const { data: vendor, isLoading, error } = useQuery(
    'vendorSettings',
    () => api.get('/api/v1/vendors/me').then(res => res.data),
    { enabled: !!user }
  );

  // ---------- Local form states ----------
  const [store, setStore] = useState({
    name: '',
    description: '',
    phone: '',
    nationalId: '',
    tin: '',
    location: '',
  });
  const [payout, setPayout] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    telebirrNumber: '',
  });
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailPayouts: true,
    smsAlerts: false,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const [licenseUrl, setLicenseUrl] = useState<string>('');

  // ---------- Populate form when vendor and user load ----------
  useEffect(() => {
    if (vendor && user) {
      setStore({
        name: vendor.business_name || '',
        description: vendor.description || '',
        phone: user.phone || vendor.phone || '',
        nationalId: vendor.national_id || '',
        tin: vendor.tin || '',
        location: vendor.business_address || '',
      });
      setPayout({
        bankName: vendor.bank_name || '',
        accountNumber: vendor.account_number || '',
        accountName: vendor.account_name || '',
        telebirrNumber: vendor.telebirr_number || '',
      });
      setLogoPreview(vendor.logo_url || '');
      setBannerPreview(vendor.banner_url || '');
      setLicenseUrl(vendor.license_document_url || '');
    }
  }, [vendor, user]);

  // ---------- Mutations ----------
  const updateUserProfile = useMutation(
    (formData: FormData) =>
      api.patch('/api/v1/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    {
      onSuccess: () => {
        refreshUser();
        queryClient.invalidateQueries('vendorSettings');
      },
      onError: (err: any) => {
        alert(err.response?.data?.errors?.join(', ') || 'Failed to save phone.');
      },
    }
  );

  const updateVendorProfile = useMutation(
    (formData: FormData) =>
      api.put('/api/v1/vendors/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendorSettings');
        alert('Store settings saved.');
      },
      onError: (err: any) => {
        alert(err.response?.data?.errors?.join(', ') || 'Failed to save store settings.');
      },
    }
  );

  const updatePayout = useMutation(
    (data: any) => api.put('/api/v1/vendors/me', { vendor: data }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendorSettings');
        alert('Payout methods saved.');
      },
      onError: (err: any) => {
        alert(err.response?.data?.errors?.join(', ') || 'Failed to save payout settings.');
      },
    }
  );

  // ---------- Handlers ----------
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save phone to user profile (only editable identity field)
    const userFormData = new FormData();
    userFormData.append('user[phone]', store.phone);
    await updateUserProfile.mutateAsync(userFormData).catch(() => {});

    // Save vendor profile
    const vendorFormData = new FormData();
    vendorFormData.append('vendor[business_name]', store.name);
    vendorFormData.append('vendor[description]', store.description);
    if (logoFile) vendorFormData.append('vendor[logo]', logoFile);
    if (bannerFile) vendorFormData.append('vendor[banner]', bannerFile);

    await updateVendorProfile.mutateAsync(vendorFormData).catch(() => {});
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePayout.mutate({
      bank_name: payout.bankName,
      account_number: payout.accountNumber,
      account_name: payout.accountName,
      telebirr_number: payout.telebirrNumber,
    });
  };

  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Notification preferences saved (locally). Backend storage coming soon.');
  };

  if (isLoading) {
    return <div className="text-center py-10 text-text-muted text-sm">Loading settings…</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500 text-sm">Failed to load settings. Make sure you are a registered seller.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-product-title font-semibold text-text-primary">Settings</h1>

      {/* Store Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-product p-5"
      >
        <h2 className="text-base font-semibold text-text-primary mb-4">Store Profile</h2>
        <form onSubmit={handleStoreSubmit} className="space-y-3">
          {/* Logo & Name Row */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={logoPreview || 'https://placehold.co/80?text=No+Logo'}
                alt="Store logo"
                className="w-16 h-16 rounded-full object-cover border-2 border-border-light"
              />
              <label className="absolute bottom-0 right-0 bg-brand hover:bg-brand-hover text-white p-1 rounded-full shadow-card transition cursor-pointer">
                <CameraIcon className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-text-primary mb-1 block">Store Name</label>
              <input
                type="text"
                value={store.name}
                onChange={(e) => setStore({ ...store, name: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
          </div>

          {/* Banner Upload */}
          <div>
            <label className="text-xs font-medium text-text-primary mb-1 block">Store Banner</label>
            <div className="flex items-start gap-4">
              <div className="flex-1 h-24 rounded-[var(--radius-sm)] bg-surface-hover border border-border-light overflow-hidden">
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted text-xs">
                    No banner uploaded
                  </div>
                )}
              </div>
              <label className="cursor-pointer bg-surface-hover hover:bg-gray-100 px-4 py-2 rounded-[var(--radius-sm)] border border-border-light text-xs font-medium text-text-secondary">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-medium text-text-primary mb-1 block">Phone</label>
            <input
              type="text"
              value={store.phone}
              onChange={(e) => setStore({ ...store, phone: e.target.value })}
              className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-text-primary mb-1 block">Store Description</label>
            <textarea
              rows={3}
              value={store.description}
              onChange={(e) => setStore({ ...store, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            />
          </div>

          {/* Identity Section – one‑time fields */}
          <div className="border-t border-border-light pt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Identity (one‑time)</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">National ID (Fayda)</label>
                <input
                  type="text"
                  value={store.nationalId}
                  disabled={!!store.nationalId}
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">TIN</label>
                <input
                  type="text"
                  value={store.tin}
                  disabled={!!store.tin}
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Location</label>
                <input
                  type="text"
                  value={store.location}
                  disabled={!!store.location}
                  className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              {licenseUrl && (
                <div>
                  <label className="text-xs font-medium text-text-primary mb-1 block">Business License</label>
                  <div className="flex items-center gap-3">
                    <img
                      src={licenseUrl}
                      alt="License"
                      className="h-16 w-16 object-cover rounded border"
                    />
                    <span className="text-xs text-text-muted">License on file (contact support to update)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateUserProfile.isLoading || updateVendorProfile.isLoading}
              className="btn-cta py-2 px-5 text-sm font-semibold"
            >
              {updateUserProfile.isLoading || updateVendorProfile.isLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Payout Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-product p-5"
      >
        <h2 className="text-base font-semibold text-text-primary mb-4">Payout Methods</h2>
        <form onSubmit={handlePayoutSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-primary mb-1 block">Bank Name</label>
              <input
                type="text"
                value={payout.bankName}
                onChange={(e) => setPayout({ ...payout, bankName: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-primary mb-1 block">Account Number</label>
              <input
                type="text"
                value={payout.accountNumber}
                onChange={(e) => setPayout({ ...payout, accountNumber: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-primary mb-1 block">Account Holder Name</label>
              <input
                type="text"
                value={payout.accountName}
                onChange={(e) => setPayout({ ...payout, accountName: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-primary mb-1 block">Telebirr Number</label>
              <input
                type="text"
                value={payout.telebirrNumber}
                onChange={(e) => setPayout({ ...payout, telebirrNumber: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatePayout.isLoading}
              className="btn-cta py-2 px-5 text-sm font-semibold"
            >
              {updatePayout.isLoading ? 'Saving…' : 'Save Payout Methods'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-product p-5"
      >
        <h2 className="text-base font-semibold text-text-primary mb-4">Notification Preferences</h2>
        <form onSubmit={handleNotificationsSubmit} className="space-y-3">
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.emailOrders}
                onChange={(e) =>
                  setNotifications({ ...notifications, emailOrders: e.target.checked })
                }
                className="h-4 w-4 rounded border-border-light text-brand focus:ring-brand"
              />
              <span className="text-sm text-text-secondary">Email me when an order is placed</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.emailPayouts}
                onChange={(e) =>
                  setNotifications({ ...notifications, emailPayouts: e.target.checked })
                }
                className="h-4 w-4 rounded border-border-light text-brand focus:ring-brand"
              />
              <span className="text-sm text-text-secondary">Email me about payout updates</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.smsAlerts}
                onChange={(e) =>
                  setNotifications({ ...notifications, smsAlerts: e.target.checked })
                }
                className="h-4 w-4 rounded border-border-light text-brand focus:ring-brand"
              />
              <span className="text-sm text-text-secondary">SMS alerts for urgent updates</span>
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-cta py-2 px-5 text-sm font-semibold">
              Save Preferences
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SettingsPage;