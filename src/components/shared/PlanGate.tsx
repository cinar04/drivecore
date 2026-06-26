import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../hooks/usePlan';
import type { PlanId } from '../../types';

interface PlanGateProps {
  /** Bu bileşenin görünmesi için gereken minimum plan */
  requiredPlan: PlanId;
  /** Engelleme yerine sadece tooltip/badge göster */
  soft?: boolean;
  children: React.ReactNode;
  /** Özellik adı (mesajda gösterilir) */
  featureName?: string;
}

const planOrder: PlanId[] = ['free', 'basic', 'pro', 'ultimate'];

export const PlanGate: React.FC<PlanGateProps> = ({
  requiredPlan,
  soft = false,
  children,
  featureName,
}) => {
  const { planId } = usePlan();
  const navigate = useNavigate();

  const currentIdx = planOrder.indexOf(planId);
  const requiredIdx = planOrder.indexOf(requiredPlan);
  const hasAccess = currentIdx >= requiredIdx;

  if (hasAccess) return <>{children}</>;

  if (soft) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-40 select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-bg-surface/90 border border-white/15 rounded-xl px-3 py-1.5 backdrop-blur-sm">
            <Lock size={11} className="text-warning" />
            <span className="text-[11px] text-white/70 font-medium capitalize">{requiredPlan} gerekli</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card border border-warning/25 bg-warning/5 p-8 flex flex-col items-center gap-4 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-warning/15 border border-warning/30 flex items-center justify-center">
        <Lock size={22} className="text-warning" />
      </div>
      <div>
        <p className="text-base font-semibold text-white">
          {featureName ? `${featureName} Kilitli` : 'Bu Özellik Kilitli'}
        </p>
        <p className="text-sm text-white/50 mt-1">
          Bu özelliği kullanmak için{' '}
          <span className="text-warning font-semibold capitalize">{requiredPlan}</span>{' '}
          veya üzeri bir plan gereklidir.
        </p>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-2 px-5 py-2.5 bg-warning/15 hover:bg-warning/25 text-warning border border-warning/30 rounded-xl text-sm font-medium transition-all"
      >
        Planları Görüntüle <ArrowRight size={14} />
      </button>
    </motion.div>
  );
};
