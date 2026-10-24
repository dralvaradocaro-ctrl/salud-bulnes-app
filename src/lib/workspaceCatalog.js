// Catálogo de la barra inferior: qué va en Documentos (lo que se llena e imprime) y qué en
// Trabajo (módulos con seguimiento durante el turno). Lo usan Templates, OperacionClinica,
// Category y Layout, así un formulario nuevo aparece en todas partes al agregarlo aquí.
import {
  Activity, BedDouble, CalendarDays, ClipboardList, FileText, Files, FlaskConical, HeartPulse, Home, Image,
  Megaphone, MessageSquare, Microscope, Phone, Pill, ShieldPlus, Stethoscope, Syringe, UserCheck, Users,
} from 'lucide-react';

// Paleta por tono (clases literales para que Tailwind las compile).
export const FORM_TONES = {
  slate:   { card: 'border-slate-200 bg-white hover:border-slate-400',          icon: 'bg-slate-700',   chip: 'bg-slate-100 text-slate-700',     label: 'text-slate-400' },
  teal:    { card: 'border-teal-200 bg-teal-50/70 hover:border-teal-400',        icon: 'bg-teal-700',    chip: 'bg-teal-100 text-teal-800',       label: 'text-teal-600' },
  blue:    { card: 'border-blue-200 bg-blue-50/70 hover:border-blue-400',        icon: 'bg-blue-600',    chip: 'bg-blue-100 text-blue-800',       label: 'text-blue-600' },
  cyan:    { card: 'border-cyan-200 bg-cyan-50/70 hover:border-cyan-400',        icon: 'bg-cyan-600',    chip: 'bg-cyan-100 text-cyan-800',       label: 'text-cyan-600' },
  rose:    { card: 'border-rose-200 bg-rose-50/70 hover:border-rose-400',        icon: 'bg-rose-600',    chip: 'bg-rose-100 text-rose-800',       label: 'text-rose-600' },
  amber:   { card: 'border-amber-200 bg-amber-50/70 hover:border-amber-400',     icon: 'bg-amber-600',   chip: 'bg-amber-100 text-amber-800',     label: 'text-amber-600' },
  indigo:  { card: 'border-indigo-200 bg-indigo-50/70 hover:border-indigo-400',  icon: 'bg-indigo-600',  chip: 'bg-indigo-100 text-indigo-800',   label: 'text-indigo-600' },
  emerald: { card: 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-400', icon: 'bg-emerald-600', chip: 'bg-emerald-100 text-emerald-800', label: 'text-emerald-600' },
  violet:  { card: 'border-violet-200 bg-violet-50/70 hover:border-violet-400',  icon: 'bg-violet-600',  chip: 'bg-violet-100 text-violet-800',   label: 'text-violet-600' },
};

// Áreas en que se agrupan los formularios del tab. El orden aquí es el orden
// en pantalla; un área sin formularios visibles no se renderiza.
export const FORM_GROUPS = [
  { id: 'registro',   title: 'Registro clínico',            subtitle: 'Evolución y seguimiento del paciente',          Icon: Stethoscope },
  { id: 'examenes',   title: 'Exámenes e imágenes',         subtitle: 'Laboratorio, microbiología, ISP y protocolos',  Icon: FlaskConical },
  { id: 'farmacia',   title: 'Farmacia y tratamiento',      subtitle: 'Fármacos que requieren autorización',           Icon: Pill },
  { id: 'derivacion', title: 'Derivación y continuidad',    subtitle: 'Traslados, interconsultas y alta domiciliaria', Icon: Home },
  { id: 'paciente',   title: 'Documentos para el paciente', subtitle: 'Constancias, informes y certificados',          Icon: UserCheck },
  { id: 'notificacion', title: 'Notificación obligatoria',  subtitle: 'Enfermedades de notificación e investigación',  Icon: Megaphone },
  { id: 'urgencia',   title: 'Urgencia',                    subtitle: 'Plantillas de indicaciones rápidas',            Icon: ShieldPlus },
  { id: 'otros',      title: 'Otros formularios',           subtitle: 'Solicitudes adicionales de la categoría',       Icon: Files },
];

// Formularios con página propia. `show` decide si aplica a la categoría;
// `details` es lo que se despliega al pasar el mouse (qué se puede solicitar).
export const STATIC_FORMS = [
  {
    group: 'paciente', route: 'OrdenExamenes', tone: 'blue', Icon: FlaskConical,
    title: 'Orden de exámenes',
    description: 'Estudios precargados, contraste y creatinina. Acceso restringido.',
    details: ['Buscador de estudios', 'Con o sin contraste', 'Última creatinina', 'Firma opcional', 'Descarga PDF'],
    show: c => c.hasPolicinico,
  },
  {
    group: 'paciente', route: 'CertificadoMedico', tone: 'teal', Icon: FileText,
    title: 'Certificado médico',
    description: 'Certificado editable con firma y verificación. Acceso restringido.',
    details: ['Datos del paciente', 'Texto libre', 'Firma opcional', 'Código de verificación', 'Descarga PDF'],
    show: c => c.hasPolicinico,
  },
  {
    group: 'paciente', route: 'RecetaMedica', tone: 'indigo', Icon: Pill,
    title: 'Receta médica',
    description: 'Medicamentos, presentaciones y posología. Acceso restringido.',
    details: ['Buscador de medicamentos', 'Presentaciones precargadas', 'Posología editable', 'Firma opcional', 'Descarga PDF'],
    show: c => c.hasPolicinico,
  },
  {
    group: 'registro', route: 'NotaEvolucion', tone: 'slate', Icon: FileText,
    title: 'Nota de evolución',
    description: 'Evolución clínica diaria con firma médica.',
    details: ['Anamnesis', 'Examen físico', 'Diagnósticos', 'Plan e indicaciones', 'Firma médica'],
    show: c => c.hasHospitalizados,
  },
  {
    group: 'registro', route: 'CurvaExamenes', tone: 'teal', Icon: Activity,
    title: 'Curva de exámenes',
    description: 'Seguimiento longitudinal anónimo por cama.',
    details: ['Carga por fechas', 'Curvas por parámetro', 'Calcio corregido', 'PMN absolutos', 'Tendencias'],
    show: c => c.hasHospitalizados,
  },
  {
    group: 'examenes', route: 'SolicitudExamenes', tone: 'blue', Icon: FlaskConical,
    title: 'Solicitud de Exámenes',
    description: 'Formulario oficial COD. 32 con buscador.',
    details: ['Hematología', 'Bioquímica', 'Coagulación', 'Orinas', 'Deposiciones', 'Hormonas · Inmunología', 'Derivados a HCHM'],
    show: c => c.hasHospitalizados,
  },
  {
    group: 'examenes', route: 'SolicitudMicrobiologia', tone: 'cyan', Icon: Microscope,
    title: 'Exámenes Microbiológicos',
    description: 'Formulario C 162. Imprime PDF.',
    details: ['Bacteriológicos', 'Cultivos', 'Directos', 'Virológicos', 'Serología'],
    show: c => c.hasHospitalizados,
  },
  {
    group: 'examenes', route: 'FormularioIRAGrave', tone: 'rose', Icon: FlaskConical,
    title: 'IRA grave y 2019-nCoV (ISP)',
    description: 'PR-244.00-007. Notificación inmediata.',
    details: ['Notificación ISP', 'Aspirado nasofaríngeo', 'Aspirado traqueal', 'Lavado broncoalveolar', 'Envío de muestras'],
    show: c => c.hasHospitalizados,
  },
  {
    group: 'farmacia', route: 'SolicitudFarmacoRestringido', tone: 'amber', Icon: Pill,
    title: 'Fármaco de Uso Restringido',
    description: 'Comité de Farmacia / MPJC. Imprime PDF.',
    details: ['Antibióticos amplio espectro', 'Fármacos de uso ocasional', 'Justificación del tratamiento', 'Duración propuesta'],
    show: c => c.hasHospitalizados,
  },
  {
    group: 'derivacion', route: 'FormulariosHODOM', tone: 'indigo', Icon: Home,
    title: 'Hospitalización Domiciliaria (HODOM)',
    description: 'Derivación y consentimiento editables.',
    details: ['Formulario de derivación', 'Consentimiento informado', 'Vista previa', 'Impresión formato original', 'Traslado a registro HODOM'],
    show: c => c.hasHospitalizados || c.hasUrgencias,
  },
  {
    group: 'paciente', route: 'FormularioGES', tone: 'emerald', Icon: FileText,
    title: 'Constancia GES',
    description: 'Art. 24 Ley 19.966. Información al paciente.',
    details: ['Problema de salud GES', 'Garantías informadas', 'Firma paciente', 'Imprime PDF'],
    show: c => c.hasGesConstancia,
  },
  {
    group: 'paciente', route: 'InformeBiomedico', tone: 'amber', Icon: UserCheck,
    title: 'Informe Biomédico Funcional',
    description: 'Formulario oficial MINSAL editable.',
    details: ['Diagnósticos', 'Funcionalidad', 'Fecha automática', 'Imprimible'],
    show: c => c.hasPolicinico,
  },
  {
    group: 'notificacion', route: 'FormularioCoqueluche', tone: 'rose', Icon: Megaphone,
    title: 'Notificación de coqueluche',
    description: 'Investigación y notificación con descarga PDF.',
    details: ['Datos del caso', 'Contactos', 'Edición sobre el documento', 'Descarga PDF'],
    show: c => c.hasUrgencias || c.hasHospitalizados,
  },
  {
    group: 'urgencia', route: 'IndicacionesUrgencia', tone: 'rose', Icon: ShieldPlus,
    title: 'Indicaciones prehechas de Urgencia',
    description: 'Plantillas editables por síndrome.',
    details: ['Por síndrome', 'Edad y peso', 'Destino', 'Alergias', 'AINEs · Corticoides · β-lactámicos'],
    show: c => c.hasUrgencias,
  },
];


// Formularios de la BD (RequestTemplate): a qué área van y con qué estilo.
export const TEMPLATE_TYPE_META = {
  'Protocolo Imágenes':   { group: 'examenes',   tone: 'indigo',  Icon: Image },
  'Laboratorio Especial': { group: 'examenes',   tone: 'violet',  Icon: FlaskConical },
  'Estudio Endoscópico':  { group: 'examenes',   tone: 'emerald', Icon: Microscope },
  'Interconsulta':        { group: 'derivacion', tone: 'amber',   Icon: MessageSquare },
  'Indicaciones clínicas':{ group: 'registro',   tone: 'rose',    Icon: ClipboardList },
  default:                { group: 'otros',      tone: 'violet',  Icon: ClipboardList },
};


// Formularios que no son documentos para imprimir sino seguimiento: van en Trabajo, no en Documentos.
const TRACKING_FORM_ROUTES = ['CurvaExamenes'];
export const DOCUMENT_FORMS = STATIC_FORMS.filter(form => !TRACKING_FORM_ROUTES.includes(form.route));

// `login: true` pasa por el ingreso de administrador antes de abrir el módulo (igual que en Inicio).
export const WORK_SECTIONS = [
  {
    id: 'hospitalizados', title: 'Hospitalizados', subtitle: 'Censo, seguimiento por cama y protocolos del paciente',
    modules: [
      { route: 'VistaHospitalizados', title: 'Censo de hospitalizados', description: 'Camas, evolución y documentos del paciente.', Icon: BedDouble, tone: 'blue' },
      { route: 'CurvaExamenes', title: 'Curva de exámenes', description: 'Seguimiento longitudinal de laboratorio por cama.', Icon: Activity, tone: 'teal' },
      { route: 'ProtocoloInsulina', title: 'Protocolo de corrección insulínica', description: 'Esquema por paciente; se guarda en la cama.', Icon: Syringe, tone: 'indigo' },
    ],
  },
  {
    id: 'consulta', title: 'Consulta y programas', subtitle: 'Agenda del día y programas con seguimiento',
    modules: [
      { route: 'AgendaDiaria', title: 'Agenda diaria', description: 'Reparto de camas, internos y continuidad del día.', Icon: CalendarDays, tone: 'violet', login: true },
      { route: 'GestionCardiovascular', title: 'Programa cardiovascular (PSCV)', description: 'Seguimiento de pacientes del programa.', Icon: HeartPulse, tone: 'rose' },
    ],
  },
  {
    id: 'proa', title: 'Antimicrobianos (PROA)', subtitle: 'Uso de antimicrobianos y sensibilidad local',
    modules: [
      { route: 'GestionPROA', title: 'Gestión PROA', description: 'Seguimiento de uso de antimicrobianos.', Icon: ShieldPlus, tone: 'emerald' },
      { route: 'VisitaPROA', title: 'Visita PROA', description: 'Evaluación y seguimiento individual.', Icon: Stethoscope, tone: 'emerald' },
      { route: 'Antibiograma', title: 'Antibiograma local', description: 'Informe institucional de sensibilidad.', Icon: FlaskConical, tone: 'cyan' },
    ],
  },
  {
    id: 'referencia', title: 'Referencia y red', subtitle: 'Arsenal, derivación y gestión',
    modules: [
      { route: 'PrescripcionInteligente', title: 'Arsenal y prescripción', description: 'Medicamentos disponibles y presentaciones.', Icon: Pill, tone: 'amber' },
      { route: 'RedDerivacion', title: 'Red y derivación Ñuble', description: 'Contactos oficiales y procedimiento de traslado.', Icon: Phone, tone: 'slate' },
      { route: 'SubdireccionMedica', title: 'Subdirección médica', description: 'Gestión y agenda médica del establecimiento.', Icon: Users, tone: 'slate', login: true },
    ],
  },
];

export const WORK_ROUTES = WORK_SECTIONS.flatMap(section => section.modules.map(module => module.route));
export const DOCUMENT_ROUTES = DOCUMENT_FORMS.map(form => form.route);
