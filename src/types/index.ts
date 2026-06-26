// ─── Kurum (Organization) ──────────────────────────────────
export type OrgPlan = 'free' | 'pro' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string;
  ownerId: string;
  plan: OrgPlan;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
  settings?: {
    allowSelfJoin: boolean;
    maxMembers: number;
  };
}

// ─── Üyelik rolleri ────────────────────────────────────────
export type OrgRole = 'owner' | 'admin' | 'staff' | 'viewer';

export interface OrgMember {
  uid: string;
  email: string;
  fullName: string;
  profilePhoto: string;
  role: OrgRole;
  joinedAt: Date | { toDate: () => Date };
  orgId: string;
}

// ─── Davet ────────────────────────────────────────────────
export type InviteStatus = 'pending' | 'accepted' | 'expired';

export interface OrgInvite {
  id: string;
  orgId: string;
  orgName: string;
  email: string;
  role: OrgRole;
  token: string;
  invitedBy: string;
  status: InviteStatus;
  expiresAt: Date | { toDate: () => Date };
  createdAt: Date | { toDate: () => Date };
}

// ─── Sürücü ───────────────────────────────────────────────
export interface DriverRatings {
  safeDriving: number;
  trafficCompliance: number;
  parkingSkill: number;
  nightDriving: number;
  longDistanceDriving: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: Date | { toDate: () => Date };
  performedBy: string;
  entityType: 'driver' | 'vehicle' | 'user' | 'org';
  entityId: string;
  orgId: string;
}

export interface Driver {
  uid: string;
  orgId: string;
  fullName: string;
  profilePhoto: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  licenseNumber: string;
  licenseType: 'A' | 'B' | 'C' | 'D' | 'E';
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'suspended' | 'expired';
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
  driverRatings: DriverRatings;
  overallRating: number;
  assignedVehicles: string[];
  activityHistory: ActivityLog[];
}

// ─── Araç ─────────────────────────────────────────────────
export interface VehiclePerformance {
  speed: number;
  comfort: number;
  handling: number;
  fuelEconomy: number;
  safety: number;
  durability: number;
  braking: number;
  technology: number;
}

export interface Vehicle {
  id: string;
  orgId: string;
  vehicleName: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  fuelType: 'Benzin' | 'Dizel' | 'Elektrik' | 'Hibrit' | 'LPG';
  transmission: 'Manuel' | 'Otomatik' | 'Yarı Otomatik';
  horsepower: number;
  engineSize: string;
  topSpeed: number;
  mileage: number;
  vinNumber: string;
  vehicleImage: string;
  ownerId: string;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
  performanceRatings: VehiclePerformance;
  overallPerformance: number;
}

// ─── Admin / Auth ──────────────────────────────────────────
export interface Admin {
  uid: string;
  email: string;
  fullName: string;
  profilePhoto: string;
  currentOrgId: string | null;
  orgs: string[];
  createdAt: Date | { toDate: () => Date };
  dashboardPrefs?: DashboardPrefs;
}

// ─── Dashboard Widget Sistemi ──────────────────────────────
export type WidgetSize = 'small' | 'medium' | 'large';

export type WidgetId =
  | 'orgBanner'
  | 'planUsage'
  | 'statTotalDrivers'
  | 'statTotalVehicles'
  | 'statAvgRating'
  | 'statAvgPerformance'
  | 'statActiveLicenses'
  | 'statExpiringLicenses'
  | 'growthChart'
  | 'licenseTypeChart'
  | 'topDrivers'
  | 'recentActivity';

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  size: WidgetSize;
}

export interface DashboardPrefs {
  widgets: WidgetConfig[];
  updatedAt?: Date | { toDate: () => Date };
}


// ─── Bildirim ─────────────────────────────────────────────
export interface Notification {
  id: string;
  orgId: string;
  type: 'driver_created' | 'vehicle_assigned' | 'license_expiring' | 'driver_updated' | 'vehicle_updated' | 'member_invited' | 'member_joined';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date | { toDate: () => Date };
  entityId?: string;
}

// ─── UI yardımcıları ──────────────────────────────────────
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// ─── Plan sistemi ──────────────────────────────────────────
export type PlanId = 'free' | 'basic' | 'pro' | 'ultimate';

export interface PlanLimits {
  maxDrivers: number;       // -1 = sınırsız
  maxVehicles: number;
  maxMembers: number;
  maxOrgs: number;
  analytics: boolean;
  csvExport: boolean;
  pdfExport: boolean;
  excelExport: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number;            // aylık TL
  description: string;
  limits: PlanLimits;
  badge?: string;
  color: string;
  icon: string;
}
