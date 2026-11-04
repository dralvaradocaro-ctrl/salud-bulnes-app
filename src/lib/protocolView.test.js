import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProtocolView } from './protocolView.js';

test('classic view stays the default until someone opts in', () => {
  assert.equal(resolveProtocolView('', null), 'clasica');
  assert.equal(resolveProtocolView('?id=abc', 'otra'), 'clasica');
});

test('the URL wins over the stored preference', () => {
  assert.equal(resolveProtocolView('?id=abc&vista=modular', 'clasica'), 'modular');
  assert.equal(resolveProtocolView('?vista=clasica', 'modular'), 'clasica');
  assert.equal(resolveProtocolView('?vista=rara', 'modular'), 'modular');
});
