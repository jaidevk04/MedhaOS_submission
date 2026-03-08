'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, FileText, Image, Activity, User,
  TestTube, Clock, CheckCircle, Loader2, X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { SkeletonTable } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

interface DiagnosticTest {
  test_name: string;
  category: string;
  turnaround: string;
  reason?: string;
}

interface Patient {
  patient_id: string;
  name: string;
  age: number;
  gender: string;
}

interface PendingOrder {
  test_name: string;
  status: 'pending' | 'in-progress' | 'completed';
  ordered_at: string;
  priority: 'routine' | 'urgent' | 'stat';
}

export default function DiagnosticsPage() {
  const { tokens } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [selectedTests, setSelectedTests] = useState<DiagnosticTest[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showPatientSearch, setShowPatientSearch] = useState(false); // Start with patient visible

  // Show mock patient and demo orders by default
  useEffect(() => {
    if (!selectedPatient) {
      const mockPatient: Patient = {
        patient_id: 'mock-001',
        name: 'Rajesh Kumar',
        age: 45,
        gender: 'Male'
      };
      setSelectedPatient(mockPatient);
      
      // Add demo pending orders
      setPendingOrders([
        {
          test_name: 'HbA1c (Hemoglobin A1C)',
          status: 'pending',
          ordered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          priority: 'routine'
        },
        {
          test_name: 'Lipid Panel',
          status: 'in-progress',
          ordered_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          priority: 'routine'
        },
        {
          test_name: 'Complete Blood Count (CBC)',
          status: 'completed',
          ordered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'routine'
        }
      ]);
    }
  }, []);

  // Comprehensive test catalog
  const testCatalog = [
    // Hematology
    { test_name: 'Complete Blood Count (CBC)', category: 'Hematology', turnaround: '2-4 hours', icon: Activity },
    { test_name: 'CBC with Differential', category: 'Hematology', turnaround: '2-4 hours', icon: Activity },
    { test_name: 'Hemoglobin A1C', category: 'Hematology', turnaround: '4-6 hours', icon: Activity },
    { test_name: 'Prothrombin Time (PT/INR)', category: 'Hematology', turnaround: '2-3 hours', icon: Activity },
    { test_name: 'ESR (Erythrocyte Sedimentation Rate)', category: 'Hematology', turnaround: '1-2 hours', icon: Activity },
    
    // Chemistry
    { test_name: 'Basic Metabolic Panel', category: 'Chemistry', turnaround: '2-4 hours', icon: TestTube },
    { test_name: 'Comprehensive Metabolic Panel', category: 'Chemistry', turnaround: '2-4 hours', icon: TestTube },
    { test_name: 'Lipid Panel', category: 'Chemistry', turnaround: '4-6 hours', icon: TestTube },
    { test_name: 'Liver Function Test (LFT)', category: 'Chemistry', turnaround: '4-6 hours', icon: TestTube },
    { test_name: 'Kidney Function Test (KFT)', category: 'Chemistry', turnaround: '4-6 hours', icon: TestTube },
    { test_name: 'Thyroid Function Test (TFT)', category: 'Chemistry', turnaround: '6-8 hours', icon: TestTube },
    { test_name: 'Blood Glucose (Fasting)', category: 'Chemistry', turnaround: '1-2 hours', icon: TestTube },
    { test_name: 'Blood Glucose (Random)', category: 'Chemistry', turnaround: '30 min', icon: TestTube },
    
    // Radiology
    { test_name: 'Chest X-Ray', category: 'Radiology', turnaround: '1-2 hours', icon: Image },
    { test_name: 'Abdominal X-Ray', category: 'Radiology', turnaround: '1-2 hours', icon: Image },
    { test_name: 'CT Scan - Head', category: 'Radiology', turnaround: '2-4 hours', icon: Image },
    { test_name: 'CT Scan - Chest', category: 'Radiology', turnaround: '2-4 hours', icon: Image },
    { test_name: 'CT Scan - Abdomen', category: 'Radiology', turnaround: '2-4 hours', icon: Image },
    { test_name: 'MRI - Brain', category: 'Radiology', turnaround: '4-6 hours', icon: Image },
    { test_name: 'MRI - Spine', category: 'Radiology', turnaround: '4-6 hours', icon: Image },
    { test_name: 'Ultrasound - Abdomen', category: 'Radiology', turnaround: '1-2 hours', icon: Image },
    { test_name: 'Ultrasound - Pelvis', category: 'Radiology', turnaround: '1-2 hours', icon: Image },
    { test_name: 'ECG (Electrocardiogram)', category: 'Radiology', turnaround: '15-30 min', icon: Activity },
    
    // Microbiology
    { test_name: 'Urine Culture', category: 'Microbiology', turnaround: '24-48 hours', icon: TestTube },
    { test_name: 'Blood Culture', category: 'Microbiology', turnaround: '24-72 hours', icon: TestTube },
    { test_name: 'Throat Swab Culture', category: 'Microbiology', turnaround: '24-48 hours', icon: TestTube },
    
    // Serology
    { test_name: 'HIV Test', category: 'Serology', turnaround: '4-6 hours', icon: TestTube },
    { test_name: 'Hepatitis B Surface Antigen', category: 'Serology', turnaround: '4-6 hours', icon: TestTube },
    { test_name: 'Hepatitis C Antibody', category: 'Serology', turnaround: '4-6 hours', icon: TestTube },
    
    // Urinalysis
    { test_name: 'Urinalysis (Routine)', category: 'Urinalysis', turnaround: '1-2 hours', icon: TestTube },
    { test_name: 'Urine Microscopy', category: 'Urinalysis', turnaround: '2-3 hours', icon: TestTube },
  ];

  const filteredTests = testCatalog.filter(test =>
    test.test_name.toLowerCase().includes(testSearch.toLowerCase()) ||
    test.category.toLowerCase().includes(testSearch.toLowerCase())
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
            gender: p.gender
          })));
        }
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  // Select patient
  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSearch(false);
  };

  // Add test
  const addTest = (test: typeof testCatalog[0]) => {
    const newTest: DiagnosticTest = {
      test_name: test.test_name,
      category: test.category,
      turnaround: test.turnaround,
      reason: ''
    };
    setSelectedTests([...selectedTests, newTest]);
  };

  // Remove test
  const removeTest = (index: number) => {
    setSelectedTests(selectedTests.filter((_, i) => i !== index));
  };

  // Order tests
  const orderTests = async () => {
    if (!selectedPatient || selectedTests.length === 0) return;
    
    setIsOrdering(true);
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll simulate the order
      const newOrders: PendingOrder[] = selectedTests.map(test => ({
        test_name: test.test_name,
        status: 'pending',
        ordered_at: new Date().toISOString(),
        priority: 'routine'
      }));
      
      setPendingOrders([...newOrders, ...pendingOrders]);
      setSelectedTests([]);
      
      alert('Tests ordered successfully!');
    } catch (error) {
      console.error('Error ordering tests:', error);
      alert('Failed to order tests');
    } finally {
      setIsOrdering(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Radiology':
        return Image;
      case 'Hematology':
      case 'Chemistry':
      case 'Microbiology':
      case 'Serology':
      case 'Urinalysis':
        return TestTube;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diagnostic Orders</h1>
          <p className="text-gray-600">Order and track diagnostic tests</p>
        </div>
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
                    onClick={() => selectPatient(patient)}
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
                description="Search for a patient to order diagnostic tests"
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
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPatientSearch(true);
                  setSelectedPatient(null);
                  setSelectedTests([]);
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
          {/* Test Search */}
          <Card>
            <CardHeader>
              <CardTitle>Order New Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search diagnostic tests..."
                    className="pl-10"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredTests.map((test, idx) => {
                  const Icon = getCategoryIcon(test.category);
                  return (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => addTest(test)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3 flex-1">
                          <Icon className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{test.test_name}</div>
                            <div className="text-xs text-gray-600">{test.category}</div>
                            <div className="text-xs text-gray-500 mt-1">TAT: {test.turnaround}</div>
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Tests */}
          {selectedTests.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Selected Tests ({selectedTests.length})</CardTitle>
                  <Button onClick={orderTests} disabled={isOrdering}>
                    {isOrdering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Ordering...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Order All Tests
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedTests.map((test, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{test.test_name}</h3>
                            <Badge variant="outline">{test.category}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Turnaround: {test.turnaround}
                          </div>
                          <Input
                            placeholder="Reason for test (optional)"
                            value={test.reason}
                            onChange={(e) => {
                              const updated = [...selectedTests];
                              updated[idx].reason = e.target.value;
                              setSelectedTests(updated);
                            }}
                            className="h-8"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTest(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingOrders.map((order, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{order.test_name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Ordered {new Date(order.ordered_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <Badge variant="outline">{order.priority}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
