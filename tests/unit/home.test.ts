import PaginaAcasa from '../../src/pages/index.astro';
import { render } from './helpers';

// Acasă (§4.3), în stratul de suprafețe: „De unde pornești?” și întrebările frecvente sunt carduri pe suprafața deschisă;
// traseele (fundal propriu) și banda albastră de la final nu sunt carduri. Serviciile sunt ciornele reale din
// src/content/servicii (aceleași date ca la build); proiectele și ghidurile, pe care le citește Base, lipsesc, în afară de
// testul care pune un singur proiect publicabil.
const colectii = vi.hoisted(() => ({ servicii: [] as object[], proiecte: [] as object[] }));
vi.mock('astro:content', () => ({
  getCollection: async (nume: string) => (nume === 'servicii' || nume === 'proiecte' ? colectii[nume] : []).map((data, i) => ({ id: `${nume}-${i}`, data })),
}));

const fisiere = import.meta.glob<{ frontmatter: object }>('../../src/content/servicii/*.md', { eager: true });
colectii.servicii = Object.values(fisiere).map((m) => m.frontmatter);

/**
 * Secțiunea cu `aria-labelledby="<id>"`, de la eticheta de deschidere la `</section>`. Secțiunile din pagină nu sunt
 * îmbricate, iar Astro adaugă `data-astro-cid-…` după `class`, deci căutăm în interiorul secțiunii, nu un `class="…"` exact.
 */
const sectiune = (html: string, id: string) =>
  new RegExp(`<section\\b[^>]*aria-labelledby="${id}"[^>]*>[\\s\\S]*?</section>`).exec(html)?.[0] ?? '';

/** Eticheta de deschidere a secțiunii are clasa `acasa-sectiune--carte` printre clasele ei, în orice ordine. */
const SECTIUNE_CARD = /^<section\b[^>]*\sclass="(?:[^"]* )?acasa-sectiune--carte(?: [^"]*)?"/;

/** Un atribut `class` cu o clasă de card (`carte` sau `acasa-sectiune--carte`); cuvântul „carte” din text nu se potrivește. */
const CLASA_CARD = /\sclass="[^"]*\bcarte\b/;

describe('Acasă (§4.3): carduri pe suprafață', () => {
  test('„De unde pornești?” e un card pe suprafață', async () => {
    const h = await render(PaginaAcasa);
    expect(h).toContain('class="main--suprafata"');
    const s = sectiune(h, 'de-unde-pornesti');
    expect(s).toMatch(SECTIUNE_CARD);
    expect(s).toMatch(/<div class="contener carte"[^>]*>/);
  });

  test('întrebările frecvente sunt un card, iar traseele rămân pe fundalul lor', async () => {
    const h = await render(PaginaAcasa);
    const intrebari = sectiune(h, 'intrebari');
    expect(intrebari).toMatch(SECTIUNE_CARD);
    expect(intrebari).toMatch(/<div class="contener carte"[^>]*>/);

    const trasee = sectiune(h, 'cum-lucram');
    expect(trasee).toContain('acasa-trasee');
    expect(trasee).not.toMatch(CLASA_CARD);
  });

  test('banda albastră de la final nu e un card', async () => {
    const h = await render(PaginaAcasa);
    const final = /<div class="acasa-final"[\s\S]*?<\/main>/.exec(h)?.[0] ?? '';
    expect(final).toContain('acasa-final__rand');
    expect(final).not.toMatch(CLASA_CARD);
  });

  test('proiectele, când există unul publicabil, sunt un card', async () => {
    colectii.proiecte = [
      { slug: 'magazin-online', client: 'anonim', acord: false, aprobat: true, titlu: 'Un magazin online din București', context: 'Vizite în scădere.', ceAmFacut: [], rezultate: [] },
    ];
    try {
      const proiecte = sectiune(await render(PaginaAcasa), 'proiecte');
      expect(proiecte).toMatch(SECTIUNE_CARD);
      expect(proiecte).toMatch(/<div class="contener carte"[^>]*>/);
      expect(proiecte).toContain('Un magazin online din București');
    } finally {
      colectii.proiecte = [];
    }
  });
});
