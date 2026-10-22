// Lighthouse 13 pe mobil, de 3 ori, cu mediana pe categorie (§1, §10 punctul 5).
// Pragul e 90 la Performanță, Accesibilitate, Bune practici și SEO. Pe paginile noindex, SEO nu se judecă după scorul
// categoriei, ci după fiecare audit cu greutate: scor 1, în afară de `is-crawlable` (și `http-status-code` pe 404).
// „Agentic Browsing” (Lighthouse 13.3+) se raportează separat și nu e criteriu de acceptare.
// Folosire: node scripts/qa-lighthouse.mjs <url> [--noindex]   (scrie rezultatul JSON; cod 1 dacă pagina pică)
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Scorul minim, ca în Lighthouse: scorul afișat (0–100, rotunjit), nu cel brut. */
export const PRAG = 90;
export const CATEGORII = ['performance', 'accessibility', 'best-practices', 'seo'];
export const RUNDE = 3;

/** Auditurile SEO care pot pica pe o pagină noindex; `http-status-code` doar pe 404 (§1). */
const SCUTITE_NOINDEX = ['is-crawlable'];
const SCUTITE_404 = ['http-status-code'];

/** Auditurile ale căror valori se păstrează în raport (informativ: bugetele din §9.1 se judecă separat). */
const METRICI = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'cumulative-layout-shift',
  'total-blocking-time',
  'speed-index',
  'total-byte-weight',
];

/** Mediana; la un număr par de valori, media celor două din mijloc. */
export function mediana(valori) {
  const sortate = [...valori].sort((a, b) => a - b);
  const mijloc = sortate.length >> 1;
  return sortate.length % 2 === 1 ? sortate[mijloc] : (sortate[mijloc - 1] + sortate[mijloc]) / 2;
}

const afisat = (scor) => Math.round(scor * 100);

/**
 * Un audit „picat”: eroare, sau scor sub 1. La auditurile numerice (metrici) „bine” începe de la 0,9, ca verdele din Lighthouse,
 * în afară de `strict`. Auditurile neaplicabile, manuale sau informative nu au scor și nu pică.
 */
function picat(audit, { strict = false } = {}) {
  if (audit === undefined) return false;
  if (audit.scoreDisplayMode === 'error') return true;
  if (audit.score === null) return false;
  return audit.score < (audit.scoreDisplayMode === 'numeric' && !strict ? 0.9 : 1);
}

/** Auditurile cu greutate dintr-o categorie care pică în majoritatea rulărilor, ca `{ id, audit }` (auditul din prima rulare care îl pică). */
function esuateInMajoritate(lhrs, categorie, { scutite = [], strict = false } = {}) {
  const ids = new Set(lhrs.flatMap((lhr) => (lhr.categories?.[categorie]?.auditRefs ?? []).filter((r) => r.weight > 0).map((r) => r.id)));
  const rezultat = [];
  for (const id of ids) {
    if (scutite.includes(id)) continue;
    const picate = lhrs.filter((lhr) => picat(lhr.audits?.[id], { strict }));
    if (picate.length * 2 > lhrs.length) rezultat.push({ id, audit: picate[0].audits[id] });
  }
  return rezultat;
}

/**
 * Judecă rulările (obiecte LHR). `noindex`: pagina e noindex; `este404`: pagina e `/404/`.
 * Întoarce scorurile (mediana și fiecare rulare, 0–100), auditurile picate pe categorie, motivele pentru care pagina pică și `trece`.
 */
