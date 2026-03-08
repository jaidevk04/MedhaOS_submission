import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  MapPin,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  Pill,
  FileText,
} from 'lucide-react';
import { formatDateTime, getAcuityColor } from '@/lib/utils';
import type { Patient } from '@/types';

interface PatientDetailsDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientDetailsDialog({
  patient,
  open,
  onOpenChange,
}: PatientDetailsDialogProps) {
  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{patient.name}</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {patient.age} years • {patient.gender} • {patient.room} - Bed {patient.bed}
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl border-4 ${getAcuityColor(
                  patient.acuityScore
                )}`}
              >
                {patient.acuityScore}
              </div>
              <span className="text-xs text-muted-foreground mt-1">Acuity</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Alerts */}
          {patient.alerts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Active Alerts
              </h4>
              <div className="space-y-2">
                {patient.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.type === 'critical'
                        ? 'bg-urgent/10 border-urgent'
                        : alert.type === 'warning'
                        ? 'bg-warning/10 border-warning'
                        : 'bg-info/10 border-info'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(alert.timestamp)}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vital Signs */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Vital Signs
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {patient.vitals.temperature && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Temperature</span>
                  </div>
                  <p className="text-xl font-semibold">{patient.vitals.temperature}°F</p>
                </div>
              )}
              {patient.vitals.heartRate && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Heart Rate</span>
                  </div>
                  <p className="text-xl font-semibold">{patient.vitals.heartRate} bpm</p>
                </div>
              )}
              {patient.vitals.bloodPressure && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Blood Pressure</span>
                  </div>
                  <p className="text-xl font-semibold">{patient.vitals.bloodPressure}</p>
                </div>
              )}
              {patient.vitals.spo2 && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">SpO2</span>
                  </div>
                  <p className="text-xl font-semibold">{patient.vitals.spo2}%</p>
                </div>
              )}
              {patient.vitals.respiratoryRate && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Respiratory Rate</span>
                  </div>
                  <p className="text-xl font-semibold">{patient.vitals.respiratoryRate}/min</p>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Last updated: {formatDateTime(patient.vitals.lastUpdated)}
            </p>
          </div>

          {/* Current Medications */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Current Medications
            </h4>
            <div className="space-y-2">
              {patient.currentMedications.map((med) => (
                <div key={med.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold">{med.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {med.dosage} • {med.route} • {med.frequency}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scheduled: {formatDateTime(med.scheduledTime)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        med.status === 'administered'
                          ? 'routine'
                          : med.status === 'pending'
                          ? 'soon'
                          : 'urgent'
                      }
                    >
                      {med.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allergies */}
          {patient.allergies.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg text-urgent">Allergies</h4>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, index) => (
                  <Badge key={index} variant="urgent" className="text-sm px-3 py-1">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
