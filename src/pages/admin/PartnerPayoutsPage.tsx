// src/pages/admin/PartnerPayoutsPage.tsx
import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../lib/axios';
import { buildBrandedStatement, openBrandedPrint } from '../../utils/brandedPrint';
import { PrinterIcon } from '@heroicons/react/24/outline';

const PartnerPayoutsPage = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const { data, isLoading, error } = useQuery(
    ['partnerPayouts', startDate, endDate],
    () =>
      api
        .get('/admin/partner_payouts', {
          params: { start_date: startDate, end_date: endDate },
        })
        .then(res => res.data),
    { staleTime: 30 * 1000 }
  );

  const payouts = data?.payouts || [];
  const totals = data?.totals || {};

  const formatPrice = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePrint = () => {
    if (payouts.length === 0) return;
    const summaryHtml = `
      <div><span>Total Paid</span><strong>ETB ${formatPrice(totals.total_paid || 0)}</strong></div>
      <div><span>Payouts</span><strong>${totals.count || 0}</strong></div>
      <div><span>Partners</span><strong>${totals.partners || 0}</strong></div>
    `;
    const tableHtml = `
      <table>
        <thead><tr><th>ID</th><th>Partner</th><th>Delivery Request</th><th>Amount</th><th>Period</th><th>Paid At</th><th>Status</th></tr></thead>
        <tbody>
          ${payouts.map((p: any) => `
            <tr>
              <td>${p.id}</td>
              <td>${p.logistics_partner?.name || '—'}</td>
              <td>${p.delivery_request_id ? `#${p.delivery_request_id}` : '—'}</td>
              <td>ETB ${formatPrice(Number(p.amount))}</td>
              <td>${p.period_start} – ${p.period_end}</td>
              <td>${p.paid_at ? new Date(p.paid_at).toLocaleString() : '—'}</td>
              <td>${p.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    const html = buildBrandedStatement({ title: 'Partner Payouts Statement', subtitle: `${startDate} to ${endDate}`, summaryHtml, tableHtml });
    openBrandedPrint(html);
  };

  if (isLoading) return <div className="p-6 text-sm text-text-muted">Loading partner payouts…</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Failed to load partner payouts.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-product-title font-semibold text-text-primary">Partner Payouts (Automatic)</h1>
        <button onClick={handlePrint} className="btn-cta flex items-center gap-2" disabled={!payouts.length}>
          <PrinterIcon className="w-4 h-4" /> Print / PDF
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-xs text-text-muted mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-product p-4">
          <p className="text-xs text-text-muted mb-1">Total Paid This Period</p>
          <p className="text-xl font-bold text-text-primary">ETB {formatPrice(totals.total_paid || 0)}</p>
        </div>
        <div className="card-product p-4">
          <p className="text-xs text-text-muted mb-1">Number of Payouts</p>
          <p className="text-xl font-bold text-text-primary">{totals.count || 0}</p>
        </div>
        <div className="card-product p-4">
          <p className="text-xs text-text-muted mb-1">Unique Partners</p>
          <p className="text-xl font-bold text-text-primary">{totals.partners || 0}</p>
        </div>
      </div>

      {/* Payout Table */}
      <div className="card-product overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover border-b border-border-light">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">ID</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Partner</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Delivery Request</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted uppercase">Amount</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Period</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Paid At</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {payouts.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-sm text-text-muted">No partner payouts in this period.</td></tr>
            ) : (
              payouts.map((p: any) => (
                <tr key={p.id} className="hover:bg-surface-hover transition">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{p.id}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{p.logistics_partner?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{p.delivery_request_id ? `#${p.delivery_request_id}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-text-primary">ETB {formatPrice(Number(p.amount))}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{p.period_start} – {p.period_end}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{p.paid_at ? new Date(p.paid_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartnerPayoutsPage;