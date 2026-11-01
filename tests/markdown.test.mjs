import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCore } from './helpers/load-core.mjs';

const C = loadCore();

test('escapeHtml covers the dangerous five', () => {
  assert.equal(C.escapeHtml('<script>&"\''), '&lt;script&gt;&amp;&quot;&#39;');
});

test('markdown: headings of every level', () => {
  const html = C.markdownToHtml('# a\n## b\n### c\n#### d\n##### e\n###### f');
  assert.match(html, /<h1>a<\/h1>/);
  assert.match(html, /<h6>f<\/h6>/);
});

test('markdown: paragraphs, bold, italic, inline code, links', () => {
  const html = C.markdownToHtml('This is **bold**, *ital*, `code`, and [site](https://example.com).');
  assert.match(html, /<p>This is <strong>bold<\/strong>, <em>ital<\/em>, <code>code<\/code>, and <a href="https:\/\/example.com" rel="noopener noreferrer" target="_blank">site<\/a>\.<\/p>/);
});

test('markdown: fenced code blocks keep raw escaped content', () => {
  const html = C.markdownToHtml('```py\nx = 1 < 2\n```');
  assert.equal(html, '<pre><code class="language-py">x = 1 &lt; 2</code></pre>');
});

test('markdown: unterminated fence still renders a code block', () => {
  const html = C.markdownToHtml('```\nstill in code');
  assert.match(html, /^<pre><code>still in code<\/code><\/pre>$/);
});

test('markdown: lists (and type switching) close properly', () => {
  const html = C.markdownToHtml('- one\n- two\n\n1. first\n2. second');
  assert.match(html, /<ul>\s*<li>one<\/li>\s*<li>two<\/li>\s*<\/ul>/);
  assert.match(html, /<ol>\s*<li>first<\/li>\s*<li>second<\/li>\s*<\/ol>/);
});

test('markdown: blockquotes group', () => {
  const html = C.markdownToHtml('> line one\n> line two');
  assert.match(html, /<blockquote>\s*<p>line one<\/p>\s*<p>line two<\/p>\s*<\/blockquote>/);
});

test('markdown: horizontal rule', () => {
  assert.equal(C.markdownToHtml('---'), '<hr>');
});

test('markdown: XSS payloads elsewhere are fully neutralized', () => {
  const payloads = [
    '<img src=x onerror=alert(1)>',
    '<script>alert(1)</script>',
    '[x](javascript:alert(1))',
    '"><b>bold</b>'
  ];
  for (const p of payloads) {
    const html = C.markdownToHtml(p);
    assert.doesNotMatch(html, /<(?:img|script|b|iframe)\b/, `payload leaked a tag: ${p}`);
    assert.doesNotMatch(html, /href=["']javascript:/, `payload leaked a href: ${p}`);
  }
});

test('markdown: link with javascript: URL is stripped to plain text', () => {
  const html = C.markdownToHtml('[click me](javascript:alert(1))');
  assert.doesNotMatch(html, /javascript:|<a /);
  assert.match(html, /click me/);
});

test('markdown: inline formatting does not bleed into code spans', () => {
  const html = C.markdownToHtml('`**not bold**` and `*not ital*`');
  assert.equal(html, '<p><code>**not bold**</code> and <code>*not ital*</code></p>');
});

test('markdown: numbered list with bracket keeps working', () => {
  const html = C.markdownToHtml('1. step\n2. step');
  assert.match(html, /<ol>\s*<li>step<\/li>\s*<li>step<\/li>\s*<\/ol>/);
});
