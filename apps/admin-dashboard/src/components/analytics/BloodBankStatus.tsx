import { Droplet, AlertCircle } from 'lucide-react';
import { BloodBankStatus as BloodBankStatusType } from '@/types';
import { getStatusBgColor } from '@/lib/utils';

interface BloodBankStatusProps {
  bloodBankData: BloodBankStatusType[];
}

export function BloodBankStatus({ bloodBankData }: BloodBankStatusProps) {
  const criticalGroups = bloodBankData.filter((b) => b.status === 'critical');
  const lowGroups = bloodBankData.filter((b) => b.status === 'low');

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Droplet className="w-5 h-5 text-error" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Blood Bank Status
            </h3>
            <p className="text-sm text-gray-600">
              {criticalGroups.length} critical, {lowGroups.length} low
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {bloodBankData.map((blood) => {
          const percentage = (blood.unitsAvailable / blood.criticalLevel) * 100;
          const isCritical = blood.status === 'critical';
          const isLow = blood.status === 'low';

          return (
            <div
              key={blood.bloodGroup}
              className={`p-4 rounded-lg border ${getStatusBgColor(blood.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {blood.bloodGroup}
                </span>
                {isCritical && (
                  <AlertCircle className="w-5 h-5 text-error" />
                )}
              </div>

              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {blood.unitsAvailable}
                  </span>
                  <span className="text-sm text-gray-600">units</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCritical
                        ? 'bg-error'
                        : isLow
                        ? 'bg-warning'
                        : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-600">
                Critical level: {blood.criticalLevel}
              </div>
            </div>
          );
        })}
      </div>

      {criticalGroups.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-error mb-1">
                Critical Blood Shortage
              </p>
              <p className="text-sm text-gray-700">
                {criticalGroups.map((b) => b.bloodGroup).join(', ')} blood
                group(s) critically low. Consider triggering donor drive.
              </p>
              <button className="mt-2 text-sm text-error hover:text-red-700 font-medium">
                Trigger Donor Drive →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
