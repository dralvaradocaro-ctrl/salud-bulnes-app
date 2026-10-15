// Only sourced public contacts. Consultation date is not operational validation.
export const networkContacts = [
  { id: 'samu', name: 'SAMU', purpose: 'Emergencia médica', phone: '131', dial: '131', note: 'Número nacional de emergencias médicas.', source: 'https://degreyd.minsal.cl/informacion-esencial/', checked: '2026-09-22' },
  { id: 'bulnes', name: 'Hospital Comunitario de Salud Familiar de Bulnes', purpose: 'Contacto institucional publicado', phone: '42 258 5960', dial: '+56422585960', note: 'Registro de la Superintendencia; solicitar la unidad correspondiente. No es un anexo de traslado verificado.', source: 'https://www.superdesalud.gob.cl/registro/hospital-comunitario-de-salud-familiar-de-bulnes/', checked: '2026-09-22' },
  { id: 'ssn', name: 'Servicio de Salud Ñuble', purpose: 'Central institucional', phone: '42 258 7210', dial: '+56422587210', note: 'Teléfono central publicado por MINSAL. Confirmar canal de coordinación clínica.', source: 'https://www.minsal.cl/conozcanos_servicios_salud/', checked: '2026-09-22' },
  { id: 'hchm', name: 'Hospital Clínico Herminda Martín', purpose: 'Orientación sobre horas de especialidad', phone: '42 258 6790', dial: '+56422586790', note: 'Publicado por el hospital en 2016 para consultas sobre horas del CAE. Vigencia operativa pendiente de confirmar; no utilizar como línea directa de urgencia.', source: 'https://hospitaldechillan.cl/web/tres-pasos-para-acceder-a-una-atencion-de-especialista-en-el-consultorio-de-especialidades/', checked: '2026-09-22' },
  { id: 'salud-responde', name: 'Salud Responde', purpose: 'Orientación a usuarios', phone: '600 360 7777', dial: '6003607777', note: 'Canal de orientación, no autorización de traslados.', source: 'https://hospitaldechillan.cl/web/', checked: '2026-09-22' },
];

// Populate only after receiving the institution's original approved report.
export const localAntibiogram = {
  title: 'Antibiograma local', url: null, establishment: null, period: null,
  approvedBy: null, updatedAt: null,
};
