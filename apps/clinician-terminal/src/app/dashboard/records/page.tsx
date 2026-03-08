'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, Activity, Pill, TestTube, Calendar, User, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { SkeletonTable } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

interface Patient {
  patient_id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  blood_group?: string;
  phone: string;
  email?: string;
  allergies?: Array<{ allergen: string; severity: string }>;
  medical_history?: Array<{ condition: string; diagnosed_date: string; status: string }>;
  medications?: Array<{ drug_name: string; dosage: string; frequency: string; is_active: boolean }>;
}

export default function PatientRecordsPage() {
  const { tokens } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Show mock patient for demo purposes
  useEffect(() => {
    if (!selectedPatient && !searchQuery) {
      const mockPatient: Patient = {
        patient_id: 'mock-001',
        first_name: 'Rajesh',
        last_name: 'Kumar',
        age: 45,
        gender: 'Male',
        blood_group: 'O+',
        phone: '+91-9876543210',
        email: 'rajesh.kumar@example.com',
        allergies: [
          { allergen: 'Penicillin', severity: 'High' },
          { allergen: 'Sulfa drugs', severity: 'Moderate' }
        ],
        medical_history: [
          { condition: 'Type 2 Diabetes', diagnosed_date: '2019-03-15', status: 'Active' },
          { condition: 'Hypertension', diagnosed_date: '2021-06-20', status: 'Active' },
          { condition: 'Migraine', diagnosed_date: '2018-01-10', status: 'Active' }
        ],
        medications: [
          { drug_name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', is_active: true },
          { drug_name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', is_active: true },
          { drug_name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily at night', is_active: true }
        ]
      };
      setSelectedPatient(mockPatient);
    }
  }, []);

  const searchPatients = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/patients?search=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens?.accessToken}`
          }
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPatients(data.patients);
        }
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const loadPatientDetails = async (patientId: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`http://localhost:4000/api/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`
        }
      });
      
      if (res.ok) {
        const patient = await res.json();
        setSelectedPatient(patient);
      }
    } catch (error) {
      console.error('Error loading patient:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
          <p className="text-gray-600">Comprehensive patient health information</p>
        </div>
      </div>

      {/* Patient Search */}
      {!selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Search Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or patient ID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
              />
            </div>
            <Button onClick={searchPatients} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {isSearching ? (
            <div className="mt-4">
              <SkeletonTable rows={3} />
            </div>
          ) : patients.length > 0 ? (
            <div className="mt-4 space-y-2">
              {patients.map((patient) => (
                <div
                  key={patient.patient_id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => loadPatientDetails(patient.patient_id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {patient.age} years • {patient.gender} • {patient.phone}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">View Records</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="mt-4">
              <EmptyState
                icon={User}
                title="No patients found"
                description="Try searching with a different name, phone, or patient ID"
              />
            </div>
          ) : null}
        </CardContent>
        </Card>
      )}

      {/* Patient Details */}
      {isLoadingDetails ? (
        <Card>
          <CardContent className="pt-6">
            <SkeletonTable rows={5} />
          </CardContent>
        </Card>
      ) : selectedPatient ? (
        <>
          {/* Patient Demographics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Patient Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatient(null)}
                >
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-medium">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Age / Gender</div>
                  <div className="font-medium">
                    {selectedPatient.age} / {selectedPatient.gender}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Blood Group</div>
                  <div className="font-medium">{selectedPatient.blood_group || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Contact</div>
                  <div className="font-medium text-sm">{selectedPatient.phone}</div>
                </div>
              </div>
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Allergies</div>
                  <div className="flex gap-2">
                    {selectedPatient.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="destructive">
                        {allergy.allergen}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedPatient.medical_history && selectedPatient.medical_history.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Medical History</div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPatient.medical_history.map((condition, idx) => (
                      <Badge key={idx} variant="secondary">
                        {condition.condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Medications */}
          {selectedPatient.medications && selectedPatient.medications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Current Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedPatient.medications
                    .filter(med => med.is_active)
                    .map((med, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">
                              {med.drug_name} {med.dosage}
                            </div>
                            <div className="text-sm text-gray-600">{med.frequency}</div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <EmptyState
          icon={User}
          title="No patient selected"
          description="Search and select a patient to view their medical records"
        />
      )}
    </div>
  );
}
