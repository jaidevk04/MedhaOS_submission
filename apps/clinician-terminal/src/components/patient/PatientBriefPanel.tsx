'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { QueuePatient } from '@/types/patient';
import {
  User,
  AlertTriangle,
  Calendar,
  Pill,
  Activity,
  FileText,
  Clock,
  MapPin,
  Phone,
  TestTube,
} from 'lucide-react';

interface PatientBriefPanelProps {
  patient: QueuePatient | null;
  className?: string;
}

export function PatientBriefPanel({ patient, className = '' }: PatientBriefPanelProps) {
  if (!patient) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <User className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No Patient Selected</p>
          <p className="text-sm mt-2">Select a patient from the queue to view their details</p>
        </div>
      </Card>
    );
  }

  const { patient: patientData, urgency_score, chief_complaint, triage_data, recent_diagnostics } = patient;
  const { demographics, medical_history, allergies, current_medications } = patientData;

  // Calculate urgency level and color
  const getUrgencyLevel = (score: number) => {
    if (score >= 70) return { level: 'CRITICAL', color: 'bg-red-500', textColor: 'text-red-600' };
    if (score >= 50) return { level: 'URGENT', color: 'bg-orange-500', textColor: 'text-orange-600' };
    return { level: 'ROUTINE', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const urgencyInfo = getUrgencyLevel(urgency_score);

  // Format time ago
  const getTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold mb-1">AI-Synthesized Patient Brief</h2>
        <p className="text-sm text-muted-foreground">Real-time patient context</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Patient Demographics */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{demographics.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {demographics.age}y • {demographics.gender.charAt(0).toUpperCase() + demographics.gender.slice(1)}
                </p>
              </div>
              <User className="w-12 h-12 text-muted-foreground opacity-20" />
            </div>
            
            {patientData.abha_id && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">ABHA:</span>
                <span className="font-mono">{patientData.abha_id}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm mt-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{demographics.contact.phone}</span>
            </div>

            <div className="flex items-center gap-2 text-sm mt-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {demographics.address.district}, {demographics.address.state}
              </span>
            </div>
          </div>

          <Separator />

          {/* Urgency Score */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Urgency Score</h4>
              <Badge variant="outline" className={urgencyInfo.textColor}>
                {urgencyInfo.level}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{urgency_score}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <Progress value={urgency_score} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Chief Complaint */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Chief Complaint</h4>
            <p className="text-sm">{chief_complaint}</p>
            {triage_data.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {triage_data.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {symptom}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Clock className="w-3 h-3" />
              <span>Triage: {getTimeAgo(triage_data.triage_timestamp)}</span>
            </div>
          </div>

          <Separator />

          {/* Medical History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              <h4 className="text-sm font-semibold">Medical History</h4>
            </div>
            
            {medical_history.length > 0 ? (
              <div className="space-y-2">
                {medical_history.map((condition, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{condition.condition}</span>
                        <Badge 
                          variant={condition.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {condition.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Diagnosed: {new Date(condition.diagnosed_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No significant medical history</p>
            )}
          </div>

          <Separator />

          {/* Allergies */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h4 className="text-sm font-semibold text-red-600">ALLERGIES</h4>
            </div>
            
            {allergies.length > 0 ? (
              <div className="space-y-2">
                {allergies.map((allergy, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-red-700">{allergy}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No known allergies</p>
            )}
          </div>

          <Separator />

          {/* Current Medications */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4" />
              <h4 className="text-sm font-semibold">Current Medications</h4>
            </div>
            
            {current_medications.length > 0 ? (
              <div className="space-y-2">
                {current_medications.map((medication, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{medication.drug_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {medication.dosage} • {medication.frequency}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Since: {new Date(medication.start_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No current medications</p>
            )}
          </div>

          <Separator />

          {/* Recent Vitals */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4" />
              <h4 className="text-sm font-semibold">Recent Vitals</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {triage_data.vitals.blood_pressure && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Blood Pressure</p>
                  <p className="text-lg font-semibold mt-1">{triage_data.vitals.blood_pressure}</p>
                  <p className="text-xs text-muted-foreground">mmHg</p>
                </div>
              )}
              
              {triage_data.vitals.heart_rate && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Heart Rate</p>
                  <p className="text-lg font-semibold mt-1">{triage_data.vitals.heart_rate}</p>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </div>
              )}
              
              {triage_data.vitals.temperature && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className="text-lg font-semibold mt-1">{triage_data.vitals.temperature}°</p>
                  <p className="text-xs text-muted-foreground">Celsius</p>
                </div>
              )}
              
              {triage_data.vitals.spo2 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">SpO2</p>
                  <p className="text-lg font-semibold mt-1">{triage_data.vitals.spo2}%</p>
                  <p className="text-xs text-muted-foreground">Oxygen</p>
                </div>
              )}
              
              {triage_data.vitals.respiratory_rate && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Resp. Rate</p>
                  <p className="text-lg font-semibold mt-1">{triage_data.vitals.respiratory_rate}</p>
                  <p className="text-xs text-muted-foreground">breaths/min</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Diagnostics */}
          {recent_diagnostics && recent_diagnostics.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TestTube className="w-4 h-4" />
                  <h4 className="text-sm font-semibold">Recent Diagnostics</h4>
                </div>
                
                <div className="space-y-3">
                  {recent_diagnostics.map((diagnostic, index) => {
                    const statusColors = {
                      normal: 'bg-green-50 border-green-200',
                      abnormal: 'bg-orange-50 border-orange-200',
                      critical: 'bg-red-50 border-red-200',
                    };
                    
                    const statusTextColors = {
                      normal: 'text-green-700',
                      abnormal: 'text-orange-700',
                      critical: 'text-red-700',
                    };

                    return (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${statusColors[diagnostic.status]}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{diagnostic.test_type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getTimeAgo(diagnostic.date)}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${statusTextColors[diagnostic.status]}`}
                          >
                            {diagnostic.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <p className="text-sm font-medium mb-1">{diagnostic.result}</p>
                        
                        {diagnostic.notes && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {diagnostic.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
