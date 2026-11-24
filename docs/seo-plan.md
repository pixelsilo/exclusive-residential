# Exclusive Construction Group: SEO, AEO and Lighthouse plan

Approved 24 Nov 2026, with videos parked (P3, P4) because they may move to Vimeo; scores are reported with the videos as they are. It is based on staging (`https://exclgroup.webflow.io`), checked with Lighthouse 13 (mobile and desktop) on 8 pages, plus a crawl of all 17 linked pages and a read of the CMS. The live domain isn't set yet, so anything that depends on it is marked **(at launch)**.

## 1. Where it stands

**Lighthouse now (mobile / desktop)**

| Page | Performance | Accessibility | Best practices | SEO* | Mobile LCP |
|---|---|---|---|---|---|
| Home | 55 / 89 | 96 / 96 | 100 / 100 | 66 / 66 | 9.2 s |
| About | 46 / 84 | 94 / 90 | 100 / 100 | 66 / 66 | 8.6 s |
| Residential | 61 / 90 | 94 / 94 | 100 / 100 | 63 / 63 | 8.7 s |
| Projects | 61 / 89 | 95 / 94 | 100 / 100 | 66 / 66 | 11.6 s |
| Aftercare | 61 / 90 | 94 / 94 | 100 / 100 | 66 / 66 | 8.6 s |
| Portfolio | 66 / 92 | 94 / 89 | 100 / 100 | 66 / 66 | 8.2 s |
| Contact | 64 / 82 | 95 / 91 | 100 / 100 | 66 / 66 | 10.1 s |
| Case study (33 Portland Place) | 67 / 99 | 95 / 95 | 100 / 100 | 66 / 66 | 8.4 s |

\*SEO is capped at about 66 on staging **on purpose**. Webflow's staging robots.txt says `Disallow: /`, which stops the unfinished site being indexed. Every other SEO audit passes. On the live domain this audit passes, so verification here scores SEO without it.

**What's holding each score back**

- **Mobile performance (the big one).** Layout shift is 0, and the slowdown isn't large images. Two causes account for most of it:
  1. **The hero headline is hidden until JavaScript runs.** On most pages the largest element is the hero `h1`. Its `load="heading"` interaction keeps it invisible until jQuery, webflow.js and GSAP have downloaded and the split-text reveal has started. On a throttled phone that takes 8 to 11 seconds. The Contact hero image has the same problem, and it is also set to `loading="lazy"`.
  2. **Too many bytes up front:** 1.7 to 7 MB per page. The Home hero video is 3.6 MB, and the case-study videos further down the page (Mayfair 1.1 MB, South Kensington 0.8 MB, and others) all start downloading immediately. The three Helvetica Neue weights are `.otf` files at 125 to 250 KB each, where WOFF2 would be about half that. A leftover Google font (Bitter) loads through `webfont.js`, which blocks rendering, but nothing on the site uses it.
