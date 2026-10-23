import { buildDocumentoClinicoPdf } from '@/lib/recetaPdf';
import { textoExamen, textoCreatinina, validarEstudios } from '@/lib/ordenExamenesCatalogo';

export function buildOrdenExamenesPdf(orden) {
  const errores = validarEstudios(orden);
  if (errores.length) throw new Error(`Completa: ${errores.join('; ')}.`);
  return buildDocumentoClinicoPdf(orden, {
    titulo: 'ORDEN DE EXÁMENES',
    seccion: 'Solicito los siguientes estudios:',
    lineas: orden.examenes.map(textoExamen),
    antecedentes: [textoCreatinina(orden)],
  });
}
