import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadPage, isPageLoadError } from '../src/lib/loadPage.js';

test('returns a valid page module unchanged', async () => {
  const module = { default: () => null };
  assert.equal(await loadPage(() => Promise.resolve(module)), module);
});

test('preserves original network errors for recovery', async () => {
  const error = new TypeError('Failed to fetch dynamically imported module');
  await assert.rejects(loadPage(() => Promise.reject(error)), e => e === error && isPageLoadError(e));
});

test('a stalled download exits Suspense with an actionable error', async () => {
  await assert.rejects(loadPage(() => new Promise(() => {}), 10), isPageLoadError);
});

test('undefined modules never reach React.lazy', async () => {
  await assert.rejects(loadPage(() => Promise.resolve(undefined)), isPageLoadError);
});

test('programming errors are not mislabeled as network errors', async () => {
  const error = new Error('render failed');
  await assert.rejects(loadPage(() => { throw error; }), e => e === error);
  assert.equal(isPageLoadError(error), false);
});

test('Vite preload failures are not suppressed or automatically reloaded', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /event\.preventDefault\(|reloadOnceForStaleChunk/);
});
