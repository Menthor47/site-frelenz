import PaginaAcasa from '../../src/pages/index.astro';
import { divComplet, render, textOf } from './helpers';

// Acasă (§4.3), în stratul de suprafețe: întrebările frecvente sunt un card pe suprafața deschisă; traseele (fundal propriu)
// și banda albastră de la final nu sunt carduri. „De unde pornești?” nu mai e card: e alegătorul din hero (spec metroul
// îmbunătățit, §3). Serviciile sunt ciornele reale din src/content/servicii (aceleași date ca la build); proiectele și
// ghidurile, pe care le citește Base, lipsesc, în afară de testul care pune un singur proiect publicabil.
const colectii = vi.hoisted(() => ({ servicii: [] as object[], proiecte: [] as object[] }));
vi.mock('astro:content', () => ({
  getCollection: async (nume: string) => (nume === 'servicii' || nume === 'proiecte' ? colectii[nume] : []).map((data, i) => ({ id: `${nume}-${i}`, data })),
}));

const fisiere = import.meta.glob<{ frontmatter: object }>('../../src/content/servicii/*.md', { eager: true });
colectii.servicii = Object.values(fisiere).map((m) => m.frontmatter);

/**
 * Secțiunea cu `aria-labelledby="<id>"`, de la eticheta de deschidere la `</section>`. Secțiunile din pagină nu sunt
 * îmbricate, iar eticheta poate avea și alte atribute după `class`, deci căutăm în interiorul secțiunii, nu un `class="…"` exact.
 * Clasa de scop a lui Astro (`astro-…`, în `class`) o scoate `render` (helpers.ts).
 */
const sectiune = (html: string, id: string) =>
  new RegExp(`<section\\b[^>]*aria-labelledby="${id}"[^>]*>[\\s\\S]*?</section>`).exec(html)?.[0] ?? '';

