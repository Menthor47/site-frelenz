import PaginaContact from '../../src/pages/contact/index.astro';
import PaginaDespre from '../../src/pages/despre.astro';
import { render, textOf } from './helpers';

// /despre/ (§4.5, §6.3, registrul #4–#6, decizia 22): biografia, experiența și instrumentele, fără studii, scrise din faptele lui
// Alex; profilurile apar doar dacă există; fără fotografie și fără cadru gol. ProfilePage cu mainEntity #alex și Person complet.
const stare = vi.hoisted(() => ({ draft: false, profiluri: [] as string[], proiecte: [] as { data: Record<string, unknown> }[] }));

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

vi.mock('astro:content', () => ({ getCollection: async (colectie: string) => (colectie === 'proiecte' ? stare.proiecte : []) }));

beforeEach(() => {
  stare.draft = false;
  stare.profiluri.splice(0);
  stare.proiecte.splice(0);
});

/** Studiul szitrans, publicabil (acord și aprobat) sau nu. */
const szitrans = (aprobat: boolean) => ({ data: { slug: 'szitrans', client: 'szitrans.eu', acord: true, aprobat } });

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

  test('cine sunt, experiența și instrumentele, fără studii (decizia lui Alex) și fără marcaje, nici în previzualizare', async () => {
    for (const draft of [false, true]) {
      stare.draft = draft;
      const h = main(await render(PaginaDespre));
      // „Unelte” e titlul cardului de profil, care stă după povestea cu cele trei secțiuni.
      expect(titluri(h, 2)).toEqual(['Cine sunt', 'Experiență', 'Instrumente', 'Unelte']);
      expect(h).not.toContain('DE COMPLETAT');
      expect(h).not.toMatch(/<p\b(?![^>]*harta__anunt)[^>]*>\s*<\/p>/);
    }
  });

  // Stratul de suprafețe (§4.5): povestea stă în carduri pe coloana din stânga, profilul într-un card pe cea din dreapta.
  // Astro adaugă `data-astro-cid-…` după `class`, deci etichetele se potrivesc cu `[^>]*`, nu cu un `class="…"` exact.
  test('secțiunile sunt carduri în coloana poveștii, iar povestea și profilul stau în aceeași grilă', async () => {
    stare.profiluri.push('https://www.linkedin.com/in/exemplu');
    const h = main(await render(PaginaDespre));
    const grila = /<div\b[^>]*class="[^"]*despre__grila[^"]*"[^>]*>([\s\S]*)<\/aside>/.exec(h)?.[1] ?? '';
    expect(grila).toMatch(/^\s*<div\b[^>]*class="[^"]*despre__poveste[^"]*"/);
    const poveste = /<div\b[^>]*class="[^"]*despre__poveste[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<aside\b/.exec(grila)?.[1] ?? '';
    const sectiuni = [...poveste.matchAll(/<section\b[^>]*>/g)].map((m) => m[0]);
    // Cine sunt, Experiență, Instrumente și Profiluri (lista are o valoare).
    expect(sectiuni).toHaveLength(4);
    for (const s of sectiuni) expect(s).toMatch(/class="carte"/);
    expect(grila).toMatch(/<aside\b[^>]*class="carte despre__profil"/);
  });

  test('profilul e un card, fără imagine, cu numele și rolul lui Alex și cu linkul spre #date-firma, iar ținta există', async () => {
    const h = main(await render(PaginaDespre));
    const profil = h.match(/<aside[^>]*class="[^"]*despre__profil[^"]*"[^>]*>([\s\S]*?)<\/aside>/)?.[1] ?? '';
    expect(h).toMatch(/<aside[^>]*class="[^"]*\bcarte\b[^"]*despre__profil/);
    expect(profil).not.toBe('');
    expect(profil).not.toMatch(/<img\b|<picture\b|<figure\b/);
    expect(profil).toContain('href="/contact/#date-firma"');
    expect(profil).toMatch(/<a\b[^>]*href="\/contact\/#date-firma"/);
    // Numele și rolul cu orașul, ca text literal: verificăm ce citește vizitatorul, nu valoarea din JSON-LD.
    expect(textOf(profil)).toContain('Alex Ionescu');
    expect(textOf(profil)).toContain('Consultant SEO și web designer, din București.');
    // Ținta: pagina Contact, randată ca la build, are elementul cu id-ul din fragment.
    expect(await render(PaginaContact)).toMatch(/<[a-z]+\b[^>]*\sid="date-firma"[^>]*>/);
  });

  test('Despre și Contact stau pe suprafața deschisă (decizia 29)', async () => {
    for (const Pagina of [PaginaDespre, PaginaContact]) expect(main(await render(Pagina))).toContain('class="main--suprafata"');
  });

  test('lista de unelte din profil e cea din „Instrumente”', async () => {
    const h = main(await render(PaginaDespre));
    const unelte = [...h.matchAll(/<li class="despre__unealta"[^>]*>([^<]*)<\/li>/g)].map((m) => m[1] ?? '');
    expect(unelte).toEqual(['Astro', 'React', 'TypeScript', 'Cloudflare', 'WordPress', 'WooCommerce', 'PHP', 'Lighthouse', 'axe', 'Playwright', 'Git']);
    // Fiecare unealtă apare și în textul secțiunii „Instrumente”: nu inventăm unelte.
    const instrumente = textOf(/<h2\b[^>]*>Instrumente<\/h2>([\s\S]*?)<\/section>/.exec(h)?.[1] ?? '');
    for (const u of unelte) expect(instrumente, u).toContain(u);
  });

  test('szitrans.eu apare cu numele (acord, #7), magazinul online rămâne anonim', async () => {
    const text = textOf(main(await render(PaginaDespre))).toLowerCase();
    expect(text).toContain('szitrans.eu');
    expect(text).not.toMatch(/amsterdam|headshop/);
  });

  test('szitrans.eu e link spre studiul de caz doar când acela se construiește', async () => {
    const link = /<a href="\/proiecte\/szitrans\/"[^>]*>szitrans\.eu<\/a>/;
    stare.proiecte.push(szitrans(false));
    expect(main(await render(PaginaDespre))).not.toMatch(link);
    stare.proiecte.splice(0, 1, szitrans(true));
    const h = main(await render(PaginaDespre));
    expect(h).toMatch(link);
    // Linkul stă lipit de text: fără spațiu înaintea virgulei de după el.
    expect(h).toMatch(/Am construit <a href="\/proiecte\/szitrans\/"[^>]*>szitrans\.eu<\/a>, site-ul bilingv/);
  });

  test('fără fotografie și fără cadru gol', async () => {
    const h = main(await render(PaginaDespre));
    expect(h).not.toMatch(/<img\b|<figure\b|<picture\b/);
  });

  test('profilurile lipsesc cât lista e goală și apar ca linkuri, și în sameAs, când există', async () => {
    const inainte = await render(PaginaDespre);
    expect(main(inainte)).not.toContain('Profiluri');
    expect(graf(inainte).find((n) => n['@type'] === 'Person')?.sameAs).toBeUndefined();
    stare.profiluri.push('https://www.linkedin.com/in/exemplu', '[DE COMPLETAT:#5]', ' ');
    const dupa = await render(PaginaDespre);
    expect(titluri(main(dupa), 2)).toContain('Profiluri');
    expect(main(dupa).match(/rel="me"/g)).toHaveLength(1);
    expect(main(dupa)).toMatch(/<a href="https:\/\/www\.linkedin\.com\/in\/exemplu"[^>]*rel="me"/);
    expect(graf(dupa).find((n) => n['@type'] === 'Person')?.sameAs).toEqual(['https://www.linkedin.com/in/exemplu']);
  });

  test('JSON-LD: ProfilePage cu mainEntity #alex, un singur Person, complet, și un singur BreadcrumbList', async () => {
    const noduri = graf(await render(PaginaDespre));
    const pagina = noduri.find((n) => n['@type'] === 'ProfilePage');
    expect(pagina?.mainEntity['@id']).toMatch(/#alex$/);
    const persoane = noduri.filter((n) => n['@type'] === 'Person');
    expect(persoane).toHaveLength(1);
    expect(persoane[0]?.jobTitle).toBe('Consultant SEO și web designer');
    // Cât CUI-ul e marcaj și nu există o fotografie reală (§6.3): fără taxID, fără image; adresa are doar orașul și țara.
    expect(persoane[0]?.taxID).toBeUndefined();
    expect(persoane[0]?.image).toBeUndefined();
    expect(Object.keys(persoane[0]?.address ?? {}).sort()).toEqual(['@type', 'addressCountry', 'addressLocality']);
    expect(noduri.filter((n) => n['@type'] === 'BreadcrumbList')).toHaveLength(1);
  });

  test('un singur îndemn „Cere o ofertă” în conținut, fără atribute style, cu un singur script (al trenurilor de pe bandă)', async () => {
    const h = await render(PaginaDespre);
    expect(main(h).match(/Cere o ofertă/g)).toHaveLength(1);
    expect(h).not.toMatch(/\sstyle=/);
    expect(h.match(/<script\b(?![^>]*application\/ld\+json)/g)).toHaveLength(1);
  });
});
