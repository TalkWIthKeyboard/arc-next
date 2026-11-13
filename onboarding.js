// First-run walkthrough. Each step asks for one real action; the page watches the browser and ticks the step
// off by itself wherever an extension is able to know (shortcuts, pinned tabs, the 🧲 group, the overlay).
import { MARK } from './lib.js';

const app = document.getElementById('app');
const state = { step: 0, sidebar: false, keys: {}, pinned: false, space: false, search: false };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const tab = (label, hot) => `<div class="t${hot ? ' hot' : ''}">${label}</div>`;
const page = (inner = '') =>
  `<div class="page"><div class="ln" style="width:60%"></div><div class="ln"></div><div class="ln" style="width:85%"></div><div class="ln" style="width:70%"></div>${inner}</div>`;
const win = (inner, cls = '') => `<div class="win ${cls}" aria-hidden="true">${inner}</div>`;
const rail = (inner) => `<div class="rail">${inner}</div>`;
const hero = '<div class="hero"><img src="icons/icon256.png" alt=""></div>';
const pins = (on, hot) => `<div class="pins"><div class="pin${on ? ' on' : ''}${hot ? ' hot' : ''}"></div></div>`;
const check = (done, label, yes, no) => `<div class="check${done ? ' done' : ''}">${label}<span class="state">${done ? `✓ ${yes}` : no}</span></div>`;

const STEPS = [
  {
    next: 'Get started',
    art: () => hero,
    body: () => `<h1>Bring a bit of Arc back to Chrome</h1>
      <p>arc-next adds the few things Chrome is missing: a command bar, pages that stay put, and a Today area that cleans itself up.</p>
      <p class="note">Setup takes about two minutes. You will do each step once, right here.</p>`,
  },

  {
    next: 'Done',
    skip: true,
    onNext: () => {
      state.sidebar = true;
    },
    art: () =>
      state.sidebar
        ? win(rail(tab('Hacker News') + tab('Docs') + tab('Mail')) + page())
        : win(
            `<div class="tabs-top">${tab('')}${tab('')}${tab('')}</div>${page('<div class="menu"><span>New Tab</span><span class="hot">Show Tabs Vertically</span><span>Bookmark All Tabs…</span></div>')}`,
            'top-tabs',
          ),
    body: () => `<h1>Move your tabs to the side</h1>
      <p>Chrome's own vertical tabs are your sidebar. arc-next does not draw another one.</p>
      <ol><li>Right-click the tab strip at the top of the window.</li><li>Choose <b>Show Tabs Vertically</b>.</li></ol>`,
  },

  {
    next: 'Continue',
    skip: true,
    done: () => !!(state.keys.palette && state.keys.space),
    extra: '<button class="link" type="button" id="shortcuts">Open shortcut settings ↗</button>',
    art: () => win(rail(tab('Hacker News') + tab('Docs') + tab('Mail')) + page()),
    body: () => `<h1>Set two shortcuts</h1>
      <p>Chrome does not let an extension claim these keys by itself, so you set them once. We suggest <kbd>⌘T</kbd> and <kbd>⌘D</kbd>, the same as Arc.</p>
      ${check(state.keys.palette, 'Open Command Bar', esc(state.keys.palette), 'Not set yet')}
      ${check(state.keys.space, 'Pin/Unpin Tab in Space', esc(state.keys.space), 'Not set yet')}
      ${check(state.keys.reset, 'Reset Tab', esc(state.keys.reset), 'Not set yet')}
      <p class="note">Click the pencil next to each command, then press the keys. This page updates as soon as they are set.</p>`,
  },

  {
    next: 'Continue',
    skip: true,
    done: () => state.pinned,
    art: () => win(rail(pins(state.pinned, state.pinned) + (state.pinned ? '' : tab('Hacker News', true)) + tab('Docs') + tab('Mail')) + page()),
    body: () => `<h1>Pin a page you open every day</h1>
      <p>Pinned pages are your Favorites. arc-next keeps them where you left them.</p>
      ${check(state.pinned, 'Right-click a tab and choose <b>&nbsp;Pin</b>', 'Pinned', 'Waiting…')}
      ${
        state.pinned
          ? `<p>Now try it in a pinned tab:</p>
        <ol><li>Click around, then press ${key('reset', '⌃R')} to go back to the pinned page.</li>
        <li>Press <kbd>⌘W</kbd>. It resets instead of closing.</li><li>Click a link to another site. It opens in a new tab.</li></ol>`
          : '<p class="note">Open any site in another tab and pin it. This page notices when you do.</p>'
      }`,
  },

  {
    next: 'Continue',
    skip: true,
    done: () => state.space,
    art: () =>
      win(
        rail(
          pins(true) +
            (state.space ? `<div class="grp hot">${MARK} Space</div><div class="indent">${tab('Docs')}</div>${tab('Mail')}` : tab('Docs', true) + tab('Mail')),
        ) + page(),
      ),
    body: () => `<h1>Create your first Space</h1>
      <p>A Space holds the pages for one project. They stay put like Favorites, and everything else is Today.</p>
      ${check(state.space, `Go to any page and press ${key('space', '⌘D')}`, 'Space created', 'Waiting…')}
      ${
        state.space
          ? `<p class="note">Press ${key('space', '⌘D')} on other pages to add them, or drag tabs in. Press it again to take a page out. Rename the group freely, just keep the ${MARK}.</p>`
          : `<p class="note">A group named ${MARK} Space will appear at the top of your sidebar.</p>`
      }`,
  },

  {
    next: 'Continue',
    skip: true,
    done: () => state.search,
    art: () =>
      win(
        rail(`${pins(true)}<div class="grp">${MARK} Space</div><div class="indent">${tab('Docs')}</div>${tab('Mail')}`) +
          page(
            state.search
              ? '<div class="bar"><div class="in">doc</div><div class="r sel">Docs · Switch to Tab</div><div class="r">doc - Search</div></div>'
              : '',
          ),
      ),
    body: () => `<h1>Find anything with the Command Bar</h1>
      <p>Open tabs, bookmarks and history in one place, ranked the way Chrome's address bar ranks them.</p>
      ${check(state.search, `Press ${key('palette', '⌘T')} right now`, 'Opened', 'Waiting…')}
      <p class="note">Type a few letters and press Enter. <kbd>↑</kbd> <kbd>↓</kbd> to choose, <kbd>Esc</kbd> to close.</p>`,
  },

  {
    next: 'Start browsing',
    art: () => hero,
    onNext: async () => {
      const t = await chrome.tabs.getCurrent();
      if (t) chrome.tabs.remove(t.id);
    },
    body: () => `<h1>You're all set</h1>
      <p>${key('palette', '⌘T')} find &nbsp; ${key('space', '⌘D')} add to Space &nbsp; ${key('reset', '⌃R')} reset &nbsp; <kbd>⌘W</kbd> resets pinned pages</p>
      <div class="warn"><b>One thing to know:</b> tabs in Today that sit unused for 12 hours are closed automatically. They stay in your history, so <kbd>⌘⇧T</kbd> or a Command Bar search brings them back. Favorites and Space pages are never closed, only reset.</div>`,
  },
];

