// Custom cursor, clickable-card hover and the past-project contact line.
//
// Cursor: a small yellow dot that follows the pointer. Over anything clickable it
// bounces out into the X from the logo mark, with a soft pulse ring. Over the image
// of a clickable project card it grows into a yellow "View" disc instead. Mouse and
// trackpad only (hover + fine pointer); touch devices keep the native behaviour.
// With prefers-reduced-motion the states still swap, without bounce, pulse or trail.
//
// Cards: a project card is clickable when its image link has an href:
// a[data-card-link] (featured sections), a.plp_link (Portfolio), a.csg_link (sector
// pages). The Portfolio hero (.pl-h_item) has no image link, only its "View Case
// Study" button, so a duplicate link is laid over its image (hidden from screen
// readers and the tab order, since the button already does the job).
//
// Past projects (no page): their "Previous experience - contact us for further
// details" line becomes a quiet label plus a proper link to Contact.
//
// Styles are in the code_css embed (custom cursor, clickable project cards, past projects).

const X_POINTS = '61.75 0 45.42 0 30.88 14.54 16.34 0 0 0 0 16.34 14.54 30.88 0 45.42 0 61.75 16.34 61.75 30.88 47.21 45.42 61.75 61.75 61.75 61.75 45.42 47.21 30.88 61.75 16.34';

const CLICKABLE = 'a[href], button, [role="button"], label[for], summary, select, [data-consent-open], .w-lightbox';
const TEXT_INPUT = 'input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';
const CARD_LINK = 'a[data-card-link], a.plp_link, a.csg_link, a.ecg-hero-link';
const CARD_ROOT = '[data-card], .plp_item, .csg_ci, .pl-h_item';

const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

function setupHero() {
  document.querySelectorAll('.pl-h_item').forEach((item) => {
    const button = item.querySelector('a[href*="/case-studies/"]');
    const image = item.querySelector('.pl-h_left');
    if (!button || !image || image.querySelector('.ecg-hero-link')) return;
    const link = document.createElement('a');
    link.className = 'ecg-hero-link';
    link.href = button.getAttribute('href');
    link.tabIndex = -1;
    link.setAttribute('aria-hidden', 'true');
    image.appendChild(link);
  });
}

function setupCards() {
  document.querySelectorAll(CARD_LINK).forEach((link) => {
    if (!link.getAttribute('href')) return;
    const card = link.closest(CARD_ROOT);
    const host = link.parentElement;
    if (!card || !host || card.hasAttribute('data-card-clickable')) return;
    card.setAttribute('data-card-clickable', '');
    host.classList.add('ecg-card-host');
    const fx = document.createElement('div');
    fx.className = 'ecg-card-fx';
    fx.setAttribute('aria-hidden', 'true');
    host.appendChild(fx);
  });
}

function setupPastProjects() {
  document.querySelectorAll('[class*="text_size-0"]').forEach((line) => {
    if (line.hasAttribute('data-prev') || !/previous experience/i.test(line.textContent)) return;
    line.setAttribute('data-prev', '');
    line.closest(CARD_ROOT)?.setAttribute('data-card-past', '');
    line.innerHTML = `<span class="ecg-prev_label">Previous experience</span><a class="ecg-prev_link" href="/contact">Contact us for further details ${ARROW}</a>`;
  });
}

export default function cursor() {
  if (document.querySelector('.ecg-cursor')) return;

  setupHero();
  setupCards();
  setupPastProjects();

  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = document.createElement('div');
  el.className = 'ecg-cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="ecg-cursor_ring"></div><div class="ecg-cursor_dot"></div><div class="ecg-cursor_x"><svg viewBox="0 0 61.75 61.75"><polygon points="${X_POINTS}"/></svg></div><div class="ecg-cursor_label">View</div>`;
  document.body.appendChild(el);
  document.documentElement.classList.add('ecg-cursor-on');

  let tx = -100, ty = -100, x = tx, y = ty, running = false;
  const place = () => { el.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
  const tick = () => {
    x += (tx - x) * 0.35;
    y += (ty - y) * 0.35;
    place();
    if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) requestAnimationFrame(tick);
    else running = false;
  };

  const setState = (target) => {
    const t = target instanceof Element ? target : null;
    const text = !!t?.closest(TEXT_INPUT);
    const view = !!t?.closest('[data-card-clickable] .ecg-card-host');
    const link = !text && !view && !!t?.closest(CLICKABLE);
    el.classList.toggle('is-text', text);
    el.classList.toggle('is-view', view);
    el.classList.toggle('is-link', link);
    // Yellow X on a yellow hover fill disappears, so go dark there
    el.classList.toggle('is-dark', link && !!t?.closest('.ecg-prev_link, [data-cursor="dark"]'));
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    if (!el.classList.contains('is-visible')) { x = tx; y = ty; place(); el.classList.add('is-visible'); }
    if (reduce) { x = tx; y = ty; place(); }
    else if (!running) { running = true; requestAnimationFrame(tick); }
  }, { passive: true });
  document.addEventListener('pointerover', (e) => setState(e.target), { passive: true });
  document.documentElement.addEventListener('mouseleave', () => el.classList.remove('is-visible'));
  addEventListener('pointerdown', () => el.classList.add('is-down'));
  addEventListener('pointerup', () => el.classList.remove('is-down'));
  // Content under a still pointer changes while scrolling, so re-check what's under it
  addEventListener('scroll', () => setState(document.elementFromPoint(tx, ty)), { passive: true });
}
