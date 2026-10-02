document.addEventListener("DOMContentLoaded", function () {
  // Avoid double-binding if this script is injected/loaded more than once.
  if (window.__exclusiveResidentialScrollToggleInitialized) return;
  window.__exclusiveResidentialScrollToggleInitialized = true;

  // Select only elements opted into scroll-state toggling.
  const elements = document.querySelectorAll('[toggle="scrolled"]');
  if (!elements.length) return;

  // Add/remove hysteresis prevents rapid toggling around the boundary.
  const addThreshold = 20;
  const removeThreshold = 10;

  // Track the state so we don't spam the DOM.
  let isScrolled = false;
  let ticking = false;

  function updateScrolledClass() {
    ticking = false;

    const scrollPos = window.scrollY || window.pageYOffset || 0;

    if (!isScrolled && scrollPos > addThreshold) {
      elements.forEach((el) => el.classList.add("scrolled"));
      isScrolled = true;
      return;
    }

    if (isScrolled && scrollPos <= removeThreshold) {
      elements.forEach((el) => el.classList.remove("scrolled"));
      isScrolled = false;
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrolledClass);
  }

  // Run once on load.
  updateScrolledClass();

  // Listen for scroll.
  window.addEventListener("scroll", onScroll, { passive: true });
});
