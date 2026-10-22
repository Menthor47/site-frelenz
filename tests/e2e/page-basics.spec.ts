import {
  adresareFormala,
  axe,
  cereriExterne,
  cssPePagina,
  elementeCareDepasesc,
  esteNoindex,
  expect,
  faraDerulareOrizontala,
  incalcariCsp,
  scripturiPermise,
  test,
  zoneAtingereMici,
} from './helpers';

// Verificările de bază ale unei pagini (§9, §10). Calea vine din `QA_PATH`, pusă de `npm run qa:page -- <cale>`;
// fără ea testele sunt sărite (ca `npm run test:e2e` să nu pice). Aserțiunile sunt „soft”: o rulare arată toate problemele.
const cale = process.env.QA_PATH ?? '';
test.skip(cale === '', 'QA_PATH lipsește: rulează `npm run qa:page -- <cale>`');

/** O pagină 404 răspunde cu 404 (în funcție de server, și cu 200 pe /404/); restul paginilor, cu 200. */
const stariOk = cale === '/404/' ? [200, 404] : [200];

test('elementele de bază', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const raspuns = await page.goto(cale);
  expect(stariOk, `${cale} a răspuns cu ${raspuns?.status()}`).toContain(raspuns?.status());
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);

  const fara = await faraDerulareOrizontala(page);
  expect.soft(fara, fara ? '' : `derulare orizontală la 320px: ${(await elementeCareDepasesc(page)).join('; ') || 'niciun element nu iese din pagină, dar pagina se derulează'}`).toBe(true);
  expect.soft(await axe(page), 'încălcări axe').toEqual([]);
  expect.soft(await page.locator('h1').count(), 'un singur H1').toBe(1);

  const permise = scripturiPermise(cale);
  const scripturi = await page.locator('script:not([type="application/ld+json"])').evaluateAll((els) => els.map((s) => (s as HTMLScriptElement).src || s.textContent?.slice(0, 60) || '(gol)'));
  expect.soft(scripturi.length, `scripturi în afară de JSON-LD (permise ${permise}): ${scripturi.join(' | ')}`).toBeLessThanOrEqual(permise);

  expect.soft(await zoneAtingereMici(page), 'zone de atingere sub 44×44px (butoane, câmpuri, meniu, subsol, rândurile din linie)').toEqual([]);
  expect.soft(await incalcariCsp(page), 'încălcări CSP').toEqual([]);

  const titlu = await page.title();
  expect.soft(titlu.length, `titlul „${titlu}” are ${titlu.length} caractere`).toBeLessThanOrEqual(60);
  expect.soft(await page.locator('meta[name="description"]').count(), 'o singură meta description').toBe(1);
  const descriere = (await page.locator('meta[name="description"]').first().getAttribute('content')) ?? '';
  expect.soft(descriere.length, `descrierea are ${descriere.length} caractere (cer 140–160)`).toBeGreaterThanOrEqual(140);
  expect.soft(descriere.length, `descrierea are ${descriere.length} caractere (cer 140–160)`).toBeLessThanOrEqual(160);

  const text = await page.locator('body').innerText();
  expect.soft(adresareFormala(`${titlu}\n${descriere}\n${text}`), 'adresare formală sau promisiune interzisă (§8)').toEqual([]);

  const css = await cssPePagina(page);
  expect.soft(css, `CSS pe pagină: ${css} octeți necomprimați (limita 25 KB = ${25 * 1024})`).toBeLessThanOrEqual(25 * 1024);
});

