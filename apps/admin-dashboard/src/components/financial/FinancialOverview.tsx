'use client';

import { RevenueCycleMetrics } from './RevenueCycleMetrics';
import { AccountsReceivable } from './AccountsReceivable';
import { DenialRateTrend } from './DenialRateTrend';
import { useDashboardStore } from '@/store/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FinancialOverview() {
  const { financialMetrics } = useDashboardStore();

  if (!financialMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading financial data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Financial Overview
        </h2>
        <p className="text-gray-600">
          Revenue cycle performance and accounts receivable
        </p>
      </div>

      {/* Revenue Cycle Metrics */}
      <RevenueCycleMetrics metrics={financialMetrics} />

      {/* AR and Denial Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountsReceivable metrics={financialMetrics} />
        <DenialRateTrend />
      </div>
    </div>
  );
}
