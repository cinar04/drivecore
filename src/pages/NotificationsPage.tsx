import React from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Users, Car, AlertTriangle, Edit } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { EmptyState } from '../components/ui/EmptyState';
import { timeAgo } from '../utils';

const notifConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  driver_created: { icon: Users, color: 'text-primary-400', bg: 'bg-primary-600/20' },
  vehicle_assigned: { icon: Car, color: 'text-secondary-500', bg: 'bg-secondary-500/20' },
  license_expiring: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/20' },
  driver_updated: { icon: Edit, color: 'text-success', bg: 'bg-success/20' },
  vehicle_updated: { icon: Edit, color: 'text-primary-400', bg: 'bg-primary-600/20' },
};

export const NotificationsPage: React.FC = () => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bildirimler</h1>
          <p className="text-sm text-white/40 mt-1">
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary text-sm">
            <CheckCheck size={15} />
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      <div className="glass-card overflow-hidden divide-y divide-white/5">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-3 w-64" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="Bildirim yok" description="Henüz herhangi bir bildirim oluşmadı" />
        ) : (
          notifications.map((notif, idx) => {
            const config = notifConfig[notif.type] || { icon: Bell, color: 'text-white/50', bg: 'bg-white/10' };
            const Icon = config.icon;
            return (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`w-full text-left p-4 flex items-start gap-4 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-primary-600/5' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm font-semibold ${notif.read ? 'text-white/60' : 'text-white'}`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-white/30">{timeAgo(notif.createdAt)}</span>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{notif.message}</p>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
};
