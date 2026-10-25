import { readFileSync } from 'node:fs';
import Faq from '../../src/components/Faq.astro';
import RouteMap from '../../src/components/RouteMap.astro';
import { render, textOf } from './helpers';

// Cele două trasee și întrebările frecvente (§4.3 punctele 4 și 6, §5.2, §5.8, §9.2). „De unde pornești?” e acum alegătorul
// din hero (AlegatorTraseu), cu testele lui în alegator-traseu.test.ts.
// Starea DRAFT e simulată: în producție `Placeholder` nu scrie nimic, în previzualizare scrie marcajul.
const stare = vi.hoisted(() => ({ draft: false }));

vi.mock('../../src/lib/env', () => ({
  get DRAFT() {
    return stare.draft;
  },
}));

beforeEach(() => {
  stare.draft = false;
});

/** Regulile CSS din blocul `<style>` al unei componente, fără comentarii. */
function css(componenta: string): string {
  const sursa = readFileSync(new URL(`../../src/components/${componenta}.astro`, import.meta.url), 'utf8');
  const bloc = /<style>([\s\S]*?)<\/style>/.exec(sursa)?.[1];
  if (bloc === undefined) throw new Error(`${componenta}.astro nu are bloc <style>`);
  return bloc.replace(/\/\*[\s\S]*?\*\//g, '');
}

const scapa = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Declarațiile primei reguli cu exact acest selector, sau `undefined`. */
function declaratii(stiluri: string, selector: string): string | undefined {
  return new RegExp(`(?:^|[{}])\\s*${scapa(selector)}\\s*\\{([^}]*)\\}`).exec(stiluri)?.[1];
}

// ——— RouteMap ———

const PASI = ['Evaluare', 'Ofertă', 'Lucru', 'Raport'];

/** Elementele <li> directe ale unei liste, ca text. */
const elementeListei = (html: string): string[] => [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => textOf(m[1]!));

describe('RouteMap', () => {
  test('are etichetele traseelor', async () => {
    const t = textOf(await render(RouteMap, { marime: 'compact' }));
    expect(t).toContain('Remediere unică');
    expect(t).toContain('Remediere + abonament lunar');
  });

  test.each(['compact', 'mare'] as const)('%s: două liste ordonate de câte patru pași, în ordine, fiecare numită de eticheta ei', async (marime) => {
    const h = await render(RouteMap, { marime });
    const liste = [...h.matchAll(/<ol\b([^>]*)>([\s\S]*?)<\/ol>/g)];
    expect(liste).toHaveLength(2);
    const etichete = ['Remediere unică', 'Remediere + abonament lunar'];
    liste.forEach((lista, i) => {
      expect(elementeListei(lista[2]!)).toEqual(PASI);
      const id = /aria-labelledby="([^"]+)"/.exec(lista[1]!)?.[1];
      expect(id).toBeDefined();
      expect(h).toMatch(new RegExp(`id="${scapa(id!)}"[^>]*>${scapa(etichete[i]!)}<`));
    });
    // Id-urile diferă între mărimi, ca ambele să încapă pe aceeași pagină fără id duplicat.
    expect([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])).toHaveLength(2);
  });

  test('cele două mărimi nu se încurcă pe aceeași pagină (id-uri unice)', async () => {
    const ids = [...(await render(RouteMap, { marime: 'compact' })).matchAll(/\sid="([^"]+)"/g), ...(await render(RouteMap, { marime: 'mare' })).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('mărimea se vede în clasa rădăcinii', async () => {
    expect(await render(RouteMap, { marime: 'compact' })).toMatch(/^<div class="trasee trasee--compact/);
    expect(await render(RouteMap, { marime: 'mare' })).toMatch(/^<div class="trasee trasee--mare/);
  });

  test('bucla lunară are cele trei stații alese de Alex (#15), după pașii abonamentului', async () => {
    const h = await render(RouteMap, { marime: 'compact' });
    const bucla = /<ul\b[^>]*>([\s\S]*?)<\/ul>/.exec(h)?.[1];
    expect(bucla).toBeDefined();
    expect(elementeListei(bucla!)).toEqual(['Verificare', 'Actualizări', 'Raport']);
    expect(h.indexOf('<ul')).toBeGreaterThan(h.indexOf('Remediere + abonament lunar'));
  });

  test('fără marcaje, nici în previzualizare', async () => {
    stare.draft = true;
    expect(await render(RouteMap, { marime: 'compact' })).not.toContain('DE COMPLETAT');
  });

  test('bucla are și o etichetă text, ca să nu stea doar în desen', async () => {
    expect(textOf(await render(RouteMap, { marime: 'compact' }))).toContain('Se repetă lunar');
  });

  test('desenat complet de la început: fără script, fără SVG animat, fără atribute style', async () => {
    const h = await render(RouteMap, { marime: 'mare' });
    expect(h).not.toContain('<script');
    expect(h).not.toMatch(/<(?:svg|animate)/);
    expect(h).not.toMatch(/\sstyle=/);
    const stiluri = css('RouteMap');
    expect(stiluri).not.toMatch(/@keyframes|animation|transition|view-timeline|animation-timeline/);
  });

  test('fără prețuri și fără cifre inventate', async () => {
    const t = textOf(await render(RouteMap, { marime: 'compact' }));
    expect(t).not.toMatch(/\d/);
    expect(t).not.toMatch(/lei|ron|€|eur/i);
  });

  // A-14 (spec §6): culorile grupurilor rămân doar pentru servicii. Ambele trasee sunt în cerneală, iar diferența dintre ele
  // stă în formă: remedierea unică e linia plină, care se termină într-o stație plină; abonamentul continuă cu bucla punctată.
  test('RouteMap nu folosește culorile grupurilor: ambele trasee în --ink, bucla punctată', () => {
    const stiluri = css('RouteMap');
    expect(stiluri).not.toMatch(/--(?:yellow|blue|green|red)/);
    expect(stiluri).not.toMatch(/#F5B21B|#8A5A00/i);
    expect(declaratii(stiluri, '.traseu--unic')).toMatch(/--culoare:\s*var\(--ink\)/);
    expect(declaratii(stiluri, '.traseu--abonament')).toMatch(/--culoare:\s*var\(--ink\)/);
    // Bucla e chenarul liniei: același chenar, dar punctat.
    expect(declaratii(stiluri, '.bucla')).toMatch(/border-style:\s*dashed/);
  });

  test('CSS: capătul remedierii unice e o stație plină, a abonamentului rămâne goală', () => {
    const stiluri = css('RouteMap');
    const plina = declaratii(stiluri, '.traseu--unic .pasi > .pas:last-child::before');
    expect(plina).toMatch(/background:\s*var\(--ink\)/);
    expect(stiluri).not.toMatch(/\.traseu--abonament[^{]*::before\s*\{[^}]*background:\s*var\(--ink\)/);
  });

  test('CSS: colțuri rotunjite doar la stații (§5.8)', () => {
    const rotunjiri = [...css('RouteMap').matchAll(/border-radius:\s*([^;}]+)/g)].map((m) => m[1]!.trim());
    expect(rotunjiri.length).toBeGreaterThan(0);
    expect(rotunjiri.every((v) => v === '50%' || v === '0')).toBe(true);
  });
});

// ——— Faq ———

const intrebari = [
  { intrebare: 'Afișezi prețuri?', raspuns: 'Nu.' },
  { intrebare: 'Ce se întâmplă după ce trimit cererea?', raspuns: 'Îți răspund pe e-mail.' },
];

describe('Faq', () => {
  test('e vizibil, fără acordeon', async () =>
    expect(await render(Faq, { intrebari: [{ intrebare: 'Afișezi prețuri?', raspuns: 'Nu.' }] })).not.toContain('<details'));

  test('întrebările și răspunsurile sunt perechi vizibile, în ordinea primită', async () => {
    const h = await render(Faq, { intrebari });
    const termeni = [...h.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>/g)].map((m) => textOf(m[1]!));
    const definitii = [...h.matchAll(/<dd\b[^>]*>([\s\S]*?)<\/dd>/g)].map((m) => textOf(m[1]!));
    expect(termeni).toEqual(intrebari.map((i) => i.intrebare));
    expect(definitii).toEqual(intrebari.map((i) => i.raspuns));
  });

  test('nu adaugă JSON-LD și nu ascunde nimic: nodul FAQPage îl pune pagina', async () => {
    const h = await render(Faq, { intrebari });
    expect(h).not.toContain('application/ld+json');
    expect(h).not.toContain('<script');
    expect(h).not.toMatch(/\bhidden\b|aria-hidden|display:\s*none/);
    expect(h).not.toMatch(/\sstyle=/);
  });

  test('textul cu caractere speciale se scrie ca text, nu ca HTML', async () => {
    const h = await render(Faq, { intrebari: [{ intrebare: 'A < B & C?', raspuns: '<b>Da</b>' }] });
    expect(h).not.toContain('<b>');
    expect(textOf(h)).toBe('A < B & C? <b>Da</b>');
  });

  test('fără întrebări nu scrie nimic (nici listă goală)', async () => expect((await render(Faq, { intrebari: [] })).trim()).toBe(''));

  test('un răspuns cu marcaj nu apare ca text brut: în producție perechea dispare, în previzualizare e marcajul', async () => {
    const amestec = [...intrebari, { intrebare: 'Lucrezi și cu firme din afara Bucureștiului?', raspuns: '[DE COMPLETAT:#13]' }];
    const productie = await render(Faq, { intrebari: amestec });
    expect(productie).not.toContain('DE COMPLETAT');
    expect(textOf(productie)).not.toContain('Lucrezi și cu firme din afara');
    expect(productie.match(/<dt\b/g)).toHaveLength(2);

    stare.draft = true;
    const previzualizare = await render(Faq, { intrebari: amestec });
    expect(previzualizare.match(/<dt\b/g)).toHaveLength(3);
    expect(previzualizare).toContain('class="marcaj"');
    expect(previzualizare).toContain('[DE COMPLETAT:#13]');
  });

  test('numai răspunsuri cu marcaj, în producție: nu rămâne nimic', async () =>
    expect((await render(Faq, { intrebari: [{ intrebare: 'Afișezi prețuri?', raspuns: '[DE COMPLETAT:#13]' }] })).trim()).toBe(''));
});
