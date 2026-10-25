import { readFileSync } from 'node:fs';
import AlegatorTraseu from '../../src/components/AlegatorTraseu.astro';
import { SERVICII } from '../../src/form-rules';
import { LINIA_GRUPULUI } from '../../src/lib/harta';
import { divComplet, render, textOf } from './helpers';

// Alegătorul „De unde pornești?” din hero (spec metroul îmbunătățit, §3): un formular GET spre /contact/, cu șase butoane
// radio și câte un panou „Traseul tău” pe serviciu. Aici se verifică doar markupul și stilul de bază (fără `:has()`);
// regulile care luminează linia aleasă și arată panoul (`:has()` sub `@supports`, spec §3) se verifică în tests/e2e/home.spec.ts.

/** Etichetele din tabelul de texte al spec-ului (§8), exact, în ordinea serviciilor. */
const ETICHETE_SPEC: Readonly<Record<string, string>> = {
  seo: 'Nu mă găsesc clienții în Google',
  'optimizare-aeo-geo': 'Nu apar când întreabă cineva ChatGPT',
  'audit-seo': 'Au scăzut vizitele și nu știu de ce',
  'creare-site': 'N-am încă un site',
  'redesign-site': 'Site-ul arată învechit',
  'mentenanta-site': 'Site-ul e lent și neactualizat',
};

const serviciiInOrdine = [...SERVICII].sort((a, b) => a.ordine - b.ordine);

/** Pașii de probă ai unui serviciu: trei fraze distincte, ca să se vadă că panoul îi are pe ai lui. */
const pasiDe = (nume: string) => [`Primul pas la ${nume}`, `Al doilea pas la ${nume}`, `Al treilea pas la ${nume}`];

const randuri = serviciiInOrdine.map((s) => ({
  slug: s.slug,
  nume: s.nume,
  grup: s.grup,
  eticheta: ETICHETE_SPEC[s.slug] ?? '',
  pasi: pasiDe(s.nume),
}));

/** Valoarea unui atribut dintr-o etichetă de deschidere, sau `undefined`. */
const atribut = (eticheta: string, nume: string) => new RegExp(`\\s${nume}="([^"]*)"`).exec(eticheta)?.[1];

/** Panourile „Traseul tău”: fiecare `div.alegator__panou`, cu tot conținutul lui. */
const panouri = (html: string): string[] =>
  [...html.matchAll(/<div\b[^>]*\sclass="(?:[^"]* )?alegator__panou(?: [^"]*)?"[^>]*>/g)].map((m) => divComplet(html, m.index ?? 0));

const radiouri = (html: string): string[] => [...html.matchAll(/<input\b[^>]*>/g)].map((m) => m[0]).filter((i) => atribut(i, 'type') === 'radio');

/** Regulile CSS din blocul `<style>` al componentei (globale, `<style is:global>`, pentru bugetul de CSS: §9.1 „Bugete” din spec-ul principal), fără comentarii. */
function css(): string {
  const sursa = readFileSync(new URL('../../src/components/AlegatorTraseu.astro', import.meta.url), 'utf8');
  const bloc = /<style(?:\s+is:global)?>([\s\S]*?)<\/style>/.exec(sursa)?.[1];
  if (bloc === undefined) throw new Error('AlegatorTraseu.astro nu are bloc <style>');
  return bloc.replace(/\/\*[\s\S]*?\*\//g, '');
}

const scapa = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Declarațiile primei reguli cu exact acest selector, sau `undefined`. */
const declaratii = (stiluri: string, selector: string) => new RegExp(`(?:^|[{}])\\s*${scapa(selector)}\\s*\\{([^}]*)\\}`).exec(stiluri)?.[1];

describe('AlegatorTraseu: butoanele radio', () => {
  test('șase radio-uri, cu valorile și ordinea din SERVICII', async () => {
    const h = await render(AlegatorTraseu, { randuri });
    const r = radiouri(h);
    expect(r).toHaveLength(6);
    expect(r.map((i) => atribut(i, 'value'))).toEqual(serviciiInOrdine.map((s) => s.slug));
    for (const i of r) expect(atribut(i, 'name')).toBe('serviciu');
  });

  test('nu sortează: ordinea primită rămâne', async () => {
    const inversat = [...randuri].reverse();
    const r = radiouri(await render(AlegatorTraseu, { randuri: inversat }));
    expect(r.map((i) => atribut(i, 'value'))).toEqual(inversat.map((x) => x.slug));
  });

  test('fiecare radio are data-linie din LINIA_GRUPULUI', async () => {
    const r = radiouri(await render(AlegatorTraseu, { randuri }));
    serviciiInOrdine.forEach((s, i) => expect(atribut(r[i] ?? '', 'data-linie')).toBe(LINIA_GRUPULUI[s.grup]));
    // Cele patru linii apar toate: M1 construcție, M2 vizibilitate, M3 reparație, M4 diagnostic.
    expect(new Set(r.map((i) => atribut(i, 'data-linie')))).toEqual(new Set(['M1', 'M2', 'M3', 'M4']));
  });

  test('etichetele sunt cele din spec', async () => {
    const h = await render(AlegatorTraseu, { randuri });
    const etichete = [...h.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)];
    expect(etichete).toHaveLength(6);
    etichete.forEach((e, i) => {
      expect(textOf(e[1] ?? '')).toBe(ETICHETE_SPEC[serviciiInOrdine[i]?.slug ?? '']);
      // Radio-ul stă în eticheta lui: nume accesibil din text, fără `for`/`id`.
      expect(radiouri(e[1] ?? '')).toHaveLength(1);
    });
  });

  test('cuvintele cu cratimă din etichete stau întregi pe un rând (FaraRupere)', async () => {
    const h = await render(AlegatorTraseu, { randuri });
    expect(h).toContain('<span class="fara-rupere">N-am</span>');
    expect(h).toContain('<span class="fara-rupere">Site-ul</span>');
  });
});

