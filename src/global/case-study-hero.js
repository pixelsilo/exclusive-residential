// Case study hero: projects without credits (architect, QS, engineers, client, value)
// would leave the dark side panel squeezed to the project name. Mark them so the
// template's CSS embed can run the image full width with the name over it.
// Markup (case study template): [data-cs-hero] > [data-cs-panel] ... [data-cs-credits]
export default function caseStudyHero() {
  document.querySelectorAll('[data-cs-hero]').forEach((hero) => {
    const credits = hero.querySelector('[data-cs-credits]');
    if (!credits) return;
    const hasCredits = credits.textContent.replace(/\s+/g, '').length > 0;
    hero.toggleAttribute('data-no-credits', !hasCredits);
  });
}
