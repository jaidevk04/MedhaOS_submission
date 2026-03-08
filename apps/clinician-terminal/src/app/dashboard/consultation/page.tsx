'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Activity, FileText, Pill, AlertTriangle, Clock } from 'lucide-react';

export default function ConsultationPage() {
  const currentPatient = {
    name: 'Rajesh Kumar',
    age: 45,
    gender: 'Male',
    mrn: 'MRN-2024-001234',
    chiefComplaint: 'Severe headache for 3 days',
    urgencyScore: 75,
    urgencyLevel: 'high',
    allergies: ['Penicillin'],
    vitals: {
      bp: '130/85 mmHg',
      hr: '78 bpm',
      temp: '98.6°F',
      spo2: '98%',
      rr: '16/min',
    },
    currentMedications: [
      'Metformin 500mg - Twice daily',
      'Amlodipine 5mg - Once daily',
    ],
    recentLabs: [
      { test: 'HbA1c', value: '7.2%', date: '2 weeks ago', status: 'elevated' },
      { test: 'Lipid Panel', value: 'Normal', date: '1 month ago', status: 'normal' },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {currentPatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentPatient.name}</h1>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>{currentPatient.age} years • {currentPatient.gender}</span>
                  <span>MRN: {currentPatient.mrn}</span>
                </div>
                <div className="mt-2">
                  <Badge variant={currentPatient.urgencyLevel === 'high' ? 'destructive' : 'default'}>
                    Urgency Score: {currentPatient.urgencyScore}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Chief Complaint</div>
              <div className="font-medium mt-1">{currentPatient.chiefComplaint}</div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline">
                  <Clock className="h-4 w-4 mr-1" />
                  History
                </Button>
                <Button size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Start Consultation
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="labs">Lab Results</TabsTrigger>
          <TabsTrigger value="imaging">Imaging</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Allergies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentPatient.allergies.length > 0 ? (
                  <div className="space-y-2">
                    {currentPatient.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="destructive" className="mr-2">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No known allergies</p>
                )}
              </CardContent>
            </Card>

            {/* Current Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Pill className="h-5 w-5 text-blue-500" />
                  Current Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentPatient.currentMedications.map((med, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium">{med.split(' - ')[0]}</div>
                      <div className="text-gray-600">{med.split(' - ')[1]}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Labs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5 text-green-500" />
                  Recent Labs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentPatient.recentLabs.map((lab, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{lab.test}</span>
                        <Badge variant={lab.status === 'elevated' ? 'destructive' : 'secondary'}>
                          {lab.value}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{lab.date}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clinical Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">History of Present Illness</h4>
                  <p className="text-sm text-gray-600">
                    Patient reports severe throbbing headache on the right side for the past 3 days. 
                    Pain is worse with bright lights and loud noises. Associated with nausea but no vomiting. 
                    No fever, no neck stiffness. Similar episodes in the past, diagnosed as migraine.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Past Medical History</h4>
                  <p className="text-sm text-gray-600">
                    Type 2 Diabetes Mellitus (5 years), Hypertension (3 years), Migraine (recurrent)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                  <Button variant="outline" size="sm">
                    View Full History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle>Current Vital Signs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-6">
                {Object.entries(currentPatient.vitals).map(([key, value]) => (
                  <div key={key} className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 uppercase mb-2">
                      {key === 'bp' ? 'Blood Pressure' :
                       key === 'hr' ? 'Heart Rate' :
                       key === 'temp' ? 'Temperature' :
                       key === 'spo2' ? 'SpO2' :
                       'Resp. Rate'}
                    </div>
                    <div className="text-2xl font-bold">{value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle>Medication History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Complete medication history will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labs">
          <Card>
            <CardHeader>
              <CardTitle>Laboratory Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Complete lab results will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imaging">
          <Card>
            <CardHeader>
              <CardTitle>Imaging Studies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Imaging studies will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Start Ambient Scribe
            </Button>
            <Button variant="outline">
              <Pill className="h-4 w-4 mr-2" />
              Prescribe Medication
            </Button>
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Order Tests
            </Button>
            <Button variant="outline">
              View CDSS Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
