// check:launch (§11): refuză lansarea până când datele firmei, domeniul, aprobările și marcajele blocante sunt în regulă.
// Rulează după `npm run build` (dist/ de producție, fără SITE_URL și fără DRAFT) și după `npm run report:placeholders`.
// Citește:
//   - src/site.config.ts (domeniul) și mediul (SITE_URL, DRAFT: un build pentru QA sau previzualizare nu se lansează);
//   - dist/_intern/aprobari.json (rutele construite și aprobarea lor, din src/lib/routes.ts);
//   - reports/placeholders.json (marcajele rămase în sursă); blocarea vine din registru (src/placeholders.ts);
//   - dist/: orice fișier text, pentru „[DE COMPLETAT” (aceeași funcție ca check-dist-markers), iar HTML, XML și TXT
//     pentru localhost, 127.0.0.1 sau domeniul provizoriu (un dist/ construit pentru QA).
// O pagină din dist/ care lipsește din aprobari.json contează ca neaprobată. Avertismentele nu blochează.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REGISTRU } from '../src/placeholders.ts';
import { DOMENIU_PROVIZORIU } from '../src/site.config.ts';
import { gasesteMarcaje } from './check-dist-markers.mjs';

const RADACINA = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RADACINA, 'dist');

/** Adrese care nu au ce căuta într-un build de producție. */
const ADRESE_DE_QA = ['localhost', '127.0.0.1', new URL(DOMENIU_PROVIZORIU).hostname];

/**
 * Motivele de refuz, fiecare o dată, în ordinea verificărilor. Gol = se poate lansa.
 * @param {{
 *   site: { url: string },
 *   aprobari: Record<string, boolean>,
 *   paginiDist: string[],
 *   marcaje: { fisier: string, nr: number, blocheaza: boolean }[],
 *   marcajeDist: { fisier: string, linie: number }[],
 *   textDist: string[],
 *   mediu: { SITE_URL?: string, DRAFT?: string },
 * }} stare
 */
export function verificaLansarea({ site, aprobari, paginiDist, marcaje, marcajeDist, textDist, mediu }) {
  const motive = new Set();
  if (mediu.SITE_URL !== undefined) motive.add('SITE_URL e setat în mediu (e doar pentru QA local)');
  if (mediu.DRAFT !== undefined) motive.add('DRAFT e setat în mediu (build de previzualizare)');
  if (new URL(site.url).hostname === new URL(DOMENIU_PROVIZORIU).hostname) motive.add('domeniul e încă provizoriu');
  for (const m of marcaje) if (m.blocheaza) motive.add(`marcaj blocant #${m.nr} în ${m.fisier}`);
  for (const [cale, aprobat] of Object.entries(aprobari)) if (!aprobat) motive.add(`pagină neaprobată: ${cale}`);
  for (const cale of paginiDist) if (!Object.hasOwn(aprobari, cale)) motive.add(`pagină neaprobată: ${cale}`);
  for (const m of marcajeDist) motive.add(`marcaj în dist/: ${m.fisier}:${m.linie}`);
  if (textDist.some((text) => ADRESE_DE_QA.some((adresa) => text.includes(adresa)))) {
    motive.add('dist/ conține localhost, 127.0.0.1 sau domeniul provizoriu: rulează `npm run build` fără SITE_URL');
  }
  return [...motive];
}

/**
 * Ce trebuie verificat de mână înainte de lansare, fără să blocheze: datele scrise în texte (ghiduri, pagini legale)
 * și dependențele de dezvoltare cu vulnerabilități cunoscute.
 * @param {{ date: { cale: string, data: string }[] }} stare
 */
export function avertismenteLansare({ date }) {
  return [
    ...date.map(({ cale, data }) => `${cale}: data din text e ${data}; pune data aprobării, dacă e alta`),
    'rulează `npm audit` înainte de lansare: avertismentele noi apar mai ales la uneltele de dezvoltare (wrangler, miniflare)',
  ];
}

/** Calea paginii pentru un fișier HTML din dist/: `servicii/seo/index.html` → `/servicii/seo/`, `404.html` → `/404/`. */
function caleaPaginii(fisier) {
  const rel = relative(DIST, fisier).split(sep).join('/');
  if (rel === '404.html') return '/404/';
  return `/${rel.replace(/index\.html$/, '')}`;
}

function* fisiere(dir) {
  for (const intrare of readdirSync(dir)) {
    const cale = join(dir, intrare);
    if (statSync(cale).isDirectory()) {
      if (intrare !== '_intern') yield* fisiere(cale);
    } else yield cale;
  }
}

function citesteJson(cale, cum) {
  if (!existsSync(cale)) throw new Error(`lipsește ${relative(RADACINA, cale)}: rulează întâi ${cum}`);
  return JSON.parse(readFileSync(cale, 'utf8'));
}

async function main() {
  const { draft, pagini } = citesteJson(join(DIST, '_intern', 'aprobari.json'), '`npm run build`');
  if (draft) throw new Error('dist/ e construit cu DRAFT=1; check:launch se rulează pe build-ul de producție');

  const { site } = await import(pathToFileURL(join(RADACINA, 'src', 'site.config.ts')).href);
  // Blocarea se ia din registru, nu din raport: un raport vechi nu poate debloca un rând.
  const marcaje = citesteJson(join(RADACINA, 'reports', 'placeholders.json'), '`npm run report:placeholders`').map((m) => ({
    ...m,
    blocheaza: REGISTRU[m.nr]?.blocheaza ?? true,
  }));
  const toate = [...fisiere(DIST)];
  const textDist = toate.filter((f) => ['.html', '.txt', '.xml'].includes(extname(f))).map((f) => readFileSync(f, 'utf8'));
  const paginiDist = toate.filter((f) => extname(f) === '.html').map(caleaPaginii);
  const aprobari = Object.fromEntries(pagini.map((p) => [p.cale, p.aprobat]));
  const marcajeDist = gasesteMarcaje(DIST).map((m) => ({ ...m, fisier: relative(RADACINA, m.fisier).split(sep).join('/') }));
  const mediu = { SITE_URL: process.env.SITE_URL, DRAFT: process.env.DRAFT };
  for (const cheie of Object.keys(mediu)) if (mediu[cheie] === undefined) delete mediu[cheie];

  const motive = verificaLansarea({ site, aprobari, paginiDist, marcaje, marcajeDist, textDist, mediu });
  for (const a of avertismenteLansare({ date: pagini.filter((p) => p.data !== undefined) })) console.warn(`avertisment: ${a}`);
  if (motive.length > 0) {
    console.error(`check:launch: lansarea e refuzată (${motive.length} motive):\n  - ${motive.join('\n  - ')}`);
    process.exit(1);
  }
  console.log('check:launch: totul e în regulă pentru lansare.');
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
