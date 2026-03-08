'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, AlertTriangle, CheckCircle, Printer, 
  X, Loader2, User, ShieldAlert, Brain, Pill
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { SkeletonTable } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

interface Medication {
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
  status?: 'safe' | 'warning' | 'danger';
}

interface Patient {
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  allergies: string[];
  current_medications: Medication[];
}

interface DrugInteraction {
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

interface SafetyCheck {
  has_interactions: boolean;
  interactions: DrugInteraction[];
  has_allergy_conflict: boolean;
  conflicting_allergies: string[];
  recommendations: string;
}

export default function PrescriptionsPage() {
  const { tokens } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [drugSearch, setDrugSearch] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheck | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const [showPatientSearch, setShowPatientSearch] = useState(false); // Start with patient visible

  // Show mock patient and demo medications by default
  useEffect(() => {
    if (!selectedPatient) {
      const mockPatient: Patient = {
        patient_id: 'mock-001',
        name: 'Rajesh Kumar',
        age: 45,
        gender: 'Male',
        allergies: ['Penicillin'],
        current_medications: [
          { drug_name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: 'Ongoing', is_active: true },
          { drug_name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: 'Ongoing', is_active: true }
        ]
      };
      setSelectedPatient(mockPatient);
      
      // Add current medications as demo
      setMedications([
        {
          drug_name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: 'Ongoing',
          route: 'oral',
          instructions: 'Take with meals',
          status: 'safe'
        },
        {
          drug_name: 'Amlodipine',
          dosage: '5mg',
          frequency: 'Once daily',
          duration: 'Ongoing',
          route: 'oral',
          instructions: 'Take in the morning',
          status: 'safe'
        }
      ]);
    }
  }, []);

  const drugDatabase = [
    { name: 'Paracetamol', dosage: '500mg', category: 'Analgesic', route: 'oral' },
    { name: 'Ibuprofen', dosage: '400mg', category: 'NSAID', route: 'oral' },
    { name: 'Amoxicillin', dosage: '500mg', category: 'Antibiotic', route: 'oral' },
    { name: 'Azithromycin', dosage: '250mg', category: 'Antibiotic', route: 'oral' },
    { name: 'Metformin', dosage: '500mg', category: 'Antidiabetic', route: 'oral' },
    { name: 'Amlodipine', dosage: '5mg', category: 'Antihypertensive', route: 'oral' },
    { name: 'Atorvastatin', dosage: '10mg', category: 'Statin', route: 'oral' },
    { name: 'Omeprazole', dosage: '20mg', category: 'PPI', route: 'oral' },
    { name: 'Cetirizine', dosage: '10mg', category: 'Antihistamine', route: 'oral' },
    { name: 'Salbutamol', dosage: '100mcg', category: 'Bronchodilator', route: 'inhaled' },
    { name: 'Aspirin', dosage: '75mg', category: 'Antiplatelet', route: 'oral' },
    { name: 'Losartan', dosage: '50mg', category: 'Antihypertensive', route: 'oral' },
    { name: 'Levothyroxine', dosage: '50mcg', category: 'Thyroid', route: 'oral' },
    { name: 'Pantoprazole', dosage: '40mg', category: 'PPI', route: 'oral' },
    { name: 'Montelukast', dosage: '10mg', category: 'Antiasthmatic', route: 'oral' },
  ];

  const filteredDrugs = drugDatabase.filter(drug =>
    drug.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
    drug.category.toLowerCase().includes(drugSearch.toLowerCase())
  );

  // Search patients
  const searchPatients = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoadingPatients(true);
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
          setPatients(data.patients.map((p: any) => ({
            patient_id: p.patient_id,
            name: `${p.first_name} ${p.last_name}`,
            age: p.age,
            gender: p.gender,
            allergies: [],
            current_medications: []
          })));
        }
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  // Load patient details
  const loadPatientDetails = async (patientId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`
        }
      });
      
      if (res.ok) {
        const patient = await res.json();
        setSelectedPatient({
          patient_id: patient.patient_id,
          name: `${patient.first_name} ${patient.last_name}`,
          age: patient.age,
          gender: patient.gender,
          allergies: patient.allergies?.map((a: any) => a.allergen) || [],
          current_medications: patient.medications || []
        });
        setShowPatientSearch(false);
      }
    } catch (error) {
      console.error('Error loading patient:', error);
    }
  };

  // Add medication
  const addMedication = (drug: typeof drugDatabase[0]) => {
    const newMed: Medication = {
      drug_name: drug.name,
      dosage: drug.dosage,
      frequency: 'Twice daily',
      duration: '5 days',
      route: drug.route,
      instructions: 'Take after food',
      status: 'safe'
    };
    setMedications([...medications, newMed]);
  };

  // Remove medication
  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  // Check safety
  const checkSafety = async () => {
    if (!selectedPatient || medications.length === 0) return;
    
    setIsCheckingSafety(true);
    try {
      // Check drug interactions
      const interactionRes = await fetch('http://localhost:4000/api/drugs/check-interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`
        },
        body: JSON.stringify({
          drugs: medications.map(m => m.drug_name),
          patient_medications: selectedPatient.current_medications.map(m => m.drug_name)
        })
      });

      let interactionData = { has_interactions: false, interactions: [], recommendations: '' };
      if (interactionRes.ok) {
        const data = await interactionRes.json();
        if (data.success) {
          interactionData = data;
        }
      }

      // Check allergies for each drug
      let hasAllergyConflict = false;
      let conflictingAllergies: string[] = [];

      for (const med of medications) {
        const allergyRes = await fetch('http://localhost:4000/api/drugs/check-allergies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens?.accessToken}`
          },
          body: JSON.stringify({
            drug: med.drug_name,
            patient_allergies: selectedPatient.allergies.map(a => ({ allergen: a }))
          })
        });

        if (allergyRes.ok) {
          const data = await allergyRes.json();
          if (data.success && data.has_conflict) {
            hasAllergyConflict = true;
            conflictingAllergies.push(...data.conflicting_allergies.map((a: any) => a.allergen));
          }
        }
      }

      setSafetyChecks({
        has_interactions: interactionData.has_interactions,
        interactions: interactionData.interactions,
        has_allergy_conflict: hasAllergyConflict,
        conflicting_allergies: [...new Set(conflictingAllergies)],
        recommendations: interactionData.recommendations
      });

      // Update medication statuses
      setMedications(medications.map(med => ({
        ...med,
        status: hasAllergyConflict ? 'danger' : 
                interactionData.has_interactions ? 'warning' : 'safe'
      })));

    } catch (error) {
      console.error('Error checking safety:', error);
    } finally {
      setIsCheckingSafety(false);
    }
  };

  // Auto-check safety when medications change
  useEffect(() => {
    if (selectedPatient && medications.length > 0) {
      checkSafety();
    } else {
      setSafetyChecks(null);
    }
  }, [medications.length]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescription Assistant</h1>
          <p className="text-gray-600">AI-powered drug safety checking</p>
        </div>
        {selectedPatient && medications.length > 0 && (
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Prescription
          </Button>
        )}
      </div>

      {/* Patient Selection */}
      {showPatientSearch ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
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
              <Button onClick={searchPatients} disabled={isLoadingPatients}>
                {isLoadingPatients ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>

            {isLoadingPatients ? (
              <SkeletonTable rows={3} />
            ) : patients.length > 0 ? (
              <div className="space-y-2">
                {patients.map((patient) => (
                  <div
                    key={patient.patient_id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => loadPatientDetails(patient.patient_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-gray-600">
                          {patient.age} years • {patient.gender}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Select</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={User}
                title="No patients found"
                description="Search for a patient to start prescribing medications"
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {selectedPatient?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedPatient?.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedPatient?.age} years • {selectedPatient?.gender}
                  </p>
                  {selectedPatient && selectedPatient.allergies.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {selectedPatient.allergies.map((allergy, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPatientSearch(true);
                  setSelectedPatient(null);
                  setMedications([]);
                  setSafetyChecks(null);
                }}
              >
                Change Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPatient && (
        <>
          {/* Drug Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Add Medication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search medications..."
                    className="pl-10"
                    value={drugSearch}
                    onChange={(e) => setDrugSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {filteredDrugs.map((drug, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => addMedication(drug)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{drug.name} {drug.dosage}</div>
                        <div className="text-xs text-gray-600">{drug.category}</div>
                      </div>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Prescription */}
          <Card>
            <CardHeader>
              <CardTitle>Current Prescription</CardTitle>
            </CardHeader>
            <CardContent>
              {medications.length === 0 ? (
                <EmptyState
                  icon={Pill}
                  title="No medications added"
                  description="Search and add medications from the list above"
                />
              ) : (
                <div className="space-y-3">
                  {medications.map((med, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{med.drug_name} {med.dosage}</h3>
                            {med.status === 'safe' && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Safe
                              </Badge>
                            )}
                            {med.status === 'warning' && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Warning
                              </Badge>
                            )}
                            {med.status === 'danger' && (
                              <Badge variant="destructive">
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Danger
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Frequency:</span>
                              <Input
                                value={med.frequency}
                                onChange={(e) => {
                                  const updated = [...medications];
                                  updated[idx].frequency = e.target.value;
                                  setMedications(updated);
                                }}
                                className="mt-1 h-8"
                              />
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span>
                              <Input
                                value={med.duration}
                                onChange={(e) => {
                                  const updated = [...medications];
                                  updated[idx].duration = e.target.value;
                                  setMedications(updated);
                                }}
                                className="mt-1 h-8"
                              />
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium">Instructions:</span>
                              <Input
                                value={med.instructions}
                                onChange={(e) => {
                                  const updated = [...medications];
                                  updated[idx].instructions = e.target.value;
                                  setMedications(updated);
                                }}
                                className="mt-1 h-8"
                                placeholder="e.g., Take after food"
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedication(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Safety Checks */}
          {medications.length > 0 && (
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  AI Safety Checks
                  {isCheckingSafety && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {safetyChecks ? (
                  <div className="space-y-4">
                    {/* Drug Interactions */}
                    <div className="flex items-start gap-3">
                      {safetyChecks.has_interactions ? (
                        <>
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-yellow-800">Drug Interactions Detected</p>
                            <div className="mt-2 space-y-2">
                              {safetyChecks.interactions.map((interaction, i) => (
                                <div key={i} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <Badge variant="outline" className="mb-1">
                                    {interaction.severity}
                                  </Badge>
                                  <p className="text-sm text-yellow-800">{interaction.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-700">No drug-drug interactions detected</span>
                        </>
                      )}
                    </div>

                    {/* Allergy Conflicts */}
                    <div className="flex items-start gap-3">
                      {safetyChecks.has_allergy_conflict ? (
                        <>
                          <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-red-800">Allergy Conflict Detected</p>
                            <p className="text-sm text-red-700 mt-1">
                              Patient is allergic to: {safetyChecks.conflicting_allergies.join(', ')}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-700">No allergy conflicts</span>
                        </>
                      )}
                    </div>

                    {/* AI Recommendations */}
                    {safetyChecks.recommendations && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-900 mb-2">AI Recommendations:</p>
                        <p className="text-sm text-blue-800">{safetyChecks.recommendations}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Running safety checks...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
