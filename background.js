import { assign, claim, host, idle, MARK, stale } from './lib.js';

const isWeb = (url) => /^https?:/.test(url || '');
const managed = (groupId) =>
  groupId > -1
    ? chrome.tabGroups.get(groupId).then(
        (g) => (g.title?.startsWith(MARK) ? g : null),
        () => null,
      )
    : null;

// State: locks = { tabId: URL the tab is locked to } for guarded tabs (natively pinned, or in a managed group);
// homes = { tabId: { groupId, title, color } } for the ones in a group, so a closed tab can be put back;
// orphans = locked URLs that currently have no tab (window closed, or tabs not restored yet after a restart).
// All live in session storage, which survives service worker suspension; the URLs are also saved to local
// storage to be matched back by host after a restart.
async function getState() {
  const { locks, orphans = [], homes = {} } = await chrome.storage.session.get(['locks', 'orphans', 'homes']);
  if (locks) return { locks, orphans, homes };
  const { saved = [] } = await chrome.storage.local.get('saved');
  const [tabs, groups] = await Promise.all([chrome.tabs.query({}), chrome.tabGroups.query({})]);
  const mine = new Map(groups.filter((g) => g.title?.startsWith(MARK)).map((g) => [g.id, g]));
  const guarded = tabs.filter((t) => t.pinned || (mine.has(t.groupId) && isWeb(t.pendingUrl || t.url)));
  const state = assign(saved, guarded);
  state.homes = Object.fromEntries(
    guarded
      .filter((t) => !t.pinned && state.locks[t.id])
      .map((t) => [t.id, { groupId: t.groupId, title: mine.get(t.groupId).title, color: mine.get(t.groupId).color }]),
  );
  return save(state);
}

async function save(state) {
  state.orphans.splice(0, state.orphans.length - 50); // keep only the latest 50 so it cannot grow forever
  await chrome.storage.session.set(state);
  await chrome.storage.local.set({ saved: [...Object.values(state.locks), ...state.orphans] });
  return state;
}

// Serialize read-modify-write so events arriving together do not overwrite each other. fn returns false for "no change".
let chain = Promise.resolve();
const update = (fn) =>
  (chain = chain
    .then(async () => {
      const state = await getState();
      if ((await fn(state)) !== false) await save(state);
    })
    .catch(console.error));

const tell = (tabId, url) => chrome.tabs.sendMessage(tabId, { lockedHost: url ? host(url) : null }).catch(() => {});

// Bring one tab's lock in line with what the tab is right now. Runs for every event that can change it
// (created, pinned, moved between groups, URL appeared, group renamed) and always reads the tab fresh,
// because by the time an event is handled the tab may already have changed again.
function sync(tabId, claimOrphan) {
  return update(async ({ locks, orphans, homes }) => {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab) return false;
    const group = tab.pinned ? null : await managed(tab.groupId);
    if (!tab.pinned && !group) {
      if (!(tabId in locks)) return false;
      delete locks[tabId];
      delete homes[tabId];
      return void tell(tabId, null);
    }
    if (group) homes[tabId] = { groupId: group.id, title: group.title, color: group.color };
    else delete homes[tabId];
    if (tabId in locks) return;
    const url = tab.pendingUrl || tab.url;
    // A new tab page inside a group is locked later, once it goes to a real URL.
    if (!url || (group && !isWeb(url))) return;
    // A tab restored by Chrome claims its saved URL back; one the user just pinned or dragged in locks where it is.
    locks[tabId] = (claimOrphan && claim(orphans, url)) || url;
    tell(tabId, locks[tabId]);
  });
}

chrome.tabs.onCreated.addListener((tab) => {
  // A page opened from a grouped tab (link, window.open, ⌘-click) is born inside the same group. In a managed
  // group, move it out: like Arc, new pages open outside the pinned area. Tabs the user drags in later, and tabs
  // Chrome restores, are not born this way, so they stay.
  if (tab.groupId > -1 && tab.openerTabId != null) {
    update(async () => {
      if (await managed(tab.groupId)) await chrome.tabs.ungroup(tab.id).catch(() => {});
      return false;
    });
  }
  sync(tab.id, true);
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  // When a guarded tab closes, Chrome first reports it as unpinned / ungrouped (with index -1) and then fires
  // onRemoved. That is not the user's doing: ignore it, or the lock is gone before onRemoved can restore the tab.
  if (tab.index === -1) return;
  if (info.pinned !== undefined || info.groupId !== undefined) sync(tabId, false);
  else if (info.url) sync(tabId, true);
});

// Renaming a group can add or remove the mark.
chrome.tabGroups.onUpdated.addListener(async (group) => {
  for (const tab of await chrome.tabs.query({ groupId: group.id })) sync(tab.id, false);
});

