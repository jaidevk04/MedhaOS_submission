'use client';

import { useAuthStore } from '@/store/authStore';
import { useQueueStore } from '@/store/queueStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { QueuePatient } from '@/types/patient';
import { 
  Users, Calendar, FileText, Clock, TrendingUp, 
  AlertCircle, Activity, Stethoscope, Pill, TestTube 
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { patients, fetchQueue } = useQueueStore();
  const router = useRouter();

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const queueStats = {
    total: patients.length,
    critical: patients.filter((p: QueuePatient) => p.urgency_score >= 70).length,
    urgent: patients.filter((p: QueuePatient) => p.urgency_score >= 40 && p.urgency_score < 70).length,
  };

  const quickActions = [
    {
      icon: Stethoscope,
      title: 'Start Consultation',
      description: 'With AI ambient scribe',
      gradient: 'from-blue-500 to-cyan-500',
      onClick: () => router.push('/dashboard/queue')
    },
    {
      icon: Users,
      title: 'View Patient Queue',
      description: `${queueStats.total} patients waiting`,
      gradient: 'from-purple-500 to-pink-500',
      onClick: () => router.push('/dashboard/queue')
    },
    {
      icon: Pill,
      title: 'Write Prescription',
      description: 'With AI safety checks',
      gradient: 'from-green-500 to-emerald-500',
      onClick: () => router.push('/dashboard/prescriptions')
    },
    {
      icon: TestTube,
      title: 'Order Diagnostics',
      description: 'Lab & imaging tests',
      gradient: 'from-orange-500 to-red-500',
      onClick: () => router.push('/dashboard/diagnostics')
    },
  ];

  const recentAlerts = [
    { type: 'critical', title: 'Critical Lab Result', patient: 'Ramesh Kumar', time: '2 min ago', color: 'red' },
    { type: 'warning', title: 'Drug Interaction Alert', patient: 'Prescription review needed', time: '15 min ago', color: 'yellow' },
    { type: 'info', title: 'New Patient Arrival', patient: 'Urgency score: 78', time: '30 min ago', color: 'blue' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, Dr. {user?.lastName} 👋
            </h2>
            <p className="text-blue-100 text-lg">
              Here's what's happening in your clinical workspace today
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center">
              <Activity className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-blue-600 font-semibold">Patient Queue</CardDescription>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {queueStats.total}
            </CardTitle>
            <div className="flex gap-2 mt-3">
              <Badge className="bg-red-100 text-red-700 border-red-200">
                {queueStats.critical} Critical
              </Badge>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                {queueStats.urgent} Urgent
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-purple-600 font-semibold">Today's Consultations</CardDescription>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              8
            </CardTitle>
            <div className="text-sm text-gray-600 mt-3">
              4 completed, 4 pending
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-green-600 font-semibold">Pending Reports</CardDescription>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              5
            </CardTitle>
            <div className="text-sm text-gray-600 mt-3">
              3 lab results, 2 imaging
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-orange-600 font-semibold">Avg. Wait Time</CardDescription>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              12m
            </CardTitle>
            <div className="flex items-center gap-1 text-sm text-green-600 mt-3">
              <TrendingUp className="w-4 h-4" />
              <span>3 min faster than yesterday</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
            <CardDescription>Common tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="group relative p-6 border-2 border-gray-200 rounded-2xl hover:border-transparent hover:shadow-2xl transition-all duration-300 text-left overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-semibold text-lg mb-1">{action.title}</div>
                  <div className="text-sm text-gray-600">{action.description}</div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Recent Alerts</CardTitle>
            <CardDescription>System notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <div className={`h-2 w-2 bg-${alert.color}-500 rounded-full mt-2 animate-pulse`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                  <p className="text-xs text-gray-600 truncate">{alert.patient}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
