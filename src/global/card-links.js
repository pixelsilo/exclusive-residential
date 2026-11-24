// Image-only card links (the project cards in the featured-case-studies component)
// have no text of their own, so screen readers announce them as "link". Name each one
// after its card's title. CMS fields can't be bound inside a component, hence JS.
// Markup: [data-card] > a[data-card-link] + [data-card-title]
export default function cardLinks() {
  document.querySelectorAll('[data-card]').forEach((card) => {
    const link = card.querySelector('[data-card-link]');
    const title = card.querySelector('[data-card-title]');
    if (!link || !title || link.hasAttribute('aria-label')) return;
    const text = title.textContent.replace(/\s+/g, ' ').trim();
    if (text) link.setAttribute('aria-label', text);
  });
}
