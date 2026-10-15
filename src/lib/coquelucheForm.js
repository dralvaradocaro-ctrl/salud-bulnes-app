// Coordinates in the 1190 × 1683 rendering of the source form (both A4 pages).
export const FORM_WIDTH = 1190;
export const FORM_HEIGHT = 1683;
export const COQUELUCHE_SOURCE = 'https://hcv.cl/HCV2/wp-content/uploads/2025/09/Formulario-de-investigación-y-notificación-para-casos-de-coqueluche.pdf';
export const sections = [
  'Establecimiento que notifica', 'Datos personales del paciente', 'Datos clínicos',
  'Complicaciones y tratamiento', 'Laboratorio', 'Vacunación',
  'Información epidemiológica y contactos', 'Menores de 12 meses', 'Clasificación',
];
const fields = [];
const field = (id, label, section, page, x, y, w, type = 'text', extra = {}) => {
  fields.push({ id, label, section, page, x, y, w, h: 22, type, ...extra });
};
const yesNo = (id, label, section, page, x, y, noX) => field(id, label, section, page, x, y, 24, 'choice', {
  h: 24, options: [{ value: 'Sí', x, y }, { value: 'No', x: noX, y }],
});
field('servicio', 'Servicio de Salud', 0, 1, 213, 295, 380);
field('establecimiento', 'Establecimiento', 0, 1, 747, 299, 385);
field('fechaNotificacion', 'Fecha de notificación', 0, 1, 274, 335, 146, 'date');
field('fechaConsulta', 'Fecha de primera consulta', 0, 1, 665, 335, 145, 'date');
field('fechaTos', 'Fecha de inicio de tos', 0, 1, 987, 335, 145, 'date');
field('profesional', 'Profesional que notifica', 0, 1, 257, 377, 385);
field('telefonoNotificador', 'Teléfono del profesional que notifica', 0, 1, 847, 375, 219, 'tel');
field('rut', 'RUT (sin dígito verificador)', 1, 1, 98, 477, 156);
field('dv', 'Dígito verificador', 1, 1, 274, 477, 36);
field('nombres', 'Nombres', 1, 1, 370, 477, 290);
field('apellido1', 'Primer apellido', 1, 1, 730, 477, 184);
field('apellido2', 'Segundo apellido', 1, 1, 984, 477, 148);
field('sexo', 'Sexo', 1, 1, 144, 516, 24, 'choice', { h: 24, options: [{value:'M', x:144, y:516}, {value:'F', x:213, y:516}] });
field('fechaNacimiento', 'Fecha de nacimiento', 1, 1, 470, 515, 145, 'date');
field('edad', 'Edad (indique años, meses o días)', 1, 1, 710, 517, 250);
field('calle', 'Dirección: calle', 1, 1, 204, 560, 362);
field('numero', 'Dirección: número', 1, 1, 600, 560, 107);
field('region', 'Región', 1, 1, 1068, 558, 64, 'region');
field('comuna', 'Comuna', 1, 1, 774, 558, 242, 'comuna');
field('familiar', 'Nombre del familiar responsable', 1, 1, 299, 596, 332);
field('telefonoFamiliar', 'Teléfono del familiar', 1, 1, 786, 595, 273, 'tel');
const symptomGroups = [
  ['Menor de 6 meses', 388, [734, 762, 788, 822, 851, 879, 909, 937], ['Tos', 'Coriza', 'Sin fiebre o febrículas', 'Estridor inspiratorio', 'Vómitos post tusivo', 'Apnea', 'Cianosis', 'Paroxismo de tos']],
  ['6 meses a 9 años', 655, [734, 762, 788, 822, 851, 879], ['Tos igual o mayor a 7 días', 'Paroxismos de tos', 'Sin fiebre o febrículas', 'Estridor inspiratorio', 'Vómitos post tusivo', 'Apnea']],
  ['Mayor de 9 años', 924, [734, 762, 788, 822, 851, 879, 909, 937], ['Tos igual o mayor a 14 días', 'Paroxismos de tos', 'Tos no productiva', 'Estridor inspiratorio', 'Vómitos post tusivo', 'Apnea', 'Sudoración entre accesos de tos', 'Empeoramiento nocturno']],
];
symptomGroups.forEach(([group, x, ys, labels], g) => labels.forEach((label, i) =>
  field(`sintoma_${g}_${i}`, label, 2, 1, x, ys[i] - 13, 21, 'checkbox', { h: 21, group }),
));
yesNo('tosPosterior', 'Tos posterior al tratamiento', 2, 1, 1001, 810, 1094);
field('duracionTos', 'Duración de la tos (días)', 2, 1, 986, 900, 63, 'number');
field('atencion', 'Atención', 3, 1, 192, 1012, 24, 'choice', { h: 24, options: [{value:'Ambulatorio', x:192, y:1012}, {value:'Hospitalizado', x:364, y:1012}] });
field('fechaHospitalizacion', 'Fecha de hospitalización', 3, 1, 694, 1014, 145, 'date');
field('fechaAlta', 'Fecha de alta', 3, 1, 997, 1014, 145, 'date');
[
  ['neumonia','Neumonía',192,1059], ['neumoniaImagen','Neumonía confirmada por imagen',563,1059],
  ['uti','Requirió UTI/UCI',797,1059], ['vmni','VMNI',1064,1059],
  ['convulsiones','Convulsiones',192,1102], ['encefalopatia','Encefalopatía',563,1102],
  ['vmi','VMI',797,1100], ['vasoactiva','Uso de droga vasoactiva',1064,1100],
].forEach(([id,label,x,y]) => field(id,label,3,1,x,y,21,'checkbox',{h:21}));
yesNo('fallecido','Fallecido',3,1,252,1137,329);
field('fechaDefuncion','Fecha de defunción',3,1,613,1139,145,'date');
yesNo('usoAntibiotico','Uso de antibiótico',3,1,252,1180,329);
field('fechaTratamiento','Fecha de inicio de tratamiento',3,1,613,1183,145,'date');
field('antibiotico','Antibiótico',3,1,915,1184,181);
yesNo('tomaMuestra','¿Hubo toma de muestra?',4,1,326,1299,400);
field('fechaMuestra','Fecha de toma de muestra',4,1,970,1301,145,'date');
field('responsableMuestra','Profesional responsable del envío de muestra',4,1,420,1344,291);
field('fechaEnvio','Fecha de envío de muestra',4,1,970,1343,145,'date');
field('fonoLaboratorio','Fono del laboratorio que envía la muestra',4,1,420,1386,291,'tel');
field('emailLaboratorio','E-mail del laboratorio que envía la muestra',4,1,420,1429,291,'email');
field('laboratorioDerivacion','Laboratorio de derivación',4,1,270,1470,295);
field('fechaEnvioDerivacion','Fecha de envío al laboratorio de derivación',4,1,827,1467,146,'date');
yesNo('coinfeccion','¿Existe coinfección?',4,1,288,1507,366);
field('agente','Agente de coinfección',4,1,485,1511,296);
export const vaccineDoses = ['1ª dosis', '2ª dosis', '3ª dosis', '1º refuerzo', '2º refuerzo', '8º básico', 'Capullo'];
vaccineDoses.forEach((dose,i) => {
 const y=204+i*25.2;
 field(`vacunaFecha_${i}`,`Fecha: ${dose}`,5,2,221,y,144,'date',{group:dose,h:22});
 field(`vacunaTipo_${i}`,`Tipo de vacuna: ${dose}`,5,2,394,y,200,'text',{group:dose});
 field(`vacunaRechazo_${i}`,`Motivo de rechazo: ${dose}`,5,2,625,y,236,'text',{group:dose});
});
field('rechazoVacunacion','Motivo de rechazo a la vacunación',5,2,892,201,280);
field('fechaInvestigacion','Fecha de investigación',6,2,295,460,144,'date');
for(let i=0;i<7;i++) {
 const y=584+i*28.5;
 field(`contactoNumero_${i}`,`Nº de contacto ${i+1}`,6,2,51,y,28,'number',{group:`Contacto ${i+1}`});
 field(`contactoNombre_${i}`,`Nombre del contacto ${i+1}`,6,2,86,y,450,'text',{group:`Contacto ${i+1}`});
 field(`contactoEdad_${i}`,`Edad del contacto ${i+1}`,6,2,568,y,141,'text',{group:`Contacto ${i+1}`});
 field(`contactoRiesgo_${i}`,`Contacto ${i+1}: ¿de riesgo?`,6,2,757,y,174,'select',{group:`Contacto ${i+1}`,values:['Sí','No']});
 field(`contactoTratamiento_${i}`,`Contacto ${i+1}: ¿recibe tratamiento?`,6,2,977,y,164,'select',{group:`Contacto ${i+1}`,values:['Sí','No']});
}
field('totalContactos','Total de contactos identificados',6,2,351,815,94,'number');
field('totalRiesgo','Total de contactos de riesgo',6,2,351,854,94,'number');
field('totalTratados','Total de contactos tratados',6,2,352,892,94,'number');
field('totalRiesgoTratados','Total de contactos de riesgo tratados',6,2,394,931,94,'number');
field('totalIncompletos','Contactos menores de 7 años con esquema incompleto',6,2,624,972,94,'number');
yesNo('brote','¿El caso se relaciona con un brote?',6,2,971,828,1050);
yesNo('fuenteConocida','¿Existe una fuente de infección conocida?',6,2,479,1001,553);
field('fuente','Posible fuente de infección',6,2,843,1006,287);
field('pesoNacimiento','Peso al nacer (kg)',7,2,314,1102,93,'number',{step:'0.001'});
field('edadGestacional','Edad gestacional (semanas)',7,2,314,1138,93,'number');
field('edadMadre','Edad de la madre al nacer (años)',7,2,314,1176,93,'number');
field('residentes','Número de residentes en el hogar',7,2,314,1212,93,'number');
field('clasificacion','El caso fue clasificado como',8,2,304,1314,296);
field('cie10','Código CIE-10',8,2,304,1353,410);
field('criterio','Criterio de clasificación',8,2,304,1390,296);
field('metodoLaboratorio','Método de laboratorio',8,2,739,1390,318);
field('registroENO','Número de registro ENO',8,2,229,1468,148);
export const coquelucheFields = fields;

