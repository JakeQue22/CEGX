'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsPage() {
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  if (isLoading) return <LoadingSpinner />;

  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unread.length} unread notification{unread.length !== 1 ? 's' : ''}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="secondary" onClick={() => markAllAsRead.mutate()} loading={markAllAsRead.isPending}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`px-6 py-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition ${
                  !n.isRead ? 'bg-blue-50/40' : ''
                }`}
                onClick={() => !n.isRead && markAsRead.mutate(n.id)}
              >
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${!n.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  <Badge label={n.type.replace(/_/g, ' ')} variant="neutral" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
