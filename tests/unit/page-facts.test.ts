import { readFileSync } from 'node:fs';
import { completeazaFisa, masoara } from '../../src/client/page-facts';
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

  // „De câte ori a cerut browserul ceva de la server”: o resursă din cache (transferSize 0) n-a ajuns la server.
  test('o resursă luată din cache nu e o cerere', () => expect(masoara([resursa(0, 5000), resursa(300, 5000)], nav(1, 1)).cereri).toBe(2));
});

describe('completeazaFisa (§5.5)', () => {
  /** O fișă falsă: ține minte ce scrie scriptul în fiecare rând `[data-masura]`. */
  function fisaFalsa() {
    const scrise: Record<string, string> = {};
    const fisa = {
      querySelector: (selector: string) => {
        const cheie = /\[data-masura="([^"]+)"\]/.exec(selector)?.[1];
        return cheie === undefined ? null : { set textContent(valoare: string) { scrise[cheie] = valoare; } };
      },
    } as unknown as HTMLElement;
    return { fisa, scrise };
  }

  function mediu({ cookie = '', scripturi = [] as string[], navigare = true } = {}) {
    vi.stubGlobal('performance', {
      getEntriesByType: (tip: string) => (tip === 'navigation' ? (navigare ? [nav(2048, 2048)] : []) : [resursa(1024, 1024), resursa(0, 900)]),
    });
    vi.stubGlobal('document', { cookie, scripts: scripturi.map((src) => ({ src })) });
    vi.stubGlobal('location', { origin: 'https://site.example' });
  }

  afterEach(() => vi.unstubAllGlobals());

  test('scrie greutatea, cererile, cookie-urile și scripturile terțe', () => {
    mediu({ scripturi: ['', 'https://site.example/_astro/a.js', 'https://alt.example/b.js', 'chrome-extension://abc/c.js'] });
    const { fisa, scrise } = fisaFalsa();
    completeazaFisa(fisa);
    expect(scrise).toEqual({ greutate: '3 KB, parțial din cache', cereri: '2', cookieuri: '0', scripturi: '1' });
  });

  test('numără cookie-urile vizibile pentru scripturi', () => {
    mediu({ cookie: 'a=1; b=2' });
    const { fisa, scrise } = fisaFalsa();
    completeazaFisa(fisa);
    expect(scrise.cookieuri).toBe('2');
  });

  test('fără intrarea de navigare, rândurile rămân cu textul de rezervă', () => {
    mediu({ navigare: false });
    const { fisa, scrise } = fisaFalsa();
    completeazaFisa(fisa);
    expect(scrise).toEqual({});
  });

  test('fiecare rând [data-masura] din fișă are cine să-l completeze', async () => {
    // Întâi randarea (Astro are nevoie de `performance` adevărat), apoi mediul de browser simulat.
    const chei = [...(await render(PageFacts, { tipuriSchema: ['WebSite'] })).matchAll(/data-masura="([^"]+)"/g)].map((m) => m[1]);
    mediu();
    const { fisa, scrise } = fisaFalsa();
    completeazaFisa(fisa);
    expect(Object.keys(scrise).sort()).toEqual([...chei].sort());
  });
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

  // Înălțimea rezervată (§5.5): textul de rezervă, mai mic, încape în aceeași înălțime minimă ca valoarea măsurată.
  test('valoarea are înălțime minimă rezervată și cifre de aceeași lățime', () => {
    const sursa = readFileSync(new URL('../../src/components/PageFacts.astro', import.meta.url), 'utf8');
    const bloc = /\.fisa__valoare\s*\{([^}]*)\}/.exec(sursa)?.[1] ?? '';
    expect(bloc).toMatch(/min-block-size:\s*\S+/);
    expect(bloc).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(bloc).not.toMatch(/min-inline-size/);
  });

  test('textul de rezervă stă într-un span mai mic, pe care scriptul îl înlocuiește', async () => {
    expect(await render(PageFacts, { tipuriSchema: ['WebSite'] })).toMatch(/<dd\b[^>]*data-masura="greutate"[^>]*>\s*<span class="fisa__fara-js"[^>]*>se măsoară/);
  });
});
