# Cookie consent

A small, self-hosted consent layer for the Exclusive Construction Group site. It is **built and tested but switched off**: nothing changes for visitors until the banner component is published in Webflow.

Related: [cookies.md](cookies.md) (what the site actually stores), `snippets/consent-banner.html` (banner markup, class list and CSS to build in Webflow), `src/modules/consent.js` (the code), `test/consent/` (local test page and checks).

## 1. Do we need a banner today?

**Not on the audited evidence.** The audit (24 Nov 2026, 13 staging pages, clean profiles) found no cookies and no localStorage/sessionStorage from the site, Google Maps, Finsweet or Turnstile. The only cookie-like item is Cloudflare's `_cfuvid` on custom domains, which is strictly necessary. PECR only requires consent for storage or access that isn't strictly necessary, so there is nothing to ask consent for. A banner that changes nothing would be misleading.

What the site does need now: a written **Cookie Policy** (the page is empty) and a **Privacy Policy** that names the third parties that receive a visitor's IP address (Google for Maps and Fonts, Cloudflare, Webflow, jsDelivr). Section 8 says what to put in the Cookie Policy.

A banner becomes necessary when any of these arrive:

- Google Analytics, GTM, Meta Pixel, LinkedIn Insight, Hotjar or any analytics or advertising tag.
- Vimeo embeds (the player can set cookies and local storage).
- Any other third-party embed (chat, scheduler, social feeds), or Google Maps changing to set cookies.

Optional: Luke or the client may still want it on now. It is cheap, the map becomes click-to-load, and it removes the question when Vimeo or analytics are added. The trade-off is a banner on a catalogue site for no legal requirement.

## 2. How it works

- The visitor's choice is stored in a **first-party cookie, `ecg_consent`**, holding JSON: `{ v: policyVersion, id: randomConsentId, ts: timestampMs, c: { functional, analytics, marketing, embeds } }`. Necessary storage needs no choice. The cookie lasts 12 months (`SameSite=Lax`, `Secure` on https).
- A stored choice is ignored, and the banner shows again, when its version differs from `POLICY_VERSION` in `src/modules/consent.js`, or when it is older than 12 months.
- `initConsent()` runs on every page (a GLOBAL in `src/main.js`). It creates `window.ecgConsent`, sets Google Consent Mode v2 defaults (all denied, `security_storage` granted), and releases gated scripts and iframes once their category is allowed.
- The banner module mounts on `[data-module="consent"]`. **Its presence is the switch**: with no banner element on a page and no stored choice, consent is "not enforced" and the site behaves as it does today. `analytics`, `marketing` and `embeds` are never treated as allowed without a recorded choice, even then.
- Reject all and Accept all are the same size and style, side by side on the first screen. Manage preferences has no pre-ticked boxes. Accept all only grants the categories the banner lists.
- Google Maps (`src/modules/map.js`) is wired behind the `functional` category. Once the banner is live, visitors who haven't agreed see a "Load map" placeholder. Clicking it loads the map for that page view only and stores nothing. Agreeing in the banner loads it at once, with no reload.
- Withdrawing a category that already released code (a script, or the map) reloads the page so it stops. Known analytics/marketing cookies are deleted (`CLEAR_ON_REVOKE`).

### Categories

| Key | Meaning | Used by today |
|---|---|---|
| `necessary` | Strictly necessary. Always on, no toggle, no consent needed. | Everything now on the site |
| `functional` | Features the visitor asked for that load third-party code or store a preference. | Google Maps, `ps_alert_dismissed` if the alert bar is published |
| `embeds` | Third-party media players. | Nothing yet (Vimeo, later) |
| `analytics` | Measuring use of the site. | Nothing yet |
| `marketing` | Advertising and tracking. | Nothing yet |

Consent Mode mapping: `functional` -> `functionality_storage`, `personalization_storage`; `analytics` -> `analytics_storage`; `marketing` -> `ad_storage`, `ad_user_data`, `ad_personalization`. `embeds` has no Google signal.

## 3. API: `window.ecgConsent`

