// Toolbar popup: the extension's few settings, plus links to the pages that hold the rest.
import { LANGS, ready, t } from './i18n.js';

const HOURS = [0, 12, 24, 72, 168];
const $ = (id) => document.getElementById(id);
const opt = (value, label, on) => Object.assign(document.createElement('option'), { value, textContent: label, selected: on });

async function render() {
  await ready;
  const { lang = 'auto', archiveHours = 12 } = await chrome.storage.local.get(['lang', 'archiveHours']);
  document.documentElement.lang = lang === 'auto' ? chrome.i18n.getUILanguage() : lang;
  $('l-lang').textContent = t('language');
  $('l-cleanup').textContent = t('cleanup');
  // Language names stay in their own language so anyone can find theirs.
  $('lang').replaceChildren(opt('auto', t('followChrome'), lang === 'auto'), ...Object.entries(LANGS).map(([v, name]) => opt(v, name, v === lang)));
  $('hours').value = Math.max(0, HOURS.indexOf(archiveHours));
  $('when').textContent = archiveHours ? t('dur', archiveHours) : t('never');
  $('hours').setAttribute('aria-valuetext', $('when').textContent);
  document.querySelector('.ticks').firstElementChild.textContent = t('off');
  $('shortcuts').textContent = t('shortcuts');
  $('import').textContent = t('importArc');
  $('guide').textContent = t('guide');
}

$('lang').onchange = (e) => chrome.storage.local.set({ lang: e.target.value });
// Registered after i18n.js's own listener, so the language has already switched when this runs.
chrome.storage.onChanged.addListener((c) => (c.lang || c.archiveHours) && render());
$('hours').oninput = (e) => chrome.storage.local.set({ archiveHours: HOURS[e.target.value] });
const go = (url) => () => chrome.tabs.create({ url }).then(() => close());
$('shortcuts').onclick = go('chrome://extensions/shortcuts');
$('import').onclick = go('onboarding.html#import');
$('guide').onclick = go('onboarding.html');

render();
