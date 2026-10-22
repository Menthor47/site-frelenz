// Poarta de verificare a unei pagini (§10): `npm run qa:page -- <cale>`, de ex. `npm run qa:page -- /servicii/seo/`.
// Pașii, în ordine: build (cu SITE_URL=http://localhost:8787), check, check-dist-markers, html-validate pe fișierul paginii,
// check-schema, Playwright (`tests/e2e/page-basics.spec.ts`), Lighthouse (3 rulări) și capturile (390×844 și 1440×900).
// Un pas picat nu oprește ceilalți (se văd toate problemele dintr-o rulare); doar fără build sau fără pagină nu are ce verifica.
// Scrie reports/qa/<slug>.json și iese cu cod 1 la orice eșec.
//
// QA_DIST=dist-draft: previzualizarea (pagini ca /_test/diacritice/, marcaje vizibile). Construiește cu `preview:draft`,
// servește cu `cross-env DRAFT=1 astro preview` și nu rulează check-dist-markers.
// Serverul: `wrangler dev` dacă există wrangler.jsonc (de la Task 13), altfel `astro preview`.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verificaGraf } from './check-schema.mjs';
import { ruleaza as ruleazaLighthouse } from './qa-lighthouse.mjs';
import { esteNoindex } from './schema-expectations.mjs';

const RADACINA = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8787;
const SITE_URL = `http://localhost:${PORT}`;
const CAPTURI = [
  [390, 844],
  [1440, 900],
];

// ——— Calea paginii ———

const FOLOSIRE = 'Folosire: npm run qa:page -- <cale>   (ex. npm run qa:page -- /servicii/seo/)';

/** Numele fișierelor din reports/: `/` → `index`, `/servicii/seo/` → `servicii-seo`. */
export function slugCale(cale) {
  const slug = cale.split('/').filter(Boolean).join('-');
  return slug === '' ? 'index' : slug;
}

/**
 * Ruta primită în linia de comandă, validată: slash la început și la sfârșit, fără caractere ciudate.
 * Git Bash schimbă „/” în „C:/Program Files/Git/” înainte să ajungă la npm; calea aceea se recunoaște și se repară.
 */
export function normalizeazaCale(argument, env = process.env) {
  if (argument === undefined || argument === '') throw new Error(FOLOSIRE);
  let cale = argument;
  if (/^[A-Za-z]:[\\/]/.test(cale)) {
    const plat = cale.replaceAll('\\', '/');
    const exepath = (env.EXEPATH ?? '').replaceAll('\\', '/').replace(/\/+$/, '');
    const radacini = exepath === '' ? [] : [exepath, exepath.replace(/\/bin$/i, '')];
    const radacina = radacini.find((r) => plat.toLowerCase().startsWith(`${r.toLowerCase()}/`));
    if (radacina === undefined) {
      throw new Error(
        `„${argument}” e o cale Windows, nu o rută a site-ului. Dacă ai scris o rută care începe cu „/”, Git Bash a schimbat-o: ` +
          'rulează cu MSYS_NO_PATHCONV=1 în față sau din PowerShell.',
      );
    }
    cale = plat.slice(radacina.length);
  }
  if (/[^A-Za-z0-9_.~/-]/.test(cale)) throw new Error(`Ruta „${cale}” are caractere nepermise (doar litere, cifre, _ . ~ - și /). ${FOLOSIRE}`);
  if (!cale.startsWith('/')) throw new Error(`Ruta „${cale}” trebuie să înceapă cu /. ${FOLOSIRE}`);
  if (!cale.endsWith('/')) throw new Error(`Ruta „${cale}” trebuie să se termine cu / (site-ul folosește slash la final). ${FOLOSIRE}`);
  if (/(^|\/)\.\.?(\/|$)/.test(cale) || cale.includes('//')) throw new Error(`Ruta „${cale}” are segmente goale sau „.”/„..”. ${FOLOSIRE}`);
  return cale;
}

