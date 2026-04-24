import { useState, useRef, useCallback, useEffect } from 'react';
import { formatRut, validateRut } from '@/lib/rut-ges';
import GesBuscador from '@/components/ges/GesBuscador';
import DireccionAutocomplete from '@/components/ges/DireccionAutocomplete';
import FirmaDigital from '@/components/ges/FirmaDigital';
import FormToolbar from '@/components/ges/FormToolbar';

const defaultForm = {
  institucion: 'Hospital Comunitario de Salud Familiar de Bulnes',
  prestadorDireccion: 'Balmaceda N° 431',
  prestadorCiudad: 'Bulnes',
  nombreNotifica: '', prestadorRun: '',
  nombreLegal: '', nombreSocial: '', pacienteRun: '', edad: '',
  previsionFonasa: true, previsionIsapre: false,
  pacienteDireccion: '', pacienteComuna: '', pacienteRegion: '',
  pacienteTelefono: '', pacienteCorreo: '',
  problemaSaludGes: '', problemaSaludGesN: '', confirmacion: true,
  problemaSaludOncologico: '',
  oncSospecha: false, oncConfirmacion: false, oncEtapificacion: false,
  oncTratamiento: false, oncSeguimiento: false, oncRehabilitacion: false,
  presencial: true, teleconsulta: false,
  fechaNotificacion: '',
  firmaNotifica: '', firmaConocimiento: '',
  medioCorreo: false, medioCarta: false, medioOtros: '',
  repNombre: '', repRun: '', repTelefono: '', repCorreo: '',
};

function getNow() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

function F({ label, value, onChange, w, type, placeholder }) {
  return (
    <>
      <span className="f-label">{label}</span>
      <input
        className="f-input"
        style={w ? { maxWidth: w } : undefined}
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        type={type || 'text'}
        placeholder={placeholder}
      />
    </>
  );
}

