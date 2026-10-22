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

  test('traseele mari, pe albastru deschis', async () => {
    const h = main(await render(PaginaCumLucrez));
    expect(h).toMatch(/class="[^"]*trasee--mare/);
    expect(h).toContain('Remediere unică');
    expect(h).toContain('Remediere + abonament lunar');
  });

  test('cei patru pași, numerotați și explicați, în ordinea traseelor', async () => {
    const h = main(await render(PaginaCumLucrez));
    const lista = /<ol class="pasi-explicati"[^>]*>([\s\S]*?)<\/ol>/.exec(h)?.[1] ?? '';
    const pasi = [...lista.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1] ?? '');
    expect(pasi.map((p) => titluri(p, 3)[0])).toEqual(['Evaluare', 'Ofertă', 'Lucru', 'Raport']);
    for (const p of pasi) expect(textOf(p.replace(/<h3[\s\S]*?<\/h3>/, '')).length).toBeGreaterThan(40);
  });

  test('cele două formate, fără cifre, cu fraza exactă despre preț', async () => {
    const text = textOf(main(await render(PaginaCumLucrez)));
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
