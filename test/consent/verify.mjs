// End-to-end check of the consent module against test/consent/contact.html.
//   npm i --no-save playwright-core
//   npm run build && node test/consent/build.mjs
//   python -m http.server 5600 --bind 127.0.0.1     (separate terminal, from the repo root)
//   node test/consent/verify.mjs
import { chromium } from 'playwright-core';

const URL = 'http://127.0.0.1:5600/test/consent/contact.html';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let failed = 0;
const check = (name, ok, extra = '') => {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ' + extra}`);
};

async function open(ctx, { nobanner = false } = {}) {
  const page = await ctx.newPage();
  const maps = [];
  const errors = [];
  page.on('request', (r) => /maps\.googleapis\.com\/maps\/api\/js/.test(r.url()) && maps.push(r.url()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && /\[exr\]/.test(m.text()) && errors.push(m.text()));
  if (nobanner) {
    await page.route(URL, async (route) => {
      const res = await route.fetch();
      await route.fulfill({ response: res, body: (await res.text()).replace('data-module="consent"', 'data-nobanner') });
    });
  }
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  return { page, maps, errors };
}
const cookie = async (ctx) => {
  const c = (await ctx.cookies()).find((x) => x.name === 'ecg_consent');
  return c ? JSON.parse(decodeURIComponent(c.value)) : null;
};
const bannerVisible = (page) => page.evaluate(() => document.querySelector('[data-module="consent"]').classList.contains('is-visible'));
const viewOf = (page) => page.getAttribute('[data-module="consent"]', 'data-view');
const fresh = () => browser.newContext({ locale: 'en-GB', viewport: { width: 1280, height: 900 } });
const seedCookie = (ctx, patch) =>
  ctx.addCookies([
    {
      name: 'ecg_consent',
      value: encodeURIComponent(JSON.stringify({ v: '1', id: 'abc', ts: Date.now(), c: { functional: true, analytics: true, marketing: false, embeds: false }, ...patch })),
      url: 'http://127.0.0.1:5600/',
    },
  ]);

// 1. First visit: banner shows, nothing stored, map is a click-to-load placeholder, gated code stays dormant
{
  const ctx = await fresh();
  const { page, maps, errors } = await open(ctx);
  check('first visit: banner visible', await bannerVisible(page));
  check('first visit: summary view', (await viewOf(page)) === 'summary');
  check('first visit: no consent cookie set', (await cookie(ctx)) === null);
  check('first visit: map blocked, placeholder shown', maps.length === 0 && (await page.locator('.ecg-consent-placeholder').count()) === 1);
  check('first visit: gated scripts dormant', await page.evaluate(() => !window.__gatedAnalytics && !window.__gatedMarketing && document.querySelectorAll('script[type="text/plain"]').length === 2));
  check(
    'first visit: Consent Mode defaults denied',
    await page.evaluate(() => {
      const d = [...window.dataLayer].find((a) => a[0] === 'consent' && a[1] === 'default');
      return d && d[2].analytics_storage === 'denied' && d[2].ad_storage === 'denied' && d[2].security_storage === 'granted';
    })
  );
  check('first visit: no script errors', errors.length === 0, errors.join('|'));
  const look = (action) =>
    page.locator(`[data-consent-view="summary"] [data-consent-action="${action}"]`).evaluate((el) => {
      const box = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return { cls: el.className, h: Math.round(box.height), font: css.fontWeight + css.fontSize, bg: css.backgroundColor, fg: css.color };
    });
  const [r, a] = [await look('reject-all'), await look('accept-all')];
  check('reject and accept look identical', r.cls === a.cls && r.h === a.h && r.font === a.font && r.bg === a.bg && r.fg === a.fg, JSON.stringify([r, a]));
  await page.screenshot({ path: 'test/consent/shot-summary.png' });
  await ctx.close();
}

// 2. Reject all
{
  const ctx = await fresh();
  const { page, maps } = await open(ctx);
  await page.click('[data-consent-view="summary"] [data-consent-action="reject-all"]');
  const c = await cookie(ctx);
  check('reject: banner closes', !(await bannerVisible(page)));
  check('reject: cookie records all optional categories false', c && Object.values(c.c).every((v) => v === false) && c.v === '1' && !!c.id && !!c.ts, JSON.stringify(c));
  check('reject: map not loaded, gated code dormant', maps.length === 0 && (await page.evaluate(() => !window.__gatedAnalytics)));
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(500);
  check('reject: reload does not re-prompt', !(await bannerVisible(page)));
  check('reject: ecgConsent.get reflects it', await page.evaluate(() => {
    const s = ecgConsent.get();
    return s && s.categories.necessary && !s.categories.analytics && !s.categories.functional;
  }));
  const stored = (await ctx.cookies()).find((x) => x.name === 'ecg_consent');
  check('reject: cookie is first-party, lax, 12 months', stored && stored.sameSite === 'Lax' && Math.abs((stored.expires - Date.now() / 1000) / 86400 - 365) < 2, JSON.stringify(stored));
  await ctx.close();
}

// 3. Accept all: map loads without reload, every gate releases, Consent Mode updates, change event fires
{
  const ctx = await fresh();
  const { page, maps } = await open(ctx);
  await page.evaluate(() => {
    window.__events = [];
    window.addEventListener('ecg:consent', (e) => window.__events.push(e.detail));
    ecgConsent.on(() => window.__events.push('cb'));
  });
  await page.click('[data-consent-view="summary"] [data-consent-action="accept-all"]');
  await page.waitForTimeout(1500);
  const c = await cookie(ctx);
  check('accept: all four optional categories true', c && Object.values(c.c).length === 4 && Object.values(c.c).every(Boolean), JSON.stringify(c));
  check('accept: map loads without a reload, placeholder gone', maps.length === 1 && (await page.locator('.ecg-consent-placeholder').count()) === 0);
  check('accept: gated scripts released', await page.evaluate(() => window.__gatedAnalytics === 1 && window.__gatedMarketing === true && !document.querySelector('script[type="text/plain"]')));
  check('accept: gated iframe src set', await page.evaluate(() => document.getElementById('test-embed').src.endsWith('#embed-loaded')));
  check('accept: change event and on() callback fired', await page.evaluate(() => window.__events.length === 2));
  check(
    'accept: Consent Mode update granted',
    await page.evaluate(() => {
      const u = [...window.dataLayer].find((a) => a[0] === 'consent' && a[1] === 'update');
      return u && u[2].analytics_storage === 'granted' && u[2].ad_user_data === 'granted';
    })
  );
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1200);
  check('accept: next visit loads map straight away, no banner', !(await bannerVisible(page)) && (await page.evaluate(() => !!window.google?.maps)));
  await ctx.close();
}

