import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gasesteMarcaje } from '../../scripts/check-dist-markers.mjs';
import { evalueaza, mediana } from '../../scripts/qa-lighthouse.mjs';
import { comandaServer, fisierPagina, normalizeazaCale, slugCale } from '../../scripts/qa-page.mjs';
import { esteNoindex, scripturiPermise } from '../../scripts/schema-expectations.mjs';

const SCRIPTURI = fileURLToPath(new URL('../../scripts/', import.meta.url));

describe('schema-expectations', () => {
  // Atributele `class` sunt cele pe care le scriu MetroMap.astro (harta), PageFacts.astro (fișa) și pagina Contact (cardul și
  // formularul); rândul „fără hartă” e o pagină legală.
  const ACASA = '<div class="harta harta--noapte harta--animata harta--pe-acasa" data-astro-cid-x>';
  const BANDA = '<div class="harta harta--noapte harta--animata harta--banda harta--cu-linie" data-astro-cid-x>';
  const STATICA = '<div class="harta harta--noapte harta--statica" data-astro-cid-x>';
  const FISA = '<dl class="fisa" data-astro-cid-y><div class="fisa__rand"></div></dl>';
  const FORMULAR =
    '<section class="carte carte--formular" data-astro-cid-z><form class="formular" method="post" action="/api/contact" data-astro-cid-w><div class="formular__camp"></div></form></section>';

  test('scripturiPermise: 1 pe orice pagină cu hartă animată, +1 cu fișa, +1 cu formularul, 0 fără hartă (§9.1, deciziile 28 și 30)', () => {
    expect(scripturiPermise(`<main>${ACASA}</main>`)).toBe(1);
    expect(scripturiPermise(`<main>${BANDA}</main>`)).toBe(1);
    expect(scripturiPermise(`<main>${BANDA}${FISA}</main>`)).toBe(2);
    expect(scripturiPermise(`<main>${BANDA}${FORMULAR}</main>`)).toBe(2);
    expect(scripturiPermise('<main><h1>Politica de cookie-uri</h1></main>')).toBe(0);
    expect(scripturiPermise(`<main>${STATICA}</main>`)).toBe(0);
  });

  test('scripturiPermise: contează atributul `class`, nu aceleași nume din CSS-ul inline sau din clase asemănătoare', () => {
    const doarCss = '<style>.harta--animata[data-astro-cid-x]{display:block}.fisa[data-astro-cid-y]{margin:0}.formular[data-astro-cid-w]{gap:1rem}</style><main></main>';
    expect(scripturiPermise(doarCss)).toBe(0);
    expect(scripturiPermise('<div class="fisa__rand fisa__valoare"></div>')).toBe(0);
    expect(scripturiPermise('<div class="x harta--animata-veche"></div>')).toBe(0);
    expect(scripturiPermise('<section class="carte carte--formular"><div class="formular__camp formular__trimite"></div></section>')).toBe(0);
  });

  test('esteNoindex: paginile noindex din §6.1 și cele interne, nimic altceva', () => {
    for (const cale of ['/contact/multumim/', '/contact/eroare/', '/contact/prea-multe-linkuri/', '/404/', '/_test/diacritice/']) {
      expect(esteNoindex(cale), cale).toBe(true);
    }
    for (const cale of ['/', '/contact/', '/servicii/seo/', '/despre/', '/proiecte/acest-site/']) {
      expect(esteNoindex(cale), cale).toBe(false);
    }
  });
});

