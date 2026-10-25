import PaginaGhiduri from '../../src/pages/ghiduri/[...lista].astro';
import PaginaProiecte from '../../src/pages/proiecte/[...lista].astro';
import { cardulUnic, render } from './helpers';

// Listele /proiecte/ și /ghiduri/ (§4.5), în stratul de suprafețe (decizia 29): stau pe suprafața deschisă, ca restul
// paginilor publice cu bandă. Paginile primesc proprietățile pe care le calculează `getStaticPaths` la build; colecțiile,
// pe care le citește Base pentru meniu, lipsesc.
vi.mock('astro:content', () => ({ getCollection: async () => [] }));

const proiect = {
  slug: 'magazin-online',
  titlu: 'Un magazin online din București',
  context: 'Un magazin online cu vizite în scădere.',
  ceAmFacut: ['Am reparat indexarea.'],
  rezultate: [],
  servicii: ['mentenanta-site'],
};

const ghid = { slug: 'de-ce-nu-apare-site-ul-in-google', titlu: 'De ce nu apare site-ul meu în Google', raspuns: 'Pentru că Google nu l-a găsit încă.' };

const main = (h: string) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));

describe('listele (decizia 29)', () => {
  test('/proiecte/ stă pe suprafața deschisă', async () => {
    const h = main(await render(PaginaProiecte, { proiecte: [proiect] }));
    expect(h).toContain('class="main--suprafata"');
    expect(h).toContain('Un magazin online din București');
  });

  test('/ghiduri/ stă pe suprafața deschisă', async () => {
    const h = main(await render(PaginaGhiduri, { ghiduri: [ghid] }));
    expect(h).toContain('class="main--suprafata"');
    expect(h).toContain('De ce nu apare site-ul meu în Google');
  });

  test('/proiecte/: lista stă într-un singur card, sub titlu și introducere', async () => {
    const bucati = cardulUnic(main(await render(PaginaProiecte, { proiecte: [proiect] })));
    expect(bucati).not.toBeNull();
    expect(bucati?.card).toContain('Un magazin online din București');
    expect(bucati?.inainte).toMatch(/<h1\b[^>]*>Proiecte<\/h1>/);
  });

  // Stațiile vizitate: pagina dă componentei serviciile proiectului (câmpurile vin întregi din colecție).
  test('/proiecte/: cardul proiectului arată traseul serviciilor', async () => {
    const t = /<ul\b[^>]*proiect__traseu[^>]*>[\s\S]*?<\/ul>/.exec(main(await render(PaginaProiecte, { proiecte: [proiect] })))?.[0] ?? '';
    expect(t).toMatch(/<li\b[^>]*\sdata-grup="reparatie"[^>]*>\s*Mentenanță site\s*<\/li>/);
  });

  test('/ghiduri/: lista stă într-un singur card, sub titlu și introducere', async () => {
    const bucati = cardulUnic(main(await render(PaginaGhiduri, { ghiduri: [ghid] })));
    expect(bucati).not.toBeNull();
    expect(bucati?.card).toContain('De ce nu apare site-ul meu în Google');
    expect(bucati?.inainte).toMatch(/<h1\b[^>]*>Ghiduri<\/h1>/);
  });
});
