# Exclusive Residential: Webflow custom code

Custom JavaScript for the Exclusive Construction Group Webflow site (staging: https://exclgroup.webflow.io). Built with Vite into `dist/site.js`, committed, served by jsDelivr from a git tag, and loaded by one small snippet in the Webflow **footer** (`snippets/loader.html`). Lenis and Swiper are npm packages bundled into `site.js`; GSAP, ScrollTrigger and Lottie come from Webflow itself.

## Develop

```bash
npm install
npm run dev     # terminal 1: rebuild on change
npm run serve   # terminal 2: serve dist/ at http://127.0.0.1:5500
```

Then open the Webflow site with `?dev` on the URL. That browser loads `http://127.0.0.1:5500/site.js` until you visit with `?dev=off`. Everyone else keeps getting the tagged CDN build. Use Chrome: Safari blocks localhost scripts on https pages.

## Conventions

- Hook JS to attributes, not Webflow classes or IDs. (`.footer`, `.footer-trigger` and `.map` are still class hooks carried over from the old scripts; move them to attributes when those elements are next touched.)
- Site-wide behaviour lives in `src/global/` and is listed in `GLOBALS` in `src/main.js`.
- Opt-in modules live in `src/modules/`, are registered in `MODULES`, and mount on `[data-module="<name>"]`. A module is `export default function (root) {}` and only queries inside `root`. `data-ready` on a root means it has been initialised.
- **CSS does not live in this repo.** Site-wide CSS is in the `code_css` HTML embed inside the hidden `code-snippets` component (on every page), so it previews in the Designer. That includes the Swiper slider rules, which only apply once `site.js` adds the `swiper` classes.

## What's in the bundle

| File | Hook | What it does |
|---|---|---|
| `global/lenis.js` | every page | Smooth scroll, driven by Webflow's GSAP ticker. Re-measures on `lenis:resize`, body resize and DOM changes (CMS loads). Exposed as `window.lenis`. |
| `global/footer-reveal.js` | `.footer`, `.footer-trigger` | Keeps the spacer at the fixed footer's height. |
| `global/nav-scrolled.js` | `[toggle="scrolled"]` | Adds `.scrolled` after 20px of scroll, removes it under 10px. |
| `global/copyright-year.js` | `[copyright="year"]` | Current year. |
| `global/lottie-resize.js` | every page | Resizes Webflow Lotties with the window. |
| `global/sliders.js` | `[slider="section"]` | Swiper sliders (Case Studies template). Settings are attributes; see the file header. |
| `modules/alert.js` | `[data-module="alert"]` + `[data-alert-close]` | Dismissible alert bar, remembered 180 days. Not on any page yet. |
| `modules/map.js` | `[data-module="map"]` (or `.map` for now) | Google Map on Contact with the office pin and a directions button. |

## Release

```bash
npm run build
git add -A && git commit -m "<what changed>"
git push
git tag -a v1.1.0 -m "<what changed>"
git push origin v1.1.0
```

1. Check `https://cdn.jsdelivr.net/gh/pixelsilo/exclusive-residential@v1.1.0/dist/site.js` returns 200 with the new build.
2. Bump `VERSION` in the Webflow loader (Site settings > Custom code > Footer) and publish to webflow.io only.
3. Check the staging page: no console errors and the `[data-module]` roots have `data-ready`.
4. Live only after the client approves.

Rollback: set `VERSION` back to the previous tag and republish. Never move or re-push an existing tag, since jsDelivr caches tagged files permanently.

## Snippets

- `snippets/loader.html`: the loader for the Webflow Footer (source of truth).
- `snippets/footer.original.html`, `snippets/head.original.html`: the site's custom code before the move, kept for reference. Head custom code is now empty. The root files they point at were deleted after the move; they still exist at commit `708645a` (`https://cdn.jsdelivr.net/gh/pixelsilo/exclusive-residential@708645a/<file>`) if ever needed.
- `snippets/code-css.original.html`: the `code_css` embed before the Swiper rules were appended.
- `snippets/comingsoon.unused.js`: "Coming soon" tooltip for `href="#"` links. It was never loaded on the site; port it into `src/` if it's wanted.

