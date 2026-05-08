import { Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { TooltipProvider } from '@/medispense/components/ui/tooltip';
import { Toaster } from '@/medispense/components/ui/toaster';
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

function BackToSaludBulnesBar() {
  const navigate = useNavigate();
  return (
    <div className="flex w-full items-center border-b border-slate-200 bg-slate-900 px-4 py-1.5 text-white">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white transition-all hover:bg-white/20"
        aria-label="Volver a Salud Bulnes"
      >
        <ArrowLeft className="h-3 w-3" />
        <span>Volver a Salud Bulnes</span>
      </button>
      <span className="ml-3 text-[10px] uppercase tracking-wider text-white/60">
        Sub-aplicación · Prescripción Inteligente
      </span>
    </div>
  );
}

export default function PrescripcionInteligente() {
  return (
    <div className="medispense-root">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BackToSaludBulnesBar />
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
