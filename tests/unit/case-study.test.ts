import CaseStudy from '../../src/layouts/CaseStudy.astro';
import { cardulUnic, render, textOf } from './helpers';

// Studiul de caz (§4.5, §6.3): context → problema → ce am făcut → rezultat → serviciile folosite. La rezultat intră doar
// ce se poate dovedi, cu sursa și data. Niciun marcaj nu apare ca text brut (§3.4): în producție, câmpul cu marcaj lipsește.
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

const proiect = (suprascrieri: Record<string, unknown> = {}) => ({
  slug: 'magazin-online',
  titlu: 'Un magazin online din București',
  descriere: 'Studiu de caz: un magazin online din București. Ce îl încurca în Google, ce am făcut eu, Alex Ionescu, și ce rezultat s-a putut dovedi, cu sursă.',
  client: 'anonim',
  acord: false,
  aprobat: true,
  context: 'Un magazin online cu vizite în scădere.',
  problema: 'Paginile de produs nu apăreau în Google.',
  ceAmFacut: ['Am reparat indexarea.', 'Am rescris titlurile.'],
  rezultate: [{ text: 'Vizitele din Google au crescut.', sursa: 'Google Search Console', data: new Date('2026-03-01T00:00:00Z') }],
  servicii: ['audit-seo', 'seo'],
  capturi: [],
  ...suprascrieri,
});

const main = (h: string) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));
const titluri = (h: string, nivel: number) =>
  [...h.matchAll(new RegExp(`<h${nivel}\\b[^>]*>([\\s\\S]*?)</h${nivel}>`, 'g'))].map((m) => textOf(m[1] ?? ''));

