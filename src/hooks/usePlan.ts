import { useMemo } from 'react';
import { useOrg } from '../context/OrgContext';
import { useDrivers } from './useDrivers';
import { useVehicles } from './useVehicles';
import { getPlan, isLimitReached, limitPercent, formatLimit } from '../lib/plans';
import type { PlanId } from '../types';

export interface PlanUsage {
  drivers: { current: number; max: number; percent: number; reached: boolean; label: string };
  vehicles: { current: number; max: number; percent: number; reached: boolean; label: string };
  members: { current: number; max: number; percent: number; reached: boolean; label: string };
}

export const usePlan = () => {
  const { currentOrg, members } = useOrg();
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();

  const planId = (currentOrg?.plan ?? 'free') as PlanId;
  const plan = getPlan(planId);
  const limits = plan.limits;

  const usage: PlanUsage = useMemo(() => ({
    drivers: {
      current: drivers.length,
      max: limits.maxDrivers,
      percent: limitPercent(drivers.length, limits.maxDrivers),
      reached: isLimitReached(drivers.length, limits.maxDrivers),
      label: formatLimit(limits.maxDrivers),
    },
    vehicles: {
      current: vehicles.length,
      max: limits.maxVehicles,
      percent: limitPercent(vehicles.length, limits.maxVehicles),
      reached: isLimitReached(vehicles.length, limits.maxVehicles),
      label: formatLimit(limits.maxVehicles),
    },
    members: {
      current: members.length,
      max: limits.maxMembers,
      percent: limitPercent(members.length, limits.maxMembers),
      reached: isLimitReached(members.length, limits.maxMembers),
      label: formatLimit(limits.maxMembers),
    },
  }), [drivers.length, vehicles.length, members.length, limits]);

  /** Belirli bir özelliğe erişim var mı? */
  const canUse = (feature: keyof typeof limits): boolean => {
    const val = limits[feature];
    if (typeof val === 'boolean') return val;
    return true;
  };

  return { plan, planId, limits, usage, canUse };
};
