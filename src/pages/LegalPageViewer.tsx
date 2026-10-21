// src/pages/LegalPageViewer.tsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../lib/axios';

const PATH_TO_KEY: Record<string, string> = {
  '/terms':         'terms',
  '/privacy':       'privacy',
  '/cookies':       'cookies',
  '/protection':    'buyer-protection',
  '/ip-policy':     'ip-policy',
  '/returns':       'shipping-returns',
  '/shipping':      'shipping-returns',
};

export default function LegalPageViewer() {
  const location = useLocation();
  const dbKey = PATH_TO_KEY[location.pathname] || '';

  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbKey) return;
    setLoading(true);
    api.get(`/legal/${dbKey}`)
      .then(res => setPage(res.data))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [dbKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-text-primary">Page not found</h2>
          <p className="mt-1 text-sm text-text-muted">The requested legal page could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Branded header */}
      <div className="bg-white border-b border-border-light">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{page.title}</h1>
              <p className="text-sm text-text-muted mt-1">
                Version {page.version} · Last updated {new Date(page.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <p className="text-sm text-text-muted border-t border-border-light pt-4 mt-4">
            This policy is part of ET Marketplace's commitment to transparency and compliance with Ethiopian e‑commerce regulations.
          </p>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Card with watermark inside – NO overflow-hidden, so the rotated watermark is fully visible */}
        <div className="relative bg-white rounded-xl shadow-sm border border-border-light">
          {/* Watermark – centered, flexible, clearly visible */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <span className="text-gray-400 font-black opacity-15 text-[clamp(2.5rem,8vw,4.5rem)] transform -rotate-[20deg] whitespace-nowrap tracking-widest">
              ET MARKETPLACE
            </span>
          </div>

          {/* Policy text */}
          <div className="relative z-10 p-8 md:p-12">
            <article
              className="prose prose-sm md:prose-base max-w-none
                prose-headings:text-text-primary
                prose-headings:font-bold
                prose-headings:tracking-tight
                prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-text-secondary prose-p:leading-relaxed prose-p:mb-4
                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                prose-li:text-text-secondary prose-li:mb-1
                prose-strong:text-text-primary prose-strong:font-semibold
                prose-a:text-brand prose-a:no-underline hover:prose-a:underline
                [&_h2]:border-b [&_h2]:border-border-light [&_h2]:pb-2
                [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2
                [&_h2::before]:content-[''] [&_h2::before]:w-1 [&_h2::before]:h-6 [&_h2::before]:bg-brand [&_h2::before]:rounded-full [&_h2::before]:inline-block
                [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2
                [&_h3::before]:content-[''] [&_h3::before]:w-1.5 [&_h3::before]:h-1.5 [&_h3::before]:bg-text-muted [&_h3::before]:rounded-full [&_h3::before]:inline-block
              "
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} ET Marketplace. All rights reserved. This policy is effective as of the date shown above.
          </p>
          <p className="text-xs text-text-muted mt-1">
            For questions about this policy, contact <a href="mailto:support@etmarketplace.com" className="text-brand hover:underline">support@etmarketplace.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}