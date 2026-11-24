// Builds test/consent/contact.html: a copy of the staging Contact page that loads the LOCAL
// dist/site.js instead of the jsDelivr loader, with the draft banner (snippets/consent-banner.html),
// a "Cookie settings" link and gated test elements added. Not for Webflow, local testing only.
//   npm run build && node test/consent/build.mjs && python -m http.server 5600
//   open http://127.0.0.1:5600/test/consent/contact.html
import { readFileSync, writeFileSync } from 'node:fs';

const res = await fetch('https://exclgroup.webflow.io/contact');
let html = await res.text();

// Swap the footer loader for the local bundle
// (the tempered pattern stops the match swallowing earlier scripts)
const loader = /<script>(?:(?!<\/script>)[\s\S])*?exclusive-residential(?:(?!<\/script>)[\s\S])*<\/script>/;
html = html.replace(loader, '<script src="/dist/site.js"></script>');
if (!html.includes('/dist/site.js')) throw new Error('loader not found in staging HTML');

const banner = readFileSync(new URL('../../snippets/consent-banner.html', import.meta.url), 'utf8');
const extras = `
<!-- TEST ONLY: footer hook and gated content -->
<p style="position:relative;z-index:5;margin:1rem"><a href="#" id="test-open" data-consent-open>Cookie settings</a></p>
<script type="text/plain" data-consent-category="analytics">window.__gatedAnalytics = (window.__gatedAnalytics || 0) + 1;</script>
<script type="text/plain" data-consent-category="marketing">window.__gatedMarketing = true;</script>
<iframe id="test-embed" data-consent-category="embeds" data-consent-src="about:blank#embed-loaded" title="test embed" style="display:none"></iframe>
`;
// Turn on every category in the harness so all of them can be tested
const all = banner.replace(/<!--\s*(<div class="consent_option">[\s\S]*?)\s*-->/, '$1');
html = html.replace('</body>', all + extras + '</body>');
writeFileSync(new URL('./contact.html', import.meta.url), html);
console.log('wrote test/consent/contact.html', html.length, 'bytes');
