'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  MicOff, 
  Save, 
  Send, 
  FileText, 
  Pill, 
  TestTube,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  Stethoscope
} from 'lucide-react';
import { PatientBriefPanel } from '@/components/patient/PatientBriefPanel';
import type { QueuePatient } from '@/types/patient';

export default function ConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const { tokens } = useAuthStore();
  const encounterId = params.encounterId as string;

  const [patient, setPatient] = useState<QueuePatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [soapNote, setSoapNote] = useState<any>(null);
  const [cdssRecommendations, setCdssRecommendations] = useState<any>(null);
  const [generatingSOAP, setGeneratingSOAP] = useState(false);
  const [generatingCDSS, setGeneratingCDSS] = useState(false);
  const [savingEncounter, setSavingEncounter] = useState(false);

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Demo transcript for testing
  const demoTranscript = `Patient: I've been having severe headaches for the past 3 days.
Doctor: Can you describe the pain? Is it throbbing or constant?
Patient: It's a throbbing pain, mostly on the right side of my head. It gets worse with bright lights.
Doctor: Any nausea or vomiting?
Patient: Yes, I feel nauseous but haven't vomited.
Doctor: Have you had similar headaches before?
Patient: Yes, I was diagnosed with migraines a few years ago.
Doctor: Are you taking any medications currently?
Patient: I'm taking Metformin for diabetes and Amlodipine for blood pressure.
Doctor: Any allergies?
Patient: Yes, I'm allergic to Penicillin.
Doctor: Let me check your vitals. Blood pressure is 130/85, heart rate 88, temperature 98.6°F.
Patient: What do you think it is?
Doctor: Based on your symptoms and history, this appears to be a migraine attack. I'll prescribe Sumatriptan 50mg for the acute pain.`;

  useEffect(() => {
    fetchPatientData();
  }, [encounterId]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // TODO: Fetch actual patient data from API
      // For now, using mock data
      const mockPatient: QueuePatient = {
        encounter_id: encounterId,
        patient: {
          patient_id: 'pat-001',
          abha_id: '12-3456-7890-1234',
          demographics: {
            name: 'Ramesh Kumar',
            age: 45,
            gender: 'male',
            language_preference: 'Hindi',
            contact: {
              phone: '+91-9876543210',
            },
            address: {
              district: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001',
            },
          },
          medical_history: [
            {
              condition: 'Type 2 Diabetes',
              diagnosed_date: '2020-03-15',
              status: 'active',
            },
          ],
          allergies: ['Penicillin'],
          current_medications: [
            {
              drug_name: 'Metformin',
              dosage: '500mg',
              frequency: 'Twice daily',
              start_date: '2020-03-15',
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        encounter_type: 'OPD',
        urgency_score: 65,
        chief_complaint: 'Persistent cough and fever for 3 days',
        triage_data: {
          symptoms: ['cough', 'fever', 'fatigue'],
          vitals: {
            temperature: 38.5,
            blood_pressure: '130/85',
            heart_rate: 88,
            spo2: 96,
          },
          triage_timestamp: new Date().toISOString(),
        },
        status: 'in_progress' as const,
        queue_position: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setPatient(mockPatient);
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000'}/api/clinical/transcribe`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        setTranscript((prev) => prev + ' ' + data.transcript);
      }
    } catch (error) {
      console.error('Transcription failed:', error);
    }
  };

  const generateSOAPNote = async () => {
    if (!transcript.trim()) {
      alert('Please record or enter consultation notes first');
      return;
    }

    setGeneratingSOAP(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000'}/api/clinical/scribe/generate-soap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            transcript,
            patient_context: {
              demographics: patient?.patient.demographics,
              medical_history: patient?.patient.medical_history,
              current_medications: patient?.patient.current_medications,
              allergies: patient?.patient.allergies,
              chief_complaint: patient?.chief_complaint,
              vitals: patient?.triage_data.vitals,
            },
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSoapNote(data.soap);  // Backend returns 'soap', not 'soap_note'
      } else {
        alert('Failed to generate SOAP note: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to generate SOAP note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to generate SOAP note: ' + errorMessage);
    } finally {
      setGeneratingSOAP(false);
    }
  };

  const generateCDSS = async () => {
    if (!soapNote) {
      alert('Please generate SOAP note first');
      return;
    }

    setGeneratingCDSS(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000'}/api/clinical/cdss/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            transcript,
            soap_note: soapNote,
            patient_context: {
              demographics: patient?.patient.demographics,
              medical_history: patient?.patient.medical_history,
              current_medications: patient?.patient.current_medications,
              allergies: patient?.patient.allergies,
            },
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setCdssRecommendations(data.analysis);  // Backend returns 'analysis', not 'recommendations'
      } else {
        alert('Failed to generate CDSS recommendations: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to generate CDSS recommendations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to generate clinical recommendations: ' + errorMessage);
    } finally {
      setGeneratingCDSS(false);
    }
  };

  const saveEncounter = async () => {
    if (!soapNote) {
      alert('Please generate SOAP note before saving');
      return;
    }

    setSavingEncounter(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000'}/api/clinical/encounters/${encounterId}/finalize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            soap_note: soapNote,
            transcript,
            cdss_recommendations: cdssRecommendations,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('Encounter saved successfully!');
        router.push('/dashboard/queue');
      }
    } catch (error) {
      console.error('Failed to save encounter:', error);
      alert('Failed to save encounter');
    } finally {
      setSavingEncounter(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-lg text-gray-700">Patient not found</p>
        <Button onClick={() => router.push('/dashboard/queue')} className="mt-4">
          Back to Queue
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/queue')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queue
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Consultation: {patient.patient.demographics.name}
            </h1>
            <p className="text-sm text-gray-600">
              Encounter ID: {encounterId}
            </p>
          </div>
        </div>
        <Badge variant={patient.urgency_score >= 70 ? 'error' : 'warning'}>
          Urgency: {patient.urgency_score}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ambient Scribe */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  AI Ambient Scribe
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isRecording ? 'destructive' : 'default'}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isRecording && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-700">Recording in progress...</span>
                </div>
              )}
              
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Consultation transcript will appear here... You can also type directly, or use the demo transcript below."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />

              {!transcript && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTranscript(demoTranscript)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Use Demo Transcript
                  </Button>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={generateSOAPNote}
                  disabled={generatingSOAP || !transcript.trim()}
                  className="flex-1"
                >
                  {generatingSOAP ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating SOAP Note...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate SOAP Note
                    </>
                  )}
                </Button>

                <Button
                  onClick={generateCDSS}
                  disabled={generatingCDSS || !soapNote}
                  variant="outline"
                  className="flex-1"
                >
                  {generatingCDSS ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Get AI Recommendations
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SOAP Note & CDSS Tabs */}
          {(soapNote || cdssRecommendations) && (
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="soap">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="soap">SOAP Note</TabsTrigger>
                    <TabsTrigger value="cdss">AI Recommendations</TabsTrigger>
                  </TabsList>

                  <TabsContent value="soap" className="space-y-4 mt-4">
                    {soapNote ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-green-900">SOAP Note Generated</h3>
                          </div>
                        </div>

                        {['subjective', 'objective', 'assessment', 'plan'].map((section) => (
                          <div key={section} className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                              {section}
                            </h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {soapNote[section]}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        Generate SOAP note to see structured clinical documentation
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="cdss" className="space-y-4 mt-4">
                    {cdssRecommendations ? (
                      <div className="space-y-4">
                        {/* Differential Diagnosis */}
                        {cdssRecommendations.differentials && cdssRecommendations.differentials.length > 0 && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-3">
                              Differential Diagnosis
                            </h4>
                            <div className="space-y-2">
                              {cdssRecommendations.differentials.map((dx: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-white rounded border border-blue-200">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{dx}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Tests */}
                        {cdssRecommendations.recommended_tests && cdssRecommendations.recommended_tests.length > 0 && (
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-semibold text-purple-900 mb-3">
                              Recommended Diagnostic Tests
                            </h4>
                            <div className="space-y-2">
                              {cdssRecommendations.recommended_tests.map((test: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-white rounded">
                                  <TestTube className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm">{test}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Treatment Suggestions */}
                        {cdssRecommendations.treatment_suggestions && cdssRecommendations.treatment_suggestions.length > 0 && (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-3">
                              Treatment Suggestions
                            </h4>
                            <div className="space-y-2">
                              {cdssRecommendations.treatment_suggestions.map((treatment: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-white rounded">
                                  <Pill className="w-4 h-4 text-green-600" />
                                  <span className="text-sm">{treatment}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Red Flags */}
                        {cdssRecommendations.red_flags && cdssRecommendations.red_flags.length > 0 && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                              <AlertCircle className="w-5 h-5" />
                              Red Flags - Immediate Attention Required
                            </h4>
                            <ul className="space-y-1">
                              {cdssRecommendations.red_flags.map((flag: string, i: number) => (
                                <li key={i} className="text-sm text-red-800">• {flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Risk Score */}
                        {cdssRecommendations.risk_score !== undefined && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Overall Risk Score
                            </h4>
                            <div className="flex items-center gap-3">
                              <div className="text-3xl font-bold text-primary-600">
                                {cdssRecommendations.risk_score}/100
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full ${
                                    cdssRecommendations.risk_score >= 70 ? 'bg-red-500' :
                                    cdssRecommendations.risk_score >= 40 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${cdssRecommendations.risk_score}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        Generate AI recommendations to see clinical decision support
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={saveEncounter}
              disabled={savingEncounter || !soapNote}
              className="flex-1"
              size="lg"
            >
              {savingEncounter ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save & Complete Consultation
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Patient Brief Panel */}
        <div className="lg:col-span-1">
          <PatientBriefPanel patient={patient} className="sticky top-6" />
        </div>
      </div>
    </div>
  );
}
