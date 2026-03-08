import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { OperationalMetrics } from '@/types';
import { formatNumber } from '@/lib/utils';

interface PatientSatisfactionProps {
  metrics: OperationalMetrics;
}

export function PatientSatisfaction({ metrics }: PatientSatisfactionProps) {
  const { patientSatisfaction } = metrics;

  const getTrendIcon = () => {
    switch (patientSatisfaction.trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-error" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (patientSatisfaction.trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      default:
        return 'text-gray-600';
    }
  };

  const getScoreColor = () => {
    if (patientSatisfaction.score >= 4.5) return 'text-success';
    if (patientSatisfaction.score >= 4.0) return 'text-info';
    if (patientSatisfaction.score >= 3.5) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
          <Star className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Patient Satisfaction
          </h3>
          <p className="text-sm text-gray-600">
            Based on {formatNumber(patientSatisfaction.responses)} responses
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className={`text-5xl font-bold ${getScoreColor()}`}>
            {patientSatisfaction.score.toFixed(1)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(patientSatisfaction.score)
                    ? 'fill-warning text-warning'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="text-right">
          <div className={`flex items-center gap-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-lg font-semibold">
              {patientSatisfaction.trend === 'up' && 'Improving'}
              {patientSatisfaction.trend === 'down' && 'Declining'}
              {patientSatisfaction.trend === 'stable' && 'Stable'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">vs last month</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Excellent (5 stars)</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-success" style={{ width: '65%' }} />
            </div>
            <span className="text-gray-900 font-medium w-10 text-right">65%</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Good (4 stars)</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-info" style={{ width: '25%' }} />
            </div>
            <span className="text-gray-900 font-medium w-10 text-right">25%</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Average (3 stars)</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-warning" style={{ width: '7%' }} />
            </div>
            <span className="text-gray-900 font-medium w-10 text-right">7%</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Poor (1-2 stars)</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-error" style={{ width: '3%' }} />
            </div>
            <span className="text-gray-900 font-medium w-10 text-right">3%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
