import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Button } from '@/medispense/components/ui/button';
import { Input } from '@/medispense/components/ui/input';
import { Label } from '@/medispense/components/ui/label';
import { Badge } from '@/medispense/components/ui/badge';
import { Bell, BellOff, Mail, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { supabase } from '@/medispense/integrations/supabase/client';
import { useToast } from '@/medispense/hooks/use-toast';

// Clave pública VAPID del par con el que firma la Edge Function
// enviar-avisos-diarios. Sin la variable de entorno, el push queda
// deshabilitado (la clave antigua no tenía contraparte privada: las
// suscripciones creadas con ella jamás podían recibir nada).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

// El correo se recuerda por dispositivo: la lectura anónima de datos de
// contacto quedó bloqueada en la base (privacidad).
const emailCacheKey = (patientId: string) => `notif_email_${patientId}`;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NotificationSettingsProps {
  patientId: string;
}

export function NotificationSettings({ patientId }: NotificationSettingsProps) {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    setPushSupported('serviceWorker' in navigator && 'PushManager' in window);
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
    loadSettings();
  }, [patientId]);

  const loadSettings = async () => {
    // Sólo columnas legibles por anon (email y push_subscription están
    // bloqueadas a nivel de columna por privacidad).
    const { data } = await supabase
      .from('patient_notifications')
      .select('id, push_enabled')
      .eq('patient_id', patientId)
      .maybeSingle();

    if (data) setPushEnabled(data.push_enabled || false);

    try {
      const cached = localStorage.getItem(emailCacheKey(patientId)) || '';
      setEmail(cached);
      setSavedEmail(cached);
    } catch { /* modo privado */ }
  };

  const enablePush = async () => {
    if (!VAPID_PUBLIC_KEY) {
      toast({
        title: 'Notificaciones no disponibles',
        description: 'El servicio de avisos aún no está configurado en este servidor.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission !== 'granted') {
        toast({
          title: 'Permiso denegado',
          description: 'Debes permitir las notificaciones en tu navegador para activarlas.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });

      const subscriptionJson = subscription.toJSON();

      // Upsert notification settings
      const { data: existing } = await supabase
        .from('patient_notifications')
        .select('id')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('patient_notifications')
          .update({
            push_enabled: true,
            push_subscription: subscriptionJson,
          })
          .eq('patient_id', patientId);
      } else {
        await supabase
          .from('patient_notifications')
          .insert({
            patient_id: patientId,
            push_enabled: true,
            push_subscription: subscriptionJson,
          });
      }

      setPushEnabled(true);
      toast({
        title: '✅ Notificaciones activadas',
        description: 'Recibirás recordatorios de tus medicamentos en este dispositivo.',
      });
    } catch (error) {
      console.error('Error enabling push:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron activar las notificaciones. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const disablePush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await (registration as any).pushManager.getSubscription();
        if (subscription) await subscription.unsubscribe();
      }

      await supabase
        .from('patient_notifications')
        .update({ push_enabled: false, push_subscription: null })
        .eq('patient_id', patientId);

      setPushEnabled(false);
      toast({
        title: 'Notificaciones desactivadas',
        description: 'Ya no recibirás recordatorios push en este dispositivo.',
      });
    } catch (error) {
      console.error('Error disabling push:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEmail = async () => {
    setEmailLoading(true);
    try {
      const trimmedEmail = email.trim();

      const { data: existing } = await supabase
        .from('patient_notifications')
        .select('id')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('patient_notifications')
          .update({ email: trimmedEmail || null })
          .eq('patient_id', patientId);
      } else {
        await supabase
          .from('patient_notifications')
          .insert({
            patient_id: patientId,
            email: trimmedEmail || null,
          });
      }

      try { localStorage.setItem(emailCacheKey(patientId), trimmedEmail); } catch { /* modo privado */ }
      setSavedEmail(trimmedEmail);
      toast({
        title: trimmedEmail ? '✅ Correo guardado' : 'Correo eliminado',
        description: trimmedEmail
          ? 'Recibirás alertas por correo electrónico.'
          : 'Ya no recibirás alertas por correo.',
      });
    } catch (error) {
      console.error('Error saving email:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el correo.',
        variant: 'destructive',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notificaciones
        </CardTitle>
        <CardDescription>
          Recibe recordatorios de tus medicamentos y alertas de vencimiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Push Notifications */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Notificaciones en este dispositivo</Label>
          </div>

          {!pushSupported ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Tu navegador no soporta notificaciones push. Usa Chrome o Edge para activarlas.</span>
            </div>
          ) : pushPermission === 'denied' ? (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <BellOff className="h-4 w-4 shrink-0" />
              <span>Las notificaciones están bloqueadas. Ve a la configuración de tu navegador para permitirlas.</span>
            </div>
          ) : pushEnabled ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Activadas
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disablePush}
                disabled={loading}
              >
                <BellOff className="h-4 w-4 mr-1" />
                Desactivar
              </Button>
            </div>
          ) : (
            <Button onClick={enablePush} disabled={loading} size="sm">
              <Bell className="h-4 w-4 mr-1" />
              {loading ? 'Activando...' : 'Activar notificaciones'}
            </Button>
          )}
        </div>

        {/* Email Notifications */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Alertas por correo electrónico</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Opcional: recibe alertas de recetas por vencer en tu correo
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={saveEmail}
              disabled={emailLoading || email === savedEmail}
              className="shrink-0"
            >
              {emailLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
          {savedEmail && (
            <div className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3 w-3" />
              Correo configurado: {savedEmail}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
