import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/axios';

interface SellerVerificationFormProps {
  onVerified: () => void;
}

const SellerVerificationForm = ({ onVerified }: SellerVerificationFormProps) => {
  const [form, setForm] = useState({
    businessName: '',
    tin: '',
    nationalId: '',
    businessAddress: '',
    licenseDocument: null as File | null,
    idDocument: null as File | null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'licenseDocument' | 'idDocument') => {
    if (e.target.files && e.target.files[0]) {
      setForm({ ...form, [field]: e.target.files[0] });
    }
  };

  // Map camelCase frontend keys to snake_case backend params
  const mapKeyToSnakeCase = (key: string): string => {
    const mapping: Record<string, string> = {
      businessName: 'business_name',
      nationalId: 'national_id',
      businessAddress: 'business_address',
      licenseDocument: 'license_document',
      idDocument: 'id_document',
      tin: 'tin',
    };
    return mapping[key] || key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) {
        const backendKey = mapKeyToSnakeCase(key);
        formData.append(`vendor[${backendKey}]`, value);
      }
    });
    try {
      await api.post('/api/seller_verification', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onVerified();
    } catch (err: any) {
      setError(err.response?.data?.errors?.join(', ') || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold mb-4">Seller Verification Required</h2>
      <p className="text-sm text-gray-600 mb-6">
        To start selling, please provide your business details and upload required documents.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-500 p-2 rounded text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Name</label>
          <input
            type="text"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">TIN (Tax Identification Number)</label>
          <input
            type="text"
            value={form.tin}
            onChange={(e) => setForm({ ...form, tin: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">National ID (Owner)</label>
          <input
            type="text"
            value={form.nationalId}
            onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Address</label>
          <textarea
            value={form.businessAddress}
            onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border rounded-lg"
            rows={2}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Business License Document</label>
          <input type="file" onChange={(e) => handleFileChange(e, 'licenseDocument')} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Owner ID Document</label>
          <input type="file" onChange={(e) => handleFileChange(e, 'idDocument')} required />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-lg disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
};

export default SellerVerificationForm;