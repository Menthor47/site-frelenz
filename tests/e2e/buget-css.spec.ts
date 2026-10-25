import { readdirSync } from 'node:fs';
import { FARA_SITEMAP } from '../../src/lib/seo';
import { cssPePagina, expect, test } from './helpers';

// Bugetul de CSS (spec-ul principal, §9.1 „Bugete”: „CSS: cel mult 25 KB pe pagină, necomprimat”; spec-ul metroul îmbunătățit, riscurile).
// `page-basics` îl verifică pe o singură pagină, cea din `QA_PATH`; aici se verifică toate paginile publice dintr-o rulare:
// cele din sitemap plus cele scoase din el (noindex, inclusiv /404/), din aceeași listă ca filtrul sitemap-ului (src/lib/seo.ts).
// Măsura e aceeași ca în `page-basics`: `cssPePagina`, adică foile din `<link rel="stylesheet">` plus textul fiecărui `<style>`.
const LIMITA = 25 * 1024;

/** Căile din sitemap (sitemap-index.xml și sitemap-urile lui), cu slash la final. */
async function paginiDinSitemap(cere: (cale: string) => Promise<string>): Promise<string[]> {
  const locuri = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1] ?? '').pathname);
  const pagini: string[] = [];
  for (const sitemap of locuri(await cere('/sitemap-index.xml'))) pagini.push(...locuri(await cere(sitemap)));
  return pagini;
}

/**
 * Câte pagini HTML a construit build-ul (dist/, sau QA_DIST la previzualizare), fără `_astro`, `_test` și `_intern`. Fără
 * `concepte/` nici ele: conceptele de design sunt pagini statice din public/, păstrate cum au fost făcute (noindex, în
 * afara sitemap-ului), nu pagini ale site-ului, deci nu intră în bugetul lui.
 */
function paginiConstruite(): number {
  const dist = process.env.QA_DIST ?? 'dist';
  return readdirSync(dist, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.html') && !f.startsWith('_') && !/^concepte[\\/]/.test(f)).length;
}

test('CSS-ul fiecărei pagini publice rămâne sub 25 KB necomprimat', async ({ page }) => {
  test.setTimeout(120_000);
  const cere = async (cale: string) => {
    const raspuns = await page.request.get(cale);
    expect(raspuns.ok(), `${cale} a răspuns ${raspuns.status()}`).toBe(true);
    return raspuns.text();
  };
  const pagini = [...new Set([...(await paginiDinSitemap(cere)), ...FARA_SITEMAP])];
  // Strict, dar fără listă scrisă de mână: sitemap-ul plus paginile noindex acoperă cel puțin tot ce a construit build-ul
  // (dist/*.html); un sitemap golit sau mutat pică aici, iar o pagină nouă intră în verificare fără să schimbi testul.
  const construite = paginiConstruite();
  expect(pagini.length, `${pagini.length} pagini în sitemap + FARA_SITEMAP, față de ${construite} construite`).toBeGreaterThanOrEqual(construite);

  const peste: string[] = [];
  for (const cale of pagini) {
    const raspuns = await page.goto(cale);
    // 404 răspunde cu 404 (sau cu 200 pe /404/, după server); restul, cu 200.
    expect(cale === '/404/' ? [200, 404] : [200], `${cale} a răspuns ${raspuns?.status()}`).toContain(raspuns?.status());
    const octeti = await cssPePagina(page);
    if (octeti > LIMITA) peste.push(`${cale}: ${octeti} octeți (limita ${LIMITA}, depășită cu ${octeti - LIMITA})`);
  }
  expect(peste, `pagini peste bugetul de CSS, din ${pagini.length} verificate`).toEqual([]);
});
