import { Users, CheckCircle, AlertCircle } from 'lucide-react';
import { ShiftCoverage as ShiftCoverageType } from '@/types';
import { formatPercentage } from '@/lib/utils';

interface ShiftCoverageProps {
  coverage: ShiftCoverageType[];
}

export function ShiftCoverage({ coverage }: ShiftCoverageProps) {
  const getShiftIcon = (shift: string) => {
    const icons: Record<string, string> = {
      morning: '🌅',
      afternoon: '☀️',
      night: '🌙',
    };
    return icons[shift] || '⏰';
  };

  const getCoverageColor = (rate: number) => {
    if (rate >= 95) return 'text-success';
    if (rate >= 85) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-info" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Shift Coverage
          </h3>
          <p className="text-sm text-gray-600">Current staffing levels</p>
        </div>
      </div>

      <div className="space-y-4">
        {coverage.map((shift, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getShiftIcon(shift.shift)}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {shift.shift} Shift
                  </h4>
                  <p className="text-xs text-gray-600">{shift.department}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getCoverageColor(shift.coverageRate)}`}>
                  {formatPercentage(shift.coverageRate)}
                </p>
                {shift.coverageRate >= 95 ? (
                  <CheckCircle className="w-4 h-4 text-success ml-auto mt-1" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-warning ml-auto mt-1" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Required</p>
                <p className="font-semibold text-gray-900">{shift.required}</p>
              </div>
              <div>
                <p className="text-gray-600">Scheduled</p>
                <p className="font-semibold text-gray-900">{shift.scheduled}</p>
              </div>
              <div>
                <p className="text-gray-600">Actual</p>
                <p className="font-semibold text-gray-900">{shift.actual}</p>
              </div>
            </div>

            {shift.coverageRate < 95 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-warning">
                  ⚠️ {shift.required - shift.actual} staff member(s) short
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
