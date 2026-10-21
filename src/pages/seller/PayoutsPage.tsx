// src/pages/seller/PayoutsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  ClockIcon,
  PercentBadgeIcon,
  ReceiptPercentIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,  // ★ for penalty
} from '@heroicons/react/24/outline';
import RequestPayoutModal from '../../components/seller/RequestPayoutModal';
import api from '../../lib/axios';

const PayoutsPage = () => {
  const queryClient = useQueryClient();
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data, isLoading, error } = useQuery(
    'sellerPayouts',
    () => api.get('/seller/payouts').then(res => res.data),
    { staleTime: 30 * 1000 }
  );

  const requestPayout = useMutation(
    (payload: { period_start?: string; period_end?: string }) =>
      api.post('/seller/payouts', payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sellerPayouts');
        setShowRequestModal(false);
      },
      onError: (err: any) => {
        alert(err.response?.data?.error || 'Failed to request payout.');
      },
    }
  );

  if (isLoading) return <div className="text-center py-10 text-sm text-text-muted">Loading payouts…</div>;
  if (error) return <div className="text-center py-10 text-sm text-red-500">Failed to load payouts.</div>;

  const summary = data?.summary || {
    total_earned: 0,
    pending: 0,
    available: 0,
    commission_total: 0,
    vat_total: 0,
    wht_total: 0,
  };
  const payouts = data?.payouts || [];

  const formatPrice = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Determine if a payout is a penalty (negative amount)
  const isPenalty = (amount: number) => amount < 0;

  return (
    <div className="space-y-4">
      <h1 className="text-product-title font-semibold text-text-primary">Payouts</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div whileHover={{ y: -2 }} className="card-product p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-brand-light flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Total Earned</p>
              <p className="text-lg font-bold text-text-primary">
                ETB {formatPrice(Number(summary.total_earned))}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="card-product p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-brand-light flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Pending</p>
              <p className="text-lg font-bold text-text-primary">
                ETB {formatPrice(Number(summary.pending))}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="card-product p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-brand-light flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Available for Payout</p>
              <p className="text-lg font-bold text-text-primary">
                ETB {formatPrice(Number(summary.available))}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            disabled={summary.available === 0}
            className="mt-4 w-full btn-cta py-2 text-xs font-semibold disabled:opacity-50"
          >
            Request Payout
          </button>
        </motion.div>
      </div>

      {/* Tax breakdown */}
      {(Number(summary.commission_total) > 0 ||
        Number(summary.vat_total) > 0 ||
        Number(summary.wht_total) > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Number(summary.commission_total) > 0 && (
            <motion.div whileHover={{ y: -2 }} className="card-product p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-red-50 flex items-center justify-center">
                  <PercentBadgeIcon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Commission</p>
                  <p className="text-lg font-bold text-red-600">
                    -ETB {formatPrice(Number(summary.commission_total))}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          {Number(summary.vat_total) > 0 && (
            <motion.div whileHover={{ y: -2 }} className="card-product p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-red-50 flex items-center justify-center">
                  <ReceiptPercentIcon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">VAT on Commission</p>
                  <p className="text-lg font-bold text-red-600">
                    -ETB {formatPrice(Number(summary.vat_total))}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          {Number(summary.wht_total) > 0 && (
            <motion.div whileHover={{ y: -2 }} className="card-product p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-red-50 flex items-center justify-center">
                  <BuildingLibraryIcon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Withholding Tax (WHT)</p>
                  <p className="text-lg font-bold text-red-600">
                    -ETB {formatPrice(Number(summary.wht_total))}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Payout History */}
      <div className="card-product p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4">Payout History</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left py-2 text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
              <th className="text-left py-2 text-xs font-medium text-text-muted uppercase tracking-wider">Gross</th>
              <th className="text-left py-2 text-xs font-medium text-text-muted uppercase tracking-wider">Tax</th>
              <th className="text-left py-2 text-xs font-medium text-text-muted uppercase tracking-wider">Net</th>
              <th className="text-left py-2 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
              <th className="text-left py-2 text-xs font-medium text-text-muted uppercase tracking-wider">Type</th>
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-xs text-text-muted">
                  No payouts yet.
                </td>
              </tr>
            ) : (
              payouts.map((p: any) => {
                const amount = Number(p.amount);
                const isNeg = isPenalty(amount);
                return (
                  <tr key={p.id} className="border-b border-border-light">
                    <td className="py-2.5 text-xs text-text-secondary">{p.date}</td>
                    <td className="py-2.5 text-xs text-text-secondary">
                      {p.gross_amount ? `ETB ${formatPrice(Number(p.gross_amount))}` : '—'}
                    </td>
                    <td className="py-2.5 text-xs text-red-600">
                      {p.tax_withheld ? `-ETB ${formatPrice(Number(p.tax_withheld))}` : '—'}
                    </td>
                    <td className="py-2.5 text-xs font-medium">
                      <span className={isNeg ? 'text-red-600' : 'text-text-primary'}>
                        {isNeg ? '- ' : ''}ETB {formatPrice(Math.abs(amount))}
                      </span>
                      {isNeg && (
                        <span className="ml-2 inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          Penalty
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          p.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-text-secondary capitalize">
                      {isNeg ? 'Penalty' : p.payout_method || 'Regular'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showRequestModal && (
        <RequestPayoutModal
          availableAmount={summary.available}
          onClose={() => setShowRequestModal(false)}
          onRequest={(periodStart, periodEnd) =>
            requestPayout.mutate({ period_start: periodStart, period_end: periodEnd })
          }
        />
      )}
    </div>
  );
};

export default PayoutsPage;