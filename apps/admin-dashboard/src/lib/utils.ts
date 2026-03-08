import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

export function getStatusColor(
  status: 'critical' | 'warning' | 'success' | 'info' | 'low' | 'medium' | 'high' | 'adequate'
): string {
  const colorMap: Record<string, string> = {
    critical: 'text-error',
    high: 'text-error',
    warning: 'text-warning',
    medium: 'text-warning',
    success: 'text-success',
    adequate: 'text-success',
    low: 'text-success',
    info: 'text-info',
  };
  return colorMap[status] || 'text-gray-600';
}

export function getStatusBgColor(
  status: 'critical' | 'warning' | 'success' | 'info' | 'low' | 'medium' | 'high' | 'adequate'
): string {
  const colorMap: Record<string, string> = {
    critical: 'bg-red-100 border-red-300',
    high: 'bg-red-100 border-red-300',
    warning: 'bg-yellow-100 border-yellow-300',
    medium: 'bg-yellow-100 border-yellow-300',
    success: 'bg-green-100 border-green-300',
    adequate: 'bg-green-100 border-green-300',
    low: 'bg-green-100 border-green-300',
    info: 'bg-blue-100 border-blue-300',
  };
  return colorMap[status] || 'bg-gray-100 border-gray-300';
}

export function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous;
  const threshold = previous * 0.05; // 5% threshold

  if (Math.abs(diff) < threshold) {
    return 'stable';
  }
  return diff > 0 ? 'up' : 'down';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
