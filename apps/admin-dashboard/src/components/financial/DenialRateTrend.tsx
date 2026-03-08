'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown } from 'lucide-react';

export function DenialRateTrend() {
  // Mock trend data - in real app, this would come from props
  const trendData = [
    { month: 'Jan', rate: 9.2 },
    { month: 'Feb', rate: 8.5 },
    { month: 'Mar', rate: 7.8 },
    { month: 'Apr', rate: 8.1 },
    { month: 'May', rate: 7.9 },
    { month: 'Jun', rate: 7.7 },
  ];

  const currentRate = trendData[trendData.length - 1].rate;
  const previousRate = trendData[trendData.length - 2].rate;
  const trend = currentRate < previousRate ? 'down' : 'up';

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Denial Rate Trend
            </h3>
            <p className="text-sm text-gray-600">Last 6 months</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">{currentRate}%</p>
          <p
            className={`text-sm ${
              trend === 'down' ? 'text-success' : 'text-error'
            }`}
          >
            {trend === 'down' ? '↓' : '↑'}{' '}
            {Math.abs(currentRate - previousRate).toFixed(1)}% vs last month
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            domain={[0, 15]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => [`${value}%`, 'Denial Rate']}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#52C41A"
            strokeWidth={3}
            dot={{ fill: '#52C41A', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
