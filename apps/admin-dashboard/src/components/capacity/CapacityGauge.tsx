import { cn } from '@/lib/utils';

interface CapacityGaugeProps {
  title: string;
  icon: React.ReactNode;
  current: number;
  total: number;
  unit?: string;
  additionalInfo?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export function CapacityGauge({
  title,
  icon,
  current,
  total,
  unit = 'units',
  additionalInfo,
  warningThreshold = 80,
  criticalThreshold = 90,
}: CapacityGaugeProps) {
  const percentage = (current / total) * 100;
  const available = total - current;

  const getStatusColor = () => {
    if (percentage >= criticalThreshold) return 'text-error';
    if (percentage >= warningThreshold) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = () => {
    if (percentage >= criticalThreshold) return 'bg-error';
    if (percentage >= warningThreshold) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <p className={cn('text-3xl font-bold', getStatusColor())}>
              {percentage.toFixed(0)}%
            </p>
          </div>
        </div>
        {percentage >= criticalThreshold && (
          <span className="px-2 py-1 bg-red-100 text-error text-xs font-semibold rounded-full">
            CRITICAL
          </span>
        )}
        {percentage >= warningThreshold && percentage < criticalThreshold && (
          <span className="px-2 py-1 bg-yellow-100 text-warning text-xs font-semibold rounded-full">
            WARNING
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-500', getProgressColor())}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Occupied</p>
          <p className="font-semibold text-gray-900">
            {current} {unit}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Available</p>
          <p className="font-semibold text-gray-900">
            {available} {unit}
          </p>
        </div>
      </div>

      {additionalInfo && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-600">{additionalInfo}</p>
        </div>
      )}
    </div>
  );
}
