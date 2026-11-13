// A tab group whose title starts with this mark is managed by arc-next: its tabs behave like Arc's pinned
// tabs. The mark lives in the title, so it survives restarts and the user can add or remove it by renaming.
export const MARK = '🧲';

export const host = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

// Take one same-host URL out of the orphans (pinned URLs that currently have no tab); null if none. Mutates orphans.
export function claim(orphans, url) {
  const h = host(url);
  const i = h ? orphans.findIndex((u) => host(u) === h) : -1;
  return i >= 0 ? orphans.splice(i, 1)[0] : null;
}

// Tab ids change across restarts: match the saved pinned URLs back to the current pinned tabs by host.
// A tab with no match is locked to its current URL; unclaimed URLs stay in orphans until their tab is restored.
export function assign(saved, tabs) {
  const orphans = [...saved];
  const locks = {};
  for (const t of tabs) {
    const url = t.pendingUrl || t.url;
    if (url) locks[t.id] = claim(orphans, url) || url;
  }
  return { locks, orphans };
}

// Has this tab gone unused for maxAge ms? The tab being viewed and tabs playing audio never count as idle,
// and a tab with no access time is left alone.
export const idle = (t, now, maxAge) => !t.active && !t.audible && t.lastAccessed > 0 && now - t.lastAccessed >= maxAge;

// Idle tabs in Arc's "Today" area: not pinned and not in any group.
export const stale = (tabs, now, maxAge) => tabs.filter((t) => !t.pinned && t.groupId === -1 && idle(t, now, maxAge));

// ---- Search overlay ranking ----
// A port of how Chromium's address bar scores history (the results Arc's command bar is built on too).
// Source: chromium/src/components/omnibox/browser/scored_history_match.cc and shortcuts_provider.cc,
// Copyright The Chromium Authors, BSD-3-Clause (see LICENSE). All constants are its defaults.

const WORD = /[\p{L}\p{N}]/u;
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
// Word start: the previous character is not a letter or digit. CJK text has no spaces, so every CJK character counts.
const wordStart = (s, i) => WORD.test(s[i] || '') && (i === 0 || !WORD.test(s[i - 1]) || CJK.test(s[i]));

// Every occurrence of every query term in text, sorted by offset.
function occurrences(terms, text) {
  const out = [];
  terms.forEach((term, t) => {
    for (let i = text.indexOf(term); i >= 0; i = text.indexOf(term, i + term.length)) out.push({ t, i, len: term.length });
  });
  return out.sort((a, b) => a.i - b.i);
}

// Topicality: each term scores by where it matches (host word start 10, mid-word in host 2, path 8, query 5,
// title 8); scores are mapped through a curve and averaged.
// Matches in the path, query and title must be at a word start or continue the previous match
// ("stack overflow" matches "stackoverflow").
export function topicality(terms, url, title) {
  const u = url.toLowerCase().replace(/^[a-z][a-z\d+.-]*:\/\/(www\.)?/, '');
  const t = (title || '').toLowerCase();
  if (!terms.length || !terms.every((x) => u.includes(x) || t.includes(x))) return 0;
  const pathPos = u.indexOf('/') < 0 ? u.length : u.indexOf('/');
  const q = u.slice(pathPos).search(/[?#]/);
  const queryPos = q < 0 ? u.length : pathPos + q;
  const tldPos = u.lastIndexOf('.', pathPos);
  const scores = terms.map(() => 0);

  let lastEnd = -1;
  for (const m of occurrences(terms, u)) {
    const start = wordStart(u, m.i);
    if (m.i >= pathPos && !start && m.i !== lastEnd) continue;
    lastEnd = m.i + m.len;
    scores[m.t] += m.i >= queryPos ? 5 : m.i >= pathPos ? 8 : tldPos >= 0 && m.i > tldPos ? 0 : start ? 10 : 2;
  }
  lastEnd = -1;
  let words = 0,
    scanned = 0;
  for (const m of occurrences(terms, t)) {
    for (; scanned <= m.i; scanned++) if (wordStart(t, scanned)) words++;
    if (words > 20) break; // only the first 20 title words count
    if (!wordStart(t, m.i) && m.i !== lastEnd) continue;
    lastEnd = m.i + m.len;
    scores[m.t] += 8;
  }
  const curve = (s) => (s < 10 ? 0.1 * s : 1 + 2.25 * Math.log10(0.1 * s));
  const avg = scores.reduce((a, s) => a + curve(Math.min(s, 29)), 0) / terms.length;
  return avg < 0.5 ? 0 : avg;
}

// Weight of one visit by how many days ago it happened.
export function recency(days) {
  const d = Math.max(0, Math.floor(days));
  const pts =
    d <= 4
      ? 100
      : d <= 14
        ? 70 + (14 - d) * 3
        : d <= 31
          ? 50 + ((31 - d) * 20) / 17
          : d <= 90
            ? 30 + ((90 - d) * 20) / 60
            : 10 + ((365 - Math.min(d, 365)) * 10) / 275;
  return pts / 100;
}

// Frequency: weighted sum of the last 10 visits. A typed visit counts 1.5; every visit to a bookmarked page counts 10.
// visits: [{ time, typed }], newest first.
export function frequency(visits, bookmarked, now) {
  return visits.slice(0, 10).reduce((sum, v) => sum + Math.max(v.typed ? 1.5 : 1, bookmarked ? 10 : 0) * recency((now - v.time) / 864e5), 0);
}

// The fewer pages match, the more each one is worth.
export const specificity = (n) => (n <= 1 ? 3 : n === 2 ? 2.5 : n === 3 ? 2 : n === 4 ? 1.5 : 1);

// The product of the three maps onto 550–1399. "Search what you typed" is fixed at 1300, so only pages you
// visit often rank above it.
export function relevance(x) {
  const B = [
    [0, 550],
    [1, 625],
    [9, 1300],
    [90, 1399],
  ];
  if (x <= 0) return 0;
  for (let i = 1; i < B.length; i++) {
    if (x < B[i][0]) return B[i - 1][1] + ((B[i][1] - B[i - 1][1]) * (x - B[i - 1][0])) / (B[i][0] - B[i - 1][0]);
  }
  return 1399;
}

// Learned shortcuts ("typed this, picked that"): the closer the input is to the remembered text the higher the
// score; it halves every week, more slowly the more often it was used.
export function shortcutScore(typedLen, textLen, last, hits, now) {
  const typed = Math.sqrt(typedLen / (Math.max(textLen, typedLen + 10) - 10));
  const decay = 0.5 ** (Math.max((now - last) / (7 * 864e5), 0) / Math.min(0.8 + hits * 0.2, 5));
  return Math.round(typed * decay * 1199);
}

export const SEARCH_WHAT_YOU_TYPED = 1300; // when the input does not look like a URL
export const URL_WHAT_YOU_TYPED = 1200; // when it does; "search" then drops to 850
export const SEARCH_FOR_URL_INPUT = 850;

// Does the input look like a URL?
export const asUrl = (q) =>
  /^[a-z][a-z\d+.-]*:\/\/\S+$/i.test(q)
    ? q
    : /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/\S*)?$/i.test(q)
      ? (/^(localhost|\d+\.\d+\.\d+\.\d+)(:|\/|$)/i.test(q) ? 'http://' : 'https://') + q
      : null;
