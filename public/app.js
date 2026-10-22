import { getLanguage, t, applyTranslations } from './i18n.js';
import { pageMessages } from './page-copy.js';

const copy = (key) => t(pageMessages, key);
const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
let paused = motionMedia.matches;
const motionButton = document.getElementById('motion-toggle');
function updateMotion() {
  document.body.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  document.getElementById('motion-label').textContent = copy(paused ? 'motion.resume' : 'motion.pause');
  motionButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
  window.dispatchEvent(new CustomEvent('iec-motion-change', {detail: {paused}}));
}
motionButton.addEventListener('click', () => { paused = !paused; updateMotion(); });
motionMedia.addEventListener('change', e => { paused = e.matches; updateMotion(); });

let selectedConcept = 'measure';
let selectedDevice = 'substation';
function wireTabs(selector, onSelect) {
  const tabs = [...document.querySelectorAll(selector)];
  function select(tab) {
    for (const t of tabs) { const active = t === tab; t.setAttribute('aria-selected', String(active)); t.tabIndex = active ? 0 : -1; }
    onSelect(tab);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      let next;
      if(e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if(e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if(e.key === 'Home') next = 0;
      if(e.key === 'End') next = tabs.length - 1;
      if(next !== undefined) { e.preventDefault(); select(tabs[next]); tabs[next].focus(); }
    });
  });
}
function renderConcept() {
  for(const field of ['direction','number','unit','title','copy','example']) {
    document.getElementById(`concept-${field}`).textContent = copy(`concept.${selectedConcept}.${field}`);
  }
  document.getElementById('language-panel').setAttribute('aria-labelledby', `tab-${selectedConcept}`);
}
wireTabs('[data-concept]', tab => { selectedConcept = tab.dataset.concept; renderConcept(); });

const svgStart = '<svg viewBox="0 0 470 270" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#8da884" stroke-width="1"><path d="M40 223h390M60 238h350"/><path stroke-dasharray="3 9" d="M30 54h410M30 78h410M30 102h410M30 126h410M30 150h410M30 174h410"/></g>';
const diagrams = {
  substation: svgStart + '<g fill="#f5f7f0" stroke="#315d47" stroke-width="2"><path d="m95 218 26-156 27 156M103 166h37m-31-33h26m-22-30h18M121 63v-18m-31 36h63M90 81l9 15m53-15-9 15"/><rect x="195" y="144" width="86" height="74" rx="5"/><path d="M207 144v-24m15 24v-24m15 24v-24m15 24v-24m15 24v-24M203 130h68"/><path d="M216 164v35m13-35v35m13-35v35m13-35v35"/><rect x="321" y="157" width="61" height="61" rx="3"/><path d="M332 172h37m-37 12h37m-37 12h19"/><path d="M147 95h90v25M281 187h40"/></g><rect x="324" y="161" width="55" height="10" fill="#d2f35a"/><circle cx="121" cy="62" r="5" fill="#167556"/><circle cx="237" cy="95" r="5" fill="#167556"/><g fill="#56724f" font-family="sans-serif" font-size="10"><text x="121" y="252" text-anchor="middle" data-page="device.diagram.lines">线路与开关</text><text x="238" y="252" text-anchor="middle" data-page="device.diagram.protection">测控装置</text><text x="351" y="252" text-anchor="middle" data-page="device.diagram.rtu">远动终端</text></g></svg>',
  renewable: svgStart + '<g fill="#f5f7f0" stroke="#315d47" stroke-width="2"><path d="m62 162-17 46h142l-20-46zm-7 15h118m-123 15h130m-90-30-8 46m37-46v46m29-46 8 46m-55 0v16m51-16v16"/><path d="M268 110v114m-8 0h17M268 110l-7-72 10-6 5 77M268 110l-62 44-9-8 65-43M268 110l61 37 3 11-69-39"/><circle cx="268" cy="110" r="9"/><path d="M380 132v92m-8 0h17M380 132l-5-49 7-5 5 53M380 132l-44 29-7-5 47-30M380 132l41 26 3 9-48-29"/><circle cx="380" cy="132" r="7"/></g><circle cx="99" cy="88" r="20" fill="#d2f35a"/><g stroke="#8da884"><path d="M99 55v-8m0 82v-8m33-33h8m-82 0h8m10-23-6-6m46 46 6 6m-46-6-6 6m46-46 6-6"/></g><g fill="#56724f" font-family="sans-serif" font-size="10"><text x="76" y="252" data-page="device.diagram.solar">光伏阵列</text><text x="295" y="252" data-page="device.diagram.wind">风力发电</text></g></svg>',
  storage: svgStart + '<g fill="#f5f7f0" stroke="#315d47" stroke-width="2"><rect x="69" y="105" width="89" height="116" rx="6"/><path d="M95 105v-9h37v9"/><rect x="183" y="105" width="89" height="116" rx="6"/><path d="M209 105v-9h37v9"/><rect x="323" y="145" width="71" height="76" rx="4"/><path d="M335 161h47m-47 13h47m-47 13h30M272 191h51"/></g><rect x="79" y="163" width="69" height="48" rx="2" fill="#d2f35a"/><rect x="193" y="163" width="69" height="48" rx="2" fill="#d2f35a"/><g fill="#167556"><path d="m119 121-15 24h14l-8 21 23-28h-16zm114 0-15 24h14l-8 21 23-28h-16z"/><circle cx="377" cy="203" r="4"/></g><path d="M114 81v-18h244v68" fill="none" stroke="#8da884" stroke-width="2" stroke-dasharray="5 5"/><g fill="#56724f" font-family="sans-serif" font-size="10"><text x="118" y="252" data-page="device.diagram.battery">电池系统与 BMS</text><text x="327" y="252" data-page="device.diagram.station">站端控制</text></g></svg>'
};

const deviceSources = {
  substation: 'https://www.hitachienergy.com/products-and-solutions/substation-automation-protection-and-control/products/remote-terminal-units',
  renewable: 'https://files.sma.de/downloads/PPC-A5-BE-en-23.pdf',
  storage: 'https://dbba.sacinfo.org.cn/portal/online/61444bec80020f517599478e2789dd68a250133acdc5f5fb6605629488083bda'
};
function renderDevice() {
  for(const field of ['label','title','copy']) document.getElementById(`device-${field}`).textContent = copy(`device.${selectedDevice}.${field}`);
  const illustration = document.getElementById('device-illustration');
  illustration.innerHTML = diagrams[selectedDevice];
  applyTranslations(illustration, pageMessages, 'page');
  const tags = document.getElementById('device-tags');
  tags.replaceChildren(...[1,2,3].map(index => {
    const el = document.createElement('span');
    el.textContent = copy(`device.${selectedDevice}.tag${index}`);
    return el;
  }));
  const link = document.getElementById('device-source');
  link.href = deviceSources[selectedDevice];
  link.textContent = copy(`device.${selectedDevice}.source`);
  document.getElementById('device-panel').setAttribute('aria-labelledby', `device-tab-${selectedDevice}`);
}
wireTabs('[data-device]', tab => { selectedDevice = tab.dataset.device; renderDevice(); });

function renderLanguage() {
  applyTranslations(document, pageMessages, 'page');
  renderConcept();
  renderDevice();
  updateMotion();
  // Metadata follows the selected language, while the shared canonical remains stable.
  document.querySelector('meta[property="og:url"]').content = `https://104.atiwatt.com/?lang=${getLanguage()}`;
}
window.addEventListener('iec-language-change', renderLanguage);
renderLanguage();
