import { Clock, Users } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface QueueMetricsProps {
  title: string;
  currentPatients: number;
  averageWaitTime: number;
  trend?: 'up' | 'down' | 'stable';
}

export function QueueMetrics({
  title,
  currentPatients,
  averageWaitTime,
  trend = 'stable',
}: QueueMetricsProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-error';
    if (trend === 'down') return 'text-success';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all">
      <h3 className="text-sm font-medium text-gray-600 mb-4">{title}</h3>

      <div className="space-y-4">
        {/* Current Patients */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(currentPatients)}
              </p>
              <p className="text-xs text-gray-600">Patients in queue</p>
            </div>
          </div>
          <span className={`text-2xl font-bold ${getTrendColor()}`}>
            {getTrendIcon()}
          </span>
        </div>

        {/* Average Wait Time */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {averageWaitTime} min
            </p>
            <p className="text-xs text-gray-600">Average wait time</p>
          </div>
        </div>
      </div>
    </div>
  );
}
