'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UserCheck, Stethoscope, Activity, 
  TrendingUp, Calendar, Clock, Award,
  Brain, Sparkles, Shield, Zap
} from 'lucide-react';

// Hardcoded staff data
const staffData = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    role: 'Senior Cardiologist',
    department: 'Cardiology',
    status: 'on-duty',
    shift: 'Morning (8AM - 4PM)',
    patients: 12,
    consultations: 234,
    rating: 4.9,
    aiAssisted: 198,
    efficiency: 94
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    role: 'Neurologist',
    department: 'Neurology',
    status: 'on-duty',
    shift: 'Morning (8AM - 4PM)',
    patients: 8,
    consultations: 189,
    rating: 4.8,
    aiAssisted: 156,
    efficiency: 91
  },
  {
    id: 3,
    name: 'Nurse Emily Davis',
    role: 'Head Nurse',
    department: 'Emergency',
    status: 'on-duty',
    shift: 'Night (12AM - 8AM)',
    patients: 24,
    consultations: 456,
    rating: 4.95,
    aiAssisted: 389,
    efficiency: 97
  },
  {
    id: 4,
    name: 'Dr. James Wilson',
    role: 'Pediatrician',
    department: 'Pediatrics',
    status: 'on-break',
    shift: 'Afternoon (4PM - 12AM)',
    patients: 15,
    consultations: 312,
    rating: 4.85,
    aiAssisted: 267,
    efficiency: 89
  },
  {
    id: 5,
    name: 'Nurse Robert Taylor',
    role: 'ICU Nurse',
    department: 'Cardiology',
    status: 'on-duty',
    shift: 'Morning (8AM - 4PM)',
    patients: 6,
    consultations: 278,
    rating: 4.92,
    aiAssisted: 245,
    efficiency: 93
  },
  {
    id: 6,
    name: 'Dr. Lisa Anderson',
    role: 'Emergency Physician',
    department: 'Emergency',
    status: 'off-duty',
    shift: 'Night (12AM - 8AM)',
    patients: 0,
    consultations: 421,
    rating: 4.88,
    aiAssisted: 378,
    efficiency: 95
  }
];

// AI Agents helping staff
const aiAgentsData = [
  {
    id: 1,
    name: 'AI Ambient Scribe',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    staffUsing: 156,
    totalUses: 8420,
    timeSaved: '2,340 hrs',
    satisfaction: 98
  },
  {
    id: 2,
    name: 'AI CDSS',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    staffUsing: 134,
    totalUses: 6890,
    timeSaved: '1,890 hrs',
    satisfaction: 96
  },
  {
    id: 3,
    name: 'Drug Interaction Checker',
    icon: Shield,
    color: 'from-green-500 to-emerald-500',
    staffUsing: 198,
    totalUses: 12450,
    timeSaved: '890 hrs',
    satisfaction: 99
  },
  {
    id: 4,
    name: 'AI Triage Assistant',
    icon: Zap,
    color: 'from-orange-500 to-red-500',
    staffUsing: 89,
    totalUses: 9870,
    timeSaved: '3,120 hrs',
    satisfaction: 97
  }
];

// Staff stats
const staffStats = {
  total: 234,
  onDuty: 156,
  onBreak: 23,
  offDuty: 55,
  avgEfficiency: 93,
  aiAdoption: 87
};

export default function StaffPage() {
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredStaff = staffData.filter(staff => {
    if (filterStatus === 'all') return true;
    return staff.status === filterStatus;
  });

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/50 px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Staff Management
            </h1>
            <p className="text-slate-600 mt-1">Monitor staff performance and AI assistance</p>
          </div>
          <div className="flex gap-2">
            {['all', 'on-duty', 'on-break', 'off-duty'].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={filterStatus === status ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : ''}
              >
                {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          
          {/* Stats Row */}
          <div className="grid grid-cols-6 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Total Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{staffStats.total}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100">On Duty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{staffStats.onDuty}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">On Break</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{staffStats.onBreak}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Off Duty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">{staffStats.offDuty}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{staffStats.avgEfficiency}%</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">AI Adoption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{staffStats.aiAdoption}%</div>
              </CardContent>
            </Card>
          </div>

          {/* AI Agents Helping Staff */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                AI Agents Assisting Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {aiAgentsData.map((agent) => (
                  <div key={agent.id} className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg bg-white">
                    <div className={`w-12 h-12 bg-gradient-to-br ${agent.color} rounded-xl flex items-center justify-center shadow-lg mb-3`}>
                      <agent.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-sm mb-3">{agent.name}</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Staff Using</span>
                        <span className="font-bold text-blue-600">{agent.staffUsing}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Uses</span>
                        <span className="font-bold">{agent.totalUses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Saved</span>
                        <span className="font-bold text-green-600">{agent.timeSaved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Satisfaction</span>
                        <span className="font-bold text-purple-600">{agent.satisfaction}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                      <div 
                        className={`bg-gradient-to-r ${agent.color} h-1.5 rounded-full`}
                        style={{ width: `${agent.satisfaction}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Staff List */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-600" />
                Staff Members ({filteredStaff.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredStaff.map((staff) => (
                  <div key={staff.id} className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-md bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Avatar */}
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          staff.status === 'on-duty' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                          staff.status === 'on-break' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                          'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          {staff.name.split(' ').map(n => n[0]).join('')}
                        </div>

                        {/* Staff Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{staff.name}</h3>
                            <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                              {staff.role}
                            </Badge>
                            <Badge className={`text-xs ${
                              staff.status === 'on-duty' ? 'bg-green-100 text-green-800 border-green-200' :
                              staff.status === 'on-break' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {staff.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Stethoscope className="w-4 h-4" />
                              <span>{staff.department}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{staff.shift}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4 text-yellow-500" />
                              <span>{staff.rating} Rating</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-4 px-6 border-l border-gray-200">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{staff.patients}</div>
                            <div className="text-xs text-gray-600">Current Patients</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{staff.consultations}</div>
                            <div className="text-xs text-gray-600">Total Consults</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{staff.aiAssisted}</div>
                            <div className="text-xs text-gray-600">AI Assisted</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{staff.efficiency}%</div>
                            <div className="text-xs text-gray-600">Efficiency</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
