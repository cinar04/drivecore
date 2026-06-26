import {
  Users, Car, Star, Zap, ShieldCheck, AlertTriangle,
  Package, TrendingUp, PieChart, Trophy, Activity, Building2,
} from 'lucide-react';
import type { WidgetId, WidgetConfig, DashboardPrefs } from '../types';

export interface WidgetMeta {
  id: WidgetId;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultSize: 'small' | 'medium' | 'large';
  /** Hangi boyutlara izin verilir */
  allowedSizes: ('small' | 'medium' | 'large')[];
  /** stat kartları gibi küçük widget'lar grid'de yan yana dizilebilir */
  category: 'banner' | 'stat' | 'chart' | 'list';
}

export const WIDGET_REGISTRY: Record<WidgetId, WidgetMeta> = {
  orgBanner: {
    id: 'orgBanner', label: 'Kurum Bandı', description: 'Aktif kurumun logosu ve adı',
    icon: Building2, defaultSize: 'large', allowedSizes: ['large'], category: 'banner',
  },
  planUsage: {
    id: 'planUsage', label: 'Plan Kullanımı', description: 'Sürücü/araç/üye kullanım çubukları',
    icon: Package, defaultSize: 'large', allowedSizes: ['large'], category: 'banner',
  },
  statTotalDrivers: {
    id: 'statTotalDrivers', label: 'Toplam Sürücü', description: 'Sürücü sayısı kartı',
    icon: Users, defaultSize: 'small', allowedSizes: ['small', 'medium'], category: 'stat',
  },
  statTotalVehicles: {
    id: 'statTotalVehicles', label: 'Toplam Araç', description: 'Araç sayısı kartı',
    icon: Car, defaultSize: 'small', allowedSizes: ['small', 'medium'], category: 'stat',
  },
  statAvgRating: {
    id: 'statAvgRating', label: 'Ortalama Puan', description: 'Sürücülerin ortalama puanı',
    icon: Star, defaultSize: 'small', allowedSizes: ['small', 'medium'], category: 'stat',
  },
  statAvgPerformance: {
    id: 'statAvgPerformance', label: 'Ortalama Performans', description: 'Araçların ortalama performansı',
    icon: Zap, defaultSize: 'small', allowedSizes: ['small', 'medium'], category: 'stat',
  },
  statActiveLicenses: {
    id: 'statActiveLicenses', label: 'Aktif Lisans', description: 'Aktif ehliyet sayısı',
    icon: ShieldCheck, defaultSize: 'small', allowedSizes: ['small', 'medium'], category: 'stat',
  },
  statExpiringLicenses: {
    id: 'statExpiringLicenses', label: 'Sona Erecek Lisans', description: 'Yakında sona erecek ehliyetler',
    icon: AlertTriangle, defaultSize: 'small', allowedSizes: ['small', 'medium'], category: 'stat',
  },
  growthChart: {
    id: 'growthChart', label: 'Büyüme Trendi', description: 'Sürücü/araç büyüme grafiği',
    icon: TrendingUp, defaultSize: 'medium', allowedSizes: ['medium', 'large'], category: 'chart',
  },
  licenseTypeChart: {
    id: 'licenseTypeChart', label: 'Lisans Türleri', description: 'Lisans dağılım pasta grafiği',
    icon: PieChart, defaultSize: 'medium', allowedSizes: ['medium', 'large'], category: 'chart',
  },
  topDrivers: {
    id: 'topDrivers', label: 'En İyi Sürücüler', description: 'En yüksek puanlı 5 sürücü',
    icon: Trophy, defaultSize: 'medium', allowedSizes: ['medium', 'large'], category: 'list',
  },
  recentActivity: {
    id: 'recentActivity', label: 'Son Aktiviteler', description: 'Son aktivite kayıtları',
    icon: Activity, defaultSize: 'medium', allowedSizes: ['medium', 'large'], category: 'list',
  },
};

export const WIDGET_ORDER: WidgetId[] = [
  'orgBanner', 'planUsage',
  'statTotalDrivers', 'statTotalVehicles', 'statAvgRating',
  'statAvgPerformance', 'statActiveLicenses', 'statExpiringLicenses',
  'growthChart', 'licenseTypeChart', 'topDrivers', 'recentActivity',
];

export function getDefaultDashboardPrefs(): DashboardPrefs {
  return {
    widgets: WIDGET_ORDER.map(id => ({
      id,
      visible: true,
      size: WIDGET_REGISTRY[id].defaultSize,
    })),
  };
}

/** Eksik/yeni eklenmiş widget'ları mevcut prefs'e tamamlar (geriye dönük uyumluluk) */
export function reconcileDashboardPrefs(prefs: DashboardPrefs | undefined | null): DashboardPrefs {
  if (!prefs || !Array.isArray(prefs.widgets) || prefs.widgets.length === 0) {
    return getDefaultDashboardPrefs();
  }
  const existingIds = new Set(prefs.widgets.map(w => w.id));
  const missing: WidgetConfig[] = WIDGET_ORDER
    .filter(id => !existingIds.has(id))
    .map(id => ({ id, visible: true, size: WIDGET_REGISTRY[id].defaultSize }));
  // Artık registry'de olmayan eski widget id'lerini at
  const cleaned = prefs.widgets.filter(w => WIDGET_REGISTRY[w.id]);
  return { ...prefs, widgets: [...cleaned, ...missing] };
}
