'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, Server, Cpu, HardDrive, 
  Wifi, Shield, Activity, AlertTriangle,
  CheckCircle, Clock, Zap, TrendingUp
} from 'lucide-react';

// System health data
const systemHealth = {
  status: 'healthy',
  uptime: '99.8%',
  lastRestart: '15 days ago',
  activeConnections: 1923,
  requestsPerMin: 4567,
  avgResponseTime: '1.2s'
};

// Server metrics
const serverMetrics = [
  {
    name: 'API Server',
    status: 'healthy',
    cpu: 45,
    memory: 62,
    disk: 38,
    uptime: 99.9,
    requests: 12450
  },
  {
    name: 'Database Server',
    status: 'healthy',
    cpu: 38,
    memory: 71,
    disk: 54,
    uptime: 99.95,
    requests: 8920
  },
  {
    name: 'AI Processing Server',
    status: 'healthy',
    cpu: 78,
    memory: 84,
    disk: 42,
    uptime: 99.7,
    requests: 15670
  },
  {
    name: 'WebSocket Server',
    status: 'healthy',
    cpu: 32,
    memory: 48,
    disk: 28,
    uptime: 99.85,
    requests: 6780
  }
];

// AI Services status
const aiServices = [
  { name: 'AI Ambient Scribe', status: 'running', health: 98, latency: '3.2s', memory: '2.4 GB' },
  { name: 'AI CDSS', status: 'running', health: 96, latency: '2.8s', memory: '1.8 GB' },
  { name: 'Drug Interaction Checker', status: 'running', health: 99, latency: '0.8s', memory: '1.2 GB' },
  { name: 'AI Triage', status: 'running', health: 97, latency: '4.1s', memory: '3.1 GB' },
  { name: 'Allergy Checker', status: 'running', health: 98, latency: '0.5s', memory: '0.9 GB' }
];

// Recent system events
const systemEvents = [
  { type: 'info', message: 'Database backup completed successfully', time: '5 min ago' },
  { type: 'success', message: 'AI model updated to v2.4.1', time: '1 hour ago' },
  { type: 'warning', message: 'High CPU usage on AI Processing Server', time: '2 hours ago' },
  { type: 'info', message: 'Security patch applied', time: '3 hours ago' },
  { type: 'success', message: 'System health check passed', time: '6 hours ago' }
];

export default function SystemPage() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/50 px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              System Monitoring
            </h1>
            <p className="text-slate-600 mt-1">Real-time system health and performance</p>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2 text-base">
            <CheckCircle className="w-5 h-5 mr-2" />
            All Systems Healthy
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          
          {/* System Overview Stats */}
          <div className="grid grid-cols-6 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Healthy</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{systemHealth.uptime}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{systemHealth.activeConnections.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Requests/Min</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{systemHealth.requestsPerMin.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{systemHealth.avgResponseTime}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Last Restart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-gray-600">{systemHealth.lastRestart}</div>
              </CardContent>
            </Card>
          </div>

          {/* Server Metrics */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                <Server className="w-6 h-6 text-blue-600" />
                Server Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {serverMetrics.map((server, index) => (
                  <div key={index} className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Server className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{server.name}</h3>
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs mt-1">
                            {server.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{server.uptime}%</div>
                        <div className="text-xs text-gray-600">Uptime</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">CPU Usage</span>
                          <span className="font-bold">{server.cpu}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              server.cpu > 70 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                              server.cpu > 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                              'bg-gradient-to-r from-green-400 to-green-600'
                            }`}
                            style={{ width: `${server.cpu}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Memory Usage</span>
                          <span className="font-bold">{server.memory}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              server.memory > 80 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                              server.memory > 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                              'bg-gradient-to-r from-green-400 to-green-600'
                            }`}
                            style={{ width: `${server.memory}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Disk Usage</span>
                          <span className="font-bold">{server.disk}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                            style={{ width: `${server.disk}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Requests Processed</span>
                          <span className="font-bold text-blue-600">{server.requests.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Services & System Events */}
          <div className="grid grid-cols-2 gap-6">
            {/* AI Services */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                  <Zap className="w-6 h-6 text-blue-600" />
                  AI Services Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiServices.map((service, index) => (
                    <div key={index} className="p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-semibold text-sm">{service.name}</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          {service.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Health</span>
                          <div className="font-bold text-green-600">{service.health}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Latency</span>
                          <div className="font-bold text-blue-600">{service.latency}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Memory</span>
                          <div className="font-bold text-purple-600">{service.memory}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Events */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-600" />
                  Recent System Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemEvents.map((event, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      event.type === 'success' ? 'bg-green-50 border-green-500' :
                      event.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {event.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {event.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                            {event.type === 'info' && <Activity className="w-4 h-4 text-blue-600" />}
                            <Badge className={`text-xs ${
                              event.type === 'success' ? 'bg-green-100 text-green-800' :
                              event.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {event.type}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{event.message}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </p>
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
    </div>
  );
}
