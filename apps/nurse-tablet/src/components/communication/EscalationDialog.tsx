import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Phone } from 'lucide-react';
import type { Patient } from '@/types';

interface EscalationDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEscalate: (escalation: {
    patientId: string;
    reason: string;
    urgency: 'critical' | 'urgent' | 'routine';
    notes: string;
  }) => void;
}

const escalationReasons = [
  { value: 'deteriorating', label: 'Patient Deteriorating', urgency: 'critical' as const },
  { value: 'pain', label: 'Uncontrolled Pain', urgency: 'urgent' as const },
  { value: 'medication', label: 'Medication Concern', urgency: 'urgent' as const },
  { value: 'family', label: 'Family Request', urgency: 'routine' as const },
  { value: 'discharge', label: 'Discharge Question', urgency: 'routine' as const },
  { value: 'other', label: 'Other', urgency: 'urgent' as const },
];

export function EscalationDialog({
  patient,
  open,
  onOpenChange,
  onEscalate,
}: EscalationDialogProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  if (!patient) return null;

  const selectedReason = escalationReasons.find((r) => r.value === reason);

  const handleEscalate = () => {
    if (!selectedReason) return;

    onEscalate({
      patientId: patient.id,
      reason: selectedReason.label,
      urgency: selectedReason.urgency,
      notes,
    });

    setReason('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-urgent/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-urgent" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Escalate to Doctor</DialogTitle>
              <DialogDescription className="text-base">
                Request immediate attention for {patient.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Info */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Patient:</span>
                <span className="ml-1 font-medium">{patient.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>
                <span className="ml-1 font-medium">
                  {patient.room} - Bed {patient.bed}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Acuity:</span>
                <Badge variant={patient.acuityScore >= 4 ? 'urgent' : 'soon'} className="ml-1">
                  {patient.acuityScore}
                </Badge>
              </div>
            </div>
          </div>

          {/* Escalation Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Escalation</label>
            <div className="grid grid-cols-2 gap-2">
              {escalationReasons.map((r) => (
                <Button
                  key={r.value}
                  variant={reason === r.value ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setReason(r.value)}
                  className="h-auto py-3 flex flex-col items-start gap-1"
                >
                  <span className="font-semibold">{r.label}</span>
                  <Badge
                    variant={
                      r.urgency === 'critical'
                        ? 'urgent'
                        : r.urgency === 'urgent'
                        ? 'soon'
                        : 'routine'
                    }
                    className="text-xs"
                  >
                    {r.urgency}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Details</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide any additional context..."
              className="w-full min-h-[100px] p-3 rounded-lg border border-input bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Current Vitals */}
          {patient.vitals && (
            <div className="p-4 rounded-lg border">
              <p className="text-sm font-semibold mb-2">Current Vitals</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {patient.vitals.temperature && (
                  <div>
                    <span className="text-muted-foreground">Temp:</span>
                    <span className="ml-1 font-medium">{patient.vitals.temperature}°F</span>
                  </div>
                )}
                {patient.vitals.heartRate && (
                  <div>
                    <span className="text-muted-foreground">HR:</span>
                    <span className="ml-1 font-medium">{patient.vitals.heartRate} bpm</span>
                  </div>
                )}
                {patient.vitals.bloodPressure && (
                  <div>
                    <span className="text-muted-foreground">BP:</span>
                    <span className="ml-1 font-medium">{patient.vitals.bloodPressure}</span>
                  </div>
                )}
                {patient.vitals.spo2 && (
                  <div>
                    <span className="text-muted-foreground">SpO2:</span>
                    <span className="ml-1 font-medium">{patient.vitals.spo2}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
            Cancel
          </Button>
          <Button
            onClick={handleEscalate}
            disabled={!reason}
            size="lg"
            variant={selectedReason?.urgency === 'critical' ? 'destructive' : 'default'}
            className="touch-target"
          >
            <Phone className="w-4 h-4 mr-2" />
            {selectedReason?.urgency === 'critical' ? 'Emergency Escalation' : 'Escalate Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
