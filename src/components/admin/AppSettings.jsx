import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Globe, Mail, Bell, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function AppSettings() {
  const [settings, setSettings] = useState({
    appName: 'Guía Clínica Hospital Bulnes',
    appDescription: 'Protocolos, flujos de atención y herramientas clínicas para el personal de salud',
    contactEmail: 'contacto@hospitalbulnes.cl',
    enableNotifications: true,
    maintenanceMode: false
  });

  const handleSave = () => {
    // En una app real, aquí se guardaría en la base de datos
    localStorage.setItem('app_settings', JSON.stringify(settings));
    toast.success('Configuración guardada');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-lg">Información General</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Nombre de la Aplicación</Label>
            <Input
              value={settings.appName}
              onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={settings.appDescription}
              onChange={(e) => setSettings({ ...settings, appDescription: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Email de Contacto</Label>
            <Input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-purple-600" />
          <h3 className="font-bold text-lg">Notificaciones y Alertas</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Notificaciones por Email</p>
              <p className="text-sm text-slate-600">Recibir alertas sobre cambios importantes</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
              className="w-5 h-5"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-5 w-5 text-green-600" />
          <h3 className="font-bold text-lg">Mantenimiento</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Modo Mantenimiento</p>
              <p className="text-sm text-slate-600">Desactivar acceso público temporalmente</p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Nota:</strong> Al activar el modo mantenimiento, solo los administradores podrán acceder a la aplicación.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}