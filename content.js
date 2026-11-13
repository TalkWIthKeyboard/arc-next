{
  // Wrapped in a block: after the extension reloads this script is injected into the same page again, and
  // block-scoped variables do not clash with the previous copy.
  // Only active in pinned tabs: a click on a link to another host opens in a new tab instead.
  let lockedHost = null;
  let told = false;

  chrome.runtime.sendMessage({ query: true }, (h) => {
    void chrome.runtime.lastError;
    if (!told) lockedHost = h || null; // the reply can arrive after a "just pinned" notice; do not overwrite it with a stale value
  });
  chrome.runtime.onMessage.addListener((msg, _, respond) => {
    if ('lockedHost' in msg) {
      told = true;
      lockedHost = msg.lockedHost;
    }
    if (msg.palette) {
      togglePalette();
      respond(true);
    }
  });

  // ⌘T overlay: a transparent full-viewport iframe holding the extension's own page, isolated from the page's
  // styles and scripts.
  let frame = null;
  function togglePalette() {
    if (frame) {
      frame.remove();
      frame = null;
      return;
    }
    frame = document.createElement('iframe');
    frame.src = chrome.runtime.getURL('palette.html');
    frame.style.cssText =
      'all:initial!important;position:fixed!important;inset:0!important;width:100vw!important;' +
      'height:100vh!important;border:0!important;z-index:2147483647!important;color-scheme:light dark!important;';
    document.documentElement.append(frame);
    frame.focus();
  }
  addEventListener('message', (e) => {
    if (frame && e.source === frame.contentWindow && e.data === 'arc-next-close') togglePalette();
  });

  addEventListener(
    'click',
    (e) => {
      // After an extension reload this old copy is dead (runtime.id is empty): do not intercept, let the link navigate.
      if (!chrome.runtime?.id || !lockedHost || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.composedPath().find((n) => n.tagName === 'A' && n.href);
      if (!a || a.target === '_blank') return;
      let url;
      try {
        url = new URL(a.href);
      } catch {
        return;
      }
      // Leave links to the pinned host alone, and links to the current page's own host (e.g. after a redirect to a sign-in page).
      if (!/^https?:$/.test(url.protocol) || url.hostname === lockedHost || url.hostname === location.hostname) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      chrome.runtime.sendMessage({ open: url.href });
    },
    true,
  );
}
