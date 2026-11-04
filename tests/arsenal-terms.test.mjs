import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildArsenalIndex, findArsenalTerms } from '../src/lib/arsenalTerms.js';

const meds = [
  { active_ingredient: 'Heparina sódica', presentation: 'Solución inyectable', dose_value: 5000, dose_unit: 'UI/mL' },
  { active_ingredient: 'Amoxicilina', presentation: 'Comprimido', dose_value: 500, dose_unit: 'mg' },
  { active_ingredient: 'Amoxicilina + Ácido clavulánico', presentation: 'Comprimido', dose_value: 625, dose_unit: 'mg' },
  { active_ingredient: 'Ácido acetilsalicílico', presentation: 'Comprimido', dose_value: 100, dose_unit: 'mg' },
];
const index = buildArsenalIndex(meds);
const words = text => findArsenalTerms(index, text).map(m => text.slice(m.start, m.end));

test('matches ingredients ignoring case and accents, keeping original positions', () => {
  assert.deepEqual(words('Dar AMOXICILINA y acido acetilsalicílico.'), ['AMOXICILINA', 'acido acetilsalicílico']);
});
test('distinctive first word matches, generic ones and partial words do not', () => {
  assert.deepEqual(words('Heparina 5000 UI; ácido fólico; amoxicilinas'), ['Heparina']);
});
test('an ingredient lists every presentation that contains it', () => {
  assert.deepEqual([...index.groups.get('amoxicilina').items.keys()], ['Amoxicilina', 'Amoxicilina + Ácido clavulánico']);
});
