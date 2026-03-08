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
import { Card, CardContent } from '@/components/ui/card';
import {
  Pill,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Medication, Patient } from '@/types';

interface MedicationAdministrationDialogProps {
  medication: Medication | null;
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdminister: (medicationId: string, notes: string) => void;
  onRefuse: (medicationId: string, reason: string) => void;
}

export function MedicationAdministrationDialog({
  medication,
  patient,
  open,
  onOpenChange,
  onAdminister,
  onRefuse,
}: MedicationAdministrationDialogProps) {
  const [step, setStep] = useState<'scan' | 'verify' | 'document'>('scan');
  const [patientScanned, setPatientScanned] = useState(false);
  const [medicationScanned, setMedicationScanned] = useState(false);
  const [fiveRightsChecked, setFiveRightsChecked] = useState({
    rightPatient: false,
    rightMedication: false,
    rightDose: false,
    rightRoute: false,
    rightTime: false,
  });
  const [notes, setNotes] = useState('');
  const [refuseReason, setRefuseReason] = useState('');
  const [showRefuseDialog, setShowRefuseDialog] = useState(false);

  if (!medication || !patient) return null;

  const handleScanPatient = () => {
    // Simulate barcode scan
    setPatientScanned(true);
  };

  const handleScanMedication = () => {
    // Simulate barcode scan
    setMedicationScanned(true);
  };

  const handleCheckRight = (right: keyof typeof fiveRightsChecked) => {
    setFiveRightsChecked((prev) => ({ ...prev, [right]: !prev[right] }));
  };

  const allRightsChecked = Object.values(fiveRightsChecked).every((v) => v);
  const canProceedToVerify = patientScanned && medicationScanned;
  const canAdminister = allRightsChecked;

  const handleAdminister = () => {
    onAdminister(medication.id, notes);
    resetDialog();
    onOpenChange(false);
  };

  const handleRefuse = () => {
    onRefuse(medication.id, refuseReason);
    resetDialog();
    onOpenChange(false);
  };

  const resetDialog = () => {
    setStep('scan');
    setPatientScanned(false);
    setMedicationScanned(false);
    setFiveRightsChecked({
      rightPatient: false,
      rightMedication: false,
      rightDose: false,
      rightRoute: false,
      rightTime: false,
    });
    setNotes('');
    setRefuseReason('');
    setShowRefuseDialog(false);
  };

  return (
    <>
      <Dialog open={open && !showRefuseDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Medication Administration</DialogTitle>
            <DialogDescription className="text-base">
              Follow the five rights verification process
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {['Scan', 'Verify', 'Document'].map((label, index) => (
                <div key={label} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step === label.toLowerCase()
                        ? 'bg-primary text-primary-foreground'
                        : index < ['scan', 'verify', 'document'].indexOf(step)
                        ? 'bg-routine text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium">{label}</span>
                  {index < 2 && <div className="flex-1 h-1 bg-muted mx-2" />}
                </div>
              ))}
            </div>

            {/* Medication Info */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{medication.name}</h3>
                    <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                  </div>
                  <Badge variant="soon">Pending</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Route:</span>
                    <span className="ml-1 font-medium">{medication.route}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="ml-1 font-medium">{medication.frequency}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="ml-1 font-medium">
                      {formatDateTime(medication.scheduledTime)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 1: Barcode Scanning */}
            {step === 'scan' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Step 1: Scan Barcodes</h4>

                {/* Patient Scan */}
                <Card className={patientScanned ? 'border-routine' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-6 h-6 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">Patient: {patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.room} - Bed {patient.bed}
                          </p>
                        </div>
                      </div>
                      {patientScanned ? (
                        <CheckCircle2 className="w-6 h-6 text-routine" />
                      ) : (
                        <Button onClick={handleScanPatient} size="lg">
                          <Camera className="w-4 h-4 mr-2" />
                          Scan Patient
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Medication Scan */}
                <Card className={medicationScanned ? 'border-routine' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Pill className="w-6 h-6 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">Medication: {medication.name}</p>
                          <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                        </div>
                      </div>
                      {medicationScanned ? (
                        <CheckCircle2 className="w-6 h-6 text-routine" />
                      ) : (
                        <Button onClick={handleScanMedication} size="lg">
                          <Camera className="w-4 h-4 mr-2" />
                          Scan Medication
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Button
                  size="lg"
                  className="w-full touch-target"
                  disabled={!canProceedToVerify}
                  onClick={() => setStep('verify')}
                >
                  Continue to Verification
                </Button>
              </div>
            )}

            {/* Step 2: Five Rights Verification */}
            {step === 'verify' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Step 2: Five Rights Verification</h4>

                <div className="space-y-2">
                  {[
                    { key: 'rightPatient', label: 'Right Patient', value: patient.name },
                    { key: 'rightMedication', label: 'Right Medication', value: medication.name },
                    { key: 'rightDose', label: 'Right Dose', value: medication.dosage },
                    { key: 'rightRoute', label: 'Right Route', value: medication.route },
                    {
                      key: 'rightTime',
                      label: 'Right Time',
                      value: formatDateTime(medication.scheduledTime),
                    },
                  ].map((right) => (
                    <Card
                      key={right.key}
                      className={`cursor-pointer ${
                        fiveRightsChecked[right.key as keyof typeof fiveRightsChecked]
                          ? 'border-routine bg-routine/5'
                          : ''
                      }`}
                      onClick={() =>
                        handleCheckRight(right.key as keyof typeof fiveRightsChecked)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{right.label}</p>
                            <p className="text-sm text-muted-foreground">{right.value}</p>
                          </div>
                          <div
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                              fiveRightsChecked[right.key as keyof typeof fiveRightsChecked]
                                ? 'border-routine bg-routine'
                                : 'border-muted'
                            }`}
                          >
                            {fiveRightsChecked[right.key as keyof typeof fiveRightsChecked] && (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Allergy Warning */}
                {patient.allergies.length > 0 && (
                  <Card className="border-urgent bg-urgent/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-urgent shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-urgent">Patient Allergies</p>
                          <p className="text-sm text-urgent/90">
                            {patient.allergies.join(', ')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  size="lg"
                  className="w-full touch-target"
                  disabled={!canAdminister}
                  onClick={() => setStep('document')}
                >
                  Continue to Documentation
                </Button>
              </div>
            )}

            {/* Step 3: Documentation */}
            {step === 'document' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Step 3: Documentation</h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Administration Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about the administration..."
                    className="w-full min-h-[100px] p-3 rounded-lg border border-input bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="lg"
                    className="flex-1 touch-target"
                    onClick={handleAdminister}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Administration
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRefuseDialog(true)}
              size="lg"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Patient Refused
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refuse Dialog */}
      <Dialog open={showRefuseDialog} onOpenChange={setShowRefuseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patient Refused Medication</DialogTitle>
            <DialogDescription>
              Please document the reason for refusal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <textarea
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              placeholder="Reason for refusal..."
              className="w-full min-h-[100px] p-3 rounded-lg border border-input bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRefuseDialog(false)} size="lg">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefuse}
              disabled={!refuseReason.trim()}
              size="lg"
            >
              Confirm Refusal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
