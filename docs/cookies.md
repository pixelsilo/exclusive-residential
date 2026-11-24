# Cookie and storage inventory

Audited 24 Nov 2026 against https://exclgroup.webflow.io (Webflow site `6a68dfaeda21c862740b9dd3`, loader `v1.0.0`).
Method: headless Edge, a fresh browser profile per page. Each page was loaded, scrolled to the bottom to trigger lazy content, then all cookies (including HttpOnly and third-party), `localStorage`, `sessionStorage`, `Set-Cookie` response headers and request hosts were recorded.
Pages: Home, About, Residential, Projects, Aftercare, Portfolio, Contact, `/case-studies/mayfair`, `/case-studies/south-kensington`, `/case-studies/33-portland-place`, Cookie Policy, Privacy Policy, Old Home.

Re-run this audit after any change that adds a script, embed, video or form (see "What changes this" below).

## Result in one line

**Nothing is stored on a visitor's device by the site as it stands today.** Zero cookies and zero `localStorage`/`sessionStorage` keys on all 13 pages, first or third party. The only cookie-like thing is Cloudflare's `_cfuvid`, which exists only on custom domains and is strictly necessary.

## Inventory

| # | Name / what | Where it appears | Party | Type | Lifetime | Category (PECR / ICO) |
|---|---|---|---|---|---|---|
| 1 | `_cfuvid` cookie. HttpOnly, Secure, SameSite=None. Set by Cloudflare, which fronts Webflow hosting. | In the `Set-Cookie` header of every HTML response on a **custom domain** (seen on `excl.group`). On `exclgroup.webflow.io` the header is sent but browsers reject it (`webflow.io` is on the Public Suffix List), so the cookie jar stays empty on staging. | First party domain, set by the CDN | Cookie | Session | **Strictly necessary.** Cloudflare uses it for rate-limiting and security. We don't control it and can't remove it from Webflow hosting. |
| 2 | `ps_alert_dismissed` cookie, 180 days (`src/modules/alert.js`) | **Not on any page** (module exists, no `data-module="alert"` element is published) | First party | Cookie | 180 days | Would be **functional/preference** if the alert bar is ever published. It remembers a dismissal the visitor asked for, so it is arguably exempt, but list it in the policy. |
| 3 | `ps-dev` in `localStorage` (the `?dev` loader switch) | Only set in a developer's browser after visiting `?dev`. Never set for normal visitors (verified: no keys on any page). | First party | localStorage | Until cleared | Not applicable to visitors. Developer tooling only. |
| 4 | Google Maps JavaScript API (`maps.googleapis.com`, `maps.gstatic.com`, plus `fonts.gstatic.com` Roboto for the map UI) | `/contact` only (`src/modules/map.js`, loads on page view) | Third party | Script, tile and log requests | n/a | **No cookie or storage key was set** in a clean profile, including third-party cookies. Loading it does send the visitor's IP address and browser details to Google, and Google can add cookies in other circumstances (for example a signed-in Google user). Treated as **functional and consent-gated by default**, for safety and UK GDPR transparency. See `docs/consent.md`. |
| 5 | Cloudflare Turnstile (`challenges.cloudflare.com`, `brunhild.challenges.cloudflare.com`) | `/contact` (Webflow form bot protection) | Third party | Script and challenge requests, an invisible iframe | n/a | **Strictly necessary** (security and spam protection for a form the visitor is submitting). No cookies observed in a clean profile. Mention it in the policy. |
| 6 | Finsweet Attributes v2 (`cdn.jsdelivr.net/npm/@finsweet/attributes@2`) | `/portfolio` | Third party CDN (script only) | Script | n/a | **Strictly necessary** (it runs the portfolio filtering the visitor is using). No storage. |
| 7 | Finsweet inputactive (`@finsweet/attributes-inputactive@1`) | `/contact` | Third party CDN (script only) | Script | n/a | Same as 6. No storage. |
| 8 | Webflow form (`Email Form`) | `/contact` | First party, posts to Webflow | Form post | n/a | Not a cookie. Submitting is the visitor's own action. The privacy policy must cover it (what is collected, why, Webflow as processor). |
| 9 | Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`, `ajax.googleapis.com` WebFont loader) | **Every page** (Webflow's font loader) | Third party | Stylesheet and font requests | n/a | **No cookies set.** Sends the visitor's IP to Google. Not a PECR storage event, but a UK GDPR transparency point for the privacy policy. To remove it, self-host the fonts in Webflow (Project settings > Fonts). |
| 10 | jQuery from `d3e54v103j8qbb.cloudfront.net`, assets from `cdn.prod.website-files.com`, JS from jsDelivr | Every page | Third party CDNs | Script and asset requests | n/a | Strictly necessary. No storage. |
| 11 | Webflow-hosted background `<video>` (0 to 8 per page) | Most pages | Webflow CDN | Media requests | n/a | Strictly necessary. No storage. **If these move to Vimeo** that becomes an embed with its own cookies, see below. |

Not present (nothing loaded on any page): Google Analytics / GTM (Webflow `googleTagIds` is empty), Meta Pixel, LinkedIn Insight, Hotjar, YouTube, Vimeo, reCAPTCHA, chat widgets, Webflow Memberships or Ecommerce.

## Classification summary

| Category | Items today |
|---|---|
| Strictly necessary | `_cfuvid` (custom domain), Turnstile, CDN assets, Webflow-hosted video, form handling, Finsweet scripts |
| Functional / preferences | `ps_alert_dismissed` (only if the alert bar is ever published) |
| Analytics | none |
| Marketing | none |
| Embeds / third-party media | Google Maps (no cookies observed, consent-gated anyway), Vimeo (future) |

## Is a banner legally needed today?

**No, not on this evidence.** PECR regulation 6 requires consent only for storing or accessing information on a device that is not strictly necessary. The site stores nothing non-essential, so there is nothing to ask consent for. A banner whose buttons change nothing would also be misleading. What the site does need today is an accurate **Cookie Policy** (currently an empty page) and **Privacy Policy** that name Google Maps, Google Fonts, Cloudflare, Webflow and jsDelivr as recipients of the visitor's IP address. Full reasoning is in `docs/consent.md`.

## What changes this

| Change | Effect |
|---|---|
| Adding Google Analytics 4, GTM, Meta Pixel, LinkedIn Insight, Hotjar or similar | **Banner required.** Analytics and marketing need opt-in consent before the tag loads. The Data (Use and Access) Act 2025 adds a narrow exemption for some low-risk statistical cookies, but it only applies when the visitor is told and can object. Don't rely on it for GA4. |
| Moving videos to Vimeo (pixelsilo.net hosting) | Vimeo's player can set cookies and use local storage. **Banner required** for the embeds unless a re-audit proves the configuration (for example `dnt=1`) stores nothing. Gate behind the `embeds` category either way. |
| Google Maps starts setting cookies (re-audit after any API change) | Already gated behind `functional` with click-to-load, so it only needs the banner switched on. |
| A chat widget, scheduler or other third-party embed | Re-audit. Assume a banner is needed until proven otherwise. |
| Publishing the alert bar | Probably still exempt (stored because the visitor clicked dismiss), but list it in the policy. |

## How to re-run the audit

In any Chromium with a clean profile, load each page and scroll it fully. Then in DevTools > Application > Storage list the cookies, local storage and session storage for every origin, and check the Network tab for third-party hosts. The audit script isn't in the repo; the method above is enough to repeat it.
