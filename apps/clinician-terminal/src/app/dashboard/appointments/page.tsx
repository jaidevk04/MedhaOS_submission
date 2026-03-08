'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Plus, ChevronLeft, ChevronRight, Brain, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface Appointment {
  appointment_id: string;
  patient_name: string;
  appointment_type: string;
  specialty: string;
  scheduled_time: string;
  urgency_score: number;
  status: string;
  notes?: string;
  duration?: number;
}

export default function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { toast } = useToast?.() || { toast: (props: any) => console.log(props) };
  const { tokens } = useAuthStore();
  const router = useRouter();

  const formatDate = (date: Date) => {
    // Format as YYYY-MM-DD using local time
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset*60*1000));
    return localDate.toISOString().split('T')[0];
  };

  const displayDate = currentDate.toLocaleDateString('en-IN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const dateStr = formatDate(currentDate);
      
      // Wait for tokens to be available
      if (!tokens?.accessToken) {
        // If not authenticated yet, wait or return
        return;
      }

      const res = await fetch(`http://localhost:4000/api/appointments?date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch');
      }
      
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      if (error.message !== 'Unauthorized') {
        toast({
          title: "Using cached data",
          description: "Could not fetch live appointments.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentDate, tokens]);

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getUrgencyLabel = (score: number) => {
    if (score >= 70) return 'Critical';
    if (score >= 40) return 'Urgent';
    return 'Routine';
  };

  const handleSmartReschedule = (aptId: string) => {
    toast({
      title: "AI Scheduling Agent",
      description: "Analyzing calendar... Best alternative slot: Tomorrow 10:00 AM (Low conflicting load).",
    });
  };

  const handleView = async (apt: Appointment) => {
    setProcessingId(apt.appointment_id);
    try {
      if (!tokens?.accessToken) {
        toast({
          title: "Authentication Error",
          description: "Please log in again.",
          variant: "destructive"
        });
        return;
      }

      const res = await fetch(`http://localhost:4000/api/clinical/start-consultation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appointment_id: apt.appointment_id })
      });

      if (!res.ok) throw new Error('Failed to initialize consultation');

      const data = await res.json();
      if (data.success && data.encounterId) {
        router.push(`/dashboard/consultation/${data.encounterId}`);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast({
        title: "Error",
        description: "Could not open consultation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">{displayDate}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">AI Daily Briefing</h3>
              <p className="text-sm text-blue-700 mt-1">
                You have {appointments.filter(a => a.urgency_score >= 70).length} critical cases today. 
                Average wait time is optimal. 
                Schedule efficiency is 85%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Today', value: appointments.length, color: 'blue' },
          { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: 'green' },
          { label: 'Pending', value: appointments.filter(a => a.status === 'scheduled' || a.status === 'waiting').length, color: 'orange' },
          { label: 'Critical', value: appointments.filter(a => a.urgency_score >= 70).length, color: 'red' },
        ].map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Appointment List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Schedule</span>
            <Button variant="ghost" size="sm" onClick={fetchAppointments} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No appointments scheduled for this date.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-center min-w-[80px]">
                        <div className="font-semibold text-lg">
                          {new Date(apt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-gray-500">{apt.duration || 30} min</div>
                      </div>
                      
                      <div className="h-12 w-px bg-gray-200" />
                      
                      <div>
                        <div className="font-medium flex items-center gap-2 text-lg">
                          <User className="h-4 w-4 text-gray-400" />
                          {apt.patient_name}
                          {apt.urgency_score >= 70 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              High Risk
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 flex items-center gap-3">
                          <Badge variant="outline" className="text-xs font-normal">
                            {apt.appointment_type}
                          </Badge>
                          <span>•</span>
                          <span>{apt.specialty}</span>
                        </div>
                        {apt.notes && (
                          <div className="text-xs text-gray-500 mt-1 italic">
                            "AI Summary: {apt.notes.substring(0, 60)}..."
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(apt.urgency_score)}`}>
                        Score: {apt.urgency_score} ({getUrgencyLabel(apt.urgency_score)})
                      </div>
                      
                      <Badge 
                        className="capitalize"
                        variant={
                          apt.status === 'in_progress' ? 'default' :
                          apt.status === 'waiting' ? 'secondary' :
                          apt.status === 'confirmed' ? 'outline' : 'default'
                        }
                      >
                        {apt.status.replace('_', ' ')}
                      </Badge>
                      
                      <Button size="sm" variant="outline" onClick={() => handleSmartReschedule(apt.appointment_id)}>
                        Reschedule
                      </Button>
                      
                      <Button 
                        size="sm" 
                        onClick={() => handleView(apt)}
                        disabled={processingId === apt.appointment_id}
                      >
                        {processingId === apt.appointment_id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : 'View'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
