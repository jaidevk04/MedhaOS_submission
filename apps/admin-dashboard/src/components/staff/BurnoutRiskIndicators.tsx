import { AlertTriangle, User, Calendar, Clock } from 'lucide-react';
import { BurnoutRisk } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BurnoutRiskIndicatorsProps {
  risks: BurnoutRisk[];
}

export function BurnoutRiskIndicators({ risks }: BurnoutRiskIndicatorsProps) {
  const highRiskCount = risks.filter((r) => r.riskLevel === 'high').length;
  const mediumRiskCount = risks.filter((r) => r.riskLevel === 'medium').length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Burnout Risk Indicators
            </h3>
            <p className="text-sm text-gray-600">
              {highRiskCount} high risk, {mediumRiskCount} medium risk
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {risks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No staff at risk of burnout</p>
          </div>
        ) : (
          risks.map((risk) => (
            <div
              key={risk.staffId}
              className={`p-4 rounded-lg border ${
                risk.riskLevel === 'high'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {risk.staffName}
                    </h4>
                    <p className="text-xs text-gray-600">{risk.department}</p>
                  </div>
                </div>
                <Badge
                  variant={risk.riskLevel === 'high' ? 'critical' : 'warning'}
                >
                  {risk.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {risk.consecutiveDays} consecutive days
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {risk.overtimeHours}h overtime
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-1">Risk Factors:</p>
                <div className="flex flex-wrap gap-1">
                  {risk.factors.map((factor, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white text-xs text-gray-700 rounded"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="primary">
                  Schedule Time Off
                </Button>
                <Button size="sm" variant="outline">
                  Reassign Tasks
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