export function chileToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type) => parts.find(p => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function initialCoqueluche(now = new Date()) {
  return {
    ...Object.fromEntries(fields.map(f => [f.id, f.type === 'checkbox' ? false : ''])),
    servicio: 'Servicio de Salud Ñuble',
    establecimiento: 'Hospital Comunitario de Salud Familiar de Bulnes',
    fechaNotificacion: chileToday(now),
    telefonoNotificador: '42 258 5900',
  };
}
export function updateCoqueluche(data, id, value, regiones) {
  const next = { ...data, [id]: value };
  if (id === 'region' && !regiones.find(r => r.nombre === value)?.comunas.includes(data.comuna)) next.comuna = '';
  return next;
}
export function dateParts(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return ['', '', ''];
  const [year, month, day] = value.split('-');
  return [day, month, year];
}

// Prioridades de llenado de esta herramienta; nunca bloquean la generación del PDF.
const priorityFields = new Set([
  'servicio', 'establecimiento', 'fechaNotificacion', 'profesional', 'telefonoNotificador',
  'rut', 'dv', 'nombres', 'apellido1', 'sexo', 'fechaNacimiento', 'calle', 'region', 'comuna',
  'fechaConsulta', 'fechaTos', 'atencion', 'usoAntibiotico', 'tomaMuestra',
]);
export function isPriorityField(field, data) {
  if (priorityFields.has(field.id)) return true;
  if (field.id === 'fechaHospitalizacion') return data.atencion === 'Hospitalizado';
  if (['antibiotico', 'fechaTratamiento'].includes(field.id)) return data.usoAntibiotico === 'Sí';
  if (['fechaMuestra', 'responsableMuestra'].includes(field.id)) return data.tomaMuestra === 'Sí';
  return false;
}
export function pendingPriorityFields(data) {
  return coquelucheFields.filter(field => isPriorityField(field, data) && !String(data[field.id] ?? '').trim());
}
