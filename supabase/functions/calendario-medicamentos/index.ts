/**
 * Edge Function: calendario de medicamentos por suscripción (webcal).
 *
 * Sirve el .ics del paciente SIEMPRE actualizado desde sus recetas vigentes.
 * A diferencia del archivo descargado, una suscripción se refresca sola: si
 * la receta cambia, los eventos que ya no correspondan desaparecen del
 * calendario del paciente sin que haga nada. Es la solución definitiva a los
 * duplicados/huérfanos.
 *
 *   GET .../functions/v1/calendario-medicamentos?code=<patient_code>
 *
 * Desplegar SIN verificación de JWT (los calendarios no mandan headers):
 *   supabase functions deploy calendario-medicamentos --no-verify-jwt
 *
 * El patient_code actúa como capacidad de acceso, igual que en el portal.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildMedicationIcs } from '../../../src/medispense/lib/medication-ics.ts';

Deno.serve(async (req) => {
  const code = new URL(req.url).searchParams.get('code')?.trim();
  if (!code || !/^[A-Za-z0-9_-]{3,40}$/.test(code)) {
    return new Response('Código inválido', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: patient } = await supabase
    .from('patients')
    .select('id, full_name, patient_code')
    .eq('patient_code', code)
    .maybeSingle();
  if (!patient) return new Response('No encontrado', { status: 404 });

  const { data: prescs, error } = await supabase
    .from('prescriptions')
    .select('id, issue_date, expiry_date, prescription_items(id, medication_name, prescribed_dose, prescribed_unit, frequency, schedule, fractionation, is_sos, is_annulled)')
    .eq('patient_id', patient.id);
  if (error) return new Response('Error consultando recetas', { status: 500 });

  const prescriptions = (prescs ?? []).map((p: any) => ({
    id: p.id,
    issue_date: p.issue_date,
    expiry_date: p.expiry_date,
    items: p.prescription_items ?? [],
  }));

  const ics =
    buildMedicationIcs(prescriptions, patient.full_name, patient.patient_code) ??
    // Calendario vacío pero válido: la suscripción sigue viva y se llenará
    // cuando haya receta vigente.
    'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Salud Bulnes//Medicamentos//ES\r\nEND:VCALENDAR\r\n';

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="medicamentos.ics"',
      'Cache-Control': 'no-cache',
    },
  });
});
