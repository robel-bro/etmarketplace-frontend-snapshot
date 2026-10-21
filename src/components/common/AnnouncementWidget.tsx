import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  MegaphoneIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';

interface Announcement {
  id: number;
  title: string;
  content: string;
  link?: string;
  announcement_type: string;
  active: boolean;
}

const DISMISSED_KEY = 'et_announcements_dismissed';

interface AnnouncementWidgetProps {
  isOpen?: boolean;
  onToggle?: () => void;
  hideTab?: boolean;
}

const AnnouncementWidget = ({ isOpen, onToggle, hideTab }: AnnouncementWidgetProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [internalPanelOpen, setInternalPanelOpen] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const panelOpen = isOpen !== undefined ? isOpen : internalPanelOpen;

  const setPanelOpen = (open: boolean) => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalPanelOpen(open);
    }
  };

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

  // Fetch active announcements
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
          console.warn('Failed to load announcements – hiding widget');
          setFetchError(true);
        }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const activeAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

  const handleDismiss = (id: number) => {
    const updated = new Set(dismissedIds);
    updated.add(id);
    setDismissedIds(updated);
    persistDismissed(updated);
  };

  if (fetchError) return null;

  // ── If not hiding the tab, follow original logic: hide entirely when no announcements ──
  if (!hideTab && activeAnnouncements.length === 0) return null;

  return (
    <div className={`${hideTab ? '' : 'fixed left-0 top-1/3'} z-[150] flex`}>
      {/* Slim white ribbon tab (only when hideTab is false) */}
      {!hideTab && (
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="bg-white border border-gray-200 border-l-0 rounded-r-lg shadow-sm hover:shadow-md transition-all flex flex-col items-center py-3 px-2 gap-2 group"
          aria-label="Open ET Announcements"
        >
          <MegaphoneIcon className="w-5 h-5 text-gray-600 group-hover:text-brand transition-colors" />
          <span
            className="text-[10px] font-semibold text-gray-500 group-hover:text-brand tracking-tight whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            ET Announcement
          </span>
          {activeAnnouncements.length > 0 && (
            <span className="bg-brand text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
              {activeAnnouncements.length}
            </span>
          )}
        </button>
      )}

      {/* Sliding Panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            className="bg-white border-r border-gray-100 shadow-2xl overflow-hidden"
            style={{ maxHeight: '70vh' }}
          >
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="bg-gradient-to-r from-[#FF7A00] to-[#D84315] px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MegaphoneIcon className="w-5 h-5 text-white" />
                  <span className="text-base font-bold text-white">ET Marketplace</span>
                  <span className="text-white/80 text-sm ml-1">· Announcements</span>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/20 transition"
                  aria-label="Close panel"
                >
                  <ArrowRightIcon className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {activeAnnouncements.length > 0 ? (
                  activeAnnouncements.map((a, idx) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group"
                    >
                      <button
                        onClick={() => handleDismiss(a.id)}
                        className="absolute top-3 right-3 p-1 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Dismiss"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>

                      <h3 className="text-sm font-semibold text-gray-900 pr-6">{a.title}</h3>
                      {a.content && (
                        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{a.content}</p>
                      )}
                      {a.link && (
                        <a
                          href={a.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
                        >
                          Learn more
                          <ArrowRightIcon className="w-3 h-3" />
                        </a>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full py-12">
                    <p className="text-sm text-gray-400">No active announcements right now.</p>
                  </div>
                )}
              </div>

              {/* Panel Footer */}
              <div className="border-t border-gray-100 px-5 py-3 text-center bg-white">
                <p className="text-[10px] text-gray-400">
                  You can dismiss individual announcements. We'll keep you posted.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementWidget;