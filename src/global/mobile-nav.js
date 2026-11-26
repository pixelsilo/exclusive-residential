// Mobile menu (.fs_nav): layout, contact details, scroll lock.
//
// Webflow's interaction still slides the panel up and the links in; this
// restyles what's inside and adds what the menu was missing:
//   - links lined up with the logo, full width, a rule and an arrow on each
//   - the three disciplines large, Portfolio / About / Contact smaller
//   - the current page marked with a yellow bar (yellow text is too faint)
//   - Call, Email and the social links at the bottom, copied from the footer
//   - the page behind stops scrolling, the cookie button hides, and the menu
//     button reports aria-expanded
//
// Styles are in the code_css embed (mobile menu), so the Designer shows them.

const ARROW = '<svg class="ecg-mnav_arrow" viewBox="0 0 22 18" aria-hidden="true"><path fill="currentColor" d="M21.76 8.88c0-.29-.12-.56-.35-.78L13.64.35C13.38.09 13.14 0 12.86 0c-.58 0-1.02.42-1.02 1.01 0 .28.09.55.28.74l2.62 2.67 4.65 4.24.24-.59-3.77-.23H1.03C.42 7.84 0 8.27 0 8.88s.42 1.04 1.03 1.04h14.83l3.77-.23-.24-.58-4.65 4.23-2.62 2.67c-.19.18-.28.46-.28.74 0 .59.44 1.01 1.02 1.01.28 0 .53-.11.76-.33l7.79-7.77c.23-.22.35-.49.35-.78Z"/></svg>';

export default function mobileNav() {
  const panel = document.querySelector('.fs_nav');
  const content = panel?.querySelector('.fs_nav_content');
  const button = document.querySelector('.menu_button');
  if (!panel || !content) return;

  panel.querySelectorAll('.fs-nav_link').forEach((a) => a.insertAdjacentHTML('beforeend', ARROW));

  // Contact details, copied from the footer so there's one source
  const from = (sel) => document.querySelector(`.footer ${sel}`);
  const tel = from('a[href^="tel:"]');
  const mail = from('a[href^="mailto:"]');
  const socials = [['LinkedIn', from('a[href*="linkedin.com"]')], ['Instagram', from('a[href*="instagram.com"]')]].filter(([, a]) => a);
  const foot = document.createElement('div');
  foot.className = 'ecg-mnav_foot';
  const item = (tag, a) => `<a class="ecg-mnav_item" href="${a.getAttribute('href')}"><span class="ecg-mnav_tag">${tag}</span>${a.textContent.trim()}</a>`;
  foot.innerHTML = (tel ? item('Call', tel) : '') + (mail ? item('Email', mail) : '')
    + (socials.length ? `<div class="ecg-mnav_social">${socials.map(([n, a]) => `<a href="${a.href}" target="_blank" rel="noopener">${n}</a>`).join('')}</div>` : '');
  if (foot.children.length) content.append(foot);

  // Open state follows Webflow's interaction (the panel sits at 100vh when closed)
  let open = false;
  const sync = () => {
    const now = panel.getBoundingClientRect().top < window.innerHeight / 2;
    if (now === open) return;
    open = now;
    document.documentElement.classList.toggle('is-mnav-open', open);
    button?.setAttribute('aria-expanded', String(open));
    if (open) window.lenis?.stop(); else window.lenis?.start();
  };
  button?.setAttribute('aria-expanded', 'false');
  new MutationObserver(() => requestAnimationFrame(sync)).observe(panel, { attributes: true, attributeFilter: ['style'] });
}
