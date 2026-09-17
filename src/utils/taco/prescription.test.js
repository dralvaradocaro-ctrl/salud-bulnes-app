import test from 'node:test';
import assert from 'node:assert/strict';
import { doseOptions, practicalRange, tabletText, controlDates, addDays, prescriptionText } from './prescription.js';

test('10 mg/week reduced 20-30% gives a 7-8 mg range and one option per quarter tablet', () => {
  assert.deepEqual(practicalRange('10', [-30, -20], 'acenocoumarol').range, [7, 8]);
  assert.deepEqual(doseOptions('10', [-30, -20], 'acenocoumarol').map(x => [x.practicalMg, x.tablets, x.deltaMg, x.actualPercent]), [[7, 1.75, -3, -30], [8, 2, -2, -20]]);
});
test('fractional endpoints round to whole mg (quarter tablets), never 11.2', () => {
  assert.deepEqual(practicalRange('14', [-20, -10], 'acenocoumarol').range, [11, 13]);
  assert.deepEqual(practicalRange('14', [-10, -5], 'acenocoumarol').range, [13, 13]);
  assert.deepEqual(practicalRange('20', [10, 20], 'acenocoumarol').range, [22, 24]);
  assert.deepEqual(doseOptions('20', [10, 20], 'acenocoumarol').map(x => x.practicalMg), [22, 23, 24]);
  assert.deepEqual(doseOptions('20', [0, 0], 'acenocoumarol').map(x => [x.practicalMg, x.tablets]), [[20, 5]]);
});
test('a required change never collapses onto the current dose at very low DTS', () => {
  assert.deepEqual(practicalRange('4', [-10, -5], 'acenocoumarol').range, [3, 3]);
  assert.deepEqual(practicalRange('4', [5, 10], 'acenocoumarol').range, [5, 5]);
  assert.deepEqual(practicalRange('1', [-20, -10], 'acenocoumarol').range, [1, 1]);
});
test('4 mg conversion is never applied to warfarin', () => {
  for (const option of doseOptions('14', [-10, -5], 'warfarin')) assert.equal(option.tablets, null);
  assert.deepEqual(doseOptions('14', [-10, -5], 'warfarin').map(x => Number(x.practicalMg.toFixed(2))), [12.6, 12.95, 13.3]);
});
test('tablet fractions are formatted for prescription', () => {
  assert.equal(tabletText(0.25), '¼'); assert.equal(tabletText(3.25), '3 ¼'); assert.equal(tabletText(4.5), '4 ½'); assert.equal(tabletText(4.75), '4 ¾'); assert.equal(tabletText(4), '4');
});
test('control dates across months, leap days and DST', () => {
  assert.equal(controlDates('2026-09-16', [7, 14]), '23/09/2026–30/09/2026');
  assert.equal(controlDates('2026-12-30', [3, 3]), '02/01/2027');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2026-09-05', 2), '2026-09-07');
  assert.equal(addDays('2026-02-30', 1), null); assert.equal(addDays('', 1), null);
});
test('prescription contains exact mg, tablet equivalents, suspension and next control', () => {
  const option = doseOptions('20', [-20, -10], 'acenocoumarol')[1];
  const rx = prescriptionText({ drug: 'acenocoumarol', option, hold: 24, controlDate: '2026-09-23' });
  for (const text of ['17 mg/semana', '4 ¼ comprimidos de 4 mg/semana', 'Suspender 24 horas', '23/09/2026', 'distribuir según pauta diaria']) assert.ok(rx.includes(text));
  assert.equal(prescriptionText({ drug: 'acenocoumarol', option, controlDate: null }), '');
});
