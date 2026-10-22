import PaginaDespre from '../../src/pages/despre.astro';
import { render, textOf } from './helpers';

// /despre/ (§4.5, §6.3, registrul #4–#6): biografia, studiile, experiența și instrumentele sunt marcajul #4 până le dă
// Alex; profilurile apar doar dacă există; fără fotografie și fără cadru gol. ProfilePage cu mainEntity #alex și Person complet.
const stare = vi.hoisted(() => ({ draft: false, profiluri: [] as string[] }));

vi.mock('../../src/lib/env', () => ({
  get DRAFT() {
    return stare.draft;
  },
}));

// Profilurile se schimbă pe loc (aceeași listă), pentru că jsonld.ts le citește o dată, la încărcare.
vi.mock('../../src/site.config', async (original) => {
  const { site } = await original<typeof import('../../src/site.config')>();
  return { site: new Proxy(site, { get: (tinta, cheie) => (cheie === 'profiluri' ? stare.profiluri : Reflect.get(tinta, cheie)) }) };
});

vi.mock('astro:content', () => ({ getCollection: async () => [] }));

beforeEach(() => {
  stare.draft = false;
  stare.profiluri.splice(0);
});

const main = (h: string) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));
const titluri = (h: string, nivel: number) =>
  [...h.matchAll(new RegExp(`<h${nivel}\\b[^>]*>([\\s\\S]*?)</h${nivel}>`, 'g'))].map((m) => textOf(m[1] ?? ''));
const graf = (h: string) =>
  (JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)?.[1] ?? '{}') as { '@graph': Record<string, any>[] })['@graph'];

describe('/despre/ (§4.5)', () => {
  test('H1-ul e numele, iar primul paragraf spune cine e Alex, din faptele din spec (§1)', async () => {
    const h = main(await render(PaginaDespre));
    expect(titluri(h, 1)).toEqual(['Alex Ionescu']);
    const primul = textOf(/<\/h1>\s*<p\b[^>]*>([\s\S]*?)<\/p>/.exec(h)?.[1] ?? '');
    expect(primul).toContain('Alex Ionescu');
    expect(primul).toContain('consultant SEO și web design');
    expect(primul).toContain('București');
  });

  test('în previzualizare, biografia, studiile, experiența și instrumentele sunt marcajul #4', async () => {
    stare.draft = true;
    const h = main(await render(PaginaDespre));
    expect(titluri(h, 2)).toEqual(expect.arrayContaining(['Cine sunt', 'Studii', 'Experiență', 'Instrumente']));
    expect(h.match(/<mark class="marcaj">\[DE COMPLETAT:#4\]/g)).toHaveLength(4);
  });

  test('în producție, secțiunile cu marcaj lipsesc cu tot cu titlu, fără paragrafe goale', async () => {
    const h = main(await render(PaginaDespre));
    expect(h).not.toContain('DE COMPLETAT');
    expect(titluri(h, 2)).not.toEqual(expect.arrayContaining(['Studii']));
    expect(h).not.toMatch(/<p\b[^>]*>\s*<\/p>/);
  });

  test('fără fotografie și fără cadru gol', async () => {
    const h = main(await render(PaginaDespre));
    expect(h).not.toMatch(/<img\b|<figure\b|<picture\b/);
  });

  test('profilurile lipsesc cât lista e goală și apar ca linkuri când există', async () => {
    expect(main(await render(PaginaDespre))).not.toContain('Profiluri');
    stare.profiluri.push('https://www.linkedin.com/in/exemplu');
    const h = main(await render(PaginaDespre));
    expect(titluri(h, 2)).toContain('Profiluri');
    expect(h).toMatch(/<a href="https:\/\/www\.linkedin\.com\/in\/exemplu"[^>]*rel="me"/);
  });

  test('JSON-LD: ProfilePage cu mainEntity #alex, un singur Person, complet, și un singur BreadcrumbList', async () => {
    const noduri = graf(await render(PaginaDespre));
    const pagina = noduri.find((n) => n['@type'] === 'ProfilePage');
    expect(pagina?.mainEntity['@id']).toMatch(/#alex$/);
    const persoane = noduri.filter((n) => n['@type'] === 'Person');
    expect(persoane).toHaveLength(1);
    expect(persoane[0]?.jobTitle).toBe('Consultant SEO și web designer');
    expect(noduri.filter((n) => n['@type'] === 'BreadcrumbList')).toHaveLength(1);
  });

  test('un singur îndemn „Cere o ofertă” în conținut, fără atribute style și fără scripturi', async () => {
    const h = await render(PaginaDespre);
    expect(main(h).match(/Cere o ofertă/g)).toHaveLength(1);
    expect(h).not.toMatch(/\sstyle=/);
    expect(h.match(/<script\b(?![^>]*application\/ld\+json)/g)).toBeNull();
  });
});
