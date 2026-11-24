import Lenis from '@studio-freight/lenis';

// Smooth scrolling. Other code asks for a re-measure with
// window.dispatchEvent(new Event('lenis:resize')).
export default function lenis() {
  const instance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });
  window.lenis = instance;

  let resizeQueued = false;
  function queueResize() {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      instance.resize();
    });
  }

  window.addEventListener('lenis:resize', queueResize);

  // CMS content added later (Finsweet list load on Portfolio, etc.) changes the page height
  if ('MutationObserver' in window) {
    new MutationObserver(queueResize).observe(document.body, { childList: true, subtree: true });
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(queueResize).observe(document.body);
  }

  // Drive Lenis from GSAP's ticker when Webflow has loaded GSAP, so ScrollTrigger stays in sync
  if (window.gsap && window.ScrollTrigger) {
    instance.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => instance.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time) => {
      instance.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  window.addEventListener('resize', queueResize, { passive: true });
  document.fonts?.ready.then(queueResize);
}
