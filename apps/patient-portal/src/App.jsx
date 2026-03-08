import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LanguageSelectionPage from './pages/LanguageSelectionPage';
import VoiceTriagePage from './pages/VoiceTriagePage';
import TextSymptomsPage from './pages/TextSymptomsPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import ConfirmationPage from './pages/ConfirmationPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/language" element={<LanguageSelectionPage />} />
              <Route path="/triage" element={<VoiceTriagePage />} />
              <Route path="/text-symptoms" element={<TextSymptomsPage />} />
              <Route path="/book-appointment" element={<BookAppointmentPage />} />
              <Route path="/confirmation/:appointmentId" element={<ConfirmationPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