chrome.tabs.onRemoved.addListener((tabId, { isWindowClosing, windowId }) => {
  update(async ({ locks, orphans, homes }) => {
    const url = locks[tabId];
    const home = homes[tabId];
    if (!url) return false;
    delete locks[tabId];
    delete homes[tabId];
    // Window closing or browser quitting: keep the URL as an orphan for the tab to claim when it comes back.
    if (isWindowClosing) return void orphans.push(url);
    // Guarded tabs cannot be closed: ⌘W only closes the current page. Reopen the tab in the same slot at its
    // locked URL. To really remove one, unpin it or move it out of the group first.
    // The slot comes from the newest "recently closed" entry, trusted only if it is the same kind of tab.
    const [last] = await chrome.sessions.getRecentlyClosed({ maxResults: 1 }).catch(() => []);
    const index = last?.tab && last.tab.pinned === !home ? last.tab.index : undefined;
    const tab = await chrome.tabs.create({ url, pinned: !home, windowId, index }).catch(() => null);
    if (!tab) return void orphans.push(url); // the window is gone: keep it as an orphan
    locks[tab.id] = url;
    if (!home) return;
    // Back into its group; if that was the group's last tab the group is gone too, so recreate it.
    home.groupId = await chrome.tabs.group({ tabIds: [tab.id], groupId: home.groupId }).catch(async () => {
      const id = await chrome.tabs.group({ tabIds: [tab.id], createProperties: { windowId } });
      await chrome.tabGroups.update(id, { title: home.title, color: home.color });
      return id;
    });
    homes[tab.id] = home;
  });
});

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

async function reset() {
  const tab = await activeTab();
  const url = tab && (await getState()).locks[tab.id];
  if (url && url !== tab.url) chrome.tabs.update(tab.id, { url });
}

async function relock() {
  const tab = await activeTab();
  if (!tab) return;
  update(({ locks }) => {
    if (!(tab.id in locks)) return false;
    locks[tab.id] = tab.url;
    tell(tab.id, tab.url);
  });
}

// Like Arc's ⌘D: put the current tab into this window's managed group, or take it out if it is already in one.
// The group is created on first use (Chrome has no empty groups, so it begins with this tab) at the top of the strip.
async function space() {
  const tab = await activeTab();
  if (!tab || tab.pinned) return;
  if (await managed(tab.groupId)) return chrome.tabs.ungroup(tab.id);
  const mine = (await chrome.tabGroups.query({ windowId: tab.windowId })).find((g) => g.title?.startsWith(MARK));
  if (mine) return chrome.tabs.group({ tabIds: [tab.id], groupId: mine.id });
  const groupId = await chrome.tabs.group({ tabIds: [tab.id] });
  await chrome.tabGroups.update(groupId, { title: `${MARK} Space` });
  // A new group goes to the top of the tab strip, right after the natively pinned tabs (nothing can go before those).
  const pinned = await chrome.tabs.query({ windowId: tab.windowId, pinned: true });
  await chrome.tabGroups.move(groupId, { index: pinned.length });
}

// Cleanup, like Arc's auto-archive. Idle Today tabs (not pinned, not in any group) are closed; they stay in
// Chrome's history, so ⌘⇧T or the ⌘T overlay brings them back. Idle guarded tabs (pinned, or in a managed
// group) are not closed: they go back to their locked URL.
const ARCHIVE_AFTER_HOURS = 12; // Arc's default; 0 turns automatic cleanup off

async function sweep(maxAge, windowId) {
  const tabs = await chrome.tabs.query(windowId == null ? {} : { windowId });
  const now = Date.now();
  const gone = stale(tabs, now, maxAge);
  if (gone.length) await chrome.tabs.remove(gone.map((t) => t.id)).catch(console.error);
  // Reset each guarded tab once per idle spell. Without the record, a tab whose site redirects away from the
  // locked URL would be reloaded on every sweep.
  const { locks } = await getState();
  const { resets = {} } = await chrome.storage.session.get('resets');
  for (const t of tabs) {
    if (!locks[t.id] || !idle(t, now, maxAge) || t.url === locks[t.id] || resets[t.id] === t.lastAccessed) continue;
    resets[t.id] = t.lastAccessed;
    chrome.tabs.update(t.id, { url: locks[t.id] }).catch(() => {});
  }
  await chrome.storage.session.set({ resets });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'today' && ARCHIVE_AFTER_HOURS > 0) sweep(ARCHIVE_AFTER_HOURS * 36e5);
});

// Like Arc's Clear button: close every Today tab in this window except the one being viewed, and send the
// guarded tabs back to their locked URLs.
async function clear() {
  const tab = await activeTab();
  if (tab) sweep(0, tab.windowId);
}

// ⌘T: ask the current page to show the search overlay. Pages that cannot be scripted (new tab page, chrome://,
// the Web Store) fall back to a native new tab.
async function palette() {
  const tab = await activeTab();
  const show = () => chrome.tabs.sendMessage(tab.id, { palette: true }).catch(() => false);
  if (tab && (await show())) return;
  // The page was open before the extension was installed or reloaded, so the content script is missing or dead:
  // inject a fresh copy and retry.
  if (tab && isWeb(tab.url)) {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }).catch(() => {});
    if (await show()) return;
  }
  chrome.tabs.create({});
}

chrome.commands.onCommand.addListener((cmd) => ({ palette, reset, relock, space, clear })[cmd]?.());

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  const tab = sender.tab;
  if (!tab) return;
  if (msg.open) {
    chrome.tabs.create({ url: msg.open, openerTabId: tab.id, windowId: tab.windowId });
  } else if (msg.query) {
    getState().then(({ locks }) => respond(locks[tab.id] ? host(locks[tab.id]) : null));
    return true;
  }
});

// Alarms survive service worker suspension; creating one with the same name just resets it.
const boot = () => {
  update(() => false);
  chrome.alarms.create('today', { periodInMinutes: 10 });
};
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  boot();
  // First-run walkthrough, shown once. The flag guards against "install" firing again for the same profile.
  if (reason !== 'install' || (await chrome.storage.local.get('welcomed')).welcomed) return;
  await chrome.storage.local.set({ welcomed: true });
  chrome.tabs.create({ url: 'onboarding.html' });
});
chrome.runtime.onStartup.addListener(boot);
