export function fechaChile(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function nuevoInformeComplementario(now = new Date()) {
  const fecha = fechaChile(now);
  return {
    lugar: 'Bulnes', fechaSuperior: fecha, fechaInforme: fecha, licencia: '',
    destinatario: '', compin: '', paciente: '', rut: '', diagnosticos: '',
    historia: '', evolucion: '', recuperable: '', fechaAlta: '', fechaInvalidez: '',
    medico: '', especialidad: '', telefono: '',
  };
}

export function fechaInforme(value, larga = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
  if (!larga) return value.split('-').reverse().join('/');
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T12:00:00Z`));
}
