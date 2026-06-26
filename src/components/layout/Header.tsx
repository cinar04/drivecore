import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Gösterge Paneli',
  '/drivers': 'Sürücü Yönetimi',
  '/vehicles': 'Araç Yönetimi',
  '/analytics': 'Analitik',
  '/activity': 'Aktivite Günlüğü',
  '/notifications': 'Bildirimler',
  '/settings': 'Ayarlar',
};

interface HeaderProps {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, darkMode, onToggleDarkMode }) => {
  const location = useLocation();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { adminData } = useAuth();

  const title = Object.entries(pageTitles).find(([key]) =>
    location.pathname.startsWith(key)
  )?.[1] || 'DriveCore';

  const notifTypeIcons: Record<string, string> = {
    driver_created: '👤',
    vehicle_assigned: '🚗',
    license_expiring: '⚠️',
    driver_updated: '✏️',
    vehicle_updated: '🔧',
  };

  return (
    <header
      className="fixed top-0 right-0 h-[73px] bg-bg-surface/80 backdrop-blur-md border-b border-white/8 z-30 flex items-center px-6 gap-4 transition-all duration-300"
      style={{ left: sidebarCollapsed ? 80 : 260 }}
    >
      <div className="flex-1">
        <h1 className="text-base font-semibold text-white">{title}</h1>
        <p className="text-xs text-white/30">
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={onToggleDarkMode}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifPanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-80 glass-card border border-white/15 shadow-glass z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/8">
                    <span className="text-sm font-semibold text-white">Bildirimler</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        Tümünü oku
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                    {notifications.slice(0, 8).length === 0 ? (
                      <div className="py-8 text-center text-white/30 text-sm">
                        Bildirim yok
                      </div>
                    ) : (
                      notifications.slice(0, 8).map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`w-full text-left p-4 hover:bg-white/5 transition-colors flex gap-3 ${!notif.read ? 'bg-primary-600/5' : ''}`}
                        >
                          <span className="text-lg flex-shrink-0">{notifTypeIcons[notif.type] || '🔔'}</span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold ${notif.read ? 'text-white/50' : 'text-white'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{notif.message}</p>
                            <p className="text-[10px] text-white/20 mt-1">{timeAgo(notif.createdAt)}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-white/8">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifPanel(false)}
                      className="block text-center text-xs text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Tümünü gör
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center overflow-hidden">
          {adminData?.profilePhoto ? (
            <img src={adminData.profilePhoto} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-primary-400">
              {(adminData?.fullName || adminData?.email || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
