// First-run walkthrough. Each step asks for one real action; the page watches the browser and ticks the step
// off by itself wherever an extension is able to know (shortcuts, pinned tabs, the 🧲 group, the overlay).
import { MARK, parseArc } from './lib.js';

const app = document.getElementById('app');
const state = { step: 0, sidebar: false, keys: {}, pinned: false, space: false, search: false, arc: null, pick: {}, dest: {}, imported: null, err: '' };

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
    body: () => `<h1>Welcome to arc-next</h1>
      <p>It brings some of the Arc experience back to Chrome.</p>
      <p class="note">Setup takes about two minutes.</p>`,
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
      <p>Chrome's own vertical tabs are your sidebar.</p>
      <ol><li>Right-click the tab strip at the top of the window.</li><li>Choose <b>Show Tabs Vertically</b>.</li></ol>
      <p class="note">For Arc's <kbd>⌘S</kbd>: in System Settings → Keyboard → Keyboard Shortcuts → App Shortcuts, give Chrome's <b>Collapse Tabs</b> and <b>Expand Tabs</b> both <kbd>⌘S</kbd>.</p>`,
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
      ${check(state.keys.expand, 'Open Peek as a Tab', esc(state.keys.expand), 'Optional, ⌘O')}
      <p class="note">Click the pencil next to each command, then press the keys.</p>`,
  },

  {
    drop: true,
    next: () => (state.imported ? 'Continue' : 'Import'),
    skip: () => !state.imported,
    done: () => !!state.imported || jobs().length > 0,
    onNext: async () => {
      if (state.imported) return;
      state.imported = await importArc();
      return false; // stay here to show the result
    },
    art: () => {
      if (!state.arc)
        return `<label class="drop"><input type="file" id="file" accept=".json,.md" hidden><b>Drop the file here</b><span>or click to choose it</span>${
          state.err ? `<span class="err">${esc(state.err)}</span>` : ''
        }</label>`;
      const off = state.imported ? 'disabled' : '';
      return `<div class="arc">${state.arc.spaces
        .map(
          (sp, i) => `<label class="sp"><input type="checkbox" data-space="${i}" ${state.pick[i] ? 'checked' : ''} ${off}>${esc(sp.title)}</label>
          ${sp.sections
            .map(
              (sec, j) => `<div class="sec${state.pick[i] ? '' : ' off'}"><span>${esc(sec.path.join('/') || LABEL[sec.kind])}</span><i>${sec.urls.length}</i>
              <select data-sec="${i}:${j}" aria-label="Where it goes" ${state.pick[i] ? off : 'disabled'}>${Object.entries(DEST)
                .map(([v, label]) => `<option value="${v}" ${dest(i, j) === v ? 'selected' : ''}>${label}</option>`)
                .join('')}</select></div>`,
            )
            .join('')}`,
        )
        .join('')}</div>`;
    },
    body: () => `<h1>Bring your Arc sidebar over</h1>
      <p>Favorites become pinned tabs. Spaces and folders become ${MARK} groups.</p>
      ${
        state.imported
          ? check(true, 'Your Arc pages are in the sidebar', `${state.imported.tabs} tabs`, '')
          : state.arc
            ? `<p>Tick the Spaces that belong in this Chrome profile, then choose where each part goes. Nothing changes until you press Import.</p>
              ${state.arc.md ? '<p class="note">In this file, Favorites also includes pinned and Today tabs that were not in a folder. Arc exports them together.</p>' : ''}
              ${state.arc.skipped ? `<p class="note">${state.arc.skipped === 1 ? '1 link that is not a web page was' : `${state.arc.skipped} links that are not web pages were`} left out.</p>` : ''}
              <button class="link" type="button" id="refile">Choose another file</button>`
            : `<ol><li>Click the box, then press <kbd>⌘⇧G</kbd> in the file picker.</li>
              <li>Paste this path and press Enter: <button class="link" type="button" id="copy">Copy path</button><br><code>${ARC_FILE}</code></li></ol>
              <p class="note">On Windows, or if that file is gone: in Arc, open Settings → Advanced → Export Data, and drop <b>Arc Data Export.md</b> here instead.</p>`
      }`,
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
        <li>Press <kbd>⌘W</kbd>. It resets instead of closing.</li><li>Click a link to another site. It opens in a floating window; click back to dismiss it.</li></ol>`
          : '<p class="note">Open any site in another tab and pin it.</p>'
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
    next: 'Done',
    skip: true,
    extra: '<button class="link" type="button" id="pip">Open the setting ↗</button>',
    art: () =>
      win(
        rail(`${pins(true)}<div class="grp">${MARK} Space</div><div class="indent">${tab('Docs')}</div>${tab('Video', true)}`) +
          page('<div class="mini"></div>'),
      ),
    body: () => `<h1>Keep videos in a mini player</h1>
      <p>Chrome can move a playing video into a small window when you switch tabs, and put it back when you return. It is off until you allow it.</p>
      <ol><li>Open the setting.</li><li>Choose <b>Sites can enter picture-in-picture automatically</b>.</li></ol>`,
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
      <div class="warn">Today tabs left unused for 12 hours are closed automatically. <kbd>⌘⇧T</kbd> brings them back.</div>`,
  },
];

// Show the shortcut the user actually chose; fall back to the suggested one until it is set.
function key(name, suggested) {
  return `<kbd>${esc(state.keys[name] || suggested)}</kbd>`;
}

