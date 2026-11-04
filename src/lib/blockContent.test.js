import test from 'node:test';
import assert from 'node:assert/strict';
import { toSentenceCase, stripStepPrefix, parseKeyValue, groupBySeparators, blockSize, packRows, summarizeBlocks, readKeyFacts, leadingCode, listCarriesCodes, isDocumentInfoBlock } from './blockContent.js';

test('uppercase separator titles become sentence case, keeping acronyms', () => {
  assert.equal(toSentenceCase('VÍA ORAL (paciente cooperador)'), 'Vía oral (paciente cooperador)');
  assert.equal(toSentenceCase('DOSIS DIARIA MÁXIMA HALOPERIDOL'), 'Dosis diaria máxima haloperidol');
  assert.equal(toSentenceCase('VÍA INTRAMUSCULAR (no cooperador o sin VO)'), 'Vía intramuscular (no cooperador o sin VO)');
  assert.equal(toSentenceCase('ESCALA RASS EN HCSFB'), 'Escala RASS en HCSFB');
  assert.equal(toSentenceCase('Ya en frase'), 'Ya en frase');
  assert.equal(toSentenceCase('ALERTA Y CALMADO'), 'Alerta y calmado');
  assert.equal(toSentenceCase('TITULACIÓN A LARGO PLAZO'), 'Titulación a largo plazo');
});

test('scale items that carry their own score are detected and not numbered again', () => {
  assert.deepEqual(leadingCode('+4 Combativo: ajuste hacia arriba'), { code: '+4', rest: 'Combativo: ajuste hacia arriba' });
  assert.deepEqual(leadingCode('-1 a -3: estimulación verbal'), { code: '-1 a -3', rest: 'estimulación verbal' });
  assert.deepEqual(leadingCode('0 Alerta y calmado'), { code: '0', rest: 'Alerta y calmado' });
  assert.equal(leadingCode('0.5 mg de haloperidol'), null);
  assert.equal(leadingCode('1 a 2 horas'), null);
  assert.equal(listCarriesCodes(['+4 Combativo', '+3 Muy agitado', '0 Calmado', '-1 a -3: verbal']), true);
  assert.equal(listCarriesCodes(['Personal identifica', 'Aplica CAM', '+1 algo']), false);
  assert.equal(listCarriesCodes(['+4 solo']), false);
});

test('step numbers already in the text are removed once', () => {
  assert.equal(stripStepPrefix('1. Personal en sala identifica conducta'), 'Personal en sala identifica conducta');
  assert.equal(stripStepPrefix('12) Revisar'), 'Revisar');
  assert.equal(stripStepPrefix('+4 Combativo'), '+4 Combativo');
  assert.equal(stripStepPrefix('0.5 mg de haloperidol'), '0.5 mg de haloperidol');
});

test('key-value lines are detected without catching doses or clock times', () => {
  assert.deepEqual(parseKeyValue('Dosis: 5 a 10 gotas VO'), { key: 'Dosis', value: '5 a 10 gotas VO' });
  assert.deepEqual(parseKeyValue('Inicio de efecto: 1 a 2 horas'), { key: 'Inicio de efecto', value: '1 a 2 horas' });
  assert.equal(parseKeyValue('Haloperidol 5 mg/mL: 1 mg IM'), null);
  assert.equal(parseKeyValue('Control a las 10:30 horas'), null);
  assert.equal(parseKeyValue('Si el paciente persiste agitado y sin respuesta: derivar'), null);
});

test('separators split lists into titled groups and empty lines disappear', () => {
  const groups = groupBySeparators(['1. Paso uno', '', '━━━ PRINCIPIOS ━━━', 'Iniciar simple', 'Esperar']);
  assert.deepEqual(groups, [
    { title: null, items: ['1. Paso uno'] },
    { title: 'Principios', items: ['Iniciar simple', 'Esperar'] },
  ]);
  assert.deepEqual(groupBySeparators(['a', 'b']), [{ title: null, items: ['a', 'b'] }]);
  assert.deepEqual(groupBySeparators([]), []);
});

