'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Syndrome {
  id: string;
  name: string;
  cases: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

const mockSyndromes: Syndrome[] = [
  { id: '1', name: 'Fever', cases: 1234, change: 15, trend: 'up' },
  { id: '2', name: 'Respiratory', cases: 856, change: -8, trend: 'down' },
  { id: '3', name: 'Gastrointestinal', cases: 432, change: 0, trend: 'stable' },
  { id: '4', name: 'Rash', cases: 289, change: 22, trend: 'up' },
  { id: '5', name: 'Neurological', cases: 156, change: -5, trend: 'down' },
];

export function SyndromicTrends() {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {mockSyndromes.map((syndrome) => (
        <div key={syndrome.id} className="flex items-center justify-between py-2 border-b last:border-0">
          <div className="flex-1">
            <p className="text-sm font-medium">{syndrome.name}</p>
            <p className="text-xs text-gray-600">{syndrome.cases} cases</p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(syndrome.trend)}
            <span
              className={`text-sm font-medium ${
                syndrome.trend === 'up'
                  ? 'text-red-600'
                  : syndrome.trend === 'down'
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}
            >
              {syndrome.change > 0 ? '+' : ''}
              {syndrome.change}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
