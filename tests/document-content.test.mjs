import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KINESIOTERAPIA, textoOrdenKine, tieneContenidoReceta, borrarContenidoReceta, borrarContenidoOrden } from '../src/lib/indicacionesReceta.js';
const datos = { paciente: 'Prueba', rut: '12.345.678-5', edad: '45', direccion: 'Prueba 1', diagnostico: 'Control', fecha: '2026-10-28', institucion: 'inalab', firma: true };
test('clearing prescription preserves patient and document settings', () => {
  const result = borrarContenidoReceta({ ...datos, medicamentos: [{}], textoLibre: 'Orden previa', observaciones: 'Indicaciones previas' });
  assert.deepEqual(result, { ...datos, medicamentos: [], textoLibre: '', observaciones: '' });
  assert.equal(tieneContenidoReceta(result), false);
});
test('clearing exams preserves patient clinical data including creatinine', () => {
  const result = borrarContenidoOrden({ ...datos, creatinina: '0,9', fechaCreatinina: '2026-10-20', examenes: [{}], observaciones: 'Anterior', incluirCreatinina: true });
  assert.deepEqual(result, { ...datos, creatinina: '0,9', fechaCreatinina: '2026-10-20', examenes: [], textoLibre: '', observaciones: '', incluirCreatinina: false });
});
test('free text alone is valid content; whitespace alone is not', () => {
  assert.equal(tieneContenidoReceta({ medicamentos: [], textoLibre: 'Kinesioterapia' }), true);
  assert.equal(tieneContenidoReceta({ medicamentos: [], textoLibre: '  ' }), false);
});
test('all templates require an explicit positive integer session count', () => {
  for (const p of KINESIOTERAPIA) {
    for (const n of ['', 0, -1, 1.5, 'abc']) assert.equal(textoOrdenKine(p.id, n), '');
    assert.match(textoOrdenKine(p.id, 12, 'Rodilla derecha'), /12.*sesiones|sesiones: 12/);
    assert.match(textoOrdenKine(p.id, 12, 'Rodilla derecha'), /Rodilla derecha/);
  }
});

test('clean signature preserves dimensions and every black ink pixel', async () => {
  const { decode } = await import('fast-png');
  const { readFile } = await import('node:fs/promises');
  const original = decode(await readFile(new URL('../public/firma-alvarado.png', import.meta.url)));
  const clean = decode(await readFile(new URL('../public/firma-alvarado-limpia.png', import.meta.url)));
  assert.equal(clean.width, original.width);
  assert.equal(clean.height, original.height);
  let preserved = 0;
  let removed = 0;
  for (let i = 0; i < original.data.length; i += 4) {
    if (original.data[i] === 0 && original.data[i + 1] === 0 && original.data[i + 2] === 0 && original.data[i + 3] > 0) {
      assert.equal(clean.data[i + 3], original.data[i + 3]);
      preserved++;
    }
    if (original.data[i] === 255 && original.data[i + 1] === 255 && original.data[i + 2] === 255 && original.data[i + 3] > 0) {
      assert.equal(clean.data[i + 3], 0);
      removed++;
    }
  }
  assert.ok(preserved > 1000);
  assert.ok(removed > 1000);
});
