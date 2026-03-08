'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Truck, Package } from 'lucide-react';

interface Resource {
  id: string;
  type: 'team' | 'supplies' | 'equipment';
  name: string;
  location: string;
  status: 'deployed' | 'available' | 'in-transit';
  quantity?: number;
}

const mockResources: Resource[] = [
  {
    id: '1',
    type: 'team',
    name: 'Rapid Response Team Alpha',
    location: 'Mumbai, Maharashtra',
    status: 'deployed',
  },
  {
    id: '2',
    type: 'supplies',
    name: 'Medical Supplies',
    location: 'Kolkata, West Bengal',
    status: 'in-transit',
    quantity: 500,
  },
  {
    id: '3',
    type: 'equipment',
    name: 'Testing Kits',
    location: 'Delhi NCR',
    status: 'deployed',
    quantity: 1000,
  },
  {
    id: '4',
    type: 'team',
    name: 'Rapid Response Team Beta',
    location: 'Bangalore, Karnataka',
    status: 'available',
  },
];

export function ResourceAllocation() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'team':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'supplies':
        return <Package className="h-5 w-5 text-green-600" />;
      case 'equipment':
        return <Truck className="h-5 w-5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'deployed':
        return <Badge className="bg-red-100 text-red-800">Deployed</Badge>;
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'in-transit':
        return <Badge className="bg-yellow-100 text-yellow-800">In Transit</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {mockResources.map((resource) => (
        <Card key={resource.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="mt-1">{getIcon(resource.type)}</div>
                <div>
                  <h4 className="font-medium text-sm">{resource.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{resource.location}</p>
                  {resource.quantity && (
                    <p className="text-xs text-gray-500 mt-1">Qty: {resource.quantity}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(resource.status)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
