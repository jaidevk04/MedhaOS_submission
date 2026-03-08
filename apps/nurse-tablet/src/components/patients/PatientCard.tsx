import { Card, CardContent } from '@/components/ui/card';
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
  Clock,
} from 'lucide-react';
import { cn, getAcuityColor, getVitalStatusColor, formatTime } from '@/lib/utils';
import type { Patient } from '@/types';

interface PatientCardProps {
  patient: Patient;
  onClick: (patient: Patient) => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const { vitals, alerts, currentMedications } = patient;
  const upcomingMeds = currentMedications.filter(
    (med) => med.status === 'pending' && new Date(med.scheduledTime) <= new Date(Date.now() + 60 * 60 * 1000)
  );
  const criticalAlerts = alerts.filter((a) => a.type === 'critical' && !a.acknowledged);

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-all touch-target',
        criticalAlerts.length > 0 && 'ring-2 ring-urgent animate-pulse'
      )}
      onClick={() => onClick(patient)}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header with Patient Info and Acuity */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{patient.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{patient.age}y</span>
                <span>•</span>
                <span className="capitalize">{patient.gender}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {patient.room} - Bed {patient.bed}
                </span>
              </div>
            </div>
          </div>

          {/* Acuity Score */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl border-4',
                getAcuityColor(patient.acuityScore)
              )}
            >
              {patient.acuityScore}
            </div>
            <span className="text-xs text-muted-foreground mt-1">Acuity</span>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="bg-urgent/10 border border-urgent rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-urgent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-urgent text-sm">Critical Alert</p>
                <p className="text-sm text-urgent/90">{criticalAlerts[0].message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Vital Signs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Vital Signs
            </h4>
            <Badge
              variant={
                vitals.status === 'critical'
                  ? 'urgent'
                  : vitals.status === 'warning'
                  ? 'soon'
                  : 'routine'
              }
            >
              {vitals.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {vitals.temperature && (
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="w-4 h-4 text-muted-foreground" />
                <span>{vitals.temperature}°F</span>
              </div>
            )}
            {vitals.heartRate && (
              <div className="flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4 text-muted-foreground" />
                <span>{vitals.heartRate} bpm</span>
              </div>
            )}
            {vitals.bloodPressure && (
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span>{vitals.bloodPressure}</span>
              </div>
            )}
            {vitals.spo2 && (
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="w-4 h-4 text-muted-foreground" />
                <span>{vitals.spo2}%</span>
              </div>
            )}
            {vitals.respiratoryRate && (
              <div className="flex items-center gap-2 text-sm">
                <Wind className="w-4 h-4 text-muted-foreground" />
                <span>{vitals.respiratoryRate}/min</span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Last updated: {formatTime(vitals.lastUpdated)}
          </p>
        </div>

        {/* Medications Due */}
        {upcomingMeds.length > 0 && (
          <div className="bg-warning/10 border border-warning rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-4 h-4 text-warning" />
              <span className="font-semibold text-sm text-warning">
                {upcomingMeds.length} Medication{upcomingMeds.length > 1 ? 's' : ''} Due
              </span>
            </div>
            <div className="space-y-1">
              {upcomingMeds.slice(0, 2).map((med) => (
                <div key={med.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{med.name}</span>
                  <div className="flex items-center gap-1 text-warning shrink-0">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{formatTime(med.scheduledTime)}</span>
                  </div>
                </div>
              ))}
              {upcomingMeds.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{upcomingMeds.length - 2} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Allergies */}
        {patient.allergies.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-urgent">Allergies:</span>
            {patient.allergies.map((allergy, index) => (
              <Badge key={index} variant="urgent" className="text-xs">
                {allergy}
              </Badge>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 touch-target"
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to vitals entry
            }}
          >
            Update Vitals
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 touch-target"
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to medication administration
            }}
          >
            Medications
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
