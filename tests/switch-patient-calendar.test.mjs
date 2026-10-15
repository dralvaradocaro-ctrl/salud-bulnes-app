import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
const bundled = await build({ entryPoints: ['src/components/calculators/SwitchPatientCalendar.jsx'], bundle: true, write: false, platform: 'node', format: 'esm', external: ['react'], jsx: 'transform' });
// Resolve React from the project while importing the transformed JSX in memory.
const code = bundled.outputFiles[0].text.replace(/from "(react(?:\/jsx-runtime)?)"/g, (_, name) => `from ${JSON.stringify(import.meta.resolve(name))}`);
const { default: Calendar, calendarEvents, calendarMonths, tabletQuantity } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const { buildSwitchPlan, DRUG_KEYS } = await import('../src/components/calculators/antidepressantSwitchEngine.js');
test('whole, half, quarters and unsupported fractions', () => {
  assert.match(tabletQuantity(25, 100, true).label, /un cuarto/);
  assert.match(tabletQuantity(50, 100, true).label, /medio/);
  assert.match(tabletQuantity(100, 100, false).label, /entero/);
  assert.match(tabletQuantity(175, 100, true).label, /1 comprimido entero.*tres cuartos/);
  assert.equal(tabletQuantity(25, 100, false), null);
  assert.equal(tabletQuantity(30, 100, true), null);
  assert.equal(tabletQuantity(25, 0, true), null);
});
test('every washout keeps the full required number of medication-free days', () => {
  for (const from of DRUG_KEYS) for (const to of DRUG_KEYS) {
    const plan = buildSwitchPlan(from, to, 100);
    if (!plan?.washoutDias) continue;
    const { events, stopDay } = calendarEvents(plan);
    assert.equal(Math.min(...events.filter((e) => e.side === 'to').map((e) => e.day)), stopDay + plan.washoutDias, `${from} → ${to}`);
  }
});
test('long washout, overlap, and delayed start boundaries', () => {
  assert.equal(calendarEvents(buildSwitchPlan('fluoxetina', 'moclobemida', 20)).events.at(-1).day, 36);
  assert.equal(calendarEvents(buildSwitchPlan('sertralina', 'escitalopram', 100)).events.find((e) => e.side === 'to').day, 1);
  assert.equal(calendarEvents(buildSwitchPlan('fluoxetina', 'sertralina', 20)).events.find((e) => e.side === 'to').day, 5);
});
test('fractional milligrams are preserved', () => {
  const plan = buildSwitchPlan('sertralina', 'venlafaxina', 75);
  assert.match(plan.stopSteps[0].accion, /37,5 mg/);
  assert.match(plan.startSteps[0].accion, /37,5 mg/);
});

test('patient sheet renders dates, fractions and explicit washout instructions', () => {
  const settings = { date: '2026-10-02', from: { strength: 100, split: true }, to: { strength: 25, split: true } };
  const html = renderToStaticMarkup(React.createElement(Calendar, { plan: buildSwitchPlan('sertralina', 'clomipramina', 100), settings }));
  assert.match(html, /1\/4 comp/);
  assert.match(html, /1\/2 comp/);
  assert.match(html, /LAVADO · SIN TOMAS/);
  assert.match(html, /14-10-2026/);
  assert.match(html, /<svg/);
});


test('capsule concentration accepts decimal comma and prints whole capsules', () => {
  const settings = { date: '', from: { strength: '10', split: true }, to: { strength: '37,5', split: false } };
  const html = renderToStaticMarkup(React.createElement(Calendar, { plan: buildSwitchPlan('escitalopram', 'venlafaxina', 10), settings }));
  assert.match(html, /37,5 mg por cápsula/);
  assert.match(html, /1 cáps/);
  assert.match(html, /2 cáps/);
});
test('capsules never become half capsules even if stale split configuration is true', () => {
  const settings = { date: '', from: { strength: '10', split: true }, to: { strength: '75 mg', split: true } };
  const html = renderToStaticMarkup(React.createElement(Calendar, { plan: buildSwitchPlan('escitalopram', 'venlafaxina', 10), settings }));
  assert.match(html, /75 mg por cápsula/);
  assert.match(html, /Confirmar presentación/);
  assert.doesNotMatch(html, /(?:medio|cuarto)\) (?:de )?cápsula/);
});


test('tear-off calendar includes every day, dated across month boundaries', () => {
  const settings = { date: '2026-10-28', from: { strength: '50', split: true }, to: { strength: '10', split: true } };
  const html = renderToStaticMarkup(React.createElement(Calendar, { plan: buildSwitchPlan('sertralina', 'escitalopram', 50), settings }));
  const days = [...html.matchAll(/data-calendar-day="(\d+)"/g)].map((m) => Number(m[1]));
  assert.equal(days.length, 15);
  assert.deepEqual(days, Array.from({ length: 15 }, (_, i) => i + 1));
  assert.match(html, /Día 5 · 01-11-2026/);
  assert.equal((html.match(/TRASLAPE ·/g) || []).length, 7);
});
test('long washout has one daily card per medication-free day and an explicit start afterward', () => {
  const settings = { date: '2026-10-02', from: { strength: '20', split: false }, to: { strength: '150', split: false } };
  const html = renderToStaticMarkup(React.createElement(Calendar, { plan: buildSwitchPlan('fluoxetina', 'moclobemida', 20), settings }));
  assert.equal((html.match(/LAVADO · SIN TOMAS/g) || []).length, 35);
  assert.match(html, /Día 35 de 35 de lavado/);
  assert.match(html, /data-calendar-day="36"/);
  assert.match(html, /Día 36 · 06-11-2026/);
});

 test('suspension is shown once and subsequent days omit the stopped drug', () => {
  const settings = { date: '2026-10-02', from: { strength: 100, split: true }, to: { strength: 10, split: true } };
  const html = renderToStaticMarkup(React.createElement(Calendar, { plan: buildSwitchPlan('sertralina', 'escitalopram', 100), settings }));
  assert.equal((html.match(/<strong>Suspender<\/strong>/g) || []).length, 1);
  assert.match(html, /1\/2 comp/);
  assert.match(html, /<svg/);
  assert.doesNotMatch(html, /Suspendido · no tomar|Reducir a 50%/);
});

test('only weeks involved in the change are displayed, with blank outside dates', () => {
  const months = calendarMonths('2026-10-28', 8);
  assert.equal(months.length, 2);
  assert.equal(months[0].weeks.length, 1);
  assert.equal(months[1].weeks.length, 2);
  const cells = months.flatMap((month) => month.weeks.flat());
  assert.equal(cells.filter((cell) => cell.day).length, 8);
  assert.ok(cells.filter((cell) => !cell.day).every((cell) => cell.date === null));
  assert.equal(cells.find((cell) => cell.day === 5).date.getDate(), 1);
});
test('long washout ends on the final scheduled change without extra days', () => {
  const plan = buildSwitchPlan('fluoxetina', 'moclobemida', 20);
  const html = renderToStaticMarkup(React.createElement(Calendar, { plan, settings: { date: '2026-10-02' } }));
  const days = [...html.matchAll(/data-calendar-day="(\d+)"/g)].map((m) => Number(m[1]));
  assert.equal(days.at(-1), Math.max(...calendarEvents(plan).events.map((event) => event.day)));
});
