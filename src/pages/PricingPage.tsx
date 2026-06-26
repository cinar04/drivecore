import React from 'react';
import { motion } from 'framer-motion';
import {
  Check, X, Leaf, Zap, Rocket, Crown,
  Users, Car, Building2, UserCheck,
  BarChart3, FileText, Table, Key, Headphones, Lock,
} from 'lucide-react';
import { PLANS, formatLimit } from '../lib/plans';
import { usePlan } from '../hooks/usePlan';
import type { PlanId } from '../types';

const planIcons: Record<PlanId, React.ElementType> = {
  free: Leaf,
  basic: Zap,
  pro: Rocket,
  ultimate: Crown,
};

const planColorClasses: Record<PlanId, { icon: string; iconBg: string; accent: string }> = {
  free:     { icon: 'text-white/50',   iconBg: 'bg-white/10',        accent: 'border-white/15' },
  basic:    { icon: 'text-success',    iconBg: 'bg-success/15',      accent: 'border-success/30' },
  pro:      { icon: 'text-primary-400',iconBg: 'bg-primary-600/20',  accent: 'border-primary-500/60' },
  ultimate: { icon: 'text-[#8B5CF6]', iconBg: 'bg-[#8B5CF6]/15',   accent: 'border-[#8B5CF6]/50' },
};

interface FeatureRowProps { icon: React.ElementType; label: string; values: Array<boolean | string | number> }

const FeatureRow: React.FC<FeatureRowProps> = ({ icon: Icon, label, values }) => (
  <tr className="border-b border-white/5 hover:bg-white/3 transition-colors">
    <td className="py-3 px-4">
      <div className="flex items-center gap-2.5 text-sm text-white/60">
        <Icon size={14} className="text-white/30 flex-shrink-0" />
        {label}
      </div>
    </td>
    {values.map((v, i) => (
      <td key={i} className="py-3 px-4 text-center">
        {typeof v === 'boolean' ? (
          v
            ? <Check size={15} className="text-success mx-auto" />
            : <X size={14} className="text-white/20 mx-auto" />
        ) : (
          <span className="text-sm font-medium text-white/80">{v}</span>
        )}
      </td>
    ))}
  </tr>
);

