'use client';

import { WaitTimeTrends } from './WaitTimeTrends';
import { PatientSatisfaction } from './PatientSatisfaction';
import { BottlenecksAndRecommendations } from './BottlenecksAndRecommendations';
import { useDashboardStore } from '@/store/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function OperationalEfficiency() {
  const { operationalMetrics } = useDashboardStore();

  if (!operationalMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operational Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading operational data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { waitTimes, patientSatisfaction, bottlenecks, optimizationRecommendations } =
    operationalMetrics;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Operational Efficiency
        </h2>
        <p className="text-gray-600">
          Process optimization and patient experience metrics
        </p>
      </div>

      {/* Wait Times and Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WaitTimeTrends data={waitTimes} />
        <PatientSatisfaction metrics={operationalMetrics} />
      </div>

      {/* Bottlenecks and Recommendations */}
      <BottlenecksAndRecommendations
        bottlenecks={bottlenecks}
        recommendations={optimizationRecommendations}
      />
    </div>
  );
}
