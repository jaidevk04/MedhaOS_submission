'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Newspaper, Radio, Globe } from 'lucide-react';

interface MediaAlert {
  id: string;
  source: 'news' | 'social' | 'official';
  title: string;
  location: string;
  timestamp: string;
  relevance: 'high' | 'medium' | 'low';
}

const mockMediaAlerts: MediaAlert[] = [
  {
    id: '1',
    source: 'news',
    title: 'Dengue cases surge in Mumbai suburbs',
    location: 'Mumbai, Maharashtra',
    timestamp: '2 hours ago',
    relevance: 'high',
  },
  {
    id: '2',
    source: 'social',
    title: 'Multiple fever reports in Kolkata',
    location: 'Kolkata, West Bengal',
    timestamp: '5 hours ago',
    relevance: 'medium',
  },
  {
    id: '3',
    source: 'official',
    title: 'Health advisory issued for Delhi',
    location: 'Delhi NCR',
    timestamp: '1 day ago',
    relevance: 'high',
  },
];

export function MediaScanning() {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'news':
        return <Newspaper className="h-4 w-4 text-blue-600" />;
      case 'social':
        return <Radio className="h-4 w-4 text-purple-600" />;
      case 'official':
        return <Globe className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {mockMediaAlerts.map((alert) => (
        <Card key={alert.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getSourceIcon(alert.source)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium line-clamp-2">{alert.title}</h4>
                  <Badge
                    variant={alert.relevance === 'high' ? 'destructive' : 'secondary'}
                    className="ml-2 shrink-0"
                  >
                    {alert.relevance}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{alert.location}</p>
                <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
