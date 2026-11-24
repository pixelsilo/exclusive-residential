// Cookie consent: API, gating and banner. Full guide: docs/consent.md.
//
// Two entry points, both wired in src/main.js:
//   initConsent()  runs on every page (GLOBALS). Reads the stored choice, creates
//                  window.ecgConsent, sets Google Consent Mode defaults and releases
//                  gated scripts/iframes once their category is allowed.
//   default export mounts the banner on [data-module="consent"]. The banner markup
//                  lives in Webflow; this file only toggles state through attributes.
//
// Banner markup contract (all hooks are attributes, never classes):
//   [data-module="consent"]                 root. Gets .is-visible while open and
//                                           data-view="summary" | "manage".
//   [data-consent-view="summary|manage"]    the two panels inside the root.
//   [data-consent-action]                   accept-all | reject-all | manage | save | back | close
//   input[type=checkbox][data-consent-toggle="<category>"]
//                                           one per optional category. Never pre-ticked.
//   [data-consent-open]                     anywhere on the site: reopens the manage view.
//
// Gating other code once a category is consented:
//   <script type="text/plain" data-consent-category="analytics" src="..."></script>
//   <iframe data-consent-category="embeds" data-consent-src="https://player.vimeo.com/..."></iframe>
//   gateEmbed(root, 'functional', start) for modules (see map.js).

// Bump when the cookie policy or the list of categories changes: everyone is asked again.
export const POLICY_VERSION = '2'; // 2: Analytics (GA4) added, Nov 2026

// Optional consent log. Empty = off. When set, every saved choice is POSTed as
// { consentId, timestamp, version, categories } with no IP and no personal data.
// See docs/consent.md ("Optional consent log") before turning it on.
const CONSENT_LOG_URL = '';

const COOKIE = 'ecg_consent';
const MAX_AGE_DAYS = 365; // 12 months, then we ask again
const CATEGORIES = ['functional', 'analytics', 'marketing', 'embeds'];

// "Enforced" means the banner is on the page (or a choice is already stored). Until
// then nothing asks visitors for consent, so these categories behave as allowed and
// the site works exactly as it does today (the Contact map loads on page view).
// analytics, marketing and embeds are NEVER allowed without a recorded choice.
// Once the banner is in the site-wide component this only matters on a page that
// somehow lacks it; set it to [] to make even that case click-to-load.
const ALLOWED_BEFORE_SWITCH_ON = ['functional'];

// Google Consent Mode v2 signals per category (only used if a Google tag is added).
const CONSENT_MODE = true;
const GOOGLE_SIGNALS = {
  functional: ['functionality_storage', 'personalization_storage'],
  analytics: ['analytics_storage'],
  marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
};

// Cookies to delete when a category is withdrawn (names or RegExps), for tools
// that might be added later. Scripts already running are stopped by a reload.
const CLEAR_ON_REVOKE = {
  analytics: [/^_ga/, '_gid', /^_gat/],
  marketing: ['_fbp', '_fbc', /^_gcl_/],
};

const ROOT_SELECTOR = '[data-module="consent"]';
const SCRIPT_GATE = 'script[type="text/plain"][data-consent-category]';
const IFRAME_GATE = 'iframe[data-consent-category][data-consent-src]';

const getCookie = (name) => {
  const row = document.cookie.split('; ').find((r) => r.startsWith(name + '='));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : null;
};

const setCookie = (name, value, days) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax${secure}`;
};

const deleteCookie = (name) => {
  const host = location.hostname.split('.');
  // Analytics cookies are usually set on the registrable domain, so try every parent
  const domains = [null, ...host.map((_, i) => '.' + host.slice(i).join('.')).filter((d) => d.includes('.', 1))];
  domains.forEach((domain) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/${domain ? ';domain=' + domain : ''}`;
  });
};

const newId = () => {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

// What the cookie holds: { v: version, id, ts: ms, c: { functional: true, ... } }
function readStored() {
  try {
    const raw = getCookie(COOKIE);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.c !== 'object' || !data.id || !data.ts) return null;
    return data;
  } catch (err) {
    return null;
  }
}

const isCurrent = (stored) =>
  !!stored && stored.v === POLICY_VERSION && Date.now() - stored.ts < MAX_AGE_DAYS * 864e5;

function toState(stored) {
  const categories = { necessary: true };
  CATEGORIES.forEach((key) => {
    categories[key] = !!stored.c[key];
  });
  return { consentId: stored.id, version: stored.v, timestamp: new Date(stored.ts).toISOString(), categories };
}

function gtag() {
  window.dataLayer.push(arguments);
}

function updateConsentMode(categories, command) {
  if (!CONSENT_MODE) return;
  const signals = { security_storage: 'granted' };
  Object.entries(GOOGLE_SIGNALS).forEach(([key, names]) => {
    names.forEach((name) => (signals[name] = categories[key] ? 'granted' : 'denied'));
  });
  if (command === 'default') signals.wait_for_update = 500;
  window.gtag('consent', command, signals);
}

function sendLog(state) {
  if (!CONSENT_LOG_URL) return;
  const { consentId, timestamp, version, categories } = state;
  try {
    // text/plain avoids a CORS preflight; the receiver parses the body as JSON
    fetch(CONSENT_LOG_URL, {
      method: 'POST',
      body: JSON.stringify({ consentId, timestamp, version, categories }),
      headers: { 'Content-Type': 'text/plain' },
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    }).catch(() => {});
  } catch (err) {
    /* logging must never break the site */
  }
}

let api = null;

export function initConsent() {
  if (api) return api;

  let stored = readStored();
  let current = isCurrent(stored);
  const enforced = !!document.querySelector(ROOT_SELECTOR) || !!stored;
  const listeners = new Set();
  const released = new Set(); // categories that have had gated code released

  if (CONSENT_MODE) {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) window.gtag = gtag;
    updateConsentMode({}, 'default');
    if (current) updateConsentMode(toState(stored).categories, 'update');
  }

  const state = () => (current ? toState(stored) : null);

  const allowed = (category) => {
    if (category === 'necessary') return true;
    if (current) return !!stored.c[category];
    return !enforced && ALLOWED_BEFORE_SWITCH_ON.includes(category);
  };

  function release() {
    document.querySelectorAll(SCRIPT_GATE).forEach((el) => {
      if (!allowed(el.getAttribute('data-consent-category'))) return;
      const script = document.createElement('script');
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name === 'type' || attr.name === 'data-consent-category') return;
        script.setAttribute(attr.name, attr.value);
      });
      if (el.hasAttribute('data-consent-type')) script.type = el.getAttribute('data-consent-type');
      script.textContent = el.textContent;
      released.add(el.getAttribute('data-consent-category'));
      el.replaceWith(script);
    });
    document.querySelectorAll(IFRAME_GATE).forEach((el) => {
      const category = el.getAttribute('data-consent-category');
      if (!allowed(category)) return;
      released.add(category);
      el.src = el.getAttribute('data-consent-src');
      el.removeAttribute('data-consent-src');
    });
  }

  function set(choices) {
    const before = state()?.categories || {};
    const categories = {};
    CATEGORIES.forEach((key) => (categories[key] = !!choices?.[key]));
    stored = { v: POLICY_VERSION, id: stored?.id || newId(), ts: Date.now(), c: categories };
    current = true;
    setCookie(COOKIE, JSON.stringify(stored), MAX_AGE_DAYS);

    const next = toState(stored);
    updateConsentMode(next.categories, 'update');
    sendLog(next);

    let withdrawn = false;
    CATEGORIES.forEach((key) => {
      if (before[key] && !categories[key]) {
        (CLEAR_ON_REVOKE[key] || []).forEach((rule) => {
          const names = rule instanceof RegExp ? document.cookie.split('; ').map((r) => r.split('=')[0]).filter((n) => rule.test(n)) : [rule];
          names.forEach(deleteCookie);
        });
        if (released.has(key)) withdrawn = true;
      }
    });

    listeners.forEach((fn) => {
      try {
        fn(next);
      } catch (err) {
        console.error('[exr] consent listener failed', err);
      }
    });
    window.dispatchEvent(new CustomEvent('ecg:consent', { detail: next }));
    release();
    // Code that was already running for a withdrawn category can't be unloaded
    if (withdrawn) location.reload();
    return next;
  }

  api = {
    version: POLICY_VERSION,
    categories: ['necessary', ...CATEGORIES],
    enforced,
    get: state,
    // Has this category been consented to (or does it not need to be)?
    allowed,
    // cb(state) on every change. Returns an unsubscribe function.
    on(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    // Resolves as soon as the category is allowed (immediately if it already is)
    when(category) {
      if (allowed(category)) return Promise.resolve();
      return new Promise((resolve) => {
        const off = api.on(() => {
          if (allowed(category)) {
            off();
            resolve();
          }
        });
      });
    },
    set,
    acceptAll: () => set(Object.fromEntries(CATEGORIES.map((k) => [k, true]))),
    rejectAll: () => set({}),
    // Show the banner (manage view by default). No-op if the banner isn't on the page.
    open(view = 'manage') {
      window.dispatchEvent(new CustomEvent('ecg:consent-open', { detail: { view } }));
    },
    // Forget the choice (QA and "withdraw" tooling)
    reset() {
      deleteCookie(COOKIE);
      stored = null;
      current = false;
      window.dispatchEvent(new CustomEvent('ecg:consent-open', { detail: { view: 'summary' } }));
    },
    // Release gated code added to the DOM after load
    scan: release,
    // For modules that start something themselves (gateEmbed): if the category is later
    // withdrawn, the page reloads so that code stops running
    markReleased: (category) => released.add(category),
    // True when no valid choice is stored (none yet, an old policy version, or expired)
    needsChoice: () => !current,
  };

  window.ecgConsent = api;
  release();

  // [data-consent-open] works anywhere, including links added later
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('[data-consent-open]');
    if (!trigger) return;
    event.preventDefault();
    api.open('manage');
  });

  return api;
}

