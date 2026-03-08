import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock } from 'lucide-react';
import { Alert } from '@/types';
import { getRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (alertId: string) => void;
  onAction: (alertId: string, action: string) => void;
}

export function AlertCard({ alert, onAcknowledge, onAction }: AlertCardProps) {
  const getIcon = () => {
    switch (alert.type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-error" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'info':
        return <Info className="w-5 h-5 text-info" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBgColor = () => {
    switch (alert.type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border ${getBgColor()} ${
        alert.acknowledged ? 'opacity-60' : ''
      } transition-all`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                <Badge variant={alert.type}>{alert.type.toUpperCase()}</Badge>
                {alert.acknowledged && (
                  <Badge variant="success">
                    <CheckCircle className="w-3 h-3" />
                    Acknowledged
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-700">{alert.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
            <Clock className="w-3 h-3" />
            <span>{getRelativeTime(alert.timestamp)}</span>
          </div>

          {alert.actionable && alert.actions && alert.actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {alert.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={index === 0 ? 'primary' : 'outline'}
                  onClick={() => onAction(alert.id, action.action)}
                  disabled={alert.acknowledged}
                >
                  {action.label}
                </Button>
              ))}
              {!alert.acknowledged && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAcknowledge(alert.id)}
                >
                  Acknowledge
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
