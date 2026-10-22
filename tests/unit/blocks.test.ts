import { readFileSync } from 'node:fs';
import Faq from '../../src/components/Faq.astro';
import LineDiagram from '../../src/components/LineDiagram.astro';
import RouteMap from '../../src/components/RouteMap.astro';
import { render, textOf } from './helpers';

// „De unde pornești?”, cele două trasee și întrebările frecvente (§4.3 punctele 3, 4 și 6, §5.2, §5.8, §9.2).
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

/** Valorile `href` din HTML, în ordinea în care apar. */
const hrefuri = (html: string): string[] => [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1] ?? '');

// ——— LineDiagram ———

const randuriExemplu = [
  { slug: 'seo', nume: 'SEO', grup: 'vizibilitate', problema: 'Clienții nu te găsesc în Google când caută ce vinzi.' },
  { slug: 'optimizare-aeo-geo', nume: 'Optimizare AEO și GEO', grup: 'vizibilitate', problema: 'Firma ta nu apare când cineva întreabă ChatGPT despre domeniul tău.' },
  { slug: 'audit-seo', nume: 'Audit SEO', grup: 'diagnostic', problema: 'Vizitele din Google au scăzut și nu știi de ce.' },
  { slug: 'creare-site', nume: 'Creare site', grup: 'constructie', problema: 'Nu ai încă un site sau ai doar o pagină de Facebook.' },
  { slug: 'redesign-site', nume: 'Redesign site', grup: 'reparatie', problema: 'Site-ul arată învechit și nu mai seamănă cu firma de acum.' },
  { slug: 'mentenanta-site', nume: 'Mentenanță site', grup: 'reparatie', problema: 'Site-ul n-a mai fost actualizat de mult și se încarcă greu pe telefon.' },
];
const r = randuriExemplu[0]!;

