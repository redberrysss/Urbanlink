import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth, RequireRole } from './components/layout/RouteGuards';
import { PageLoader } from './components/common/PageLoader';

/* Public */
import { PublicLayout } from './pages/public/PublicLayout';
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { SignInPage } from './pages/public/SignInPage';
import { RegisterPage } from './pages/public/RegisterPage';

/* Authenticated */
import { OverviewPage } from './pages/app/OverviewPage';
import { NavigationPage } from './pages/app/NavigationPage';
import { ReportsPage } from './pages/app/ReportsPage';
import { ReportDetailPage } from './pages/app/ReportDetailPage';
import { NewReportPage } from './pages/app/NewReportPage';
import { SafetyPage } from './pages/app/SafetyPage';
import { RecyclingHubPage } from './pages/app/RecyclingHubPage';
import { ActivitiesPage } from './pages/app/ActivitiesPage';
import { NotificationsPage } from './pages/app/NotificationsPage';
import { ProfilePage } from './pages/app/ProfilePage';
import { SettingsPage } from './pages/app/SettingsPage';
import { TasksPage } from './pages/app/TasksPage';
import { VerificationPage } from './pages/app/VerificationPage';

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
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Full-screen authentication pages sit outside the public chrome */}
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
          <Route index element={<OverviewPage />} />
          <Route path="navigation" element={<NavigationPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/new" element={<NewReportPage />} />
          <Route path="reports/:reportId" element={<ReportDetailPage />} />
          <Route path="safety" element={<SafetyPage />} />
          <Route path="safety/:hazardId" element={<SafetyPage />} />
          <Route path="recycling" element={<RecyclingHubPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="tasks"
            element={
              <RequireRole roles={['maintenance', 'admin']}>
                <TasksPage />
              </RequireRole>
            }
          />
          <Route
            path="verification"
            element={
              <RequireRole roles={['operator', 'admin']}>
                <VerificationPage />
              </RequireRole>
            }
          />

          {/* ---------------- Admin ---------------- */}
          <Route
            path="admin"
            element={
              <RequireRole roles={['admin']}>
                <AdminDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/issues"
            element={
              <RequireRole roles={['admin']}>
                <IssueManagementPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/teams"
            element={
              <RequireRole roles={['admin']}>
                <MaintenanceTeamsPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/accessibility"
            element={
              <RequireRole roles={['admin']}>
                <AccessibilityAnalyticsPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/safety"
            element={
              <RequireRole roles={['admin']}>
                <SafetyMonitoringPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/recycling"
            element={
              <RequireRole roles={['admin']}>
                <RecyclingManagementPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/users"
            element={
              <RequireRole roles={['admin']}>
                <UsersManagementPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/analytics"
            element={
              <RequireRole roles={['admin']}>
                <ReportsAnalyticsPage />
              </RequireRole>
            }
          />
        </Route>

        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      </Routes>
    </Suspense>
  );
}