export const PricingPage: React.FC = () => {
  const { planId: currentPlanId } = usePlan();
  const planList = Object.values(PLANS);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="text-center space-y-3 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-600/15 border border-primary-500/25 mb-2">
          <Lock size={12} className="text-primary-400" />
          <span className="text-xs text-primary-400 font-medium">Plan yönetimi Firebase üzerinden yapılır</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Paket Planlar</h1>
        <p className="text-white/40 text-sm max-w-md mx-auto">
          Kurumunuzun ihtiyacına göre doğru planı seçin.
          Aktif planınız Firestore'daki <code className="text-primary-400 text-xs bg-primary-600/10 px-1.5 py-0.5 rounded">orgs/{'{orgId}'}.plan</code> alanından yönetilir.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {planList.map((plan, idx) => {
          const Icon = planIcons[plan.id];
          const colors = planColorClasses[plan.id];
          const isCurrent = plan.id === currentPlanId;
          const isPro = plan.id === 'pro';

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              className={`relative glass-card p-5 flex flex-col gap-4 border-2 transition-all ${
                isCurrent
                  ? colors.accent + ' bg-white/5'
                  : isPro
                  ? 'border-primary-500/40'
                  : 'border-white/8 hover:border-white/20'
              }`}
            >
              {/* En Popüler / Aktif badge */}
              {(plan.badge || isCurrent) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`text-[10px] font-semibold px-3 py-1 rounded-full border ${
                    isCurrent
                      ? 'bg-success/20 text-success border-success/30'
                      : 'bg-primary-600/20 text-primary-400 border-primary-500/30'
                  }`}>
                    {isCurrent ? '✓ Aktif Plan' : plan.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.iconBg}`}>
                <Icon size={19} className={colors.icon} />
              </div>

              {/* Name & Price */}
              <div>
                <p className="text-base font-bold text-white">{plan.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{plan.description}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-black text-white">Ücretsiz</span>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-white">
                        ₺{plan.price.toLocaleString('tr')}
                      </span>
                      <span className="text-xs text-white/35">/ ay</span>
                    </>
                  )}
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-2 py-3 border-y border-white/8">
                {[
                  { icon: Users, label: 'Sürücü',  val: formatLimit(plan.limits.maxDrivers) },
                  { icon: Car,   label: 'Araç',    val: formatLimit(plan.limits.maxVehicles) },
                  { icon: UserCheck, label: 'Üye', val: formatLimit(plan.limits.maxMembers) },
                  { icon: Building2, label: 'Kurum', val: formatLimit(plan.limits.maxOrgs) },
                ].map(({ icon: LIcon, label, val }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-white/45">
                      <LIcon size={11} />
                      {label}
                    </div>
                    <span className={`font-semibold ${val === 'Sınırsız' ? 'text-success' : 'text-white/80'}`}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="space-y-1.5 flex-1">
                {[
                  { label: 'Analitik',        val: plan.limits.analytics },
                  { label: 'CSV Export',      val: plan.limits.csvExport },
                  { label: 'PDF Export',      val: plan.limits.pdfExport },
                  { label: 'Excel Export',    val: plan.limits.excelExport },
                  { label: 'API Erişimi',     val: plan.limits.apiAccess },
                  { label: 'Öncelikli Destek', val: plan.limits.prioritySupport },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    {val
                      ? <Check size={12} className="text-success flex-shrink-0" />
                      : <X size={12} className="text-white/20 flex-shrink-0" />
                    }
                    <span className={val ? 'text-white/65' : 'text-white/25'}>{label}</span>
                  </div>
                ))}
              </div>

              {/* CTA — sadece görünüm, fonksiyon yok */}
              <div
                className={`w-full py-2.5 rounded-xl text-center text-sm font-medium transition-all cursor-default select-none ${
                  isCurrent
                    ? 'bg-success/15 text-success border border-success/30'
                    : isPro
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                    : 'bg-white/5 text-white/30 border border-white/10'
                }`}
              >
                {isCurrent ? '✓ Mevcut Planınız' : 'Planı Seç'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h2 className="text-base font-semibold text-white">Özellik Karşılaştırması</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/8">
                <th className="py-3 px-4 text-left text-xs font-semibold text-white/30 uppercase tracking-wider w-48">
                  Özellik
                </th>
                {planList.map(p => {
                  const Icon = planIcons[p.id];
                  const colors = planColorClasses[p.id];
                  return (
                    <th key={p.id} className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors.iconBg}`}>
                          <Icon size={14} className={colors.icon} />
                        </div>
                        <span className={`text-xs font-semibold ${p.id === currentPlanId ? 'text-white' : 'text-white/50'}`}>
                          {p.name}
                          {p.id === currentPlanId && <span className="ml-1 text-success">✓</span>}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <FeatureRow icon={Users}       label="Maks. Sürücü"       values={planList.map(p => formatLimit(p.limits.maxDrivers))} />
              <FeatureRow icon={Car}         label="Maks. Araç"         values={planList.map(p => formatLimit(p.limits.maxVehicles))} />
              <FeatureRow icon={UserCheck}   label="Maks. Üye"          values={planList.map(p => formatLimit(p.limits.maxMembers))} />
              <FeatureRow icon={Building2}   label="Maks. Kurum"        values={planList.map(p => formatLimit(p.limits.maxOrgs))} />
              <FeatureRow icon={BarChart3}   label="Analitik"           values={planList.map(p => p.limits.analytics)} />
              <FeatureRow icon={FileText}    label="CSV Dışa Aktarma"   values={planList.map(p => p.limits.csvExport)} />
              <FeatureRow icon={FileText}    label="PDF Dışa Aktarma"   values={planList.map(p => p.limits.pdfExport)} />
              <FeatureRow icon={Table}       label="Excel Dışa Aktarma" values={planList.map(p => p.limits.excelExport)} />
              <FeatureRow icon={Key}         label="API Erişimi"        values={planList.map(p => p.limits.apiAccess)} />
              <FeatureRow icon={Headphones}  label="Öncelikli Destek"   values={planList.map(p => p.limits.prioritySupport)} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Firebase admin notu */}
      <div className="glass-card p-5 border border-warning/20 bg-warning/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0">
            <Lock size={15} className="text-warning" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">Plan Nasıl Değiştirilir?</p>
            <p className="text-xs text-white/50 leading-relaxed">
              Plan değişikliği Firebase Console üzerinden manuel olarak yapılır.
              <br />
              <span className="font-mono text-warning/80 text-[11px]">Firestore → orgs → &#123;orgId&#125; → plan</span> alanını
              <span className="font-mono text-primary-400 text-[11px] mx-1">"free"</span>
              <span className="font-mono text-success text-[11px]">"basic"</span>
              <span className="font-mono text-primary-400 text-[11px] mx-1">"pro"</span>
              <span className="font-mono text-[#8B5CF6] text-[11px]">"ultimate"</span>
              değerlerinden biriyle güncelleyin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
