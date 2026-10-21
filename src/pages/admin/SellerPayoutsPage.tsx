// src/pages/admin/SellerPayoutsPage.tsx
import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { buildBrandedStatement, openBrandedPrint } from '@/utils/brandedPrint';

const useToast = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, toastType: 'success' | 'error') => {
    setMessage(msg);
    setType(toastType);
    setTimeout(() => setMessage(null), 3000);
  };

  return { toastMessage: message, toastType: type, showToast };
};

interface Payout {
  id: number;
  vendor: { id: number; business_name: string };
  amount: number;
  status: string;
  payout_method: string;
  created_at: string;
  recipient_details: any;
}

const statusOptions = ['pending', 'processing', 'paid', 'failed', 'rejected'];
const methodOptions = ['telebirr', 'bank'];

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 50;
  const { toastMessage, toastType, showToast } = useToast();

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const params: any = { page, per_page: perPage };
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      const res = await axios.get('/admin/payouts', { params });
      setPayouts(res.data.payouts || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      showToast('Failed to load payouts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter, methodFilter, page]);

  const handleBulkTelebirr = async () => {
    if (!confirm('Process all pending Telebirr payouts?')) return;
    try {
      await axios.post('/admin/payouts/bulk_process_telebirr');
      showToast('Telebirr payouts processed', 'success');
      fetchPayouts();
    } catch (err) {
      showToast('Failed to process Telebirr payouts', 'error');
    }
  };

  const handleBankExport = async () => {
    try {
      const response = await axios.get('/admin/payouts/bulk_bank_export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bank_payouts.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Bank file downloaded; payouts marked processing.', 'success');
      fetchPayouts();
    } catch (err) {
      showToast('Export failed', 'error');
    }
  };

  const action = async (id: number, act: string) => {
    try {
      await axios.post(`/admin/payouts/${id}/${act}`);
      showToast(`Payout #${id} ${act} successful`, 'success');
      fetchPayouts();
    } catch (err) {
      showToast(`Action ${act} failed`, 'error');
    }
  };

  const handlePrint = () => {
    if (payouts.length === 0) {
      showToast('No data to print.', 'error');
      return;
    }

    const title = 'Seller Payouts Statement';
    const subtitle = `${statusFilter ? `Status: ${statusFilter}` : 'All Statuses'}${methodFilter ? ` · Method: ${methodFilter}` : ''}`;

    const summaryHtml = `
      <div><span>Total Payouts</span><strong>${payouts.length}</strong></div>
      <div><span>Total Amount</span><strong>ETB ${payouts.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
    `;

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Seller</th><th>Amount</th><th>Method</th><th>Status</th><th>Created</th>
          </tr>
        </thead>
        <tbody>
          ${payouts.map(p => `
            <tr>
              <td>${p.id}</td>
              <td>${p.vendor?.business_name || '—'}</td>
              <td>ETB ${Number(p.amount).toFixed(2)}</td>
              <td>${p.payout_method}</td>
              <td>${p.status}</td>
              <td>${new Date(p.created_at).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const html = buildBrandedStatement({ title, subtitle, summaryHtml, tableHtml });
    openBrandedPrint(html);
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="container mx-auto p-6">
      {toastMessage && (
        <div className={`mb-4 px-4 py-2 rounded ${toastType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toastMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Seller Payouts</h1>
        <Button onClick={handlePrint} variant="secondary" disabled={loading}>
          Print / PDF
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || '')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={methodFilter} onValueChange={(val) => setMethodFilter(val || '')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by method" />
          </SelectTrigger>
          <SelectContent>
            {methodOptions.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={handleBulkTelebirr} disabled={loading}>Process All Telebirr</Button>
        <Button onClick={handleBankExport} disabled={loading} variant="secondary">
          Export Bank CSV & Mark Processing
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-8">Loading payouts...</p>
      ) : payouts.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No payouts found.</p>
      ) : (
        <>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Seller</th>
                <th className="p-2 text-right">Amount (Birr)</th>
                <th className="p-2 text-left">Method</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2">{p.vendor?.business_name}</td>
                  <td className="p-2 text-right">{Number(p.amount).toFixed(2)}</td>
                  <td className="p-2 capitalize">{p.payout_method}</td>
                  <td className="p-2 capitalize">{p.status}</td>
                  <td className="p-2">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-2 space-x-2">
                    {p.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => action(p.id, 'approve')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => action(p.id, 'reject')}>Reject</Button>
                      </>
                    )}
                    {p.status === 'processing' && (
                      <Button size="sm" onClick={() => action(p.id, 'mark_completed')}>Complete</Button>
                    )}
                    {p.payout_method === 'telebirr' && (p.status === 'pending' || p.status === 'failed') && (
                      <Button size="sm" variant="secondary" onClick={() => action(p.id, 'retry_telebirr')}>Retry Telebirr</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}