import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolveLanguage, interpolate, setLanguage, getLanguage, t } from '../public/i18n.js';
import { pageMessages } from '../public/page-copy.js';
import { simulationMessages } from '../public/simulation-copy.js';

test('explicit language links override a saved choice; invalid or missing choices have a safe fallback', () => {
  assert.equal(resolveLanguage('?lang=en&campaign=demo', 'zh'), 'en');
  assert.equal(resolveLanguage('?lang=zh', 'en'), 'zh');
  assert.equal(resolveLanguage('', 'en'), 'en');
  assert.equal(resolveLanguage('?lang=unknown', 'en'), 'en');
  assert.equal(resolveLanguage('?lang=unknown', 'unknown'), 'zh');
  assert.equal(resolveLanguage(), 'zh');
});

test('message parameters preserve zero, negative values and Unicode without evaluating them', () => {
  assert.equal(interpolate('{value} kW / {age} s', { value: '−5.0', age: 0 }), '−5.0 kW / 0 s');
  assert.equal(interpolate('{value}', { value: '${notCode}' }), '${notCode}');
  assert.throws(() => interpolate('{missing}', {}), /Missing translation parameter/);
});

test('both dictionaries cover identical keys with matching runtime parameters', () => {
  for (const [name, messages] of Object.entries({ pageMessages, simulationMessages })) {
    const zhKeys = Object.keys(messages.zh).sort();
    assert.deepEqual(Object.keys(messages.en).sort(), zhKeys, name);
    assert.ok(zhKeys.length > 30, name);
    for (const key of zhKeys) {
      const zh = messages.zh[key], en = messages.en[key];
      assert.equal(typeof zh, 'string', `${name}.${key}`);
      assert.equal(typeof en, 'string', `${name}.${key}`);
      assert.ok(zh.trim() && en.trim(), `${name}.${key}`);
      const parameters = text => [...text.matchAll(/\{([a-zA-Z][\w]*)\}/g)].map(match => match[1]).sort();
      assert.deepEqual(parameters(en), parameters(zh), `${name}.${key}`);
      assert.ok(!/[\u3400-\u9fff]/u.test(en), `Untranslated English: ${name}.${key}`);
    }
  }
});

test('all static page and simulator translation annotations resolve in each language', async () => {
  for (const [file, prefix, messages] of [
    ['index.html', 'page', pageMessages], ['simulation.js', 'sim', simulationMessages],
  ]) {
    const source = await readFile(new URL(`../public/${file}`, import.meta.url), 'utf8');
    const regex = new RegExp(`data-${prefix}(?:-html|-aria-label|-title|-content)?=["']([^"']+)["']`, 'g');
    const keys = [...source.matchAll(regex)].map(match => match[1]).filter(key => !key.includes('${'));
    // The simulator builds its annotated spans with label('key') and uses tr('key') for attributes.
    if (file === 'simulation.js') {
      keys.push(...[...source.matchAll(/\b(?:label|tr)\('([^']+)'/g)].map(match => match[1]));
    }
    assert.ok(keys.length > 15, file);
    for (const lang of ['zh', 'en']) for (const key of keys) {
      assert.equal(typeof messages[lang][key], 'string', `${file}:${lang}:${key}`);
    }
  }
});

test('language changes update message lookup and reject unsupported languages', () => {
  const messages = { zh: { progress: '目标 {value} kW' }, en: { progress: 'Target {value} kW' } };
  setLanguage('en');
  assert.equal(t(messages, 'progress', { value: 5 }), 'Target 5 kW');
  assert.equal(setLanguage('invalid'), false);
  assert.equal(getLanguage(), 'en');
  setLanguage('zh');
  assert.equal(t(messages, 'progress', { value: 5 }), '目标 5 kW');
  assert.throws(() => t(messages, 'unknown'), /Missing zh translation/);
});
