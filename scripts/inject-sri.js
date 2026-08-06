/**
 * Post-build SRI (Subresource Integrity) injection.
 *
 * After `vite build`, the entry `index.html` references hashed script/link
 * assets (e.g. `/assets/index-*.js`). This script scans those tags, computes
 * a SHA384 hash for each referenced asset, and injects the corresponding
 * `integrity=` attribute so browsers verify script/style integrity at load
 * time. No `manifest.json` dependency — it maps directly to what the browser
 * will actually request.
 *
 * Run after `vite build`, from the project root:  node scripts/inject-sri.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = path.join(process.cwd(), 'dist', 'apps', 'web');
const INDEX = path.join(OUT, 'index.html');

if (!fs.existsSync(INDEX)) {
  console.error('[sri] index.html not found at', INDEX);
  process.exit(1);
}

const html = fs.readFileSync(INDEX, 'utf8');

const out = html.replace(/<(script)([^>]*)>/gi, (match, tag, attrs) => {
  // Skip scripts that already carry an integrity attribute or are external
  if (/integrity=/.test(attrs)) return match;
  if (/src=["']https?:/.test(attrs)) return match;

  const hrefMatch = attrs.match(/src=["']([^"']+)["']/);
  if (!hrefMatch) return match;

  const href = hrefMatch[1].replace(/^\//, '');
  const abs = path.join(OUT, href);
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) return match;

  const buf = fs.readFileSync(abs);
  const hash = 'sha384-' + crypto.createHash('sha384').update(buf).digest('base64');
  return `<${tag}${attrs} integrity="${hash}">`;
}).replace(/<link([^>]*)rel=["']stylesheet["']([^>]*)>/gi, (match, pre, post) => {
  if (/integrity=/.test(pre + post)) return match;
  const hrefMatch = (pre + post).match(/href=["']([^"']+)["']/);
  if (!hrefMatch) return match;
  const href = hrefMatch[1].replace(/^\//, '');
  const abs = path.join(OUT, href);
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) return match;
  const buf = fs.readFileSync(abs);
  const hash = 'sha384-' + crypto.createHash('sha384').update(buf).digest('base64');
  return `<link${pre}rel="stylesheet"${post} integrity="${hash}">`;
});

fs.writeFileSync(INDEX, out);
const count = (out.match(/ integrity=/g) || []).length;
console.log(`[sri] injected ${count} integrity attributes into index.html`);
