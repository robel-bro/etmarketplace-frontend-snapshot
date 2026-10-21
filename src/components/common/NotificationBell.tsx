import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import api from '../../lib/axios';

const NotificationBell = () => {
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/notifications/unread_count');
      // The backend returns { unread_count: number }
      console.log('🔔 Unread response:', res.data);
      setUnread(res.data.unread_count ?? res.data.count ?? 0);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return (
    <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-gray-900 transition">
      <BellIcon className="w-6 h-6" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;