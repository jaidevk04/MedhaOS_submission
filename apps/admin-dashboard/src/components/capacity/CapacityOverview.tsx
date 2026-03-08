'use client';

import { Bed, Heart, Ambulance, Stethoscope } from 'lucide-react';
import { CapacityGauge } from './CapacityGauge';
import { QueueMetrics } from './QueueMetrics';
import { StaffCoverage } from './StaffCoverage';
import { useDashboardStore } from '@/store/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CapacityOverview() {
  const { capacityMetrics } = useDashboardStore();

  if (!capacityMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Capacity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading capacity data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { beds, icuBeds, edQueue, opdQueue, staff } = capacityMetrics;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Capacity Overview
        </h2>
        <p className="text-gray-600">
          Real-time hospital capacity and resource utilization
        </p>
      </div>

      {/* Capacity Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bed Occupancy */}
        <CapacityGauge
          title="Bed Occupancy"
          icon={<Bed className="w-6 h-6 text-white" />}
          current={beds.occupied}
          total={beds.total}
          unit="beds"
          additionalInfo={`${beds.available} beds available for admission`}
          warningThreshold={80}
          criticalThreshold={90}
        />

        {/* ICU Beds */}
        <CapacityGauge
          title="ICU Beds"
          icon={<Heart className="w-6 h-6 text-white" />}
          current={icuBeds.occupied}
          total={icuBeds.total}
          unit="beds"
          additionalInfo={
            icuBeds.available <= 5
              ? `⚠️ Only ${icuBeds.available} ICU beds remaining`
              : `${icuBeds.available} ICU beds available`
          }
          warningThreshold={85}
          criticalThreshold={92}
        />

        {/* Staff Coverage */}
        <StaffCoverage
          total={staff.total}
          onDuty={staff.onDuty}
          utilizationRate={staff.utilizationRate}
        />
      </div>

      {/* Queue Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ED Queue */}
        <QueueMetrics
          title="Emergency Department Queue"
          currentPatients={edQueue.currentPatients}
          averageWaitTime={edQueue.averageWaitTime}
          trend={edQueue.currentPatients > 15 ? 'up' : 'stable'}
        />

        {/* OPD Queue */}
        <QueueMetrics
          title="Outpatient Department Queue"
          currentPatients={opdQueue.currentPatients}
          averageWaitTime={opdQueue.averageWaitTime}
          trend={opdQueue.currentPatients > 40 ? 'up' : 'stable'}
        />
      </div>
    </div>
  );
}
