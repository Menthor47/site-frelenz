import { SERVICII } from '../../src/form-rules';
import { llmsTxt } from '../../src/lib/llms';
import { site } from '../../src/site.config';

// llms.txt (§6.5): H1 = descrierea fixă, un rezumat, apoi linkurile: Servicii (6, fiecare cu o frază), Cum lucrez,
// Proiecte publicabile, Ghiduri aprobate, Despre, Contact. Proiectele și ghidurile apar doar dacă există.
const stare = vi.hoisted(() => ({ proiecte: [] as object[], ghiduri: [] as object[] }));

const servicii = Object.values(import.meta.glob<{ frontmatter: Record<string, unknown> }>('../../src/content/servicii/*.md', { eager: true })).map(
  (m) => m.frontmatter,
);

vi.mock('astro:content', () => ({
  getCollection: async (nume: string) =>
    (nume === 'servicii' ? servicii : nume === 'proiecte' ? stare.proiecte : stare.ghiduri).map((data, i) => ({ id: `${nume}-${i}`, data })),
}));

beforeEach(() => {
  stare.proiecte = [];
  stare.ghiduri = [];
});

describe('llmsTxt (§6.5)', () => {
  test('începe cu descrierea fixă, are rezumatul și listează serviciile, fără proiecte și ghiduri', async () => {
    const t = await llmsTxt(false);
    expect(t.split('\n')[0]).toBe('# Alex Ionescu – consultant SEO și web design, București');
    expect(t).toMatch(/^> .+/m);
    for (const s of SERVICII) expect(t).toContain(`(${site.url}/servicii/${s.slug}/)`);
    expect(t).not.toContain('/proiecte/');
    expect(t).not.toContain('/ghiduri/');
  });

  test('secțiunile, în ordinea din spec', async () => {
    const titluri = [...(await llmsTxt(false)).matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(titluri).toEqual(['Servicii', 'Cum lucrez', 'Despre', 'Contact']);
  });

  test('fiecare serviciu are o frază după link', async () => {
    const randuri = (await llmsTxt(false)).split('\n').filter((r) => r.includes('/servicii/') && r.startsWith('- ['));
    expect(randuri).toHaveLength(SERVICII.length);
    for (const r of randuri) expect(r).toMatch(/\): \S.+\.$/);
  });

  test('cu proiecte publicabile și ghiduri aprobate, apar și secțiunile lor', async () => {
    stare.proiecte = [
      { slug: 'acest-site', titlu: 'Acest site', descriere: 'd'.repeat(150), client: 'Alex', acord: true, aprobat: true, scoruri: [{ valoare: 100 }] },
    ];
    stare.ghiduri = ['a', 'b'].map((x) => ({ slug: `ghid-${x}`, titlu: `Ghid ${x}`, descriere: 'g'.repeat(150), raspuns: 'R.', aprobat: true }));
    const titluri = [...(await llmsTxt(false)).matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(titluri).toEqual(['Servicii', 'Cum lucrez', 'Proiecte', 'Ghiduri', 'Despre', 'Contact']);
  });

  test('niciun marcaj și nicio afirmație despre poziționare', async () => {
    const t = await llmsTxt(true);
    expect(t).not.toContain('DE COMPLETAT');
    expect(t).not.toMatch(/poziționare|ranking|clasament/i);
  });
});
