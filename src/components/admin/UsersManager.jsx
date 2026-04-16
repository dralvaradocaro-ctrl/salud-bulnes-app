const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Shield, User, Search, X } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-700' },
  { value: 'user', label: 'Usuario', color: 'bg-blue-100 text-blue-700' }
];

export default function UsersManager() {
  const queryClient = useQueryClient();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'user'
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => db.entities.User.list('-created_date')
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }) => db.users.inviteUser(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Invitación enviada');
      setInviteData({ email: '', role: 'user' });
      setShowInviteForm(false);
    },
    onError: (error) => {
      toast.error('Error al enviar invitación');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => db.entities.User.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Rol actualizado');
    }
  });

  const handleInvite = () => {
    if (!inviteData.email) {
      toast.error('Email es requerido');
      return;
    }
    inviteMutation.mutate(inviteData);
  };

  const filteredUsers = users.filter(user => 
    !searchQuery || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      {showInviteForm && (
        <Card className="p-6 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Invitar Nuevo Usuario</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowInviteForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div>
              <Label>Rol</Label>
              <select
                value={inviteData.role}
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
              <UserPlus className="h-4 w-4 mr-2" />
              Enviar Invitación
            </Button>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        {!showInviteForm && (
          <Button onClick={() => setShowInviteForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invitar Usuario
          </Button>
        )}
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500">No se encontraron usuarios</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map(user => {
            const roleConfig = ROLES.find(r => r.value === user.role) || ROLES[1];
            
            return (
              <Card key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-full">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">
                          {user.full_name || 'Usuario sin nombre'}
                        </span>
                        <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Registrado: {new Date(user.created_date).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newRole = user.role === 'admin' ? 'user' : 'admin';
                        if (confirm(`¿Cambiar rol a ${newRole === 'admin' ? 'Administrador' : 'Usuario'}?`)) {
                          updateRoleMutation.mutate({ id: user.id, role: newRole });
                        }
                      }}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Cambiar Rol
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}