test('rows always add up to 12 columns', () => {
  assert.deepEqual(packRows(['wide', 'narrow']), [8, 4]);
  assert.deepEqual(packRows(['narrow', 'wide']), [4, 8]);
  assert.deepEqual(packRows(['narrow', 'narrow', 'narrow']), [6, 6, 12]);
  assert.deepEqual(packRows(['narrow', 'narrow', 'wide']), [6, 6, 12]);
  assert.deepEqual(packRows(['narrow', 'narrow', 'narrow', 'narrow']), [6, 6, 6, 6]);
  assert.deepEqual(packRows(['wide', 'wide']), [12, 12]);
  assert.deepEqual(packRows(['full', 'narrow']), [12, 12]);
  assert.deepEqual(packRows(['narrow']), [12]);
  assert.deepEqual(packRows([]), []);
});

test('block size follows type and length', () => {
  assert.equal(blockSize({ type: 'mermaid' }), 'full');
  assert.equal(blockSize({ type: 'hyponatremia_correction_calculator' }), 'full');
  assert.equal(blockSize({ type: 'criteria', items: ['a', 'b'] }), 'narrow');
  assert.equal(blockSize({ type: 'flowchart', details: ['1', '2', '3', '4', '5', '6', '7', '8'] }), 'wide');
  assert.equal(blockSize({ type: 'text', layout_position: 'full', content: 'x' }), 'full');
});

test('tab summaries name what the tab holds', () => {
  assert.equal(summarizeBlocks([{ type: 'flowchart' }, { type: 'criteria' }, { type: 'criteria' }, { type: 'reference' }]), 'Flujo, criterios y referencias');
  assert.equal(summarizeBlocks([{ type: 'mermaid' }]), 'Diagrama');
  assert.equal(summarizeBlocks([{ type: 'fiqr_calculator' }, { type: 'text' }]), 'Calculadora y texto');
  assert.equal(summarizeBlocks([]), '');
});

test('administrative document blocks are recognized, operative ones are not', () => {
  assert.equal(isDocumentInfoBlock({ type: 'text', title: 'Documento base HCSFB 130' }), true);
  assert.equal(isDocumentInfoBlock({ type: 'text', title: 'Objetivo y alcance' }), true);
  assert.equal(isDocumentInfoBlock({ type: 'criteria', title: 'Propósito y alcance' }), true);
  assert.equal(isDocumentInfoBlock({ type: 'text', title: 'Alcance del ordinario' }), true);
  assert.equal(isDocumentInfoBlock({ type: 'text', title: 'Objetivo, alcance y activación' }), false);
  assert.equal(isDocumentInfoBlock({ type: 'flowchart', title: 'Alcance y proceso general' }), false);
  assert.equal(isDocumentInfoBlock({ type: 'text', title: 'Población objetivo' }), false);
  assert.equal(isDocumentInfoBlock({ type: 'criteria', title: 'Algoritmo ESI — 4 preguntas con criterios objetivos' }), false);
  assert.equal(isDocumentInfoBlock(null), false);
});

test('key facts come from the key_facts block, at most four, empty values dropped', () => {
  const blocks = [{ type: 'text' }, { type: 'key_facts', facts: [
    { label: 'Evaluar con', value: 'Escala RASS', tone: 'amber' },
    { label: 'Vacío', value: '  ' },
    { label: 'B', value: '2', tone: 'violeta' },
    { value: '3' }, { value: '4' }, { value: '5' },
  ] }];
  const facts = readKeyFacts(blocks);
  assert.equal(facts.length, 4);
  assert.deepEqual(facts[0], { label: 'Evaluar con', value: 'Escala RASS', note: '', tone: 'amber' });
  assert.equal(facts[1].tone, 'neutral');
  assert.deepEqual(readKeyFacts([{ type: 'text' }]), []);
});
