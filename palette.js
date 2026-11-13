// ⌘T overlay, shown as a full-viewport iframe inside the current page. Candidates come from open tabs,
// bookmarks and history; ranking is the port of Chromium's address bar scoring in lib.js.
import * as R from './lib.js';

const input = document.getElementById('q');
const list = document.getElementById('list');
const icon = (id) => document.getElementById(id).content.firstElementChild.cloneNode(true);
const close = () => parent.postMessage('arc-next-close', '*');
// URL for display: no scheme, no www., no trailing slash.
const pretty = (u) => u.replace(/^[a-z][a-z\d+.-]*:\/\/(www\.)?/i, '').replace(/\/$/, '');

// One candidate per URL: { url, title, tab?, folder (is it bookmarked), visitCount, lastVisitTime }
async function load() {
  const [tabs, tree, history, win] = await Promise.all([
    chrome.tabs.query({}),
    chrome.bookmarks.getTree(),
    chrome.history.search({ text: '', startTime: 0, maxResults: 5000 }),
    chrome.windows.getCurrent(),
  ]);
  const byUrl = new Map();
  const at = (url) => byUrl.get(url) || byUrl.set(url, { url, title: '', visitCount: 0, lastVisitTime: 0 }).get(url);
  for (const h of history) Object.assign(at(h.url), { title: h.title, visitCount: h.visitCount, lastVisitTime: h.lastVisitTime });
  const walk = (node) => {
    if (node.url) {
      const c = at(node.url);
      c.folder = true;
      c.title ||= node.title;
    }
    for (const ch of node.children || []) walk(ch);
  };
  tree.forEach(walk);
  for (const t of tabs) {
    if (!/^https?:/.test(t.url || '')) continue;
    const c = at(t.url);
    if (!c.tab || (t.lastAccessed || 0) > (c.tab.lastAccessed || 0)) c.tab = t;
    c.title = t.title || c.title;
    c.here = c.here || (t.active && t.windowId === win.id);
  }
  return [...byUrl.values()];
}

const cands = await load();
const { shortcuts = {} } = await chrome.storage.local.get('shortcuts'); // { typed text: { url, title, hits, last } }
const visitCache = new Map();
const visitsOf = (url) =>
  visitCache.get(url) ||
  visitCache
    .set(
      url,
      chrome.history.getVisits({ url }).then((vs) => vs.map((v) => ({ time: v.visitTime, typed: v.transition === 'typed' })).sort((a, b) => b.time - a.time)),
    )
    .get(url);

const row = (c, score) => ({ kind: c.tab ? 'tab' : 'page', title: c.title || c.url, url: c.url, sub: c.tab ? '' : pretty(c.url), tab: c.tab, score });

async function compute(q) {
  const now = Date.now();
  // Empty input: the other open tabs, most recently used first.
  if (!q) {
    return cands
      .filter((c) => c.tab && !c.here)
      .sort((a, b) => (b.tab.lastAccessed || 0) - (a.tab.lastAccessed || 0))
      .slice(0, 8)
      .map((c) => row(c, 0));
  }
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = [];
  for (const c of cands) {
    const top = R.topicality(terms, c.url, c.title);
    if (top) hits.push({ c, top });
  }
  const spec = R.specificity(hits.length);
  // The exact frequency score needs a visit lookup per URL, so only do it for the top 40 of a rough ranking.
  const rough = ({ c, top }) => top * (Math.min(c.visitCount, 10) * R.recency((now - c.lastVisitTime) / 864e5) + (c.folder ? 1 : 0) + (c.tab ? 1 : 0));
  const short = hits.sort((a, b) => rough(b) - rough(a)).slice(0, 40);
  const scored = new Map();
  await Promise.all(
    short.map(async ({ c, top }) => {
      let visits = await visitsOf(c.url);
      // Open tab: count its last access as one more visit. Arc boosts recently used tabs, but its weights are not
      // available, so this is an approximation.
      if (c.tab?.lastAccessed) visits = [{ time: c.tab.lastAccessed, typed: false }, ...visits];
      // Bookmark that was never visited: treat it as visited once, long ago.
      const freq = visits.length ? R.frequency(visits, !!c.folder, now) : c.folder ? 10 * R.recency(365) : 0;
      scored.set(c.url, row(c, R.relevance(top * freq * spec)));
    }),
  );
  // Results picked earlier for the same text (or text this is a prefix of).
  const ql = q.toLowerCase();
  for (const [text, s] of Object.entries(shortcuts)) {
    if (!text.startsWith(ql)) continue;
    const score = R.shortcutScore(ql.length, text.length, s.last, s.hits, now);
    const c = cands.find((x) => x.url === s.url) || { url: s.url, title: s.title };
    if (score > (scored.get(s.url)?.score ?? 0)) scored.set(s.url, row(c, score));
  }
  const url = R.asUrl(q);
  const rows = [...scored.values()];
  if (url && !scored.has(url)) rows.push({ kind: 'url', title: pretty(url), url, sub: 'Open', score: R.URL_WHAT_YOU_TYPED });
  rows.push({ kind: 'search', title: q, sub: 'Search', score: url ? R.SEARCH_FOR_URL_INPUT : R.SEARCH_WHAT_YOU_TYPED });
  return rows.sort((a, b) => b.score - a.score).slice(0, 8);
}

