import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useDrivers } from '../hooks/useDrivers';
import { PlanGate } from '../components/shared/PlanGate';
import { useVehicles } from '../hooks/useVehicles';
import { TrendingUp, Star, Car, Users, Award } from 'lucide-react';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';

const COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const CustomTooltip: React.FC<{ active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card border border-white/15 p-3 text-xs shadow-glass">
        <p className="text-white/60 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export const AnalyticsPage: React.FC = () => {
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();

  const ratingDistribution = useMemo(() => {
    const dist: Record<string, number> = { '0-1': 0, '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 };
    drivers.forEach(d => {
      const r = d.overallRating || 0;
      if (r < 1) dist['0-1']++;
      else if (r < 2) dist['1-2']++;
      else if (r < 3) dist['2-3']++;
      else if (r < 4) dist['3-4']++;
      else dist['4-5']++;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [drivers]);

  const licenseTypes = useMemo(() => {
    const types: Record<string, number> = {};
    drivers.forEach(d => { types[d.licenseType] = (types[d.licenseType] || 0) + 1; });
    return Object.entries(types).map(([name, value]) => ({ name: `${name} Sınıfı`, value }));
  }, [drivers]);

  const vehicleBrands = useMemo(() => {
    const brands: Record<string, number> = {};
    vehicles.forEach(v => { brands[v.brand] = (brands[v.brand] || 0) + 1; });
    return Object.entries(brands).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  const fuelTypes = useMemo(() => {
    const types: Record<string, number> = {};
    vehicles.forEach(v => { types[v.fuelType] = (types[v.fuelType] || 0) + 1; });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  const statusDist = useMemo(() => {
    const dist: Record<string, number> = { active: 0, suspended: 0, expired: 0 };
    drivers.forEach(d => { dist[d.status] = (dist[d.status] || 0) + 1; });
    return [
      { name: 'Aktif', value: dist.active },
      { name: 'Askıda', value: dist.suspended },
      { name: 'Süresi Doldu', value: dist.expired },
    ];
  }, [drivers]);

  const topPerformingVehicles = useMemo(() =>
    [...vehicles].sort((a, b) => (b.overallPerformance || 0) - (a.overallPerformance || 0)).slice(0, 8)
      .map(v => ({ name: `${v.brand} ${v.model}`, value: Number((v.overallPerformance || 0).toFixed(1)) })),
    [vehicles]
  );

  const avgRating = drivers.length > 0
    ? drivers.reduce((s, d) => s + (d.overallRating || 0), 0) / drivers.length : 0;
  const avgPerf = vehicles.length > 0
    ? vehicles.reduce((s, v) => s + (v.overallPerformance || 0), 0) / vehicles.length : 0;
  const activeDrivers = drivers.filter(d => d.status === 'active').length;

  // Simulated monthly trend
  const monthlyTrend = useMemo(() => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'];
    return months.map((m, i) => ({
      name: m,
      'Sürücüler': Math.max(1, Math.floor(drivers.length * (0.6 + i * 0.08))),
      'Araçlar': Math.max(1, Math.floor(vehicles.length * (0.5 + i * 0.1))),
      'Ort. Puan': Number((3.2 + i * 0.1).toFixed(1)),
    }));
  }, [drivers.length, vehicles.length]);

  return (
    <PlanGate requiredPlan="basic" featureName="Analitik">
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Toplam Sürücü', value: drivers.length, color: 'text-primary-400', bg: 'bg-primary-600/20' },
          { icon: Car, label: 'Toplam Araç', value: vehicles.length, color: 'text-secondary-500', bg: 'bg-secondary-500/20' },
          { icon: Award, label: 'Aktif Sürücü', value: activeDrivers, color: 'text-success', bg: 'bg-success/20' },
          { icon: TrendingUp, label: 'Ort. Puan', value: avgRating, decimals: 2, color: 'text-warning', bg: 'bg-warning/20' },
        ].map(({ icon: Icon, label, value, color, bg, decimals }) => (
          <motion.div key={label} variants={item} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                <AnimatedCounter value={value} decimals={decimals} />
              </p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Monthly Growth */}
      <motion.div variants={item} className="glass-card p-6">
        <h3 className="section-title">Aylık Büyüme Trendi</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyTrend}>
            <defs>
              <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
            <Area type="monotone" dataKey="Sürücüler" stroke="#2563EB" fill="url(#gD)" strokeWidth={2} />
            <Area type="monotone" dataKey="Araçlar" stroke="#06B6D4" fill="url(#gV)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="section-title">Sürücü Puan Dağılımı</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Sürücü Sayısı" radius={[6, 6, 0, 0]}>
                {ratingDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="glass-card p-6">
          <h3 className="section-title">Lisans Durum Dağılımı</h3>
          {drivers.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusDist.map((_, i) => (
                    <Cell key={i} fill={[COLORS[2], COLORS[4], COLORS[3]][i]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Veri yok</div>}
        </motion.div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="section-title">Yakıt Türü Dağılımı</h3>
          {vehicles.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={fuelTypes} cx="50%" cy="50%" outerRadius={85} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {fuelTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Veri yok</div>}
        </motion.div>

        <motion.div variants={item} className="glass-card p-6">
          <h3 className="section-title">En İyi Performanslı Araçlar</h3>
          {topPerformingVehicles.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topPerformingVehicles} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Puan" fill="#2563EB" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Veri yok</div>}
        </motion.div>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="section-title">Araç Markaları Dağılımı</h3>
          {vehicleBrands.length > 0 ? (
            <div className="space-y-3">
              {vehicleBrands.map((brand, i) => (
                <div key={brand.name} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-20 truncate">{brand.name}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(brand.value / vehicleBrands[0].value) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white w-6 text-right">{brand.value}</span>
                </div>
              ))}
            </div>
          ) : <div className="py-12 text-center text-white/20 text-sm">Veri yok</div>}
        </motion.div>

        <motion.div variants={item} className="glass-card p-6">
          <h3 className="section-title">Lisans Türleri</h3>
          {licenseTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={licenseTypes} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                  {licenseTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Veri yok</div>}
        </motion.div>
      </div>

      {/* Summary cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-black text-gradient mb-1">
            <AnimatedCounter value={avgRating} decimals={2} />
          </p>
          <p className="text-xs text-white/40">Ortalama Sürücü Puanı</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={12} className={s <= Math.round(avgRating) ? 'text-warning fill-warning' : 'text-white/15'} />
            ))}
          </div>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-black text-gradient mb-1">
            <AnimatedCounter value={avgPerf} decimals={2} />
          </p>
          <p className="text-xs text-white/40">Ortalama Araç Performansı</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={12} className={s <= Math.round(avgPerf) ? 'text-warning fill-warning' : 'text-white/15'} />
            ))}
          </div>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-black text-gradient mb-1">
            <AnimatedCounter value={drivers.length > 0 ? (activeDrivers / drivers.length) * 100 : 0} decimals={1} suffix="%" />
          </p>
          <p className="text-xs text-white/40">Aktif Sürücü Oranı</p>
          <div className="w-full h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${drivers.length > 0 ? (activeDrivers / drivers.length) * 100 : 0}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-success rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
    </PlanGate>
  );
};
