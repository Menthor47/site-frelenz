import Guide from '../../src/layouts/Guide.astro';
import { render, textOf } from './helpers';

// Ghidul (§4.5, §6.3): titlul-întrebare, răspunsul în primul paragraf, detaliile, data publicării și a actualizării,
// autorul (cu link spre Despre) și serviciul legat. Banda are linia serviciului legat, cu „Ești aici” (§5.6).
const stare = vi.hoisted(() => ({ draft: false }));

vi.mock('../../src/lib/env', () => ({
  get DRAFT() {
    return stare.draft;
  },
}));

vi.mock('astro:content', () => ({ getCollection: async () => [] }));

beforeEach(() => {
  stare.draft = false;
});

const ghid = (suprascrieri: Record<string, unknown> = {}) => ({
  slug: 'de-ce-nu-apare-site-ul-in-google',
  titlu: 'De ce nu apare site-ul meu în Google',
  descriere: 'd'.repeat(150),
  raspuns: 'Pentru că Google nu l-a găsit încă, nu are voie să-l indexeze sau nu îl consideră un răspuns bun.',
  publicat: new Date('2026-10-22T00:00:00Z'),
  actualizat: new Date('2026-11-05T00:00:00Z'),
  aprobat: false,
  serviciuLegat: 'audit-seo',
  ...suprascrieri,
});

const CORP = '<h2>Google nu știe încă de site</h2><p>Detaliile ghidului.</p>';

const main = (h: string) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));

describe('Guide (§4.5)', () => {
  test('stă pe suprafața deschisă (decizia 29)', async () => {
    expect(main(await render(Guide, { ghid: ghid() }, { default: CORP }))).toContain('class="main--suprafata"');
  });

  test('H1-ul e titlul, iar primul paragraf de după el e răspunsul', async () => {
    const h = main(await render(Guide, { ghid: ghid() }, { default: CORP }));
    expect(textOf(/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(h)?.[1] ?? '')).toBe('De ce nu apare site-ul meu în Google');
    expect(textOf(/<\/h1>\s*<p\b[^>]*>([\s\S]*?)<\/p>/.exec(h)?.[1] ?? '')).toBe(ghid().raspuns);
  });

  test('detaliile (corpul) vin după răspuns', async () => {
    const h = main(await render(Guide, { ghid: ghid() }, { default: CORP }));
    expect(h.indexOf('Detaliile ghidului.')).toBeGreaterThan(h.indexOf(ghid().raspuns));
  });

  test('autorul cu link spre Despre și datele, cu <time> în format ISO', async () => {
    const h = main(await render(Guide, { ghid: ghid() }, { default: CORP }));
    expect(h).toMatch(/<a href="\/despre\/"[^>]*>Alex Ionescu<\/a>/);
    expect(h).toMatch(/<time datetime="2026-10-22"[^>]*>22 octombrie 2026<\/time>/);
    expect(h).toMatch(/<time datetime="2026-11-05"[^>]*>5 noiembrie 2026<\/time>/);
  });

  test('serviciul legat e un link spre pagina lui', async () => {
    const h = main(await render(Guide, { ghid: ghid() }, { default: CORP }));
    expect(h).toMatch(/<a href="\/servicii\/audit-seo\/"[^>]*>Audit SEO<\/a>/);
  });

  test('banda are linia serviciului legat, cu „Ești aici”, apoi firimiturile Acasă › Ghiduri › titlu', async () => {
    const h = main(await render(Guide, { ghid: ghid() }, { default: CORP }));
    expect(h).toContain('Ești aici');
    // audit-seo e în grupul diagnostic, adică linia M4 (§5.1).
    expect(h).toMatch(/data-linie="M4" data-plina/);
    expect(textOf(/<nav class="firimituri"[\s\S]*?<\/nav>/.exec(h)?.[0] ?? '')).toBe('Acasă Ghiduri De ce nu apare site-ul meu în Google');
  });

  test('JSON-LD: Article cu datele, autor și editor #alex, și un singur BreadcrumbList', async () => {
    const h = await render(Guide, { ghid: ghid() }, { default: CORP });
    const graf = (JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)?.[1] ?? '{}') as { '@graph': Record<string, any>[] })['@graph'];
    const articol = graf.find((n) => n['@type'] === 'Article');
    expect(articol?.headline).toBe('De ce nu apare site-ul meu în Google');
    expect(articol?.datePublished).toBe('2026-10-22');
    expect(articol?.dateModified).toBe('2026-11-05');
    expect(articol?.author['@id']).toMatch(/#alex$/);
    expect(graf.filter((n) => n['@type'] === 'BreadcrumbList')).toHaveLength(1);
  });

  test('răspunsul cu marcaj trece prin Placeholder', async () => {
    stare.draft = true;
    expect(main(await render(Guide, { ghid: ghid({ raspuns: '[DE COMPLETAT:#16]' }) }, { default: CORP }))).toContain('[DE COMPLETAT:#16]');
  });

  test('un singur îndemn „Cere o ofertă” în conținut, fără atribute style, cu un singur script (al trenurilor de pe bandă)', async () => {
    const h = await render(Guide, { ghid: ghid() }, { default: CORP });
    expect(main(h).match(/Cere o ofertă/g)).toHaveLength(1);
    expect(h).not.toMatch(/\sstyle=/);
    expect(h.match(/<script\b(?![^>]*application\/ld\+json)/g)).toHaveLength(1);
  });
});
