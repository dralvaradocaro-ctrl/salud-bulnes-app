// PÁGINA OCULTA — destino del QR impreso en el certificado. Sólo por link directo.
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { fechaLarga, getInstitucion } from '@/lib/certificadoPdf';
import { decodePayload, leerRegistro } from '@/lib/certificadoCodigo';

export default function VerificarCertificado() {
  const location = useLocation();

  const { cert, error, emitidoAqui } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('c');
    const data = params.get('d');
    if (!code || !data) return { cert: null, error: 'Falta el código o los datos del certificado.' };
    try {
      const p = decodePayload(data);
      if (p.c !== code) return { cert: null, error: 'El código no coincide con los datos del documento.' };
      const emitido = leerRegistro().some((r) => r.code === code);
      return {
        cert: {
          code: p.c,
          paciente: p.n,
          rut: p.r,
          fecha: p.f,
          texto: p.t,
          medico: p.m,
          medicoRut: p.mr,
          institucion: p.i,
        },
        error: null,
        emitidoAqui: emitido,
      };
    } catch {
      return { cert: null, error: 'No fue posible leer los datos del certificado.' };
    }
  }, [location.search]);

  const centro = getInstitucion(cert?.institucion);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <img src={centro.logo} alt="" className="h-12 w-12 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-bold text-slate-900">{centro.nombre}</p>
            <p className="text-xs text-slate-500">Verificación de certificado médico</p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-2 font-semibold text-red-800">
              <ShieldAlert className="h-5 w-5" /> Certificado no verificable
            </div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        )}

        {cert && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-6 py-4 font-semibold text-emerald-800">
              <ShieldCheck className="h-5 w-5" /> Certificado válido
            </div>
            <div className="space-y-4 p-6">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paciente</dt>
                  <dd className="font-medium text-slate-900">{cert.paciente}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">RUT</dt>
                  <dd className="font-medium text-slate-900">{cert.rut}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha de emisión</dt>
                  <dd className="font-medium text-slate-900">{fechaLarga(cert.fecha)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Código único</dt>
                  <dd className="font-mono font-medium text-blue-700">{cert.code}</dd>
                </div>
              </dl>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Contenido</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{cert.texto}</p>
              </div>

              <div className="border-t border-slate-100 pt-4 text-sm">
                <p className="font-semibold text-slate-900">{cert.medico}</p>
                <p className="text-slate-500">Médico Cirujano · RUT {cert.medicoRut}</p>
              </div>

              {emitidoAqui && (
                <p className="text-xs text-emerald-700">
                  Este código coincide con un certificado emitido desde este dispositivo.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
