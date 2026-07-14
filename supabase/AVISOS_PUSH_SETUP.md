# Puesta en marcha: aviso diario de medicamentos (Web Push) y calendario suscribible

Todo el código ya está en el repo. Faltan estos pasos, que requieren acceso al
proyecto de Supabase (`gcuevpxondfepbowvyqa`). Tiempo estimado: ~10 minutos.

## 1. Generar el par de llaves VAPID (una sola vez)

```bash
npx web-push generate-vapid-keys
```

Imprime una **Public Key** y una **Private Key**. Guárdalas.

## 2. Configurar la llave pública en la app

En el archivo `.env` del proyecto (y en las variables de entorno de Vercel):

```
VITE_VAPID_PUBLIC_KEY=<Public Key del paso 1>
```

Sin esta variable, el botón "Activar notificaciones" del portal avisa que el
servicio no está configurado (la llave antigua quedó inutilizable: nunca tuvo
contraparte privada).

## 3. Desplegar las Edge Functions

```bash
npx supabase login                      # abre el navegador
npx supabase link --project-ref gcuevpxondfepbowvyqa

# secrets que usa la función de envío
npx supabase secrets set VAPID_PUBLIC_KEY=<Public Key> VAPID_PRIVATE_KEY=<Private Key>

# función de envío diario (pública: se protege con ventana horaria + idempotencia)
npx supabase functions deploy enviar-avisos-diarios --no-verify-jwt

# calendario suscribible (pública: los calendarios no mandan headers)
npx supabase functions deploy calendario-medicamentos --no-verify-jwt
```

## 4. Aplicar la migración (cron + privacidad)

En el SQL Editor (https://supabase.com/dashboard/project/gcuevpxondfepbowvyqa/sql/new),
ejecutar el contenido de `supabase/migrations/20260714150000_avisos_diarios_push.sql`.

Crea la columna `last_daily_sent`, bloquea la lectura anónima de los datos de
contacto y agenda el cron diario (11:00 UTC ≈ 07:00–08:00 de Chile según la
estación; la función además se niega a enviar fuera de 06:00–11:59 hora local
y no repite el envío del día).

## 5. Probar

- **Push**: abrir el portal de un paciente → Avisos → Activar notificaciones
  (aceptar el permiso). Luego invocar la función a mano dentro de la ventana
  horaria: `curl -X POST https://gcuevpxondfepbowvyqa.supabase.co/functions/v1/enviar-avisos-diarios`
  → debe llegar la notificación "💊 Sus medicamentos de hoy".
- **Calendario suscribible**: abrir
  `https://gcuevpxondfepbowvyqa.supabase.co/functions/v1/calendario-medicamentos?code=<código_paciente>`
  → debe descargar/mostrar el .ics con las tomas.

## Notas

- iPhone: el push del navegador sólo funciona si el paciente agrega el portal
  a la pantalla de inicio (Compartir → Agregar a pantalla de inicio). La
  alarma por toma NO depende de esto: va por el calendario.
- Cuando las funciones estén desplegadas, avisar para agregar al portal el
  botón de "suscripción automática" del calendario (webcal), que reemplaza a
  la descarga manual y elimina para siempre el problema de eventos huérfanos
  al cambiar recetas.
