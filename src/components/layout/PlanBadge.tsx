import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Zap, Rocket, Crown } from 'lucide-react';
import { usePlan } from '../../hooks/usePlan';
import type { PlanId } from '../../types';

const config: Record<PlanId, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  free:     { icon: Leaf,   color: 'text-white/40',    bg: 'bg-white/5',        border: 'border-white/10' },
  basic:    { icon: Zap,    color: 'text-success',     bg: 'bg-success/10',     border: 'border-success/25' },
  pro:      { icon: Rocket, color: 'text-primary-400', bg: 'bg-primary-600/15', border: 'border-primary-500/30' },
  ultimate: { icon: Crown,  color: 'text-[#8B5CF6]',  bg: 'bg-[#8B5CF6]/15',  border: 'border-[#8B5CF6]/30' },
};

interface PlanBadgeProps {
  collapsed?: boolean;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ collapsed = false }) => {
  const { plan, planId, usage } = usePlan();
  const navigate = useNavigate();
  const cfg = config[planId];
  const Icon = cfg.icon;

  const anyLimitClose = Object.values(usage).some(u => u.percent >= 80);
  const anyLimitFull  = Object.values(usage).some(u => u.reached);

  return (
    <button
      onClick={() => navigate('/pricing')}
      title={`${plan.name} Plan — Planları görüntüle`}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:opacity-80 ${cfg.bg} ${cfg.border} ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon size={14} className={cfg.color} />
      {!collapsed && (
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-xs font-semibold ${cfg.color}`}>{plan.name} Plan</p>
        </div>
      )}
      {!collapsed && (anyLimitFull || anyLimitClose) && (
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${anyLimitFull ? 'bg-danger' : 'bg-warning'}`} />
      )}
    </button>
  );
};