let rows = [];
let sel = 0;
let seq = 0;

async function refresh() {
  const mine = ++seq;
  const next = await compute(input.value.trim());
  if (mine !== seq) return; // a newer keystroke has taken over
  rows = next;
  sel = 0;
  list.replaceChildren(
    ...rows.map((r, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      const ico = document.createElement('span');
      ico.className = 'ico';
      if (r.kind === 'search') ico.append(icon('i-search'));
      else ico.append(Object.assign(document.createElement('img'), { src: `/_favicon/?pageUrl=${encodeURIComponent(r.url)}&size=32` }));
      const txt = document.createElement('span');
      txt.className = 'txt';
      txt.textContent = r.title;
      if (r.sub) txt.append(Object.assign(document.createElement('span'), { className: r.url && r.kind !== 'url' ? 'sub' : 'sub plain', textContent: r.sub }));
      li.append(ico, txt);
      if (r.tab) {
        const act = document.createElement('span');
        act.className = 'act';
        act.append('Switch to Tab', icon('i-arrow'));
        li.append(act);
      }
      li.onmousemove = () => {
        if (sel !== i) {
          sel = i;
          mark();
        }
      };
      li.onclick = () => open(r);
      return li;
    }),
  );
  mark();
}

function mark() {
  for (const [i, li] of [...list.children].entries()) li.setAttribute('aria-selected', i === sel);
  list.children[sel]?.scrollIntoView({ block: 'nearest' });
}

async function open(r) {
  if (!r) return;
  const q = input.value.trim().toLowerCase();
  if (q && r.url && r.kind !== 'url') {
    const old = shortcuts[q]?.url === r.url ? shortcuts[q] : { hits: 0 };
    shortcuts[q] = { url: r.url, title: r.title, hits: old.hits + 1, last: Date.now() };
    const keep = Object.entries(shortcuts)
      .sort((a, b) => b[1].last - a[1].last)
      .slice(0, 500);
    await chrome.storage.local.set({ shortcuts: Object.fromEntries(keep) });
  }
  if (r.tab) {
    await chrome.tabs.update(r.tab.id, { active: true });
    await chrome.windows.update(r.tab.windowId, { focused: true });
  } else if (r.kind === 'search') {
    await chrome.search.query({ text: r.title, disposition: 'NEW_TAB' });
  } else {
    await chrome.tabs.create({ url: r.url });
  }
  close();
}

input.addEventListener('input', refresh);
addEventListener('keydown', (e) => {
  if (e.isComposing || e.keyCode === 229) return; // leave Enter and arrows to the IME while composing
  const step = e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n') ? 1 : e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p') ? -1 : 0;
  if (step) {
    e.preventDefault();
    if (rows.length) {
      sel = (sel + step + rows.length) % rows.length;
      mark();
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    open(rows[sel]);
  } else if (e.key === 'Escape') {
    close();
  }
});
document.body.addEventListener('mousedown', (e) => {
  if (e.target === document.body) close();
});

await refresh();
input.focus();
