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
import { FileText, Save } from 'lucide-react';
import type { Patient, HandoffNote } from '@/types';

interface HandoffNotesDialogProps {
  patients: Patient[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: Omit<HandoffNote, 'id'>) => void;
}

export function HandoffNotesDialog({
  patients,
  open,
  onOpenChange,
  onSave,
}: HandoffNotesDialogProps) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [shift, setShift] = useState<'day' | 'evening' | 'night'>('day');
  const [summary, setSummary] = useState('');
  const [pendingTasks, setPendingTasks] = useState('');
  const [concerns, setConcerns] = useState('');

  const patient = patients.find((p) => p.id === selectedPatient);

  const handleSave = () => {
    if (!patient) return;

    onSave({
      patientId: patient.id,
      patientName: patient.name,
      from: 'Current Nurse', // Would come from auth
      to: 'Next Shift Nurse',
      shift,
      date: new Date().toISOString(),
      summary,
      pendingTasks: pendingTasks.split('\n').filter((t) => t.trim()),
      concerns: concerns.split('\n').filter((c) => c.trim()),
      vitals: patient.vitals,
    });

    // Reset form
    setSelectedPatient('');
    setSummary('');
    setPendingTasks('');
    setConcerns('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Handoff Notes</DialogTitle>
              <DialogDescription className="text-base">
                Document patient status for next shift
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Patient</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.room} Bed {p.bed}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Shift</label>
            <div className="flex gap-2">
              {(['day', 'evening', 'night'] as const).map((s) => (
                <Button
                  key={s}
                  variant={shift === s ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setShift(s)}
                  className="flex-1 capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Patient Info (if selected) */}
          {patient && (
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {patient.room} - Bed {patient.bed}
                  </p>
                </div>
                <Badge
                  variant={patient.acuityScore >= 4 ? 'urgent' : patient.acuityScore >= 3 ? 'soon' : 'routine'}
                >
                  Acuity: {patient.acuityScore}
                </Badge>
              </div>

              {/* Current Vitals */}
              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                {patient.vitals.temperature && (
                  <div>
                    <span className="text-muted-foreground">Temp:</span>
                    <span className="ml-1 font-medium">{patient.vitals.temperature}°F</span>
                  </div>
                )}
                {patient.vitals.heartRate && (
                  <div>
                    <span className="text-muted-foreground">HR:</span>
                    <span className="ml-1 font-medium">{patient.vitals.heartRate} bpm</span>
                  </div>
                )}
                {patient.vitals.bloodPressure && (
                  <div>
                    <span className="text-muted-foreground">BP:</span>
                    <span className="ml-1 font-medium">{patient.vitals.bloodPressure}</span>
                  </div>
                )}
                {patient.vitals.spo2 && (
                  <div>
                    <span className="text-muted-foreground">SpO2:</span>
                    <span className="ml-1 font-medium">{patient.vitals.spo2}%</span>
                  </div>
                )}
              </div>

              {/* Allergies */}
              {patient.allergies.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="text-sm font-semibold text-urgent">Allergies: </span>
                  {patient.allergies.map((allergy, index) => (
                    <Badge key={index} variant="urgent" className="text-xs ml-1">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Shift Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summarize patient's condition and events during your shift..."
              className="w-full min-h-[100px] p-3 rounded-lg border border-input bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Pending Tasks */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pending Tasks (one per line)</label>
            <textarea
              value={pendingTasks}
              onChange={(e) => setPendingTasks(e.target.value)}
              placeholder="List any tasks that need to be completed by next shift..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Concerns */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Concerns/Alerts (one per line)</label>
            <textarea
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              placeholder="Note any concerns or important alerts for next shift..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedPatient || !summary}
            size="lg"
            className="touch-target"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Handoff Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
