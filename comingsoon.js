(() => {
  // Placeholder links Webflow generates for pages/sections that aren't built yet.
  const LINK_SELECTOR = 'a[href="#"]';

  // Real Webflow-driven components (dropdowns, tabs, sliders) also use href="#" — skip those.
  const EXCLUDE_SELECTOR = [
    ".w-dropdown-toggle",
    ".w-tab-link",
    ".w-slider-arrow-left",
    ".w-slider-arrow-right",
    "[data-toggle]",
    "[data-ix]",
    "[aria-haspopup]",
    "[data-cs-ignore]",
  ].join(",");

  const TOOLTIP_TEXT = "COMING SOON";
  const STATUS_COLOR = "#dcb200";
  const CURSOR_OFFSET = 16;
  const TOUCH_OFFSET = 28; // lift above the fingertip so it isn't hidden
  const TOUCH_VISIBLE_MS = 1800;
  const EDGE_PADDING = 10;

  let tooltip = null;
  let activeLink = null;
  let rafId = null;
  let pointerX = 0;
  let pointerY = 0;
  let touchHideTimer = null;

  function injectStyles() {
    if (document.getElementById("cs-tooltip-styles")) return;
    const style = document.createElement("style");
    style.id = "cs-tooltip-styles";
    style.textContent = `
      .cs-tooltip {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 999999;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 14px;
        border-radius: 999px;
        background: rgba(17, 17, 17, 0.92);
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.2em;
        line-height: 1;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        opacity: 0;
        transform: translate3d(0, 0, 0) scale(0.94);
        transition: opacity 0.16s ease, transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
        will-change: transform, opacity;
      }
      .cs-tooltip.is-visible {
        opacity: 1;
      }
      .cs-tooltip__dot {
        position: relative;
        flex: none;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${STATUS_COLOR};
        box-shadow: 0 0 6px ${STATUS_COLOR};
      }
      .cs-tooltip__dot::after {
        content: "";
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        background: ${STATUS_COLOR};
        opacity: 0.55;
        animation: cs-tooltip-pulse 1.6s ease-out infinite;
      }
      @keyframes cs-tooltip-pulse {
        0% { transform: scale(0.6); opacity: 0.55; }
        100% { transform: scale(2.2); opacity: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .cs-tooltip {
          transition: opacity 0.12s ease;
        }
        .cs-tooltip__dot::after {
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureTooltip() {
    if (tooltip) return tooltip;
    injectStyles();
    tooltip = document.createElement("div");
    tooltip.className = "cs-tooltip";
    tooltip.setAttribute("role", "status");

    const dot = document.createElement("span");
    dot.className = "cs-tooltip__dot";
    tooltip.appendChild(dot);

    const label = document.createElement("span");
    label.textContent = TOOLTIP_TEXT;
    tooltip.appendChild(label);

    document.body.appendChild(tooltip);
    return tooltip;
  }

  // Fixed positioning + clientX/clientY (viewport space) keeps the tooltip glued to the
  // cursor regardless of Lenis's smooth-scroll offset — page/document coordinates would
  // drift out of sync while Lenis is still animating the scroll position.
  function positionTooltip(x, y) {
    if (!tooltip) return;
    const rect = tooltip.getBoundingClientRect();
    let left = x + CURSOR_OFFSET;
    let top = y + CURSOR_OFFSET;

    if (left + rect.width + EDGE_PADDING > window.innerWidth) {
      left = x - rect.width - CURSOR_OFFSET;
    }
    if (top + rect.height + EDGE_PADDING > window.innerHeight) {
      top = y - rect.height - CURSOR_OFFSET;
    }

    tooltip.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`;
  }

  function scheduleReposition() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      positionTooltip(pointerX, pointerY);
    });
  }

  function showTooltip(x, y) {
    ensureTooltip();
    pointerX = x;
    pointerY = y;
    positionTooltip(x, y);
    tooltip.classList.add("is-visible");
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.classList.remove("is-visible");
  }

  function onPointerMove(e) {
    pointerX = e.clientX;
    pointerY = e.clientY;
    scheduleReposition();
  }

  function clearActive() {
    activeLink = null;
    window.removeEventListener("pointermove", onPointerMove);
    hideTooltip();
  }

  function isExcluded(link) {
    return link.matches(EXCLUDE_SELECTOR);
  }

  function bindLink(link) {
    if (link.dataset.csBound || isExcluded(link)) return;
    link.dataset.csBound = "true";

    // Dead link — stop the default jump-to-top navigation (and the smooth-scroll Lenis would play).
    link.addEventListener("click", (e) => e.preventDefault());

    link.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      activeLink = link;
      showTooltip(e.clientX, e.clientY);
      window.addEventListener("pointermove", onPointerMove);
    });

    link.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "touch") return;
      if (activeLink === link) clearActive();
    });

    link.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      activeLink = link;
      clearTimeout(touchHideTimer);
      showTooltip(e.clientX, e.clientY - TOUCH_OFFSET);
      touchHideTimer = setTimeout(() => {
        if (activeLink === link) clearActive();
      }, TOUCH_VISIBLE_MS);
    });

    link.addEventListener("focus", () => {
      const rect = link.getBoundingClientRect();
      activeLink = link;
      showTooltip(rect.left + rect.width / 2, rect.bottom);
    });

    link.addEventListener("blur", () => {
      if (activeLink === link) clearActive();
    });
  }

  function bindAll() {
    document.querySelectorAll(LINK_SELECTOR).forEach(bindLink);
  }

  function init() {
    bindAll();

    // Re-bind newly injected links (Webflow interactions, CMS content, etc.)
    const observer = new MutationObserver(() => bindAll());
    observer.observe(document.body, { childList: true, subtree: true });

    // A hovered/tapped link can scroll out from under a stationary cursor while Lenis is
    // still animating — hide immediately rather than letting a stale tooltip drift on screen.
    window.addEventListener("scroll", () => activeLink && clearActive(), { passive: true, capture: true });
    window.addEventListener("wheel", () => activeLink && clearActive(), { passive: true });
    window.addEventListener("resize", () => activeLink && clearActive());

    document.addEventListener("touchstart", (e) => {
      if (activeLink && !activeLink.contains(e.target)) clearActive();
    }, { passive: true });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && activeLink) clearActive();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
