import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async path => new Response(await readFile(new URL(`../public${path}`, import.meta.url)));
  const { buildOrdenExamenesPdf } = await server.ssrLoadModule('/src/lib/ordenExamenesPdf.js');
  const { EXAMENES_CATALOGO, buscarExamenes, nuevoExamen, mostrarCreatinina, textoCreatinina, textoExamen, validarEstudios, agruparExamenes, camposExamen, renombrarExamen } = await server.ssrLoadModule('/src/lib/ordenExamenesCatalogo.js');
  assert.ok(EXAMENES_CATALOGO.length > 100);
  assert.equal(new Set(EXAMENES_CATALOGO.map(e => e.nombre)).size, EXAMENES_CATALOGO.length);
  assert.ok(buscarExamenes('TAC ABDOMEN').some(e => e.nombre === 'TC de abdomen y pelvis'));
  assert.ok(buscarExamenes('resonancia rodilla').some(e => e.nombre === 'RM de rodilla'));
  assert.ok(buscarExamenes('ecografia').some(e => e.nombre === 'Ecografía abdominal'));
  assert.deepEqual(buscarExamenes('TC cerebro', 'Laboratorio'), []);
  const tc = nuevoExamen(buscarExamenes('TC cerebro')[0]);
  assert.equal(tc.contraste, '');
  assert.equal(tc.permiteContraste, true);
  const orden = {
    paciente: 'Paciente prueba', rut: '12.345.678-5', edad: '50', direccion: 'Dirección de prueba', fecha: '2026-10-23',
    diagnostico: 'Motivo del estudio', observaciones: '', institucion: 'inalab', firma: false,
    examenes: [tc], incluirCreatinina: false, creatinina: '', unidadCreatinina: 'mg/dL', fechaCreatinina: '',
  };
  assert.ok(validarEstudios(orden).length);
  assert.throws(() => buildOrdenExamenesPdf(orden), /contraste/);
  orden.examenes[0].contraste = 'Sin contraste';
  assert.deepEqual(validarEstudios(orden), []);
  assert.equal(mostrarCreatinina(orden), false);
  assert.equal(textoCreatinina(orden), '');
  const viral = nuevoExamen(buscarExamenes('Panel viral respiratorio')[0]);
  assert.equal(viral.categoria, 'Microbiología y serología');
  assert.equal(camposExamen(viral).contraste, false);
  assert.doesNotMatch(camposExamen(viral).detalleLabel, /lateralidad/);
  assert.match(camposExamen(nuevoExamen(buscarExamenes('Radiografía de rodilla')[0])).detalleLabel, /lateralidad/);
  assert.equal(camposExamen(tc).contraste, true);
  const renombrado = renombrarExamen({ ...tc, contraste: 'Con contraste' }, 'Panel viral respiratorio');
  assert.equal(renombrado.permiteContraste, false);
  assert.equal(renombrado.contraste, '');
  const libre = { ...orden, examenes: [], textoLibre: 'Solicitud escrita directamente\nSegunda línea de la solicitud' };
  assert.deepEqual(validarEstudios(libre), []);
  assert.ok(validarEstudios({ ...libre, textoLibre: '   ' }).length);
  const pdfLibre = await buildOrdenExamenesPdf(libre);
  assert.ok(pdfLibre.output().includes('Solicitud escrita directamente'));
  assert.ok(pdfLibre.output().includes('Segunda'));
  assert.ok(!pdfLibre.output().includes('Detalle / contraste'));
  const mixtos = [nuevoExamen({ nombre: 'Hemograma' }), tc, nuevoExamen({ nombre: 'Proteína C reactiva (PCR)' }), nuevoExamen({ nombre: 'Mamografía bilateral' })];
  const grupos = agruparExamenes(mixtos);
  assert.equal(grupos.length, 2);
  assert.deepEqual(grupos[0].examenes.map(e => e.nombre), ['Hemograma', 'Proteína C reactiva (PCR)']);
  assert.deepEqual(grupos[1].examenes.map(e => e.nombre), ['TC de cerebro', 'Mamografía bilateral']);
  assert.equal(agruparExamenes([]).length, 0);
  assert.equal(agruparExamenes([tc]).length, 1);
  assert.equal(agruparExamenes([nuevoExamen({ nombre: 'TAC rodilla derecha' })])[0].titulo, 'Imagenología');
  const mixtoPdf = await buildOrdenExamenesPdf({ ...orden, examenes: mixtos });
  assert.ok(mixtoPdf.output().includes('Laboratorio y otros estudios'));
  assert.ok(mixtoPdf.output().includes('Imagenolog'));
  assert.ok(mixtoPdf.output().includes('/F1 9 Tf'));
  const simple = await buildOrdenExamenesPdf(orden);
  assert.equal(simple.getNumberOfPages(), 1);
  assert.ok(simple.output().includes('Sin contraste'));
  assert.ok(simple.output().includes('Detalle / contraste'));
  assert.ok(simple.output().includes(' re')); // table cell rectangles
  assert.ok(!simple.output().includes('RECETA'));
  assert.ok(!simple.output().includes('creatinina'));
  assert.ok(!simple.output().includes('Firma electr'));
  orden.examenes[0].contraste = 'Con contraste';
  assert.equal(textoCreatinina(orden), 'Última creatinina: no informada');
  orden.creatinina = '0,9';
  assert.ok(validarEstudios(orden).length); // a result needs its sample date
  orden.fechaCreatinina = '2026-10-20';
  assert.deepEqual(validarEstudios(orden), []);
  const contraste = await buildOrdenExamenesPdf({ ...orden, firma: true });
  assert.ok(contraste.output().includes('0,9 mg/dL'));
  assert.ok(contraste.output().includes('20 de octubre de 2026'));
  assert.ok(contraste.output().includes('Con contraste'));
  assert.ok(contraste.output().includes('Firma electr'));
  assert.ok(validarEstudios({ ...orden, creatinina: '-1' }).length);
  assert.ok(validarEstudios({ ...orden, creatinina: 'abc' }).length);
  assert.ok(validarEstudios({ ...orden, fechaCreatinina: '2026-11-01' }).length);
  assert.equal(textoExamen({ ...tc, permiteContraste: false, detalle: 'Lado derecho' }), 'TC de cerebro · Lado derecho');
  const lab = { ...orden, examenes: [nuevoExamen({ nombre: 'Hemograma' })], incluirCreatinina: false };
  assert.equal(textoCreatinina(lab), ''); // stale result must not leak into unrelated order
  assert.ok(textoCreatinina({ ...lab, incluirCreatinina: true }).includes('0,9 mg/dL'));
  const larga = await buildOrdenExamenesPdf({ ...lab, institucion: 'bulnes', examenes: Array.from({ length: 65 }, (_, i) => ({ ...nuevoExamen({ nombre: `Estudio manual ${i + 1}` }), detalle: 'Texto extenso. '.repeat(20) })) });
  assert.ok(larga.getNumberOfPages() > 2);
  assert.ok(larga.output().includes('Estudio manual 65'));
  assert.ok(larga.output().includes(`de ${larga.getNumberOfPages()}`));
  const gigante = await buildOrdenExamenesPdf({ ...lab, examenes: [{ ...nuevoExamen({ nombre: 'Estudio extenso' }), detalle: 'Detalle '.repeat(2000) + 'FINDETALLE' }] });
  assert.ok(gigante.getNumberOfPages() > 2);
  assert.ok(gigante.output().includes('FINDETALLE'));
  console.log(`OK: ${EXAMENES_CATALOGO.length} estudios; búsquedas, contraste, creatinina/fecha, firma, ambas instituciones y PDF de ${larga.getNumberOfPages()} páginas.`);
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
