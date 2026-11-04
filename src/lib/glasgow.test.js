import test from 'node:test';
import assert from 'node:assert/strict';
import { GCS_NORMAL, clampGcsValue, gcsTotal, gcsSeverity, isAdultTbiTopic } from './glasgow.js';

test('normal Glasgow adds up to 15 and the minimum to 3', () => {
  assert.equal(gcsTotal(GCS_NORMAL), 15);
  assert.equal(gcsTotal({ ocular: 1, verbal: 1, motora: 1 }), 3);
  assert.equal(gcsTotal({ ocular: 3, verbal: 4, motora: 6 }), 13);
});

test('values are clamped to each component range', () => {
  assert.equal(clampGcsValue('ocular', 9), 4);
  assert.equal(clampGcsValue('motora', 0), 1);
  assert.equal(clampGcsValue('verbal', 'x'), 1);
  assert.equal(clampGcsValue('otra', 3), null);
  assert.equal(gcsTotal({ ocular: 10, verbal: 10, motora: 10 }), 15);
});

test('severity bands follow 13-15 / 9-12 / 3-8 at their edges', () => {
  assert.equal(gcsSeverity(15).id, 'leve');
  assert.equal(gcsSeverity(13).id, 'leve');
  assert.equal(gcsSeverity(12).id, 'moderado');
  assert.equal(gcsSeverity(9).id, 'moderado');
  assert.equal(gcsSeverity(8).id, 'grave');
  assert.equal(gcsSeverity(3).id, 'grave');
});

test('calculator only appears on adult TBI protocols', () => {
  assert.equal(isAdultTbiTopic({ name: 'Manejo del Traumatismo Craneoencefálico del Adulto en Urgencias' }), true);
  assert.equal(isAdultTbiTopic({ name: 'TEC leve en adultos' }), true);
  assert.equal(isAdultTbiTopic({ name: 'Traumatismo craneoencefálico pediátrico' }), false);
  assert.equal(isAdultTbiTopic({ name: 'Reanimación Cardiopulmonar Avanzada en Adultos' }), false);
  assert.equal(isAdultTbiTopic({ name: 'Tecnología de apoyo' }), false);
  assert.equal(isAdultTbiTopic(null), false);
});
