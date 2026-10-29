// Plantillas de redacción editables: el profesional define sesiones y restricciones.
export const KINESIOTERAPIA = [
  { id: 'epoc', nombre: 'Rehabilitación pulmonar · EPOC', texto: 'Solicito evaluación kinésica y rehabilitación pulmonar por EPOC. Entrenamiento aeróbico y de fuerza, educación y estrategias de control de disnea, individualizados según evaluación y tolerancia.' },
  { id: 'fibromialgia', nombre: 'Kinesioterapia motora · Fibromialgia', texto: 'Solicito evaluación y kinesioterapia motora por fibromialgia. Ejercicio aeróbico y fortalecimiento progresivos, educación y programa domiciliario adaptados al dolor, fatiga y capacidad funcional.' },
  { id: 'fractura', nombre: 'Rehabilitación posterior a fractura', texto: 'Solicito evaluación y rehabilitación motora posterior a fractura. Movilidad, fortalecimiento y recuperación funcional según etapa de consolidación e indicaciones de traumatología. Respetar restricciones de carga y movilidad consignadas.' },
  { id: 'esguince', nombre: 'Rehabilitación posterior a esguince', texto: 'Solicito evaluación y rehabilitación motora posterior a esguince. Recuperación progresiva de movilidad, fuerza, equilibrio y propiocepción según fase de lesión y tolerancia.' },
  { id: 'cirugia', nombre: 'Rehabilitación postoperatoria traumatológica', texto: 'Solicito evaluación y rehabilitación motora postoperatoria según protocolo e indicaciones del equipo tratante. Respetar restricciones de carga y rango de movilidad.' },
  { id: 'artrosis', nombre: 'Kinesioterapia motora · Artrosis', texto: 'Solicito evaluación kinésica por artrosis y limitación funcional. Plan individualizado de movilidad, fortalecimiento, ejercicio y educación para autocuidado.' },
  { id: 'marcha', nombre: 'Reeducación de marcha y equilibrio', texto: 'Solicito evaluación kinésica de marcha, equilibrio y capacidad funcional. Plan individualizado de fortalecimiento, entrenamiento de marcha y prevención de caídas.' },
  { id: 'general', nombre: 'Evaluación kinésica · Orden general', texto: 'Solicito evaluación kinésica y plan de rehabilitación individualizado según diagnóstico, objetivos funcionales y restricciones indicadas.' },
];
export function textoOrdenKine(id, sesiones, detalle = '') {
  const plantilla = KINESIOTERAPIA.find(p => p.id === id);
  if (!plantilla || !Number.isInteger(Number(sesiones)) || Number(sesiones) < 1) return '';
  return `${plantilla.texto}\nNúmero de sesiones: ${Number(sesiones)}. Reevaluar al finalizar el ciclo.${detalle.trim() ? `\nRegión, lateralidad, objetivos y restricciones: ${detalle.trim()}` : ''}`;
}
export const tieneContenidoReceta = receta => receta.medicamentos.length > 0 || Boolean(receta.textoLibre?.trim());
export const borrarContenidoReceta = receta => ({ ...receta, medicamentos: [], textoLibre: '', observaciones: '' });
export const borrarContenidoOrden = orden => ({ ...orden, examenes: [], textoLibre: '', observaciones: '', incluirCreatinina: false });
