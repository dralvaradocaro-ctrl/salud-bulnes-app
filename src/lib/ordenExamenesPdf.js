import { buildDocumentoClinicoPdf } from '@/lib/recetaPdf';
import { textoCreatinina, validarEstudios, agruparExamenes } from '@/lib/ordenExamenesCatalogo';

export function buildOrdenExamenesPdf(orden) {
  const errores = validarEstudios(orden);
  if (errores.length) throw new Error(`Completa: ${errores.join('; ')}.`);
  return buildDocumentoClinicoPdf(orden, {
    titulo: 'ORDEN DE EXÁMENES',
    seccion: orden.examenes.length ? 'Solicito los siguientes estudios:' : '',
    tablas: agruparExamenes(orden.examenes).map(grupo => ({
      titulo: grupo.titulo,
      encabezados: ['N°', 'Examen', grupo.detalle],
      filas: grupo.examenes.map(item => [item.nombre, [item.permiteContraste && item.contraste, item.detalle].filter(Boolean).join(' · ')]),
    })),
    antecedentes: [textoCreatinina(orden)],
  });
}
