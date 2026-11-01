# Local Chat Playground (single-file template)

A zero-install chat page for talking to any **OpenAI-compatible** endpoint — works great
with [Ollama](https://ollama.com) by default. Open one HTML file in your browser and start
chatting. No build step, no server to run, no accounts, no cloud calls unless you point it
at one yourself.

Everything in this template is explained "like a friend would": plain English, step by
step, never condescending. It was built by **Asdale Dynamics, LLC** as part of a growing
library of beginner-friendly AI tools and templates.

> Prefer a general starter scaffold for building your own web app? See the separate
> `open-webapp-starter-template` project — this one is focused purely on being a chat
> playground you can open and use.

---

## What it does

- **Single file.** `index.html` carries the whole app: UI, styling, and logic. Drop it on
  a Desktop, USB stick, or static host and it just works.
- **Any OpenAI-compatible endpoint.** Default is Ollama (`http://localhost:11434/v1`),
  and the endpoint is fully editable in the built-in **Settings panel** (LM Studio,
  llama.cpp server, vLLM, Groq, OpenAI itself, and friends all work).
- **Streaming replies.** Tokens appear as they are generated, with a **Stop** button that
  safely aborts mid-stream.
- **Markdown rendering.** Headings, bold/italic, lists, blockquotes, links, and fenced
  code blocks all render — inside an **escape-first** pipeline, so a chatty model can
  never inject scripts into the page.
- **System-prompt library.** Save, load, and delete named prompts right in the Settings
  panel. Stored in your browser's `localStorage`, so they survive restarts.
- **Model picker from `/models`.** Hit **Refresh** and the model dropdown fills itself
  from whatever the endpoint offers.
- **Export as Markdown.** One click downloads the whole conversation (prompt, model,
  endpoint metadata included) as a `.md` file you can paste into notes, a book, or a repo.
- **Local-first, privacy-respecting.** Config, prompt library, and current conversation
  live in `localStorage` on your machine. The optional API-key box is intentionally
  **never saved** — it lives only in memory for the session.
- **Four themes.** Ships themed variants (see below); rebuilding them is one command.

---

## Quick start (Ollama, ~5 minutes)

1. Install [Ollama](https://ollama.com/download) and pull a small model:
   ```
   ollama pull llama3.2:3b
   ```
2. Let Ollama accept requests from a browser page (CORS). Quit Ollama, then:
   ```
   # Linux / macOS
   OLLAMA_ORIGINS="null" ollama serve

   # Windows (Command Prompt), then start Ollama normally
   setx OLLAMA_ORIGINS "null"
   ```
   Why? A page you open straight from a file reports its "Origin" as `null`, and by
   default Ollama politely declines to talk to pages it doesn't know. One environment
   variable fixes that.
3. Open `index.html` in your browser (double-click it — that's the whole install).
4. Click **Settings**, then **Refresh**. Models appear in the dropdown. Pick one.
5. Say hello.

### Check CORS the easy way (optional)

If something is blocked, run the built-in diagnostic (needs Node 18+, no dependencies):

```
npm run check-cors
```

It probes `http://localhost:11434/v1/models` from the page's point of view and prints
either GOOD or exactly what to fix. You can point it at anything:

```
node scripts/check-cors.mjs http://localhost:1234/v1        # LM Studio
node scripts/check-cors.mjs https://api.openai.com/v1       # cloud
node scripts/check-cors.mjs http://localhost:8000 --origin "http://localhost:5000"
```

## Using other endpoints

In **Settings > API endpoint**, paste any OpenAI-compatible base URL, for example:

| Server                          | Base URL                        |
| ------------------------------- | ------------------------------- |
| Ollama                          | `http://localhost:11434/v1`     |
| LM Studio                       | `http://localhost:1234/v1`      |
| llama.cpp (`llama-server`)      | `http://localhost:8080/v1`      |
| OpenAI cloud                    | `https://api.openai.com/v1`     |

The address is auto-cleaned: `localhost:11434` becomes the full
`http://localhost:11434/v1` for you. Cloud endpoints need an API key — type it into the
key box (kept for this session only) and it will be sent as a bearer token.

## The prompt library

Write a system prompt in Settings, give it a name, press **Save**. It appears in the
library list with **Load** and **Delete** buttons. Saved prompts live in this browser's
`localStorage` — nothing leaves your machine. Re-saving an existing name updates it.

## Exporting transcripts

Click **Export .md** in the header. You get a timestamped file like
`chat-transcript-20261101-0905.md` containing a `# Chat transcript` header with date,
model, and endpoint, the system prompt as a blockquote, then each turn under `## You` /
`## Assistant` headings. Error turns and empty turns are skipped automatically.

## Themed variants

The palette lives between two `/* THEME:START */ ... /* THEME:END */` markers in
`index.html`. The build script swaps that block to produce ready-to-use variants:

- **`variants/daybreak.html`** — light, warm paper tones
- **`variants/terminal.html`** — green-on-black monospace
- **`variants/emberhall.html`** — dark, torchlit amber

Rebuild them (uses only Node's standard library):

```
npm run build:variants
```

The script rewrites only the theme block, so every variant stays in perfect behavioral
sync with `index.html` — and the test suite checks that they do.

## Tests

```
npm test            # runs: node --test tests/
```

No dependencies to install — this uses Node's built-in test runner (Node 18+). If you
don't have Node, the page itself still needs nothing at all; the tests are for the person
adapting the template. Coverage includes:

- **Config parsing** — endpoint normalization, clamped temperature, invalid JSON, and
  mistyped fields handled with warnings instead of crashes.
- **Export formatting** — transcript structure, role headings, metadata, quote blocks.
- **Markdown rendering** — the safe subset, and proof that XSS payloads are neutralized.
- **Integrity** — single-file guarantees (no external scripts/styles), no secrets in
  files, LICENSE wording, variants sharing one core, and the standard API routes.

The tests evaluate the *actual* `<script id="core">` block extracted from
`index.html`/variants, so what you ship is what gets tested.

## Files

```
index.html                  the whole app (main theme: midnight)
variants/                   themed builds (daybreak, terminal, emberhall)
scripts/build-variants.mjs  palette swap -> variants/ output
scripts/check-cors.mjs      endpoint/CORS diagnostic
tests/                      Node built-in test suite
README.md, LICENSE, STATUS.md, package.json
```

## Browser support

Any modern Chromium or Firefox; Safari 16.4+. Uses only what browsers ship by default:
`fetch`, streams, `AbortController`, and `localStorage`.

## Credits & license

Built by **Asdale Dynamics, LLC** for the beginner-friendly AI ecosystem around
*[The Massive AI Manual](https://dylanasdale.github.io)* — plain English, step by step,
never condescending. MIT licensed; see [LICENSE](LICENSE).

Call it a playground, a template, or a starting point for your own tools — fork away.
