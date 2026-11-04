import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { nuevoInformeComplementario, fechaInforme } from '../src/lib/informeComplementario.js';

test('both dates are preloaded using the Chilean date; clinical information starts empty', () => {
  const values = nuevoInformeComplementario(new Date('2026-11-04T01:00:00Z'));
  assert.equal(values.fechaSuperior, '2026-11-03');
  assert.equal(values.fechaInforme, '2026-11-03');
  assert.equal(values.lugar, 'Bulnes');
  for (const key of ['licencia', 'paciente', 'rut', 'diagnosticos', 'historia', 'evolucion', 'recuperable', 'medico', 'fechaAlta', 'fechaInvalidez']) assert.equal(values[key], '');
  values.fechaInforme = '2026-11-09';
  assert.equal(values.fechaSuperior, '2026-11-03');
  assert.equal(fechaInforme(values.fechaInforme), '09/11/2026');
  assert.match(fechaInforme(values.fechaSuperior, true), /3 de noviembre de 2026/);
});

test('new report resets dates and content instead of retaining another patient', () => {
  const first = nuevoInformeComplementario(new Date('2026-11-04T15:00:00Z'));
  first.paciente = 'Paciente de prueba';
  const next = nuevoInformeComplementario(new Date('2026-11-05T15:00:00Z'));
  assert.equal(next.paciente, '');
  assert.equal(next.fechaInforme, '2026-11-05');
  assert.equal(next.fechaSuperior, '2026-11-05');
});

test('document is registered in Policlínico with the existing hospital logo', async () => {
  const catalog = await readFile(new URL('../src/lib/workspaceCatalog.js', import.meta.url), 'utf8');
  const routes = await readFile(new URL('../src/pages.config.js', import.meta.url), 'utf8');
  const page = await readFile(new URL('../src/pages/InformeComplementario.jsx', import.meta.url), 'utf8');
  assert.match(catalog, /route: 'InformeComplementario'[\s\S]*?show: c => c.hasPolicinico/);
  assert.ok(routes.includes('"InformeComplementario": InformeComplementario'));
  assert.ok(page.includes('src="/logo-hospital.png"'));
  assert.ok((await readFile(new URL('../public/logo-hospital.png', import.meta.url))).length > 0);
});
