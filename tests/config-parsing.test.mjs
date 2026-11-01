import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCore } from './helpers/load-core.mjs';

const C = loadCore();

test('normalizeBaseUrl: already-correct URL is unchanged', () => {
  assert.equal(C.normalizeBaseUrl('http://localhost:11434/v1'), 'http://localhost:11434/v1');
});

test('normalizeBaseUrl: bare Ollama host gets scheme and /v1', () => {
  assert.equal(C.normalizeBaseUrl('localhost:11434'), 'http://localhost:11434/v1');
});

test('normalizeBaseUrl: scheme added, trailing slash removed, /v1 appended', () => {
  assert.equal(C.normalizeBaseUrl('http://localhost:11434/'), 'http://localhost:11434/v1');
  assert.equal(C.normalizeBaseUrl('http://localhost:11434'), 'http://localhost:11434/v1');
  assert.equal(C.normalizeBaseUrl('https://api.example.com//'), 'https://api.example.com/v1');
});

test('normalizeBaseUrl: explicit deeper paths are left alone', () => {
  assert.equal(
    C.normalizeBaseUrl('https://api.example.com/openai/v1/'),
    'https://api.example.com/openai/v1'
  );
});

test('normalizeBaseUrl: whitespace and empties', () => {
  assert.equal(C.normalizeBaseUrl('  http://localhost:11434/v1  '), 'http://localhost:11434/v1');
  assert.equal(C.normalizeBaseUrl(''), '');
  assert.equal(C.normalizeBaseUrl(null), '');
});

test('parseConfig: no input yields sane defaults with no warnings', () => {
  const { config, warnings } = C.parseConfig('');
  assert.deepEqual(config, {
    baseUrl: 'http://localhost:11434/v1',
    model: '',
    temperature: 0.7,
    systemPrompt: ''
  });
  assert.deepEqual(warnings, []);
});

test('parseConfig: valid saved settings round-trip', () => {
  const saved = JSON.stringify({
    baseUrl: 'http://localhost:1234',
    model: 'llama3.2',
    temperature: 0.2,
    systemPrompt: 'Be concise.'
  });
  const { config, warnings } = C.parseConfig(saved);
  assert.equal(config.baseUrl, 'http://localhost:1234/v1');
  assert.equal(config.model, 'llama3.2');
  assert.equal(config.temperature, 0.2);
  assert.equal(config.systemPrompt, 'Be concise.');
  assert.deepEqual(warnings, []);
});

test('parseConfig: invalid JSON falls back to defaults with a warning', () => {
  const { config, warnings } = C.parseConfig('{oops');
  assert.equal(config.baseUrl, 'http://localhost:11434/v1');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /not valid JSON/);
});

test('parseConfig: temperature clamped into [0, 2]', () => {
  assert.equal(C.parseConfig('{"temperature": 5}').config.temperature, 2);
  assert.equal(C.parseConfig('{"temperature": -3}').config.temperature, 0);
});

test('parseConfig: bad temperature warns and keeps 0.7', () => {
  const { config, warnings } = C.parseConfig('{"temperature": "hot"}');
  assert.equal(config.temperature, 0.7);
  assert.match(warnings.join(' '), /temperature/);
});

test('parseConfig: wrong field types are ignored with warnings, not crashes', () => {
  const { config, warnings } = C.parseConfig(
    '{"model": 7, "systemPrompt": true, "temperature": {"x":1}}'
  );
  assert.equal(config.model, '');
  assert.equal(config.systemPrompt, '');
  assert.equal(config.temperature, 0.7);
  assert.equal(warnings.length, 3);
});

test('parseConfig: GitHub-flavored padding from a blurred save still works', () => {
  // What the UI actually writes: an object dumped through JSON.stringify.
  const { config } = C.parseConfig(JSON.stringify({
    baseUrl: '  http://localhost:11434/v1  ',
    model: ' qwen:7b ',
    temperature: 1,
    systemPrompt: 'Stay kind.'
  }));
  assert.equal(config.baseUrl, 'http://localhost:11434/v1');
  assert.equal(config.model, 'qwen:7b');
  assert.equal(config.temperature, 1);
});

test('parseConfig: non-object JSON (array/number) falls back safely', () => {
  const a = C.parseConfig('[1,2,3]');
  assert.equal(a.config.baseUrl, 'http://localhost:11434/v1');
  assert.ok(a.warnings.length >= 1);
  const n = C.parseConfig('42');
  assert.equal(n.config.model, '');
  assert.ok(n.warnings.length >= 1);
});
