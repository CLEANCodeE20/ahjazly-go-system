import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "./components/ui/loading-spinner";

// Monitoring Components
import { PageLoadMonitor } from "./components/monitoring/PageLoadMonitor";
import { NetworkMonitor } from "./components/monitoring/NetworkMonitor";

// Non-lazy for critical path
import Login from "./pages/Login";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import { MaintenanceGuard } from "./components/auth/MaintenanceGuard";
import { TwoFactorGuard } from "./components/auth/TwoFactorGuard";

// Eagerly Load Public Pages for SPA stability
import Index from "./pages/Index";
import Apply from "./pages/Apply";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Features from "./pages/features";
import About from "./pages/About";
import Contact from "./pages/Contact";

const NotFound = lazy(() => import("./pages/NotFound"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const SetupAdmin = lazy(() => import("./pages/admin/SetupAdmin"));
const CommissionsManagement = lazy(() => import("./pages/admin/CommissionsManagement"));
const FinancialReports = lazy(() => import("./pages/admin/FinancialReports"));
const PartnersManagement = lazy(() => import("./pages/admin/PartnersManagement"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const AuditTrails = lazy(() => import("./pages/admin/AuditTrails"));
const PolicyManagement = lazy(() => import("./pages/admin/PolicyManagement"));
const PlatformSettings = lazy(() => import("./pages/admin/PlatformSettings"));
const SDUIManagement = lazy(() => import("./pages/admin/SDUIManagement"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications").then(m => ({ default: m.AdminNotifications })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const CityManagement = lazy(() => import("./pages/admin/CityManagement"));
const SupportManager = lazy(() => import("./pages/admin/SupportManager"));
const FAQManager = lazy(() => import("./pages/admin/FAQManager"));
const BannerManager = lazy(() => import("./pages/admin/BannerManager"));

// Dashboard Pages
const CompanyDashboard = lazy(() => import("./pages/dashboard/CompanyDashboard"));
const FleetManagement = lazy(() => import("./pages/dashboard/FleetManagement"));
const TripsManagement = lazy(() => import("./pages/dashboard/TripsManagement"));
const BookingsManagement = lazy(() => import("./pages/dashboard/BookingsManagement"));
const BranchesManagement = lazy(() => import("./pages/dashboard/BranchesManagement"));
const EmployeesManagement = lazy(() => import("./pages/dashboard/EmployeesManagement"));
const RoutesManagement = lazy(() => import("./pages/dashboard/RoutesManagement"));
const PaymentsManagement = lazy(() => import("./pages/dashboard/PaymentsManagement"));
const ReportsManagement = lazy(() => import("./pages/dashboard/ReportsManagement"));
const PermissionsManagement = lazy(() => import("./pages/dashboard/PermissionsManagement"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const CancellationPolicies = lazy(() => import("./pages/dashboard/CancellationPolicies"));
const DriverDashboard = lazy(() => import("./pages/dashboard/DriverDashboard"));
const RefundsManagement = lazy(() => import("./pages/dashboard/RefundsManagement"));

// User Management Pages
const UserProfile = lazy(() => import("./pages/UserProfile"));
const SessionManager = lazy(() => import("./pages/SessionManager"));
const TwoFactorSetup = lazy(() => import("./pages/TwoFactorSetup"));
const TwoFactorVerify = lazy(() => import("./pages/TwoFactorVerify"));
const OnboardingWizard = lazy(() => import("./pages/OnboardingWizard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

// Guard Wrapper Component
const GuardedLayout = () => (
  <TwoFactorGuard>
    <MaintenanceGuard>
      <Outlet />
    </MaintenanceGuard>
  </TwoFactorGuard>
);

const App = () => {
  console.log('[App] Rendering at:', window.location.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <PageLoadMonitor />
          <NetworkMonitor />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* === PUBLIC PAGES (Unprotected) === */}
              <Route path="/login" element={<Login />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              <Route path="/" element={<Index />} />
              <Route path="/apply" element={<Apply />} />
              <Route path="/features" element={<Features />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* === GUARDED ROUTES === */}
              <Route element={<GuardedLayout />}>
                {/* Admin Routes */}
                <Route path="/setup-admin" element={<SetupAdmin />} />
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/commissions" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CommissionsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/reports" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <FinancialReports />
                  </ProtectedRoute>
                } />
                <Route path="/admin/partners" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PartnersManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UsersManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/audit-logs" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditTrails />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PlatformSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/sdui" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SDUIManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/notifications" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminNotifications />
                  </ProtectedRoute>
                } />
                <Route path="/admin/cities" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CityManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/policies" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PolicyManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/support" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SupportManager />
                  </ProtectedRoute>
                } />
                <Route path="/admin/faqs" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <FAQManager />
                  </ProtectedRoute>
                } />
                <Route path="/admin/banners" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <BannerManager />
                  </ProtectedRoute>
                } />

                {/* Dashboard & User Routes */}
                <Route path="/notifications" element={
                  <ProtectedRoute allowedRoles={['admin', 'partner', 'employee']}>
                    <NotificationsPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <CompanyDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/fleet" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <FleetManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/trips" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <TripsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/bookings" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <BookingsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/branches" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <BranchesManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/employees" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <EmployeesManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/routes" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <RoutesManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/payments" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <PaymentsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/reports" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <ReportsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/settings" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/permissions" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <PermissionsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/refunds" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <RefundsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/cancellation-policies" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <CancellationPolicies />
                  </ProtectedRoute>
                } />
                <Route path="/driver" element={
                  <ProtectedRoute allowedRoles={['partner', 'employee']}>
                    <DriverDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['admin', 'partner', 'employee']}>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                <Route path="/sessions" element={
                  <ProtectedRoute allowedRoles={['admin', 'partner', 'employee']}>
                    <SessionManager />
                  </ProtectedRoute>
                } />
                <Route path="/2fa-setup" element={
                  <ProtectedRoute allowedRoles={['admin', 'partner', 'employee']}>
                    <TwoFactorSetup />
                  </ProtectedRoute>
                } />
                <Route path="/2fa-verify" element={
                  <ProtectedRoute allowedRoles={['admin', 'partner', 'employee']}>
                    <TwoFactorVerify />
                  </ProtectedRoute>
                } />
                <Route path="/onboarding" element={
                  <ProtectedRoute allowedRoles={['admin', 'partner', 'employee']}>
                    <OnboardingWizard />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
