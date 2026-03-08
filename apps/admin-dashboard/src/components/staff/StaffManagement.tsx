'use client';

import { ShiftCoverage } from './ShiftCoverage';
import { BurnoutRiskIndicators } from './BurnoutRiskIndicators';
import { OvertimeTracking } from './OvertimeTracking';
import { ScheduleOptimizations } from './ScheduleOptimizations';
import { useDashboardStore } from '@/store/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StaffManagement() {
  const { staffMetrics } = useDashboardStore();

  if (!staffMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading staff data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { shiftCoverage, burnoutRisk, overtimeTracking, scheduleOptimizations } =
    staffMetrics;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Staff Management
        </h2>
        <p className="text-gray-600">
          Workforce optimization and wellbeing monitoring
        </p>
      </div>

      {/* Shift Coverage and Burnout Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShiftCoverage coverage={shiftCoverage} />
        <BurnoutRiskIndicators risks={burnoutRisk} />
      </div>

      {/* Overtime and Optimizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OvertimeTracking data={overtimeTracking} />
        <ScheduleOptimizations optimizations={scheduleOptimizations} />
      </div>
    </div>
  );
}
