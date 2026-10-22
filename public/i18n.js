export const supportedLanguages = Object.freeze(['zh', 'en']);
const storageKey = 'iec104-language';

export function resolveLanguage(search = '', saved = null) {
  const requested = new URLSearchParams(search).get('lang');
  if (supportedLanguages.includes(requested)) return requested;
  if (supportedLanguages.includes(saved)) return saved;
  return 'zh';
}

export function interpolate(template, parameters = {}) {
  return template.replace(/\{([a-zA-Z][\w]*)\}/g, (match, key) => {
    if (!Object.hasOwn(parameters, key)) throw new Error(`Missing translation parameter: ${key}`);
    return String(parameters[key]);
  });
}

function readSavedLanguage() {
  try { return window.localStorage.getItem(storageKey); }
  catch { return null; }
}

const inBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
let language = inBrowser ? resolveLanguage(window.location.search, readSavedLanguage()) : 'zh';

export function getLanguage() { return language; }

export function t(messages, key, parameters = {}) {
  const template = messages[language]?.[key];
  if (typeof template !== 'string') throw new Error(`Missing ${language} translation: ${key}`);
  return interpolate(template, parameters);
}

// All HTML translations are authored locally. Never interpolate visitor input into them.
export function applyTranslations(root, messages, prefix = 'i18n') {
  if (!/^[a-z][\w-]*$/.test(prefix)) throw new Error('Invalid translation attribute prefix');
  const operations = [
    ['', 'textContent'], ['-html', 'innerHTML'],
    ['-aria-label', 'aria-label'], ['-title', 'title'], ['-content', 'content'],
  ];
  for (const [suffix, target] of operations) {
    const attribute = `data-${prefix}${suffix}`;
    const elements = [...root.querySelectorAll(`[${attribute}]`)];
    if (root.nodeType === 1 && root.hasAttribute(attribute)) elements.unshift(root);
    for (const element of elements) {
      const value = t(messages, element.getAttribute(attribute));
      if (target === 'textContent' || target === 'innerHTML') {
        if (element[target] !== value) element[target] = value;
      } else if (element.getAttribute(target) !== value) {
        element.setAttribute(target, value);
      }
    }
  }
}

function updateLanguageControls() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  for (const button of document.querySelectorAll('[data-language]')) {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  }
}

export function setLanguage(next, { persist = true, updateUrl = true } = {}) {
  if (!supportedLanguages.includes(next)) return false;
  const changed = language !== next;
  language = next;
  if (!inBrowser) return true;
  if (persist) {
    try { window.localStorage.setItem(storageKey, language); } catch { /* Preference storage is optional. */ }
  }
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', language);
    window.history.replaceState(window.history.state, '', url);
  }
  updateLanguageControls();
  if (changed) window.dispatchEvent(new CustomEvent('iec-language-change', { detail: { language } }));
  return true;
}

if (inBrowser) {
  updateLanguageControls();
  for (const button of document.querySelectorAll('[data-language]')) {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  }
  window.addEventListener('popstate', () => {
    setLanguage(resolveLanguage(window.location.search, readSavedLanguage()), { persist: false, updateUrl: false });
  });
}