export function evalueaza(lhrs, { noindex = false, este404 = false } = {}) {
  const motive = [];
  const runde = lhrs.map((lhr) => Object.fromEntries(CATEGORII.map((c) => [c, lhr.categories?.[c]?.score ?? null])));
  const scoruri = /** @type {Record<string, number | null>} */ ({});
  const auditeEsuate = Object.fromEntries(CATEGORII.map((c) => [c, esuateInMajoritate(lhrs, c)]));

  for (const categorie of CATEGORII) {
    const valori = runde.map((r) => r[categorie]);
    if (valori.some((v) => v === null)) {
      scoruri[categorie] = null;
      motive.push(`${categorie}: fără scor în cel puțin una dintre rulări (${valori.map((v) => v ?? 'null').join(', ')})`);
      continue;
    }
    const scor = afisat(mediana(valori));
    scoruri[categorie] = scor;
    if (noindex && categorie === 'seo') continue; // se judecă mai jos, pe audituri
    if (scor < PRAG) {
      const picate = auditeEsuate[categorie].map(({ id, audit }) => `${id} (${audit.title ?? id})`);
      const cine = picate.length > 0 ? `; audituri picate: ${picate.join(', ')}` : '';
      motive.push(`${categorie}: ${scor} sub pragul de ${PRAG} (rulări: ${valori.map(afisat).join(', ')})${cine}`);
    }
  }

  // SEO pe pagini noindex: fiecare audit cu greutate trebuie să aibă 1; un audit pică dacă pică în majoritatea rulărilor.
  const auditeSeoEsuate = [];
  if (noindex) {
    const scutite = [...SCUTITE_NOINDEX, ...(este404 ? SCUTITE_404 : [])];
    for (const { id, audit } of esuateInMajoritate(lhrs, 'seo', { scutite, strict: true })) {
      auditeSeoEsuate.push(id);
      const scor = audit.scoreDisplayMode === 'error' ? 'eroare' : `scorul ${audit.score}`;
      motive.push(`seo: auditul „${id}” (${audit.title ?? id}) are ${scor}, iar pe paginile noindex se cere 1 (scutite: ${scutite.join(', ')})`);
    }
  }

  // Raportat separat, fără efect asupra rezultatului.
  const valoriAgentic = lhrs.map((lhr) => lhr.categories?.['agentic-browsing']?.score);
  const agentic = valoriAgentic.every((v) => typeof v === 'number')
    ? { runde: valoriAgentic.map(afisat), mediana: afisat(mediana(valoriAgentic)) }
    : null;

  const metrici = /** @type {Record<string, number>} */ ({});
  for (const id of METRICI) {
    const valori = lhrs.map((lhr) => lhr.audits?.[id]?.numericValue).filter((v) => typeof v === 'number');
    if (valori.length === lhrs.length) metrici[id] = mediana(valori);
  }

  return {
    scoruri,
    runde: runde.map((r) => Object.fromEntries(Object.entries(r).map(([c, v]) => [c, v === null ? null : afisat(v)]))),
    agentic,
    metrici,
    auditeEsuate: Object.fromEntries(Object.entries(auditeEsuate).map(([c, lista]) => [c, lista.map(({ id }) => id)])),
    auditeSeoEsuate,
    motive,
    trece: motive.length === 0,
  };
}

/**
 * Rulează Lighthouse de `RUNDE` ori pe `url` (Chrome instalat, headless, mobil) și judecă rezultatul.
 * `noindex`: pagina e noindex (vezi mai sus). Pe `/404/` statusul 404 nu oprește rularea.
 * O rulare care eșuează dă `trece: false` cu motivul, nu o excepție.
 */
export async function ruleaza(url, { noindex = false } = {}) {
  const [{ default: lighthouse }, { launch }] = await Promise.all([import('lighthouse'), import('chrome-launcher')]);
  const este404 = new URL(url).pathname === '/404/';
  const lhrs = [];
  try {
    for (let i = 0; i < RUNDE; i++) {
      // Un Chrome nou la fiecare rulare: nicio memorie de la rularea dinainte.
      const chrome = await launch({ chromeFlags: ['--headless=new', '--no-first-run'], logLevel: 'silent' });
      try {
        const rezultat = await lighthouse(url, {
          port: chrome.port,
          output: 'json',
          logLevel: 'error',
          formFactor: 'mobile',
          ...(este404 && { ignoreStatusCode: true }),
        });
        if (!rezultat?.lhr) throw new Error('Lighthouse nu a întors niciun rezultat');
        if (rezultat.lhr.runtimeError) throw new Error(`${rezultat.lhr.runtimeError.code}: ${rezultat.lhr.runtimeError.message}`);
        lhrs.push(rezultat.lhr);
      } finally {
        try {
          await chrome.kill();
        } catch {
          // Pe Windows, ștergerea profilului temporar poate eșua cât timp Chrome se închide; nu schimbă rezultatul.
        }
      }
    }
  } catch (eroare) {
    return { scoruri: {}, runde: [], agentic: null, metrici: {}, auditeEsuate: {}, auditeSeoEsuate: [], motive: [`Lighthouse a eșuat: ${eroare.message}`], trece: false };
  }
  return {
    ...evalueaza(lhrs, { noindex, este404 }),
    lighthouse: lhrs[0].lighthouseVersion,
    chrome: lhrs[0].environment?.hostUserAgent,
    avertismente: [...new Set(lhrs.flatMap((lhr) => lhr.runWarnings ?? []))],
  };
}

// realpath pe ambele părți: printr-un symlink/junction argv[1] nu e realpath-uit, iar import.meta.url da.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const [url, ...optiuni] = process.argv.slice(2);
  if (!url) {
    console.error('Folosire: node scripts/qa-lighthouse.mjs <url> [--noindex]');
    process.exit(1);
  }
  const rezultat = await ruleaza(url, { noindex: optiuni.includes('--noindex') });
  console.log(JSON.stringify(rezultat, null, 2));
  process.exit(rezultat.trece ? 0 : 1);
}
