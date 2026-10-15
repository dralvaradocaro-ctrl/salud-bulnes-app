import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchDrugs, findDrugByName, normalizeDrugText } from '../src/lib/lactationSearch.js';

const { drugs, meta } = JSON.parse(readFileSync(new URL('../src/data/lactationDrugs.json', import.meta.url), 'utf8'));

test('every drug has a valid e-lactancia level, summary and source link', () => {
  assert.equal(meta.count, drugs.length);
  for (const drug of drugs) {
    assert.ok([0, 1, 2, 3].includes(drug.level), drug.name);
    assert.ok(drug.what, `${drug.name} sin descripción`);
    assert.ok(drug.points.length > 0, `${drug.name} sin puntos clave`);
    assert.match(drug.url, /^https:\/\/www\.e-lactancia\.org\/breastfeeding\//, drug.name);
  }
  assert.equal(new Set(drugs.map(d => d.id)).size, drugs.length, 'ids duplicados');
});

test('search ignores accents and finds synonyms', () => {
  assert.equal(normalizeDrugText('Ácido Valproico'), 'acido valproico');
  assert.equal(searchDrugs(drugs, 'dipirona')[0].name, 'Metamizol');
  assert.equal(searchDrugs(drugs, 'ondansetron')[0].name, 'Ondansetrón');
  assert.equal(searchDrugs(drugs, 'buscapina')[0].name, 'Butilbromuro de hioscina');
  assert.deepEqual(searchDrugs(drugs, 'zzzz'), []);
});

test('level filter only returns that level', () => {
  const incompatible = searchDrugs(drugs, '', 3);
  assert.ok(incompatible.length > 0);
  assert.ok(incompatible.every(d => d.level === 3));
});

test('key classifications match e-lactancia', () => {
  const level = name => drugs.find(d => d.name === name)?.level;
  assert.equal(level('Ibuprofeno'), 0);
  assert.equal(level('Paracetamol'), 0);
  assert.equal(level('Metamizol'), 2);
  assert.equal(level('Amiodarona'), 2);
  assert.equal(level('Ácido acetilsalicílico (antiagregante, ≤ 300 mg/día)'), 0);
  assert.equal(level('Ácido acetilsalicílico (analgésico, > 300 mg/día)'), 1);
});

test('alternatives resolve to listed drugs without jumping between variants', () => {
  assert.equal(findDrugByName(drugs, 'Sertralina hidrocloruro')?.name, 'Sertralina');
  assert.equal(findDrugByName(drugs, 'Metotrexato'), null);
  assert.equal(findDrugByName(drugs, 'Triamcinolona (uso tópico)', 0), null);
});
