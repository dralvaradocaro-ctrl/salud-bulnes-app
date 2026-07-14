// Registro central de certificados emitidos (Supabase). El QR sigue llevando
// los datos dentro del enlace, así que la emisión funciona aunque la tabla no
// esté disponible: esto sólo habilita verificar escribiendo el código suelto
// desde cualquier dispositivo.
import { supabase } from '@/lib/supabase';

const TABLA = 'certificados_medicos';

export async function guardarCertificadoRemoto(cert) {
  const { error } = await supabase.from(TABLA).insert({
    code: cert.code,
    institucion: cert.institucion,
    paciente: cert.paciente,
    rut: cert.rut,
    fecha: cert.fecha,
    texto: cert.texto,
    medico: cert.medico,
    medico_rut: cert.medicoRut,
    emitido_en: cert.emitidoEn,
  });
  if (error) throw error;
}

export async function buscarCertificadoRemoto(code) {
  const { data, error } = await supabase
    .from(TABLA)
    .select('code, institucion, paciente, rut, fecha, texto, medico, medico_rut, emitido_en')
    .eq('code', code)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    code: data.code,
    institucion: data.institucion,
    paciente: data.paciente,
    rut: data.rut,
    fecha: data.fecha,
    texto: data.texto,
    medico: data.medico,
    medicoRut: data.medico_rut,
    emitidoEn: data.emitido_en,
  };
}
