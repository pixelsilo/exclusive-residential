// A small fixed button (bottom right) that reopens the cookie settings from
// anywhere on the site. data-consent-open is handled by the consent module.
// Styles live in the code_css embed (.ecg-cookie-btn). CSS hides it while the
// banner is open; this hides it while the footer (which has its own
// "Cookie settings" link) is on screen, so it never sits on the footer credit.
const ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21.6 11.2a3.2 3.2 0 0 1-3.9-3.4 3.2 3.2 0 0 1-3.5-3.9A9.9 9.9 0 0 0 12 3.7a8.3 8.3 0 1 0 9.6 7.5ZM8 9.5A1.5 1.5 0 1 1 8 12.5 1.5 1.5 0 0 1 8 9.5Zm1.5 6a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm5-1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-2.5-4.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/></svg>';

export default function cookieButton() {
  if (document.querySelector('.ecg-cookie-btn')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ecg-cookie-btn';
  button.setAttribute('data-consent-open', '');
  button.setAttribute('aria-label', 'Cookie settings');
  button.title = 'Cookie settings';
  button.innerHTML = ICON;
  document.body.appendChild(button);

  // The footer is fixed behind the page and revealed by .footer-trigger, a spacer
  // at the end of the page (see footer-reveal.js), so watch the spacer: once its
  // bottom third is on screen, the footer's legal bar is showing.
  const reveal = document.querySelector('.footer-trigger') || document.querySelector('.footer');
  if (reveal && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      button.classList.toggle('is-hidden', entry.isIntersecting);
    }, { rootMargin: '0px 0px -66% 0px' }).observe(reveal);
  }
}
