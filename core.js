(() => {
  const footer = document.querySelector(".footer");
  const trigger = document.querySelector(".footer-trigger");
  if (!footer || !trigger) return;

  let appliedHeight = -1;

  // Keeps the spacer in sync so the fixed footer reveals over exactly its own height
  function syncTriggerHeight() {
    const nextHeight = Math.ceil(footer.getBoundingClientRect().height);
    if (nextHeight === appliedHeight) return;
    appliedHeight = nextHeight;
    trigger.style.height = `${nextHeight}px`;
    window.dispatchEvent(new Event("lenis:resize"));
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
