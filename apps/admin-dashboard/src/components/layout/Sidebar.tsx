'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Settings, BarChart3, 
  Shield, Brain, ChevronLeft, ChevronRight, 
  Sparkles, UserCheck, Database, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    description: 'System overview'
  },
  { 
    name: 'Users', 
    href: '/dashboard/users', 
    icon: Users,
    description: 'User management'
  },
  { 
    name: 'Staff', 
    href: '/dashboard/staff', 
    icon: UserCheck,
    description: 'Staff management'
  },
  { 
    name: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: BarChart3,
    description: 'Performance metrics'
  },
  { 
    name: 'System', 
    href: '/dashboard/system', 
    icon: Database,
    description: 'System monitoring'
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    description: 'Configuration'
  }
];

const aiFeatures = [
  { name: 'AI Scribe', status: 'active', color: 'bg-blue-500' },
  { name: 'CDSS', status: 'active', color: 'bg-purple-500' },
  { name: 'Drug Checker', status: 'active', color: 'bg-green-500' },
  { name: 'Triage AI', status: 'active', color: 'bg-orange-500' }
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl h-screen",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                MedhaOS
              </h2>
              <p className="text-slate-400 text-xs mt-1">Admin Dashboard</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-pulse" />
              )}
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200 flex-shrink-0",
                isActive ? "scale-110" : "group-hover:scale-105"
              )} />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{item.name}</div>
                  <div className="text-xs opacity-75 truncate">{item.description}</div>
                </div>
              )}
              {isActive && !collapsed && (
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </div>

      {/* AI Status */}
      {!collapsed && (
        <div className="px-3 py-4 border-t border-slate-700/50 flex-shrink-0">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2 px-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-sm text-blue-400">AI Systems</h3>
            </div>
            <div className="space-y-1.5">
              {aiFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/50">
                  <div className={`w-1.5 h-1.5 rounded-full ${feature.color} animate-pulse`} />
                  <span className="text-xs text-slate-300 flex-1 truncate">{feature.name}</span>
                  <span className="text-xs text-green-400">{feature.status}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* System Status */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-xs font-semibold text-green-400">System Status</span>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Uptime</span>
                <span className="text-green-400">99.8%</span>
              </div>
              <div className="flex justify-between">
                <span>Response</span>
                <span className="text-green-400">1.2s</span>
              </div>
              <div className="flex justify-between">
                <span>Load</span>
                <span className="text-yellow-400">Medium</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed AI Status */}
      {collapsed && (
        <div className="px-3 py-4 border-t border-slate-700/50 flex-shrink-0">
          <div className="space-y-2 flex flex-col items-center">
            <Brain className="w-5 h-5 text-blue-400" />
            <div className="flex flex-col items-center gap-1">
              {aiFeatures.slice(0, 3).map((feature, index) => (
                <div key={index} className={`w-1.5 h-1.5 rounded-full ${feature.color} animate-pulse`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
