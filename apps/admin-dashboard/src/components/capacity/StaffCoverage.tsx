import { UserCheck, Users } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/lib/utils';

interface StaffCoverageProps {
  total: number;
  onDuty: number;
  utilizationRate: number;
}

export function StaffCoverage({
  total,
  onDuty,
  utilizationRate,
}: StaffCoverageProps) {
  const getUtilizationColor = () => {
    if (utilizationRate >= 95) return 'text-error';
    if (utilizationRate >= 85) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = () => {
    if (utilizationRate >= 95) return 'bg-error';
    if (utilizationRate >= 85) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
          <UserCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-600">Staff Coverage</h3>
          <p className={`text-3xl font-bold ${getUtilizationColor()}`}>
            {formatPercentage(utilizationRate)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${utilizationRate}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-600">On Duty</p>
            <p className="font-semibold text-gray-900">
              {formatNumber(onDuty)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-600">Total Staff</p>
            <p className="font-semibold text-gray-900">
              {formatNumber(total)}
            </p>
          </div>
        </div>
      </div>

      {utilizationRate >= 95 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-error font-medium">
            ⚠️ Staff utilization critical - consider calling additional staff
          </p>
        </div>
      )}
    </div>
  );
}
