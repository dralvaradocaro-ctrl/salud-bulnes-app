import { Navigate } from 'react-router-dom';
import { useAuth } from '@/medispense/contexts/AuthContext';
import { Stethoscope } from 'lucide-react';
import { routes } from '@/medispense/lib/routes';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft flex flex-col items-center gap-4">
          <Stethoscope className="h-12 w-12 text-primary" />
          <p className="text-muted-foreground">Cargando MediPlan AI...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={routes.dashboard()} replace />;
  }

  return <Navigate to={routes.auth()} replace />;
};

export default Index;
