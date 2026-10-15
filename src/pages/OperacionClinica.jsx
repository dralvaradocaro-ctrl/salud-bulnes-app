import { Link } from 'react-router-dom';
import { ClipboardList, BedDouble, Phone, FlaskConical, ShieldPlus, Home, Stethoscope, Pill } from 'lucide-react';
const tools = [
  ['FormularioCoqueluche', 'Notificación de coqueluche', 'Investigación, notificación y formulario editable.', ClipboardList],
  ['VistaHospitalizados', 'Censo de hospitalizados', 'Camas, evolución y documentos del paciente.', BedDouble],
  ['FormulariosHODOM', 'Formularios HODOM', 'Documentación de hospitalización domiciliaria.', Home],
  ['FormularioIRAGrave', 'Formulario IRA grave', 'Registro y documentación de IRA grave.', Stethoscope],
  ['SolicitudExamenes', 'Solicitud de exámenes', 'Formulario de laboratorio.', FlaskConical],
  ['SolicitudMicrobiologia', 'Microbiología', 'Solicitud de estudios microbiológicos.', FlaskConical],
  ['SolicitudFarmacoRestringido', 'Fármacos restringidos', 'Solicitud y presentaciones de referencia.', Pill],
  ['GestionPROA', 'Gestión PROA', 'Seguimiento de uso de antimicrobianos.', ShieldPlus],
  ['VisitaPROA', 'Visita PROA', 'Evaluación y seguimiento individual.', ShieldPlus],
  ['Antibiograma', 'Antibiograma local', 'Informe institucional y estado de incorporación.', FlaskConical],
  ['RedDerivacion', 'Red y derivación', 'Contactos oficiales y procedimiento local.', Phone],
];
export default function OperacionClinica() {
  return <div className="mx-auto max-w-5xl px-4 py-8"><h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900"><ClipboardList />Herramientas de trabajo</h1><p className="mb-6 mt-2 text-slate-600">Accesos diarios del equipo. Cada módulo conserva sus requisitos de ingreso y permisos.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map(([page, name, description, Icon]) => <Link key={page} to={`/${page}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-md"><Icon className="mb-3 h-6 w-6 text-blue-700" /><h2 className="font-bold text-slate-900">{name}</h2><p className="mt-2 text-sm text-slate-600">{description}</p></Link>)}</div></div>;
}
