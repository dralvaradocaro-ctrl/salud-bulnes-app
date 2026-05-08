import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Button } from '@/medispense/components/ui/button';
import { Input } from '@/medispense/components/ui/input';
import { Label } from '@/medispense/components/ui/label';
import { Badge } from '@/medispense/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/medispense/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/medispense/components/ui/dialog';
import { ArrowLeft, UserPlus, Users, Shield, ShieldCheck } from 'lucide-react';
import { supabase } from '@/medispense/integrations/supabase/client';
import { useUserRole } from '@/medispense/hooks/useUserRole';
import { useToast } from '@/medispense/hooks/use-toast';
import { logAudit } from '@/medispense/lib/audit';
import { routes } from '@/medispense/lib/routes';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  role: 'admin' | 'nurse' | null;
  email?: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', password: '', role: 'nurse' as 'admin' | 'nurse' });

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name');
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');

    if (profiles) {
      const merged: UserProfile[] = profiles.map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        role: (roles?.find((r: any) => r.user_id === p.user_id) as any)?.role || null,
      }));
      setUsers(merged);
    }
    setLoading(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      toast({ title: 'Error', description: 'Completa todos los campos', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const email = `${newUser.username}@mediplan.local`;

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password: newUser.password, fullName: newUser.fullName, role: newUser.role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Usuario creado', description: `${newUser.fullName} (${newUser.username})` });
      
      await logAudit({
        entityType: 'user',
        actionType: 'create',
        description: `Creó usuario "${newUser.fullName}" (${newUser.username}) con rol ${newUser.role === 'admin' ? 'Médico' : 'Enfermero/a'}`,
      });

      setShowCreate(false);
      setNewUser({ username: '', fullName: '', password: '', role: 'nurse' });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'nurse') => {
    const targetUser = users.find(u => u.user_id === userId);
    const oldRole = targetUser?.role;

    // Upsert: delete existing then insert
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Rol actualizado' });
    
    await logAudit({
      entityType: 'user',
      actionType: 'update',
      fieldChanged: 'role',
      oldValue: oldRole || 'sin rol',
      newValue: newRole,
      description: `Cambió rol de "${targetUser?.full_name}" de ${oldRole === 'admin' ? 'Médico' : 'Enfermero/a'} a ${newRole === 'admin' ? 'Médico' : 'Enfermero/a'}`,
    });

    fetchUsers();
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(routes.dashboard())}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Administrar Usuarios</h1>
            <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Usuarios Registrados</CardTitle>
            <Badge variant="secondary">{users.length}</Badge>
          </div>
          <CardDescription>Usuarios con acceso al sistema</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay usuarios</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {u.role === 'admin' ? (
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      ) : (
                        <Shield className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{u.full_name || 'Sin nombre'}</p>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {u.role === 'admin' ? 'Médico (Admin)' : u.role === 'nurse' ? 'Enfermero/a' : 'Sin rol'}
                      </Badge>
                    </div>
                  </div>
                  <Select value={u.role || ''} onValueChange={(v) => handleChangeRole(u.user_id, v as 'admin' | 'nurse')}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Asignar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Médico (Admin)</SelectItem>
                      <SelectItem value="nurse">Enfermero/a</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create user dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Crear Usuario
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de usuario</Label>
              <Input
                placeholder="ej: jperez"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Se usará como {newUser.username || 'usuario'}@mediplan.local</p>
            </div>
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input
                placeholder="Dr. Juan Pérez"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as 'admin' | 'nurse' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Médico (Admin)</SelectItem>
                  <SelectItem value="nurse">Enfermero/a</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} disabled={creating}>
                {creating ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
