import { adresareFormala } from '../shared/adresare';

// Ciornele celor 2 ghiduri de lansare (Task 16, §4.5, §8, registrul #16): titlurile exacte, serviciul legat, răspunsul în
// primul paragraf, nicio cifră și nicio promisiune; neaprobate până le aprobă Alex.
interface Ghid {
  slug: string;
  titlu: string;
  descriere: string;
  raspuns: string;
  aprobat: boolean;
  serviciuLegat: string;
}

const module = import.meta.glob<{ frontmatter: Ghid }>('../../src/content/ghiduri/*.md', { eager: true });
const brute = import.meta.glob<string>('../../src/content/ghiduri/*.md', { eager: true, query: '?raw', import: 'default' });

const ghiduri = Object.values(module).map((m) => m.frontmatter);
/** Corpul Markdown, fără frontmatter. */
const corp = (slug: string) => {
  const cale = Object.keys(brute).find((c) => c.endsWith(`/${slug}.md`)) ?? '';
  return (brute[cale] ?? '').replace(/^---[\s\S]*?---/, '');
};

const ASTEPTATE = [
  { slug: 'de-ce-nu-apare-site-ul-in-google', titlu: 'De ce nu apare site-ul meu în Google', serviciuLegat: 'audit-seo' },
  { slug: 'ce-este-geo', titlu: 'Ce este GEO și prin ce diferă de SEO și AEO', serviciuLegat: 'optimizare-aeo-geo' },
];

test('cele 2 ghiduri, cu titlurile exacte și serviciul legat', () =>
  expect(ghiduri.map(({ slug, titlu, serviciuLegat }) => ({ slug, titlu, serviciuLegat })).sort((a, b) => a.slug.localeCompare(b.slug))).toEqual(
    [...ASTEPTATE].sort((a, b) => a.slug.localeCompare(b.slug)),
  ));

describe.each(ASTEPTATE.map((g) => g.slug))('%s', (slug) => {
  const g = () => ghiduri.find((x) => x.slug === slug) as Ghid;

  test('e o ciornă neaprobată', () => expect(g().aprobat).toBe(false));

  test('descrierea are 140–160 de caractere', () => {
    expect(g().descriere.length).toBeGreaterThanOrEqual(140);
    expect(g().descriere.length).toBeLessThanOrEqual(160);
  });

  test('răspunsul direct are 1–3 fraze', () => {
    const fraze = g().raspuns.split(/(?<=[.!?])\s+/).filter((f) => f.trim() !== '');
    expect(fraze.length).toBeGreaterThanOrEqual(1);
    expect(fraze.length).toBeLessThanOrEqual(3);
  });

  test('corpul are detalii, pe secțiuni (##)', () => expect(corp(slug).match(/^## /gm)?.length ?? 0).toBeGreaterThanOrEqual(3));

  test('nicio cifră, în frontmatter sau în corp (fără statistici fără sursă)', () => {
    expect(`${g().titlu} ${g().descriere} ${g().raspuns} ${corp(slug)}`).not.toMatch(/\d/);
  });

  test('la „tu”, fără promisiuni interzise', () => expect(adresareFormala(`${g().descriere} ${g().raspuns} ${corp(slug)}`)).toEqual([]));

  test('fără ş/ţ cu sedilă', () => expect(`${g().raspuns} ${corp(slug)}`).not.toMatch(/[ŞşŢţ]/));

  test('corpul trimite la serviciul legat', () => expect(corp(slug)).toContain(`](/servicii/${g().serviciuLegat}/)`));

  // §6.4: numele apare în paragrafele-cheie, ca pasajul să aibă sens și citit separat; aici, paragraful cu serviciul.
  test('paragraful cu serviciul legat îl numește pe Alex Ionescu', () => {
    const paragraf = corp(slug)
      .split(/\n\s*\n/)
      .find((p) => p.includes(`](/servicii/${g().serviciuLegat}/)`));
    expect(paragraf).toContain('Alex Ionescu');
  });

  // Afirmații pe care documentația Google le contrazice sau pe care nu le susține nicio sursă (revizuirea Task 16).
  test('fără afirmații de frecvență fără sursă', () => expect(`${g().descriere} ${g().raspuns} ${corp(slug)}`).not.toMatch(/de obicei|cele mai dese|cel mai des/i));
});
