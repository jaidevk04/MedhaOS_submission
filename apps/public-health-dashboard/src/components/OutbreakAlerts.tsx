'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, MapPin } from 'lucide-react';

interface Alert {
  id: string;
  disease: string;
  location: string;
  severity: 'critical' | 'high' | 'medium';
  cases: number;
  trend: 'up' | 'down' | 'stable';
  prediction: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    disease: 'Dengue',
    location: 'Mumbai, Maharashtra',
    severity: 'critical',
    cases: 234,
    trend: 'up',
    prediction: '40% increase expected in 2 weeks',
  },
  {
    id: '2',
    disease: 'Malaria',
    location: 'Kolkata, West Bengal',
    severity: 'high',
    cases: 156,
    trend: 'up',
    prediction: '25% increase expected in 1 week',
  },
  {
    id: '3',
    disease: 'Typhoid',
    location: 'Delhi NCR',
    severity: 'medium',
    cases: 89,
    trend: 'stable',
    prediction: 'Stable for next 2 weeks',
  },
  {
    id: '4',
    disease: 'Chikungunya',
    location: 'Bangalore, Karnataka',
    severity: 'high',
    cases: 178,
    trend: 'up',
    prediction: '30% increase expected in 10 days',
  },
];

export function OutbreakAlerts() {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {mockAlerts.map((alert) => (
        <Card key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-lg">{alert.disease}</h3>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{alert.location}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{alert.cases} cases</span>
                  <span className="text-gray-600 ml-2">• {alert.prediction}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp
                  className={`h-5 w-5 ${
                    alert.trend === 'up' ? 'text-red-500' : 'text-green-500'
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
