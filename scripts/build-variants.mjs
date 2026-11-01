// Rebuilds the themed variants under variants/ from the canonical
// index.html. Palette CSS is swapped out between the THEME markers;
// no other byte of the app is touched, so variants always stay in
// behavioral lockstep with the main template.
//
// Usage: npm run build:variants  [or]  node scripts/build-variants.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START = '/* THEME:START';
const END = '/* THEME:END */';

const PALETTES = {
  midnight: {
    font: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    vars: `
    --bg: #0f1420;
    --panel: #161d2e;
    --panel-2: #131927;
    --text: #e7ecf5;
    --muted: #8fa0bc;
    --accent: #4f9cf9;
    --accent-contrast: #ffffff;
    --border: #26304a;
    --user-bubble: #1d2a45;
    --bot-bubble: #141b2b;
    --code-bg: #0b1020;
    --danger: #e06c75;`,
    'theme-color': '#0f1420'
  },
  daybreak: {
    font: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    vars: `
    --bg: #faf7f2;
    --panel: #fffdf9;
    --panel-2: #f4efe7;
    --text: #2c2a26;
    --muted: #7a7365;
    --accent: #b4581f;
    --accent-contrast: #fffdf9;
    --border: #e3dcd0;
    --user-bubble: #ecdfd2;
    --bot-bubble: #f7f3ec;
    --code-bg: #2c2a26;
    --danger: #b3261e;`,
    'theme-color': '#faf7f2'
  },
  terminal: {
    font: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    vars: `
    --bg: #04170a;
    --panel: #082411;
    --panel-2: #06180d;
    --text: #7ce8a4;
    --muted: #3f9c67;
    --accent: #34d371;
    --accent-contrast: #04170a;
    --border: #145030;
    --user-bubble: #0a3018;
    --bot-bubble: #06180d;
    --code-bg: #021006;
    --danger: #ff7b6e;`,
    'theme-color': '#04170a'
  },
  emberhall: {
    font: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    vars: `
    --bg: #1a1417;
    --panel: #241b1f;
    --panel-2: #1f171a;
    --text: #f4e8dd;
    --muted: #b29687;
    --accent: #e08a3c;
    --accent-contrast: #241b1f;
    --border: #432e26;
    --user-bubble: #33241c;
    --bot-bubble: #241b1f;
    --code-bg: #120d0f;
    --danger: #d45c5c;`,
    'theme-color': '#1a1417'
  }
};

const names = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const chosen = names.length ? names : Object.keys(PALETTES).filter((n) => n !== 'midnight');

const source = readFileSync(path.join(root, 'index.html'), 'utf8');
const sIdx = source.indexOf(START);
const eIdx = source.indexOf(END);
if (sIdx === -1 || eIdx === -1 || eIdx < sIdx) {
  throw new Error('index.html is missing the THEME:START / THEME:END markers');
}

mkdirSync(path.join(root, 'variants'), { recursive: true });

for (const name of chosen) {
  const p = PALETTES[name];
  if (!p) throw new Error(`Unknown palette "${name}". Known: ${Object.keys(PALETTES).join(', ')}`);
  let fontCss = '';
  if (p.font) fontCss = `\n    --font-sans: ${p.font};\n    --font-mono: ${p.mono};`;
  const block = `${START}
  :root {${fontCss}${p.vars}
  }`;
  const html = (source.slice(0, sIdx) + block + source.slice(eIdx))
    .replace(/\n  <h1>Local Chat Playground<\/h1>/, `\n  <h1>Local Chat Playground (${name})</h1>`)
    .replace(/<meta name="theme-color" content="[^"]*">/, `<meta name="theme-color" content="${p['theme-color']}">`);
  const out = path.join(root, 'variants', `${name}.html`);
  writeFileSync(out, html);
  console.log('wrote', path.relative(root, out));
}
