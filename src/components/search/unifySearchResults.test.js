import test from 'node:test';
import assert from 'node:assert/strict';
import { unifySearchResults, limitSearchResults } from './unifySearchResults.js';

const calculators = [{ id: 'grace', name: 'GRACE — Riesgo en síndrome coronario agudo' }, { id: 'heart', name: 'HEART' }];
const resolve = tool => tool.calculator_id || ({ legacyGrace: 'grace', legacyHeart: 'heart' })[tool.id];
const unify = results => unifySearchResults(results, calculators, resolve);

test('unifica fichas antiguas y calculadoras sin importar el orden', () => {
  const tool = { id: 'legacyGrace', name: 'Score GRACE', type: 'tool' };
  const calculator = { ...calculators[0], type: 'calculator' };
  assert.deepEqual(unify([tool, calculator]), [calculator]);
  assert.deepEqual(unify([calculator, tool]), [calculator]);
  assert.deepEqual(unify([tool]), [calculator]); // searching an old alias still opens the actual calculator
});

test('usa vínculos explícitos e internos sin eliminar herramientas desconocidas', () => {
  const unknown = { id: 'unknown', type: 'tool', calculator_id: 'missing' };
  assert.deepEqual(unify([
    { id: 'new', type: 'tool', calculator_id: 'heart' },
    { id: 'url', type: 'tool', reference_url: '/AllCalculators?calc=heart' },
    unknown,
  ]), [{ ...calculators[1], type: 'calculator' }, unknown]);
});

test('no confunde un protocolo con la calculadora que menciona', () => {
  const topic = { id: 'protocol', type: 'topic', name: 'Uso de GRACE en síndrome coronario agudo' };
  assert.equal(unify([topic, { id: 'legacyGrace', type: 'tool' }]).length, 2);
});

test('unifica páginas y sugerencias IA repetidas antes del límite', () => {
  const page = { id: 'one', type: 'page', page: 'RecetaMedica' };
  assert.deepEqual(unify([page, { ...page, id: 'two' }]), [page]);
  const ai = { ...calculators[0], type: 'calculator', aiReason: 'Riesgo coronario' };
  assert.deepEqual(unify([ai, ai]), [ai]);
  const topics = Array.from({ length: 7 }, (_, i) => ({ id: String(i), type: 'topic' }));
  assert.equal(limitSearchResults(unify([topics[0], topics[0], ...topics])).length, 5);
});

test('unifica nombres antiguos con ID migrado sin coincidencias vagas', () => {
  assert.equal(unify([{ id: 'migrated', name: 'Score GRACE', type: 'tool' }, { ...calculators[0], type: 'calculator' }]).length, 1);
  assert.equal(unify([{ id: 'different', name: 'GRACE 2.0', type: 'tool' }, { ...calculators[0], type: 'calculator' }]).length, 2);
});
