import { APROBARI } from '../../src/approvals';
import { SERVICII } from '../../src/form-rules';
import { ogPentru, PAGINI_STATICE, paginiConstruite } from '../../src/lib/routes';

// Lista paginilor construite (Task 19): sursa unică pentru imaginile OG, llms.txt și verificarea aprobărilor (check:launch).
// Colecțiile sunt ciornele reale din src/content: niciun proiect și niciun ghid nu e aprobat, deci în producție lipsesc.
const fisiere = {
  servicii: import.meta.glob<{ frontmatter: Record<string, unknown> }>('../../src/content/servicii/*.md', { eager: true }),
  proiecte: import.meta.glob<{ frontmatter: Record<string, unknown> }>('../../src/content/proiecte/*.md', { eager: true }),
  ghiduri: import.meta.glob<{ frontmatter: Record<string, unknown> }>('../../src/content/ghiduri/*.md', { eager: true }),
};

/** Datele din frontmatter, cu datele calendaristice ca Date (cum le dă `z.coerce.date()`). */
const date = (nume: keyof typeof fisiere) =>
  Object.values(fisiere[nume]).map(({ frontmatter: f }) =>
    Object.fromEntries(Object.entries(f).map(([k, v]) => [k, ['publicat', 'actualizat'].includes(k) ? new Date(String(v)) : v])),
  );

vi.mock('astro:content', () => ({
  getCollection: async (nume: 'servicii' | 'proiecte' | 'ghiduri') => date(nume).map((data, i) => ({ id: `${nume}-${i}`, data })),
}));

describe('paginiConstruite', () => {
  test('în producție: paginile statice publice și cele 6 servicii, fără proiecte și ghiduri', async () => {
    const cai = (await paginiConstruite(false)).map((p) => p.cale);
    for (const s of SERVICII) expect(cai).toContain(`/servicii/${s.slug}/`);
    for (const cale of ['/', '/servicii/', '/cum-lucrez/', '/despre/', '/contact/', '/politica-de-confidentialitate/', '/404/']) expect(cai).toContain(cale);
    expect(cai.filter((c) => c.startsWith('/proiecte/') || c.startsWith('/ghiduri/'))).toEqual([]);
  });

  test('în previzualizare: și proiectele, ghidurile și listele lor', async () => {
    const cai = (await paginiConstruite(true)).map((p) => p.cale);
    for (const cale of ['/proiecte/', '/proiecte/acest-site/', '/proiecte/szitrans/', '/ghiduri/', '/ghiduri/ce-este-geo/']) expect(cai).toContain(cale);
  });

  test('fiecare pagină are cale cu slash la capete, titlu și descriere de 140–160 de caractere; căile sunt unice', async () => {
    const pagini = await paginiConstruite(true);
    expect(new Set(pagini.map((p) => p.cale)).size).toBe(pagini.length);
    for (const p of pagini) {
      expect(p.cale).toMatch(/^\/(?:.*\/)?$/);
      expect(p.titlu.length).toBeGreaterThan(0);
      expect(p.descriere.length, p.cale).toBeGreaterThanOrEqual(140);
      expect(p.descriere.length, p.cale).toBeLessThanOrEqual(160);
    }
  });

  test('serviciile, proiectele și ghidurile au grupul liniei lor', async () => {
    const pagini = await paginiConstruite(true);
    expect(pagini.find((p) => p.cale === '/servicii/audit-seo/')?.grup).toBe('diagnostic');
    expect(pagini.find((p) => p.cale === '/ghiduri/ce-este-geo/')?.grup).toBe('vizibilitate');
    expect(pagini.find((p) => p.cale === '/contact/')?.grup).toBeUndefined();
  });

  // check:launch citește aprobările de aici (§3.4): paginile .astro din approvals.ts, restul din câmpul `aprobat`.
  // Formă, nu conținut: aprobarea și datele le schimbă Alex, iar testele nu trebuie să pice atunci.
  test('fiecare pagină știe dacă e aprobată', async () => {
    for (const p of await paginiConstruite(true)) expect(typeof p.aprobat, p.cale).toBe('boolean');
  });

  test('ghidurile și paginile legale au data scrisă de mână (ISO), pentru avertismentul de la lansare', async () => {
    const pagini = await paginiConstruite(true);
    for (const p of pagini.filter((x) => x.cale.startsWith('/ghiduri/') && x.cale !== '/ghiduri/')) expect(p.data, p.cale).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(pagini.find((p) => p.cale === '/politica-cookies/')?.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(pagini.find((p) => p.cale === '/contact/')?.data).toBeUndefined();
  });

  test('paginile statice sunt exact rutele din approvals.ts', () => expect(Object.keys(PAGINI_STATICE).sort()).toEqual(Object.keys(APROBARI).sort()));
});

describe('ogPentru', () => {
  test('o cale de pagină devine o cale de imagine', () => {
    expect(ogPentru('/')).toBe('/og/index.png');
    expect(ogPentru('/servicii/seo/')).toBe('/og/servicii/seo.png');
    expect(ogPentru('/404/')).toBe('/og/404.png');
  });
});
