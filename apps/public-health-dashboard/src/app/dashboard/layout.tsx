'use client';

import { useEffect } from 'react';
import { Activity, Bell, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import websocketService from '@/lib/websocket';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Connect to WebSocket for real-time updates
    websocketService.connect();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary-500" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">MedhaOS</h1>
                <p className="text-xs text-gray-600">Public Health Intelligence</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              <span className="text-green-700 font-medium">Live</span>
            </div>
            
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 px-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>© 2026 MedhaOS Healthcare Intelligence Ecosystem</p>
          <p>Last updated: {new Date().toLocaleString('en-IN')}</p>
        </div>
      </footer>
    </div>
  );
}