// ── Arc import ──
const ARC_FILE = '~/Library/Application Support/Arc/StorableSidebar.json';
const LABEL = { favorites: 'Favorites', pinned: 'Pinned', today: 'Today' };
const DEST = { pin: 'Pinned tabs', group: `${MARK} group`, skip: 'Skip' };
const dest = (i, j) => state.dest[`${i}:${j}`] || { favorites: 'pin', today: 'skip' }[state.arc.spaces[i].sections[j].kind] || 'group';

// What Import would do right now: [{ pin, title, folder, urls }], one entry per section that is not skipped.
function jobs() {
  if (!state.arc) return [];
  return state.arc.spaces.flatMap((sp, i) =>
    state.pick[i]
      ? sp.sections.flatMap((sec, j) =>
          dest(i, j) === 'skip'
            ? []
            : [{ pin: dest(i, j) === 'pin', title: [`${MARK} ${sp.title}`, ...sec.path].join('/'), folder: sec.kind === 'folder', urls: sec.urls }],
        )
      : [],
  );
}

async function load(file) {
  try {
    const text = await file.text();
    state.arc = { ...parseArc(text), md: !text.trimStart().startsWith('{') };
    state.pick = { 0: state.arc.spaces.length === 1 }; // with several Spaces, the user says which ones live in this profile
    state.dest = {};
    state.err = '';
  } catch {
    state.err = 'That does not look like an Arc file.';
  }
  render();
}

// Imported tabs load once, so the sidebar shows a title and an icon, and are then put to sleep.
const loading = new Set();
chrome.tabs.onUpdated.addListener((id, info) => {
  if (info.status === 'complete' && loading.delete(id)) setTimeout(() => chrome.tabs.discard(id).catch(() => {}), 2000);
});

async function importArc() {
  const { windowId } = await chrome.tabs.getCurrent();
  // Pages that are already pinned or in a 🧲 group (background.js keeps their URLs) are not opened twice.
  const have = new Set(Object.values((await chrome.storage.session.get('locks')).locks || {}));
  const fresh = (urls) => urls.filter((u) => !have.has(u) && have.add(u));
  let count = 0;
  const open = async (url, pinned) => {
    const t = await chrome.tabs.create({ url, pinned, windowId, active: false });
    count++;
    loading.add(t.id);
    return t.id;
  };
  const todo = jobs();
  for (const job of todo.filter((x) => x.pin)) for (const url of fresh(job.urls)) await open(url, true);

  const groups = new Map(); // sections with the same title share one group
  for (const job of todo.filter((x) => !x.pin)) {
    const g = groups.get(job.title) || { folder: job.folder, urls: [] };
    g.urls.push(...job.urls);
    groups.set(job.title, g);
  }
  const existing = await chrome.tabGroups.query({ windowId });
  const pinned = (await chrome.tabs.query({ windowId, pinned: true })).length;
  // Each new group goes to the top of the strip, so walk them backwards to end up in Arc's order.
  for (const [title, g] of [...groups].reverse()) {
    const tabIds = [];
    for (const url of fresh(g.urls)) tabIds.push(await open(url, false));
    if (!tabIds.length) continue;
    const old = existing.find((x) => x.title === title);
    if (old) {
      await chrome.tabs.group({ tabIds, groupId: old.id });
      continue;
    }
    const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId } });
    await chrome.tabGroups.update(groupId, { title, collapsed: g.folder });
    await chrome.tabGroups.move(groupId, { index: pinned });
  }
  return { tabs: count };
}

app.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'file') return t.files[0] && load(t.files[0]);
  if (t.dataset.space) state.pick[t.dataset.space] = t.checked;
  if (t.dataset.sec) state.dest[t.dataset.sec] = t.value;
  render();
});
// Always cancel the default, or dropping a file anywhere on the page would navigate away from the walkthrough.
addEventListener('dragover', (e) => e.preventDefault());
addEventListener('drop', (e) => {
  e.preventDefault();
  if (STEPS[state.step].drop && !state.imported && e.dataTransfer.files[0]) load(e.dataTransfer.files[0]);
});

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
      <button class="primary" type="button" id="next" ${waiting ? 'disabled' : ''}>${typeof s.next === 'function' ? s.next() : s.next}</button>
      ${s.extra || ''}
      ${(typeof s.skip === 'function' ? s.skip() : s.skip && (waiting || !s.done)) ? '<button class="ghost" type="button" id="skip">Skip</button>' : ''}
    </div>`;
  if (html === last) return; // nothing changed: keep focus and avoid flicker while polling
  last = html;
  const scroll = app.querySelector('.arc')?.scrollTop;
  app.innerHTML = html;
  if (scroll) app.querySelector('.arc')?.scrollTo(0, scroll);
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
    document.getElementById('next').disabled = true; // an import takes a moment; no double clicks
    if ((await s.onNext?.()) === false) return render();
    go(state.step + 1);
  });
  on('copy', () => navigator.clipboard.writeText(ARC_FILE));
  on('refile', () => {
    state.arc = null;
    render();
  });
  on('pip', () => chrome.tabs.create({ url: 'chrome://settings/content/autoPictureInPicture' }));
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
setInterval(detect, 1000); // shortcut changes fire no event, so poll; pins and groups ride along

render();
detect();
