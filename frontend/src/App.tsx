import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SupportModal } from './components/SupportModal';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { JourneyPlannerPage } from './pages/JourneyPlannerPage';
import { RiskDashboardPage } from './pages/RiskDashboardPage';
import { ThreatCentrePage } from './pages/ThreatCentrePage';
import { IncidentDetailsPage } from './pages/IncidentDetailsPage';
import { CommunityReportPage } from './pages/CommunityReportPage';
import { AssistantPage } from './pages/AssistantPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-warmWhite text-navy-900 font-sans selection:bg-mint selection:text-navy-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/plan" element={<JourneyPlannerPage />} />
              <Route path="/dashboard/:analysisId" element={<RiskDashboardPage />} />
              <Route path="/threats" element={<ThreatCentrePage />} />
              <Route path="/incidents/:id" element={<IncidentDetailsPage />} />
              <Route path="/report" element={<CommunityReportPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/app" element={<DashboardPage />} />
              <Route path="/my-trips" element={<MyTripsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <Footer />
          <SupportModal />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
