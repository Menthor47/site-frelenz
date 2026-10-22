import { readFileSync } from 'node:fs';
import { masoara } from '../../src/client/page-facts';
import PageFacts from '../../src/components/PageFacts.astro';
import { render, textOf } from './helpers';

// Fișa paginii (§5.5), doar pe /proiecte/acest-site/: măsurătorile din browser și ce se vede fără JavaScript.

const nav = (transferSize: number, encodedBodySize: number) => ({ transferSize, encodedBodySize }) as PerformanceNavigationTiming;
const resursa = (transferSize: number, encodedBodySize: number) => ({ transferSize, encodedBodySize }) as PerformanceResourceTiming;

describe('masoara (§5.5)', () => {
  test('revalidarea contează ca resursă din cache', () => expect(masoara([resursa(300, 5000)], nav(2000, 2000)).dinCache).toBe(true));

  test('transferSize 0 contează ca resursă din cache', () => expect(masoara([resursa(0, 5000)], nav(2000, 2000)).dinCache).toBe(true));

  test('documentul revalidat contează și el', () => expect(masoara([], nav(300, 2000)).dinCache).toBe(true));

  test('totul descărcat întreg nu e din cache', () => expect(masoara([resursa(1024, 1024)], nav(1024, 1024)).dinCache).toBe(false));

  test('totalul greutății în KB', () => expect(masoara([resursa(1024, 1024)], nav(1024, 1024)).greutateKb).toBe(2));

  test('greutatea se rotunjește la o zecimală', () => expect(masoara([resursa(1000, 1000)], nav(0, 0)).greutateKb).toBe(1));

  test('cererile: documentul plus fiecare resursă', () => expect(masoara([resursa(1, 1), resursa(1, 1)], nav(1, 1)).cereri).toBe(3));
});

describe('PageFacts (§5.5)', () => {
  const TIPURI = ['WebSite', 'Person', 'Article', 'BreadcrumbList'];

  test('o listă <dl> cu cele 5 rânduri, fiecare cu explicația de sub rând', async () => {
    const h = await render(PageFacts, { tipuriSchema: TIPURI });
    const termeni = [...h.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>/g)].map((m) => textOf(m[1] ?? ''));
    expect(termeni).toEqual(['Greutate', 'Cereri', 'Cookie-uri setate de site', 'Scripturi terțe', 'Date structurate']);
    const text = textOf(h);
    for (const explicatie of [
      'Cât a descărcat telefonul tău ca să-ți arate pagina asta. Mai puțin înseamnă mai rapid.',
      'De câte ori a cerut browserul ceva de la server.',
      'Site-ul nu te urmărește.',
      'Niciun cod de la alte firme nu rulează aici.',
      'Eticheta pe care o citesc Google și motoarele AI ca să înțeleagă pagina.',
    ]) {
      expect(text).toContain(explicatie);
    }
  });

  // Scripturile terțe se numără în browser, nu se scriu de mână (§5.5: „nicio cifră nu e scrisă de mână”); tipurile
  // de date structurate vin din aceleași noduri ca JSON-LD-ul paginii, deci sunt adevărate prin construcție.
  test('fără JavaScript, rândurile măsurate în browser spun asta; tipurile de date structurate vin de la build', async () => {
    const h = await render(PageFacts, { tipuriSchema: TIPURI });
    const valori = [...h.matchAll(/<dd\b[^>]*class="[^"]*fisa__valoare[^"]*"[^>]*>([\s\S]*?)<\/dd>/g)].map((m) => textOf(m[1] ?? ''));
    const MASURAT = 'se măsoară în browserul tău, dacă JavaScript e pornit';
    expect(valori).toEqual([MASURAT, MASURAT, MASURAT, MASURAT, TIPURI.join(', ')]);
  });

  test('scriptul pornește după load, cu requestIdleCallback sau setTimeout ca rezervă (Safari)', () => {
    const sursa = readFileSync(new URL('../../src/components/PageFacts.astro', import.meta.url), 'utf8');
    const script = /<script>([\s\S]*?)<\/script>/.exec(sursa)?.[1] ?? '';
    expect(script).toMatch(/addEventListener\('load'/);
    expect(script).toMatch(/requestIdleCallback/);
    expect(script).toMatch(/setTimeout\([^,]+,\s*200\)/);
  });

  test('cifrele au lățime fixă (tabular-nums), ca blocul să nu sară', () => {
    const sursa = readFileSync(new URL('../../src/components/PageFacts.astro', import.meta.url), 'utf8');
    expect(sursa).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });
});