test('capul paginii: canonical, JSON-LD, robots și Open Graph', async ({ page, baseURL }) => {
  const raspuns = await page.goto(cale);
  expect(stariOk, `${cale} a răspuns cu ${raspuns?.status()}`).toContain(raspuns?.status());

  expect.soft(await page.locator('html').getAttribute('lang'), 'lang pe <html>').toBe('ro');

  const canonical = new URL(cale, baseURL).href;
  expect.soft(await page.locator('link[rel="canonical"]').count(), 'un singur canonical').toBe(1);
  expect.soft(await page.locator('link[rel="canonical"]').first().getAttribute('href'), 'canonical: adresă absolută, a paginii').toBe(canonical);

  expect.soft(await page.locator('script[type="application/ld+json"]').count(), 'un singur script JSON-LD').toBe(1);
  const json = (await page.locator('script[type="application/ld+json"]').first().textContent()) ?? '';
  let graf: unknown;
  try {
    graf = (JSON.parse(json) as { '@graph'?: unknown })['@graph'];
  } catch (eroare) {
    expect.soft(false, `JSON-LD nu se parsează: ${(eroare as Error).message}`).toBe(true);
  }
  expect.soft(Array.isArray(graf), 'JSON-LD are @graph').toBe(true);

  // noindex doar pe paginile din §6.1 (și pe cele interne); absent în rest.
  const noindex = esteNoindex(cale);
  expect.soft(await page.locator('meta[name="robots"]').count(), noindex ? 'pagina noindex are meta robots' : 'pagina indexabilă nu are meta robots').toBe(noindex ? 1 : 0);
  if (noindex) expect.soft(await page.locator('meta[name="robots"]').first().getAttribute('content')).toMatch(/^noindex/);

  const og = async (proprietate: string) => {
    const meta = page.locator(`meta[property="${proprietate}"]`);
    expect.soft(await meta.count(), `un singur ${proprietate}`).toBe(1);
    return (await meta.first().getAttribute('content')) ?? '';
  };
  expect.soft(await og('og:title'), 'og:title').not.toBe('');
  expect.soft(await og('og:description'), 'og:description').not.toBe('');
  expect.soft(await og('og:url'), 'og:url = canonical').toBe(canonical);
  expect.soft(await og('og:type'), 'og:type').not.toBe('');
  expect.soft(await og('og:locale'), 'og:locale').toBe('ro_RO');
  expect.soft(await og('og:site_name'), 'og:site_name').toBe('Alex Ionescu');

  // Imaginea OG (§6.2, Task 19): absolută, pe domeniul canonical-ului, 1200×630, și chiar există în build.
  // Paginile interne de test (/_test/…) nu se publică și n-au imagine.
  if (cale.startsWith('/_test/')) {
    expect.soft(await page.locator('meta[property="og:image"]').count(), 'pagina internă n-are og:image').toBe(0);
    return;
  }
  const imagine = await og('og:image');
  expect.soft(new URL(imagine).origin, 'og:image pe domeniul site-ului').toBe(new URL(canonical).origin);
  expect.soft(await og('og:image:width'), 'og:image:width').toBe('1200');
  expect.soft(await og('og:image:height'), 'og:image:height').toBe('630');
  expect.soft(await page.locator('meta[name="twitter:card"]').getAttribute('content'), 'twitter:card').toBe('summary_large_image');
  const raspunsImagine = await page.request.get(new URL(imagine).pathname);
  expect.soft(raspunsImagine.status(), `${new URL(imagine).pathname} există`).toBe(200);
  expect.soft(raspunsImagine.headers()['content-type'], 'imaginea e PNG').toMatch(/^image\/png/);
});

test('zero cookie-uri și zero cereri către alte domenii', async ({ page, context }) => {
  const raspuns = await page.goto(cale);
  expect(stariOk, `${cale} a răspuns cu ${raspuns?.status()}`).toContain(raspuns?.status());
  await page.waitForLoadState('networkidle');

  expect.soft(await context.cookies(), 'cookie-uri setate').toEqual([]);
  expect.soft(await cereriExterne(page), 'cereri spre alte origini').toEqual([]);
});

// Text mărit (WCAG 1.4.4, Review Focus #5): la 320px, cu textul la 150% și la 200%, nimic nu iese din pagină.
// Mărirea se face prin `font-size` pe <html> (ca setarea de text a browserului); toate mărimile sunt în rem.
// Se pune din CSSOM, nu din `<style>`: CSP-ul paginii blochează stilurile inline.
test('textul mărit nu produce derulare orizontală la 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const raspuns = await page.goto(cale);
  expect(stariOk, `${cale} a răspuns cu ${raspuns?.status()}`).toContain(raspuns?.status());
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);

  for (const procent of [100, 150, 200]) {
    await page.evaluate((p) => {
      document.documentElement.style.fontSize = `${p}%`;
    }, procent);
    const fara = await faraDerulareOrizontala(page);
    const latimi = await page.evaluate(() => `scrollWidth ${document.documentElement.scrollWidth}, innerWidth ${window.innerWidth}`);
    expect.soft(fara, fara ? '' : `derulare orizontală la 320px cu textul la ${procent}% (${latimi}): ${(await elementeCareDepasesc(page)).join('; ') || 'niciun element nu iese din pagină, dar pagina se derulează'}`).toBe(true);
  }
});
