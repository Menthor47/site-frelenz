import { SERVICII } from '../../src/form-rules';
import PaginaServicii from '../../src/pages/servicii/index.astro';
import { render, textOf } from './helpers';

// /servicii/ (§4.5, §6.3): serviciile grupate pe cele 4 linii, fiecare cu răspunsul direct și „Ce primești” pe scurt,
// fără rândurile din „De unde pornești?”. Serviciile sunt ciornele reale din src/content/servicii (aceleași date ca la build);
// proiectele și ghidurile, pe care le citește Base, lipsesc.
const colectii = vi.hoisted(() => ({ servicii: [] as object[] }));
vi.mock('astro:content', () => ({
  getCollection: async (nume: string) => (nume === 'servicii' ? colectii.servicii : []).map((data, i) => ({ id: `${nume}-${i}`, data })),
}));

interface Serviciu {
  slug: string;
  raspunsDirect: string;
  livrabile: string[];
  problema: string;
}

const fisiere = import.meta.glob<{ frontmatter: Serviciu }>('../../src/content/servicii/*.md', { eager: true });
const ciorne = Object.values(fisiere).map((m) => m.frontmatter);
// Ordinea din colecție nu contează: pagina le sortează după `ordine`. Le dăm invers, ca sortarea să fie verificată.
colectii.servicii = [...ciorne].reverse();

const main = (html: string) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const titluri = (html: string, nivel: number) =>
  [...html.matchAll(new RegExp(`<h${nivel}\\b[^>]*>([\\s\\S]*?)</h${nivel}>`, 'g'))].map((m) => textOf(m[1] ?? ''));

describe('/servicii/ (§4.5)', () => {
  test('un singur H1, apoi cele 4 linii, în ordinea serviciilor', async () => {
    const h = main(await render(PaginaServicii));
    expect(titluri(h, 1)).toEqual(['Servicii']);
    expect(titluri(h, 2)).toEqual(['Vizibilitate', 'Diagnostic', 'Construcție', 'Reparație']);
  });

  test('fiecare serviciu, în ordinea din src/form-rules.ts, e un link spre pagina lui, sub linia grupului', async () => {
    const h = main(await render(PaginaServicii));
    expect(titluri(h, 3)).toEqual(SERVICII.map((s) => s.nume));
    const sectiuni = h.split(/<section\b/).slice(1);
    for (const s of SERVICII) {
      const sectiune = sectiuni.find((x) => x.includes(`href="/servicii/${s.slug}/"`)) ?? '';
      expect(sectiune, s.slug).toContain(`data-grup="${s.grup}"`);
    }
  });

  test('fiecare serviciu are răspunsul direct și „Ce primești” pe scurt, nu lista întreagă', async () => {
    const text = textOf(main(await render(PaginaServicii)));
    for (const c of ciorne) {
      expect(text, c.slug).toContain(c.raspunsDirect);
      expect(text, c.slug).toContain(c.livrabile[0]);
      expect(text, c.slug).not.toContain(c.livrabile.at(-1));
    }
  });

  test('nu repetă „De unde pornești?” de pe Acasă', async () => {
    const text = textOf(await render(PaginaServicii));
    expect(text).not.toContain('De unde pornești');
    for (const c of ciorne) expect(text, c.slug).not.toContain(c.problema);
  });

  test('banda are harta cu toate liniile estompate, fără „Ești aici” și fără tranziție', async () => {
    const h = main(await render(PaginaServicii));
    expect(h).toContain('class="banda"');
    expect(h).not.toContain('data-plina');
    expect(h).not.toContain('Ești aici');
    expect(h).not.toContain('vt-');
  });

  test('un singur îndemn „Cere o ofertă” în conținut', async () =>
    expect(main(await render(PaginaServicii)).match(/class="buton-cta"/g)).toHaveLength(1));

  test('JSON-LD: CollectionPage, ItemList cu cele 6 servicii în ordine și BreadcrumbList', async () => {
    const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(await render(PaginaServicii))?.[1] ?? '{}';
    const noduri = (JSON.parse(json) as { '@graph': Record<string, any>[] })['@graph'];
    const tipuri = noduri.map((n) => n['@type']);
    expect(tipuri).toEqual(expect.arrayContaining(['CollectionPage', 'ItemList', 'BreadcrumbList']));
    const lista = noduri.find((n) => n['@type'] === 'ItemList');
    expect(lista?.itemListElement.map((e: { url: string }) => new URL(e.url).pathname)).toEqual(SERVICII.map((s) => `/servicii/${s.slug}/`));
  });
});
