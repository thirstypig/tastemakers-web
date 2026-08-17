// Sweep every app route at 390 / 768 / 1440 and report:
//  - tm-* classes rendered but not defined in any loaded stylesheet
//  - horizontal overflow
//  - console errors
import { chromium } from 'playwright';

const ROUTES = [
  '/', '/?city=Austin', '/restaurants', '/restaurants/159',
  '/restaurants/159/photos', '/search?q=chicken', '/search?q=chicken&in=tags',
  '/search?q=zzzznope', '/lists', '/lists/124', '/cuisines',
  '/login', '/signup', '/bookmarks', '/privacy',
];
const WIDTHS = [390, 768, 1440];

const AUDIT = () => {
  const used = new Set();
  document.querySelectorAll('[class]').forEach(el => {
    String(el.className.baseVal ?? el.className).split(/\s+/).forEach(c => {
      if (c.startsWith('tm-')) used.add(c);
    });
  });
  const defined = new Set();
  const walk = (rules) => {
    for (const r of rules) {
      if (r.selectorText) {
        (r.selectorText.match(/\.tm-[A-Za-z0-9_-]+/g) || []).forEach(s => defined.add(s.slice(1)));
      }
      if (r.cssRules) walk(r.cssRules);
    }
  };
  for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch {} }
  const doc = document.documentElement;
  return {
    overflow: Math.max(0, doc.scrollWidth - doc.clientWidth),
    missing: [...used].filter(c => !defined.has(c)).sort(),
  };
};

const browser = await chromium.launch();
let problems = 0;
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // Expected on localhost: AdSense is blocked (403) and /api/me/summary
    // correctly 401s while signed out.
    if (/status of (401|403)/.test(t)) return;
    if (/doubleclick|adsbygoogle|googleads/i.test(t)) return;
    errors.push(t.slice(0, 90));
  });
  for (const route of ROUTES) {
    errors.length = 0;
    let res;
    try {
      res = await page.goto('http://localhost:3050' + route, { waitUntil: 'networkidle', timeout: 30000 });
    } catch { console.log(`${w} ${route} — LOAD FAILED`); problems++; continue; }
    await page.waitForTimeout(250);
    const a = await page.evaluate(AUDIT);
    const bad = a.missing.length || a.overflow > 1 || errors.length;
    if (bad) problems++;
    const bits = [`${String(w).padEnd(4)} ${route.padEnd(28)} ${res.status()}`];
    if (a.missing.length) bits.push(`MISSING-CSS: ${a.missing.join(',')}`);
    if (a.overflow > 1) bits.push(`OVERFLOW: +${a.overflow}px`);
    if (errors.length) bits.push(`ERR: ${errors[0]}`);
    if (bad) console.log(bits.join('  |  '));
  }
  await ctx.close();
}
await browser.close();
console.log(problems === 0 ? '\nALL CLEAN' : `\n${problems} problem(s)`);
