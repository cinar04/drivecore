import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../hooks/usePlan';

interface PlanLimitBannerProps {
  type: 'drivers' | 'vehicles' | 'members';
}

const labels = {
  drivers: 'sürücü',
  vehicles: 'araç',
  members: 'üye',
};

export const PlanLimitBanner: React.FC<PlanLimitBannerProps> = ({ type }) => {
  const { usage, plan } = usePlan();
  const navigate = useNavigate();
  const stat = usage[type];

  if (!stat.reached && stat.percent < 80) return null;

  const isFull = stat.reached;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
      isFull
        ? 'bg-danger/10 border-danger/30 text-danger'
        : 'bg-warning/10 border-warning/30 text-warning'
    }`}>
      <AlertTriangle size={15} className="flex-shrink-0" />
      <span className="flex-1">
        {isFull
          ? `${plan.name} planında maksimum ${labels[type]} limitine ulaştınız (${stat.current}/${stat.label}).`
          : `${plan.name} planında ${labels[type]} limitine yaklaşıyorsunuz (${stat.current}/${stat.label}).`
        }
      </span>
      <button
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-1 text-xs font-semibold hover:underline flex-shrink-0"
      >
        Planı Yükselt <ArrowRight size={12} />
      </button>
    </div>
  );
};
