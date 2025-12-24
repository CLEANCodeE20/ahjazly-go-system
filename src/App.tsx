import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Apply from "./pages/Apply";
import Login from "./pages/Login";
import Features from "./pages/features";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SetupAdmin from "./pages/admin/SetupAdmin";
import CommissionsManagement from "./pages/admin/CommissionsManagement";
import FinancialReports from "./pages/admin/FinancialReports";
import CompanyDashboard from "./pages/dashboard/CompanyDashboard";
import FleetManagement from "./pages/dashboard/FleetManagement";
import TripsManagement from "./pages/dashboard/TripsManagement";
import BookingsManagement from "./pages/dashboard/BookingsManagement";
import BranchesManagement from "./pages/dashboard/BranchesManagement";
import EmployeesManagement from "./pages/dashboard/EmployeesManagement";
import RoutesManagement from "./pages/dashboard/RoutesManagement";
import PaymentsManagement from "./pages/dashboard/PaymentsManagement";
import ReportsManagement from "./pages/dashboard/ReportsManagement";
import SettingsPage from "./pages/dashboard/SettingsPage";
import DriverDashboard from "./pages/dashboard/DriverDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/login" element={<Login />} />
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
          <Route path="/driver" element={
            <ProtectedRoute allowedRoles={['partner', 'employee']}>
              <DriverDashboard />
            </ProtectedRoute>
          } />
=======
=======
>>>>>>> Stashed changes
          <Route path="/features" element={<Features />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<CompanyDashboard />} />
          <Route path="/dashboard/fleet" element={<FleetManagement />} />
          <Route path="/dashboard/trips" element={<TripsManagement />} />
          <Route path="/dashboard/bookings" element={<BookingsManagement />} />
          <Route path="/dashboard/branches" element={<BranchesManagement />} />
          <Route path="/dashboard/employees" element={<EmployeesManagement />} />
          <Route path="/dashboard/routes" element={<RoutesManagement />} />
          <Route path="/dashboard/payments" element={<PaymentsManagement />} />
          <Route path="/dashboard/reports" element={<ReportsManagement />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
>>>>>>> Stashed changes
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
