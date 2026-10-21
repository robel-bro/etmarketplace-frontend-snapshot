// src/pages/SellerSetupPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';
import {
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

const FAYDA_REGEX = /^\d{10,12}$/;
const ALLOWED_REGIONS = [
  'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Bahir Dar', 'Hawassa',
];

const REGION_LABELS: Record<string, { subLabel: string; lowestLabel: string }> = {
  'Addis Ababa': { subLabel: 'Sub‑city', lowestLabel: 'Woreda' },
  'Dire Dawa':   { subLabel: 'Sub‑city', lowestLabel: 'Woreda' },
};

const getLabels = (region: string) =>
  REGION_LABELS[region] || { subLabel: 'Zone', lowestLabel: 'Woreda' };

type VendorStatus = null | 'pending' | 'approved' | 'rejected';

const SellerSetupPage = () => {
  // ── form fields ────────────────────────────────────────
  const [nationalId, setNationalId] = useState('');
  const [shopName, setShopName] = useState('');
  const [tinCertificate, setTinCertificate] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [isBulkSupplier, setIsBulkSupplier] = useState(false);
  const [telebirrNumber, setTelebirrNumber] = useState('');
  const [region, setRegion] = useState('');
  const [subRegion, setSubRegion] = useState('');
  const [lowest, setLowest] = useState('');

  // ── UI state ───────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ── legal toggles ──────────────────────────────────────
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [showFullPrivacy, setShowFullPrivacy] = useState(false);
  const [fullTermsContent, setFullTermsContent] = useState('');
  const [fullPrivacyContent, setFullPrivacyContent] = useState('');

  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const navigate = useNavigate();
  const loc = useLocation();
  const { refreshUser } = useAuth();

  // ── fetch initial data ─────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const vendorRes = await api.get('/api/v1/vendors/me');
        if (vendorRes.data) {
          setVendorStatus(vendorRes.data.status);
          setRejectionReason(vendorRes.data.rejection_reason || '');
        }
      } catch { setVendorStatus(null); }

      try {
        const settingsRes = await api.get('/admin/settings');
        const comm = settingsRes.data?.commission;
        if (comm) setCommissionRate(comm.defaultCommission ?? 0);
      } catch { setCommissionRate(null); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const state = loc.state as { isBulkSupplier?: boolean } | null;
    if (state?.isBulkSupplier) setIsBulkSupplier(true);
  }, [loc]);

  // ── legal content ──────────────────────────────────────
  const fetchFullLegalContent = async (key: string) => {
    try { return (await api.get(`/legal/${key}`)).data.body || ''; }
    catch { return 'Could not load the document.'; }
  };
  const handleShowFullTerms = async () => {
    if (!fullTermsContent) setFullTermsContent(await fetchFullLegalContent('terms'));
    setShowFullTerms(true);
  };
  const handleShowFullPrivacy = async () => {
    if (!fullPrivacyContent) setFullPrivacyContent(await fetchFullLegalContent('privacy'));
    setShowFullPrivacy(true);
  };

  const currentLabels = getLabels(region);

  // ── validation ─────────────────────────────────────────
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!nationalId.trim()) errors.nationalId = 'Fayda ID is required.';
    else if (!FAYDA_REGEX.test(nationalId.trim())) errors.nationalId = 'Fayda ID must be 10‑12 digits.';

    if (!shopName.trim()) errors.shopName = 'Shop name is required.';

    if (!region) errors.region = 'Region is required.';
    if (!subRegion.trim()) errors.subRegion = `${currentLabels.subLabel} is required.`;
    if (!lowest.trim()) errors.lowest = `${currentLabels.lowestLabel} is required.`;

    if (!tinCertificate) {
      errors.tinCertificate = 'TIN certificate is required.';
    }

    if (isBulkSupplier && !licenseFile) {
      errors.licenseFile = 'Business license is required for bulk suppliers.';
    }

    if (!telebirrNumber.trim()) errors.telebirrNumber = 'Telebirr number is required.';
    else if (!/^\+251[79]\d{8}$/.test(telebirrNumber.trim())) {
      errors.telebirrNumber = 'Enter a valid Ethiopian phone number (+251 followed by 9 digits, starting with 9 or 7).';
    }

    if (!agreedToTerms) errors.agreement = 'You must agree to the Seller Agreement and policies.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── submit ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError('');

    const fullLocation = `${region}, ${currentLabels.subLabel}: ${subRegion.trim()}, ${currentLabels.lowestLabel}: ${lowest.trim()}`;

    try {
      const formData = new FormData();
      formData.append('vendor[national_id]', nationalId.trim());
      formData.append('vendor[business_name]', shopName.trim());
      formData.append('vendor[business_address]', fullLocation);
      formData.append('vendor[is_bulk_supplier]', isBulkSupplier.toString());
      formData.append('vendor[telebirr_number]', telebirrNumber.trim());

      if (tinCertificate) formData.append('vendor[tin_certificate]', tinCertificate);
      if (licenseFile) formData.append('vendor[business_license]', licenseFile);

      await api.post('/api/seller_verification', formData);
      await refreshUser();
      setSubmitted(true);
      setVendorStatus('pending');
      setTimeout(() => navigate('/'), 4000);
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Submission failed.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const FullLegalModal = ({ title, content, onClose }: { title: string; content: string; onClose: () => void }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover"><XMarkIcon className="w-5 h-5 text-text-muted" /></button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-text-secondary leading-relaxed space-y-4">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        <div className="p-4 border-t border-border-light text-right">
          <button onClick={onClose} className="btn-cta px-4 py-2 text-sm">Close</button>
        </div>
      </motion.div>
    </div>
  );

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  // ── The form UI (stable, no remount) ───────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="animate-spin w-10 h-10 border-4 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  if (submitted || vendorStatus === 'pending') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-brand" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Application Under Review</h2>
          <p className="text-sm text-text-secondary mb-6">Your seller application is being reviewed. We'll notify you when a decision is made.</p>
          <button onClick={() => navigate('/')} className="btn-cta px-6 py-2.5 text-sm">Go to Home</button>
        </div>
      </div>
    );
  }

  if (vendorStatus === 'approved') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheckIcon className="w-8 h-8 text-green-600" /></div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Approved!</h2>
          <p className="text-sm text-text-secondary mb-6">You can now start selling on ET Marketplace.</p>
          <button onClick={() => navigate('/seller')} className="btn-cta px-6 py-2.5 text-sm mr-3">Dashboard</button>
          <button onClick={() => navigate('/')} className="text-sm text-text-muted underline mt-3">Home</button>
        </div>
      </div>
    );
  }

  if (vendorStatus === 'rejected') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><XMarkIcon className="w-8 h-8 text-red-500" /></div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Rejected</h2>
          <p className="text-sm text-text-secondary mb-2">Your application was not approved.</p>
          {rejectionReason && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-700 mb-4">Reason: {rejectionReason}</div>
          )}
          <button onClick={() => { setVendorStatus(null); setRejectionReason(''); }} className="btn-cta px-6 py-2.5 text-sm">Re‑apply</button>
        </div>
      </div>
    );
  }

  // ── Main full‑screen layout with form ──────────────────
  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-white overflow-hidden">
      <div className="relative w-full lg:w-1/2 h-48 lg:h-full flex items-center justify-center bg-gray-50">
        <img
          src="/images/welcome/seller_setup.svg"
          alt="Seller verification"
          className="w-3/5 max-w-xs lg:max-w-md h-auto object-contain"
        />
        <button onClick={goBack} className="absolute top-6 left-6 p-2 rounded-full bg-white/80 hover:bg-white text-gray-600 shadow-md transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full px-6 sm:px-10 lg:px-14 py-8 lg:py-0">
          <div className="w-full max-w-lg py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Complete Your Seller Profile</h1>
                <p className="text-sm text-text-secondary">Your details will be reviewed by our team</p>
              </div>
            </div>

            {commissionRate !== null && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                <CurrencyDollarIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Platform Commission</p>
                  <p className="text-xs text-blue-700">A base rate of <strong>{commissionRate}%</strong> applies per order.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                <ShieldCheckIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row 1: Fayda ID + Shop Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Fayda ID (National ID) *</label>
                  <input type="text" inputMode="numeric" value={nationalId} onChange={(e) => { setNationalId(e.target.value); setFieldErrors(prev => ({ ...prev, nationalId: '' })); }} placeholder="10‑12 digits" maxLength={12} className={`w-full h-11 px-4 text-sm border rounded-lg bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition ${fieldErrors.nationalId ? 'border-red-500' : 'border-border-light'}`} />
                  {fieldErrors.nationalId && <p className="text-red-600 text-xs mt-1">{fieldErrors.nationalId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Shop Name *</label>
                  <input type="text" value={shopName} onChange={(e) => { setShopName(e.target.value); setFieldErrors(prev => ({ ...prev, shopName: '' })); }} placeholder="Your business name" className={`w-full h-11 px-4 text-sm border rounded-lg bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition ${fieldErrors.shopName ? 'border-red-500' : 'border-border-light'}`} />
                  {fieldErrors.shopName && <p className="text-red-600 text-xs mt-1">{fieldErrors.shopName}</p>}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Business Location *</label>
                <div className="grid grid-cols-3 gap-3">
                  <select value={region} onChange={(e) => { setRegion(e.target.value); setSubRegion(''); setLowest(''); setFieldErrors(prev => ({ ...prev, region: '' })); }} className={`h-11 px-3 text-sm border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition ${fieldErrors.region ? 'border-red-500' : 'border-border-light'}`}>
                    <option value="">Region</option>
                    {ALLOWED_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input type="text" value={subRegion} onChange={(e) => { setSubRegion(e.target.value); setFieldErrors(prev => ({ ...prev, subRegion: '' })); }} placeholder={currentLabels.subLabel} className={`h-11 px-4 text-sm border rounded-lg bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition ${fieldErrors.subRegion ? 'border-red-500' : 'border-border-light'}`} />
                  <input type="text" value={lowest} onChange={(e) => { setLowest(e.target.value); setFieldErrors(prev => ({ ...prev, lowest: '' })); }} placeholder={currentLabels.lowestLabel} className={`h-11 px-4 text-sm border rounded-lg bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition ${fieldErrors.lowest ? 'border-red-500' : 'border-border-light'}`} />
                </div>
                {fieldErrors.region && <p className="text-red-600 text-xs mt-1">{fieldErrors.region}</p>}
                {fieldErrors.subRegion && <p className="text-red-600 text-xs mt-1">{fieldErrors.subRegion}</p>}
                {fieldErrors.lowest && <p className="text-red-600 text-xs mt-1">{fieldErrors.lowest}</p>}
              </div>

              {/* Bulk Supplier Card */}
              <div className={`p-4 rounded-lg border-2 transition-all ${isBulkSupplier ? 'border-brand bg-brand/5' : 'border-gray-200 bg-gray-50'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={isBulkSupplier} onChange={(e) => setIsBulkSupplier(e.target.checked)} className="mt-0.5 h-5 w-5 text-brand border-gray-300 rounded focus:ring-brand" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CubeIcon className="w-5 h-5 text-brand" />
                      <span className="font-semibold text-sm text-text-primary">Bulk / Wholesale Supplier</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      Check this if you primarily sell large quantities to businesses or resellers. Bulk suppliers may qualify for special commissions and shipping options.
                    </p>
                  </div>
                </label>
              </div>

              {/* TIN Certificate */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">TIN Certificate *</label>
                <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => { setTinCertificate(e.target.files?.[0] || null); setFieldErrors(prev => ({ ...prev, tinCertificate: '' })); }} className={`w-full h-11 px-4 text-sm border rounded-lg bg-white text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-light file:text-brand file:font-medium hover:file:bg-orange-100 transition ${fieldErrors.tinCertificate ? 'border-red-500' : 'border-border-light'}`} />
                {fieldErrors.tinCertificate && <p className="text-red-600 text-xs mt-1">{fieldErrors.tinCertificate}</p>}
                <p className="text-[11px] text-text-muted mt-1">Upload a clear photo or scan of your Tax Identification Number certificate.</p>
              </div>

              {/* Business License */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Business License {isBulkSupplier ? '*' : '(optional)'}
                </label>
                <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => { setLicenseFile(e.target.files?.[0] || null); setFieldErrors(prev => ({ ...prev, licenseFile: '' })); }} className={`w-full h-11 px-4 text-sm border rounded-lg bg-white text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-light file:text-brand file:font-medium hover:file:bg-orange-100 transition ${fieldErrors.licenseFile ? 'border-red-500' : 'border-border-light'}`} />
                {fieldErrors.licenseFile && <p className="text-red-600 text-xs mt-1">{fieldErrors.licenseFile}</p>}
                <p className="text-[11px] text-text-muted mt-1">
                  {isBulkSupplier
                    ? 'Required for bulk/wholesale sellers.'
                    : 'Upload if you have one (optional for regular sellers).'}
                </p>
              </div>

              {/* Telebirr – now with focus-friendly handling */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Telebirr Number *</label>
                <div className="flex items-center border rounded-lg bg-white focus-within:ring-2 focus-within:ring-brand focus-within:border-brand transition overflow-hidden">
                  <div className="flex items-center gap-1 px-3 py-0 border-r border-border-light bg-surface-hover">
                    <span className="text-lg">🇪🇹</span>
                    <span className="text-sm font-medium text-text-primary">+251</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="9XX XXX XXX"
                    value={telebirrNumber.startsWith('+251') ? telebirrNumber.slice(4) : telebirrNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setTelebirrNumber(`+251${digits}`);
                      setFieldErrors(prev => ({ ...prev, telebirrNumber: '' }));
                    }}
                    maxLength={9}
                    required
                    className="flex-1 h-11 px-4 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                </div>
                {fieldErrors.telebirrNumber && <p className="text-red-600 text-xs mt-1">{fieldErrors.telebirrNumber}</p>}
                <p className="text-[11px] text-text-muted mt-1">Ethio Telecom (9XX) or Safaricom (7XX)</p>
              </div>

              {/* Legal summaries */}
              <div className="space-y-2 pt-2">
                <div className="border border-border-light rounded-[var(--radius-sm)] overflow-hidden">
                  <button type="button" onClick={() => setShowTerms(!showTerms)} className="w-full flex items-center justify-between px-3 py-2 bg-surface-hover text-xs font-medium text-text-primary hover:bg-gray-100 transition">
                    <span>📜 Seller Agreement</span>
                    {showTerms ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </button>
                  <AnimatePresence>
                    {showTerms && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 py-2 border-t border-border-light bg-white text-xs text-text-secondary space-y-2">
                        <p><strong>Platform Role:</strong> ET Marketplace connects buyers with independent sellers. You are responsible for your products' quality, legality, and tax obligations.</p>
                        <p><strong>Seller Obligations:</strong> Comply with Ethiopian trade regulations, accept orders within 60 minutes, honour return policies, and pay applicable commissions.</p>
                        <p><strong>Commission:</strong> {commissionRate !== null ? `Base rate: ${commissionRate}%` : 'Rates shown in dashboard.'}</p>
                        <button type="button" onClick={handleShowFullTerms} className="text-brand hover:underline text-xs font-medium">Read full agreement →</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="border border-border-light rounded-[var(--radius-sm)] overflow-hidden">
                  <button type="button" onClick={() => setShowPrivacy(!showPrivacy)} className="w-full flex items-center justify-between px-3 py-2 bg-surface-hover text-xs font-medium text-text-primary hover:bg-gray-100 transition">
                    <span>🔒 Privacy Policy</span>
                    {showPrivacy ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </button>
                  <AnimatePresence>
                    {showPrivacy && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 py-2 border-t border-border-light bg-white text-xs text-text-secondary space-y-2">
                        <p><strong>Data We Collect:</strong> Phone, name, location, shop details, license.</p>
                        <p><strong>Usage:</strong> Verification, order fulfilment, communication, legal compliance.</p>
                        <p><strong>Sharing:</strong> Shop info shared with buyers and logistics partners. No data sold.</p>
                        <button type="button" onClick={handleShowFullPrivacy} className="text-brand hover:underline text-xs font-medium">Read full policy →</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="h-4 w-4 mt-0.5 text-brand border-gray-300 rounded focus:ring-brand" />
                <span className="text-xs text-text-secondary leading-relaxed">
                  I agree to the Seller Agreement, Terms, and Privacy Policy.
                </span>
              </label>

              <button type="submit" disabled={saving} className="btn-cta w-full py-3 text-sm font-bold disabled:opacity-50">
                {saving ? 'Submitting...' : 'Submit for Review'}
              </button>
            </form>

            <button onClick={() => navigate('/')} className="mt-4 text-sm text-text-muted hover:text-text-primary underline w-full text-center">
              Cancel & go back
            </button>
          </div>
        </div>
      </div>

      {showFullTerms && <FullLegalModal title="Seller Agreement" content={fullTermsContent} onClose={() => setShowFullTerms(false)} />}
      {showFullPrivacy && <FullLegalModal title="Privacy Policy" content={fullPrivacyContent} onClose={() => setShowFullPrivacy(false)} />}
    </div>
  );
};

export default SellerSetupPage;