describe('qa-page: calea paginii', () => {
  test('slugCale: numele fișierelor din reports/', () => {
    expect(slugCale('/')).toBe('index');
    expect(slugCale('/servicii/seo/')).toBe('servicii-seo');
    expect(slugCale('/_test/diacritice/')).toBe('_test-diacritice');
    expect(slugCale('/404/')).toBe('404');
  });

  test('normalizeazaCale: primește doar rute cu slash la început și la sfârșit', () => {
    expect(normalizeazaCale('/servicii/seo/')).toBe('/servicii/seo/');
    expect(normalizeazaCale('/')).toBe('/');
    expect(() => normalizeazaCale('servicii/')).toThrow(/trebuie să înceapă cu \//);
    expect(() => normalizeazaCale('/servicii')).toThrow(/trebuie să se termine cu \//);
    expect(() => normalizeazaCale('/a b/')).toThrow(/caractere nepermise/);
    expect(() => normalizeazaCale('/a/?x=1')).toThrow(/caractere nepermise/);
    expect(() => normalizeazaCale(undefined)).toThrow(/Folosire/);
  });

  test('normalizeazaCale: Git Bash schimbă „/” în „C:/Program Files/Git/”; calea se recunoaște și se repară', () => {
    const env = { EXEPATH: 'C:\\Program Files\\Git\\bin', MSYSTEM: 'UCRT64' };
    expect(normalizeazaCale('C:/Program Files/Git/', env)).toBe('/');
    expect(normalizeazaCale('C:/Program Files/Git/servicii/seo/', env)).toBe('/servicii/seo/');
    expect(() => normalizeazaCale('C:/Altceva/servicii/', env)).toThrow(/MSYS_NO_PATHCONV/);
  });

  test('fisierPagina: fișierul HTML al rutei în directorul de build', () => {
    expect(fisierPagina('dist', '/')).toEqual(['dist/index.html']);
    expect(fisierPagina('dist', '/servicii/seo/')).toEqual(['dist/servicii/seo/index.html']);
    expect(fisierPagina('dist-draft', '/404/')).toEqual(['dist-draft/404/index.html', 'dist-draft/404.html']);
  });
});

describe('qa-page: serverul', () => {
  test('astro preview până apare wrangler.jsonc (Task 13), apoi wrangler dev', () => {
    expect(comandaServer({ wrangler: false, draft: false })).toBe('npx astro preview --port 8787');
    expect(comandaServer({ wrangler: true, draft: false })).toBe('npx wrangler dev --port 8787');
  });

  test('previzualizarea (QA_DIST=dist-draft) se servește mereu cu astro preview și DRAFT=1', () => {
    expect(comandaServer({ wrangler: false, draft: true })).toBe('npx cross-env DRAFT=1 astro preview --port 8787');
    expect(comandaServer({ wrangler: true, draft: true })).toBe('npx cross-env DRAFT=1 astro preview --port 8787');
  });
});

/** Un LHR cât să încapă în `evalueaza`: scorurile categoriilor (0–1) și auditurile SEO cu greutate. */
function lhr(scoruri: Record<string, number | null>, audituriSeo: Record<string, number | null> = {}, extra: object = {}) {
  const audits: Record<string, { score: number | null; scoreDisplayMode: string; title: string; numericValue?: number }> = {};
  const categories: Record<string, { score: number | null; auditRefs: { id: string; weight: number }[] }> = {};
  for (const [id, score] of Object.entries(audituriSeo)) {
    audits[id] = { score, scoreDisplayMode: score === null ? 'notApplicable' : 'binary', title: `Titlu ${id}` };
  }
  for (const [id, score] of Object.entries(scoruri)) categories[id] = { score, auditRefs: [] };
  categories.seo = { score: scoruri.seo ?? null, auditRefs: Object.keys(audituriSeo).map((id) => ({ id, weight: 1 })) };
  return { categories, audits, ...extra };
}

/** Aceeași rulare, cu auditurile (id → scor) puse și în categoria dată. */
function cuAudituri(baza: ReturnType<typeof lhr>, categorie: string, audituri: Record<string, number | null>) {
  const copie = structuredClone(baza);
  copie.categories[categorie]!.auditRefs = Object.keys(audituri).map((id) => ({ id, weight: 1 }));
  for (const [id, score] of Object.entries(audituri)) {
    copie.audits[id] = { score, scoreDisplayMode: score === null ? 'notApplicable' : 'binary', title: `Titlu ${id}` };
  }
  return copie;
}

const bune = { performance: 0.97, accessibility: 1, 'best-practices': 1, seo: 1 };

describe('qa-lighthouse', () => {
  test('mediana din 3 valori e cea din mijloc; din numere pare, media celor două din mijloc', () => {
    expect(mediana([0.9, 0.5, 0.7])).toBe(0.7);
    expect(mediana([3, 1, 2, 4])).toBe(2.5);
  });

  test('trece: mediana fiecărei categorii e cel puțin 90, afișată ca în Lighthouse (rotunjită)', () => {
    const r = evalueaza([lhr(bune), lhr(bune), lhr({ ...bune, performance: 0.895 })]);
    expect(r.trece).toBe(true);
    expect(r.scoruri).toEqual({ performance: 97, accessibility: 100, 'best-practices': 100, seo: 100 });
    expect(r.runde).toHaveLength(3);
    expect(r.runde[2]!.performance).toBe(90);
    expect(r.motive).toEqual([]);
  });

  test('o singură rulare proastă din 3 nu strică mediana', () => {
    const r = evalueaza([lhr(bune), lhr({ ...bune, performance: 0.4 }), lhr(bune)]);
    expect(r.trece).toBe(true);
    expect(r.scoruri.performance).toBe(97);
  });

  test('pică: mediana sub 90 la oricare dintre cele 4 categorii, cu motivul numit', () => {
    for (const categorie of ['performance', 'accessibility', 'best-practices', 'seo']) {
      const slab = lhr({ ...bune, [categorie]: 0.89 });
      const r = evalueaza([slab, slab, lhr(bune)]);
      expect(r.trece, categorie).toBe(false);
      expect(r.motive.join('\n'), categorie).toContain(`${categorie}: 89 sub pragul de 90`);
    }
  });

  test('un scor sub prag numește auditurile picate (în majoritatea rulărilor), iar raportul le ține pentru fiecare categorie', () => {
    const slab = cuAudituri(lhr({ ...bune, 'best-practices': 0.83 }), 'best-practices', { 'errors-in-console': 0, 'is-on-https': 1, charset: null });
    const r = evalueaza([slab, slab, lhr(bune)]);
    expect(r.trece).toBe(false);
    expect(r.motive.join(' | ')).toContain('best-practices: 83 sub pragul de 90');
    expect(r.motive.join(' | ')).toContain('audituri picate: errors-in-console (Titlu errors-in-console)');
    expect(r.auditeEsuate['best-practices']).toEqual(['errors-in-console']);
  });

  test('auditurile picate se țin în raport și când pagina trece (best-practices 96 are ce îmbunătăți)', () => {
    const aproape = cuAudituri(lhr({ ...bune, 'best-practices': 0.96 }), 'best-practices', { 'inspector-issues': 0 });
    const r = evalueaza([aproape, aproape, aproape]);
    expect(r.trece).toBe(true);
    expect(r.auditeEsuate['best-practices']).toEqual(['inspector-issues']);
  });

  test('pică: o categorie fără scor (null) nu trece în tăcere', () => {
    const r = evalueaza([lhr({ ...bune, accessibility: null }), lhr(bune), lhr(bune)]);
    expect(r.trece).toBe(false);
    expect(r.motive.join('\n')).toContain('accessibility: fără scor');
  });

  test('„Agentic Browsing” se raportează separat și nu poate pica pagina', () => {
    const cuAgentic = (scor: number) => lhr({ ...bune, 'agentic-browsing': scor });
    const r = evalueaza([cuAgentic(0.2), cuAgentic(0.5), cuAgentic(0.3)]);
    expect(r.trece).toBe(true);
    expect(r.agentic).toEqual({ runde: [20, 50, 30], mediana: 30 });
    expect(evalueaza([lhr(bune), lhr(bune), lhr(bune)]).agentic).toBeNull();
  });

  describe('paginile noindex', () => {
    const noindex = { noindex: true };
    const seoSlab = { seo: 0.82 };

    test('SEO nu mai cere 90 pe categorie, ci scorul 1 pe fiecare audit cu greutate', () => {
      const audituri = { 'is-crawlable': 0, 'meta-description': 1, 'document-title': 1, hreflang: null };
      const r = evalueaza([lhr({ ...bune, ...seoSlab }, audituri), lhr({ ...bune, ...seoSlab }, audituri), lhr({ ...bune, ...seoSlab }, audituri)], noindex);
      expect(r.trece).toBe(true);
      expect(r.scoruri.seo).toBe(82);
    });

    test('un alt audit SEO picat (în cel puțin 2 din 3 rulări) pică pagina', () => {
      const bun = { 'is-crawlable': 0, 'meta-description': 1 };
      const stricat = { 'is-crawlable': 0, 'meta-description': 0 };
      const r = evalueaza([lhr(bune, stricat), lhr(bune, stricat), lhr(bune, bun)], noindex);
      expect(r.trece).toBe(false);
      expect(r.motive.join('\n')).toContain('seo: auditul „meta-description” (Titlu meta-description) are scorul 0');
      expect(r.auditeSeoEsuate).toEqual(['meta-description']);
    });

    test('un audit picat într-o singură rulare din 3 nu pică pagina', () => {
      const bun = { 'is-crawlable': 0, 'meta-description': 1 };
      const stricat = { 'is-crawlable': 0, 'meta-description': 0 };
      expect(evalueaza([lhr(bune, stricat), lhr(bune, bun), lhr(bune, bun)], noindex).trece).toBe(true);
    });

    test('http-status-code e scutit doar pe 404', () => {
      const audituri = { 'is-crawlable': 0, 'http-status-code': 0 };
      const rulari = [lhr(bune, audituri), lhr(bune, audituri), lhr(bune, audituri)];
      expect(evalueaza(rulari, { noindex: true, este404: true }).trece).toBe(true);
      const altfel = evalueaza(rulari, noindex);
      expect(altfel.trece).toBe(false);
      expect(altfel.auditeSeoEsuate).toEqual(['http-status-code']);
    });

    test('Performanța, Accesibilitatea și Bunele practici rămân la 90 și pe paginile noindex', () => {
      const r = evalueaza([lhr({ ...bune, performance: 0.7 }), lhr({ ...bune, performance: 0.7 }), lhr(bune)], noindex);
      expect(r.trece).toBe(false);
      expect(r.motive.join('\n')).toContain('performance: 70 sub pragul de 90');
    });

    test('un audit cu eroare (scoreDisplayMode „error”) nu trece drept „neaplicabil”', () => {
      const cuEroare = lhr(bune, { 'is-crawlable': 0, canonical: null });
      cuEroare.audits.canonical!.scoreDisplayMode = 'error';
      const r = evalueaza([cuEroare, cuEroare, cuEroare], noindex);
      expect(r.trece).toBe(false);
      expect(r.auditeSeoEsuate).toEqual(['canonical']);
    });
  });

  test('metricile din LHR ajung în raport, ca mediane', () => {
    const cu = (lcp: number) => lhr(bune, {}, { audits: { 'largest-contentful-paint': { numericValue: lcp, score: 1, scoreDisplayMode: 'numeric', title: 'LCP' } } });
    const r = evalueaza([cu(1000), cu(3000), cu(2000)]);
    expect(r.metrici['largest-contentful-paint']).toBe(2000);
  });
});

describe('check-dist-markers', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'siteulet-markere-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function ruleaza(...args: string[]) {
    const r = spawnSync(process.execPath, [join(SCRIPTURI, 'check-dist-markers.mjs'), ...args], { cwd: dir, encoding: 'utf8' });
    return { cod: r.status, iesire: `${r.stdout}${r.stderr}` };
  }

  test('găsește marcajele în orice fișier text, nu doar în HTML', () => {
    mkdirSync(join(dir, 'dist', 'servicii'), { recursive: true });
    writeFileSync(join(dir, 'dist', 'index.html'), '<p>curat</p>');
    writeFileSync(join(dir, 'dist', 'servicii', 'index.html'), '<p>CUI [DE COMPLETAT:#1]</p>');
    writeFileSync(join(dir, 'dist', 'llms.txt'), 'x [DE COMPLETAT:#4] y');
    writeFileSync(join(dir, 'dist', 'poza.png'), Buffer.from([0, 1, 2, 3]));
    const gasite = gasesteMarcaje(join(dir, 'dist'));
    expect(gasite.map((g: { fisier: string }) => g.fisier.replaceAll('\\', '/').split('/dist/')[1]).sort()).toEqual(['llms.txt', 'servicii/index.html']);
  });

  test('iese cu 1 și numește fișierul când dist/ are un marcaj', () => {
    mkdirSync(join(dir, 'dist'));
    writeFileSync(join(dir, 'dist', 'index.html'), '<p>CUI [DE COMPLETAT:#1]</p>');
    const r = ruleaza();
    expect(r.cod).toBe(1);
    expect(r.iesire).toContain('[DE COMPLETAT');
    expect(r.iesire).toContain('index.html');
  });

  test('iese cu 0 când dist/ e curat', () => {
    mkdirSync(join(dir, 'dist'));
    writeFileSync(join(dir, 'dist', 'index.html'), '<p>curat</p>');
    expect(ruleaza().cod).toBe(0);
  });

  test('iese cu 1 când dist/ lipsește sau e gol (să nu treacă în tăcere)', () => {
    expect(ruleaza().cod).toBe(1);
    mkdirSync(join(dir, 'dist'));
    const r = ruleaza();
    expect(r.cod).toBe(1);
    expect(r.iesire).toContain('niciun fișier');
  });

  test('primește directorul ca argument', () => {
    mkdirSync(join(dir, 'altul'));
    writeFileSync(join(dir, 'altul', 'index.html'), '[DE COMPLETAT:#2]');
    expect(ruleaza('altul').cod).toBe(1);
  });
});
