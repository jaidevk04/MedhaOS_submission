import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { OvertimeData } from '@/types';

interface OvertimeTrackingProps {
  data: OvertimeData[];
}

export function OvertimeTracking({ data }: OvertimeTrackingProps) {
  const chartData = data.map((item) => ({
    department: item.department,
    hours: item.totalHours,
    avgPerStaff: item.averagePerStaff,
  }));

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-error" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-success" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-error';
      case 'decreasing':
        return 'text-success';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Clock className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Overtime Tracking
          </h3>
          <p className="text-sm text-gray-600">This week by department</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="department" stroke="#6B7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'hours') return [`${value}h`, 'Total Hours'];
              return [`${value}h`, 'Avg per Staff'];
            }}
          />
          <Bar dataKey="hours" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-3">
        {data.map((item) => (
          <div
            key={item.department}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium text-gray-900">{item.department}</p>
              <p className="text-sm text-gray-600">
                {item.averagePerStaff.toFixed(1)}h per staff member
              </p>
            </div>
            <div className={`flex items-center gap-2 ${getTrendColor(item.trend)}`}>
              {getTrendIcon(item.trend)}
              <span className="text-sm font-medium capitalize">{item.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
