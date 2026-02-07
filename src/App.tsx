import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import {
  ImageIcon,
  Shield,
  X
} from "lucide-react";
import { LoadingSpinner } from "./components/ui/loading-spinner";

// Monitoring Components
import { PageLoadMonitor } from "./components/monitoring/PageLoadMonitor";
import { NetworkMonitor } from "./components/monitoring/NetworkMonitor";

// Non-lazy for critical path
import Login from "./pages/Login";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import { MaintenanceGuard } from "./components/auth/MaintenanceGuard";
import { TwoFactorGuard } from "./components/auth/TwoFactorGuard";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";

// Eagerly Load Public Pages for SPA stability
import Index from "./pages/Index";
import Apply from "./pages/Apply";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
// Lazy load ApplicationStatus as it's not critical for FCP
const ApplicationStatus = lazy(() => import("./pages/partner/ApplicationStatus"));
import Features from "./pages/features";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Unauthorized from "./pages/Unauthorized";

const NotFound = lazy(() => import("./pages/NotFound"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const TwoFactorSetup = lazy(() => import("./pages/TwoFactorSetup"));
const TwoFactorVerify = lazy(() => import("./pages/TwoFactorVerify"));


// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const SetupAdmin = lazy(() => import("./pages/admin/SetupAdmin"));
const CommissionsManagement = lazy(() => import("./pages/admin/CommissionsManagement"));
const FinancialReports = lazy(() => import("./pages/admin/FinancialReports"));
const PartnersManagement = lazy(() => import("./pages/admin/PartnersManagement"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const StaffManagement = lazy(() => import("./pages/admin/StaffManagement"));
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
const CancellationApprovals = lazy(() => import("./pages/admin/CancellationApprovals"));

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
const AdvancedReportsPage = lazy(() => import("./pages/dashboard/AdvancedReportsPage"));
const PermissionsManagement = lazy(() => import("./pages/dashboard/PermissionsManagement"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const CancellationPolicies = lazy(() => import("./pages/dashboard/CancellationPolicies"));
const RatingsManagement = lazy(() => import("./pages/dashboard/RatingsManagement").then(m => ({ default: m.RatingsManagement })));
const DriverDashboard = lazy(() => import("./pages/dashboard/DriverDashboard"));
const DriversManagement = lazy(() => import("./pages/dashboard/DriversManagement"));
const RefundsManagement = lazy(() => import("./pages/dashboard/RefundsManagement"));
const WalletPage = lazy(() => import("./pages/dashboard/WalletPage"));
const WithdrawalsManagement = lazy(() => import("./pages/dashboard/WithdrawalsManagement"));
const PartnerSettlements = lazy(() => import("./pages/dashboard/PartnerSettlements"));
const AdminWalletManagement = lazy(() => import("./pages/dashboard/AdminWalletManagement"));
const DepositsManagement = lazy(() => import("./pages/dashboard/DepositsManagement"));
const FinancialAnalytics = lazy(() => import("./pages/dashboard/FinancialAnalytics"));
const FinancialStatement = lazy(() => import("./pages/dashboard/FinancialStatement"));
const BankDetails = lazy(() => import("./pages/partner/BankDetails"));

// User Management Pages
const UserProfile = lazy(() => import("./pages/UserProfile"));
const SessionManager = lazy(() => import("./pages/SessionManager"));
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

import { MaintenanceCountdownBanner } from "./components/auth/MaintenanceCountdownBanner";

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
          <MaintenanceCountdownBanner />
          <PageLoadMonitor />
          <NetworkMonitor />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* === PUBLIC PAGES (Unprotected) === */}
              <Route path="/login" element={<Login />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/2fa-setup" element={<TwoFactorSetup />} />
              <Route path="/2fa-verify" element={<TwoFactorVerify />} />
              <Route path="/application-status" element={<ApplicationStatus />} />


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
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/commissions" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <CommissionsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/reports" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <FinancialReports />
                  </ProtectedRoute>
                } />
                <Route path="/admin/partners" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <PartnersManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <UsersManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/staff" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <StaffManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/audit-logs" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <AuditTrails />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <PlatformSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/sdui" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <SDUIManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/notifications" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <AdminNotifications />
                  </ProtectedRoute>
                } />
                <Route path="/admin/cities" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <CityManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/policies" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <PolicyManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/support" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <SupportManager />
                  </ProtectedRoute>
                } />
                <Route path="/admin/faqs" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <FAQManager />
                  </ProtectedRoute>
                } />
                <Route path="/admin/banners" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <BannerManager />
                  </ProtectedRoute>
                } />
                <Route path="/admin/cancellation-approvals" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <CancellationApprovals />
                  </ProtectedRoute>
                } />

                {/* Dashboard & User Routes */}
                <Route path="/notifications" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant']}>
                    <NotificationsPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <CompanyDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/fleet" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <FleetManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/trips" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <TripsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/bookings" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <BookingsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/branches" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <BranchesManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/employees" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <EmployeesManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/routes" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <RoutesManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/drivers" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <DriversManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/payments" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <PaymentsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/reports" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <ReportsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/advanced-reports" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <AdvancedReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/settings" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/partner/bank-details" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager']}>
                    <DashboardLayout title="البيانات البنكية">
                      <BankDetails />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/permissions" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <PermissionsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/refunds" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <RefundsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/wallet" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <WalletPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/withdrawals" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <WithdrawalsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/partner-settlements" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN']}>
                    <PartnerSettlements />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/admin-wallets" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <AdminWalletManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/deposits" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER']}>
                    <DepositsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/financial-analytics" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN']}>
                    <FinancialAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/financial-statement" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN']}>
                    <FinancialStatement />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/cancellation-policies" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <CancellationPolicies />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/cancellation-approvals" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <CancellationApprovals />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/ratings" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor']}>
                    <RatingsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/driver" element={
                  <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor', 'driver']}>
                    <DriverDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant']}>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                <Route path="/sessions" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant']}>
                    <SessionManager />
                  </ProtectedRoute>
                } />
                <Route path="/2fa-setup" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant']}>
                    <TwoFactorSetup />
                  </ProtectedRoute>
                } />
                <Route path="/2fa-verify" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant']}>
                    <TwoFactorVerify />
                  </ProtectedRoute>
                } />
                <Route path="/onboarding" element={
                  <ProtectedRoute allowedRoles={['SUPERUSER', 'PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant']}>
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