function ChkLarge({ label, checked, onChange }) {
  return (
    <label className="f-chk-large">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}

function Chk({ label, checked, onChange }) {
  return (
    <label className="f-chk">
      <span className="f-label" style={{ fontWeight: 400 }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}

export default function GesFormulario() {
  const [form, setForm] = useState(() => ({ ...defaultForm, fechaNotificacion: getNow() }));
  const [rutError, setRutError] = useState('');
  const [socialModified, setSocialModified] = useState(false);
  const printRef = useRef(null);

  const u = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  useEffect(() => {
    const updateBeforePrint = () => setForm(prev => ({ ...prev, fechaNotificacion: getNow() }));
    window.addEventListener('beforeprint', updateBeforePrint);
    return () => window.removeEventListener('beforeprint', updateBeforePrint);
  }, []);

  const handleRut = (key, val) => {
    const fmt = formatRut(val);
    u(key, fmt);
    if (key === 'pacienteRun') setRutError(fmt.length > 3 && !validateRut(fmt) ? 'RUT inválido' : '');
  };

  const handleGesSelect = (p) => {
    if (p.oncologico) {
      u('problemaSaludOncologico', p.nombre);
      u('problemaSaludGes', '');
    } else {
      u('problemaSaludGes', p.nombre);
      u('problemaSaludOncologico', '');
    }
  };

  const edadNum = parseInt(form.edad) || undefined;

  return (
    <div className="ges-formulario-wrapper">
      <FormToolbar
        formRef={printRef}
        formData={form}
        onNew={() => { setForm({ ...defaultForm, fechaNotificacion: getNow() }); setRutError(''); setSocialModified(false); }}
        onDuplicate={() => setForm(prev => ({ ...prev, firmaNotifica: '', firmaConocimiento: '' }))}
        onLoad={setForm}
      />

      <div ref={printRef} className="ges-form print:mx-0">

        {/* TÍTULO */}
        <div className="ges-form-title">
          Formulario de constancia información paciente GES
        </div>
        <div className="ges-form-subtitle">
          (Artículo 24°, Ley 19.966)
        </div>

        {/* DATOS DEL PRESTADOR */}
        <div className="ges-section-title">Datos del prestador</div>
        <div className="ges-section-body">
          <div className="f-row">
            <F label="Institución (Hospital, Clínica, Consultorio, etc.):" value={form.institucion} onChange={v => u('institucion', v)} />
          </div>
          <div className="f-row">
            <F label="Dirección:" value={form.prestadorDireccion} onChange={v => u('prestadorDireccion', v)} />
            <F label="Ciudad:" value={form.prestadorCiudad} onChange={v => u('prestadorCiudad', v)} w="25%" />
          </div>
          <div className="f-row">
            <F label="Nombre persona que notifica:" value={form.nombreNotifica} onChange={v => u('nombreNotifica', v)} />
          </div>
          <div className="f-row">
            <F label="RUN:" value={form.prestadorRun} onChange={v => handleRut('prestadorRun', v)} w="35%" />
          </div>
        </div>

        {/* ANTECEDENTES DEL PACIENTE */}
        <div className="ges-section-title">Antecedentes del/la paciente</div>
        <div className="ges-section-body">
          <div className="f-row">
            <F label="Nombre legal:" value={form.nombreLegal} onChange={v => { u('nombreLegal', v); if (!socialModified) u('nombreSocial', v); }} />
          </div>
          <div className="f-row">
            <F label="Nombre social:" value={form.nombreSocial} onChange={v => { u('nombreSocial', v); setSocialModified(true); }} />
          </div>
          <div className="f-row">
            <F label="RUN:" value={form.pacienteRun} onChange={v => handleRut('pacienteRun', v)} w="28%" />
            {rutError && <span style={{ fontSize: '10px', color: '#dc2626' }}>{rutError}</span>}
            <span className="f-label" style={{ marginLeft: '12px' }}>Previsión:</span>
            <Chk label="Fonasa" checked={form.previsionFonasa} onChange={v => { u('previsionFonasa', v); if (v) u('previsionIsapre', false); }} />
            <Chk label="Isapre" checked={form.previsionIsapre} onChange={v => { u('previsionIsapre', v); if (v) u('previsionFonasa', false); }} />
          </div>
          <div className="f-row">
            <F label="Edad:" value={form.edad} onChange={v => u('edad', v)} w="15%" type="number" placeholder="años" />
          </div>
          <DireccionAutocomplete
            direccion={form.pacienteDireccion}
            comuna={form.pacienteComuna}
            region={form.pacienteRegion}
            telefono={form.pacienteTelefono}
            correo={form.pacienteCorreo}
            onDireccionChange={v => u('pacienteDireccion', v)}
            onComunaChange={v => u('pacienteComuna', v)}
            onRegionChange={v => u('pacienteRegion', v)}
            onTelefonoChange={v => u('pacienteTelefono', v)}
            onCorreoChange={v => u('pacienteCorreo', v)}
          />
        </div>

        {/* INFORMACIÓN MÉDICA */}
        <div className="ges-section-title">Información médica</div>
        <div className="ges-section-body">
          <div className="f-row">
            <span className="f-label">Problema de Salud GES:</span>
            <GesBuscador edad={edadNum} onSelect={handleGesSelect} value={form.problemaSaludGes} />
          </div>
          <div className="f-row" style={{ paddingLeft: 20 }}>
            <Chk label="Confirmación" checked={form.confirmacion} onChange={v => u('confirmacion', v)} />
          </div>

          <div className="ges-line" />

          <div className="f-row">
            <span className="f-label">Problema de Salud GES Oncológico:</span>
            <GesBuscador edad={edadNum} onSelect={handleGesSelect} value={form.problemaSaludOncologico} />
          </div>
          <div className="f-row" style={{ flexWrap: 'wrap' }}>
            <ChkLarge label="Sospecha" checked={form.oncSospecha} onChange={v => u('oncSospecha', v)} />
            <ChkLarge label="Confirmación" checked={form.oncConfirmacion} onChange={v => u('oncConfirmacion', v)} />
            <ChkLarge label="Etapificación" checked={form.oncEtapificacion} onChange={v => u('oncEtapificacion', v)} />
            <ChkLarge label="Tratamiento" checked={form.oncTratamiento} onChange={v => u('oncTratamiento', v)} />
            <ChkLarge label="Seguimiento" checked={form.oncSeguimiento} onChange={v => u('oncSeguimiento', v)} />
            <ChkLarge label="Rehabilitación" checked={form.oncRehabilitacion} onChange={v => u('oncRehabilitacion', v)} />
          </div>
        </div>

        {/* TIPO DE ATENCIÓN */}
        <div className="ges-section-title">Tipo de atención</div>
        <div className="ges-section-body">
          <div className="f-row" style={{ gap: '40px' }}>
            <ChkLarge label="Presencial" checked={form.presencial} onChange={v => { u('presencial', v); if (v) u('teleconsulta', false); }} />
            <ChkLarge label="Teleconsulta" checked={form.teleconsulta} onChange={v => { u('teleconsulta', v); if (v) u('presencial', false); }} />
          </div>
        </div>

        {/* CONSTANCIA */}
        <div className="ges-section-title">Constancia:</div>
        <div className="ges-section-body">
          <p className="print-constancia-text" style={{ fontSize: '13px', lineHeight: 1.45, marginBottom: '5px' }}>
            Tomo conocimiento que tengo derecho a acceder a las Garantías Explícitas en Salud, en la medida que me atienda en la red
            de Prestadores que asigne el Fonasa o la Isapre, según corresponda.
          </p>
          <div className="f-row">
            <F label="Fecha y hora de notificación:" value={form.fechaNotificacion} onChange={v => u('fechaNotificacion', v)} type="datetime-local" />
          </div>
        </div>

        {/* FIRMAS */}
        <div className="ges-line" />
        <div className="print-signatures" style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 0' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <FirmaDigital onSave={v => u('firmaNotifica', v)} value={form.firmaNotifica} />
            <div className="sig-line">Informé Problema Salud GES</div>
            <div className="sig-caption">(Firma de persona que notifica)</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <FirmaDigital onSave={v => u('firmaConocimiento', v)} value={form.firmaConocimiento} />
            <div className="sig-line">Tomé conocimiento*</div>
            <div className="sig-caption">(Firma o huella digital del paciente o representante)</div>
          </div>
        </div>

        {/* TELECONSULTA */}
        <div className="ges-line" />
        <div className="print-teleconsulta-note" style={{ fontSize: '13px', padding: '4px 0' }}>
          <p>
            <strong>*En la modalidad de TELECONSULTA, <span style={{ textDecoration: 'underline' }}>en ausencia de la firma o huella</span>, se registrará el medio a través del cual el/la paciente o su representante tomó conocimiento:</strong>
          </p>
          <div className="f-row" style={{ marginTop: '4px' }}>
            <Chk label="Correo electrónico" checked={form.medioCorreo} onChange={v => u('medioCorreo', v)} />
            <Chk label="Carta certificada" checked={form.medioCarta} onChange={v => u('medioCarta', v)} />
            <F label="Otros (indicar):" value={form.medioOtros} onChange={v => u('medioOtros', v)} />
          </div>
        </div>

        {/* REPRESENTANTE */}
        <div className="ges-line" />
        <div className="print-representante" style={{ fontSize: '13px', padding: '4px 0' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            En caso que la persona que tomó conocimiento no sea el/la paciente, identificar:
          </p>
          <div className="f-row">
            <F label="Nombre" value={form.repNombre} onChange={v => u('repNombre', v)} />
            <F label="RUN" value={form.repRun} onChange={v => handleRut('repRun', v)} w="28%" />
          </div>
          <div className="f-row">
            <F label="Teléfono" value={form.repTelefono} onChange={v => u('repTelefono', v)} w="28%" />
            <F label="Correo electrónico" value={form.repCorreo} onChange={v => u('repCorreo', v)} />
          </div>
        </div>

        {/* IMPORTANTE */}
        <div className="ges-line" />
        <div className="print-important" style={{ fontSize: '12px', padding: '4px 0' }}>
          <p>
            <strong><u>Importante</u>:</strong> Tenga presente que si no se cumplen las garantías usted puede reclamar ante Fonasa o la Isapre, según corresponda.
            Si la respuesta no es satisfactoria, usted puede recurrir en segunda instancia a la Superintendencia de Salud.
          </p>
        </div>
      </div>
    </div>
  );
}
