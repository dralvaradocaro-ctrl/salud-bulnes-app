import { Toaster } from "@/medispense/components/ui/toaster";
import { Toaster as Sonner } from "@/medispense/components/ui/sonner";
import { TooltipProvider } from "@/medispense/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/medispense/contexts/AuthContext";
import { ProtectedRoute } from "@/medispense/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewPatient from "./pages/NewPatient";
import PatientDetail from "./pages/PatientDetail";
import NewPrescription from "./pages/NewPrescription";
import Arsenal from "./pages/Arsenal";
import PatientPortal from "./pages/PatientPortal";
import Education from "./pages/Education";
import EducationView from "./pages/EducationView";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            {/* Public routes - no auth required */}
            <Route path="/portal/:patientCode" element={<PatientPortal />} />
            <Route path="/educacion/:pageId" element={<EducationView />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients/new" element={<NewPatient />} />
              <Route path="/patients/:patientCode/prescription/new" element={<NewPrescription />} />
              <Route path="/patients/:patientCode" element={<PatientDetail />} />
              <Route path="/arsenal" element={<Arsenal />} />
              <Route path="/education" element={<Education />} />
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
