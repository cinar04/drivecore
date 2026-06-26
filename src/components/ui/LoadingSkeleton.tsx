import React from 'react';
import { cn } from '../../utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn('skeleton', className)} />
);

export const CardSkeleton: React.FC = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-2 w-full rounded-full" />
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr className="border-b border-white/5">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full max-w-24" />
      </td>
    ))}
  </tr>
);

export const DriverCardSkeleton: React.FC = () => (
  <div className="glass-card p-5 space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton className="w-14 h-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-12 rounded-xl" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-8 flex-1 rounded-xl" />
      <Skeleton className="h-8 w-8 rounded-xl" />
    </div>
  </div>
);

export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-bg">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <div className="text-white/50 text-sm font-medium">Yükleniyor...</div>
    </div>
  </div>
);

export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = ''
}) => (
  <div
    className={cn('border-2 border-white/20 border-t-white rounded-full animate-spin', className)}
    style={{ width: size, height: size }}
  />
);
