'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ForecastData } from '@/types';
import { formatTime } from '@/lib/utils';

interface ForecastChartProps {
  title: string;
  data: ForecastData[];
  warningThreshold?: number;
  criticalThreshold?: number;
  unit?: string;
}

export function ForecastChart({
  title,
  data,
  warningThreshold = 85,
  criticalThreshold = 95,
  unit = '%',
}: ForecastChartProps) {
  const chartData = data.map((item) => ({
    time: formatTime(item.timestamp),
    value: item.value,
    confidence: item.confidence * 100,
  }));

  const maxValue = Math.max(...data.map((d) => d.value));
  const isWarning = maxValue >= warningThreshold;
  const isCritical = maxValue >= criticalThreshold;

  const getLineColor = () => {
    if (isCritical) return '#FF4D4F';
    if (isWarning) return '#FAAD14';
    return '#52C41A';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {isCritical && (
          <span className="px-3 py-1 bg-red-100 text-error text-xs font-semibold rounded-full">
            CRITICAL FORECAST
          </span>
        )}
        {isWarning && !isCritical && (
          <span className="px-3 py-1 bg-yellow-100 text-warning text-xs font-semibold rounded-full">
            WARNING
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={getLineColor()} stopOpacity={0.3} />
              <stop offset="95%" stopColor={getLineColor()} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="time"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}${unit}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'value') return [`${value.toFixed(1)}${unit}`, 'Forecast'];
              return [`${value.toFixed(0)}%`, 'Confidence'];
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={getLineColor()}
            strokeWidth={3}
            fill="url(#colorValue)"
          />
          <Line
            type="monotone"
            dataKey="confidence"
            stroke="#9CA3AF"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLineColor() }} />
            <span className="text-gray-600">Forecast</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-400" style={{ width: '16px' }} />
            <span className="text-gray-600">Confidence</span>
          </div>
        </div>
        <div className="text-gray-600">
          Peak: <span className="font-semibold text-gray-900">{maxValue.toFixed(0)}{unit}</span>
        </div>
      </div>
    </div>
  );
}
