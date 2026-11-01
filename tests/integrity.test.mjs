// Integrity checks: the stuff that makes this a shippable template rather
// than just JavaScript that happens to work.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadCore, ROOT } from './helpers/load-core.mjs';

const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');

test('all promised files exist', () => {
  for (const f of [
    'index.html', 'README.md', 'LICENSE', 'STATUS.md', 'package.json',
    'scripts/build-variants.mjs', 'scripts/check-cors.mjs'
  ]) {
    assert.ok(existsSync(path.join(ROOT, f)), `missing file: ${f}`);
  }
});

test('themed variants ship and share the same core as index.html', () => {
  const ref = loadCore('index.html');
  const variants = readFileSync(path.join(ROOT, 'README.md'), 'utf8')
    .match(/variants\/([a-z-]+)\.html/g)?.map((s) => s.replace(/^variants\/|\.html$/g, '')) ?? [];
  assert.ok(variants.length >= 2, `expected >= 2 variants in README, got: ${variants.join(',')}`);
  for (const name of variants) {
    const file = `variants/${name}.html`;
    const html = read(file);
    // Same behavior, different paint: identical core, distinct palette.
    const core = loadCore(file);
    assert.deepEqual(core.DEFAULTS, ref.DEFAULTS, `${file} core drifted from index.html`);
    assert.equal(
      core.normalizeBaseUrl('localhost:1234'),
      ref.normalizeBaseUrl('localhost:1234')
    );
    assert.equal(core.markdownToHtml('- a\n- b'), ref.markdownToHtml('- a\n- b'));
    assert.match(html, /THEME:START/);
    assert.match(html, /--bg:/, `${file} has no palette`);
  }
  const palettes = variants.map((v) => read(`variants/${v}.html`).match(/--bg:\s*(#\w+|rgb\([^)]*\))/));
  assert.ok(new Set(palettes.map((m) => (m ? m[1] : ''))).size >= 2, 'variants must use distinct background colors');
  // Each variant names itself in the header, so users know which file they opened.
  for (const name of variants) {
    assert.match(read(`variants/${name}.html`), new RegExp(`Local Chat Playground \\(${name}\\)`));
  }
});

test('index.html is genuinely single-file / zero-install', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /<link[^>]+href=/, 'no external stylesheets');
  assert.doesNotMatch(html, /<script[^>]+src=/, 'no external scripts (core must be inline, not linked)');
  assert.doesNotMatch(html, /<iframe/i, 'no framing');
  assert.match(html, /<script id="core">/, 'core block present');
  const coreBlock = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(coreBlock, /addEventListener|document\.|getElementById/, 'core stays DOM-free');
});

test('no secrets or personal data committed', () => {
  const files = [
    'index.html', 'README.md', 'STATUS.md', 'package.json',
    'scripts/build-variants.mjs', 'scripts/check-cors.mjs', 'LICENSE',
    ...read('README.md').match(/variants\/[a-z-]+\.html/g)?.map((s) => s.replace(/^variants\//, 'variants/')) ?? []
  ];
  const patterns = [
    /sk-[A-Za-z0-9]{16,}/,
    /ghp_[A-Za-z0-9]{20,}/,
    /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}/i,
    /Bearer [A-Za-z0-9_\-]{16,}[^ ']/,
    /@@/
  ];
  for (const f of files) {
    let text;
    try { text = read(f); } catch { continue; }
    for (const p of patterns) {
      assert.doesNotMatch(text, p, `possible secret in ${f}`);
    }
  }
});

test('LICENSE is the expected MIT text with the required copyright line', () => {
  const lic = read('LICENSE');
  assert.match(lic, /\bMIT License\b/);
  assert.equal(
    lic.match(/Copyright \(c\)[^\n]*/)?.[0],
    'Copyright (c) 2026 Asdale Dynamics, LLC',
    'copyright line must be exactly: Copyright (c) 2026 Asdale Dynamics, LLC'
  );
});

test('README credits Asdale Dynamics, LLC and documents how to run things', () => {
  const readme = read('README.md');
  assert.match(readme, /Asdale Dynamics, LLC/);
  for (const topic of ['Ollama', 'CORS', 'Export', 'Mark', 'Settings', 'node --test', 'LICENSE']) {
    assert.match(readme, new RegExp(topic, 'i'), `README should mention ${topic}`);
  }
});

test('package.json is dependency-free and exposes the right scripts', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.license, 'MIT');
  assert.deepEqual(pkg.dependencies ?? {}, {}, 'template must stay zero-install');
  assert.deepEqual(pkg.devDependencies ?? {}, {}, 'no dev dependencies either');
  assert.match(pkg.scripts.test, /node --test/);
  assert.ok(pkg.scripts['check-cors'], 'check-cors script present');
  assert.ok(pkg.scripts['build:variants'], 'build:variants script present');
});

test('chat stream + model fetch paths hit OpenAI-standard routes', () => {
  const html = read('index.html');
  assert.match(html, /\/chat\/completions/, 'streaming must use the chat completions route');
  assert.match(html, /\/models/, 'model picker must use the models route');
  assert.match(html, /stream:\s*true/, 'streaming must be requested');
  assert.match(
    html.match(/<script id="core">[\s\S]*<\/script>|<script>[\s\S]*<\/script>/s)[0],
    /\[DONE\]/,
    'SSE terminator handled'
  );
});
