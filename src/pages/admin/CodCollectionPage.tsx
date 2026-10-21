// src/pages/admin/CodCollectionPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/axios';
import {
  CheckCircleIcon,
  BanknotesIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

const inputClass =
  'w-full h-10 px-3 text-sm border border-border-light rounded-[var(--radius-sm)] bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand';

const CodCollectionPage = () => {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: partners } = useQuery('adminLogisticsPartners', () =>
    api.get('/admin/logistics_partners').then(res => res.data)
  );

  const { data: codDetails, isLoading, isError } = useQuery(
    ['codDetails', startDate, endDate],
    () =>
      api
        .get('/admin/logistics_partners/cod_details', {
          params: { start_date: startDate, end_date: endDate },
        })
        .then(res => res.data.partners),
    { staleTime: 30 * 1000 }
  );

  const reconcileMutation = useMutation(
    ({ partnerId, orderId }: { partnerId: number | string; orderId: number }) =>
      api.patch(`/admin/logistics_partners/${partnerId}/reconcile_order`, { order_id: orderId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('codDetails');
        setMutationError(null);
      },
      onError: (err: any) => {
        setMutationError(err.response?.data?.error || 'Failed to reconcile.');
      },
    }
  );

  const formatPrice = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const allOrders = (codDetails || []).flatMap((group: any) => {
    const partner = group.partner || { id: null, name: 'Unassigned' };
    return (group.orders || []).map((order: any) => ({
      ...order,
      partner_id: partner.id,
      partner_name: partner.name,
    }));
  });

  const filteredOrders = allOrders.filter((order: any) => {
    const partnerMatch =
      partnerFilter === 'all' ||
      (order.partner_id != null && order.partner_id.toString() === partnerFilter);
    const searchMatch =
      search.trim() === '' ||
      `#${order.id}`.includes(search.toLowerCase()) ||
      (order.buyer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.shipping_address || '').toLowerCase().includes(search.toLowerCase());
    return partnerMatch && searchMatch;
  });

  const groupedByPartner = filteredOrders.reduce((acc: any, order: any) => {
    const key = order.partner_id ?? 'unassigned';
    if (!acc[key]) {
      acc[key] = {
        partner_id: order.partner_id,
        partner_name: order.partner_name,
        orders: [],
      };
    }
    acc[key].orders.push(order);
    return acc;
  }, {});

  const groups = Object.values(groupedByPartner);

  const totalCollected = filteredOrders.reduce((sum, o) => sum + (o.total_collected || 0), 0);
  const totalPartnerFee = filteredOrders.reduce((sum, o) => sum + (o.partner_fee || 0), 0);
  const totalNetOwed = filteredOrders.reduce((sum, o) => sum + (o.net_owed || 0), 0);
  const reconciledCount = filteredOrders.filter(o => o.reconciled).length;
  const pendingCount = filteredOrders.length - reconciledCount;

  // ─── Build professional print/PDF statement ─────────
  const buildStatementHtml = ({
    title,
    subtitle,
    orders,
    totalCollected,
    totalPartnerFee,
    totalNetOwed,
    includePartnerColumn,
    periodStart,
    periodEnd,
  }: any) => {
    const logoUrl = `${window.location.origin}/images/logo.png`;

    const ordersRows = orders
      .map(
        order => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">#${order.id}</td>
            <td style="padding:8px;border:1px solid #ddd;">${order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : ''}</td>
            ${includePartnerColumn ? `<td style="padding:8px;border:1px solid #ddd;">${order.partner_name || ''}</td>` : ''}
            <td style="padding:8px;border:1px solid #ddd;">${order.buyer_name || ''}</td>
            <td style="padding:8px;border:1px solid #ddd;">${order.buyer_phone || ''}</td>
            <td style="padding:8px;border:1px solid #ddd;">${order.shipping_address || ''}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatPrice(order.delivery_fee || 0)}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatPrice(order.total_collected || 0)}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatPrice(order.partner_fee || 0)}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatPrice(order.net_owed || 0)}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${order.reconciled ? 'Yes' : 'No'}</td>
          </tr>
        `
      )
      .join('');

    const headers = [
      'Order ID',
      'Date',
      ...(includePartnerColumn ? ['Partner'] : []),
      'Buyer',
      'Phone',
      'Address',
      'Delivery Fee',
      'Collected',
      'Partner Fee',
      'Net Owed',
      'Reconciled',
    ];

    const headerRow = headers
      .map(h => `<th style="padding:8px;border:1px solid #ddd;background:#f2f2f2;">${h}</th>`)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 20px;
            color: #1a1a1a;
            position: relative;
            overflow: visible;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-25deg);
            font-size: 120px;
            color: rgba(255, 68, 0, 0.08);
            font-weight: 900;
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
            user-select: none;
            text-transform: uppercase;
          }
          .container {
            position: relative;
            max-width: 1000px;
            margin: auto;
            background: rgba(255,255,255,0.97);
            padding: 30px;
            border-radius: 8px;
            z-index: 1;
            overflow: visible;
          }
          .content {
            position: relative;
            z-index: 2;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
          .logo {
            height: 50px;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            color: #333;
            text-align: right;
          }
          .subtitle {
            font-size: 13px;
            color: #666;
            margin-top: 4px;
            text-align: right;
          }
          .summary {
            display: flex;
            gap: 20px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }
          .summary div {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 12px 16px;
            min-width: 150px;
          }
          .summary span { display: block; font-size: 11px; color: #777; }
          .summary strong { font-size: 18px; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            background: #f2f2f2;
            text-align: left;
            padding: 8px;
            border: 1px solid #ddd;
            font-weight: 600;
          }
          td {
            padding: 8px;
            border: 1px solid #ddd;
            vertical-align: top;
          }
          .footer {
            margin-top: 20px;
            font-size: 11px;
            color: #999;
            text-align: center;
          }
          .no-print { margin-top: 20px; text-align: right; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">ET Marketplace</div>
        <div class="container">
          <div class="content">
            <div class="header">
              <img src="${logoUrl}" alt="ET Marketplace" class="logo" onerror="this.style.display='none'" />
              <div>
                <div class="title">${title}</div>
                <div class="subtitle">${subtitle}</div>
              </div>
            </div>
            <div class="summary">
              <div>
                <span>Total Collected</span>
                <strong>ETB ${formatPrice(totalCollected)}</strong>
              </div>
              <div>
                <span>Total Partner Fees</span>
                <strong>ETB ${formatPrice(totalPartnerFee)}</strong>
              </div>
              <div>
                <span>Net Owed to Platform</span>
                <strong>ETB ${formatPrice(totalNetOwed)}</strong>
              </div>
              <div>
                <span>Orders</span>
                <strong>${orders.length}</strong>
              </div>
            </div>
            <table>
              <thead>
                <tr>${headerRow}</tr>
              </thead>
              <tbody>
                ${ordersRows}
              </tbody>
            </table>
            <div class="footer">
              Generated on ${new Date().toLocaleString()} · ET Marketplace
            </div>
            <div class="no-print">
              <button onclick="window.print()" style="padding:10px 20px; background:#FF4400; color:white; border:none; border-radius:4px; cursor:pointer;">Print / Save as PDF</button>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  };

  const openPrintWindow = (html: string) => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      setMutationError('Please allow popups to print.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const printSummaryStatement = () => {
    if (filteredOrders.length === 0) {
      setMutationError('No data to print.');
      return;
    }
    const html = buildStatementHtml({
      title: 'COD Collection Statement',
      subtitle: `Period: ${startDate} to ${endDate}`,
      orders: filteredOrders,
      totalCollected,
      totalPartnerFee,
      totalNetOwed,
      includePartnerColumn: true,
    });
    openPrintWindow(html);
  };

  const printPartnerStatement = (group: any) => {
    const orders = group.orders;
    if (orders.length === 0) return;
    const groupCollected = orders.reduce((s, o) => s + (o.total_collected || 0), 0);
    const groupFee = orders.reduce((s, o) => s + (o.partner_fee || 0), 0);
    const groupNet = orders.reduce((s, o) => s + (o.net_owed || 0), 0);
    const html = buildStatementHtml({
      title: 'COD Collection Statement',
      subtitle: `${group.partner_name} · Period: ${startDate} to ${endDate}`,
      orders,
      totalCollected: groupCollected,
      totalPartnerFee: groupFee,
      totalNetOwed: groupNet,
      includePartnerColumn: false,
    });
    openPrintWindow(html);
  };

  const exportSummaryCsv = () => {
    if (filteredOrders.length === 0) {
      setMutationError('No data to export.');
      return;
    }
    setExporting(true);
    try {
      const headers = [
        'Order ID',
        'Delivered Date',
        'Partner',
        'Buyer Name',
        'Buyer Phone',
        'Items',
        'Subtotal (ETB)',
        'Delivery Fee (ETB)',
        'Total Collected (ETB)',
        'Partner Fee (ETB)',
        'Net Owed (ETB)',
        'Reconciled',
      ];
      const rows = filteredOrders.map((order: any) => [
        order.id,
        order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : '',
        order.partner_name,
        order.buyer_name || '',
        order.buyer_phone || '',
        (order.products || []).map((p: any) => `${p.title} x${p.quantity}`).join('; '),
        (order.subtotal || 0).toFixed(2),
        (order.delivery_fee || 0).toFixed(2),
        (order.total_collected || 0).toFixed(2),
        (order.partner_fee || 0).toFixed(2),
        (order.net_owed || 0).toFixed(2),
        order.reconciled ? 'Yes' : 'No',
      ]);
      const escapeCsv = (val: any) => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCsv).join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `COD_Summary_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMutationError('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">COD Collection</h1>
          <p className="text-sm text-text-muted mt-1">
            Track cash collected by logistics partners and review delivery details.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={printSummaryStatement}
            disabled={isLoading}
            className="btn-cta flex items-center gap-2 disabled:opacity-50"
          >
            <PrinterIcon className="w-4 h-4" />
            Print Summary
          </button>
          <button
            onClick={exportSummaryCsv}
            disabled={exporting || isLoading}
            className="btn-cta flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'Summary CSV'}
          </button>
        </div>
      </div>

      {mutationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="text-red-500 hover:text-red-700">
            <ExclamationTriangleIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border-light shadow-sm rounded-lg p-4">
          <p className="text-xs text-text-muted mb-1">Total Collected</p>
          <p className="text-xl font-bold text-green-600">ETB {formatPrice(totalCollected)}</p>
        </div>
        <div className="bg-white border border-border-light shadow-sm rounded-lg p-4">
          <p className="text-xs text-text-muted mb-1">Total Partner Fees</p>
          <p className="text-xl font-bold text-blue-600">ETB {formatPrice(totalPartnerFee)}</p>
        </div>
        <div className="bg-white border border-border-light shadow-sm rounded-lg p-4">
          <p className="text-xs text-text-muted mb-1">Net Owed to Platform</p>
          <p className="text-xl font-bold text-purple-600">ETB {formatPrice(totalNetOwed)}</p>
        </div>
        <div className="bg-white border border-border-light shadow-sm rounded-lg p-4">
          <p className="text-xs text-text-muted mb-1">Reconciled</p>
          <p className="text-xl font-bold text-gray-700">
            {reconciledCount} / {pendingCount + reconciledCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border-light shadow-sm p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Partner</label>
            <select value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)} className={inputClass}>
              <option value="all">All Partners</option>
              {partners?.map((p: any) => (
                <option key={p.id} value={p.id.toString()}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
          <input
            type="text"
            placeholder="Search by order ID, buyer name, or address…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      {/* Partner Groups */}
      {isLoading ? (
        <div className="text-center py-12 text-text-muted">Loading COD collection…</div>
      ) : isError ? (
        <div className="text-center py-12 text-red-500">Failed to load COD data.</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 bg-white border border-border-light shadow-sm rounded-lg">
          <DocumentTextIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-text-muted">No COD transactions found for this period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group: any) => {
            const isExpanded = expandedPartner === String(group.partner_id);
            const groupCollected = group.orders.reduce((s, o) => s + (o.total_collected || 0), 0);
            const groupFee = group.orders.reduce((s, o) => s + (o.partner_fee || 0), 0);
            const groupNet = group.orders.reduce((s, o) => s + (o.net_owed || 0), 0);
            const groupReconciled = group.orders.filter(o => o.reconciled).length;

            return (
              <div key={String(group.partner_id)} className="bg-white border border-border-light shadow-sm rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#F8F6F2]">
                  <button
                    onClick={() => setExpandedPartner(isExpanded ? null : String(group.partner_id))}
                    className="flex items-center gap-3 text-left"
                  >
                    <BanknotesIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-text-primary">{group.partner_name}</h3>
                      <p className="text-xs text-text-muted">{group.orders.length} orders</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-text-muted">Collected: <span className="font-medium text-text-primary">ETB {formatPrice(groupCollected)}</span></p>
                      <p className="text-xs text-text-muted">Net Owed: <span className="font-medium text-text-primary">ETB {formatPrice(groupNet)}</span></p>
                    </div>
                    <span className="text-xs text-text-muted">{groupReconciled}/{group.orders.length} rec.</span>
                    <button
                      onClick={() => printPartnerStatement(group)}
                      className="p-1 rounded hover:bg-gray-200 transition"
                      title="Print / Save as PDF for this partner"
                    >
                      <PrinterIcon className="w-4 h-4 text-gray-600" />
                    </button>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border-light">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase">Order ID</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase">Date</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase">Buyer</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase">Items</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase">Delivery Fee</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase">Collected</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase">Partner Fee</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase">Net Owed</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                          {group.orders.map((order: any) => (
                            <tr key={order.id} className="hover:bg-surface-hover transition">
                              <td className="px-4 py-3 font-mono">#{order.id}</td>
                              <td className="px-4 py-3">{new Date(order.delivered_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3">{order.buyer_name}</td>
                              <td className="px-4 py-3">
                                <div className="max-w-xs">
                                  {order.products?.map((p: any, idx: number) => (
                                    <span key={idx} className="block text-xs">{p.title} <span className="text-gray-400">x{p.quantity}</span></span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">ETB {formatPrice(order.delivery_fee || 0)}</td>
                              <td className="px-4 py-3 text-right font-medium">ETB {formatPrice(order.total_collected)}</td>
                              <td className="px-4 py-3 text-right">ETB {formatPrice(order.partner_fee)}</td>
                              <td className="px-4 py-3 text-right font-bold">ETB {formatPrice(order.net_owed)}</td>
                              <td className="px-4 py-3 text-center">
                                {order.reconciled ? (
                                  <CheckCircleIcon className="w-5 h-5 text-green-600 inline" />
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (group.partner_id) {
                                        reconcileMutation.mutate({
                                          partnerId: group.partner_id,
                                          orderId: order.id,
                                        });
                                      }
                                    }}
                                    disabled={!group.partner_id || reconcileMutation.isLoading}
                                    className="text-brand text-xs font-medium hover:underline disabled:opacity-50"
                                  >
                                    Mark Received
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CodCollectionPage;