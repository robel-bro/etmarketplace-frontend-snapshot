// src/pages/admin/FinancialLedgerPage.tsx
import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../lib/axios';
import { buildBrandedStatement, openBrandedPrint } from '../../utils/brandedPrint';
import { PrinterIcon } from '@heroicons/react/24/outline';

const FinancialLedgerPage = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const { data, isLoading, error } = useQuery(
    ['financialLedger', startDate, endDate],
    () =>
      api
        .get('/admin/financial_ledgers', {
          params: { start_date: startDate, end_date: endDate },
        })
        .then(res => res.data),
    { staleTime: 30 * 1000 }
  );

  const entries = data?.entries || [];
  const totals = data?.totals || {};

  const formatPrice = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePrint = () => {
    if (entries.length === 0) return;
    const summaryHtml = `
      <div><span>Total In</span><strong>ETB ${formatPrice(totals.total_in || 0)}</strong></div>
      <div><span>Total Out</span><strong>ETB ${formatPrice(totals.total_out || 0)}</strong></div>
      <div><span>Net</span><strong>ETB ${formatPrice(totals.net || 0)}</strong></div>
    `;
    const tableHtml = `
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          ${entries.map((entry: any) => `
            <tr>
              <td>${new Date(entry.created_at).toLocaleString()}</td>
              <td>${entry.transaction_type.replace(/_/g, ' ')}</td>
              <td>${entry.description}</td>
              <td>ETB ${formatPrice(Number(entry.amount))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    const html = buildBrandedStatement({ title: 'Financial Ledger Statement', subtitle: `${startDate} to ${endDate}`, summaryHtml, tableHtml });
    openBrandedPrint(html);
  };

  if (isLoading) return <div className="p-6 text-sm text-text-muted">Loading ledger…</div>;
  if (error) return <div className="p-6 text-sm text-red-500">Failed to load ledger.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-product-title font-semibold text-text-primary">Financial Ledger</h1>
        <button onClick={handlePrint} className="btn-cta flex items-center gap-2" disabled={!entries.length}>
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
          <p className="text-xs text-text-muted mb-1">Total In</p>
          <p className="text-xl font-bold text-green-600">ETB {formatPrice(totals.total_in || 0)}</p>
        </div>
        <div className="card-product p-4">
          <p className="text-xs text-text-muted mb-1">Total Out</p>
          <p className="text-xl font-bold text-red-600">ETB {formatPrice(totals.total_out || 0)}</p>
        </div>
        <div className="card-product p-4">
          <p className="text-xs text-text-muted mb-1">Net</p>
          <p className={`text-xl font-bold ${(totals.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>ETB {formatPrice(totals.net || 0)}</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card-product overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-hover border-b border-border-light">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Date</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">Description</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-text-muted uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {entries.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-sm text-text-muted">No transactions in this period.</td></tr>
            ) : (
              entries.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-surface-hover transition">
                  <td className="px-4 py-3 text-xs text-text-secondary">{new Date(entry.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-text-secondary capitalize">{entry.transaction_type.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{entry.description}</td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${Number(entry.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>ETB {formatPrice(Number(entry.amount))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialLedgerPage;