// Dismissible alert bar. Not on any page yet.
// Markup: root [data-module="alert"], close button [data-alert-close] inside it.
// The bar is hidden by CSS and shown with .is-visible. Dismissal is remembered for
// DAYS; a changed message shows the bar again. Bump data-alert-version on the root
// to re-show it without changing the wording.
const COOKIE = 'ps_alert_dismissed';
const DAYS = 180;

const getCookie = (name) => {
  const row = document.cookie.split('; ').find((r) => r.startsWith(name + '='));
  return row ? decodeURIComponent(row.split('=')[1]) : null;
};

const setCookie = (name, value, days) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
};

export default function alertBar(root) {
  const close = root.querySelector('[data-alert-close]');
  if (!close) return;

  const clone = root.cloneNode(true);
  clone.querySelector('[data-alert-close]')?.remove();
  const version = root.getAttribute('data-alert-version') || '1';
  const signature = `${version}::${clone.textContent.replace(/\s+/g, ' ').trim()}`;

  const show = (visible) => {
    root.classList.toggle('is-visible', visible);
    root.setAttribute('aria-hidden', String(!visible));
  };

  show(getCookie(COOKIE) !== signature);
  close.addEventListener('click', () => {
    show(false);
    setCookie(COOKIE, signature, DAYS);
  });
}
