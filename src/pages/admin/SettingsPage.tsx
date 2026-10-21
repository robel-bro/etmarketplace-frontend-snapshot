// src/pages/admin/SettingsPage.tsx
import { useState, useEffect } from 'react';
import {
  PercentBadgeIcon,
  UserGroupIcon,
  CalendarIcon,
  HeartIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';

const tabs = [
  { id: 'commission', name: 'Commission', icon: PercentBadgeIcon },
  { id: 'membership', name: 'Membership', icon: UserGroupIcon },
  { id: 'orders_block', name: 'Orders Block', icon: CalendarIcon },
  { id: 'seller_health', name: 'Seller Health', icon: HeartIcon },
  { id: 'tax_and_fees', name: 'Tax & Fees', icon: CurrencyDollarIcon },
  { id: 'locations', name: 'Locations', icon: MapPinIcon },
];

const defaultSettings = {
  commission: {
    defaultCommission: 2.5,
    categoryCommission: {},
    sellerOverrideAllowed: true,
    maxCommissionOverride: 5.0,
    minCommissionOverride: 1.0,
    commissionBilling: 'per_order',
  },
  membership: {
    enableMembership: true,
    membershipCommissionDiscount: 10,
    sellerMembershipRequired: false,
  },
  orders_block: {
    order_block_start: '',
    order_block_end: '',
    daily_block_start: '',
    daily_block_end: '',
  },
  seller_health: {
    inactivity_days: 30,
    decline_rate_threshold: 50,
    response_time_threshold_hours: 48,
    unanswered_orders_threshold: 5,
    require_two_violations: false,
  },
  tax_and_fees: {
    service_fee_type: 'none',
    service_fee_value: 0,
    vat_rate: 0,
    platform_vat_registered: false,
    withholding_tax_enabled: false,
    withholding_tax_rate: 3,
  },
  locations: {
    available_locations: 'Addis Ababa, Dire Dawa, Mekelle, Bahir Dar, Hawassa',
  },
};

const inputClass =
  'w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand';

const flattenMainCategories = (nodes: any[]): { id: number; name: string }[] => {
  let flat: { id: number; name: string }[] = [];
  nodes.forEach((node: any) => {
    if (node.parent_id === null) {
      flat.push({ id: node.id, name: node.name });
    }
    if (node.children && node.children.length) {
      flat = flat.concat(flattenMainCategories(node.children));
    }
  });
  return flat;
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('commission');
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, catRes] = await Promise.all([
          api.get('/admin/settings'),
          api.get('/admin/categories'),
        ]);
        const backend = settingsRes.data || {};
        const cats = catRes.data || [];
        setCategories(flattenMainCategories(cats));

        setSettings(prev => {
          const merged = { ...prev };
          // Merge known tab objects from backend
          for (const key of Object.keys(merged)) {
            if (backend[key]) {
              merged[key] = { ...merged[key], ...backend[key] };
            }
          }
          // ✅ Fix: if backend returns `orders_block` object, merge properly
          if (backend.orders_block) {
            merged.orders_block = {
              ...merged.orders_block,
              ...backend.orders_block,
            };
          }
          // ✅ Merge top-level `order_block_*` into orders_block if present
          if (backend.order_block_start !== undefined) {
            merged.orders_block.order_block_start = backend.order_block_start;
          }
          if (backend.order_block_end !== undefined) {
            merged.orders_block.order_block_end = backend.order_block_end;
          }
          if (backend.daily_order_block_start !== undefined) {
            merged.orders_block.daily_block_start = backend.daily_order_block_start;
          }
          if (backend.daily_order_block_end !== undefined) {
            merged.orders_block.daily_block_end = backend.daily_order_block_end;
          }
          return merged;
        });
      } catch (err) {
        console.error('Failed to load settings/categories', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateSection = (section: string, values: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...values },
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const payload = { [activeTab]: settings[activeTab] };
      await api.patch('/admin/settings', { settings: payload });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Failed to save settings', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const renderTabContent = () => {
    const s = settings[activeTab];
    if (!s) return null;

    switch (activeTab) {
      case 'commission':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Default Commission (%)</label>
                <input type="number" step="0.1" value={s.defaultCommission} onChange={e => updateSection('commission', { defaultCommission: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Billing Method</label>
                <select value={s.commissionBilling} onChange={e => updateSection('commission', { commissionBilling: e.target.value })} className={inputClass}>
                  <option value="per_order">Per Order</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-text-primary col-span-2">
                <input type="checkbox" checked={s.sellerOverrideAllowed} onChange={e => updateSection('commission', { sellerOverrideAllowed: e.target.checked })} className="w-3.5 h-3.5 rounded border-border-light text-brand focus:ring-brand" />
                Allow sellers to override commission
              </label>
              {s.sellerOverrideAllowed && (
                <>
                  <div>
                    <label className="text-xs font-medium text-text-primary mb-1 block">Min Override (%)</label>
                    <input type="number" step="0.1" value={s.minCommissionOverride} onChange={e => updateSection('commission', { minCommissionOverride: parseFloat(e.target.value) || 0 })} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-primary mb-1 block">Max Override (%)</label>
                    <input type="number" step="0.1" value={s.maxCommissionOverride} onChange={e => updateSection('commission', { maxCommissionOverride: parseFloat(e.target.value) || 0 })} className={inputClass} />
                  </div>
                </>
              )}
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Category Commission Overrides</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {categories.map(cat => {
                    const catId = String(cat.id);
                    const rate = s.categoryCommission?.[catId] ?? '';
                    return (
                      <div key={catId} className="flex items-center gap-3">
                        <span className="w-28 text-xs text-text-secondary truncate">{cat.name}</span>
                        <input
                          type="number"
                          step="0.1"
                          value={rate}
                          onChange={e => {
                            const newVal = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            updateSection('commission', {
                              categoryCommission: {
                                ...s.categoryCommission,
                                [catId]: newVal,
                              },
                            });
                          }}
                          className={inputClass + ' !w-20'}
                          placeholder="—"
                        />
                        <span className="text-xs text-text-muted">%</span>
                      </div>
                    );
                  })}
                  {categories.length === 0 && (
                    <p className="text-xs text-text-muted italic">No main categories found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'membership':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-xs text-text-primary col-span-2">
              <input type="checkbox" checked={s.enableMembership} onChange={e => updateSection('membership', { enableMembership: e.target.checked })} className="w-3.5 h-3.5 rounded border-border-light text-brand focus:ring-brand" />
              Enable Membership
            </label>
            <div>
              <label className="text-xs font-medium text-text-primary mb-1 block">Membership Commission Discount (%)</label>
              <input type="number" step="0.1" value={s.membershipCommissionDiscount} onChange={e => updateSection('membership', { membershipCommissionDiscount: parseFloat(e.target.value) || 0 })} className={inputClass} />
              <p className="text-[10px] text-text-muted mt-0.5">Discount applied on top of category/default commission for members.</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-text-primary col-span-2">
              <input type="checkbox" checked={s.sellerMembershipRequired} onChange={e => updateSection('membership', { sellerMembershipRequired: e.target.checked })} className="w-3.5 h-3.5 rounded border-border-light text-brand focus:ring-brand" />
              Require active membership for sellers to list products
            </label>
          </div>
        );

      case 'orders_block':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Block Start</label>
                <input type="datetime-local" value={s.order_block_start} onChange={e => updateSection('orders_block', { order_block_start: e.target.value })} className={inputClass} />
                <p className="text-[10px] text-text-muted mt-0.5">Orders will be paused from this date/time.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Block End</label>
                <input type="datetime-local" value={s.order_block_end} onChange={e => updateSection('orders_block', { order_block_end: e.target.value })} className={inputClass} />
                <p className="text-[10px] text-text-muted mt-0.5">Orders will resume after this date/time.</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border-light mt-4">
              <h3 className="text-sm font-semibold text-text-primary mb-1">Daily Operating Hours</h3>
              <p className="text-xs text-text-muted mb-3">Restrict orders every day during a specific time window (e.g., 08:00 to 22:00).</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-text-primary mb-1 block">Daily Start (e.g., 08:00)</label>
                  <input type="time" value={s.daily_block_start || ''} onChange={e => updateSection('orders_block', { daily_block_start: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-primary mb-1 block">Daily End (e.g., 22:00)</label>
                  <input type="time" value={s.daily_block_end || ''} onChange={e => updateSection('orders_block', { daily_block_end: e.target.value })} className={inputClass} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'seller_health':
        return (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">Configure automatic suspension rules. The system checks sellers daily.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Inactivity Days</label>
                <input type="number" min="7" value={s.inactivity_days} onChange={e => updateSection('seller_health', { inactivity_days: parseInt(e.target.value) || 30 })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Decline Rate Threshold (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={s.decline_rate_threshold} onChange={e => updateSection('seller_health', { decline_rate_threshold: parseFloat(e.target.value) || 50 })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Response Time Threshold (hours)</label>
                <input type="number" min="1" value={s.response_time_threshold_hours} onChange={e => updateSection('seller_health', { response_time_threshold_hours: parseFloat(e.target.value) || 48 })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Unanswered Orders Threshold</label>
                <input type="number" min="1" value={s.unanswered_orders_threshold} onChange={e => updateSection('seller_health', { unanswered_orders_threshold: parseInt(e.target.value) || 5 })} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 text-xs text-text-primary col-span-2">
                <input type="checkbox" checked={s.require_two_violations} onChange={e => updateSection('seller_health', { require_two_violations: e.target.checked })} className="w-3.5 h-3.5 rounded border-border-light text-brand focus:ring-brand" />
                Require at least two violations before suspension
              </label>
            </div>
          </div>
        );

      case 'tax_and_fees':
        return (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              Configure platform fees and tax rates. VAT and WHT are only applied if enabled and you are legally required to collect them.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Service Fee Type</label>
                <select value={s.service_fee_type} onChange={e => updateSection('tax_and_fees', { service_fee_type: e.target.value })} className={inputClass}>
                  <option value="none">None</option>
                  <option value="flat">Flat (ETB)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">Service Fee Value</label>
                <input type="number" step="0.1" value={s.service_fee_value} onChange={e => updateSection('tax_and_fees', { service_fee_value: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-text-primary mb-1 block">VAT Rate (%)</label>
                <input type="number" step="0.1" value={s.vat_rate} onChange={e => updateSection('tax_and_fees', { vat_rate: parseFloat(e.target.value) || 0 })} className={inputClass} />
                <p className="text-[10px] text-text-muted mt-0.5">Set to 15 when VAT‑registered. Set to 0 if not registered.</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-text-primary">
                <input type="checkbox" checked={s.platform_vat_registered} onChange={e => updateSection('tax_and_fees', { platform_vat_registered: e.target.checked })} className="w-3.5 h-3.5 rounded border-border-light text-brand focus:ring-brand" />
                Platform is VAT‑registered
              </label>
              <label className="flex items-center gap-2 text-xs text-text-primary">
                <input type="checkbox" checked={s.withholding_tax_enabled} onChange={e => updateSection('tax_and_fees', { withholding_tax_enabled: e.target.checked })} className="w-3.5 h-3.5 rounded border-border-light text-brand focus:ring-brand" />
                Enable Withholding Tax (WHT)
              </label>
              {s.withholding_tax_enabled && (
                <div>
                  <label className="text-xs font-medium text-text-primary mb-1 block">WHT Rate (%)</label>
                  <input type="number" step="0.1" value={s.withholding_tax_rate} onChange={e => updateSection('tax_and_fees', { withholding_tax_rate: parseFloat(e.target.value) || 3 })} className={inputClass} />
                  <p className="text-[10px] text-text-muted mt-0.5">Current rate: 3% for goods per Income Tax Amendment Proclamation No. 1395/2025.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'locations':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-primary mb-1 block">Available Regions (comma‑separated)</label>
              <textarea rows={6} value={s.available_locations || ''} onChange={e => updateSection('locations', { available_locations: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return <div className="text-sm text-text-muted py-10 text-center">Loading settings…</div>;

  return (
    <div className="space-y-3">
      <h1 className="text-product-title font-semibold text-text-primary">System Settings</h1>
      <div className="card-product p-5">
        <div className="flex flex-wrap gap-1 border-b border-border-light mb-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-[var(--radius-sm)] transition ${
                  activeTab === tab.id ? 'border-b-2 border-brand text-brand bg-brand-light' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
        <form onSubmit={e => e.preventDefault()}>
          {renderTabContent()}
          <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-border-light">
            {saveStatus === 'success' && <span className="text-green-600 text-xs">✅ Settings saved!</span>}
            {saveStatus === 'error' && <span className="text-red-600 text-xs">❌ Save failed</span>}
            {saveStatus === 'saving' && <span className="text-text-muted text-xs">Saving…</span>}
            <button type="button" onClick={handleSave} className="btn-cta px-4 py-2 text-xs font-semibold">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;