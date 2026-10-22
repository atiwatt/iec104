import { t, applyTranslations } from './i18n.js';
import { simulationMessages } from './simulation-copy.js';

const tr = (key, params = {}) => t(simulationMessages, key, params);
const mount = document.querySelector('#simulation');

if (mount) {
  const label = (key, tag = 'span') => `<${tag} data-sim="${key}">${tr(key)}</${tag}>`;
  mount.innerHTML = `
    <div class="sim-shell">
      <div class="sim-topline"><span><i class="sim-live-dot" aria-hidden="true"></i>${label('boundary')}</span>${label('topline', 'span').replace('<span ', '<span class="sim-top-note" ')}</div>
      <div class="sim-scenarios" role="group" data-sim-aria-label="scenariosLabel" aria-label="${tr('scenariosLabel')}">
        <button type="button" data-scenario="normal" aria-pressed="true"><span class="sim-scenario-number">01</span>${label('normal')}</button>
        <button type="button" data-scenario="local" aria-pressed="false"><span class="sim-scenario-number">02</span>${label('local')}</button>
        <button type="button" data-scenario="stale" aria-pressed="false"><span class="sim-scenario-number">03</span>${label('stale')}</button>
      </div>
      <div class="sim-diagram" data-sim-aria-label="diagramLabel" aria-label="${tr('diagramLabel')}">
        <div class="sim-wire" aria-hidden="true"></div><div class="sim-wire-label sim-wire-one">IEC 104</div><div class="sim-wire-label sim-wire-two" data-sim="siteLink">${tr('siteLink')}</div>
        <span class="sim-packet sim-packet-command" aria-hidden="true"></span><span class="sim-packet sim-packet-feedback" aria-hidden="true"></span>
        <div class="sim-node">
          <div class="sim-node-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="12" width="44" height="31" rx="3"/><path d="M24 52h16M32 43v9M17 34l8-9 8 5 13-11"/><circle cx="46" cy="19" r="2"/></svg></div>
          ${label('master', 'strong')}${label('masterRole')}<small id="sim-master-state"></small>
        </div>
        <div class="sim-node">
          <div class="sim-node-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><rect x="13" y="11" width="38" height="42" rx="3"/><path d="M13 24h38M13 39h38M34 18h10M34 32h10M34 46h10"/><circle cx="22" cy="18" r="1.5"/><circle cx="22" cy="32" r="1.5"/><circle cx="22" cy="46" r="1.5"/></svg></div>
          ${label('gateway', 'strong')}${label('gatewayRole')}<small id="sim-gateway-state"></small>
        </div>
        <div class="sim-node">
          <div class="sim-node-icon sim-battery-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><rect x="18" y="12" width="28" height="43" rx="3"/><path d="M25 12V7h14v5M33 21l-8 14h8l-2 11 9-16h-8z"/><path class="sim-energy-line" d="M9 29H4m56 0h-5M9 39H4m56 0h-5"/></svg></div>
          ${label('storage', 'strong')}${label('storageRole')}<small id="sim-device-state"></small>
        </div>
      </div>
      <div class="sim-stages" data-sim-aria-label="stagesLabel" aria-label="${tr('stagesLabel')}">
        <div data-step="1"><b>1</b><div>${label('stageSend')}${label('stageSendNote', 'small')}</div></div>
        <div data-step="2"><b>2</b><div>${label('stageAccept')}${label('stageAcceptNote', 'small')}</div></div>
        <div data-step="3"><b>3</b><div>${label('stageObserve')}${label('stageObserveNote', 'small')}</div></div>
      </div>
      <div class="sim-console">
        <div class="sim-controls">
          <div class="sim-control-title"><label for="sim-setpoint" data-sim="setpoint">${tr('setpoint')}</label><output id="sim-setpoint-output" for="sim-setpoint">+5 <small>kW</small></output></div>
          <input type="range" id="sim-setpoint" min="-10" max="10" step="1" value="5" aria-describedby="sim-slider-help" />
          <div class="sim-range-labels" id="sim-slider-help">${label('rangeCharge')}<span>0</span>${label('rangeDischarge')}</div>
          <div class="sim-buttons"><button type="button" class="sim-send" id="sim-send"><span>${tr('send')}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"/></svg></button><button type="button" class="sim-reset" id="sim-reset" data-sim-aria-label="resetLabel" aria-label="${tr('resetLabel')}">${label('reset')} <span aria-hidden="true">↺</span></button></div>
          <div class="sim-switches">
            <label class="sim-switch-row"><span>${label('remote')}${label('remoteHelp', 'small')}</span><input id="sim-remote" type="checkbox" checked role="switch"/><i aria-hidden="true"></i></label>
            <label class="sim-switch-row"><span>${label('telemetry')}${label('telemetryHelp', 'small')}</span><input id="sim-telemetry" type="checkbox" checked role="switch"/><i aria-hidden="true"></i></label>
          </div>
        </div>
        <div class="sim-monitor">
          <div class="sim-monitor-heading">${label('monitor')}<span id="sim-quality" class="sim-quality"></span></div>
          <div class="sim-metrics"><div>${label('acceptedTarget')}<strong id="sim-target">0.0<small> kW</small></strong></div><div>${label('actualFeedback')}<strong id="sim-actual">0.0<small> kW</small></strong></div></div>
          <div class="sim-bars" aria-hidden="true"><div class="sim-bar-row">${label('barTarget')}<div class="sim-bar-track"><i id="sim-target-bar"></i></div></div><div class="sim-bar-row">${label('barFeedback')}<div class="sim-bar-track"><i id="sim-actual-bar"></i></div></div></div>
          <div class="sim-monitor-meta"><span id="sim-report-age"></span><span id="sim-direction"></span></div>
          <p class="sim-monitor-note" id="sim-monitor-note"></p>
          <p class="sim-model-note" id="sim-model-note" hidden></p>
        </div>
      </div>
      <div class="sim-feedback" id="sim-feedback" role="status" aria-live="polite" aria-atomic="true"><span class="sim-feedback-icon" aria-hidden="true">↗</span><div><strong id="sim-feedback-title"></strong><p id="sim-feedback-copy"></p></div></div>
      <p class="sim-footnote" data-sim="footnote">${tr('footnote')}</p>
    </div>`;

  const $ = (id) => document.getElementById(id);
  const shell = mount.querySelector('.sim-shell');
  const slider = $('sim-setpoint');
  const remoteSwitch = $('sim-remote');
  const telemetrySwitch = $('sim-telemetry');
  const sendButton = $('sim-send');
  const scenarios = [...mount.querySelectorAll('[data-scenario]')];
  const stages = [...mount.querySelectorAll('[data-step]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pausedMotion = document.body.classList.contains('motion-paused') || reducedMotion.matches;
  let state;
  let feedback;
  let lastTick = performance.now();
  const signed = (value, precision = 1) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(precision)}`;
  const isStale = (now) => now - state.lastReportAt > 6000;

  function putText(element, value) {
    if (element.textContent !== value) element.textContent = value;
  }

  function putHTML(element, value) {
    if (element.innerHTML !== value) element.innerHTML = value;
  }

  function renderMessage() {
    putText($('sim-feedback-title'), tr(feedback.key + 'Title', feedback.params));
    putText($('sim-feedback-copy'), tr(feedback.key + 'Copy', feedback.params));
    putText(mount.querySelector('.sim-feedback-icon'), feedback.icon);
    $('sim-feedback').dataset.tone = feedback.tone;
  }

  function message(key, params = {}, tone = 'neutral', icon = '↗') {
    feedback = {key, params, tone, icon};
    renderMessage();
  }

  function reset(scenario = 'normal') {
    const now = performance.now();
    state = { target: 0, actual: 0, reported: 0, reportedTarget: 0, remote: true, telemetry: true, lastReportAt: now, pending: null, phase: 'idle', invalid: false, scenario };
    lastTick = now;
    slider.value = '5';
    remoteSwitch.checked = true;
    telemetrySwitch.checked = true;
    scenarios.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenario === scenario)));
    updateSlider();
    message('ready');
    render(now);
  }

  function updateSlider() {
    const value = Number(slider.value);
    putHTML($('sim-setpoint-output'), `${signed(value, 0)} <small>kW</small>`);
    slider.setAttribute('aria-valuetext', tr('ariaSlider', {power: Math.abs(value), direction: tr(value > 0 ? 'discharge' : value < 0 ? 'charge' : 'zero')}));
  }

  function send() {
    if (state.pending) return;
    const value = Number(slider.value);
    state.pending = { value, at: performance.now() };
    state.phase = 'sending';
    message('sending', {power: signed(value)});
    render(performance.now());
  }

  function resolveCommand(now) {
    const value = state.pending.value;
    state.pending = null;
    if (!state.remote) {
      state.phase = 'rejected';
      message('localRejected', {}, 'warning', '×');
    } else if (isStale(now)) {
      state.phase = 'rejected';
      message('staleRejected', {}, 'warning', '×');
    } else {
      state.target = value;
      state.phase = 'tracking';
      message('accepted', {power: signed(value)}, 'success', '✓');
    }
  }

  function setBar(id, value) {
    const bar = $(id);
    bar.style.left = `${value < 0 ? 50 + value * 5 : 50}%`;
    bar.style.width = `${Math.abs(value) * 5}%`;
  }

  function render(now) {
    const stale = isStale(now);
    const phase = state.phase;
    shell.classList.toggle('sim-awaiting', phase === 'sending');
    shell.classList.toggle('sim-tracking', phase === 'tracking' && state.telemetry);
    shell.classList.toggle('sim-stale', stale);
    shell.classList.toggle('sim-motion-off', pausedMotion);
    sendButton.disabled = !!state.pending;
    putText(sendButton.querySelector('span'), tr(state.pending ? 'sending' : 'send'));
    const step = phase === 'sending' || phase === 'rejected' ? 1 : phase === 'tracking' ? 2 : phase === 'done' ? 3 : 0;
    stages.forEach((el, index) => {
      el.classList.toggle('is-complete', index < step);
      el.classList.toggle('is-current', index + 1 === step);
      el.classList.toggle('is-rejected', phase === 'rejected' && index === 1);
    });
    putText($('sim-master-state'), tr(phase === 'sending' ? 'masterSending' : phase === 'rejected' ? 'masterRejected' : phase === 'tracking' ? 'masterTracking' : phase === 'done' ? 'masterDone' : 'masterIdle'));
    putText($('sim-gateway-state'), tr(stale ? 'gatewayInvalid' : !state.remote ? 'gatewayLocal' : phase === 'sending' ? 'gatewayChecking' : phase === 'rejected' ? 'gatewayRejected' : 'gatewayReady'));
    putText($('sim-device-state'), tr('modelPower', {power: signed(state.actual)}));
    putHTML($('sim-target'), `${signed(state.reportedTarget)}<small> kW</small>`);
    putHTML($('sim-actual'), `${signed(state.reported)}<small> kW</small>`);
    putText($('sim-quality'), tr(stale ? 'qualityInvalid' : state.telemetry ? 'qualityValid' : 'qualityPaused'));
    $('sim-quality').dataset.state = stale ? 'invalid' : state.telemetry ? 'valid' : 'paused';
    const age = Math.max(0, Math.floor((now - state.lastReportAt) / 1000));
    putText($('sim-report-age'), tr(state.telemetry ? 'reportLive' : 'reportAge', {seconds: age}));
    putText($('sim-direction'), tr(state.reported > .05 ? 'feedbackDischarge' : state.reported < -.05 ? 'feedbackCharge' : 'feedbackZero'));
    putText($('sim-monitor-note'), tr(stale ? 'monitorStale' : !state.telemetry ? 'monitorPaused' : 'monitorLive'));
    $('sim-model-note').hidden = state.telemetry;
    putText($('sim-model-note'), tr('modelNote', {power: signed(state.actual)}));
    setBar('sim-target-bar', state.reportedTarget);
    setBar('sim-actual-bar', state.reported);
  }

  function tick() {
    const now = performance.now();
    const dt = Math.min((now - lastTick) / 1000, .5);
    lastTick = now;
    const delta = state.target - state.actual;
    if (Math.abs(delta) > .001) state.actual += Math.sign(delta) * Math.min(Math.abs(delta), dt * 2);
    if (state.pending && now - state.pending.at >= 900) resolveCommand(now);
    if (state.telemetry) {
      state.reported = state.actual;
      state.reportedTarget = state.target;
      state.lastReportAt = now;
    }
    const stale = isStale(now);
    if (stale && !state.invalid) {
      state.invalid = true;
      if (!state.pending) message('expired', {}, 'warning', '!');
    } else if (!stale) state.invalid = false;
    if (state.phase === 'tracking' && Math.abs(state.actual - state.target) < .001 && state.telemetry) {
      state.phase = 'done';
      message('done', {power: signed(state.target)}, 'success', '✓');
    }
    render(now);
  }

  slider.addEventListener('input', updateSlider);
  sendButton.addEventListener('click', send);
  $('sim-reset').addEventListener('click', () => reset());
  remoteSwitch.addEventListener('change', () => {
    state.remote = remoteSwitch.checked;
    if (!state.pending) message(state.remote ? 'remoteOn' : 'remoteOff', {}, state.remote ? 'neutral' : 'warning');
    render(performance.now());
  });
  telemetrySwitch.addEventListener('change', () => {
    state.telemetry = telemetrySwitch.checked;
    if (state.telemetry) {
      state.lastReportAt = performance.now();
      state.reported = state.actual;
      state.reportedTarget = state.target;
      state.invalid = false;
      message('telemetryOn', {}, 'success', '✓');
    } else message('telemetryOff');
    render(performance.now());
  });
  scenarios.forEach(button => button.addEventListener('click', () => {
    const scenario = button.dataset.scenario;
    reset(scenario);
    if (scenario === 'normal') {
      send();
    } else if (scenario === 'local') {
      state.remote = false;
      remoteSwitch.checked = false;
      send();
    } else {
      state.target = 5;
      state.actual = 2;
      state.reported = 2;
      state.reportedTarget = 5;
      state.telemetry = false;
      telemetrySwitch.checked = false;
      message('interrupted');
      render(performance.now());
    }
  }));
  window.addEventListener('iec-language-change', () => {
    applyTranslations(mount, simulationMessages, 'sim');
    updateSlider();
    renderMessage();
    render(performance.now());
  });
  window.addEventListener('iec-motion-change', event => {
    pausedMotion = Boolean(event.detail?.paused);
    shell.classList.toggle('sim-motion-off', pausedMotion);
  });
  reducedMotion.addEventListener('change', event => {
    pausedMotion = event.matches;
    shell.classList.toggle('sim-motion-off', pausedMotion);
  });
  applyTranslations(mount, simulationMessages, 'sim');
  reset();
  let ticker = setInterval(tick, 200);
  window.addEventListener('pagehide', () => clearInterval(ticker));
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      lastTick = performance.now();
      ticker = setInterval(tick, 200);
    }
  });
}
