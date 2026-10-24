import assert from 'node:assert/strict';
import { createServer } from 'vite';
const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; };
globalThis.sessionStorage = storage();
globalThis.localStorage = storage();
globalThis.window = { sessionStorage, localStorage };
const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' });
try {
  const { leerPacienteDocumentos: leer, guardarPacienteDocumentos: guardar, limpiarPacienteDocumentos: limpiar } = await server.ssrLoadModule('/src/lib/pacienteDocumentos.js');
  const { setMultiPrefill } = await server.ssrLoadModule('/src/lib/multiTemplatePrefill.js');
  assert.deepEqual(leer(), {});
  setMultiPrefill({ patient_name: 'Paciente inicial', patient_rut: '123456785', edad: 50, patient_direccion: 'Calle de prueba', diagnostico: 'Control' });
  assert.equal(leer().desdeMulti, true);
  guardar({ paciente: 'Paciente inicial', rut: '12.345.678-5', institucion: 'bulnes' }); // certificate updates only its fields
  assert.equal(leer().edad, '50');
  assert.equal(leer().direccion, 'Calle de prueba');
  assert.equal(leer().diagnostico, 'Control');
  assert.equal(leer().desdeMulti, undefined);
  guardar({ paciente: 'Paciente corregido', edad: '51', institucion: 'inalab', medicamentos: ['no compartir'] });
  assert.equal(leer().paciente, 'Paciente corregido');
  assert.equal(leer().edad, '51');
  assert.equal(leer().institucion, 'inalab');
  assert.equal(leer().medicamentos, undefined);
  limpiar();
  assert.deepEqual(leer(), {}); // old multi-prefill must not return after New patient
  guardar({ paciente: '', rut: '', institucion: 'bulnes' });
  assert.equal(leer().edad, undefined);
  assert.equal(leer().direccion, undefined);
  console.log('OK: datos compartidos entre documentos, campos de certificado, importación inicial y limpieza de paciente.');
} finally { await server.close(); }