// Click-to-load for a module that needs a category. Starts straight away when the
// category is allowed; otherwise fills `root` with a placeholder and starts when the
// visitor clicks it (this page view only, nothing stored) or consents elsewhere.
// Text can be overridden with data-consent-message / data-consent-button on the root.
export function gateEmbed(root, category, start, text = {}) {
  const consent = initConsent();
  let started = false;
  let placeholder = null;
  const run = () => {
    if (started) return;
    started = true;
    // A click-to-load start was the visitor's own one-off act, so it isn't tied to stored consent
    if (consent.allowed(category)) consent.markReleased(category);
    placeholder?.remove();
    start();
  };

  if (consent.allowed(category)) return run();

  placeholder = document.createElement('div');
  placeholder.className = 'ecg-consent-placeholder';
  placeholder.setAttribute('data-consent-placeholder', category);
  const message = document.createElement('p');
  message.className = 'ecg-consent-placeholder_text';
  message.textContent = root.getAttribute('data-consent-message') || text.message || 'This content is provided by a third party. Loading it shares your IP address with them.';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ecg-consent-placeholder_button';
  button.textContent = root.getAttribute('data-consent-button') || text.button || 'Load content';
  button.addEventListener('click', run);
  placeholder.append(message, button);
  root.appendChild(placeholder);

  consent.when(category).then(run);
}

// Banner. The root is hidden by CSS and shown with .is-visible (same pattern as alert.js).
export default function consentBanner(root) {
  const consent = initConsent();
  const toggles = Array.from(root.querySelectorAll('input[type="checkbox"][data-consent-toggle]')).filter((el) =>
    CATEGORIES.includes(el.getAttribute('data-consent-toggle'))
  );

  const view = (name) => {
    root.setAttribute('data-view', name);
    root.querySelectorAll('[data-consent-view]').forEach((el) => {
      el.setAttribute('aria-hidden', String(el.getAttribute('data-consent-view') !== name));
    });
  };

  const show = (visible, name, focus) => {
    if (visible) view(name || 'summary');
    root.classList.toggle('is-visible', visible);
    root.setAttribute('aria-hidden', String(!visible));
    if (visible && focus) {
      root.setAttribute('tabindex', '-1');
      root.focus({ preventScroll: true });
    }
  };

  // Never pre-ticked: boxes reflect a stored, current choice or stay empty
  const fillToggles = () => {
    const saved = consent.get()?.categories || {};
    toggles.forEach((el) => (el.checked = !!saved[el.getAttribute('data-consent-toggle')]));
  };

  // Accept all only grants what the banner actually lists
  const offered = toggles.length ? toggles.map((el) => el.getAttribute('data-consent-toggle')) : CATEGORIES;

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-consent-action]');
    if (!button || !root.contains(button)) return;
    const action = button.getAttribute('data-consent-action');
    if (action === 'accept-all') {
      consent.set(Object.fromEntries(offered.map((k) => [k, true])));
      show(false);
    } else if (action === 'reject-all') {
      consent.rejectAll();
      show(false);
    } else if (action === 'save') {
      consent.set(Object.fromEntries(toggles.map((el) => [el.getAttribute('data-consent-toggle'), el.checked])));
      show(false);
    } else if (action === 'manage') {
      fillToggles();
      view('manage');
    } else if (action === 'back') {
      view('summary');
    } else if (action === 'close') {
      show(false); // closes without storing anything; only offered when a choice exists
    }
  });

  window.addEventListener('ecg:consent-open', (event) => {
    const name = event.detail?.view || 'manage';
    fillToggles();
    show(true, name, true);
  });

  fillToggles();
  show(consent.needsChoice(), 'summary');
}
