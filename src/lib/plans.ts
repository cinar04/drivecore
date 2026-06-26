import type { Plan, PlanId, PlanLimits } from '../types';

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Bireysel kullanım ve deneme için',
    color: '#6B7280',
    icon: 'Leaf',
    limits: {
      maxDrivers: 3,
      maxVehicles: 3,
      maxMembers: 3,
      maxOrgs: 1,
      analytics: false,
      csvExport: false,
      pdfExport: false,
      excelExport: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 299,
    description: 'Küçük filo işletmeleri için',
    color: '#10B981',
    icon: 'Zap',
    limits: {
      maxDrivers: 25,
      maxVehicles: 25,
      maxMembers: 10,
      maxOrgs: 1,
      analytics: true,
      csvExport: true,
      pdfExport: false,
      excelExport: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 799,
    description: 'Büyüyen filo şirketleri için',
    badge: 'En Popüler',
    color: '#2563EB',
    icon: 'Rocket',
    limits: {
      maxDrivers: 100,
      maxVehicles: 100,
      maxMembers: 25,
      maxOrgs: 3,
      analytics: true,
      csvExport: true,
      pdfExport: true,
      excelExport: true,
      apiAccess: true,
      prioritySupport: false,
    },
  },
  ultimate: {
    id: 'ultimate',
    name: 'Ultimate',
    price: 1999,
    description: 'Kurumsal ölçekte tam güç',
    color: '#8B5CF6',
    icon: 'Crown',
    limits: {
      maxDrivers: -1,
      maxVehicles: -1,
      maxMembers: -1,
      maxOrgs: -1,
      analytics: true,
      csvExport: true,
      pdfExport: true,
      excelExport: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
};

export const getPlan = (planId: PlanId): Plan => PLANS[planId] ?? PLANS.free;

/** Limiti aştı mı kontrolü — -1 sınırsız demek */
export const isLimitReached = (
  current: number,
  max: number
): boolean => max !== -1 && current >= max;

/** Limit string'i formatlar */
export const formatLimit = (val: number): string =>
  val === -1 ? 'Sınırsız' : val.toString();

/** Mevcut kullanımın yüzdesi (progress bar için) */
export const limitPercent = (current: number, max: number): number => {
  if (max === -1) return 0;
  return Math.min(100, Math.round((current / max) * 100));
};

export type { PlanId, PlanLimits };
