import { useAuth } from '@/medispense/contexts/AuthContext';
import { useUserRole } from '@/medispense/hooks/useUserRole';
import { Button } from '@/medispense/components/ui/button';
import { Badge } from '@/medispense/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/medispense/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/medispense/components/ui/avatar';
import { Stethoscope, LogOut, User, Settings, BookOpen, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { routes } from '@/medispense/lib/routes';

export function Header() {
  const { user, signOut } = useAuth();
  const { role, isAdmin } = useUserRole();

  const roleLabel = role === 'admin' ? 'Médico' : role === 'nurse' ? 'Enfermero/a' : null;

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MD';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to={routes.dashboard()} className="flex items-center gap-2">
          <Stethoscope className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">MediPlan AI</span>
          {roleLabel && (
            <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
              {roleLabel}
            </Badge>
          )}
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to={routes.adminUsers()}>
                <Shield className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Usuarios</span>
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link to={routes.education()}>
              <BookOpen className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Educación</span>
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
