import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/authStore';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import TasksPage from '@/pages/TasksPage';
import PatientsPage from '@/pages/PatientsPage';
import MedicationPage from '@/pages/MedicationPage';
import CommunicationPage from '@/pages/CommunicationPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="h-screen w-screen overflow-hidden bg-background">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/tasks"
            element={
              isAuthenticated ? <TasksPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/patients"
            element={
              isAuthenticated ? <PatientsPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/medication"
            element={
              isAuthenticated ? <MedicationPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/communication"
            element={
              isAuthenticated ? <CommunicationPage /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
