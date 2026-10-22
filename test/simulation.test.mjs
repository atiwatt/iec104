import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { applyTranslations, setLanguage, t } from '../public/i18n.js';
import { simulationMessages } from '../public/simulation-copy.js';

// A deliberately small DOM adapter for state regression tests. Browser QA covers
// actual markup, layout and input behavior; these tests drive the shipped module
// with a deterministic clock and read the same status fields shown to visitors.
class Element {
  constructor() {
    this.textContent = '';
    this.innerHTML = '';
    this.dataset = {};
    this.style = {};
    this.value = '';
    this.checked = true;
    this.hidden = false;
    this.disabled = false;
    this.attributes = new Map();
    this.listeners = new Map();
    this.descendants = new Map();
    this.classes = new Set();
    this.classList = {
      contains: key => this.classes.has(key),
      toggle: (key, enabled) => enabled ? this.classes.add(key) : this.classes.delete(key),
    };
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  querySelector(selector) { return this.descendants.get(selector) ?? null; }
  querySelectorAll() { return []; }
  fire(type) { this.listeners.get(type)?.({ target: this }); }
}

async function createSimulation() {
  setLanguage('zh', { persist: false, updateUrl: false });
  const original = await readFile(new URL('../public/simulation.js', import.meta.url), 'utf8');
  // Dependency exports below come from the real modules. Only module loading is
  // adapted, avoiding experimental vm.SourceTextModule flags on Node.js 20.
  const executable = original.replace(/^import [^\n]+;\r?\n/gm, '');
  const nodes = new Map();
  const mount = new Element();
  const shell = new Element();
  const events = new Map();
  const scenarios = ['normal', 'local', 'stale'].map(name => {
    const button = new Element();
    button.dataset.scenario = name;
    return button;
  });
  const stages = Array.from({ length: 3 }, () => new Element());
  const icon = new Element();
  mount.descendants.set('.sim-shell', shell);
  mount.descendants.set('.sim-feedback-icon', icon);
  mount.querySelectorAll = selector => selector === '[data-scenario]' ? scenarios : selector === '[data-step]' ? stages : [];
  Object.defineProperty(mount, 'innerHTML', {
    set(markup) {
      for (const match of markup.matchAll(/\bid="([^"]+)"/g)) nodes.set(match[1], new Element());
      nodes.get('sim-send').descendants.set('span', new Element());
    },
  });
  let now = 0;
  let tick;
  const context = vm.createContext({
    document: {
      querySelector: selector => selector === '#simulation' ? mount : null,
      getElementById: id => nodes.get(id) ?? null,
      body: { classList: { contains: () => false } },
    },
    window: {
      matchMedia: () => ({ matches: false, addEventListener() {} }),
      addEventListener: (name, listener) => events.set(name, listener),
    },
    performance: { now: () => now },
    setInterval: callback => { tick = callback; return 1; },
    clearInterval() {},
    simulationMessages, applyTranslations, t,
  });
  vm.runInContext(executable, context, { filename: 'simulation.js' });
  const node = id => {
    assert.ok(nodes.has(id), `Published control exists: ${id}`);
    return nodes.get(id);
  };
  return {
    node,
    click: id => node(id).fire('click'),
    choose: name => scenarios.find(button => button.dataset.scenario === name).fire('click'),
    selected: name => scenarios.find(button => button.dataset.scenario === name).getAttribute('aria-pressed'),
    advance(ms) {
      // Keep the production interval cadence so ramp rate and expiry interact
      // normally, without directly mutating the model's private state.
      while (ms > 0) { const step = Math.min(ms, 200); now += step; tick(); ms -= step; }
    },
    language(next) {
      setLanguage(next, { persist: false, updateUrl: false });
      events.get('iec-language-change')({ detail: { language: next } });
    },
  };
}

test('switching language preserves an in-flight command and localizes its later acceptance and completion', async () => {
  const sim = await createSimulation();
  sim.click('sim-send');
  sim.advance(400);
  sim.language('en');
  assert.equal(sim.node('sim-send').disabled, true);
  assert.match(sim.node('sim-feedback-title').textContent, /Command sent/);
  assert.match(sim.node('sim-target').innerHTML, /^0\.0/);
  sim.advance(600);
  assert.match(sim.node('sim-feedback-title').textContent, /Target accepted/);
  assert.match(sim.node('sim-target').innerHTML, /^\+5\.0/);
  assert.match(sim.node('sim-actual').innerHTML, /^0\.0/);
  sim.language('zh');
  assert.match(sim.node('sim-feedback-title').textContent, /目标已接受/);
  assert.match(sim.node('sim-target').innerHTML, /^\+5\.0/);
  sim.advance(2600);
  assert.match(sim.node('sim-actual').innerHTML, /^\+5\.0/);
  sim.language('en');
  assert.match(sim.node('sim-feedback-title').textContent, /Feedback confirms/);
  assert.match(sim.node('sim-feedback-copy').textContent, /\+5\.0 kW/);
});

test('language switching preserves stale telemetry values, elapsed age and scenario; recovery uses fresh feedback', async () => {
  const sim = await createSimulation();
  sim.choose('stale');
  sim.advance(7000);
  sim.language('en');
  assert.equal(sim.selected('stale'), 'true');
  assert.equal(sim.node('sim-telemetry').checked, false);
  assert.match(sim.node('sim-quality').textContent, /Invalid/);
  assert.match(sim.node('sim-actual').innerHTML, /^\+2\.0/);
  assert.match(sim.node('sim-device-state').textContent, /\+5\.0/);
  assert.match(sim.node('sim-report-age').textContent, /7 s ago/);
  sim.language('zh');
  assert.match(sim.node('sim-report-age').textContent, /7 秒前/);
  sim.click('sim-send');
  sim.language('en');
  sim.advance(1000);
  assert.match(sim.node('sim-feedback-title').textContent, /telemetry has expired/);
  assert.match(sim.node('sim-actual').innerHTML, /^\+2\.0/);
  sim.node('sim-telemetry').checked = true;
  sim.node('sim-telemetry').fire('change');
  assert.match(sim.node('sim-quality').textContent, /Valid/);
  assert.match(sim.node('sim-actual').innerHTML, /^\+5\.0/);
  assert.match(sim.node('sim-feedback-title').textContent, /Fresh telemetry/);
  sim.language('zh');
  assert.match(sim.node('sim-feedback-title').textContent, /恢复有效/);
});

test('local restriction still rejects commands after a language change and can be restored', async () => {
  const sim = await createSimulation();
  sim.choose('local');
  sim.language('en');
  sim.advance(1000);
  assert.equal(sim.selected('local'), 'true');
  assert.equal(sim.node('sim-remote').checked, false);
  assert.match(sim.node('sim-feedback-title').textContent, /remote control blocked/);
  assert.match(sim.node('sim-target').innerHTML, /^0\.0/);
  sim.language('zh');
  assert.match(sim.node('sim-feedback-title').textContent, /本地禁止/);
  sim.node('sim-remote').checked = true;
  sim.node('sim-remote').fire('change');
  sim.node('sim-setpoint').value = '-5';
  sim.node('sim-setpoint').fire('input');
  assert.match(sim.node('sim-setpoint').getAttribute('aria-valuetext'), /5 千瓦，充电/);
  sim.language('en');
  assert.match(sim.node('sim-setpoint').getAttribute('aria-valuetext'), /5 kilowatts, charging/);
  sim.click('sim-send');
  sim.advance(1000);
  assert.match(sim.node('sim-feedback-title').textContent, /Target accepted/);
  assert.match(sim.node('sim-target').innerHTML, /^−5\.0/);
  sim.advance(2600);
  assert.match(sim.node('sim-actual').innerHTML, /^−5\.0/);
});
