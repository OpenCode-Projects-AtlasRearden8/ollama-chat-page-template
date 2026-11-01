// Shared test helper: extracts the id="core" script block straight out of
// index.html (or a variant) and evaluates it, so tests run the exact shipped
// code. No copying, no drift.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadCore(htmlPath = 'index.html') {
  const file = htmlPath === 'index.html'
    ? path.join(root, 'index.html')
    : path.isAbsolute(htmlPath) ? htmlPath : path.join(root, htmlPath);
  const html = readFileSync(file, 'utf8');
  const m = html.match(/<script id="core">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`No <script id="core"> block found in ${file}`);
  const sandbox = {};
  const code = m[1].replace(/globalThis\.ChatCore\s*=\s*ChatCore;?/, '');
  new Function('sandbox', `${code}; sandbox.ChatCore = ChatCore;`)(sandbox);
  return sandbox.ChatCore;
}

export const ROOT = root;
