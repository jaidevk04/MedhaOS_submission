import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import type { Medication } from '@/types';

interface MedicationCardProps {
  medication: Medication;
  patientName: string;
  onAdminister: (medication: Medication) => void;
}

export function MedicationCard({ medication, patientName, onAdminister }: MedicationCardProps) {
  const isDue = new Date(medication.scheduledTime) <= new Date();
  const isOverdue = new Date(medication.scheduledTime) < new Date(Date.now() - 30 * 60 * 1000);

  const statusColors = {
    pending: 'border-l-warning bg-warning/5',
    administered: 'border-l-routine bg-routine/5',
    missed: 'border-l-urgent bg-urgent/5',
    refused: 'border-l-muted bg-muted',
  };

  return (
    <Card
      className={cn(
        'border-l-4 touch-target',
        statusColors[medication.status],
        isOverdue && medication.status === 'pending' && 'ring-2 ring-urgent'
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{medication.name}</h3>
            <p className="text-sm text-muted-foreground">{medication.dosage}</p>
          </div>
          <Badge
            variant={
              medication.status === 'administered'
                ? 'routine'
                : medication.status === 'pending'
                ? 'soon'
                : 'urgent'
            }
          >
            {medication.status.toUpperCase()}
          </Badge>
        </div>

        {/* Patient Info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{patientName}</span>
        </div>

        {/* Medication Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Route:</span>
            <span className="ml-1 font-medium">{medication.route}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Frequency:</span>
            <span className="ml-1 font-medium">{medication.frequency}</span>
          </div>
        </div>

        {/* Scheduled Time */}
        <div className="flex items-center gap-2">
          <Clock className={cn('w-4 h-4', isOverdue && 'text-urgent')} />
          <span className={cn('text-sm font-medium', isOverdue && 'text-urgent')}>
            {isOverdue ? 'Overdue' : isDue ? 'Due Now' : 'Scheduled'}:{' '}
            {formatTime(medication.scheduledTime)}
          </span>
        </div>

        {/* Action Button */}
        {medication.status === 'pending' && (
          <Button
            size="lg"
            className="w-full touch-target"
            onClick={() => onAdminister(medication)}
            variant={isOverdue ? 'destructive' : 'default'}
          >
            <Pill className="w-4 h-4 mr-2" />
            Administer Medication
          </Button>
        )}

        {medication.status === 'administered' && (
          <div className="flex items-center justify-center gap-2 text-routine py-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Administered</span>
          </div>
        )}

        {(medication.status === 'missed' || medication.status === 'refused') && (
          <div className="flex items-center justify-center gap-2 text-urgent py-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium capitalize">{medication.status}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
