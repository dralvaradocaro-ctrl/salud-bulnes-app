import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { initialCoqueluche, chileToday, updateCoqueluche, pendingPriorityFields } from '../src/lib/coquelucheForm.js';
import { buildCoqueluchePdf } from '../src/lib/coqueluchePdf.js';

const regiones = JSON.parse(await fs.readFile(new URL('../src/data/chile_regiones.json', import.meta.url)));
test('defaults use the notification phone, leave patient/clinical data blank, and use the Chilean date at midnight UTC', () => {
  assert.equal(chileToday(new Date('2026-10-14T01:00:00Z')), '2026-10-13');
  const data = initialCoqueluche(new Date('2026-10-14T01:00:00Z'));
  assert.equal(data.fechaNotificacion, '2026-10-13');
  assert.equal(data.servicio, 'Servicio de Salud Ñuble');
  assert.equal(data.establecimiento, 'Hospital Comunitario de Salud Familiar de Bulnes');
  assert.equal(data.telefonoNotificador, '42 258 5900');
  assert.equal(data.telefonoFamiliar, '');
  assert.equal(data.region, '');
  assert.equal(data.atencion, '');
  assert.equal(data.sintoma_0_0, false);
});
test('region changes discard incompatible communes without changing other information', () => {
  const data = { ...initialCoqueluche(), region: 'Ñuble', comuna: 'Bulnes', nombres: 'PRUEBA' };
  assert.equal(updateCoqueluche(data, 'region', 'Ñuble', regiones).comuna, 'Bulnes');
  const updated = updateCoqueluche(data, 'region', 'Biobío', regiones);
  assert.equal(updated.comuna, '');
  assert.equal(updated.nombres, 'PRUEBA');
  assert.equal(data.comuna, 'Bulnes');
});
test('download has two A4 pages and preserves edited names, dates, negative answers, vaccines and contacts', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (path) => new Response(await fs.readFile(new URL(`../public${path}`, import.meta.url)));
  try {
    const doc = await buildCoqueluchePdf({ ...initialCoqueluche(new Date('2026-10-13T15:00:00Z')),
      nombres: 'Paciente Prueba', apellido1: 'Muñoz', fallecido: 'No', sintoma_0_0: true,
      vacunaTipo_0: 'Vacuna prueba', vacunaFecha_0: '2026-02-03',
      contactoNombre_6: 'Contacto siete', contactoRiesgo_6: 'No', registroENO: '123456',
    });
    const pdf = await getDocument({ data: new Uint8Array(doc.output('arraybuffer')) }).promise;
    assert.equal(pdf.numPages, 2);
    const texts = [];
    for (const pageNumber of [1, 2]) {
      const page = await pdf.getPage(pageNumber);
      assert.ok(Math.abs(page.view[2] - 595.28) < 1);
      assert.ok(Math.abs(page.view[3] - 841.89) < 1);
      texts.push((await page.getTextContent()).items.map(i => i.str).join(' '));
    }
    assert.match(texts[0], /Paciente Prueba/);
    assert.match(texts[0], /Muñoz/);
    assert.match(texts[0], /42 258 5900/);
    assert.equal((texts[0].match(/\bX\b/g) || []).length, 2);
    assert.match(texts[1], /03\s+02\s+2026/);
    assert.match(texts[1], /Vacuna prueba/);
    assert.match(texts[1], /Contacto siete/);
    assert.match(texts[1], /No/);
    assert.match(texts[1], /123456/);
  } finally { globalThis.fetch = originalFetch; }
});

test('priorities stop at laboratory and dependent fields are only requested when applicable', () => {
  const data = initialCoqueluche();
  const pending = pendingPriorityFields(data);
  assert.ok(pending.length > 0);
  assert.ok(pending.every(field => field.section <= 4));
  assert.ok(!pending.some(field => field.id === 'fechaMuestra'));
  assert.ok(!pending.some(field => field.id === 'antibiotico'));
  const withTreatment = pendingPriorityFields({ ...data, usoAntibiotico: 'Sí', tomaMuestra: 'Sí' });
  assert.ok(withTreatment.some(field => field.id === 'antibiotico'));
  assert.ok(withTreatment.some(field => field.id === 'fechaMuestra'));
  assert.ok(!withTreatment.some(field => field.id === 'usoAntibiotico'));
});