- **Accessibility (89 to 96).** Logo links and the portfolio card links have no accessible name. No page has a `<main>` landmark. One small label is light grey (#e8e8e8) on the brand yellow (#dcb200), a contrast ratio of 1.6:1.
- **Best practices** are 100 everywhere already.

**SEO and AEO findings**

| Severity | Finding |
|---|---|
| Critical | **No structured data anywhere.** Nothing tells Google or AI answer engines who the company is, where it is, what it does, or which projects it has delivered. |
| Critical (at launch) | **No sitemap** (`/sitemap.xml` is 404) and no canonical URLs. Both are switched on in Site settings once the domain is set. |
| High | **Two brand names in use.** The footer says "Exclusive Residential Ltd trading as Exclusive Construction Group", but About, Contact and every case-study title say "Exclusive Residential Group". Search engines and AI models need one consistent name. |
| High | **Heading structure:** About has **8 `h1`s**, and Portfolio has **no headings at all**. |
| High | **All 70+ images have empty alt text.** That's fine for background textures, but the case-study galleries are the site's best evidence of its work and are invisible to image search and AI. |
| High | **Legal pages are empty.** Privacy Policy and Cookie Policy have no content, no description and the default title, and the contact form links to the Privacy Policy. This needs copy from the client. |
| High | **The footer logo links to `/old-home`**, and **Old Home** is published: a duplicate of Home that competes with it. **Styleguide** and **video-holder** are published too. |
| Medium | **Titles too long:** Home 69, Residential 76 and Projects 74 characters (the limit is about 60). **Descriptions too long:** About 176 and Residential 174 (the limit is about 160). |
| Medium | **Case-study descriptions** reuse the one-line headline (63 to 131 characters), even though the CMS already has an unused **Meta Description** field. |
| Medium | **Thin pages:** Contact has about 110 words and the service pages about 300. There are no FAQs, which are what answer engines quote most. |
| Low | The copyright year is filled in by JavaScript, so crawlers that don't run JS (most AI crawlers) see "© -". |
| Low | There's no `llms.txt`. It's cheap to add, though nothing guarantees AI tools will use it. |

The 404 page works (it returns status 404 with its own page).

## 2. Targets, honestly

| | Desktop | Mobile |
|---|---|---|
| Performance | 99 to 100 | 90 to 98 is realistic. 99 to 100 needs the hero changes in 3A **and** no autoplay hero video on phones. |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 (on the live domain) | 100 (on the live domain) |

Why mobile has a ceiling: every Webflow page ships jQuery and webflow.js (about 160 KB), and the site's interactions use GSAP. None of that can be removed, and Lighthouse's mobile test runs on a heavily throttled phone. Scores also vary by ±3 to 5 between runs, so I'll report the median of three.

## 3. The plan

### 3A. Performance

| # | Change | Who | Effect |
|---|---|---|---|
| P1 | **Hero headline visible at first paint.** Keep the reveal, but start the `h1` visible: animate only movement (and the split lines underneath), not opacity from 0. If the Interactions API can't edit this, Luke changes the `load="heading"` interaction in the Designer. | Me, or Luke in the Designer | Biggest single win: mobile LCP from about 9 s to about 2 to 3 s |
| P2 | **Contact hero image: eager, high priority** (it's currently lazy). The same applies to any above-the-fold image on the case-study template. | Me | Contact LCP |
| ~~P3~~ | **Parked (Luke, 24 Nov): videos may move to Vimeo.** ~~Videos below the hero load only when scrolled to.** Change the case-study video embeds to `preload="none"` with a `data-src`, and add a small `lazy-video` module in `site.js` that loads and plays them as they come into view. | Me (embed plus JS, release v1.1.0) | Saves 1 to 5 MB per page |
| ~~P4~~ | **Parked, as P3.** ~~Home hero video:~~ re-encode to about 1 MB (720p H.264 plus WebM), and on phones show the poster frame and start the video after load. | Me (encode); Luke uploads in Webflow if the API can't replace it | Mobile weight and LCP |
| P5 | **Fonts:** convert the three Helvetica Neue `.otf` files to WOFF2 and preload the regular weight. Remove the unused **Bitter** Google font, which also removes the render-blocking `webfont.js`. | Me (convert); Luke swaps them in Site settings → Fonts | About 300 KB less, plus one fewer blocking script |
| P6 | **Google Map on Contact:** load it when it scrolls into view, with the static pin image until then. | Me (in `site.js`) | Contact blocking time |
| P7 | Check that the 13 Lottie files on Home are small, and that the decorative stock images (`ug_bg`) use the right sizes. | Me | Minor |

### 3B. Accessibility

| # | Change | Who |
|---|---|---|
| A1 | `aria-label` on the nav and footer logo links ("Exclusive Construction Group home") and on each portfolio card link (bound to the project name). | Me |
| A2 | Change the page wrapper's tag to `<main>` on every page and template. | Me |
| A3 | Make the yellow label's text dark (#111 or the site's black variable), to bring contrast above 4.5:1. | Me |
| A4 | Fix the footer logo link (from `/old-home` to `/`). | Me |

### 3C. SEO

| # | Change | Who |
|---|---|---|
| S1 | **One brand: Exclusive Construction Group** (confirmed by Luke 24 Nov; "Exclusive Residential Group" is an old name). The disciplines are Residential, Projects (commercial) and Aftercare. The legal entity Exclusive Residential Ltd (09421240) appears only as `legalName` in schema. | Me |
| S2 | New titles and descriptions (section 4). | Me |
| S3 | **Case-study template:** title `{Name} \| Exclusive Construction Group`, description from the **Meta Description** field. Write the 7 missing descriptions (section 4). | Me |
| S4 | **Headings:** About gets one `h1` (the others become `h2`/`h3`), and Portfolio gets an `h1`. | Me |
| S5 | **Alt text:** descriptive alt on case-study gallery and hero images (on the asset, written from each project's details). Decorative textures stay empty, which is correct. | Me |
| S6 | Set **Old Home** to draft. Set **Styleguide** and **video-holder** to draft, or noindex them. | Me (Luke to confirm Old Home isn't needed) |
| S7 | **Legal pages:** proper titles and descriptions now; the content comes from the client (a to-do). | Me, plus a client to-do |
| S8 | **(At launch)** Turn on the auto sitemap, set the global canonical URL, check robots.txt on the live domain, and submit to Search Console. | Luke (Site settings) |
| S9 | Write the copyright year into the markup (keep the JS so it updates). | Me |

### 3D. AEO (being the answer in Google AI Overviews, ChatGPT and Perplexity)

| # | Change | Who |
|---|---|---|
| E1 | **Organization schema, site-wide:** `GeneralContractor` with name, legal name, logo, address (288 Bishopsgate, London EC2M 4QP), phone, email, geo, area served (London), founder (Charlie Johnson), and `sameAs` (LinkedIn, Instagram, Companies House). Plus `WebSite`. | Me |
| E2 | **Service schema** on Residential, Projects and Aftercare, each linked to the Organization. **BreadcrumbList** on every page. | Me |
| E3 | **Case-study schema** (`CreativeWork` plus `Place`, with the project's address, client type, value, architect and engineers from the CMS fields). This is the strongest AEO asset: verifiable project evidence. | Me |
| E4 | **FAQ sections plus FAQPage schema** on Residential, Projects, Aftercare and Contact, with 4 to 6 questions each (for example "Do you work on listed buildings?", "What size of project do you take on?", "Which areas of London do you cover?", "What does aftercare include?"). I draft the copy; Luke and the client approve it. | Me (draft and build), with client approval |
| E5 | **Answer-first opening lines** on the service pages: one sentence saying who you are, what you do and where, which AI tools can quote directly. This is a light copy edit, for approval. | Me (draft), with approval |
| E6 | `llms.txt` (company summary, services, project list, contact), if Webflow's SEO settings support it. | Me (draft); Luke uploads it |
| E7 | **(At launch)** A Google Business Profile for 288 Bishopsgate, and consistent name, address and phone on LinkedIn and directories (PrimeResi lists most competitors). | Luke / client |

## 4. Proposed titles and descriptions

Titles are 60 characters or fewer and descriptions 160 or fewer (lengths counted by script). The pattern is topic first, brand last. Pages not listed keep what they have.

| Page | Title | Description |
|---|---|---|
| Home | Exclusive Construction Group \| London Super-Prime Builder (57) | Exclusive Construction Group delivers super-prime residential, heritage restoration and prestige development projects across London, with dedicated aftercare. (158) |
| About | *(keep)* Leadership & Ethos \| Exclusive Construction Group (49) | The leadership behind Exclusive Construction Group. Founded by Charlie Johnson, we build trust through transparent, collaborative super-prime construction. (155) |
| Residential | Super-Prime Homes & Heritage \| Exclusive Construction Group (59) | Bespoke super-prime homes and sensitive heritage restorations for private clients across London, delivered with exceptional craftsmanship and discretion. (153) |
| Projects | Prestige Commercial Projects \| Exclusive Construction Group (59) | *(keep, 152)* |
| Aftercare | Aftercare & Maintenance \| Exclusive Construction Group (54) | *(keep, 144)* |
| Contact | *(keep)* | Speak to the directors at Exclusive Construction Group about super-prime residential commissions, prestige developments and dedicated aftercare in London. (154) |
| Case studies | {Name} \| Exclusive Construction Group | CMS **Meta Description** field, for example: *33 Portland Place: high-end refurbishment of a Grade II listed townhouse in central London, delivered by Exclusive Construction Group.* |
| Legal | {Name} \| Exclusive Construction Group | How Exclusive Construction Group collects, uses and protects your personal information. (Privacy; the Cookie version is similar) |

## 5. Order of work

1. **Quick, safe wins:** S1 to S4, S6, S7, S9, A1 to A4, P2, and E1 to E3. I can do all of these through the API, publish to staging and check them. That moves accessibility to 100 and SEO to 100 (excluding the staging block), and gives the site full structured data.
2. **Performance build:** P3, P6 and the lazy-video module, released as site.js v1.1.0. Then the P1 hero change.
3. **Needs Luke in Site settings or the Designer:** P4 upload, the P5 font swap, and P1 if the API can't edit interactions.
4. **Needs approval or client input:** the E4 FAQ copy, E5 opening lines, S5 alt text review, S7 legal content, and E6 `llms.txt`.
5. **(At launch):** S8 and E7.
6. **Re-run Lighthouse** (median of 3, mobile and desktop) on all 8 pages, and report before and after.

Everything goes to webflow.io staging only. Nothing is published live.

## 6. Status (24 Nov 2026, staging only)

**Done and checked on exclgroup.webflow.io**
- S1/S2: brand and new titles/descriptions on every page. Legal template has a proper title and description.
- S3: case-study titles `{Name} | Exclusive Construction Group`; descriptions written for all 25 projects (CMS **Meta Description** field, bound to the template).
- S4: About now has one `h1` (eyebrow and dark-section title h2, timeline entries h3); Portfolio has a visually hidden `h1` (class `sr-only`).
- S6: Old Home, Styleguide and video-holder set to draft (404 on staging).
- A1: logo links labelled; Portfolio card links labelled from the CMS name; featured-case-studies cards labelled by `site.js` (`[data-card]` hooks).
- A2: `<main>` on every page and both templates. A3: dark text on the yellow current-page nav link (code_css embed). A4: footer logo links to Home.
- P2: Contact hero `loading="eager"` + `fetchpriority="high"` + alt text. P6: Google Map loads only near the viewport (site.js v1.1.0).
- E1/E2: JSON-LD on Home (GeneralContractor, WebSite, WebPage), Residential/Projects/Aftercare (Service + BreadcrumbList), About (AboutPage + directors), Contact (ContactPage + contact point), Portfolio (CollectionPage). URLs assume `https://excl.group`.
- Alert bar wired to the `alert` module (`data-module="alert"`, `data-alert-close`).

**Blocked or needs Luke**
- E3 case-study schema: the API stores CMS tokens but they render empty, so it was removed. Paste `snippets/case-study-schema.md` in the Designer.
- P1 hero headline: the char-split fade (interactions `load-1`, `sector-load`, `load-about`) keeps the `h1` hidden until JS runs. That's the main remaining mobile LCP cost, and changing it is a design call.
- P5 fonts (WOFF2 + remove Bitter): Site settings → Fonts.
- S9 copyright year: the API can't edit the footer's `-` placeholder text; type the year in the Designer.

**Content the client needs to supply (found during the audit)**
- Lorem ipsum body copy on 7 published case studies (Mayfair, South Kensington, Marylebone Hotel, 39-40 Lowndes Square, Peninsula Heights, 1-5 Grosvenor Apartments, 33 Portland Place) and on 3 About timeline entries.
- 18 non-clickable projects have published pages saying "To be provided seperatley".
- Privacy and Cookie Policy content.
