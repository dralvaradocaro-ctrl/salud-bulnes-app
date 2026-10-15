import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { buildSwitchPlan } from '../src/components/calculators/antidepressantSwitchEngine.js';
const bundled = await build({ entryPoints: ['src/components/calculators/SwitchCalendarPrint.jsx'], bundle: true, write: false, platform: 'node', format: 'esm', external: ['react', 'react-dom'], jsx: 'transform' });
const code = bundled.outputFiles[0].text.replace(/from "(react(?:-dom|\/jsx-runtime)?)"/g, (_, name) => `from ${JSON.stringify(import.meta.resolve(name))}`);
const { default: Calendar, shortDose } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const settings = { date: '2026-10-02', from: { strength: 100, split: true }, to: { strength: 25, split: true } };
test('prints compact quantities without taper prose and preserves conditional adjustments', () => {
  assert.equal(shortDose({ accion: 'Reducir a 50% (50 mg/día)' }, settings.from, 'sertralina'), '1/2 comp/día');
  assert.equal(shortDose({ accion: 'Subir a 25 mg/noche' }, settings.to, 'clomipramina'), '1 comp/noche');
  assert.equal(shortDose({ accion: 'Subir hasta 100 mg/día según tolerancia' }, settings.from, 'sertralina'), 'Confirmar dosis en control');
});
test('calendar has logo, patient, all days, and only one suspension instruction', () => {
  const html = renderToStaticMarkup(React.createElement(Calendar, { plan: buildSwitchPlan('sertralina', 'clomipramina', 100), settings, patientInfo: { name: 'Paciente de prueba', rut: '123' } }));
  assert.match(html, /logo-hospital.png/);
  assert.match(html, /Paciente de prueba/);
  assert.equal((html.match(/>Suspender</g) || []).length, 1);
  assert.equal((html.match(/<article /g) || []).length, 28);
  assert.doesNotMatch(html, /Reducir a|Suspendido|Parámetros evaluados/);
});
test('long washout is paginated and keeps all medication-free days', () => {
  const html = renderToStaticMarkup(React.createElement(Calendar, { plan: buildSwitchPlan('fluoxetina', 'moclobemida', 20), settings }));
  assert.equal((html.match(/<section /g) || []).length, 2);
  assert.equal((html.match(/Lavado · sin tomas/g) || []).length, 35);
  assert.equal((html.match(/>Suspender</g) || []).length, 1);
});
