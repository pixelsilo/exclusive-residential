// The footer is fixed and revealed as the page scrolls away. .footer-trigger is a
// spacer kept at exactly the footer's height.
export default function footerReveal() {
  const footer = document.querySelector('.footer');
  const trigger = document.querySelector('.footer-trigger');
  if (!footer || !trigger) return;

  let appliedHeight = -1;

  function sync() {
    const nextHeight = Math.ceil(footer.getBoundingClientRect().height);
    if (nextHeight === appliedHeight) return;
    appliedHeight = nextHeight;
    trigger.style.height = `${nextHeight}px`;
    window.dispatchEvent(new Event('lenis:resize'));
  }

  sync();
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(footer);
  window.addEventListener('resize', sync);
  document.fonts?.ready.then(sync);
}
