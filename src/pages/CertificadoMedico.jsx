// PÁGINA OCULTA — no está enlazada desde ninguna navegación.
// Sólo se accede por link directo: /CertificadoMedico
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { ChevronLeft, Download, Eye, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { formatRut, validateRut } from '@/lib/rut-ges';
import {
  buildCertificadoPdf,
  fechaLarga,
  getInstitucion,
  INSTITUCIONES,
  INSTITUCION_POR_DEFECTO,
  MEDICO,
} from '@/lib/certificadoPdf';
import { generarCodigo, encodePayload, registrarCertificado } from '@/lib/certificadoCodigo';
import { guardarCertificadoRemoto } from '@/lib/certificadosStore';
import { toast } from 'sonner';

const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Estampa de fecha del sello, al estilo de los visores de PDF: 2026.07.14 12:35:44 -04'00'
const selloFecha = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const signo = off >= 0 ? '+' : '-';
  const offTxt = `${signo}${p(Math.floor(Math.abs(off) / 60))}'${p(Math.abs(off) % 60)}'`;
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} ${offTxt}`;
};

const slug = (s) =>
  (s || 'paciente')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

function CertificadoMedico() {
  const navigate = useNavigate();
  const qrRef = useRef(null);

  const [institucionId, setInstitucionId] = useState(INSTITUCION_POR_DEFECTO);
  const [paciente, setPaciente] = useState('');
  const [rut, setRut] = useState('');
  const [fecha, setFecha] = useState(hoyIso);
  const [texto, setTexto] = useState('');
  const [code, setCode] = useState(() => generarCodigo(hoyIso()));
  const [generando, setGenerando] = useState(false);

  const centro = getInstitucion(institucionId);
  const rutValido = rut.length > 0 && validateRut(rut);
  const puedeGenerar = paciente.trim() && rutValido && texto.trim() && !generando;

  const verifyUrl = useMemo(() => {
    const payload = encodePayload({
      c: code,
      n: paciente.trim(),
      r: rut,
      f: fecha,
      t: texto.trim(),
      m: MEDICO.nombre,
      mr: MEDICO.rut,
      i: institucionId,
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/VerificarCertificado?c=${encodeURIComponent(code)}&d=${payload}`;
  }, [code, paciente, rut, fecha, texto, institucionId]);

  const construirPdf = async (emitidoEn) => {
    const canvas = qrRef.current?.querySelector('canvas');
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';
    return buildCertificadoPdf({
      code,
      institucion: institucionId,
      paciente: paciente.trim(),
      rut,
      fecha,
      texto: texto.trim(),
      verifyUrl,
      verifyBaseUrl: `${window.location.origin}/VerificarCertificado`,
      qrDataUrl,
      emitidoEn,
    });
  };

  const handleGenerar = async (modo) => {
    if (!puedeGenerar) return;
    setGenerando(true);
    try {
      const emitidoEn = selloFecha();
      const doc = await construirPdf(emitidoEn);
      if (modo === 'preview') {
        window.open(doc.output('bloburl'), '_blank');
        return; // la previsualización no emite: no registra nada
      }
      doc.save(`Certificado_${slug(paciente)}_${code}.pdf`);

      const emitido = {
        code,
        institucion: institucionId,
        paciente: paciente.trim(),
        rut,
        fecha,
        texto: texto.trim(),
        medico: MEDICO.nombre,
        medicoRut: MEDICO.rut,
        emitidoEn,
      };
      registrarCertificado({ ...emitido, verifyUrl });

      // El registro central habilita verificar por código desde otro equipo. Si
      // falla, el certificado sigue siendo verificable por su QR/enlace.
      try {
        await guardarCertificadoRemoto(emitido);
        toast.success('Certificado emitido y registrado para verificación por código.');
      } catch {
        toast.warning(
          'Certificado emitido, pero no se pudo registrar en línea: sólo será verificable por su QR o enlace.',
        );
      }
    } finally {
      setGenerando(false);
    }
  };

  const nuevoCertificado = () => {
    setPaciente('');
    setRut('');
    setTexto('');
    setFecha(hoyIso());
    setCode(generarCodigo(hoyIso()));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-900">Certificado médico</h1>
            <p className="truncate text-xs text-slate-500">{centro.nombre} · Fono {centro.fono}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={nuevoCertificado}>
            <RotateCcw className="h-4 w-4" /> Nuevo
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Formulario */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="mb-1 block text-sm font-semibold text-slate-700">Institución</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.values(INSTITUCIONES).map((inst) => {
                  const activa = inst.id === institucionId;
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => setInstitucionId(inst.id)}
                      aria-pressed={activa}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        activa
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <img src={inst.logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {inst.id === 'bulnes' ? 'Hospital de Bulnes' : 'Inalab Centro Médico'}
                        </span>
                        <span className="block truncate text-xs text-slate-500">Fono {inst.fono}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="paciente" className="mb-1 block text-sm font-semibold text-slate-700">
                Nombre del paciente
              </label>
              <input
                id="paciente"
                value={paciente}
                onChange={(e) => setPaciente(e.target.value)}
                placeholder="Nombre completo"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rut" className="mb-1 block text-sm font-semibold text-slate-700">
                  RUT
                </label>
                <input
                  id="rut"
                  value={rut}
                  onChange={(e) => setRut(formatRut(e.target.value))}
                  placeholder="12.345.678-9"
                  inputMode="text"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                    rut && !rutValido
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {rut && !rutValido && (
                  <p className="mt-1 text-xs font-medium text-red-600">RUT inválido (dígito verificador).</p>
                )}
              </div>

              <div>
                <label htmlFor="fecha" className="mb-1 block text-sm font-semibold text-slate-700">
                  Fecha de emisión
                </label>
                <input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="texto" className="mb-1 block text-sm font-semibold text-slate-700">
                Texto del certificado
              </label>
              <textarea
                id="texto"
                rows={9}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Certifico que el paciente individualizado se encuentra en control médico por…, indicándose reposo por … días a contar del …"
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-500">
                Texto libre: se imprime tal cual bajo el cuadro del paciente. Los saltos de línea se respetan.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => handleGenerar('download')} disabled={!puedeGenerar} className="gap-1.5">
                <Download className="h-4 w-4" /> Descargar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleGenerar('preview')}
                disabled={!puedeGenerar}
                className="gap-1.5"
              >
                <Eye className="h-4 w-4" /> Previsualizar
              </Button>
            </div>
          </div>
        </section>

        {/* Panel lateral: médico, código y QR */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <img src={centro.logo} alt="" className="h-12 w-12 rounded-lg object-contain" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{centro.nombre}</p>
                <p className="text-xs text-slate-500">{centro.direccion}</p>
                <p className="text-xs text-slate-500">Fono {centro.fono}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
              <p className="font-semibold text-slate-900">{MEDICO.nombre}</p>
              <p className="text-slate-500">{MEDICO.titulo} · RUT {MEDICO.rut}</p>
              {centro.firma ? (
                <img
                  src={centro.firma}
                  alt="Firma y timbre"
                  className="mt-2 h-24 w-auto max-w-full object-contain"
                />
              ) : null}
              <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                El PDF lleva recuadro de <span className="font-semibold">firma electrónica simple</span> (sin
                validez legal de FEA)
                {centro.firma
                  ? ' y la firma manuscrita con timbre sobre la línea.'
                  : ' y deja espacio en blanco sobre la línea para tu firma y timbre reales.'}
              </p>
              <p className="mt-2 text-xs text-slate-500">{fechaLarga(fecha)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verificación
            </div>
            <div ref={qrRef} className="flex items-center gap-4">
              <QRCodeCanvas value={verifyUrl} size={148} level="L" marginSize={2} />
              <div className="min-w-0 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">Código único</p>
                <p className="mt-0.5 break-all font-mono text-[13px] text-blue-700">{code}</p>
                <p className="mt-2 leading-relaxed">
                  El QR del PDF abre <span className="font-medium">/VerificarCertificado</span> con los datos del
                  documento emitido.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default conPuertaAcceso(CertificadoMedico, {
  codigo: 'FERNANDO12BULNES',
  storageKey: 'certificado_medico_acceso',
  descripcion: 'Ingresa el código de acceso para usar el generador de certificados.',
});
