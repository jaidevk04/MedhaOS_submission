'use client';

import { ForecastChart } from './ForecastChart';
import { InventoryAlerts } from './InventoryAlerts';
import { BloodBankStatus } from './BloodBankStatus';
import { useDashboardStore } from '@/store/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PredictiveAnalytics() {
  const { predictiveAnalytics } = useDashboardStore();

  if (!predictiveAnalytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Predictive Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    bedOccupancyForecast,
    icuDemandForecast,
    drugInventoryAlerts,
    bloodBankStatus,
  } = predictiveAnalytics;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Predictive Analytics
        </h2>
        <p className="text-gray-600">
          AI-powered forecasts and early warning system
        </p>
      </div>

      {/* Forecast Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastChart
          title="Bed Occupancy Forecast (24-72h)"
          data={bedOccupancyForecast}
          warningThreshold={85}
          criticalThreshold={95}
          unit="%"
        />

        <ForecastChart
          title="ICU Demand Forecast (6-24h)"
          data={icuDemandForecast}
          warningThreshold={90}
          criticalThreshold={95}
          unit="%"
        />
      </div>

      {/* Inventory and Blood Bank */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryAlerts alerts={drugInventoryAlerts} />
        <BloodBankStatus bloodBankData={bloodBankStatus} />
      </div>
    </div>
  );
}
