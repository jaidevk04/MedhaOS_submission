'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Wallet } from 'lucide-react';
import { FinancialMetrics } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface AccountsReceivableProps {
  metrics: FinancialMetrics;
}

export function AccountsReceivable({ metrics }: AccountsReceivableProps) {
  const { accountsReceivable } = metrics;

  const chartData = [
    { name: 'Current', value: accountsReceivable.current, color: '#52C41A' },
    { name: '1-30 days', value: accountsReceivable.days30, color: '#1890FF' },
    { name: '31-60 days', value: accountsReceivable.days60, color: '#FAAD14' },
    { name: '61-90 days', value: accountsReceivable.days90, color: '#FF7A45' },
    { name: '90+ days', value: accountsReceivable.daysOver90, color: '#FF4D4F' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Wallet className="w-5 h-5 text-info" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Accounts Receivable Aging
          </h3>
          <p className="text-sm text-gray-600">
            Total: {formatCurrency(accountsReceivable.total)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-700">{item.name}</span>
            </div>
            <span className="font-semibold text-gray-900">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>

      {accountsReceivable.daysOver90 > accountsReceivable.total * 0.15 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-error font-medium">
            ⚠️ Over 15% of AR is 90+ days old. Consider collection actions.
          </p>
        </div>
      )}
    </div>
  );
}