// 4. Manage: boxes start empty, partial choice honoured, [data-consent-open] reopens with saved state, withdrawal
{
  const ctx = await fresh();
  const { page, maps } = await open(ctx);
  await page.click('[data-consent-action="manage"]');
  check('manage: manage view shown', (await viewOf(page)) === 'manage');
  check('manage: no box pre-ticked', await page.evaluate(() => [...document.querySelectorAll('[data-consent-toggle]')].every((el) => !el.checked)));
  await page.check('[data-consent-toggle="functional"]');
  await page.screenshot({ path: 'test/consent/shot-manage.png' });
  await page.click('[data-consent-view="manage"] [data-consent-action="save"]');
  await page.waitForTimeout(1500);
  const c = await cookie(ctx);
  check('manage: only functional granted', c && c.c.functional === true && !c.c.analytics && !c.c.marketing && !c.c.embeds, JSON.stringify(c));
  check('manage: map loaded, analytics still dormant', maps.length === 1 && (await page.evaluate(() => !window.__gatedAnalytics)));
  await page.click('#test-open');
  check('[data-consent-open]: reopens in manage view', (await bannerVisible(page)) && (await viewOf(page)) === 'manage');
  check('[data-consent-open]: shows the saved choice', await page.evaluate(() => document.querySelector('[data-consent-toggle="functional"]').checked && !document.querySelector('[data-consent-toggle="analytics"]').checked));
  await page.uncheck('[data-consent-toggle="functional"]');
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('[data-consent-view="manage"] [data-consent-action="save"]')]);
  await page.waitForTimeout(600);
  const c2 = await cookie(ctx);
  check('withdraw: choice updated, same consent ID', c2 && !c2.c.functional && c2.id === c.id, JSON.stringify(c2));
  check('withdraw: page reloaded and map no longer loads', (await page.locator('.ecg-consent-placeholder').count()) === 1 && (await page.evaluate(() => !window.google?.maps)));
  await ctx.close();
}

// 5. Re-prompt: old policy version, and a choice older than 12 months
for (const [label, patch] of [
  ['policy version changed', { v: '0' }],
  ['older than 12 months', { ts: Date.now() - 400 * 864e5 }],
]) {
  const ctx = await fresh();
  await seedCookie(ctx, patch);
  const { page, maps } = await open(ctx);
  check(`re-prompt (${label}): banner shows again`, await bannerVisible(page));
  check(`re-prompt (${label}): old choice not honoured`, maps.length === 0 && (await page.evaluate(() => !window.__gatedAnalytics && ecgConsent.get() === null && ecgConsent.needsChoice())));
  check(`re-prompt (${label}): no stale pre-ticked boxes`, await page.evaluate(() => {
    document.querySelector('[data-consent-action="manage"]').click();
    return [...document.querySelectorAll('[data-consent-toggle]')].every((el) => !el.checked);
  }));
  await ctx.close();
}
{
  const ctx = await fresh();
  await seedCookie(ctx, {});
  const { page } = await open(ctx);
  check('valid current cookie: no re-prompt, analytics released', !(await bannerVisible(page)) && (await page.evaluate(() => window.__gatedAnalytics === 1)));
  await ctx.close();
}

// 6. Click-to-load: loads for this page view only and stores nothing
{
  const ctx = await fresh();
  const { page, maps } = await open(ctx);
  await page.click('.ecg-consent-placeholder_button');
  await page.waitForTimeout(1500);
  check('click-to-load: map loads on click', maps.length === 1 && (await page.locator('.ecg-consent-placeholder').count()) === 0);
  check('click-to-load: nothing stored, banner still asking', (await cookie(ctx)) === null && (await bannerVisible(page)));
  await ctx.close();
}

// 7. Banner not on the page (today's state): map loads as before, analytics/marketing/embeds stay blocked
{
  const ctx = await fresh();
  const { page, maps, errors } = await open(ctx, { nobanner: true });
  await page.waitForTimeout(1000);
  check('no banner: map loads on page view as before', maps.length === 1 && (await page.locator('.ecg-consent-placeholder').count()) === 0);
  check('no banner: analytics, marketing, embeds never allowed', await page.evaluate(() => !ecgConsent.allowed('analytics') && !ecgConsent.allowed('marketing') && !ecgConsent.allowed('embeds') && ecgConsent.allowed('functional') && !window.__gatedAnalytics));
  check('no banner: no cookie set, no errors', (await cookie(ctx)) === null && (await ctx.cookies()).length === 0 && errors.length === 0, errors.join('|'));
  await ctx.close();
}

await browser.close();
console.log(failed ? `\n${failed} FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
