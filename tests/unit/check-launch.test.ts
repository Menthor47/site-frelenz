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
    distHtml: ['<p>Gata.</p>'],
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

  test('refuză textul marcajului în dist', () => expect(verificaLansarea(ok({ distHtml: ['<p>[DE COMPLETAT:#4]</p>'] }))).toContain('marcaj în dist/'));

  test('fiecare motiv apare o singură dată', () => {
    const motive = verificaLansarea(ok({ distHtml: ['[DE COMPLETAT:#1]', '[DE COMPLETAT:#2]'], marcaje: [{ fisier: 'a', nr: 1, blocheaza: true }, { fisier: 'a', nr: 1, blocheaza: true }] }));
    expect(motive.filter((m) => m === 'marcaj în dist/')).toHaveLength(1);
    expect(motive.filter((m) => m === 'marcaj blocant #1 în a')).toHaveLength(1);
  });
});

describe('avertismenteLansare', () => {
  test('cere verificarea datelor scrise de mână (ghiduri, pagini legale) și a dependențelor', () => {
    const a = avertismenteLansare({ date: [{ cale: '/ghiduri/ce-este-geo/', data: '2026-10-22' }] });
    expect(a.some((x) => x.includes('/ghiduri/ce-este-geo/') && x.includes('2026-10-22'))).toBe(true);
    expect(a.some((x) => x.includes('npm audit'))).toBe(true);
  });
});
