// PÁGINA OCULTA — destino del QR impreso en el certificado. Sólo por link directo.
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fechaLarga, getInstitucion } from '@/lib/certificadoPdf';
import { decodePayload, leerRegistro } from '@/lib/certificadoCodigo';

export default function VerificarCertificado() {
  const location = useLocation();
  const navigate = useNavigate();
  const [entrada, setEntrada] = useState('');
  const [aviso, setAviso] = useState('');

  const { cert, error, emitidoAqui } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('c');
    const data = params.get('d');
    // Sin parámetros no es un error: la página se abrió para buscar a mano.
    if (!code && !data) return { cert: null, error: null };
    if (!code || !data) return { cert: null, error: 'El enlace está incompleto: falta el código o los datos del certificado.' };
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

  // Acepta el enlace completo del QR o, si el certificado fue emitido en este
  // dispositivo, sólo el código: los datos viajan dentro del enlace, no en un
  // servidor, así que un código suelto de otro equipo no se puede reconstruir.
  const buscar = (e) => {
    e.preventDefault();
    const valor = entrada.trim();
    if (!valor) return;
    setAviso('');

    if (/VerificarCertificado\?/i.test(valor)) {
      const query = valor.slice(valor.indexOf('?'));
      navigate(`/VerificarCertificado${query}`);
      setEntrada('');
      return;
    }

    const codigo = valor.toUpperCase();
    const registro = leerRegistro().find((r) => r.code?.toUpperCase() === codigo);
    if (registro?.verifyUrl) {
      const query = registro.verifyUrl.slice(registro.verifyUrl.indexOf('?'));
      navigate(`/VerificarCertificado${query}`);
      setEntrada('');
      return;
    }

    setAviso(
      'Ese código no figura entre los certificados emitidos desde este dispositivo. ' +
      'Los datos del certificado viajan dentro del QR, no en un servidor: escanea el ' +
      'QR del documento o pega aquí el enlace completo de verificación.',
    );
  };

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

        <form
          onSubmit={buscar}
          className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <label htmlFor="codigo" className="mb-1 block text-sm font-semibold text-slate-700">
            Verificar un certificado
          </label>
          <p className="mb-3 text-xs text-slate-500">
            Escribe el código de verificación (ej. CM-20260714-K7P2QX) o pega el enlace impreso bajo el QR.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="codigo"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Código o enlace de verificación"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <Button type="submit" disabled={!entrada.trim()} className="gap-1.5 sm:w-auto">
              <Search className="h-4 w-4" /> Verificar
            </Button>
          </div>
          {aviso && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {aviso}
            </p>
          )}
        </form>

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
