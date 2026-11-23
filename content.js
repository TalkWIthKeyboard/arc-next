{
  // Wrapped in a block: after the extension reloads this script is injected into the same page again, and
  // block-scoped variables do not clash with the previous copy.
  // Only active in pinned tabs: a click on a link to another host opens in a peek window instead.
  let lockedHost = null;
  let told = false;

  chrome.runtime.sendMessage({ query: true }, (r) => {
    void chrome.runtime.lastError;
    if (!told) lockedHost = r?.lockedHost || null; // the reply can arrive after a "just pinned" notice; do not overwrite it with a stale value
    if (r?.peek) peekBar(r.key, r.label);
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
    if (msg.peek) peekBar(msg.key, msg.label);
  });

  // In a peek window: Arc's "Open as Tab" bar at the bottom. A closed shadow root keeps the page's CSS out.
  let bar = null;
  function peekBar(key, label) {
    if (bar) return;
    bar = document.createElement('arc-next-peek');
    bar.style.cssText =
      'all:initial!important;position:fixed!important;z-index:2147483647!important;left:50%!important;bottom:16px!important;transform:translateX(-50%)!important;';
    const root = bar.attachShadow({ mode: 'closed' });
    root.innerHTML = `<style>
      button { all: unset; display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 999px;
        font: 500 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #fff; cursor: pointer;
        background: rgb(44 47 56 / .9); backdrop-filter: blur(12px);
        /* inner light ring shows on dark pages, outer dark ring and shadow on light ones */
        box-shadow: inset 0 0 0 1px rgb(255 255 255 / .22), 0 0 0 1px rgb(0 0 0 / .3), 0 8px 24px rgb(0 0 0 / .35); }
      button:hover { background: rgb(56 60 70 / .95); }
      button:focus-visible { outline: 2px solid #8cabe4; outline-offset: 2px; }
      kbd { font: inherit; opacity: .6; margin-left: 2px; }
      svg { width: 14px; height: 14px; }
    </style><button type="button"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 3h4v4M13 3L8 8M7 4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9"/></svg></button>`;
    root.querySelector('button').append(label);
    if (key) root.querySelector('button').append(Object.assign(document.createElement('kbd'), { textContent: key }));
    root.querySelector('button').addEventListener('click', () => chrome.runtime.sendMessage({ expand: true }));
    document.documentElement.append(bar);
  }

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
