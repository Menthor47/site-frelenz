import { readFileSync } from 'node:fs';
import PaginaCumLucrez from '../../src/pages/cum-lucrez.astro';
import { adresareFormala } from '../shared/adresare';
import { render, textOf } from './helpers';

// /cum-lucrez/ (§4.5): RouteMap mare cu cei patru pași explicați, cele două formate fără cifre, cu fraza exactă despre preț,
// și mențiunea că Alex lucrează doar cu firme. Base citește proiectele și ghidurile: aici nu există niciunul.
vi.mock('astro:content', () => ({ getCollection: async () => [] }));

const main = (html: string) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const titluri = (html: string, nivel: number) =>
  [...html.matchAll(new RegExp(`<h${nivel}\\b[^>]*>([\\s\\S]*?)</h${nivel}>`, 'g'))].map((m) => textOf(m[1] ?? ''));

const FRAZA_PRET = 'Prețul, reducerea și ce include abonamentul le stabilim după ce mă uit la site-ul tău.';
const FRAZA_B2B = 'Lucrez doar cu firme, PFA-uri și alte entități profesionale.';

describe('/cum-lucrez/ (§4.5)', () => {
  test('un singur H1, apoi primul paragraf îl numește pe Alex și spune cu cine lucrează', async () => {
    const h = main(await render(PaginaCumLucrez));
    expect(titluri(h, 1)).toEqual(['Cum lucrez']);
    const primul = textOf(/<\/h1>\s*<p\b[^>]*>([\s\S]*?)<\/p>/.exec(h)?.[1] ?? '');
    expect(primul).toContain('Alex Ionescu');
    expect(primul).toContain(FRAZA_B2B);
  });

  test('traseele mari, într-o secțiune pe albastru deschis', async () => {
    const h = main(await render(PaginaCumLucrez));
    const sectiune = /<section class="cum-trasee"[^>]*>([\s\S]*?)<\/section>/.exec(h)?.[1] ?? '';
    expect(sectiune).toMatch(/class="[^"]*trasee--mare/);
    expect(sectiune).toContain('Remediere unică');
    expect(sectiune).toContain('Remediere + abonament lunar');
    const sursa = readFileSync(new URL('../../src/pages/cum-lucrez.astro', import.meta.url), 'utf8');
    expect(/\.cum-trasee\s*\{([^}]*)\}/.exec(sursa)?.[1]).toContain('background: var(--tint-blue);');
  });

  test('cei patru pași, numerotați și explicați, cu numele stațiilor din trasee, în aceeași ordine', async () => {
    const h = main(await render(PaginaCumLucrez));
    const lista = /<ol class="pasi-explicati"[^>]*>([\s\S]*?)<\/ol>/.exec(h)?.[1] ?? '';
    const pasi = [...lista.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1] ?? '');
    // Stațiile primului traseu (remedierea unică), cum le randează RouteMap.
    const traseu = /<ol class="pasi\b[^"]*"[^>]*>([\s\S]*?)<\/ol>/.exec(h)?.[1] ?? '';
    const statii = [...traseu.matchAll(/<li class="pas"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => textOf(m[1] ?? ''));
    expect(statii).toHaveLength(4);
    expect(pasi.map((p) => titluri(p, 3)[0])).toEqual(statii);
    for (const p of pasi) expect(textOf(p.replace(/<h3[\s\S]*?<\/h3>/, '')).length).toBeGreaterThan(40);
  });

  test('cele două formate, fiecare cu fraza lui, fără cifre, cu fraza exactă despre preț', async () => {
    const text = textOf(main(await render(PaginaCumLucrez)));
    expect(text).toContain('Remedierea unică repară ce am găsit la evaluare și se încheie cu raportul.');
    expect(text).toContain('Cu abonamentul lunar, remedierea costă mai puțin, iar lucrul continuă lună de lună după ea.');
    expect(text).toContain(FRAZA_PRET);
    expect(text).not.toMatch(/\d/);
  });

  test('la „tu”, fără promisiuni interzise', async () => {
    expect(adresareFormala(textOf(main(await render(PaginaCumLucrez))))).toEqual([]);
  });

  test('banda de sus are harta statică, fără „Ești aici”, apoi firimiturile', async () => {
    const h = main(await render(PaginaCumLucrez));
    expect(h).toMatch(/class="[^"]*harta--statica/);
    expect(h).not.toContain('Ești aici');
    expect(h.indexOf('harta--statica')).toBeLessThan(h.indexOf('Firimituri'));
  });

  test('JSON-LD: WebPage și un singur BreadcrumbList', async () => {
    const h = await render(PaginaCumLucrez);
    const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)?.[1] ?? '{}';
    const tipuri = (JSON.parse(json) as { '@graph': { '@type': string }[] })['@graph'].map((n) => n['@type']);
    expect(tipuri.filter((t) => t === 'WebPage')).toHaveLength(1);
    expect(tipuri.filter((t) => t === 'BreadcrumbList')).toHaveLength(1);
  });

  test('un singur îndemn „Cere o ofertă” în conținut, fără atribute style și fără scripturi', async () => {
    const h = await render(PaginaCumLucrez);
    expect(main(h).match(/Cere o ofertă/g)).toHaveLength(1);
    expect(h).not.toMatch(/\sstyle=/);
    expect(h.match(/<script\b(?![^>]*application\/ld\+json)/g)).toBeNull();
  });
});
