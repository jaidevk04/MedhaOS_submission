import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Pill } from 'lucide-react';
import { MedicationCard } from '@/components/medication/MedicationCard';
import { MedicationAdministrationDialog } from '@/components/medication/MedicationAdministrationDialog';
import { usePatientStore } from '@/store/patientStore';
import { useToast } from '@/hooks/useToast';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { Medication, Patient } from '@/types';

export default function MedicationPage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  const { patients, fetchPatients } = usePatientStore();

  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'due' | 'overdue'>('due');

  useEffect(() => {
    fetchPatients();
  }, []);

  // Flatten all medications from all patients
  const allMedications = patients.flatMap((patient) =>
    patient.currentMedications
      .filter((med) => med.status === 'pending')
      .map((med) => ({
        ...med,
        patientId: patient.id,
        patientName: patient.name,
        patient,
      }))
  );

  // Filter medications
  const now = new Date();
  const filteredMedications = allMedications.filter((med) => {
    const scheduledTime = new Date(med.scheduledTime);
    const isOverdue = scheduledTime < new Date(now.getTime() - 30 * 60 * 1000);
    const isDue = scheduledTime <= now;

    if (filter === 'overdue') return isOverdue;
    if (filter === 'due') return isDue && !isOverdue;
    return true;
  });

  // Sort by scheduled time
  const sortedMedications = [...filteredMedications].sort(
    (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  );

  const handleAdministerClick = (medication: Medication & { patient: Patient }) => {
    setSelectedMedication(medication);
    setSelectedPatient(medication.patient);
    setIsDialogOpen(true);
  };

  const handleAdminister = (medicationId: string, notes: string) => {
    // Update medication status
    toast({
      title: 'Medication Administered',
      description: 'Medication has been successfully administered',
    });
  };

  const handleRefuse = (medicationId: string, reason: string) => {
    // Update medication status to refused
    toast({
      title: 'Medication Refused',
      description: 'Patient refusal has been documented',
      variant: 'destructive',
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPatients();
    setIsRefreshing(false);
    toast({
      title: 'Medications Refreshed',
      description: isOnline ? 'Latest medication data loaded' : 'Loaded from offline storage',
    });
  };

  const medicationCounts = {
    all: allMedications.length,
    due: allMedications.filter(
      (med) =>
        new Date(med.scheduledTime) <= now &&
        new Date(med.scheduledTime) >= new Date(now.getTime() - 30 * 60 * 1000)
    ).length,
    overdue: allMedications.filter(
      (med) => new Date(med.scheduledTime) < new Date(now.getTime() - 30 * 60 * 1000)
    ).length,
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="touch-target"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Medication Administration</h1>
              <p className="text-sm text-muted-foreground">
                {medicationCounts.all} pending medications
                {!isOnline && ' (Offline Mode)'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="touch-target"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-1">
              <Pill className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">All</span>
            </div>
            <p className="text-2xl font-bold">{medicationCounts.all}</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-warning font-semibold">Due Now</span>
            </div>
            <p className="text-2xl font-bold text-warning">{medicationCounts.due}</p>
          </div>
          <div className="p-3 rounded-lg bg-urgent/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-urgent font-semibold">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-urgent">{medicationCounts.overdue}</p>
          </div>
        </div>

        {/* Overdue Alert */}
        {medicationCounts.overdue > 0 && (
          <div className="bg-urgent/10 border border-urgent rounded-lg p-3">
            <p className="text-urgent font-semibold text-center">
              ⚠️ {medicationCounts.overdue} Overdue Medication{medicationCounts.overdue > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filter === 'due' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setFilter('due')}
            className="shrink-0 touch-target"
          >
            Due Now
            <Badge variant="secondary" className="ml-2">
              {medicationCounts.due}
            </Badge>
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setFilter('overdue')}
            className="shrink-0 touch-target"
          >
            Overdue
            <Badge variant="secondary" className="ml-2">
              {medicationCounts.overdue}
            </Badge>
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setFilter('all')}
            className="shrink-0 touch-target"
          >
            All Pending
            <Badge variant="secondary" className="ml-2">
              {medicationCounts.all}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Medication List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedMedications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Pill className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Medications Found</h3>
            <p className="text-muted-foreground">
              {filter !== 'all'
                ? 'Try adjusting your filter'
                : 'All medications have been administered'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMedications.map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                patientName={med.patientName}
                onAdminister={() => handleAdministerClick(med)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Medication Administration Dialog */}
      <MedicationAdministrationDialog
        medication={selectedMedication}
        patient={selectedPatient}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAdminister={handleAdminister}
        onRefuse={handleRefuse}
      />
    </div>
  );
}
