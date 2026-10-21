import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';
import api from '../lib/axios';

const InvoicePage = () => {
  const { orderId } = useParams();
  const [invoiceHtml, setInvoiceHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/orders/${orderId}/invoice`, {
      responseType: 'text',
      headers: { Accept: 'text/html' },
    })
      .then(res => {
        setInvoiceHtml(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load invoice. Please ensure the order exists.');
        setLoading(false);
      });
  }, [orderId]);

  const handlePrint = () => {
    if (contentRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading invoice…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link to="/orders" className="text-sm text-brand hover:underline">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Top bar – hidden when printing */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white print:hidden">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Orders
        </Link>
        <button
          onClick={handlePrint}
          className="btn-cta inline-flex items-center gap-2 px-4 py-2 text-sm font-medium print:hidden"
        >
          <PrinterIcon className="w-4 h-4" />
          Print / Download
        </button>
      </div>

      {/* Scrollable invoice content – renders the exact same HTML as the standalone page */}
      <div
        ref={contentRef}
        className="flex-1 overflow-auto"
        dangerouslySetInnerHTML={{ __html: invoiceHtml }}
      />
    </div>
  );
};

export default InvoicePage;