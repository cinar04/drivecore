import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | { toDate: () => Date } | string | null): string {
  if (!date) return '-';
  try {
    let d: Date;
    if (typeof date === 'string') {
      d = new Date(date);
    } else if ('toDate' in date) {
      d = date.toDate();
    } else {
      d = date;
    }
    return format(d, 'dd MMM yyyy', { locale: tr });
  } catch {
    return '-';
  }
}

export function formatDateTime(date: Date | { toDate: () => Date } | null): string {
  if (!date) return '-';
  try {
    const d = 'toDate' in date ? date.toDate() : date;
    return format(d, 'dd MMM yyyy HH:mm', { locale: tr });
  } catch {
    return '-';
  }
}

export function timeAgo(date: Date | { toDate: () => Date } | null): string {
  if (!date) return '-';
  try {
    const d = 'toDate' in date ? date.toDate() : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: tr });
  } catch {
    return '-';
  }
}

export function isLicenseExpiringSoon(expiryDate: string): boolean {
  try {
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = addDays(new Date(), 30);
    return !isAfter(expiry, thirtyDaysFromNow);
  } catch {
    return false;
  }
}

export function isLicenseExpired(expiryDate: string): boolean {
  try {
    return !isAfter(new Date(expiryDate), new Date());
  } catch {
    return false;
  }
}

export function calculateOverallRating(ratings: Record<string, number>): number {
  const values = Object.values(ratings).filter(v => typeof v === 'number');
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.round(avg * 10) / 10;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'badge-success';
    case 'suspended': return 'badge-warning';
    case 'expired': return 'badge-danger';
    default: return 'badge-primary';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Aktif';
    case 'suspended': return 'Askıya Alındı';
    case 'expired': return 'Süresi Doldu';
    default: return status;
  }
}

export function getLicenseTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'A': 'bg-red-500/20 text-red-400 border-red-500/30',
    'B': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'C': 'bg-green-500/20 text-green-400 border-green-500/30',
    'D': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'E': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return colors[type] || 'badge-primary';
}

export function formatPlate(plate: string): string {
  return plate.toUpperCase().replace(/\s/g, ' ');
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const val = row[header];
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

export function getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
}

export function fuelTypeLabel(fuelType: string): string {
  const labels: Record<string, string> = {
    'Benzin': 'Benzin',
    'Dizel': 'Dizel',
    'Elektrik': 'Elektrik',
    'Hibrit': 'Hibrit',
    'LPG': 'LPG',
  };
  return labels[fuelType] || fuelType;
}