| Member | What it does |
|---|---|
| `get()` | Current state `{ consentId, version, timestamp, categories: { necessary, functional, analytics, marketing, embeds } }`, or `null` if no valid choice is stored. |
| `allowed(category)` | `true` if the category may run now (consented, or `necessary`, or not enforced and `functional`). Use this for gating. |
| `when(category)` | Promise that resolves when the category is allowed (straight away if it already is). |
| `on(cb)` | Calls `cb(state)` on every saved choice. Returns an unsubscribe function. The same event fires on `window` as `ecg:consent` (`event.detail` is the state). |
| `set({ functional: true, ... })` | Saves a choice. Unlisted categories are saved as `false`. |
| `acceptAll()`, `rejectAll()` | Shortcuts for `set`. |
| `open(view = 'manage')` | Opens the banner. The same thing `[data-consent-open]` does. |
| `reset()` | Forgets the choice and shows the banner (QA and testing). |
| `scan()` | Releases gated code added to the DOM after load. |
| `needsChoice()` | `true` if no valid choice is stored. |
| `enforced`, `version`, `categories` | Read-only info. |

For module authors, `gateEmbed(root, category, start, { message, button })` (exported from `consent.js`) starts `start()` at once if the category is allowed, otherwise shows a click-to-load placeholder in `root`. The text can be overridden per element with `data-consent-message` and `data-consent-button`. `map.js` is the example.

### Gating scripts and iframes without writing JS

```html
<!-- inline or external script: stays inert until analytics is consented -->
<script type="text/plain" data-consent-category="analytics" src="https://example.com/tag.js"></script>

<!-- iframe: src is only set after the embeds category is consented -->
<iframe data-consent-category="embeds" data-consent-src="https://player.vimeo.com/video/123?dnt=1"></iframe>
```

Put these in a Webflow HTML embed. Use `data-consent-type="module"` on a script that needs another type. A gated iframe shows nothing until consent, so wrap it with a message or poster, or use `gateEmbed` from a module for a placeholder.

## 4. Adding a category or a gated service

1. Decide the category. Prefer an existing one. Only add a new key if the policy genuinely needs a separate switch.
2. For a new key, add it to `CATEGORIES` in `src/modules/consent.js` and, if it maps to a Google signal, to `GOOGLE_SIGNALS`. Add cookies to delete to `CLEAR_ON_REVOKE`.
3. **Bump `POLICY_VERSION`** (for example `'1'` -> `'2'`) so every visitor is asked again. Adding a service to an existing category also counts, because the visitor consented to something narrower.
4. In Webflow, add the matching toggle to the banner's Manage view: a DOM `input type="checkbox"` with `data-consent-toggle="<key>"`, plus a label and a plain description. Only list categories that are really in use. The toggle's presence is what makes Accept all include it.
5. Gate the service with a `text/plain` script, a `data-consent-src` iframe, or `gateEmbed`.
6. Update the Cookie Policy table and re-run the audit ([cookies.md](cookies.md)).
7. Build, run `test/consent/verify.mjs`, release.

Don't use Webflow's built-in Google Analytics integration (Project settings > Integrations) once consent matters: it adds the tag in the head before this script runs. Add GA4 as a gated script instead, or through GTM with Consent Mode.

## 5. Switching it on

Nothing is published until Luke says so. In this order:

1. **Release the JS first.** Merge the branch, `npm run build`, commit `dist/`, tag a minor version (for example `v1.1.0`), push the tag, check the jsDelivr URL, then bump `VERSION` in the footer loader (the `webflow-custom-code` skill has the full steps). This alone changes nothing for visitors: the module is inert without the banner element.
2. **Build the banner in Webflow** from `snippets/consent-banner.html`, Part 1, as a component inside the hidden `code-snippets` component (which is on every page, so the banner is too). Use the exact `data-*` attributes and the suggested classes. Reject all and Accept all must share one button style.
3. **Paste the CSS** (Part 2) into the `code_css` embed. It includes `.wf-design-mode` rules so the banner is visible on the Designer canvas.
4. **Add the "Cookie settings" link** to the footer, and to the Cookie Policy page: a link with `href="#"` and a custom attribute `data-consent-open` (empty value). Add it to `.footer-legal_link` next to the Cookie Policy link.
5. **Write the Cookie Policy** (section 8) and link the banner text to it.
6. **Publish to the webflow.io staging site only** and check: banner appears on a fresh private window; Reject all stores `ecg_consent` with every category `false`; Accept all loads the Contact map; Contact shows "Load map" until agreed; the footer link reopens it; DevTools shows no non-essential cookie before a choice.
7. Live only after the client approves.

