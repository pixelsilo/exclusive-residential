// A small fixed button (bottom right) that reopens the cookie settings from
// anywhere on the site. data-consent-open is handled by the consent module.
// Styles live in the code_css embed (.ecg-cookie-btn). CSS hides it while the
// banner is open; this hides it while the footer (which has its own
// "Cookie settings" link) is on screen, so it never sits on the footer credit.
// The button is white (set below, over the embed's dark background) so it shows
// on both light and dark sections. The icon is a gold cookie with a bite and dark
// chips, coloured in the SVG itself, and sized inline to override the embed's 45%.
const ICON = '<svg viewBox="0 0 32 32" style="width:62%;height:62%" aria-hidden="true" focusable="false">'
  + '<defs><mask id="ecg-cookie-bite"><rect width="32" height="32" fill="#fff"/><circle cx="27.5" cy="4.5" r="6.5" fill="#000"/></mask></defs>'
  + '<circle cx="16" cy="16" r="14" fill="#dcb200" mask="url(#ecg-cookie-bite)"/>'
  + '<g fill="#1c1c1c"><circle cx="10.5" cy="11.5" r="2.3"/><circle cx="18" cy="15" r="1.7"/><circle cx="11" cy="20.5" r="1.8"/><circle cx="19.5" cy="22.5" r="2.4"/><circle cx="24.5" cy="16" r="1.5"/></g>'
  + '</svg>';

export default function cookieButton() {
  if (document.querySelector('.ecg-cookie-btn')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ecg-cookie-btn';
  button.setAttribute('data-consent-open', '');
  button.setAttribute('aria-label', 'Cookie settings');
  button.title = 'Cookie settings';
  button.style.background = '#fff';
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