describe('AlegatorTraseu: formularul', () => {
  test('formularul trimite GET la /contact/', async () => {
    const h = await render(AlegatorTraseu, { randuri });
    const formulare = [...h.matchAll(/<form\b[^>]*>/g)].map((m) => m[0]);
    expect(formulare).toHaveLength(1);
    const f = formulare[0] ?? '';
    expect(atribut(f, 'method')).toBe('get');
    expect(atribut(f, 'action')).toBe('/contact/');
    expect(f).toContain('data-alegator');
    expect(atribut(f, 'class')).toMatch(/(?:^|\s)alegator(?:\s|$)/);
  });

  test('legenda conține H2-ul De unde pornești?', async () => {
    const h = await render(AlegatorTraseu, { randuri });
    const set = /<fieldset\b[^>]*>([\s\S]*?)<\/fieldset>/.exec(h)?.[1] ?? '';
    const legenda = /<legend\b[^>]*>([\s\S]*?)<\/legend>/.exec(set)?.[1] ?? '';
    expect(legenda).toMatch(/<h2\b[^>]*\sid="de-unde-pornesti"[^>]*>De unde pornești\?<\/h2>/);
    expect(textOf(legenda)).toBe('De unde pornești?');
    // Legenda e primul lucru din fieldset; cele șase radio-uri sunt în el.
    expect(set.trimStart().startsWith('<legend')).toBe(true);
    expect(radiouri(set)).toHaveLength(6);
  });

  test('butonul general există (pentru browserele fără :has())', async () => {
    const h = await render(AlegatorTraseu, { randuri });
    const butoane = [...h.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
    const general = butoane.filter((b) => /(?:^|\s)alegator__trimite-general(?:\s|$)/.test(atribut(b[1] ?? '', 'class') ?? ''));
    expect(general).toHaveLength(1);
    expect(atribut(general[0]?.[1] ?? '', 'type')).toBe('submit');
    expect(textOf(general[0]?.[2] ?? '')).toBe('Cere o ofertă');
    // Stă sub fieldset, în afara panourilor.
    const dupaSet = h.slice(h.indexOf('</fieldset>'));
    expect(dupaSet).toContain('alegator__trimite-general');
    expect(h.indexOf('alegator__trimite-general')).toBeLessThan(h.indexOf('alegator__panou'));
  });

  test('panourile vin după fieldset, în formular', async () => {
    const h = await render(AlegatorTraseu, { randuri });
    const set = /<fieldset\b[^>]*>[\s\S]*?<\/fieldset>/.exec(h)?.[0] ?? '';
    expect(set).not.toContain('alegator__panou');
    expect(h.indexOf('</fieldset>')).toBeLessThan(h.indexOf('alegator__panou'));
    expect(h.indexOf('alegator__panou')).toBeLessThan(h.indexOf('</form>'));
  });
});

describe('AlegatorTraseu: panourile „Traseul tău”', () => {
  test('un panou pe serviciu, cu pașii din colecție, butonul și linkul spre pagina serviciului', async () => {
    const h = await render(AlegatorTraseu, { randuri });
    const p = panouri(h);
    expect(p).toHaveLength(6);
    p.forEach((panou, i) => {
      const s = serviciiInOrdine[i]!;
      const eticheta = /<div\b[^>]*>/.exec(panou)?.[0] ?? '';
      expect(atribut(eticheta, 'data-serviciu')).toBe(s.slug);
      // `data-grup` dă `--culoare` liniei din panou (tokens.css).
      expect(atribut(eticheta, 'data-grup')).toBe(s.grup);
      // Titlul panoului numește serviciul (alegerea nu stă doar în culoare).
      expect(panou.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)).toHaveLength(1);
      expect(textOf(/<h3\b[^>]*>([\s\S]*?)<\/h3>/.exec(panou)?.[1] ?? '')).toBe(`Traseul tău: ${s.nume}`);
      // Pașii, ca lista ordonată a PasiTraseu, în ordinea din colecție și pe orizontală (container de 48rem).
      expect(panou).toContain('pasi-traseu--orizontal');
      const pasi = [...(/<ol\b[^>]*>([\s\S]*?)<\/ol>/.exec(panou)?.[1] ?? '').matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => textOf(m[1] ?? ''));
      expect(pasi).toEqual(pasiDe(s.nume));
      // Butonul trimite formularul (`/contact/?serviciu=<slug>`, din radio-ul ales).
      const buton = /<button\b([^>]*)>([\s\S]*?)<\/button>/.exec(panou);
      expect(atribut(buton?.[1] ?? '', 'type')).toBe('submit');
      expect(textOf(buton?.[2] ?? '')).toBe(`Cere oferta pentru ${s.nume}`);
      // Linkul spre pagina serviciului; săgeata e decor.
      const link = /<a\b([^>]*)>([\s\S]*?)<\/a>/.exec(panou);
      expect(atribut(link?.[1] ?? '', 'href')).toBe(`/servicii/${s.slug}/`);
      // Numele linkului e textul, fără săgeată; săgeata e un `span` ascuns din arborele de accesibilitate, după text.
      expect(textOf((link?.[2] ?? '').replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/, ''))).toBe(`Vezi pagina ${s.nume}`);
      expect(link?.[2]).toMatch(/<span\b[^>]*aria-hidden="true"[^>]*>\s*→\s*<\/span>\s*$/);
      expect(panou.match(/<a\b/g)).toHaveLength(1);
    });
  });

  test('linia din panou poartă clasa vt-<slug> (M3), unică pe pagină', async () => {
    const h = await render(AlegatorTraseu, { randuri });
    panouri(h).forEach((panou, i) => {
      const slug = serviciiInOrdine[i]!.slug;
      // Elementul cu `vt-<slug>` învelește lista de pași.
      const invelis = new RegExp(`<div\\b[^>]*\\sclass="(?:[^"]* )?vt-${scapa(slug)}(?: [^"]*)?"[^>]*>`).exec(panou);
      expect(invelis, `panoul ${slug}`).not.toBeNull();
      expect(divComplet(panou, invelis?.index ?? 0)).toContain('<ol');
    });
    // O tranziție cere un nume unic pe pagină: câte o clasă vt-<slug> pe serviciu.
    const clase = [...h.matchAll(/\bvt-[a-z0-9-]+/g)].map((m) => m[0]);
    expect(clase.sort()).toEqual(serviciiInOrdine.map((s) => `vt-${s.slug}`).sort());
  });

  test('fără atribute style (CSP) și fără script', async () => {
    const h = await render(AlegatorTraseu, { randuri });
    expect(h).not.toMatch(/\sstyle=/);
    expect(h).not.toContain('<script');
    expect(h).not.toMatch(/\son[a-z]+=/);
  });
});

