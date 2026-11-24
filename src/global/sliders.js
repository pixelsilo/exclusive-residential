import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

// Swiper sliders driven by attributes (used on the Case Studies template):
//   [slider="section"]  root; settings go here (below)
//   [slider="wrapper"]  the list (a Collection List works)
//   [slider="item"]     each slide
//   [slider="prev"] / [slider="next"]  buttons; they get .end when disabled
// Settings on the root: slider-items(-tab|-mob), slider-gap(-tab|-mob),
// slider-offset(-tab|-mob) (px or rem), slider-duration (ms),
// slider-centered="true", slider-easing (CSS timing function).
export default function sliders() {
  const sections = document.querySelectorAll('[slider="section"]');
  if (!sections.length) return;

  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  const read = (el, attr, fallback, allowRem = false) => {
    const val = el.getAttribute(attr);
    if (!val) return fallback;
    const num = parseFloat(val);
    return allowRem && val.toLowerCase().includes('rem') ? num * rootFontSize : num;
  };

  sections.forEach((section) => {
    if (section.hasAttribute('data-ready')) return;
    const wrapper = section.querySelector('[slider="wrapper"]');
    if (!wrapper) return;

    // Works with Webflow's .w-dyn-list wrappers: the list's parent becomes the Swiper container
    const container = wrapper.parentNode;
    container.classList.add('swiper');
    wrapper.classList.add('swiper-wrapper');
    wrapper.querySelectorAll('[slider="item"]').forEach((item) => item.classList.add('swiper-slide'));

    // [mobile, tablet, desktop]
    const items = [read(section, 'slider-items-mob', 1.5), read(section, 'slider-items-tab', 2.5), read(section, 'slider-items', 2.5)];
    const gaps = [read(section, 'slider-gap-mob', 32, true), read(section, 'slider-gap-tab', 64, true), read(section, 'slider-gap', 64, true)];
    const offsets = [read(section, 'slider-offset-mob', 16, true), read(section, 'slider-offset-tab', 32, true), read(section, 'slider-offset', 32, true)];
    const centered = section.getAttribute('slider-centered') === 'true';
    wrapper.style.transitionTimingFunction = section.getAttribute('slider-easing') || 'ease';

    const layout = (i) => ({
      slidesPerView: items[i],
      spaceBetween: gaps[i],
      slidesOffsetBefore: centered ? 0 : offsets[i],
      slidesOffsetAfter: centered ? 0 : offsets[i],
    });

    new Swiper(container, {
      modules: [Navigation],
      speed: read(section, 'slider-duration', 300),
      centeredSlides: centered,
      loop: centered,
      loopAdditionalSlides: centered ? 4 : 0,
      loopPreventsSliding: false,
      initialSlide: 0,
      watchSlidesProgress: true,
      roundLengths: true,
      observer: true,
      observeParents: true,
      slideActiveClass: centered ? 'focused' : 'swiper-slide-active',
      ...layout(0),
      navigation: {
        nextEl: section.querySelector('[slider="next"]'),
        prevEl: section.querySelector('[slider="prev"]'),
        disabledClass: 'end',
      },
      breakpoints: { 768: layout(1), 992: layout(2) },
      on: {
        // Re-measure once so loop clones sit correctly to the left of slide 1
        init() {
          if (centered) this.update();
        },
      },
    });
    section.setAttribute('data-ready', '');
  });
}
