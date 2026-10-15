import test from 'node:test';
import assert from 'node:assert/strict';
import { renalEstimates, glasgowBlatchford, alvarado, centorMcIsaac, bishop, ALVARADO_WEIGHTS } from './triage.js';
const renal = { age: '60', creatinine: '1', sex: 'male', weight: '72', unit: 'mgdl', stable: 'yes' };
test('renal estimates match known independent values, units and sex adjustment', () => {
  assert.equal(renalEstimates(renal).clearance, 80);
  assert.equal(renalEstimates({ ...renal, sex: 'female' }).clearance, 68);
  assert.equal(renalEstimates(renal).egfr, 86);
  assert.deepEqual(renalEstimates({ ...renal, creatinine: '88,4', unit: 'umol' }), renalEstimates(renal));
});
test('renal inputs reject negatives, missing data, minors and unstable creatinine', () => {
  for (const changes of [{ age: '17' }, { age: '' }, { creatinine: '-1' }, { creatinine: 'abc1' }, { weight: '0' }, { sex: '' }, { stable: 'no' }]) assert.equal(renalEstimates({ ...renal, ...changes }), null);
});
const gbs = { urea: '5', unit: 'urea-mmol', hb: '14', sex: 'male', sbp: '120', pulse: '80', melena: '0', syncope: '0', liver: '0', heart: '0' };
test('GBS zero and maximum', () => {
  assert.equal(glasgowBlatchford(gbs), 0);
  assert.equal(glasgowBlatchford({ ...gbs, urea: '25', hb: '9', sbp: '80', pulse: '100', melena: '1', syncope: '1', liver: '1', heart: '1' }), 23);
});
test('GBS urea thresholds including 25 mmol/L', () => {
  for (const [urea, score] of [['6.49',0],['6.5',2],['7.99',2],['8',3],['9.99',3],['10',4],['24.99',4],['25',6]]) assert.equal(glasgowBlatchford({ ...gbs, urea }), score);
});
test('GBS hemoglobin sex-specific boundaries', () => {
  for (const [hb, score] of [['9.99',6],['10',3],['11.99',3],['12',1],['12.99',1],['13',0]]) assert.equal(glasgowBlatchford({ ...gbs, hb }), score);
  assert.equal(glasgowBlatchford({ ...gbs, sex: 'female', hb: '10' }), 1);
  assert.equal(glasgowBlatchford({ ...gbs, sex: 'female', hb: '12' }), 0);
});
test('GBS units, pressure and missing clinical inputs', () => {
  assert.equal(glasgowBlatchford({ ...gbs, urea: '70', unit: 'urea-mg' }), 4);
  assert.equal(glasgowBlatchford({ ...gbs, urea: '30', unit: 'bun-mg' }), 4);
  for (const [sbp, score] of [['89',3],['90',2],['99',2],['100',1],['109',1],['110',0]]) assert.equal(glasgowBlatchford({ ...gbs, sbp }), score);
  assert.equal(glasgowBlatchford({ ...gbs, hb: '' }), null);
  assert.equal(glasgowBlatchford({ ...gbs, syncope: '' }), null);
});
test('Alvarado weighting and complete input requirement', () => {
  assert.equal(alvarado({}), null);
  const none = Object.fromEntries(Object.keys(ALVARADO_WEIGHTS).map(key => [key,'0']));
  assert.equal(alvarado(none), 0);
  assert.equal(alvarado({ ...none, tenderness:'1', leukocytes:'1' }), 4);
  assert.equal(alvarado(Object.fromEntries(Object.keys(none).map(key=>[key,'1']))), 10);
});
test('McIsaac age boundaries and full range', () => {
  const data = { age:'14', fever:'0', noCough:'0', nodes:'0', tonsils:'0' };
  for (const [age, score] of [['3',1],['14',1],['15',0],['44',0],['45',-1]]) assert.equal(centorMcIsaac({...data,age}).mcisaac,score);
  assert.equal(centorMcIsaac({...data,age:'2'}),null);
  assert.equal(centorMcIsaac({...data,fever:'1',noCough:'1',nodes:'1',tonsils:'1'}).mcisaac,5);
});
test('Bishop original range and category validation', () => {
  assert.equal(bishop({}),null);
  assert.equal(bishop({dilation:'0',effacement:'0',station:'0',consistency:'0',position:'0'}),0);
  assert.equal(bishop({dilation:'3',effacement:'3',station:'3',consistency:'2',position:'2'}),13);
  assert.equal(bishop({dilation:'3',effacement:'3',station:'3',consistency:'3',position:'2'}),null);
});
