'use client';

import { DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { FinancialMetrics } from '@/types';
import { formatNumber, formatPercentage } from '@/lib/utils';

interface RevenueCycleMetricsProps {
  metrics: FinancialMetrics;
}

export function RevenueCycleMetrics({ metrics }: RevenueCycleMetricsProps) {
  const { revenueCycle, codingAccuracy, averageReimbursementTime } = metrics;

  const approvalRate =
    ((revenueCycle.approvedClaims / revenueCycle.submittedClaims) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-success" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Revenue Cycle Metrics
          </h3>
          <p className="text-sm text-gray-600">
            Claims processing and approval rates
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Total Claims</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(revenueCycle.totalClaims)}
          </p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Approved</p>
          <p className="text-2xl font-bold text-success">
            {formatNumber(revenueCycle.approvedClaims)}
          </p>
          <p className="text-xs text-gray-600 mt-1">{approvalRate}% rate</p>
        </div>

        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Denied</p>
          <p className="text-2xl font-bold text-error">
            {formatNumber(revenueCycle.deniedClaims)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {formatPercentage(revenueCycle.denialRate)} rate
          </p>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-warning">
            {formatNumber(revenueCycle.pendingClaims)}
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Coding Accuracy</p>
            <p className="text-xl font-bold text-gray-900">
              {formatPercentage(codingAccuracy)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Avg Reimbursement Time</p>
            <p className="text-xl font-bold text-gray-900">
              {averageReimbursementTime} days
            </p>
          </div>
        </div>
      </div>

      {/* Denial Rate Alert */}
      {revenueCycle.denialRate > 10 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-error font-medium">
            ⚠️ Denial rate above target (10%). Review common denial reasons.
          </p>
        </div>
      )}
    </div>
  );
}
