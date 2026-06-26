import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Car, Star, Zap, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Package } from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import type { Driver, Vehicle, ActivityLog, Organization } from '../../types';
import { usePlan } from '../../hooks/usePlan';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { isLicenseExpiringSoon, isLicenseExpired, timeAgo } from '../../utils';

const COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const CustomTooltip: React.FC<{ active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card border border-white/15 p-3 shadow-glass text-xs">
        <p className="text-white/60 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Kurum Bandı ─────────────────────────────────────────── */
export const OrgBannerWidget: React.FC<{ org: Organization | null }> = ({ org }) => {
  if (!org) return null;
  return (
    <motion.div variants={itemVariants} className="flex items-center gap-3 p-4 glass-card border border-primary-500/20 bg-primary-600/5">
      <div className="w-9 h-9 rounded-xl bg-primary-600/30 border border-primary-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
        {org.logo ? (
          <img src={org.logo} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-primary-400">{org.name[0]}</span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{org.name}</p>
        <p className="text-xs text-white/40">Kurum Gösterge Paneli</p>
      </div>
    </motion.div>
  );
};

/* ─── Plan Kullanımı ──────────────────────────────────────── */
export const PlanUsageWidget: React.FC = () => {
  const { plan, usage } = usePlan();
  return (
    <motion.div variants={itemVariants} className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-600/20 border border-primary-500/25 flex items-center justify-center">
            <Package size={14} className="text-primary-400" />
          </div>
          <span className="text-sm font-semibold text-white">{plan.name} Plan</span>
        </div>
        <Link to="/pricing" className="text-xs text-primary-400 hover:text-primary-300">Planlar →</Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Sürücüler', stat: usage.drivers },
          { label: 'Araçlar',   stat: usage.vehicles },
          { label: 'Üyeler',    stat: usage.members },
        ].map(({ label, stat }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/50">{label}</span>
              <span className={`font-semibold ${stat.reached ? 'text-danger' : 'text-white/70'}`}>
                {stat.current} / {stat.label}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  stat.reached ? 'bg-danger' : stat.percent >= 80 ? 'bg-warning' : 'bg-primary-500'
                }`}
                style={{ width: `${stat.max === -1 ? 0 : stat.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* ─── Tekil İstatistik Kartı ──────────────────────────────── */
interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: string;
  bg: string;
  trend: number;
  decimals?: number;
  compact?: boolean;
}
export const StatCardWidget: React.FC<StatCardProps> = ({ icon: Icon, label, value, color, bg, trend, decimals = 0, compact }) => (
  <motion.div variants={itemVariants} className={compact ? 'stat-card p-4' : 'stat-card'}>
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
      <Icon size={18} className={color} />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">
        <AnimatedCounter value={value} decimals={decimals} />
      </p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
    <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
      {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(trend)}% bu ay
    </div>
  </motion.div>
);

export const STAT_PRESETS: Record<string, Omit<StatCardProps, 'value' | 'compact'>> = {
  statTotalDrivers: { icon: Users, label: 'Toplam Sürücü', color: 'text-primary-400', bg: 'bg-primary-600/20', trend: 12, decimals: 0 },
  statTotalVehicles: { icon: Car, label: 'Toplam Araç', color: 'text-secondary-500', bg: 'bg-secondary-500/20', trend: 8, decimals: 0 },
  statAvgRating: { icon: Star, label: 'Ort. Puan', color: 'text-warning', bg: 'bg-warning/20', trend: 3, decimals: 1 },
  statAvgPerformance: { icon: Zap, label: 'Ort. Performans', color: 'text-success', bg: 'bg-success/20', trend: 5, decimals: 1 },
  statActiveLicenses: { icon: ShieldCheck, label: 'Aktif Lisans', color: 'text-success', bg: 'bg-success/20', trend: 4, decimals: 0 },
  statExpiringLicenses: { icon: AlertTriangle, label: 'Sona Erecek', color: 'text-warning', bg: 'bg-warning/20', trend: -2, decimals: 0 },
};

/* ─── Büyüme Trendi Grafiği ───────────────────────────────── */
export const GrowthChartWidget: React.FC<{ drivers: Driver[]; vehicles: Vehicle[] }> = ({ drivers, vehicles }) => {
  const data = useMemo(() => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'];
    return months.map((m, i) => ({
      name: m,
      Sürücüler: Math.max(0, drivers.length - (5 - i) * 2),
      Araçlar: Math.max(0, vehicles.length - (5 - i) * 1),
    }));
  }, [drivers.length, vehicles.length]);

  return (
    <motion.div variants={itemVariants} className="glass-card p-6 h-full">
      <h3 className="section-title">Büyüme Trendi</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradD" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
          <Area type="monotone" dataKey="Sürücüler" stroke="#2563EB" fill="url(#gradD)" strokeWidth={2} />
          <Area type="monotone" dataKey="Araçlar" stroke="#06B6D4" fill="url(#gradV)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

/* ─── Lisans Türleri Pasta Grafiği ────────────────────────── */
export const LicenseTypeChartWidget: React.FC<{ drivers: Driver[] }> = ({ drivers }) => {
  const data = useMemo(() => {
    const types: Record<string, number> = {};
    drivers.forEach(d => { types[d.licenseType] = (types[d.licenseType] || 0) + 1; });
    return Object.entries(types).map(([name, value]) => ({ name: `${name} Sınıfı`, value }));
  }, [drivers]);

  return (
    <motion.div variants={itemVariants} className="glass-card p-6 h-full">
      <h3 className="section-title">Lisans Türleri</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-white/20 text-sm">Veri yok</div>
      )}
    </motion.div>
  );
};

/* ─── En İyi Sürücüler ─────────────────────────────────────── */
export const TopDriversWidget: React.FC<{ drivers: Driver[] }> = ({ drivers }) => {
  const topDrivers = useMemo(() =>
    [...drivers].sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0)).slice(0, 5),
    [drivers]
  );
  return (
    <motion.div variants={itemVariants} className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title mb-0">En İyi Sürücüler</h3>
        <Link to="/drivers" className="text-xs text-primary-400 hover:text-primary-300">Tümünü gör</Link>
      </div>
      <div className="space-y-1">
        {topDrivers.length === 0 ? (
          <div className="text-center text-white/20 text-sm py-8">Henüz sürücü yok</div>
        ) : (
          topDrivers.map((driver, i) => (
            <Link key={driver.uid} to={`/drivers/${driver.uid}`}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <span className="text-lg font-bold text-white/20 w-5">#{i + 1}</span>
                <div className="w-9 h-9 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center overflow-hidden">
                  {driver.profilePhoto ? (
                    <img src={driver.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-primary-400">{driver.fullName[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{driver.fullName}</p>
                  <p className="text-xs text-white/40">{driver.licenseType} Sınıfı</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-warning fill-warning" />
                  <span className="text-sm font-semibold text-white">{(driver.overallRating || 0).toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </motion.div>
  );
};

/* ─── Son Aktiviteler ──────────────────────────────────────── */
export const RecentActivityWidget: React.FC<{ logs: ActivityLog[]; loading: boolean }> = ({ logs, loading }) => (
  <motion.div variants={itemVariants} className="glass-card p-6 h-full">
    <div className="flex items-center justify-between mb-4">
      <h3 className="section-title mb-0">Son Aktiviteler</h3>
      <Link to="/activity" className="text-xs text-primary-400 hover:text-primary-300">Tümünü gör</Link>
    </div>
    <div className="space-y-1">
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 skeleton rounded-xl" />
        ))
      ) : logs.length === 0 ? (
        <div className="text-center text-white/20 text-sm py-8">Aktivite yok</div>
      ) : (
        logs.map(log => (
          <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              log.entityType === 'driver' ? 'bg-primary-500' :
              log.entityType === 'vehicle' ? 'bg-secondary-500' : 'bg-success'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white">{log.action}</p>
              <p className="text-xs text-white/40 truncate">{log.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-white/30">{timeAgo(log.timestamp)}</p>
              <p className="text-[10px] text-white/20">{log.performedBy}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </motion.div>
);

/* ─── İstatistik için ortak değer çözücü ──────────────────── */
export function useStatValues(drivers: Driver[], vehicles: Vehicle[]) {
  return useMemo(() => {
    const activeLicenses = drivers.filter(d => d.status === 'active').length;
    const expiring = drivers.filter(d => isLicenseExpiringSoon(d.expiryDate) && !isLicenseExpired(d.expiryDate)).length;
    const avgRating = drivers.length > 0
      ? drivers.reduce((s, d) => s + (d.overallRating || 0), 0) / drivers.length : 0;
    const avgPerf = vehicles.length > 0
      ? vehicles.reduce((s, v) => s + (v.overallPerformance || 0), 0) / vehicles.length : 0;
    return {
      statTotalDrivers: drivers.length,
      statTotalVehicles: vehicles.length,
      statAvgRating: avgRating,
      statAvgPerformance: avgPerf,
      statActiveLicenses: activeLicenses,
      statExpiringLicenses: expiring,
    };
  }, [drivers, vehicles]);
}
