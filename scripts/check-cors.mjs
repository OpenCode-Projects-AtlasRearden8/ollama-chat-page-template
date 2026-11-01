// Optional diagnostic: check that your local (or remote) OpenAI-compatible
// endpoint speaks CORS for the chat page. Zero dependencies.
//
// Usage:
//   npm run check-cors
//   node scripts/check-cors.mjs [baseUrl] [--origin VALUE]
//
// Exits 0 when the endpoint answers AND allows the page's origin.
// Exits 1 with plain-English guidance when something needs fixing.
import { loadCore } from '../tests/helpers/load-core.mjs';

const ChatCore = loadCore('index.html');

const args = process.argv.slice(2);
let originArg = null;
let baseFromArg = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--origin' && i + 1 < args.length) originArg = args[++i];
  else if (!args[i].startsWith('--')) baseFromArg = args[i];
}

// A page opened straight from disk (file://...) reports its Origin as "null".
const origin = originArg !== null ? originArg : 'null';
const base = ChatCore.normalizeBaseUrl(baseFromArg || 'http://localhost:11434/v1');
const url = base + '/models';

console.log(`Probing ${url}`);
console.log(`Simulating page Origin: ${origin}`);
console.log('');

let res;
try {
  const headers = { Origin: origin };
  const key = process.env.OLLAMA_CHAT_API_KEY;
  if (key) headers.Authorization = 'Bearer ' + key;
  res = await fetch(url, { headers });
  console.log(`HTTP ${res.status} ${res.statusText}`);
} catch (err) {
  console.log(`Request failed: ${err.message}`);
  console.log('');
  console.log('Most likely the server is not running, or the URL has a typo.');
  console.log('Start Ollama, then try again:');
  console.log('  ollama serve');
  process.exit(1);
}

const allowOrigin = res.headers.get('access-control-allow-origin');
const allowHeaders = res.headers.get('access-control-allow-headers');
const allowMethods = res.headers.get('access-control-allow-methods');
console.log('');
console.log('access-control-allow-origin:', allowOrigin ?? '(none)');
if (allowHeaders) console.log('access-control-allow-headers:', allowHeaders);
if (allowMethods) console.log('access-control-allow-methods:', allowMethods);

if (res.status !== 200) {
  console.log('');
  console.log('Unexpected status. For Ollama, the base URL should be http://localhost:11434/v1');
}

const allowed = allowOrigin === '*' || allowOrigin === origin;
console.log('');
if (allowed) {
  console.log('GOOD: this origin is allowed. The chat page should be able to talk to it.');
  process.exit(0);
} else {
  console.log('PROBLEM: the endpoint did not allow this origin. The browser will');
  console.log('block the page even though the server is reachable.');
  console.log('');
  console.log('Fix for Ollama (quit Ollama first, then start it again with):');
  console.log('  Linux/macOS:  OLLAMA_ORIGINS="null" ollama serve');
  console.log('  Windows:      setx OLLAMA_ORIGINS "null"   (then restart Ollama)');
  console.log('');
  console.log('"null" is the Origin a page opened straight from a file sends.');
  console.log('If you serve the page over http (any web server), set the matching');
  console.log('origin instead, e.g. OLLAMA_ORIGINS="http://localhost:8000".');
  process.exit(1);
}
