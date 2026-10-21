import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import InsaneEthiopianFooter from './InsaneEthiopianFooter';
import api from '../../lib/axios';
import { X, Megaphone } from 'lucide-react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface Announcement {
  id: number;
  title: string;
  content: string;
  link?: string;
  announcement_type: string;
  active: boolean;
}

const DISMISSED_KEY = 'et_announcements_dismissed';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const location = useLocation();

  // Load dismissed IDs
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (raw) {
        const ids: number[] = JSON.parse(raw);
        setDismissedIds(new Set(ids));
      }
    } catch { /* ignore */ }
  }, []);

  const persistDismissed = useCallback((ids: Set<number>) => {
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
    } catch { /* ignore */ }
  }, []);

  // Fetch announcements
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await api.get('/api/v1/announcements');
        if (!cancelled) {
          const data: Announcement[] = res.data || [];
          setAnnouncements(
            data.filter(a => a.active && a.announcement_type !== 'banner')
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Failed to load announcements');
          setAnnouncements([]);
        }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Close popover on navigation
  useEffect(() => {
    setPanelOpen(false);
  }, [location.pathname]);

  const activeAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

  const handleDismiss = (id: number) => {
    const updated = new Set(dismissedIds);
    updated.add(id);
    setDismissedIds(updated);
    persistDismissed(updated);
  };

  // If no active announcements, render nothing at all
  if (activeAnnouncements.length === 0) return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="sticky top-0 z-50"><Header /></div>
      <main className="flex-grow w-full bg-white">
        {/* ★ Added responsive side padding: tighter on mobile, 16px on sm+ */}
        <div className="container-marketplace px-2 sm:px-4">{children}</div>
      </main>
      <InsaneEthiopianFooter />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="sticky top-0 z-50">
        <Header />
      </div>
      <main className="flex-grow w-full bg-white">
        <div className="container-marketplace px-2 sm:px-4">{children}</div>
      </main>
      <InsaneEthiopianFooter />

      {/* Floating Announcement System */}
      <div className="fixed bottom-6 left-6 z-50">
        <AnimatePresence>
          {/* Square button – visible only when panel is closed */}
          {!panelOpen && (
            <motion.button
              key="button"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => setPanelOpen(true)}
              className="w-11 h-11 bg-yellow-500 text-white rounded-xl shadow-lg hover:bg-yellow-600 active:scale-95 transition-all flex items-center justify-center"
              aria-label="Show announcements"
            >
              <Megaphone className="w-5 h-5" />
              {/* Pulsing badge (show count) */}
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[9px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {activeAnnouncements.length}
              </span>
            </motion.button>
          )}

          {/* Popover panel – slides up from the same spot */}
          {panelOpen && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
              style={{ maxHeight: '55vh' }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">Announcements</span>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                  aria-label="Close popover"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Body */}
              <div className="p-3 space-y-2.5 max-h-[45vh] overflow-y-auto bg-gray-50/50">
                {activeAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 relative group"
                  >
                    <button
                      onClick={() => handleDismiss(a.id)}
                      className="absolute top-2 right-2 p-1 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <h3 className="text-sm font-semibold text-gray-900 pr-6">{a.title}</h3>
                    {a.content && (
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{a.content}</p>
                    )}
                    {a.link && (
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-yellow-600 hover:text-yellow-700 transition-colors"
                      >
                        Learn more
                        <ArrowRightIcon className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 px-4 py-2 text-center bg-white">
                <p className="text-[10px] text-gray-400">
                  You can dismiss individual announcements.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Layout;