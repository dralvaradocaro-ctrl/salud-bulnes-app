import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/medispense/contexts/AuthContext';
import { Button } from '@/medispense/components/ui/button';
import { Input } from '@/medispense/components/ui/input';
import { Label } from '@/medispense/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { useToast } from '@/medispense/hooks/use-toast';
import { Stethoscope, Pill, Heart, Shield } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().min(1, 'Usuario requerido');
const passwordSchema = z.string().min(4, 'La contraseña debe tener al menos 4 caracteres');

export default function Auth() {
  const { user, loading, signIn } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft">
          <Stethoscope className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/PrescripcionInteligente/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(username);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Error de validación',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    // Append @mediplan.local for internal users
    const email = username.includes('@') ? username : `${username}@mediplan.local`;
    const { error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message === 'Invalid login credentials' 
          ? 'Credenciales inválidas. Verifica tu usuario y contraseña.'
          : error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-medical p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-10 w-10 text-primary-foreground" />
          <span className="text-2xl font-bold text-primary-foreground">MediPlan AI</span>
        </div>
        
        <div className="space-y-8">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            Gestión Inteligente de<br />Prescripciones Médicas
          </h1>
          <p className="text-lg text-primary-foreground/90">
            Sistema avanzado con interpretación de lenguaje natural mediante IA para optimizar el proceso de prescripción hospitalaria.
          </p>
          
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary-foreground/10">
                <Pill className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">Arsenal Completo</h3>
                <p className="text-sm text-primary-foreground/80">386+ medicamentos del arsenal hospitalario</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary-foreground/10">
                <Heart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">Portal Paciente</h3>
                <p className="text-sm text-primary-foreground/80">Acceso con QR y notificaciones</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary-foreground/10">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-foreground">Seguridad</h3>
                <p className="text-sm text-primary-foreground/80">Datos protegidos y encriptados</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/60">
          © 2024 MediPlan AI. Sistema de gestión hospitalaria.
        </p>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Stethoscope className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">MediPlan AI</span>
          </div>

          <Card className="shadow-medical border-0">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
              <CardDescription className="text-center">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full shadow-medical" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Sistema exclusivo para personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
