import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const result = await build({ entryPoints: ['src/lib/PacienteGeneral.jsx'], bundle: true, write: false, platform: 'node', format: 'esm', external: ['react'], jsx: 'automatic' });
const code = result.outputFiles[0].text.replace(/from "(react(?:\/jsx-runtime)?)"/g, (_, name) => `from ${JSON.stringify(import.meta.resolve(name))}`);
const { permitePacienteGeneral, PacienteGeneralProvider, usePacienteGeneral } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
function Consumer() {
  const value = usePacienteGeneral();
  return React.createElement('span', null, value?.paciente ? `${value.paciente.nombre}|${value.paciente.rut}` : 'sin paciente');
}
const render = enabled => renderToStaticMarkup(React.createElement(PacienteGeneralProvider, { enabled }, React.createElement(Consumer)));
test('general pages allow the selector; clinical contexts never do', () => {
  for (const p of ['Home', 'CertificadoMedico', 'RecetaMedica', 'OrdenExamenes', 'AllCalculators', 'TopicDetail']) assert.equal(permitePacienteGeneral(p), true);
  for (const p of ['VistaHospitalizados', 'GestionPROA', 'VisitaPROA', 'OperacionClinica']) assert.equal(permitePacienteGeneral(p), false);
  assert.equal(permitePacienteGeneral('CertificadoMedico', '?contextoClinico=hospitalizados'), false);
  assert.equal(permitePacienteGeneral('AllCalculators', '?bed=MQ1'), false);
});
test('stored identity reaches general consumers and is isolated from clinical consumers', () => {
  globalThis.sessionStorage = { getItem: () => JSON.stringify({ nombre: 'Paciente de prueba', rut: '12.345.678-5' }) };
  assert.match(render(true), /Paciente de prueba\|12.345.678-5/);
  assert.match(render(false), /sin paciente/);
});
test('cleared, malformed and inaccessible session storage are safe', () => {
  globalThis.sessionStorage = { getItem: () => JSON.stringify({ nombre: '', rut: '' }) };
  assert.equal(render(true), '<span>|</span>');
  globalThis.sessionStorage = { getItem: () => '{' };
  assert.match(render(true), /sin paciente/);
  globalThis.sessionStorage = { getItem: () => { throw new Error('blocked'); } };
  assert.match(render(true), /sin paciente/);
  delete globalThis.sessionStorage;
});
