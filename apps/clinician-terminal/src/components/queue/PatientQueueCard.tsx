'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { QueuePatient } from '@/types/patient';
import { Clock, User, Activity, AlertCircle, ArrowRight } from 'lucide-react';

interface PatientQueueCardProps {
  patient: QueuePatient;
  onClick?: () => void;
}

export function PatientQueueCard({ patient, onClick }: PatientQueueCardProps) {
  const router = useRouter();
  
  const getUrgencyColor = (score: number) => {
    if (score >= 70) return 'error';
    if (score >= 40) return 'warning';
    return 'default';
  };

  const getUrgencyLabel = (score: number) => {
    if (score >= 70) return 'Critical';
    if (score >= 40) return 'Urgent';
    return 'Routine';
  };

  const formatWaitTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTimeSinceTriage = () => {
    const triageTime = new Date(patient.triage_data.triage_timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - triageTime.getTime()) / 60000);
    return formatWaitTime(diffMinutes);
  };

  const handleViewPatient = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/consultation/${patient.encounter_id}`);
  };

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4"
      style={{
        borderLeftColor:
          patient.urgency_score >= 70
            ? '#ef4444'
            : patient.urgency_score >= 40
            ? '#f59e0b'
            : '#6b7280',
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">
              {patient.patient.demographics.name}
            </h3>
            <Badge variant={getUrgencyColor(patient.urgency_score)}>
              {getUrgencyLabel(patient.urgency_score)} ({patient.urgency_score})
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {patient.patient.demographics.age}y, {patient.patient.demographics.gender}
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              {patient.encounter_type}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-700">
            #{patient.queue_position}
          </div>
          <div className="text-xs text-gray-500">Queue Position</div>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">Chief Complaint:</p>
        <p className="text-sm text-gray-600">{patient.chief_complaint}</p>
      </div>

      {patient.triage_data.symptoms.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Symptoms:</p>
          <div className="flex flex-wrap gap-1">
            {patient.triage_data.symptoms.map((symptom, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {symptom}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <p className="text-gray-500">Vitals:</p>
          <div className="space-y-1">
            {!patient.triage_data.vitals.temperature && 
             !patient.triage_data.vitals.blood_pressure && 
             !patient.triage_data.vitals.heart_rate && 
             !patient.triage_data.vitals.spo2 && (
               <p className="text-gray-400 italic">Not recorded</p>
            )}
            {patient.triage_data.vitals.temperature && (
              <p>Temp: {patient.triage_data.vitals.temperature}°C</p>
            )}
            {patient.triage_data.vitals.blood_pressure && (
              <p>BP: {patient.triage_data.vitals.blood_pressure}</p>
            )}
            {patient.triage_data.vitals.heart_rate && (
              <p>HR: {patient.triage_data.vitals.heart_rate} bpm</p>
            )}
            {patient.triage_data.vitals.spo2 && (
              <p>SpO2: {patient.triage_data.vitals.spo2}%</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-gray-500">Timing:</p>
          <div className="space-y-1">
            {patient.scheduled_time && (
              <p className="flex items-center gap-1 font-medium text-primary-700">
                <Clock className="h-3 w-3" />
                Appt: {new Date(patient.scheduled_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            )}
            <p className="flex items-center gap-1 text-gray-500">
              <Clock className="h-3 w-3" />
              Wait: {getTimeSinceTriage()}
            </p>
          </div>
        </div>
      </div>

      {patient.patient.allergies.length > 0 && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded mb-3">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-800">Allergies:</p>
            <p className="text-xs text-red-700">
              {patient.patient.allergies.join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={onClick}
        >
          Quick View
        </Button>
        <Button 
          size="sm" 
          className="flex-1"
          onClick={handleViewPatient}
        >
          Start Consultation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
