import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
          {
            'bg-gray-100 text-gray-800 border border-gray-300': variant === 'default',
            'bg-red-100 text-error border border-red-300': variant === 'critical',
            'bg-yellow-100 text-warning border border-yellow-300': variant === 'warning',
            'bg-green-100 text-success border border-green-300': variant === 'success',
            'bg-blue-100 text-info border border-blue-300': variant === 'info',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