// Show the shortcut the user actually chose; fall back to the suggested one until it is set.
function key(name, suggested) {
  return `<kbd>${esc(state.keys[name] || suggested)}</kbd>`;
}

let last = '';
function render() {
  const s = STEPS[state.step];
  const waiting = s.done && !s.done();
  const html = `
    <div class="top"><img src="icons/icon128.png" alt=""><strong>arc-next</strong>
      <div class="dots" aria-label="Step ${state.step + 1} of ${STEPS.length}">${STEPS.map((_, i) => `<i class="${i <= state.step ? 'on' : ''}"></i>`).join('')}</div></div>
    <div class="stage"><div class="copy">${s.body()}</div><div>${s.art()}</div></div>
    <div class="actions">
      ${state.step > 0 ? '<button class="ghost" type="button" id="back">Back</button>' : ''}
      <button class="primary" type="button" id="next" ${waiting ? 'disabled' : ''}>${s.next}</button>
      ${s.extra || ''}
      ${s.skip && (waiting || !s.done) ? '<button class="ghost" type="button" id="skip">Skip</button>' : ''}
    </div>`;
  if (html === last) return; // nothing changed: keep focus and avoid flicker while polling
  last = html;
  app.innerHTML = html;
  const on = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.onclick = fn;
  };
  const go = (n) => {
    state.step = Math.max(0, Math.min(STEPS.length - 1, n));
    render();
  };
  on('back', () => go(state.step - 1));
  on('skip', () => go(state.step + 1));
  on('next', async () => {
    await s.onNext?.();
    go(state.step + 1);
  });
  on('shortcuts', () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }));
}

async function detect() {
  const [commands, pinned, groups] = await Promise.all([chrome.commands.getAll(), chrome.tabs.query({ pinned: true }), chrome.tabGroups.query({})]);
  state.keys = Object.fromEntries(commands.map((c) => [c.name, c.shortcut]));
  state.pinned = pinned.length > 0;
  state.space = groups.some((g) => g.title?.startsWith(MARK));
  render();
}

// The background asks this page to show the overlay exactly as it asks a web page (content.js handles it).
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.palette) {
    state.search = true;
    render();
  }
});
chrome.tabs.onUpdated.addListener((_, info) => {
  if (info.pinned !== undefined) detect();
});
chrome.tabGroups.onUpdated.addListener(detect);
chrome.tabGroups.onRemoved.addListener(detect);
setInterval(detect, 1000); // shortcut changes fire no event, so poll

render();
detect();
