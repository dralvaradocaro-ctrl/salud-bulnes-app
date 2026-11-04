import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = new URL('../src/components/sdm/documents/', import.meta.url);
const fields = JSON.parse(await readFile(new URL('application-fields.json', base), 'utf8'));
const template = await readFile(new URL('application-template.html', base), 'utf8');
// Load the browser module without relying on Node's JSON import syntax version.
const source = (await readFile(new URL('application.js', base), 'utf8'))
  .replace("import fields from './application-fields.json';", `const fields = ${JSON.stringify(fields)};`);
const { renderApplication, initialApplicationValues, createApplicationValues, toggleApplicationOption, updateApplicationValue } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('all editable fields appear in the two-page preview', () => {
  assert.equal((template.match(/class="page"/g) || []).length, 2);
  const keys = [...new Set([...template.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1].split('__')[0]))];
  assert.deepEqual(keys.sort(), fields.map(field => field.key).sort());
  const rendered = renderApplication(template, Object.fromEntries(fields.map(field => [field.key, `VALUE_${field.key}`])));
  for (const field of fields.filter(field => !field.options)) assert.ok(rendered.includes(`VALUE_${field.key}`));
  assert.ok(!rendered.includes('{{'));
});

test('personal fields start empty and free text cannot inject preview HTML', () => {
  for (const key of ['nombre', 'rut', 'telefono', 'emailPersonal', 'emailInstitucional', 'firmaNombre']) {
    assert.equal(initialApplicationValues[key], '');
  }
  const rendered = renderApplication(template, { nombre: '<script>alert("test")</script> & nombre' });
  assert.ok(!rendered.includes('<script>'));
  assert.ok(rendered.includes('&lt;script&gt;'));
  assert.ok(rendered.includes('&amp; nombre'));
});


test('training form starts with no event-specific values or selections', () => {
  for (const field of fields) assert.deepEqual(field.default, field.type === 'checkboxes' ? [] : '');
  const rendered = renderApplication(template, initialApplicationValues);
  assert.ok(!rendered.includes('class="selection">X'));
});

test('single and multiple selections are reflected in printed marks', () => {
  const sample = '{{viatico__0}} {{viatico__1}} {{aprendizajes__0}} {{aprendizajes__1}} {{aprendizajes__6}}';
  const rendered = renderApplication(sample, { viatico: '1', aprendizajes: ['0', '6'] });
  assert.deepEqual([...rendered.matchAll(/class="selection">(.*?)<\/span>/g)].map(match => match[1]), [' ', 'X', 'X', ' ', 'X']);
  assert.ok(!renderApplication(sample, { viatico: '', aprendizajes: [] }).includes('>X<'));
});

test('preview uses Arial throughout and preserves emphasis for editable content', () => {
  assert.ok(template.includes('font-family: &quot;Arial&quot;'));
  assert.ok(!template.includes('Times New Roman'));
  assert.ok(!template.includes('Courier New'));
  const families = [...template.matchAll(/font-family: &quot;([^&]+)&quot;/g)].map(match => match[1]);
  assert.ok(families.every(family => family === 'Arial'));
  assert.match(template, /font-size:12(?:\.0)?pt;font-weight:bold;[^>]*>Nombres y apellidos del postulante: \{\{nombre\}\}/);
  assert.ok(template.includes('color:#FFFFFF;'));
  assert.ok(template.includes('@media screen{.page{zoom:var(--preview-scale,1)}}'));
});

test('direct editing exposes fields, clickable options, installments and date', () => {
  const values = createApplicationValues(new Date('2026-11-04T15:00:00Z'));
  const rendered = renderApplication(template, values, { editable: true });
  assert.ok(rendered.includes('contenteditable="plaintext-only"'));
  for (const field of fields) assert.ok(rendered.includes(`data-field="${field.key}"`), field.key);
  assert.ok(rendered.includes('data-field="fechaDocumento" aria-label="Fecha del documento (postulante)" type="date" value="2026-11-04"'));
  assert.ok(rendered.includes('data-print-field="fechaDocumento">04/11/2026</span>'));
  assert.deepEqual(fields.find(field => field.key === 'cuotas').options.map(option => option.value), ['1', '2', '3']);
  assert.ok(rendered.includes('.inline-control{display:none}.print-value{display:inline;'));
  assert.ok(!rendered.includes('Calibri'));
});

test('date starts on the Chilean calendar date and can be edited', () => {
  const values = createApplicationValues(new Date('2026-11-04T01:00:00Z'));
  assert.equal(values.fechaDocumento, '2026-11-03');
  const next = updateApplicationValue(values, 'fechaDocumento', '2026-11-09');
  assert.equal(renderApplication('{{fechaDocumento}}', next), '<span class="value">09/11/2026</span>');
});

test('clicks support multiple activities and mutually exclusive yes/no choices', () => {
  let values = createApplicationValues();
  values = toggleApplicationOption(values, 'tipoActividad', '0');
  values = toggleApplicationOption(values, 'tipoActividad', '4');
  assert.deepEqual(values.tipoActividad, ['0', '4']);
  values = toggleApplicationOption(values, 'tipoActividad', '0');
  assert.deepEqual(values.tipoActividad, ['4']);
  values = toggleApplicationOption(values, 'viatico', '0');
  values = toggleApplicationOption(values, 'viatico', '1');
  assert.equal(values.viatico, '1');
  values = toggleApplicationOption(values, 'viatico', '1');
  assert.equal(values.viatico, '');
});

test('direct text updates synchronize applicant signature without overwriting a custom value', () => {
  let values = updateApplicationValue(createApplicationValues(), 'nombre', 'Nombre de prueba');
  values = updateApplicationValue(values, 'cargo', 'Médico');
  assert.equal(values.firmaNombre, 'Nombre de prueba, Médico');
  values = updateApplicationValue(values, 'firmaNombre', 'Firma personalizada');
  values = updateApplicationValue(values, 'nombre', 'Otro nombre');
  assert.equal(values.firmaNombre, 'Firma personalizada');
  assert.equal(updateApplicationValue(values, 'nombre', 'a'.repeat(1000)).nombre.length, 85);
});