/** Eticheta de deschidere a secțiunii are clasa `acasa-sectiune--carte` printre clasele ei, în orice ordine. */
const SECTIUNE_CARD = /^<section\b[^>]*\sclass="(?:[^"]* )?acasa-sectiune--carte(?: [^"]*)?"/;

/** Un atribut `class` cu o clasă de card (`carte` sau `acasa-sectiune--carte`); cuvântul „carte” din text nu se potrivește. */
const CLASA_CARD = /\sclass="[^"]*\bcarte\b/;

/** Zona întunecată de sus (`div.acasa-sus`), cu tot conținutul ei. */
function hero(html: string): string {
  const start = /<div\b[^>]*\sclass="acasa-sus"[^>]*>/.exec(html)?.index;
  if (start === undefined) throw new Error('Acasă nu are div.acasa-sus');
  return divComplet(html, start);
}

/** Etichetele din §8 al spec-ului metroul îmbunătățit, exact, în ordinea serviciilor (seo … mentenanta-site). */
const ETICHETE_SPEC = [
  'Nu mă găsesc clienții în Google',
  'Nu apar când întreabă cineva ChatGPT',
  'Au scăzut vizitele și nu știu de ce',
  'N-am încă un site',
  'Site-ul arată învechit',
  'Site-ul e lent și neactualizat',
];

describe('Acasă (§3 din spec-ul metroul îmbunătățit): alegătorul din hero', () => {
  test('„De unde pornești?” stă în hero, nu mai e un card pe suprafață', async () => {
    const h = await render(PaginaAcasa);
    expect(h).toContain('class="main--suprafata"');
    const sus = hero(h);
    expect(sus).toMatch(/<form\b[^>]*\sdata-alegator[^>]*>/);
    expect(sus).toMatch(/<legend\b[^>]*>\s*<h2\b[^>]*\sid="de-unde-pornesti"[^>]*>De unde pornești\?<\/h2>/);
    // Titlul aprobat apare o singură dată, ca legendă; secțiunea-card de dinainte a dispărut.
    expect(h.match(/id="de-unde-pornesti"/g)).toHaveLength(1);
    expect(sectiune(h, 'de-unde-pornesti')).toBe('');
    expect(h).not.toMatch(/aria-labelledby="de-unde-pornesti"/);
    // Alegătorul e în afara oricărui card.
    expect(/<form\b[\s\S]*?<\/form>/.exec(h)?.[0]).not.toMatch(CLASA_CARD);
  });

  test('ordinea din DOM: H1, subtitlu, „Cere o ofertă”, harta cu „Oprește trenurile”, apoi alegătorul', async () => {
    const sus = hero(await render(PaginaAcasa));
    const locuri = ['<h1', 'acasa-sus__subtitlu', 'acasa-sus__buton', 'harta__buton', 'data-alegator'].map((semn) => sus.indexOf(semn));
    expect(locuri.every((i) => i >= 0)).toBe(true);
    expect([...locuri].sort((a, b) => a - b)).toEqual(locuri);
  });

  test('Acasă nu mai are .linie-rand', async () => {
    const h = await render(PaginaAcasa);
    expect(h).not.toContain('linie-rand');
    expect(h).not.toMatch(/class="linie"/);
  });

  test('cele șase etichete sunt cele din spec, în ordinea serviciilor, iar radio-urile au slug-urile lor', async () => {
    const sus = hero(await render(PaginaAcasa));
    const etichete = [...sus.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)].map((m) => textOf(m[1] ?? ''));
    expect(etichete).toEqual(ETICHETE_SPEC);
    const sluguri = [...sus.matchAll(/<input\b[^>]*\stype="radio"[^>]*\svalue="([^"]+)"/g)].map((m) => m[1]);
    const asteptate = [...(colectii.servicii as { slug: string; ordine: number }[])].sort((a, b) => a.ordine - b.ordine).map((s) => s.slug);
    expect(sluguri).toEqual(asteptate);
  });

  test('fiecare panou are pașii serviciului din colecție, butonul și linkul spre pagina lui', async () => {
    const sus = hero(await render(PaginaAcasa));
    const servicii = [...(colectii.servicii as { slug: string; ordine: number; pasi: string[] }[])].sort((a, b) => a.ordine - b.ordine);
    const panouri = [...sus.matchAll(/<div\b[^>]*\sclass="(?:[^"]* )?alegator__panou(?: [^"]*)?"[^>]*>/g)].map((m) => divComplet(sus, m.index ?? 0));
    expect(panouri).toHaveLength(servicii.length);
    panouri.forEach((panou, i) => {
      const s = servicii[i]!;
      expect(panou).toContain(`data-serviciu="${s.slug}"`);
      const pasi = [...(/<ol\b[^>]*>([\s\S]*?)<\/ol>/.exec(panou)?.[1] ?? '').matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => textOf(m[1] ?? ''));
      expect(pasi).toEqual(s.pasi.map((p) => textOf(p)));
      expect(panou).toContain(`href="/servicii/${s.slug}/"`);
      expect(panou).toMatch(new RegExp(`\\bvt-${s.slug}\\b`));
      expect(textOf(panou)).toMatch(/Cere oferta pentru /);
    });
  });

  test('formularul trimite GET la /contact/, fără script și fără atribute style', async () => {
    const sus = hero(await render(PaginaAcasa));
    const f = /<form\b[^>]*>/.exec(sus)?.[0] ?? '';
    expect(f).toMatch(/\smethod="get"/);
    expect(f).toMatch(/\saction="\/contact\/"/);
    const formular = /<form\b[\s\S]*?<\/form>/.exec(sus)?.[0] ?? '';
    expect(formular).not.toContain('<script');
    expect(formular).not.toMatch(/\sstyle=/);
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

  // Proiectul publicabil din testele de mai jos; `servicii` e câmp obligatoriu în schema colecției (stațiile vizitate).
  const proiectPublicabil = {
    slug: 'magazin-online',
    client: 'anonim',
    acord: false,
    aprobat: true,
    titlu: 'Un magazin online din București',
    context: 'Vizite în scădere.',
    ceAmFacut: [],
    rezultate: [],
    servicii: ['creare-site', 'seo'],
  };

  test('proiectele, când există unul publicabil, sunt un card', async () => {
    colectii.proiecte = [proiectPublicabil];
    try {
      const proiecte = sectiune(await render(PaginaAcasa), 'proiecte');
      expect(proiecte).toMatch(SECTIUNE_CARD);
      expect(proiecte).toMatch(/<div class="contener carte"[^>]*>/);
      expect(proiecte).toContain('Un magazin online din București');
    } finally {
      colectii.proiecte = [];
    }
  });

  // Titlul aprobat în §8 al spec-ului; meniul rămâne „Proiecte”. Cardul primește din pagină serviciile proiectului.
  test('Acasă: titlul secțiunii e Proiecte: stații vizitate', async () => {
    colectii.proiecte = [proiectPublicabil];
    try {
      const proiecte = sectiune(await render(PaginaAcasa), 'proiecte');
      expect(proiecte).toMatch(/<h2\b[^>]*\sid="proiecte"[^>]*>\s*Proiecte: stații vizitate\s*<\/h2>/);
      expect(textOf(/<ul\b[^>]*proiect__traseu[^>]*>[\s\S]*?<\/ul>/.exec(proiecte)?.[0] ?? '')).toBe('Creare site SEO');
    } finally {
      colectii.proiecte = [];
    }
  });
});