describe('CaseStudy (§4.5)', () => {
  test('stă pe suprafața deschisă (decizia 29)', async () => {
    expect(main(await render(CaseStudy, { proiect: proiect() }))).toContain('class="main--suprafata"');
  });

  test('Open Graph îl prezintă ca articol (og:type „article”)', async () => {
    expect(await render(CaseStudy, { proiect: proiect() })).toMatch(/<meta property="og:type" content="article"/);
  });

  test('cele cinci secțiuni stau într-un singur card, iar titlul rămâne deasupra lui', async () => {
    const bucati = cardulUnic(main(await render(CaseStudy, { proiect: proiect() })));
    expect(bucati).not.toBeNull();
    expect(bucati?.inainte).toMatch(/<h1\b/);
    expect(bucati?.inainte).not.toMatch(/<section\b/);
    // Contextul, Problema, Ce am făcut, Rezultatul, Serviciile folosite.
    expect(bucati?.card.match(/<section\b/g)).toHaveLength(5);
  });

  test('H1-ul, apoi secțiunile în ordinea din spec', async () => {
    const h = main(await render(CaseStudy, { proiect: proiect() }));
    expect(titluri(h, 1)).toEqual(['Un magazin online din București']);
    expect(titluri(h, 2).slice(0, 5)).toEqual(['Contextul', 'Problema', 'Ce am făcut', 'Rezultatul', 'Serviciile folosite']);
  });

  test('rezultatul are sursa și data', async () => {
    const text = textOf(main(await render(CaseStudy, { proiect: proiect() })));
    expect(text).toContain('Vizitele din Google au crescut. Sursa: Google Search Console, martie 2026.');
  });

  test('serviciile folosite sunt linkuri spre paginile lor, cu numele din form-rules', async () => {
    const h = main(await render(CaseStudy, { proiect: proiect() }));
    expect(h).toMatch(/<a href="\/servicii\/audit-seo\/"[^>]*>Audit SEO<\/a>/);
    expect(h).toMatch(/<a href="\/servicii\/seo\/"[^>]*>SEO<\/a>/);
  });

  test('banda are linia primului serviciu, cu „Ești aici”, apoi firimiturile Acasă › Proiecte › titlu', async () => {
    const h = main(await render(CaseStudy, { proiect: proiect() }));
    expect(h).toContain('Ești aici');
    const firimituri = textOf(/<nav class="firimituri"[\s\S]*?<\/nav>/.exec(h)?.[0] ?? '');
    expect(firimituri).toBe('Acasă Proiecte Un magazin online din București');
  });

  test('JSON-LD: Article cu serviciile ca about, și un singur BreadcrumbList', async () => {
    const h = await render(CaseStudy, { proiect: proiect() });
    const graf = (JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)?.[1] ?? '{}') as { '@graph': Record<string, any>[] })['@graph'];
    const articol = graf.find((n) => n['@type'] === 'Article');
    expect(articol?.headline).toBe('Un magazin online din București');
    expect(articol?.about.map((s: { name: string }) => s.name)).toEqual(['Audit SEO', 'SEO']);
    expect(graf.filter((n) => n['@type'] === 'BreadcrumbList')).toHaveLength(1);
  });

  test('în producție, câmpurile cu marcaj lipsesc cu tot cu secțiunea, iar rezultatul cu marcaj nu apare', async () => {
    const h = main(
      await render(CaseStudy, {
        proiect: proiect({
          context: '[DE COMPLETAT:#21]',
          problema: '[DE COMPLETAT:#21]',
          ceAmFacut: ['[DE COMPLETAT:#21]'],
          rezultate: [{ text: '[DE COMPLETAT:#10]', sursa: '[DE COMPLETAT:#10]', data: new Date('2026-01-01T00:00:00Z') }],
        }),
      }),
    );
    expect(h).not.toContain('DE COMPLETAT');
    expect(titluri(h, 2)).not.toContain('Contextul');
    expect(titluri(h, 2)).not.toContain('Problema');
    expect(titluri(h, 2)).not.toContain('Ce am făcut');
    expect(titluri(h, 2)).not.toContain('Rezultatul');
    expect(titluri(h, 2)).toContain('Serviciile folosite');
  });

  test('în previzualizare, marcajele trec prin Placeholder', async () => {
    stare.draft = true;
    const h = main(await render(CaseStudy, { proiect: proiect({ context: '[DE COMPLETAT:#21]', rezultate: [{ text: '[DE COMPLETAT:#10]', sursa: 'x', data: new Date('2026-01-01T00:00:00Z') }] }) }));
    expect(h.match(/<mark class="marcaj">\[DE COMPLETAT:#(?:21|10)\]/g)).toHaveLength(2);
  });

  test('capturile au text alternativ', async () => {
    const h = main(await render(CaseStudy, { proiect: proiect({ capturi: [{ src: '/proiecte/magazin.png', alt: 'Pagina de produs, după' }] }) }));
    expect(h).toMatch(/<img\b[^>]*src="\/proiecte\/magazin\.png"[^>]*alt="Pagina de produs, după"/);
  });

  // Pe acest-site, rezultatul sunt scorurile (§4.5), deci stau la „Rezultatul”, înaintea serviciilor; fișa vine la final,
  // cu fraza despre cookie-uri și scripturi terțe ca introducere.
  test('fișa paginii și scorurile apar doar pe acest-site, în ordinea studiului de caz', async () => {
    expect(main(await render(CaseStudy, { proiect: proiect() }))).not.toContain('Fișa acestei pagini');
    const h = main(await render(CaseStudy, { proiect: proiect({ slug: 'acest-site', rezultate: [], scoruri: [] }) }));
    expect(titluri(h, 2)).toEqual(['Contextul', 'Problema', 'Ce am făcut', 'Rezultatul', 'Serviciile folosite', 'Fișa acestei pagini']);
    const fisa = h.slice(h.indexOf('Fișa acestei pagini'));
    expect(textOf(fisa)).toContain('Site-ul nu setează niciun cookie și nu încarcă scripturi de la alte firme.');
  });

  test('serviciile provizorii au marcajul lor, doar în previzualizare', async () => {
    const cu = proiect({ serviciiDeConfirmat: '[DE COMPLETAT:#8]' });
    const productie = main(await render(CaseStudy, { proiect: cu }));
    expect(productie).not.toContain('DE COMPLETAT');
    expect(productie).not.toMatch(/<p\b(?![^>]*harta__anunt)[^>]*>\s*<\/p>/);
    stare.draft = true;
    const h = main(await render(CaseStudy, { proiect: cu }));
    const servicii = h.slice(h.indexOf('Serviciile folosite'));
    expect(servicii).toContain('[DE COMPLETAT:#8]');
  });

  test('lângă un rezultat încă de completat nu apare o dată', async () => {
    stare.draft = true;
    const h = main(await render(CaseStudy, { proiect: proiect({ rezultate: [{ text: '[DE COMPLETAT:#10]', sursa: '[DE COMPLETAT:#10]', data: new Date('2026-01-01T00:00:00Z') }] }) }));
    expect(textOf(h)).not.toContain('ianuarie 2026');
  });

  test('titlul cu marcaj trece prin Placeholder', async () => {
    stare.draft = true;
    expect(/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(main(await render(CaseStudy, { proiect: proiect({ titlu: '[DE COMPLETAT:#21]' }) })))?.[1]).toContain('<mark class="marcaj">');
  });

  // §5.5: „nicio cifră nu e scrisă de mână” — tipurile din fișă sunt exact cele din @graph-ul randat al paginii.
  test('tipurile din fișă sunt cele din JSON-LD-ul paginii', async () => {
    const h = await render(CaseStudy, { proiect: proiect({ slug: 'acest-site' }) });
    const graf = (JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)?.[1] ?? '{}') as { '@graph': { '@type': string }[] })['@graph'];
    const randuri = [...h.matchAll(/<dd\b[^>]*class="[^"]*fisa__valoare[^"]*"[^>]*>([\s\S]*?)<\/dd>/g)].map((m) => textOf(m[1] ?? ''));
    expect(randuri.at(-1)).toBe(graf.map((n) => n['@type']).join(', '));
  });

  test('scorurile: cu sursa, valoarea, versiunea Lighthouse și luna; fără scoruri, marcajul #11 doar în previzualizare', async () => {
    const scor = { valoare: 100, data: new Date('2026-12-01T00:00:00Z'), versiuneLighthouse: '13.5.0', sursa: 'Performanță, mobil' };
    expect(textOf(main(await render(CaseStudy, { proiect: proiect({ slug: 'acest-site', scoruri: [scor] }) })))).toContain(
      'Performanță, mobil: 100 (Lighthouse 13.5.0, decembrie 2026)',
    );
    expect(main(await render(CaseStudy, { proiect: proiect({ slug: 'acest-site', scoruri: [] }) }))).not.toContain('DE COMPLETAT');
    stare.draft = true;
    expect(main(await render(CaseStudy, { proiect: proiect({ slug: 'acest-site', scoruri: [] }) }))).toContain('[DE COMPLETAT:#11]');
  });

  test('un singur îndemn „Cere o ofertă” în conținut, fără atribute style', async () => {
    const h = await render(CaseStudy, { proiect: proiect() });
    expect(main(h).match(/Cere o ofertă/g)).toHaveLength(1);
    expect(h).not.toMatch(/\sstyle=/);
  });
});
