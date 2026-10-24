import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

// patientProfile y coquelucheForm usan el alias "@/": se empaquetan en memoria antes de importarlos.
const bundle = async entry => {
  const out = await build({
    entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm',
    alias: { '@': new URL('../src', import.meta.url).pathname },
  });
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
};
const { expandPatientProfile, canonicalPatientKey, ageFromBirthDate } = await bundle('src/lib/patientProfile.js');
const { coquelucheFromPrefill, initialCoqueluche } = await bundle('src/lib/coquelucheForm.js');
const regiones = JSON.parse(readFileSync(new URL('../src/data/chile_regiones.json', import.meta.url), 'utf8'));

const now = new Date('2026-10-24T12:00:00');

test('age is computed from birth date only when not typed', () => {
  assert.equal(ageFromBirthDate('1975-10-25', now), '50');
  assert.equal(ageFromBirthDate('1975-10-24', now), '51');
  assert.equal(expandPatientProfile({ patient_fecha_nac: '1975-10-24' }, now).edad, '51');
  assert.equal(expandPatientProfile({ patient_fecha_nac: '1975-10-24', patient_edad: '3 meses' }, now).edad, '3 meses');
});

test('every legacy field name receives the shared value', () => {
  const out = expandPatientProfile({
    patient_name: 'Pérez Soto, Juan', patient_rut: '12.345.678-5', patient_direccion: 'Calle 1',
    diagnostico: 'Neumonía', resumen_caso: 'Ingresa por disnea', servicio: 'Medicina', cama: '3',
  }, now);
  assert.equal(out.nombre_paciente, 'Pérez Soto, Juan');
  assert.equal(out.rut, '12.345.678-5');
  assert.equal(out.domicilio, 'Calle 1');
  assert.equal(out.diagnostico_principal, 'Neumonía');
  assert.equal(out.clinical_text, 'Ingresa por disnea');
  assert.equal(out.ubicacion, 'Medicina · 3');
  assert.match(out.fecha, /^\d{2}-\d{2}-\d{4}$/);
});

test('template field names map to shared keys, own fields stay own', () => {
  assert.equal(canonicalPatientKey('nombre_paciente'), 'patient_name');
  assert.equal(canonicalPatientKey('edad'), 'patient_edad');
  assert.equal(canonicalPatientKey('examenes'), null);
});

test('coqueluche reads the shared patient data', () => {
  const data = coquelucheFromPrefill(initialCoqueluche(now), expandPatientProfile({
    patient_name: 'Pérez Soto, Juan Andrés', patient_rut: '12.345.678-k', patient_sexo: 'Masculino',
    patient_fecha_nac: '2026-07-24', patient_edad: '3 meses', patient_direccion: 'Carrera 450', patient_comuna: 'bulnes',
  }, now), regiones);
  assert.equal(data.rut, '12345678');
  assert.equal(data.dv, 'K');
  assert.equal(data.nombres, 'Juan Andrés');
  assert.equal(data.apellido1, 'Pérez');
  assert.equal(data.apellido2, 'Soto');
  assert.equal(data.sexo, 'M');
  assert.equal(data.edad, '3 meses');
  assert.equal(data.region, 'Ñuble');
  assert.equal(data.comuna, 'Bulnes');
  assert.equal(data.establecimiento, 'Hospital Comunitario de Salud Familiar de Bulnes');
});