To switch it off again: remove the banner component. The module goes back to doing nothing (a stored `ecg_consent` cookie still counts for returning visitors, which is correct).

Staging cookies: `ecg_consent` is host-only, so a choice on `exclgroup.webflow.io` doesn't carry to the live domain.

## 6. Optional consent log

Off by default (`CONSENT_LOG_URL = ''` in `src/modules/consent.js`). The cookie on the visitor's device **is** the consent. A server-side log is only extra proof (UK GDPR Art. 7(1): be able to demonstrate consent), useful if the client may need to show an auditor, ICO or complainant what a visitor chose and when. Many small sites don't keep one.

If a URL is set, every saved choice is sent as a POST with `Content-Type: text/plain` (to avoid a CORS preflight), `credentials: 'omit'`, no referrer, and this body only:

```json
{ "consentId": "3f1c…", "timestamp": "2026-11-24T21:40:00.000Z", "version": "1", "categories": { "necessary": true, "functional": true, "analytics": false, "marketing": false, "embeds": false } }
```

No IP address, user agent or personal data is included by the script. The receiving server will still see the visitor's IP in its connection logs. Configure it not to store it.

The backend isn't built. A minimal one is a Cloudflare Worker that accepts the POST, parses the text body as JSON, validates the fields, and writes a row to D1 or KV with CORS `Access-Control-Allow-Origin` set to the site's origins.

**Who holds it matters.** Use a **client-owned** Cloudflare account, or if Pixel Silo hosts it, Pixel Silo is a **processor** and needs a written data processing agreement with the client (UK GDPR Art. 28), and the client's privacy policy should name the arrangement. The consent ID is a random token, not tied to a person, but a log entry tied to a browser is arguably still personal data if it can be linked to the visitor's cookie, so treat it as personal data and set a retention period (matching the 12-month cookie plus a margin is reasonable).

## 7. Plain-English legal basis

This isn't legal advice. The client should confirm its cookie policy wording with whoever advises it.

