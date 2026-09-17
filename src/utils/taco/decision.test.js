import test from 'node:test';
import assert from 'node:assert/strict';
import { decideTaco, numberInput } from './decision.js';
const base = { inr: '2.5', previous: '', weekly: '20', trt: '', count: '', bleeding: 'no', drug: 'acenocoumarol', target: '2-3', phase: 'maintenance' };
const run = changes => decideTaco({ ...base, ...changes });
for (const [inr, dose, days, hold] of [
  ['1.4', [22, 24], [10, 14], null], ['1.5', [21, 22], [14, 21], null],
  ['1.9', [21, 22], [14, 21], null], ['2', [20, 20], [30, 30], null],
  ['3', [20, 20], [30, 30], null], ['3.1', [18, 19], [14, 21], null],
  ['3.5', [18, 19], [14, 21], null], ['3.6', [16, 18], [7, 14], 24],
  ['4.5', [16, 18], [7, 14], 24], ['4.51', [10, 15], [3, 5], 48],
  ['5.49', [10, 15], [3, 5], 48],
]) test(`INR ${inr}: dose, control and suspension`, () => {
  const result = run({ inr }); assert.deepEqual(result.dose, dose); assert.deepEqual(result.days, days); assert.equal(result.hold, hold);
});
test('high INR suspends 72 h and reuses the adjacent 25-50% reduction with control at 3-5 days', () => {
  for (const inr of ['5.5', '7.99']) { const r = run({ inr }); assert.equal(r.hold, 72); assert.deepEqual(r.dose, [10, 15]); assert.deepEqual(r.days, [3, 5]); assert.ok(r.notes.some(n => n.includes('72 h'))); }
});
test('bleeding at any INR and INR >= 8 override missing data and contraindicated scope', () => {
  for (const data of [{ inr: '1', bleeding: 'yes' }, { inr: '', bleeding: 'yes' }, { inr: '8' }, { inr: '15' }]) {
    const r = run({ weekly: '', target: 'other', ...data }); assert.equal(r.urgent, true); assert.equal(r.dose, null);
  }
});
test('stable INR extension and TRT strict cutoffs', () => {
  assert.deepEqual(run({ count: '3' }).days, [45, 45]);
  assert.deepEqual(run({ count: '4', trt: '90' }).days, [45, 45]);
  assert.deepEqual(run({ trt: '90.1' }).days, [60, 60]);
  assert.deepEqual(run({ inr: '1.4', trt: '95' }).days, [10, 14]);
  for (const data of [{ trt: '59' }, { adherence: true }, { interactions: true }]) assert.deepEqual(run({ count: '4', ...data }).days, [30, 30]);
});
test('QF referral thresholds', () => {
  assert.ok(run({ trt: '59.9' }).notes.some(n => n.includes('Derivar a QF')));
  assert.ok(!run({ trt: '60' }).notes.some(n => n.includes('Derivar a QF')));
  assert.ok(run({ inr: '1.8', count: '3' }).notes.some(n => n.includes('Derivar a QF')));
});
test('outside scope returns no automatic dose', () => {
  for (const data of [{ target: 'other' }, { drug: 'other' }, { phase: 'initial' }, { special: true }]) assert.equal(run(data).dose, null);
});
test('invalid and missing inputs do not produce recommendations', () => {
  for (const data of [{ inr: '' }, { inr: '-1' }, { inr: 'Infinity' }, { weekly: '0' }, { weekly: '' }, { previous: '0' }, { trt: '101' }, { count: '2.5' }, { bleeding: '' }]) assert.ok(run(data).errors);
  assert.equal(numberInput('2,5'), 2.5); assert.equal(numberInput(''), null);
});
test('previous INR shows trend without choosing dose endpoint', () => {
  const r = run({ inr: '3.2', previous: '2.1' }); assert.deepEqual(r.dose, [18, 19]); assert.ok(r.notes.some(n => n.includes('ascendente')));
  assert.ok(run({ previous: '1.8', count: '3' }).errors);
});
test('uncovered two-decimal gaps require interpretation, not silent rounding', () => {
  for (const inr of ['1.95', '3.05', '3.55']) { assert.equal(run({ inr }).dose, null); assert.equal(run({ inr }).days, null); }
});
