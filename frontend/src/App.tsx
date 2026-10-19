import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SupportModal } from './components/SupportModal';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { JourneyPlannerPage } from './pages/JourneyPlannerPage';
import { RiskDashboardPage } from './pages/RiskDashboardPage';
import { ThreatCentrePage } from './pages/ThreatCentrePage';
import { IncidentDetailsPage } from './pages/IncidentDetailsPage';
import { CommunityReportPage } from './pages/CommunityReportPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { AssistantPage } from './pages/AssistantPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

// New Practical Travel Awareness & Navigation Pages
import { RoadWatchPage } from './pages/RoadWatchPage';
import { TravelPackPage } from './pages/TravelPackPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { TravelWisePage } from './pages/TravelWisePage';
import { HazardGuidePage } from './pages/HazardGuidePage';
import { LiveReportsPage } from './pages/LiveReportsPage';
import { OfficialAlertsPage } from './pages/OfficialAlertsPage';
import { SourceCentrePage } from './pages/SourceCentrePage';
import { EmergencyGuidePage } from './pages/EmergencyGuidePage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-warmWhite text-navy-900 font-sans selection:bg-mint selection:text-navy-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Pages: Accessible without authentication */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected Operational Routes: Signed-In Users Only */}
              <Route element={<ProtectedRoute />}>
                {/* 1. Journey Group */}
                <Route path="/plan" element={<JourneyPlannerPage />} />
                <Route path="/my-trips" element={<MyTripsPage />} />
                <Route path="/roadwatch" element={<RoadWatchPage />} />
                <Route path="/travel-pack" element={<TravelPackPage />} />
                <Route path="/dashboard/:analysisId" element={<RiskDashboardPage />} />

                {/* 2. Explore Group */}
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/travelwise" element={<TravelWisePage />} />
                <Route path="/hazard-guide" element={<HazardGuidePage />} />
                <Route path="/threats" element={<ThreatCentrePage />} />
                <Route path="/incidents/:id" element={<IncidentDetailsPage />} />

                {/* 3. Community Group */}
                <Route path="/live-reports" element={<LiveReportsPage />} />
                <Route path="/report" element={<CommunityReportPage />} />
                <Route path="/my-reports" element={<MyReportsPage />} />

                {/* 4. Trust & Safety Group */}
                <Route path="/official-alerts" element={<OfficialAlertsPage />} />
                <Route path="/source-centre" element={<SourceCentrePage />} />
                <Route path="/emergency-guide" element={<EmergencyGuidePage />} />

                {/* Top-Level Platforms */}
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/app" element={<DashboardPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Admin Portal: Authorized Administrators Only */}
              <Route element={<ProtectedRoute requireAdmin />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
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
