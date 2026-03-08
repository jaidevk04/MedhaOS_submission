'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, TrendingUp, Activity, Brain,
  Sparkles, Shield, Zap, Clock, CheckCircle,
  ArrowUp, ArrowDown, Target, Award
} from 'lucide-react';

// AI Performance Analytics
const aiPerformanceData = [
  {
    id: 1,
    name: 'AI Ambient Scribe',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
    metrics: {
      accuracy: 97.8,
      speed: '3.2s',
      processed: 8420,
      errors: 12,
      uptime: 99.9,
      satisfaction: 98
    },
    trends: {
      accuracy: '+2.3%',
      speed: '-0.5s',
      processed: '+12%',
      satisfaction: '+5%'
    }
  },
  {
    id: 2,
    name: 'AI CDSS',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    metrics: {
      accuracy: 94.5,
      speed: '2.8s',
      processed: 6890,
      errors: 8,
      uptime: 99.7,
      satisfaction: 96
    },
    trends: {
      accuracy: '+1.8%',
      speed: '-0.3s',
      processed: '+8%',
      satisfaction: '+3%'
    }
  },
  {
    id: 3,
    name: 'Drug Interaction Checker',
    icon: Shield,
    color: 'from-green-500 to-emerald-500',
    metrics: {
      accuracy: 99.2,
      speed: '0.8s',
      processed: 12450,
      errors: 3,
      uptime: 99.95,
      satisfaction: 99
    },
    trends: {
      accuracy: '+0.5%',
      speed: '-0.1s',
      processed: '+15%',
      satisfaction: '+2%'
    }
  },
  {
    id: 4,
    name: 'AI Triage Assistant',
    icon: Zap,
    color: 'from-orange-500 to-red-500',
    metrics: {
      accuracy: 96.1,
      speed: '4.1s',
      processed: 9870,
      errors: 15,
      uptime: 99.6,
      satisfaction: 97
    },
    trends: {
      accuracy: '+3.2%',
      speed: '-0.8s',
      processed: '+22%',
      satisfaction: '+7%'
    }
  }
];

// System-wide analytics
const systemAnalytics = {
  totalProcessed: 37630,
  avgAccuracy: 96.9,
  avgSpeed: '2.7s',
  totalErrors: 38,
  avgUptime: 99.8,
  avgSatisfaction: 97.5,
  timeSaved: '8,240 hrs',
  costSavings: '$1.2M'
};

// Department performance
const departmentPerformance = [
  { name: 'Emergency', aiUsage: 94, efficiency: 89, satisfaction: 96 },
  { name: 'Cardiology', aiUsage: 87, efficiency: 92, satisfaction: 94 },
  { name: 'Neurology', aiUsage: 91, efficiency: 88, satisfaction: 95 },
  { name: 'Pediatrics', aiUsage: 85, efficiency: 90, satisfaction: 97 },
  { name: 'Orthopedics', aiUsage: 78, efficiency: 86, satisfaction: 93 }
];

export default function AnalyticsPage() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/50 px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Analytics & Performance
            </h1>
            <p className="text-slate-600 mt-1">AI performance metrics and system analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              All Systems Operational
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          
          {/* System-wide Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Total Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{systemAnalytics.totalProcessed.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-blue-100">
                  <ArrowUp className="w-3 h-3" />
                  <span>+14% this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Avg Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{systemAnalytics.avgAccuracy}%</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-purple-100">
                  <ArrowUp className="w-3 h-3" />
                  <span>+2.1% improvement</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100">Time Saved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{systemAnalytics.timeSaved}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-100">
                  <ArrowUp className="w-3 h-3" />
                  <span>+18% efficiency</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">Cost Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{systemAnalytics.costSavings}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-orange-100">
                  <ArrowUp className="w-3 h-3" />
                  <span>+25% ROI</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Performance Detailed */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                AI Agents Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {aiPerformanceData.map((agent) => (
                  <div key={agent.id} className="p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg bg-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${agent.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <agent.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{agent.name}</h3>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs mt-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Operational
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Accuracy</div>
                        <div className="text-2xl font-bold text-blue-600">{agent.metrics.accuracy}%</div>
                        <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <ArrowUp className="w-3 h-3" />
                          {agent.trends.accuracy}
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Avg Speed</div>
                        <div className="text-2xl font-bold text-purple-600">{agent.metrics.speed}</div>
                        <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <ArrowDown className="w-3 h-3" />
                          {agent.trends.speed}
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Processed</div>
                        <div className="text-2xl font-bold text-green-600">{agent.metrics.processed.toLocaleString()}</div>
                        <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <ArrowUp className="w-3 h-3" />
                          {agent.trends.processed}
                        </div>
                      </div>

                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Errors</div>
                        <div className="text-2xl font-bold text-red-600">{agent.metrics.errors}</div>
                        <div className="text-xs text-gray-600">Total count</div>
                      </div>

                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Uptime</div>
                        <div className="text-2xl font-bold text-indigo-600">{agent.metrics.uptime}%</div>
                        <div className="text-xs text-gray-600">Last 30 days</div>
                      </div>

                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Satisfaction</div>
                        <div className="text-2xl font-bold text-orange-600">{agent.metrics.satisfaction}%</div>
                        <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <ArrowUp className="w-3 h-3" />
                          {agent.trends.satisfaction}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${agent.color} h-2 rounded-full transition-all`}
                          style={{ width: `${agent.metrics.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  Department AI Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentPerformance.map((dept, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold">{dept.name}</h3>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                          {dept.aiUsage}% AI Usage
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Efficiency</span>
                          <div className="font-bold text-lg text-green-600">{dept.efficiency}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Satisfaction</span>
                          <div className="font-bold text-lg text-purple-600">{dept.satisfaction}%</div>
                        </div>
                        <div className="flex items-end">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                              style={{ width: `${dept.aiUsage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent flex items-center gap-2">
                  <Target className="w-6 h-6 text-blue-600" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-900">System Uptime</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{systemAnalytics.avgUptime}%</span>
                    </div>
                    <div className="text-xs text-green-700">Exceeds target of 99.5%</div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Avg Response Time</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{systemAnalytics.avgSpeed}</span>
                    </div>
                    <div className="text-xs text-blue-700">15% faster than last month</div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">User Satisfaction</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">{systemAnalytics.avgSatisfaction}%</span>
                    </div>
                    <div className="text-xs text-purple-700">+4% increase this quarter</div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-orange-900">Error Rate</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">0.1%</span>
                    </div>
                    <div className="text-xs text-orange-700">Well below 1% threshold</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
