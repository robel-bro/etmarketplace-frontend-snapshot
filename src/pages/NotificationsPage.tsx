import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BellIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import api from '../lib/axios';

interface Notification {
  id: number;
  title: string;
  body: string;
  notification_type: string;
  read: boolean;
  metadata: any;
  created_at: string;
}

/* ────────── Reusable detail modal ────────── */
const NotificationDetailModal = ({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) => {
  const meta = notification.metadata || {};
  const price = meta.new_price ?? meta.price;
  const originalPrice = meta.original_price;
  const discount = meta.discount_percentage || meta.discount;
  const imageUrl = meta.image_url;
  const soldCount = meta.sold_count;
  const rating = meta.rating;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 overflow-y-auto max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-text-primary pr-4">{notification.title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {imageUrl && (
          <div className="relative w-full h-48 overflow-hidden rounded-lg mb-4">
            <img src={imageUrl} alt={notification.title} className="w-full h-full object-cover" />
            {discount > 0 && (
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                -{discount}%
              </span>
            )}
          </div>
        )}

        {price && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl font-bold text-text-primary">
              ETB {Number(price).toLocaleString()}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-text-muted line-through">
                ETB {Number(originalPrice).toLocaleString()}
              </span>
            )}
          </div>
        )}

        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
          {notification.body}
        </p>

        {(soldCount > 0 || rating) && (
          <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
            {soldCount > 0 && <span>{soldCount} sold</span>}
            {rating && (
              <span className="flex items-center text-yellow-500">
                <StarIcon className="w-3 h-3 mr-0.5" /> {rating}
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-text-muted mt-4">
          {new Date(notification.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-brand text-white rounded-md font-semibold text-sm hover:bg-brand-hover transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

/* ────────── Magazine promotional card ────────── */
const PromotionCard = ({
  notification,
  onRead,
  onOpenDetail,
  isStarred,
  onToggleStar,
  navigate,
}: any) => {
  const meta = notification.metadata || {};
  const price = meta.new_price ?? meta.price;
  const originalPrice = meta.original_price;
  const discount = meta.discount_percentage || meta.discount;
  const soldCount = meta.sold_count;
  const rating = meta.rating;
  const imageUrl = meta.image_url;

  const handleTap = () => {
    onRead(notification.id);
    const deepLink = meta.deep_link;
    if (deepLink && deepLink !== '#') {
      // Fix the deep link: /products/45 → /product/45
      const fixedLink = deepLink.replace(/^\/products\//, '/product/');
      navigate(fixedLink);
    } else {
      onOpenDetail(notification);
    }
  };

  const badgeLabel =
    notification.notification_type === 'flash_deal_started'
      ? 'FLASH DEAL'
      : notification.notification_type === 'price_drop_alert'
      ? 'PRICE DROP'
      : 'NEW ARRIVAL';

  return (
    <div
      className="card-product overflow-hidden cursor-pointer transition-shadow hover:shadow-lg relative"
      onClick={handleTap}
    >
      {/* Star button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(notification.id);
        }}
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 hover:bg-white transition"
      >
        {isStarred ? (
          <StarSolidIcon className="w-5 h-5 text-yellow-500" />
        ) : (
          <StarIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={notification.title}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand bg-brand/10 px-2 py-0.5 rounded">
            {badgeLabel}
          </span>
          {soldCount > 0 && <span className="text-[10px] text-text-muted">{soldCount} sold</span>}
          {rating && (
            <span className="flex items-center text-[10px] text-yellow-500">
              <StarIcon className="w-3 h-3 mr-0.5" /> {rating}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-text-primary line-clamp-1">{notification.title}</h3>
        {notification.body && (
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{notification.body}</p>
        )}
        {price && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-lg font-bold text-text-primary">ETB {Number(price).toLocaleString()}</span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-text-muted line-through">
                ETB {Number(originalPrice).toLocaleString()}
              </span>
            )}
          </div>
        )}
        <button className="mt-3 w-full flex items-center justify-center gap-1 bg-brand text-white text-sm font-medium py-2 rounded-md hover:bg-brand-hover transition-colors">
          <ShoppingBagIcon className="w-4 h-4" />
          Shop Now
        </button>
      </div>
    </div>
  );
};

/* ───────────────── Main Page ───────────────── */
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [starredIds, setStarredIds] = useState<Set<number>>(new Set());
  const [detailNotif, setDetailNotif] = useState<Notification | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/v1/notifications');
      const data = res.data.notifications || res.data.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    await Promise.all(unreadIds.map(id => markAsRead(id)));
  };

  const toggleStar = (id: number) => {
    setStarredIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openDetailModal = (notification: Notification) => {
    setDetailNotif(notification);
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const isPromo = (type: string) =>
    ['promotion', 'flash_deal_started', 'new_collection', 'price_drop_alert'].includes(type);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_placed':
      case 'order_accepted':
      case 'order_shipped':
      case 'order_delivered':
        return '📦';
      case 'price_drop_alert':
        return '💰';
      case 'flash_deal':
      case 'flash_deal_started':
      case 'super_deal':
      case 'hot_deal':
        return '⚡';
      case 'payout_paid':
        return '💳';
      case 'new_collection':
        return '🆕';
      case 'return_approved':
      case 'return_rejected':
        return '🔄';
      default:
        return '🔔';
    }
  };

  const getNotificationCategory = (type: string): string => {
    if (['order_placed', 'order_accepted', 'order_shipped', 'order_delivered', 'new_order',
         'order_auto_cancelled', 'order_rejected_by_seller', 'shipment_created', 'shipment_updated',
         'delivery_accepted'].includes(type)) {
      return 'order';
    }
    if (['payout_paid'].includes(type)) return 'receipt';
    if (['flash_deal', 'flash_deal_started', 'super_deal', 'hot_deal', 'price_drop_alert',
         'new_collection', 'promotion'].includes(type)) {
      return 'promotion';
    }
    return 'order';
  };

  const handleNotificationTap = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    const type = notification.notification_type;
    const meta = notification.metadata || {};

    switch (type) {
      case 'order_placed':
      case 'order_accepted':
      case 'order_shipped':
      case 'order_delivered':
      case 'order_auto_cancelled':
      case 'order_rejected_by_seller':
      case 'shipment_created':
      case 'shipment_updated':
      case 'delivery_accepted':
        if (meta.order_id) navigate(`/order-tracking/${meta.order_id}`);
        else openDetailModal(notification);
        break;

      case 'price_drop_alert':
        if (meta.product_id) navigate(`/product/${meta.product_id}`);
        else openDetailModal(notification);
        break;

      case 'flash_deal_started':
      case 'flash_deal':
      case 'super_deal':
      case 'hot_deal':
        navigate('/flash-deals');
        break;

      case 'new_collection':
        if (meta.collection_id) navigate(`/collections/${meta.collection_id}`);
        else openDetailModal(notification);
        break;

      case 'payout_paid':
        navigate('/seller/payouts');
        break;

      case 'return_approved':
      case 'return_rejected':
        if (meta.return_id) navigate(`/returns/${meta.return_id}`);
        else openDetailModal(notification);
        break;

      default:
        openDetailModal(notification);
        break;
    }
  };

  // Filtering logic
  const filteredNotifications = notifications.filter(n => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'starred') return starredIds.has(n.id);
    return getNotificationCategory(n.notification_type) === filterCategory;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const starredCount = starredIds.size;
  const totalCount = notifications.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-muted">Loading notifications…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container-marketplace py-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-text-muted hover:text-text-primary transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <h1 className="text-product-title font-semibold text-text-primary">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-brand text-white rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-hover transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Category filter chips */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          {[
            { label: 'All', value: 'all' },
            { label: 'Orders', value: 'order' },
            { label: 'Deals', value: 'promotion' },
            { label: 'Receipts', value: 'receipt' },
            { label: 'Starred', value: 'starred' },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilterCategory(value)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filterCategory === value
                  ? 'bg-brand text-white'
                  : 'bg-white text-text-secondary border border-border-light hover:bg-surface-hover'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Counts row */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>New: {unreadCount}</span>
            <span>Starred: {starredCount}</span>
          </div>
          <span className="text-xs text-text-muted">Total: {totalCount}</span>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-surface-hover rounded-full flex items-center justify-center">
              <BellIcon className="w-8 h-8 text-text-muted" />
            </div>
            <p className="mt-4 text-text-secondary font-medium">No notifications yet</p>
            <p className="mt-1 text-xs text-text-muted">We'll notify you when something important happens</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map(notification => {
              if (isPromo(notification.notification_type)) {
                return (
                  <PromotionCard
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onOpenDetail={openDetailModal}
                    isStarred={starredIds.has(notification.id)}
                    onToggleStar={toggleStar}
                    navigate={navigate}
                  />
                );
              }

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationTap(notification)}
                  className={`card-product p-4 cursor-pointer transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)] relative ${
                    !notification.read ? 'border-brand/30' : 'opacity-75'
                  }`}
                >
                  {/* Date – top‑right */}
                  <span className="absolute top-2 right-2 text-xs text-text-muted whitespace-nowrap">
                    {getTimeAgo(notification.created_at)}
                  </span>

                  {/* Star – vertically centred right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(notification.id);
                    }}
                    className="absolute top-1/2 right-2 -translate-y-1/2 z-10 p-1 rounded-full hover:bg-surface-hover transition"
                  >
                    {starredIds.has(notification.id) ? (
                      <StarSolidIcon className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <StarIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  <div className="flex gap-3 pr-10">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-lg">
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-semibold truncate ${
                          !notification.read ? 'text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{notification.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {!notification.read && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                            Unread
                          </span>
                        )}
                        <span className="text-[11px] text-text-muted hover:text-brand transition-colors">
                          Tap to view details →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailNotif && (
        <NotificationDetailModal
          notification={detailNotif}
          onClose={() => setDetailNotif(null)}
        />
      )}
    </div>
  );
};

export default NotificationsPage;