import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmergencyAlert } from '@/types/patient';
import { AlertCircle, AlertTriangle, Info, X, Check } from 'lucide-react';
import { useQueueStore } from '@/store/queueStore';

export function EmergencyAlertPanel() {
  const { alerts, acknowledgeAlert, removeAlert } = useQueueStore();

  const getAlertIcon = (severity: EmergencyAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'urgent':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertColor = (severity: EmergencyAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'urgent':
        return 'bg-orange-50 border-orange-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const hours = Math.floor(diffMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const unacknowledgedAlerts = alerts.filter((a: EmergencyAlert) => !a.acknowledged);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Emergency Alerts</CardTitle>
          {unacknowledgedAlerts.length > 0 && (
            <Badge variant="error">{unacknowledgedAlerts.length} New</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          alerts.map((alert: EmergencyAlert) => (
            <div
              key={alert.alert_id}
              className={`p-3 border rounded-lg ${getAlertColor(alert.severity)} ${
                alert.acknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm">{alert.message}</p>
                    <div className="flex items-center gap-1">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.alert_id)}
                          className="p-1 hover:bg-white/50 rounded transition-colors"
                          title="Acknowledge"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeAlert(alert.alert_id)}
                        className="p-1 hover:bg-white/50 rounded transition-colors"
                        title="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 mb-1">
                    Patient: {alert.patient_name}
                  </p>
                  {alert.details && (
                    <p className="text-xs text-gray-600 mb-2">{alert.details}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{getTimeAgo(alert.created_at)}</p>
                    {alert.acknowledged && (
                      <Badge variant="outline" className="text-xs">
                        Acknowledged
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