/** Fișierele HTML posibile pentru rută, în ordinea căutării (`/404/` poate fi și `404.html`). */
export function fisierPagina(dist, cale) {
  if (cale === '/') return [`${dist}/index.html`];
  return [`${dist}/${cale.slice(1)}index.html`, ...(cale === '/404/' ? [`${dist}/404.html`] : [])];
}

/** Comanda serverului: `wrangler dev` din Task 13 încolo, altfel `astro preview`; previzualizarea DRAFT se servește mereu cu astro preview. */
export function comandaServer({ wrangler, draft }) {
  if (draft) return `npx cross-env DRAFT=1 astro preview --port ${PORT}`;
  return wrangler ? `npx wrangler dev --port ${PORT}` : `npx astro preview --port ${PORT}`;
}

// ——— Procese ———

const faraCulori = (text) => text.replace(/\u001b\[[0-9;]*m/g, '');
const ultimeleLinii = (text, n) => faraCulori(text).trimEnd().split(/\r?\n/).slice(-n);
const pauza = (ms) => new Promise((rezolva) => setTimeout(rezolva, ms));

/** Rulează o comandă de shell în rădăcina proiectului; ieșirea curge pe ecran (dacă nu e `tacut`) și se păstrează (ultimii 20 KB). */
function ruleazaComanda(comanda, env = {}, { tacut = false } = {}) {
  return new Promise((rezolva) => {
    const copil = spawn(comanda, { cwd: RADACINA, shell: true, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let iesire = '';
    const colecteaza = (flux, tinta) =>
      flux.on('data', (bucata) => {
        if (!tacut) tinta.write(bucata);
        iesire = (iesire + bucata).slice(-20_000);
      });
    colecteaza(copil.stdout, process.stdout);
    colecteaza(copil.stderr, process.stderr);
    copil.on('error', (eroare) => rezolva({ cod: 1, iesire: `${iesire}\n${eroare.message}` }));
    copil.on('close', (cod) => rezolva({ cod: cod ?? 1, iesire }));
  });
}

/** Rezultatul unui pas-comandă, a cărui ieșire s-a văzut deja pe ecran: la eșec, codul, iar coada ieșirii merge doar în raport. */
const rezultatComanda = ({ cod, iesire }) =>
  cod === 0 ? { erori: [] } : { erori: [`a ieșit cu codul ${cod} (ieșirea e mai sus)`], iesire: ultimeleLinii(iesire, 40) };

const portOcupat = () =>
  new Promise((rezolva) => {
    const priza = net.connect({ port: PORT, host: 'localhost' });
    priza.once('connect', () => {
      priza.destroy();
      rezolva(true);
    });
    priza.once('error', () => rezolva(false));
  });

function pornesteServer(comanda) {
  const copil = spawn(comanda, {
    cwd: RADACINA,
    shell: true,
    env: { ...process.env, SITE_URL },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  const server = { copil, iesire: '', iesit: null };
  const colecteaza = (bucata) => (server.iesire = (server.iesire + bucata).slice(-20_000));
  copil.stdout.on('data', colecteaza);
  copil.stderr.on('data', colecteaza);
  copil.on('exit', (cod) => (server.iesit = cod ?? 1));
  copil.on('error', (eroare) => {
    colecteaza(eroare.message);
    server.iesit = 1;
  });
  return server;
}

/** Oprește serverul cu tot cu procesele copil (wrangler pornește workerd). */
function opresteServer(server) {
  const { pid } = server.copil;
  if (pid === undefined || server.iesit !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
  else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      // procesul s-a oprit deja
    }
  }
}

async function asteaptaServer(server, secunde = 90) {
  const limita = Date.now() + secunde * 1000;
  while (Date.now() < limita) {
    if (server.iesit !== null) throw new Error(`serverul s-a oprit cu codul ${server.iesit}\n${ultimeleLinii(server.iesire, 15).join('\n')}`);
    try {
      await fetch(`${SITE_URL}/`, { signal: AbortSignal.timeout(2000) });
      return;
    } catch {
      await pauza(500);
    }
  }
  throw new Error(`serverul nu a răspuns pe ${SITE_URL} în ${secunde} de secunde\n${ultimeleLinii(server.iesire, 15).join('\n')}`);
}

// ——— Pașii care nu sunt comenzi ———

async function validareHtml(fisier) {
  const { HtmlValidate } = await import('html-validate/node');
  const raport = await new HtmlValidate().validateFile(fisier);
  const erori = [];
  const avertismente = [];
  for (const rezultat of raport.results) {
    for (const m of rezultat.messages) {
      const text = `${m.ruleId ?? 'html-validate'}: ${m.message} (coloana ${m.column}${m.selector ? `, ${m.selector}` : ''})`;
      (m.severity >= 2 ? erori : avertismente).push(text);
    }
  }
  return { erori, avertismente };
}

/** Erorile din raportul JSON Playwright, fiecare „test: mesaj”, fără codul-sursă din jurul aserțiunii (liniile „  31 | …”). */
function eroriPlaywright(suita, titluri = []) {
  const gasite = [];
  for (const spec of suita.specs ?? []) {
    for (const test of spec.tests ?? []) {
      for (const rezultat of test.results ?? []) {
        for (const eroare of rezultat.errors ?? []) {
          const linii = faraCulori(eroare.message ?? '').split(/\r?\n/);
          const cadru = linii.findIndex((linie) => /^\s*>?\s*\d+ \|/.test(linie));
          const mesaj = linii.slice(0, cadru === -1 ? undefined : cadru).filter((linie) => linie.trim() !== '');
          gasite.push(`${[...titluri, spec.title].join(' › ')}: ${mesaj.join('\n    ')}`);
        }
      }
    }
  }
  for (const copil of suita.suites ?? []) gasite.push(...eroriPlaywright(copil, copil.title && copil.title !== suita.file ? [...titluri, copil.title] : titluri));
  return gasite;
}

async function ruleazaPlaywright(cale) {
  const dir = mkdtempSync(join(tmpdir(), 'siteulet-qa-'));
  const fisierJson = join(dir, 'rezultat.json');
  try {
    const r = await ruleazaComanda(
      'npx playwright test tests/e2e/page-basics.spec.ts --reporter=json',
      { QA_PATH: cale, QA_SERVER_EXTERNAL: '1', SITE_URL, PLAYWRIGHT_JSON_OUTPUT_NAME: fisierJson },
      { tacut: true },
    );
    let raport;
    try {
      raport = JSON.parse(readFileSync(fisierJson, 'utf8'));
    } catch {
      // Playwright n-a ajuns să scrie raportul (configurare greșită, browser lipsă): ieșirea lui e singura explicație.
      return { erori: [`Playwright a ieșit cu codul ${r.cod} fără raport`, ...ultimeleLinii(r.iesire, 25)] };
    }
    const { stats } = raport;
    const erori = [...(raport.errors ?? []).map((e) => faraCulori(e.message ?? '')), ...raport.suites.flatMap((s) => eroriPlaywright(s))];
    // Cod 0 nu ajunge: testele sărite sau lipsă (de ex. fără QA_PATH) ies tot cu 0.
    if (erori.length === 0 && (r.cod !== 0 || stats.expected < 1 || stats.skipped > 0 || stats.unexpected > 0 || stats.flaky > 0)) {
      erori.push(`${stats.expected} trecute, ${stats.skipped} sărite, ${stats.unexpected} picate, ${stats.flaky} instabile (cod ${r.cod}); se cer teste trecute, fără sărite`);
    }
    console.log(`  ${stats.expected} teste trecute, ${stats.unexpected} picate, ${stats.skipped} sărite`);
    return { erori, ...(erori.length > 0 && { iesire: ultimeleLinii(r.iesire, 40) }) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Capturile paginii la 390×844 și 1440×900, pagina întreagă, după ce fonturile s-au încărcat. */
async function captureaza(cale, slug) {
  const { chromium } = await import('@playwright/test');
  const dir = join(RADACINA, 'reports', 'screens');
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const fisiere = [];
  try {
    for (const [latime, inaltime] of CAPTURI) {
      const context = await browser.newContext({ viewport: { width: latime, height: inaltime } });
      try {
        const pagina = await context.newPage();
        await pagina.goto(`${SITE_URL}${cale}`, { waitUntil: 'networkidle' });
        await pagina.evaluate(() => document.fonts.ready);
        const fisier = join(dir, `${slug}-${latime}x${inaltime}.png`);
        await pagina.screenshot({ path: fisier, fullPage: true });
        fisiere.push(fisier);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return fisiere;
}

// ——— Rularea ———

const secunde = (ms) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`;

async function main(argumente, env) {
  let cale;
  try {
    cale = normalizeazaCale(argumente[0], env);
  } catch (eroare) {
    console.error(`qa:page: ${eroare.message}`);
    return 1;
  }
  const dist = env.QA_DIST ?? 'dist';
  if (dist !== 'dist' && dist !== 'dist-draft') {
    console.error(`qa:page: QA_DIST poate fi „dist” sau „dist-draft”, nu „${dist}”.`);
    return 1;
  }
  const draft = dist === 'dist-draft';
  const slug = slugCale(cale);
  const noindex = esteNoindex(cale);
  const comandaDeServer = comandaServer({ wrangler: existsSync(join(RADACINA, 'wrangler.jsonc')), draft });
  console.log(`qa:page ${cale}  (${dist}${noindex ? ', noindex' : ''}; server: ${comandaDeServer}; SITE_URL=${SITE_URL})`);

  const pasi = [];
  let lighthouse = null;
  let capturi = [];

  /**
   * Rulează un pas; `fn` întoarce lista de erori (goală = trece) sau `{ erori, avertismente, iesire }`.
   * `iesire` (coada ieșirii unei comenzi picate) nu se afișează: e doar în raport.
   */
  async function pas(nume, fn) {
    console.log(`\n> ${nume}`);
    const start = Date.now();
    let rezultat;
    try {
      rezultat = await fn();
    } catch (eroare) {
      rezultat = [`${eroare.message}`];
    }
    const { erori, avertismente = [], iesire } = Array.isArray(rezultat) ? { erori: rezultat } : rezultat;
    const durataMs = Date.now() - start;
    pasi.push({
      nume,
      stare: erori.length === 0 ? 'PASS' : 'FAIL',
      durataMs,
      erori,
      ...(avertismente.length > 0 && { avertismente }),
      ...(iesire && { iesire }),
    });
    for (const aviz of avertismente) console.log(`  avertisment: ${aviz}`);
    console.log(`${erori.length === 0 ? 'PASS' : 'FAIL'} ${nume} (${secunde(durataMs)})`);
    for (const eroare of erori) console.log(`  - ${eroare}`);
    return erori.length === 0;
  }
  const sari = (nume, motiv) => {
    pasi.push({ nume, stare: 'SKIP', durataMs: 0, erori: [], motiv });
    console.log(`\nSKIP ${nume}: ${motiv}`);
  };

  const mediu = { SITE_URL };
  const construit = await pas(`build (${draft ? 'preview:draft' : 'build'})`, async () =>
    rezultatComanda(await ruleazaComanda(draft ? 'npm run preview:draft' : 'npm run build', mediu)),
  );

  if (!construit) {
    for (const nume of ['check', 'check-dist-markers', 'html-validate', 'check-schema', 'playwright', 'lighthouse', 'capturi']) {
      sari(nume, 'build-ul a picat');
    }
  } else {
    await pas('check', async () =>
      rezultatComanda(
        await ruleazaComanda(draft ? `node scripts/check-cedilla.mjs ${dist} && node scripts/check-font-glyphs.mjs ${dist}` : 'npm run check'),
      ),
    );
    if (draft) sari('check-dist-markers', 'previzualizarea (QA_DIST=dist-draft) are marcaje pe care producția nu le are');
    else await pas('check-dist-markers', async () => rezultatComanda(await ruleazaComanda('node scripts/check-dist-markers.mjs')));

    const fisier = fisierPagina(dist, cale)
      .map((f) => join(RADACINA, f))
      .find((f) => existsSync(f));
    const existaPagina = await pas('pagina în build', async () =>
      fisier
        ? []
        : [
            `${fisierPagina(dist, cale).join(' sau ')} lipsește.` +
              (cale.startsWith('/_test/') && !draft ? ' Paginile /_test/ există doar în previzualizare: rulează cu QA_DIST=dist-draft.' : ''),
          ],
    );

    if (!existaPagina) {
      for (const nume of ['html-validate', 'check-schema', 'playwright', 'lighthouse', 'capturi']) sari(nume, 'pagina nu există în build');
    } else {
      await pas('html-validate', () => validareHtml(fisier));
      await pas('check-schema', async () => verificaGraf(readFileSync(fisier, 'utf8'), cale));

      let server;
      const opreste = () => server && opresteServer(server);
      process.once('SIGINT', () => {
        opreste();
        process.exit(130);
      });
      try {
        const pornit = await pas('server', async () => {
          if (await portOcupat()) {
            return [`portul ${PORT} e ocupat (un server rămas de la o rulare veche?). Oprește-l și rulează din nou: altfel s-ar verifica alt build.`];
          }
          server = pornesteServer(comandaDeServer);
          await asteaptaServer(server);
          return [];
        });
        if (!pornit) {
          for (const nume of ['playwright', 'lighthouse', 'capturi']) sari(nume, 'serverul nu a pornit');
        } else {
          await pas('playwright (page-basics)', () => ruleazaPlaywright(cale));
          await pas('lighthouse (3 rulări, mobil)', async () => {
            lighthouse = await ruleazaLighthouse(`${SITE_URL}${cale}`, { noindex });
            return lighthouse.motive;
          });
          await pas('capturi', async () => {
            capturi = await captureaza(cale, slug);
            return capturi.filter((f) => !existsSync(f)).map((f) => `lipsește ${f}`);
          });
        }
      } finally {
        opreste();
      }
    }
  }

  // Un pas sărit nu pică nimic: fie e scutit (check-dist-markers în previzualizare), fie un pas picat dinainte a explicat de ce nu avea ce rula.
  const trece = pasi.every((p) => p.stare !== 'FAIL');
  const raport = {
    cale,
    slug,
    data: new Date().toISOString(),
    dist,
    siteUrl: SITE_URL,
    server: comandaDeServer,
    noindex,
    node: process.version,
    trece,
    pasi,
    lighthouse,
    capturi: capturi.map((f) => relative(RADACINA, f).split('\\').join('/')),
  };
  const fisierRaport = join(RADACINA, 'reports', 'qa', `${slug}.json`);
  mkdirSync(dirname(fisierRaport), { recursive: true });
  writeFileSync(fisierRaport, `${JSON.stringify(raport, null, 2)}\n`);

  console.log(`\n=== qa:page ${cale}: ${trece ? 'PASS' : 'FAIL'} ===`);
  for (const p of pasi) console.log(`  ${p.stare}  ${p.nume}${p.stare === 'SKIP' ? ` (${p.motiv})` : ` (${secunde(p.durataMs)})`}`);
  if (lighthouse && Object.keys(lighthouse.scoruri).length > 0) {
    const linie = Object.entries(lighthouse.scoruri).map(([c, s]) => `${c} ${s ?? 'fără scor'}`).join(', ');
    console.log(`  Lighthouse, mediana din ${lighthouse.runde.length}: ${linie}${noindex ? ' (pagină noindex: SEO se judecă pe audituri)' : ''}`);
    if (lighthouse.agentic) console.log(`  Agentic Browsing (separat, nu e criteriu): ${lighthouse.agentic.mediana}`);
  }
  console.log(`  Raport: ${relative(RADACINA, fisierRaport).split('\\').join('/')}`);
  if (capturi.length > 0) console.log(`  Capturi: ${raport.capturi.join(', ')}`);
  return trece ? 0 : 1;
}

// realpath pe ambele părți: printr-un symlink/junction argv[1] nu e realpath-uit, iar import.meta.url da.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exit(await main(process.argv.slice(2), process.env));
}
