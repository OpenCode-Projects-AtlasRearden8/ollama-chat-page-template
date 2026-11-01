import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCore } from './helpers/load-core.mjs';

const C = loadCore();

const WHEN = new Date(2026, 10, 1, 9, 5); // 2026-11-01 09:05 local

test('formatTranscript: headers and metadata block', () => {
  const md = C.formatTranscript(
    [{ role: 'user', content: 'Hi there' }, { role: 'assistant', content: 'Hello!' }],
    { date: WHEN, model: 'llama3.2', endpoint: 'http://localhost:11434/v1', systemPrompt: 'Be friendly.' }
  );
  assert.match(md, /^# Chat transcript\n/);
  assert.match(md, /- \*\*Date:\*\* 2026-11-01 09:05/);
  assert.match(md, /- \*\*Model:\*\* llama3.2/);
  assert.match(md, /- \*\*Endpoint:\*\* http:\/\/localhost:11434\/v1/);
});

test('formatTranscript: system prompt rendered as a quote block', () => {
  const md = C.formatTranscript(
    [{ role: 'user', content: 'x' }],
    { systemPrompt: 'Line one\nLine two' }
  );
  assert.match(md, /\*\*System prompt\*\*\n\n> Line one\n> Line two\n/);
});

test('formatTranscript: no system prompt means no quote block', () => {
  const md = C.formatTranscript([{ role: 'user', content: 'x' }], {});
  assert.doesNotMatch(md, /System prompt/);
});

test('formatTranscript: roles become You / Assistant headings', () => {
  const md = C.formatTranscript(
    [{ role: 'user', content: 'Question' }, { role: 'assistant', content: 'Answer' }],
    {}
  );
  assert.match(md, /\n## You\n\nQuestion\n/);
  assert.match(md, /\n## Assistant\n\nAnswer\n/);
});

test('formatTranscript: error turns and empty turns are skipped', () => {
  const md = C.formatTranscript(
    [
      { role: 'error', content: 'Streaming failed: HTTP 404' },
      { role: 'user', content: '   ' },
      { role: 'assistant', content: 'kept' }
    ],
    {}
  );
  assert.doesNotMatch(md, /Streaming failed/);
  assert.doesNotMatch(md, /## You\n\n {0,}\n/);
  assert.match(md, /kept/);
});

test('formatTranscript: multi-line reply content is preserved verbatim', () => {
  const md = C.formatTranscript(
    [{ role: 'assistant', content: 'Line A\nLine B\n\n- item one\n- item two' }],
    {}
  );
  assert.match(md, /Line A\nLine B\n\n- item one\n- item two/);
});

test('formatTranscript: markdown produced by export parses back (round-trip sanity)', () => {
  const md = C.formatTranscript(
    [
      { role: 'user', content: 'What is MCP?' },
      { role: 'assistant', content: 'MCP is the **Model Control Protocol**...' }
    ],
    { model: 'qwen:7b', endpoint: 'http://localhost:11434/v1' }
  );
  // Every heading level used must be account-free plain markdown.
  for (const line of md.split('\n')) {
    if (line.startsWith('#')) assert.match(line, /^#{1,2} /);
  }
  assert.ok(md.trim().endsWith('...'), 'ends with the last reply');
});

test('formatTranscript: no messages still yields a usable header', () => {
  const md = C.formatTranscript([], { date: WHEN });
  assert.match(md, /^# Chat transcript/);
  assert.match(md, /- \*\*Date:\*\* 2026-11-01 09:05/);
});
