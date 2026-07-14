/**
 * Edge Function: aviso diario de medicamentos por Web Push.
 *
 * La invoca pg_cron una vez al día (ver migración del cron). Recorre las
 * suscripciones push activas, arma el resumen "hoy le tocan..." desde las
 * recetas vigentes y lo envía. Es idempotente por día: marca last_daily_sent
 * y no reenvía al paciente que ya recibió el aviso hoy, así una invocación
 * repetida no duplica notificaciones.
 *
 * Secrets requeridos (supabase secrets set):
 *   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY  — par generado con web-push
 *   (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY vienen inyectados por defecto)
 *
 * Desplegar con:  supabase functions deploy enviar-avisos-diarios
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const CHILE_TZ = 'America/Santiago';

/** Fecha local de Chile YYYY-MM-DD e índice de día lunes=0…domingo=6. */
function hoyEnChile(): { fecha: string; diaIndice: number; hora: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHILE_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const dias = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return {
    fecha: `${get('year')}-${get('month')}-${get('day')}`,
    diaIndice: dias.indexOf(get('weekday')),
    hora: parseInt(get('hour'), 10),
  };
}

const esSemanal = (freq: string | null) =>
  !!freq && (freq.includes('7d') || freq.toLowerCase().includes('semanal'));

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { fecha, diaIndice, hora } = hoyEnChile();
  // Ventana horaria: aunque alguien invoque la función fuera de hora con la
  // clave pública, no puede usarla para molestar a los pacientes de noche.
  if (hora < 6 || hora > 11) {
    return Response.json({ ok: false, motivo: `fuera de ventana (hora Chile: ${hora})` }, { status: 425 });
  }

  webpush.setVapidDetails(
    'mailto:dvargas.quinteros@gmail.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Suscripciones activas a las que no se les envió hoy
  const { data: subs, error } = await supabase
    .from('patient_notifications')
    .select('id, patient_id, push_subscription, last_daily_sent, patients(patient_code, full_name)')
    .eq('push_enabled', true)
    .not('push_subscription', 'is', null);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  let enviados = 0, saltados = 0, caducados = 0, sinMeds = 0;

  for (const sub of subs ?? []) {
    if (sub.last_daily_sent === fecha) { saltados++; continue; }

    // Recetas vigentes del paciente
    const { data: prescs } = await supabase
      .from('prescriptions')
      .select('expiry_date, prescription_items(medication_name, frequency, schedule, fractionation, is_sos, is_annulled)')
      .eq('patient_id', sub.patient_id)
      .gte('expiry_date', fecha);

    const lineas: string[] = [];
    for (const p of prescs ?? []) {
      for (const item of (p as any).prescription_items ?? []) {
        if (item.is_sos || item.is_annulled) continue;
        if (esSemanal(item.frequency)) {
          const partes = (item.fractionation ?? '').split('-').map(Number);
          if (!(partes[diaIndice] > 0)) continue; // hoy no toca
        }
        const horas = (item.schedule ?? ['08:00'])
          .map((h: string) => (h === '24:00' ? '00:00' : h))
          .join(', ');
        lineas.push(`${item.medication_name} (${horas})`);
      }
    }
    if (!lineas.length) { sinMeds++; continue; }

    const cuerpo = lineas.slice(0, 6).join(' · ') + (lineas.length > 6 ? ` · y ${lineas.length - 6} más` : '');
    const code = (sub as any).patients?.patient_code;
    try {
      await webpush.sendNotification(
        sub.push_subscription as any,
        JSON.stringify({
          title: '💊 Sus medicamentos de hoy',
          body: cuerpo,
          url: code ? `/PrescripcionInteligente/portal/${code}` : '/',
          tag: 'aviso-diario-medicamentos',
        }),
      );
      enviados++;
      await supabase.from('patient_notifications').update({ last_daily_sent: fecha }).eq('id', sub.id);
    } catch (e: any) {
      // 404/410: la suscripción ya no existe (app desinstalada, permiso revocado)
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        caducados++;
        await supabase
          .from('patient_notifications')
          .update({ push_enabled: false, push_subscription: null })
          .eq('id', sub.id);
      } else {
        console.error(`push fallido para ${sub.id}:`, e?.message ?? e);
      }
    }
  }

  return Response.json({ ok: true, fecha, enviados, saltados, sinMeds, caducados });
});
