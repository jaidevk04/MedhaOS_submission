'use client';

import { useState } from 'react';
import { Bell, Filter, CheckCheck } from 'lucide-react';
import { AlertCard } from './AlertCard';
import { useDashboardStore } from '@/store/dashboardStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AlertsPanel() {
  const { alerts, acknowledgeAlert } = useDashboardStore();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const filteredAlerts = alerts.filter((alert) => {
    if (!showAcknowledged && alert.acknowledged) return false;
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const criticalCount = alerts.filter(
    (a) => a.type === 'critical' && !a.acknowledged
  ).length;
  const warningCount = alerts.filter(
    (a) => a.type === 'warning' && !a.acknowledged
  ).length;

  const handleAction = (alertId: string, action: string) => {
    console.log(`Action ${action} triggered for alert ${alertId}`);
    // TODO: Implement actual action handlers
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Alerts & Notifications
        </h2>
        <p className="text-gray-600">
          {criticalCount} critical alerts, {warningCount} warnings
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <CardTitle>Active Alerts</CardTitle>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={showAcknowledged ? 'primary' : 'outline'}
                onClick={() => setShowAcknowledged(!showAcknowledged)}
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                {showAcknowledged ? 'Hide' : 'Show'} Acknowledged
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
            <Filter className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({alerts.filter((a) => !showAcknowledged ? !a.acknowledged : true).length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'critical'
                  ? 'bg-red-100 text-error'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'warning'
                  ? 'bg-yellow-100 text-warning'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Warning ({warningCount})
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'info'
                  ? 'bg-blue-100 text-info'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Info (
              {alerts.filter((a) => a.type === 'info' && !a.acknowledged).length})
            </button>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600">
                  {showAcknowledged
                    ? 'No alerts to display'
                    : 'No active alerts'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {!showAcknowledged &&
                    'All alerts have been acknowledged or there are no new alerts'}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={acknowledgeAlert}
                  onAction={handleAction}
                />
              ))
            )}
          </div>

          {filteredAlerts.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View Alert History →
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
