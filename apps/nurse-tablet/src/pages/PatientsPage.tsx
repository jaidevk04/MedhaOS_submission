import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Filter, Users } from 'lucide-react';
import { PatientCard } from '@/components/patients/PatientCard';
import { PatientDetailsDialog } from '@/components/patients/PatientDetailsDialog';
import { usePatientStore } from '@/store/patientStore';
import { useToast } from '@/hooks/useToast';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { Patient } from '@/types';

export default function PatientsPage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  const { patients, selectedPatient, setSelectedPatient, fetchPatients } = usePatientStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acuityFilter, setAcuityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    fetchPatients();
  }, []);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPatients();
    setIsRefreshing(false);
    toast({
      title: 'Patients Refreshed',
      description: isOnline ? 'Latest patient data loaded' : 'Loaded from offline storage',
    });
  };

  const filteredPatients = patients.filter((patient) => {
    if (acuityFilter === 'all') return true;
    if (acuityFilter === 'high') return patient.acuityScore >= 4;
    if (acuityFilter === 'medium') return patient.acuityScore === 3;
    if (acuityFilter === 'low') return patient.acuityScore <= 2;
    return true;
  });

  // Sort by acuity score (highest first)
  const sortedPatients = [...filteredPatients].sort((a, b) => b.acuityScore - a.acuityScore);

  const acuityCounts = {
    all: patients.length,
    high: patients.filter((p) => p.acuityScore >= 4).length,
    medium: patients.filter((p) => p.acuityScore === 3).length,
    low: patients.filter((p) => p.acuityScore <= 2).length,
  };

  const criticalAlerts = patients.reduce(
    (count, patient) =>
      count + patient.alerts.filter((a) => a.type === 'critical' && !a.acknowledged).length,
    0
  );

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
              <h1 className="text-2xl font-bold">My Patients</h1>
              <p className="text-sm text-muted-foreground">
                {patients.length} assigned patients
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
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{patients.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-urgent/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-urgent font-semibold">High Acuity</span>
            </div>
            <p className="text-2xl font-bold text-urgent">{acuityCounts.high}</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-warning font-semibold">Medium</span>
            </div>
            <p className="text-2xl font-bold text-warning">{acuityCounts.medium}</p>
          </div>
          <div className="p-3 rounded-lg bg-routine/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-routine font-semibold">Low</span>
            </div>
            <p className="text-2xl font-bold text-routine">{acuityCounts.low}</p>
          </div>
        </div>

        {/* Critical Alerts Banner */}
        {criticalAlerts > 0 && (
          <div className="bg-urgent/10 border border-urgent rounded-lg p-3">
            <p className="text-urgent font-semibold text-center">
              ⚠️ {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''} Require Attention
            </p>
          </div>
        )}

        {/* Acuity Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={acuityFilter === 'all' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setAcuityFilter('all')}
            className="shrink-0 touch-target"
          >
            All Patients
            <Badge variant="secondary" className="ml-2">
              {acuityCounts.all}
            </Badge>
          </Button>
          <Button
            variant={acuityFilter === 'high' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setAcuityFilter('high')}
            className="shrink-0 touch-target"
          >
            High Acuity
            <Badge variant="secondary" className="ml-2">
              {acuityCounts.high}
            </Badge>
          </Button>
          <Button
            variant={acuityFilter === 'medium' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setAcuityFilter('medium')}
            className="shrink-0 touch-target"
          >
            Medium
            <Badge variant="secondary" className="ml-2">
              {acuityCounts.medium}
            </Badge>
          </Button>
          <Button
            variant={acuityFilter === 'low' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setAcuityFilter('low')}
            className="shrink-0 touch-target"
          >
            Low
            <Badge variant="secondary" className="ml-2">
              {acuityCounts.low}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Patients Found</h3>
            <p className="text-muted-foreground">
              {acuityFilter !== 'all'
                ? 'Try adjusting your filter'
                : 'No patients assigned to you'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} onClick={handlePatientClick} />
            ))}
          </div>
        )}
      </div>

      {/* Patient Details Dialog */}
      <PatientDetailsDialog
        patient={selectedPatient}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