describe('LineDiagram', () => {
  test('e o listă neordonată, în ordinea primită', async () => {
    const h = await render(LineDiagram, { randuri: randuriExemplu });
    expect(h).toMatch(/^<ul|<ul /);
    expect(h).not.toContain('<ol');
    expect([...h.matchAll(/href="(\/servicii\/[^"]+)"/g)].map((m) => m[1])).toEqual(randuriExemplu.map((x) => `/servicii/${x.slug}/`));
  });

  test('nu sortează: ordinea primită rămâne, chiar dacă nu e cea a serviciilor', async () => {
    const inversat = [...randuriExemplu].reverse();
    const h = await render(LineDiagram, { randuri: inversat });
    expect(hrefuri(h)).toEqual(inversat.map((x) => `/servicii/${x.slug}/`));
  });

  test('fiecare rând e un <li class="linie-rand"> cu grupul lui și cu un singur link, capătul de linie (R11)', async () => {
    const h = await render(LineDiagram, { randuri: randuriExemplu });
    const randuri = [...h.matchAll(/<li\b[^>]*class="linie-rand"[^>]*>([\s\S]*?)<\/li>/g)];
    expect(randuri).toHaveLength(randuriExemplu.length);
    randuri.forEach((rand, i) => {
      expect(rand[0]).toContain(`data-grup="${randuriExemplu[i]!.grup}"`);
      expect(rand[1]!.match(/<a\b/g)).toHaveLength(1);
    });
  });

  test('segmentul galben are grupul constructie', async () =>
    expect(await render(LineDiagram, { randuri: [{ ...r, grup: 'constructie' }] })).toContain('data-grup="constructie"'));

  test('stația-problemă și capătul de linie: textul problemei, apoi numele serviciului ca text de link', async () => {
    const h = await render(LineDiagram, { randuri: randuriExemplu });
    const text = textOf(h);
    for (const x of randuriExemplu) expect(text).toContain(x.problema);
    expect([...h.matchAll(/<a\b[^>]*>([^<]*)<\/a>/g)].map((m) => m[1]!.trim())).toEqual(randuriExemplu.map((x) => x.nume));
    // Problema vine înaintea linkului în fiecare rând, ca să se citească „problemă → serviciu”.
    for (const x of randuriExemplu) expect(text.indexOf(x.problema)).toBeLessThan(text.indexOf(x.nume, text.indexOf(x.problema)));
  });

  test('segmentul fiecărui rând poartă clasa vt-<slug> (R5) și e desenat, nu citit', async () => {
    const h = await render(LineDiagram, { randuri: randuriExemplu });
    for (const x of randuriExemplu) {
      expect(h).toMatch(new RegExp(`<span\\b[^>]*class="[^"]*\\bvt-${x.slug}\\b[^"]*"[^>]*aria-hidden="true"`));
    }
    // Clasele vt-<slug> sunt unice: o tranziție cere un nume unic pe pagină.
    const clase = [...h.matchAll(/\bvt-[a-z0-9-]+/g)].map((m) => m[0]);
    expect(new Set(clase).size).toBe(clase.length);
  });

  test('fără atribute style (CSP) și fără script', async () => {
    const h = await render(LineDiagram, { randuri: randuriExemplu });
    expect(h).not.toMatch(/\sstyle=/);
    expect(h).not.toContain('<script');
  });

  test('CSS: segmentul ia culoarea grupului, iar construcția folosește galbenul închis (§5.2)', () => {
    const stiluri = css('LineDiagram');
    expect(declaratii(stiluri, ".linie-rand[data-grup='vizibilitate']")).toMatch(/--culoare:\s*var\(--blue\)/);
    expect(declaratii(stiluri, ".linie-rand[data-grup='diagnostic']")).toMatch(/--culoare:\s*var\(--green\)/);
    expect(declaratii(stiluri, ".linie-rand[data-grup='constructie']")).toMatch(/--culoare:\s*var\(--yellow-dark\)/);
    expect(declaratii(stiluri, ".linie-rand[data-grup='reparatie']")).toMatch(/--culoare:\s*var\(--red\)/);
    // Galbenul tare nu apare nicăieri în grafica cu sens (1,86:1 pe alb).
    expect(stiluri).not.toMatch(/var\(--yellow\)/);
    expect(stiluri).not.toMatch(/#F5B21B/i);
  });

  test('CSS: zona de atingere de 44px pe link, fără chenar, iar rotunjirea doar la stații', () => {
    const stiluri = css('LineDiagram');
    const capat = declaratii(stiluri, '.linie-rand__capat') ?? '';
    expect(capat).toMatch(/min-height:\s*44px/);
    expect(capat).toMatch(/min-width:\s*44px/);
    expect(capat).not.toMatch(/border(?!-radius)/);
    const rotunjiri = [...stiluri.matchAll(/border-radius:\s*([^;}]+)/g)].map((m) => m[1]!.trim());
    expect(rotunjiri.every((v) => v === '50%' || v === '0')).toBe(true);
  });

  test('o problemă cu marcaj nu apare ca text brut: în producție dispare, în previzualizare e marcajul', async () => {
    const cuMarcaj = [{ ...r, problema: '[DE COMPLETAT:#4]' }];
    expect(await render(LineDiagram, { randuri: cuMarcaj })).not.toContain('DE COMPLETAT');
    stare.draft = true;
    const h = await render(LineDiagram, { randuri: cuMarcaj });
    expect(h).toContain('class="marcaj"');
    expect(h).toContain('[DE COMPLETAT:#4]');
    expect(h).toContain('href="/servicii/seo/"');
  });
});

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

  test('CSS: remedierea unică în galbenul închis, abonamentul în albastru (§5.2)', () => {
    const stiluri = css('RouteMap');
    expect(declaratii(stiluri, '.traseu--unic')).toMatch(/--culoare:\s*var\(--yellow-dark\)/);
    expect(declaratii(stiluri, '.traseu--abonament')).toMatch(/--culoare:\s*var\(--blue\)/);
    expect(stiluri).not.toMatch(/var\(--yellow\)/);
    expect(stiluri).not.toMatch(/#F5B21B/i);
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
