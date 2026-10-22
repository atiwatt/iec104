import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import worker from '../dist/worker.mjs';

const origin = 'https://104.atiwatt.com';
const request = (path, init) => worker.fetch(new Request(origin + path, init));

test('homepage and explicit index serve the published UTF-8 document', async () => {
  const expected = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  for (const path of ['/', '/index.html', '/?campaign=test', '/?lang=en', '/?lang=zh']) {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(await response.text(), expected);
  }
});

test('script and stylesheet responses use browser-executable MIME types', async () => {
  for (const [path, type] of [['/app.js', 'text/javascript'], ['/styles.css', 'text/css'], ['/simulation.js', 'text/javascript'], ['/simulation.css', 'text/css'], ['/i18n.js', 'text/javascript'], ['/page-copy.js', 'text/javascript'], ['/simulation-copy.js', 'text/javascript']]) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get('content-type').startsWith(type), path);
    assert.ok((await response.text()).length > 0, path);
  }
});

test('browser policy blocks device connections and external script sources', async () => {
  const response = await request('/');
  const csp = response.headers.get('content-security-policy');
  assert.ok(csp.includes("connect-src 'none'"));
  assert.ok(csp.includes("script-src 'self'"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.ok(!csp.includes("script-src 'self' 'unsafe-inline'"));
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('content-language'), 'zh-CN, en');
});

test('HEAD has no response body and preserves GET metadata', async () => {
  for (const path of ['/', '/styles.css']) {
    const get = await request(path);
    const head = await request(path, { method: 'HEAD' });
    assert.equal(head.status, get.status);
    assert.deepEqual([...head.headers], [...get.headers]);
    assert.equal(await head.text(), '');
  }
});

test('ETag revalidation returns empty 304 including weak/list validators', async () => {
  const initial = await request('/');
  const etag = initial.headers.get('etag');
  assert.match(etag, /^"[0-9a-f]{32}"$/);
  for (const validator of [etag, 'W/' + etag, '"other", ' + etag, '*']) {
    const cached = await request('/', { headers: { 'If-None-Match': validator } });
    assert.equal(cached.status, 304);
    assert.equal(await cached.text(), '');
    assert.equal(cached.headers.get('etag'), etag);
  }
  assert.equal((await request('/', { headers: { 'If-None-Match': '"different"' } })).status, 200);
});

test('unknown paths are real 404s without exposing repository files or reflecting input', async () => {
  for (const path of ['/missing', '/README.md', '/wrangler.jsonc', '/.env', '/scripts/build.mjs', '/__proto__', '/%3Cscript%3Ealert(1)%3C/script%3E']) {
    const response = await request(path);
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(!(await response.text()).includes(path), path);
  }
  const head = await request('/missing', { method: 'HEAD' });
  assert.equal(head.status, 404);
  assert.equal(await head.text(), '');
});

test('unsupported methods cannot mutate the site', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const response = await request('/', { method });
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});
