import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
      <Icon size={28} className="text-white/20" />
    </div>
    <h3 className="text-base font-semibold text-white/60 mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-white/30 max-w-xs">{description}</p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 btn-primary text-sm"
      >
        {action.label}
      </button>
    )}
  </motion.div>
);
