import { Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { TooltipProvider } from '@/medispense/components/ui/tooltip';
import { Toaster } from '@/medispense/components/ui/toaster';
import { Toaster as Sonner } from '@/medispense/components/ui/sonner';
import { AuthProvider } from '@/medispense/contexts/AuthContext';
import { ProtectedRoute } from '@/medispense/components/layout/ProtectedRoute';
import Index from '@/medispense/pages/Index';
import Auth from '@/medispense/pages/Auth';
import Dashboard from '@/medispense/pages/Dashboard';
import NewPatient from '@/medispense/pages/NewPatient';
import PatientDetail from '@/medispense/pages/PatientDetail';
import NewPrescription from '@/medispense/pages/NewPrescription';
import Arsenal from '@/medispense/pages/Arsenal';
import PatientPortal from '@/medispense/pages/PatientPortal';
import Education from '@/medispense/pages/Education';
import EducationView from '@/medispense/pages/EducationView';
import UserManagement from '@/medispense/pages/UserManagement';
import NotFound from '@/medispense/pages/NotFound';

// CSS scopeado: las variables CSS de medispense se aplican SOLO dentro
// del wrapper .medispense-root, sin romper el design system de salud-bulnes.
import '@/medispense/medispense-scoped.css';

// QueryClient propio para aislar de la app principal
const queryClient = new QueryClient();

function BackToSaludBulnesButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="fixed top-3 left-3 z-50 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md ring-1 ring-slate-200 backdrop-blur-sm transition-all hover:bg-white hover:text-blue-700 hover:shadow-lg"
      aria-label="Volver a Salud Bulnes"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span>Volver a Salud Bulnes</span>
    </button>
  );
}

export default function PrescripcionInteligente() {
  return (
    <div className="medispense-root">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BackToSaludBulnesButton />
            <Routes>
              <Route index element={<Index />} />
              <Route path="auth" element={<Auth />} />
              {/* Public routes — no auth required */}
              <Route path="portal/:patientCode" element={<PatientPortal />} />
              <Route path="educacion/:pageId" element={<EducationView />} />
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="patients/new" element={<NewPatient />} />
                <Route path="patients/:patientCode/prescription/new" element={<NewPrescription />} />
                <Route path="patients/:patientCode" element={<PatientDetail />} />
                <Route path="arsenal" element={<Arsenal />} />
                <Route path="education" element={<Education />} />
                <Route path="admin/users" element={<UserManagement />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}