describe('AlegatorTraseu: stilul de bază (fără :has())', () => {
  test('panourile sunt ascunse implicit, cu display: none', () => {
    expect(declaratii(css(), '.alegator__panou')).toMatch(/display:\s*none/);
  });

  test('eticheta fiecărei opțiuni e o țintă de cel puțin 44px', () => {
    const optiune = declaratii(css(), '.alegator__optiune') ?? '';
    expect(optiune).toMatch(/min-height:\s*44px/);
  });

  test('butonul general se vede implicit (nu e ascuns din stilul de bază)', () => {
    expect(declaratii(css(), '.alegator__trimite-general') ?? '').not.toMatch(/display:\s*none/);
  });

  test('focusul de la tastatură se vede pe fundalul întunecat: contur în culoarea textului de noapte', () => {
    const focus = declaratii(css(), '.alegator__radio:focus-visible') ?? '';
    expect(focus).toMatch(/outline:\s*2px solid var\(--noapte-text\)/);
  });

  test('colțuri drepte, în afară de bulină (stația)', () => {
    const rotunjiri = [...css().matchAll(/border-radius:\s*([^;}]+)/g)].map((m) => m[1]?.trim());
    expect(rotunjiri.every((v) => v === '50%' || v === '0')).toBe(true);
  });
});