- **PECR regulation 6** ([legislation](https://www.legislation.gov.uk/uksi/2003/2426/regulation/6)): a site may not store information on, or read it from, a visitor's device unless the visitor is told clearly what it is for and gives **consent**. The exception is storage that is **strictly necessary** to provide something the visitor asked for (for example a security cookie, or remembering what's in a basket). It covers cookies, localStorage, pixels, fingerprinting and similar technologies, not just cookies.
- **UK GDPR** ([ICO: consent](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/)): PECR uses the UK GDPR standard for consent. It must be a clear, unambiguous, informed, specific and freely given affirmative act. **No pre-ticked boxes, no "by continuing you agree", no consent bundled into terms.** It must be as easy to withdraw as to give, and you must be able to demonstrate it. Personal data collected through the tags (analytics IDs, IP addresses) is also governed by UK GDPR, so the privacy policy and a lawful basis still apply.
- **ICO guidance on storage and access technologies** ([ICO](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/)): in practice this means: **reject must be as easy as accept** (same layer, same prominence), nothing non-essential loads or is set before consent, don't nudge with colour or size, tell people what each category does, record and respect the choice, re-ask at sensible intervals (this module uses 12 months and any policy change), and let people change their mind later (the "Cookie settings" link).
- **Data (Use and Access) Act 2025** ([legislation](https://www.legislation.gov.uk/ukpga/2025/18/contents)): amends PECR to exempt a few more low-risk uses (some statistical analytics, appearance and functionality settings) provided the visitor is told and can object, and raises PECR fines to UK GDPR levels. The ICO's guidance is being updated to match. Until it is, treat analytics as needing consent and check the ICO page before relying on an exemption.
- **Fonts, maps and CDNs**: loading a script or font from Google, Cloudflare or jsDelivr discloses the visitor's IP address to that provider. That isn't a PECR storage event, but it is personal data processing, so the privacy policy must name the recipients and the lawful basis (legitimate interests for the site working, with the maps behind consent as built).
- **Enforcement reality**: the ICO has focused on large sites and on analytics/advertising cookies set before consent. A catalogue site with no analytics is low risk. The risk rises sharply the day an analytics tag or Vimeo is added without the banner.

## 8. What the client should put in their Cookie Policy

The page is currently empty. It should be plain English, dated, and say who the client is. A suggested structure:

1. **Who we are and what this policy covers**: Exclusive Construction Group, address and contact email. A cookie policy covers cookies and similar technologies (local storage, scripts that read your device).
2. **What we use today**: a table with name, who sets it, what it does, how long it lasts, and its category. Use the current audit:
   - Cloudflare `_cfuvid`, set by our host's security layer, rate-limiting and abuse protection, session, strictly necessary.
   - Cloudflare Turnstile on the contact form (protects the form from spam), strictly necessary, no cookie observed.
   - Google Maps on the Contact page, only loaded if you agree (or click "Load map"), shares your IP address and browser details with Google.
   - `ecg_consent` (only once the banner is live): remembers your choice for 12 months, strictly necessary.
   - `ps_alert_dismissed` (only if the alert bar is published): remembers you dismissed a notice, 180 days.
3. **What we don't use**: say plainly that there are currently no analytics or advertising cookies, if that remains true. **Update this whenever it changes.**
4. **Other third parties that receive your IP address** without setting cookies: Google (fonts), Cloudflare, Webflow (hosting and forms), jsDelivr and similar CDNs.
5. **How to change your mind**: a "Cookie settings" link (`data-consent-open`) once the banner is live, plus how to clear cookies in a browser, and a link to the ICO's guide to cookies.
6. **Contact and complaints**: how to reach the client, and that you can complain to the ICO.
7. **Version and date**: and **bump `POLICY_VERSION`** in the code whenever the table changes in a way that affects what visitors agreed to.

The Privacy Policy should separately cover contact-form data (what is collected, why, who processes it: Webflow and wherever notifications go, how long it's kept, rights, ICO complaint route).

## 9. Testing locally

```bash
npm install
npm i --no-save playwright-core        # test dependency, not saved to package.json
npm run build
node test/consent/build.mjs            # fetches the staging Contact page, injects the banner, loads ./dist/site.js
python -m http.server 5600 --bind 127.0.0.1      # in a second terminal, from the repo root
node test/consent/verify.mjs           # 41 checks in headless Edge
```

Open <http://127.0.0.1:5600/test/consent/contact.html> by hand to try it. The harness enables all four optional categories and includes gated test elements and a "Cookie settings" link. `shot-summary.png` and `shot-manage.png` are screenshots from the last run.

The checks cover: first visit (banner, nothing stored, map blocked, gated code dormant, Consent Mode defaults denied, reject and accept styled identically), reject all, accept all (map loads without reload, scripts and iframe released, events fire, Consent Mode update), manage (no pre-ticked boxes, partial choice, reopen via `[data-consent-open]`, withdrawal reloads the page), re-prompt on a changed policy version and on a 12-month-old choice, click-to-load, and the "no banner" state (map loads as today, optional categories stay blocked).

## 10. Gotchas

- **The bundle loads from the footer**, after the head. A tag added in the head (Webflow's native GA) runs before the Consent Mode defaults. Use gated scripts or GTM.
- **Webflow Form Checkbox elements need a Form block.** Build the toggles as DOM `input type="checkbox"` elements.
- **Don't style Reject smaller or greyer than Accept.** The ICO treats that as nudging.
- **A policy version bump re-asks everyone**, including people who rejected. That's intended.
- **`dist/site.js` is committed.** If this branch and another branch both rebuild it, resolve the merge by rebuilding rather than hand-editing.
