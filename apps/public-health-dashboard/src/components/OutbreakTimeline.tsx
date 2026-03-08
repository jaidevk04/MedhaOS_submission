'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Users } from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  disease: string;
  location: string;
  cases: number;
  status: 'active' | 'contained' | 'monitoring';
}

const mockTimeline: TimelineEvent[] = [
  {
    id: '1',
    date: '2026-03-01',
    disease: 'Dengue Outbreak',
    location: 'Mumbai, Maharashtra',
    cases: 234,
    status: 'active',
  },
  {
    id: '2',
    date: '2026-02-28',
    disease: 'Malaria Cluster',
    location: 'Kolkata, West Bengal',
    cases: 156,
    status: 'monitoring',
  },
  {
    id: '3',
    date: '2026-02-25',
    disease: 'Typhoid Cases',
    location: 'Delhi NCR',
    cases: 89,
    status: 'contained',
  },
  {
    id: '4',
    date: '2026-02-20',
    disease: 'Chikungunya',
    location: 'Bangalore, Karnataka',
    cases: 178,
    status: 'active',
  },
];

export function OutbreakTimeline() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-500';
      case 'contained':
        return 'bg-green-500';
      case 'monitoring':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {mockTimeline.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`} />
            {index < mockTimeline.length - 1 && (
              <div className="w-0.5 h-full bg-gray-300 mt-2" />
            )}
          </div>
          <Card className="flex-1 mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(event.date).toLocaleDateString('en-IN', { 
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}</span>
              </div>
              <h4 className="font-semibold text-base mb-2">{event.disease}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{event.cases} cases</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
