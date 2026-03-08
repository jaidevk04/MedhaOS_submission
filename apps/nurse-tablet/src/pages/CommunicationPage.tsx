import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  FileText,
  Send,
  Phone,
} from 'lucide-react';
import { MessageCard } from '@/components/communication/MessageCard';
import { QuickMessageDialog } from '@/components/communication/QuickMessageDialog';
import { EscalationDialog } from '@/components/communication/EscalationDialog';
import { HandoffNotesDialog } from '@/components/communication/HandoffNotesDialog';
import { usePatientStore } from '@/store/patientStore';
import { useToast } from '@/hooks/useToast';
import type { Message, Patient } from '@/types';

export default function CommunicationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { patients } = usePatientStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'Dr. Smith',
      to: 'Nurse Johnson',
      subject: 'Patient Assessment',
      body: 'Please assess patient in Room 302 and report vitals.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
      urgent: true,
    },
    {
      id: '2',
      from: 'Pharmacy',
      to: 'Nurse Johnson',
      subject: 'Medication Ready',
      body: 'Medication for patient in Room 305 is ready for pickup.',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      read: true,
      urgent: false,
    },
  ]);

  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isEscalationDialogOpen, setIsEscalationDialogOpen] = useState(false);
  const [isHandoffDialogOpen, setIsHandoffDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const unreadCount = messages.filter((m) => !m.read).length;
  const urgentCount = messages.filter((m) => m.urgent && !m.read).length;

  const handleMessageClick = (message: Message) => {
    // Mark as read
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, read: true } : m))
    );
  };

  const handleSendMessage = (message: {
    to: string;
    subject: string;
    body: string;
    urgent: boolean;
  }) => {
    toast({
      title: 'Message Sent',
      description: `Message sent to ${message.to}`,
    });
  };

  const handleEscalate = (escalation: {
    patientId: string;
    reason: string;
    urgency: 'critical' | 'urgent' | 'routine';
    notes: string;
  }) => {
    toast({
      title: 'Escalation Sent',
      description: `${escalation.urgency.toUpperCase()} escalation sent to attending physician`,
      variant: escalation.urgency === 'critical' ? 'destructive' : 'default',
    });
  };

  const handleSaveHandoff = (note: any) => {
    toast({
      title: 'Handoff Note Saved',
      description: 'Handoff note has been documented',
    });
  };

  const handleQuickEscalation = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEscalationDialogOpen(true);
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
              <h1 className="text-2xl font-bold">Communication</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsMessageDialogOpen(true)}
            className="h-auto py-4 flex flex-col gap-2"
          >
            <Send className="w-6 h-6" />
            <span className="text-sm font-medium">Quick Message</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsHandoffDialogOpen(true)}
            className="h-auto py-4 flex flex-col gap-2"
          >
            <FileText className="w-6 h-6" />
            <span className="text-sm font-medium">Handoff Notes</span>
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              if (patients.length > 0) {
                handleQuickEscalation(patients[0]);
              }
            }}
            className="h-auto py-4 flex flex-col gap-2"
          >
            <AlertTriangle className="w-6 h-6" />
            <span className="text-sm font-medium">Escalate</span>
          </Button>
        </div>

        {/* Urgent Messages Alert */}
        {urgentCount > 0 && (
          <div className="bg-urgent/10 border border-urgent rounded-lg p-3">
            <p className="text-urgent font-semibold text-center">
              ⚠️ {urgentCount} Urgent Message{urgentCount > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Messages Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messages
            </h2>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} New</Badge>
            )}
          </div>

          {messages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No messages</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onClick={handleMessageClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Escalation for High Acuity Patients */}
        {patients.filter((p) => p.acuityScore >= 4).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-urgent" />
              High Acuity Patients
            </h2>
            <div className="space-y-2">
              {patients
                .filter((p) => p.acuityScore >= 4)
                .map((patient) => (
                  <Card key={patient.id} className="border-l-4 border-l-urgent">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.room} - Bed {patient.bed}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="urgent">Acuity: {patient.acuityScore}</Badge>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleQuickEscalation(patient)}
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Escalate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <QuickMessageDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        onSend={handleSendMessage}
      />

      <EscalationDialog
        patient={selectedPatient}
        open={isEscalationDialogOpen}
        onOpenChange={setIsEscalationDialogOpen}
        onEscalate={handleEscalate}
      />

      <HandoffNotesDialog
        patients={patients}
        open={isHandoffDialogOpen}
        onOpenChange={setIsHandoffDialogOpen}
        onSave={handleSaveHandoff}
      />
    </div>
  );
}
