import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDays, safeResourceUrl } from './resources.js';

test('el calendario usa lunes como primer día y conserva febrero bisiesto', () => {
  const days = calendarDays(2024, 1);
  assert.deepEqual(days.slice(0, 4), [null, null, null, '2024-02-01']);
  assert.equal(days.at(-1), '2024-02-29');
  assert.equal(calendarDays(2025, 1).at(-1), '2025-02-28');
});
test('meses que empiezan en domingo y lunes se alinean correctamente', () => {
  assert.equal(calendarDays(2026, 2).indexOf('2026-03-01'), 6);
  assert.equal(calendarDays(2026, 5)[0], '2026-06-01');
  assert.equal(calendarDays(2026, 11).at(-1), '2026-12-31');
});
test('los enlaces de documentos y nóminas admiten HTTPS y rechazan código', () => {
  assert.equal(safeResourceUrl('https://example.org/lista?grupo=dm2'), 'https://example.org/lista?grupo=dm2');
  for (const url of ['javascript:alert(1)', 'data:text/html,test', '//example.org', 'http://example.org', '', '/ruta']) assert.equal(safeResourceUrl(url), null);
});
