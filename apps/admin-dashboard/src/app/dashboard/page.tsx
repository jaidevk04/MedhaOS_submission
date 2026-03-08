'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, Brain, TrendingUp, Users, 
  Zap, Shield, CheckCircle, AlertTriangle,
  Clock, BarChart3, Sparkles, ArrowUp
} from 'lucide-react';

// Hardcoded AI Agents Data
const aiAgents = [
  {
    id: 1,
    name: 'AI Ambient Scribe',
    status: 'active',
    processed: 8420,
    accuracy: 97.8,
    avgTime: '3.2s',
    trend: '+12%',
    color: 'from-blue-500 to-cyan-500',
    icon: Brain
  },
  {
    id: 2,
    name: 'AI CDSS',
    status: 'active',
    processed: 6890,
    accuracy: 94.5,
    avgTime: '2.8s',
    trend: '+8%',
    color: 'from-purple-500 to-pink-500',
    icon: Sparkles
  },
  {
    id: 3,
    name: 'Drug Interaction',
    status: 'active',
    processed: 12450,
    accuracy: 99.2,
    avgTime: '0.8s',
    trend: '+15%',
    color: 'from-green-500 to-emerald-500',
    icon: Shield
  },
  {
    id: 4,
    name: 'AI Triage',
    status: 'active',
    processed: 9870,
    accuracy: 96.1,
    avgTime: '4.1s',
    trend: '+22%',
    color: 'from-orange-500 to-red-500',
    icon: Activity
  }
];

// System Stats
const systemStats = {
  totalUsers: 2847,
  activeNow: 1923,
  consultations: 15420,
  aiProcessed: 12336,
  uptime: '99.8%',
  responseTime: '1.2s'
};

// Department Stats
const departments = [
  { name: 'Emergency', patients: 145, utilization: 89, status: 'high' },
  { name: 'Cardiology', patients: 78, utilization: 67, status: 'normal' },
  { name: 'Neurology', patients: 56, utilization: 78, status: 'normal' },
  { name: 'Pediatrics', patients: 92, utilization: 82, status: 'high' }
];

// Recent Alerts
const alerts = [
  { type: 'critical', message: 'High server load detected', time: '2m ago' },
  { type: 'warning', message: 'AI response time increased', time: '15m ago' },
  { type: 'info', message: 'Maintenance completed', time: '1h ago' }
];

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/50 px-8 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              MedhaOS Admin Dashboard
            </h1>
            <p className="text-slate-600 mt-1">System Overview & AI Performance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xl font-bold text-slate-900">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-slate-600">
                {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Fixed Height with Internal Scroll */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          
          {/* Top Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-100">Total Users</CardTitle>
                  <Users className="w-5 h-5 text-white/80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-blue-100">
                  <ArrowUp className="w-3 h-3" />
                  <span>+12% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-purple-100">Active Now</CardTitle>
                  <Activity className="w-5 h-5 text-white/80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{systemStats.activeNow.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-purple-100">
                  <ArrowUp className="w-3 h-3" />
                  <span>+8% from yesterday</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-green-100">Consultations</CardTitle>
                  <BarChart3 className="w-5 h-5 text-white/80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{systemStats.consultations.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-100">
                  <ArrowUp className="w-3 h-3" />
                  <span>+18% this week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-orange-100">AI Processed</CardTitle>
                  <Brain className="w-5 h-5 text-white/80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{systemStats.aiProcessed.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-orange-100">
                  <ArrowUp className="w-3 h-3" />
                  <span>+25% efficiency</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Agents & Departments Row */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* AI Agents - Takes 2 columns */}
            <Card className="col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  AI Agents Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {aiAgents.map((agent) => (
                    <div key={agent.id} className="p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-all hover:shadow-lg bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${agent.color} rounded-lg flex items-center justify-center shadow-md`}>
                          <agent.icon className="w-5 h-5 text-white" />
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {agent.status}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm mb-3">{agent.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Processed</span>
                          <div className="font-bold text-base">{agent.processed.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Accuracy</span>
                          <div className="font-bold text-base text-green-600">{agent.accuracy}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Time</span>
                          <div className="font-bold text-base text-blue-600">{agent.avgTime}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Trend</span>
                          <div className="font-bold text-base text-green-600 flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" />
                            {agent.trend}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                        <div 
                          className={`bg-gradient-to-r ${agent.color} h-1.5 rounded-full transition-all`}
                          style={{ width: `${agent.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-red-900 bg-clip-text text-transparent flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      alert.type === 'critical' ? 'bg-red-50 border-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge className={`text-xs mb-1 ${
                            alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.type}
                          </Badge>
                          <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* System Performance */}
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">System Status</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uptime</span>
                      <span className="font-bold text-green-600">{systemStats.uptime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Time</span>
                      <span className="font-bold text-green-600">{systemStats.responseTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Load</span>
                      <span className="font-bold text-yellow-600">Medium</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Departments & Performance Row */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Department Overview */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Department Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {departments.map((dept, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm">{dept.name}</h3>
                        <Badge className={`text-xs ${
                          dept.status === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {dept.utilization}% utilized
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-gray-600">Patients: </span>
                          <span className="font-bold text-blue-600">{dept.patients}</span>
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              dept.status === 'high' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                              'bg-gradient-to-r from-green-400 to-green-600'
                            }`}
                            style={{ width: `${dept.utilization}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Growth Metrics */}
            <div className="grid grid-rows-2 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-indigo-200 text-xs">Uptime</div>
                      <div className="text-2xl font-bold">{systemStats.uptime}</div>
                    </div>
                    <div>
                      <div className="text-indigo-200 text-xs">Response</div>
                      <div className="text-2xl font-bold">{systemStats.responseTime}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-emerald-200 text-xs">Monthly</div>
                      <div className="text-2xl font-bold">+24%</div>
                    </div>
                    <div>
                      <div className="text-emerald-200 text-xs">AI Efficiency</div>
                      <div className="text-2xl font-bold">+31%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
