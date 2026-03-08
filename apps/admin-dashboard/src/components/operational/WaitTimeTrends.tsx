'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock } from 'lucide-react';
import { WaitTimeData } from '@/types';
import { formatTime } from '@/lib/utils';

interface WaitTimeTrendsProps {
  data: WaitTimeData[];
}

export function WaitTimeTrends({ data }: WaitTimeTrendsProps) {
  const chartData = data.map((item) => ({
    time: formatTime(item.timestamp),
    ED: item.edWaitTime,
    OPD: item.opdWaitTime,
    Lab: item.labTurnaround,
    Radiology: item.radiologyTurnaround,
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Clock className="w-5 h-5 text-info" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Wait Time Trends
          </h3>
          <p className="text-sm text-gray-600">Last 7 hours</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="time" stroke="#6B7280" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${value}m`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => [`${value} min`, '']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="ED"
            stroke="#FF4D4F"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Emergency Dept"
          />
          <Line
            type="monotone"
            dataKey="OPD"
            stroke="#1890FF"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Outpatient Dept"
          />
          <Line
            type="monotone"
            dataKey="Lab"
            stroke="#52C41A"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Lab Turnaround"
          />
          <Line
            type="monotone"
            dataKey="Radiology"
            stroke="#FAAD14"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Radiology"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
