// Adds .scrolled to every [toggle="scrolled"] element once the page is scrolled.
const ADD_AT = 20; // px
const REMOVE_AT = 10; // px, lower than ADD_AT so it doesn't flicker at the boundary

export default function navScrolled() {
  const elements = document.querySelectorAll('[toggle="scrolled"]');
  if (!elements.length) return;

  let isScrolled = false;
  let ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY || 0;
    if (!isScrolled && y > ADD_AT) {
      elements.forEach((el) => el.classList.add('scrolled'));
      isScrolled = true;
    } else if (isScrolled && y <= REMOVE_AT) {
      elements.forEach((el) => el.classList.remove('scrolled'));
      isScrolled = false;
    }
  }

  update();
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
}
