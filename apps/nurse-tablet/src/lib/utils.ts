import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getTimeUntil(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();

  if (diff < 0) return 'Overdue';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function getPriorityColor(priority: 'urgent' | 'soon' | 'routine'): string {
  switch (priority) {
    case 'urgent':
      return 'text-urgent bg-urgent/10 border-urgent';
    case 'soon':
      return 'text-soon bg-soon/10 border-soon';
    case 'routine':
      return 'text-routine bg-routine/10 border-routine';
  }
}

export function getAcuityColor(acuity: number): string {
  if (acuity >= 4) return 'text-urgent';
  if (acuity >= 3) return 'text-soon';
  return 'text-routine';
}

export function getVitalStatusColor(status: 'normal' | 'warning' | 'critical'): string {
  switch (status) {
    case 'critical':
      return 'text-urgent';
    case 'warning':
      return 'text-soon';
    case 'normal':
      return 'text-routine';
  }
}
