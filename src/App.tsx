import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth, RequireRole } from './components/layout/RouteGuards';
import { PageLoader } from './components/common/PageLoader';

/* Public */
import { PublicLayout } from './pages/public/PublicLayout';
import { HomePage as PublicHomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { SignInPage } from './pages/public/SignInPage';
import { RegisterPage } from './pages/public/RegisterPage';

/* Authenticated - Resident */
import { HomePage } from './pages/app/HomePage';
import { NavigationPage } from './pages/app/NavigationPage';
import { ReportsPage } from './pages/app/ReportsPage';
import { ReportDetailPage } from './pages/app/ReportDetailPage';
import { NewReportPage } from './pages/app/NewReportPage';
import { SafetyPage } from './pages/app/SafetyPage';
import { RecyclingHubPage } from './pages/app/RecyclingHubPage';
import { NotificationsPage } from './pages/app/NotificationsPage';
import { ProfilePage } from './pages/app/ProfilePage';
import { SettingsPage } from './pages/app/SettingsPage';

/* Maintenance */
import { MaintenanceTodayPage } from './pages/maintenance/MaintenanceTodayPage';
import { MaintenanceJobsPage } from './pages/maintenance/MaintenanceJobsPage';
import { MaintenanceJobDetailPage } from './pages/maintenance/MaintenanceJobDetailPage';
import { MaintenanceMapPage } from './pages/maintenance/MaintenanceMapPage';
import { MaintenanceHistoryPage } from './pages/maintenance/MaintenanceHistoryPage';
import { MaintenanceProfilePage } from './pages/maintenance/MaintenanceProfilePage';
import { MaintenanceSettingsPage } from './pages/maintenance/MaintenanceSettingsPage';

/* Operator */
import { OperatorDashboardPage } from './pages/operator/OperatorDashboardPage';
import { OperatorSubmissionsPage } from './pages/operator/OperatorSubmissionsPage';
import { OperatorStationsPage } from './pages/operator/OperatorStationsPage';
import { OperatorCollectionsPage } from './pages/operator/OperatorCollectionsPage';
import { OperatorHistoryPage } from './pages/operator/OperatorHistoryPage';
import { OperatorProfilePage } from './pages/operator/OperatorProfilePage';
import { OperatorSettingsPage } from './pages/operator/OperatorSettingsPage';

/* Admin */
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { IssueManagementPage } from './pages/admin/IssueManagementPage';
import { MaintenanceTeamsPage } from './pages/admin/MaintenanceTeamsPage';
import { AccessibilityAnalyticsPage } from './pages/admin/AccessibilityAnalyticsPage';
import { SafetyMonitoringPage } from './pages/admin/SafetyMonitoringPage';
import { RecyclingManagementPage } from './pages/admin/RecyclingManagementPage';
import { UsersManagementPage } from './pages/admin/UsersManagementPage';
import { ReportsAnalyticsPage } from './pages/admin/ReportsAnalyticsPage';

const NotFound = lazy(() => import('./pages/public/NotFoundPage'));

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ---------------- Public ---------------- */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/signin" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ---------------- Authenticated ---------------- */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          {/* Resident routes */}
          <Route index element={<HomePage />} />
          <Route path="navigation" element={<NavigationPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/new" element={<NewReportPage />} />
          <Route path="reports/:reportId" element={<ReportDetailPage />} />
          <Route path="safety" element={<SafetyPage />} />
          <Route path="safety/:hazardId" element={<SafetyPage />} />
          <Route path="recycling" element={<RecyclingHubPage />} />
          <Route path="activities" element={<Navigate to="/app/recycling?tab=activity" replace />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Maintenance routes */}
          <Route path="maintenance/today" element={<RequireRole roles={['maintenance', 'admin']}><MaintenanceTodayPage /></RequireRole>} />
          <Route path="maintenance/jobs" element={<RequireRole roles={['maintenance', 'admin']}><MaintenanceJobsPage /></RequireRole>} />
          <Route path="maintenance/jobs/:jobId" element={<RequireRole roles={['maintenance', 'admin']}><MaintenanceJobDetailPage /></RequireRole>} />
          <Route path="maintenance/map" element={<RequireRole roles={['maintenance', 'admin']}><MaintenanceMapPage /></RequireRole>} />
          <Route path="maintenance/history" element={<RequireRole roles={['maintenance', 'admin']}><MaintenanceHistoryPage /></RequireRole>} />
          <Route path="maintenance/profile" element={<RequireRole roles={['maintenance', 'admin']}><MaintenanceProfilePage /></RequireRole>} />
          <Route path="maintenance/settings" element={<RequireRole roles={['maintenance', 'admin']}><MaintenanceSettingsPage /></RequireRole>} />

          {/* Operator routes */}
          <Route path="recycling-operator/dashboard" element={<RequireRole roles={['operator', 'admin']}><OperatorDashboardPage /></RequireRole>} />
          <Route path="recycling-operator/submissions" element={<RequireRole roles={['operator', 'admin']}><OperatorSubmissionsPage /></RequireRole>} />
          <Route path="recycling-operator/stations" element={<RequireRole roles={['operator', 'admin']}><OperatorStationsPage /></RequireRole>} />
          <Route path="recycling-operator/collections" element={<RequireRole roles={['operator', 'admin']}><OperatorCollectionsPage /></RequireRole>} />
          <Route path="recycling-operator/history" element={<RequireRole roles={['operator', 'admin']}><OperatorHistoryPage /></RequireRole>} />
          <Route path="recycling-operator/profile" element={<RequireRole roles={['operator', 'admin']}><OperatorProfilePage /></RequireRole>} />
          <Route path="recycling-operator/settings" element={<RequireRole roles={['operator', 'admin']}><OperatorSettingsPage /></RequireRole>} />

          {/* Admin routes */}
          <Route path="admin" element={<RequireRole roles={['admin']}><AdminDashboardPage /></RequireRole>} />
          <Route path="admin/reports-jobs" element={<RequireRole roles={['admin']}><IssueManagementPage /></RequireRole>} />
          <Route path="admin/issues" element={<RequireRole roles={['admin']}><IssueManagementPage /></RequireRole>} />
          <Route path="admin/teams" element={<RequireRole roles={['admin']}><MaintenanceTeamsPage /></RequireRole>} />
          <Route path="admin/accessibility" element={<RequireRole roles={['admin']}><AccessibilityAnalyticsPage /></RequireRole>} />
          <Route path="admin/safety" element={<RequireRole roles={['admin']}><SafetyMonitoringPage /></RequireRole>} />
          <Route path="admin/township-map" element={<RequireRole roles={['admin']}><SafetyMonitoringPage /></RequireRole>} />
          <Route path="admin/recycling" element={<RequireRole roles={['admin']}><RecyclingManagementPage /></RequireRole>} />
          <Route path="admin/analytics" element={<RequireRole roles={['admin']}><ReportsAnalyticsPage /></RequireRole>} />
          <Route path="admin/administration" element={<RequireRole roles={['admin']}><UsersManagementPage /></RequireRole>} />
          <Route path="admin/users" element={<RequireRole roles={['admin']}><UsersManagementPage /></RequireRole>} />
        </Route>

        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      </Routes>
    </Suspense>
  );
}
