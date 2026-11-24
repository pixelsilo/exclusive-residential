import lenis from './global/lenis.js';
import footerReveal from './global/footer-reveal.js';
import navScrolled from './global/nav-scrolled.js';
import copyrightYear from './global/copyright-year.js';
import lottieResize from './global/lottie-resize.js';
import sliders from './global/sliders.js';
import cardLinks from './global/card-links.js';
import alertBar from './modules/alert.js';
import map from './modules/map.js';
import consentBanner, { initConsent } from './modules/consent.js';

// Site-wide behaviour that runs on every page. Order matters: Lenis first, so
// footer-reveal's "lenis:resize" event has a listener. initConsent comes before
// any module so window.ecgConsent exists when the map (or anything gated) mounts.
const GLOBALS = [lenis, footerReveal, navScrolled, copyrightYear, lottieResize, sliders, cardLinks, initConsent];

// Opt-in modules, mounted on [data-module="<name>"] roots
const MODULES = { alert: alertBar, map, consent: consentBanner };

// Legacy hooks still on the Webflow markup. Remove each line once the element
// has data-module="<name>" in the Designer.
const LEGACY = { map: '.map' };

function mount(root, name) {
  if (root.hasAttribute('data-ready')) return; // guard double init
  try {
    MODULES[name](root);
    root.setAttribute('data-ready', '');
  } catch (err) {
    console.error('[exr] module failed:', name, err);
  }
}

function boot() {
  GLOBALS.forEach((init) => {
    try {
      init();
    } catch (err) {
      console.error('[exr] global failed:', init.name, err);
    }
  });

  document.querySelectorAll('[data-module]').forEach((root) => {
    const name = root.getAttribute('data-module');
    if (MODULES[name]) mount(root, name);
  });

  Object.entries(LEGACY).forEach(([name, selector]) => {
    document.querySelectorAll(selector).forEach((root) => mount(root, name));
  });
}

// Injected scripts load async, so wait for Webflow's own JS and the DOM
window.Webflow ||= [];
window.Webflow.push(() => {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
});
