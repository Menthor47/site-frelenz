import { avertismenteLansare, verificaLansarea } from '../../scripts/check-launch.mjs';

// check:launch (§11): refuză lansarea până când datele, domeniul, aprobările și marcajele blocante sunt în regulă.
// `verificaLansarea` întoarce motivele de refuz (gol = poate lansa); avertismentele nu blochează.

/** O stare din care se poate lansa, cu suprascrieri. */
function ok(suprascrieri: Partial<Parameters<typeof verificaLansarea>[0]> = {}) {
  return {
    site: { url: 'https://alexionescu.ro' },
    aprobari: { '/': true, '/servicii/seo/': true },
    paginiDist: ['/', '/servicii/seo/'],
    marcaje: [],
    marcajeDist: [],
    textDist: ['<link rel="canonical" href="https://alexionescu.ro/">'],
    mediu: {},
    ...suprascrieri,
  };
}

describe('verificaLansarea (§11)', () => {
  test('o stare completă poate lansa', () => expect(verificaLansarea(ok())).toEqual([]));

  test('refuză domeniul provizoriu', () =>
    expect(verificaLansarea(ok({ site: { url: 'https://site-provizoriu.example' } }))).toContain('domeniul e încă provizoriu'));

  test('refuză un marcaj blocant', () =>
    expect(verificaLansarea(ok({ marcaje: [{ fisier: 'x', nr: 15, blocheaza: true }] }))).toContain('marcaj blocant #15 în x'));

  test('acceptă un marcaj neblocant', () => expect(verificaLansarea(ok({ marcaje: [{ fisier: 'x', nr: 6, blocheaza: false }] }))).toEqual([]));

  test('refuză o pagină neaprobată', () => expect(verificaLansarea(ok({ aprobari: { '/': false, '/servicii/seo/': true } }))).toContain('pagină neaprobată: /'));

  test('o pagină din dist/ care lipsește din aprobari.json contează ca neaprobată', () =>
    expect(verificaLansarea(ok({ paginiDist: ['/', '/servicii/seo/', '/pagina-noua/'] }))).toContain('pagină neaprobată: /pagina-noua/'));

  test('refuză un marcaj găsit oriunde în dist/ (orice fișier text)', () =>
    expect(verificaLansarea(ok({ marcajeDist: [{ fisier: 'dist/_astro/x.css', linie: 3 }] }))).toContain('marcaj în dist/: dist/_astro/x.css:3'));

  // Un build făcut pentru QA local (SITE_URL=localhost) sau pentru previzualizare (DRAFT=1) nu se lansează.
  test('refuză când SITE_URL sau DRAFT sunt setate în mediu', () => {
    expect(verificaLansarea(ok({ mediu: { SITE_URL: 'http://localhost:8787' } }))).toContain('SITE_URL e setat în mediu (e doar pentru QA local)');
    expect(verificaLansarea(ok({ mediu: { DRAFT: '1' } }))).toContain('DRAFT e setat în mediu (build de previzualizare)');
  });

  test('refuză un dist/ construit cu domeniul provizoriu sau cu localhost', () => {
    expect(verificaLansarea(ok({ textDist: ['<link href="http://localhost:8787/">'] }))).toContain('dist/ conține localhost, 127.0.0.1 sau domeniul provizoriu: rulează `npm run build` fără SITE_URL');
    expect(verificaLansarea(ok({ textDist: ['https://site-provizoriu.example/sitemap-index.xml'] }))).toContain(
      'dist/ conține localhost, 127.0.0.1 sau domeniul provizoriu: rulează `npm run build` fără SITE_URL',
    );
  });

  test('fiecare motiv apare o singură dată', () => {
    const motive = verificaLansarea(ok({ marcaje: [{ fisier: 'a', nr: 1, blocheaza: true }, { fisier: 'a', nr: 1, blocheaza: true }] }));
    expect(motive.filter((m) => m === 'marcaj blocant #1 în a')).toHaveLength(1);
  });
});

describe('avertismenteLansare', () => {
  test('cere verificarea datelor scrise de mână (ghiduri, pagini legale) și a dependențelor', () => {
    const a = avertismenteLansare({ date: [{ cale: '/ghiduri/ce-este-geo/', data: '2026-10-22' }] });
    expect(a.some((x) => x.includes('/ghiduri/ce-este-geo/') && x.includes('2026-10-22'))).toBe(true);
    expect(a.some((x) => x.includes('npm audit'))).toBe(true);
    // Avertismentul vechi despre wrangler 4.148.0 a dispărut odată cu actualizarea la 4.152.0.
    expect(a.some((x) => x.includes('4.148.0'))).toBe(false);
  });
});
