import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Car, BarChart3, Bell,
  Settings, ActivitySquare, ChevronLeft, ChevronRight,
  LogOut, Zap, UserCheck, Package,
} from 'lucide-react';
import { cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { useNotifications } from '../../hooks/useNotifications';
import { OrgSwitcher } from './OrgSwitcher';
import { PlanBadge } from './PlanBadge';

const navItems = [
  { path: '/dashboard',    icon: LayoutDashboard, label: 'Gösterge Paneli' },
  { path: '/drivers',      icon: Users,            label: 'Sürücüler' },
  { path: '/vehicles',     icon: Car,              label: 'Araçlar' },
  { path: '/analytics',   icon: BarChart3,        label: 'Analitik' },
  { path: '/activity',    icon: ActivitySquare,   label: 'Aktivite' },
  { path: '/org/members', icon: UserCheck,        label: 'Üyeler' },
  { path: '/notifications',icon: Bell,            label: 'Bildirimler' },
  { path: '/pricing',     icon: Package,          label: 'Planlar' },
  { path: '/settings',    icon: Settings,         label: 'Ayarlar' },
];

interface SidebarProps { collapsed: boolean; onToggle: () => void; }

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { currentOrg } = useOrg();
  const { unreadCount } = useNotifications();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-bg-surface border-r border-white/8 z-40 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8 min-h-[72px]">
        <div
          className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0"
          style={{ boxShadow: '0 0 20px rgba(37,99,235,0.35)' }}
        >
          <Zap size={17} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-base font-bold bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent leading-none">
                DriveCore
              </p>
              <p className="text-[10px] text-white/25 mt-0.5">Premium Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Org Switcher */}
      {!collapsed && currentOrg && (
        <div className="px-3 pt-3">
          <OrgSwitcher />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
        {navItems.map(item => {
          const active = isActive(item.path);
          const showBadge = item.path === '/notifications' && unreadCount > 0;
          return (
            <Link key={item.path} to={item.path}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer',
                active
                  ? 'bg-primary-600/20 border border-primary-500/25 text-white'
                  : 'text-white/45 hover:text-white hover:bg-white/7',
                collapsed && 'justify-center'
              )}>
                <div className="relative flex-shrink-0">
                  <item.icon size={17} className={active ? 'text-primary-400' : ''} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-danger text-white text-[8px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Plan Badge */}
      <div className="px-3 pb-2">
        <PlanBadge collapsed={collapsed} />
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-white/8">
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/35 hover:text-danger hover:bg-danger/10 transition-all',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={16} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                Çıkış Yap
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-bg-surface border border-white/15 flex items-center justify-center text-white/35 hover:text-white transition-colors z-50"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </motion.aside>
  );
};
