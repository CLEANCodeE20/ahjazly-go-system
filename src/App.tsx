import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Apply from "./pages/Apply";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
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
import NotFound from "./pages/NotFound";

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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
