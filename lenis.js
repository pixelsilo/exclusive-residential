  // Initialize Lenis
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });

  let resizeQueued = false;
  function queueResize() {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      lenis.resize();
    });
  }

  window.addEventListener("lenis:resize", queueResize);

  // Finsweet CMS Load renders every infinite-scroll batch asynchronously.
  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push([
    "cmsload",
    (listInstances) => {
      listInstances.forEach((listInstance) => {
        listInstance.on("renderitems", queueResize);
      });
      queueResize();
    },
  ]);

  // Also cover async CMS insertions that happen after Finsweet emits its callback.
  if ("MutationObserver" in window) {
    const contentObserver = new MutationObserver(queueResize);
    contentObserver.observe(document.body, { childList: true, subtree: true });
  }

  if ("ResizeObserver" in window) {
    const sizeObserver = new ResizeObserver(queueResize);
    sizeObserver.observe(document.body);
  }

  if (window.gsap && window.ScrollTrigger) {
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  window.addEventListener("resize", queueResize, { passive: true });
  document.fonts?.ready.then(queueResize);