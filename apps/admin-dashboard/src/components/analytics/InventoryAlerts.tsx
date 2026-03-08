import { AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { InventoryAlert } from '@/types';
import { formatDate, getStatusBgColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
}

export function InventoryAlerts({ alerts }: InventoryAlertsProps) {
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Drug Inventory Alerts
            </h3>
            <p className="text-sm text-gray-600">
              {criticalAlerts.length} critical, {warningAlerts.length} warnings
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>All inventory levels are adequate</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getStatusBgColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {alert.severity === 'critical' && (
                      <AlertTriangle className="w-4 h-4 text-error" />
                    )}
                    {alert.severity === 'warning' && (
                      <TrendingDown className="w-4 h-4 text-warning" />
                    )}
                    <h4 className="font-semibold text-gray-900">
                      {alert.itemName}
                    </h4>
                    <Badge variant={alert.severity}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Current Stock</p>
                      <p className="font-semibold text-gray-900">
                        {alert.currentStock} units
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Reorder Level</p>
                      <p className="font-semibold text-gray-900">
                        {alert.reorderLevel} units
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Predicted stockout: {formatDate(alert.predictedStockoutDate)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All Inventory →
          </button>
        </div>
      )}
    </div>
  );
}
