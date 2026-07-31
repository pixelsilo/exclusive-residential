(() => {
  const footer = document.querySelector(".footer");
  const trigger = document.querySelector(".footer-trigger");
  if (!footer || !trigger) return;

  // Keeps the spacer in sync so the fixed footer reveals over exactly its own height
  function syncTriggerHeight() {
    trigger.style.height = `${footer.offsetHeight}px`;
  }

  syncTriggerHeight();

  // Covers content/height changes inside the footer (responsive wrapping, CMS content, etc.)
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(syncTriggerHeight);
    resizeObserver.observe(footer);
  }

  window.addEventListener("resize", syncTriggerHeight);
  document.fonts?.ready.then(syncTriggerHeight);
})();
