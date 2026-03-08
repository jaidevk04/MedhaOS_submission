'use client';

import { ProtectedRoute } from '@/components/auth';
import { useSession } from '@/hooks';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/layout/Sidebar';
import { LogOut, Settings, Bell } from 'lucide-react';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const { handleLogout } = useSession();

  return (
    <ProtectedRoute allowedRoles={['doctor', 'nurse', 'admin']}>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          {/* Top Navigation Bar */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">🏥</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    MedhaOS Clinician Terminal
                  </h1>
                  <p className="text-sm text-gray-500">
                    {user?.role === 'doctor' && 'Clinical Workspace'}
                    {user?.role === 'nurse' && 'Nursing Station'}
                    {user?.role === 'admin' && 'Administration'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </Button>

                {/* Settings */}
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>

                {/* User Info */}
                <div className="flex items-center space-x-3 pl-4 border-l">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                </div>

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content with Sidebar */}
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-6 bg-gray-50">{children}</main>
          </div>
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
