// Verifică JSON-LD-ul unei pagini construite (§6.3, §10 punctul 6): un singur script cu un singur @graph,
// tipurile și câmpurile așteptate pentru rută, legăturile @id rezolvate, firimiturile, întrebările frecvente.
// Folosire: node scripts/check-schema.mjs <fisier.html> <cale>   (ex. dist/servicii/seo/index.html /servicii/seo/)
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { asteptariPentru, LEGATURI, TIPURI_INTERZISE } from './schema-expectations.mjs';

const SCRIPT_JSONLD = /<script\b[^>]*\btype=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;

const esteObiect = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const listaDe = (v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]);
const tipuriNod = (nod) => listaDe(nod['@type']);
const areTip = (nod, tip) => tipuriNod(nod).includes(tip);

/** Un câmp gol nu ține loc de valoare: lipsă, text cu spații, listă sau obiect fără chei. */
function gol(v) {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (esteObiect(v)) return Object.keys(v).length === 0;
  return false;
}

/** O trimitere pură: `{ "@id": "…" }` și nimic altceva. Un obiect cu `@id` și alte chei e o definiție. */
const esteTrimitere = (v) => esteObiect(v) && Object.keys(v).length === 1 && typeof v['@id'] === 'string';

/** Calea (`/a/b/`) dintr-o adresă absolută, sau `null` dacă nu e o adresă absolută http(s). */
function caleDinAdresa(adresa) {
  if (typeof adresa !== 'string') return null;
  try {
    const url = new URL(adresa);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.pathname : null;
  } catch {
    return null;
  }
}

/** Toate obiectele din graf, oricât de adânc. */
function* obiecte(valoare) {
  if (Array.isArray(valoare)) {
    for (const element of valoare) yield* obiecte(element);
  } else if (esteObiect(valoare)) {
    yield valoare;
    for (const v of Object.values(valoare)) yield* obiecte(v);
  }
}

function verificaFirimituri(nod, cale, erori) {
  const pasi = nod.itemListElement;
  if (!Array.isArray(pasi) || pasi.length === 0) {
    erori.push('BreadcrumbList: lipsește câmpul „itemListElement”');
    return;
  }
  const cai = pasi.map((pas, i) => {
    const nr = i + 1;
    if (!esteObiect(pas) || gol(pas.name)) erori.push(`BreadcrumbList: pasul ${nr} nu are „name”`);
    if (esteObiect(pas) && pas.position !== nr) erori.push(`BreadcrumbList: pasul ${nr} are position ${pas.position}, nu ${nr}`);
    const calePas = esteObiect(pas) ? caleDinAdresa(pas.item) : null;
    if (calePas === null) erori.push(`BreadcrumbList: pasul ${nr} nu are „item” cu adresă absolută`);
    return calePas;
  });
  const primul = cai[0];
  const ultimul = cai.at(-1);
  if (primul !== null && primul !== '/') erori.push(`BreadcrumbList: primul pas e ${primul}, nu Acasă (/)`);
  if (ultimul !== null && ultimul !== cale) erori.push(`BreadcrumbList: ultimul pas e ${ultimul}, dar pagina e ${cale}`);
}

function verificaIntrebari(nod, erori) {
  const intrebari = nod.mainEntity;
  if (!Array.isArray(intrebari)) return; // lipsa se raportează la câmpurile obligatorii
  intrebari.forEach((q, i) => {
    const nr = i + 1;
    if (!esteObiect(q) || gol(q.name)) erori.push(`FAQPage: întrebarea ${nr} nu are „name”`);
    if (!esteObiect(q) || !esteObiect(q.acceptedAnswer) || gol(q.acceptedAnswer.text)) {
      erori.push(`FAQPage: întrebarea ${nr} nu are „acceptedAnswer.text”`);
    }
  });
}

function verificaLista(nod, erori) {
  const elemente = nod.itemListElement;
  if (Array.isArray(elemente) && typeof nod.numberOfItems === 'number' && nod.numberOfItems !== elemente.length) {
    erori.push(`ItemList: numberOfItems e ${nod.numberOfItems}, dar lista are ${elemente.length} elemente`);
  }
}

/**
 * Erorile JSON-LD ale unei pagini (listă goală = în regulă). `html` e pagina construită, `cale` ruta ei (ex. `/servicii/seo/`).
 * Mesajele sunt stabile: „lipsește <Tip>”, „@id nerezolvat: <id>”, „<Tip>: lipsește câmpul „<câmp>””.
 */
export function verificaGraf(html, cale) {
  const erori = [];
  const blocuri = [...html.matchAll(SCRIPT_JSONLD)];
  if (blocuri.length !== 1) {
    erori.push(`trebuie exact un <script type="application/ld+json">, am găsit ${blocuri.length}`);
    if (blocuri.length === 0) return erori;
  }

  let document;
  try {
    document = JSON.parse(blocuri[0][1]);
  } catch (eroare) {
    return [...erori, `JSON-LD invalid: ${eroare.message}`];
  }
  if (!esteObiect(document) || !Array.isArray(document['@graph'])) return [...erori, 'lipsește @graph (o listă de noduri)'];
  if (document['@context'] !== 'https://schema.org') erori.push('@context trebuie să fie https://schema.org');

  const noduri = document['@graph'].filter(esteObiect);
  const dupaId = new Map();
  for (const nod of noduri) {
    if (typeof nod['@id'] !== 'string') continue;
    if (dupaId.has(nod['@id'])) erori.push(`@id duplicat: ${nod['@id']}`);
    else dupaId.set(nod['@id'], nod);
  }

  // @id rezolvat: orice trimitere pură trebuie să ducă la un obiect cu același @id și conținut propriu (la orice adâncime).
  const definite = new Set();
  for (const obiect of obiecte(document['@graph'])) {
    if (typeof obiect['@id'] === 'string' && !esteTrimitere(obiect)) definite.add(obiect['@id']);
  }
  for (const obiect of obiecte(document['@graph'])) {
    if (esteTrimitere(obiect) && !definite.has(obiect['@id'])) erori.push(`@id nerezolvat: ${obiect['@id']}`);
  }

  // Tipurile interzise (§6.3), oricât de adânc ar sta.
  for (const obiect of obiecte(document['@graph'])) {
    for (const tip of tipuriNod(obiect)) if (TIPURI_INTERZISE.includes(tip)) erori.push(`tip interzis: ${tip}`);
  }

  // Tipurile și câmpurile cerute pentru rută.
  const { tipuri, pagina } = asteptariPentru(cale);
  for (const [tip, campuri] of Object.entries(tipuri)) {
    const gasite = noduri.filter((nod) => areTip(nod, tip));
    if (gasite.length === 0) {
      erori.push(`lipsește ${tip}`);
      continue;
    }
    for (const nod of gasite) {
      for (const camp of campuri) if (gol(nod[camp])) erori.push(`${tip}: lipsește câmpul „${camp}”`);
    }
  }

  // Nodul care descrie pagina trebuie să poarte adresa ei.
  if (pagina !== undefined) {
    for (const nod of noduri.filter((n) => areTip(n, pagina))) {
      const calaNod = caleDinAdresa(nod.url);
      if (calaNod !== null && calaNod !== cale) erori.push(`${pagina}: url-ul ține de ${calaNod}, nu de pagina ${cale}`);
    }
  }

  // Legăturile @id trebuie să ducă la nodul de tipul potrivit (o trimitere nerezolvată e deja raportată mai sus).
  for (const [cheie, tipTinta] of Object.entries(LEGATURI)) {
    const [tip, camp] = cheie.split('.');
    for (const nod of noduri.filter((n) => areTip(n, tip))) {
      for (const valoare of listaDe(nod[camp])) {
        if (!esteTrimitere(valoare)) continue;
        const tinta = dupaId.get(valoare['@id']);
        if (tinta !== undefined && !areTip(tinta, tipTinta)) {
          erori.push(`${cheie} trebuie să trimită la un ${tipTinta}, nu la ${valoare['@id']}`);
        }
      }
    }
  }

  // Structura internă a tipurilor cu liste, oriunde apar.
  for (const nod of noduri) {
    if (areTip(nod, 'BreadcrumbList')) verificaFirimituri(nod, cale, erori);
    if (areTip(nod, 'FAQPage')) verificaIntrebari(nod, erori);
    if (areTip(nod, 'ItemList')) verificaLista(nod, erori);
  }

  return [...new Set(erori)];
}

// realpath pe ambele părți: printr-un symlink/junction argv[1] nu e realpath-uit, iar import.meta.url da.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const [fisier, cale] = process.argv.slice(2);
  if (!fisier || !cale) {
    console.error('Folosire: node scripts/check-schema.mjs <fisier.html> <cale>   (ex. dist/servicii/seo/index.html /servicii/seo/)');
    process.exit(1);
  }
  const erori = verificaGraf(readFileSync(fisier, 'utf8'), cale);
  if (erori.length > 0) {
    for (const eroare of erori) console.error(`check-schema ${cale}: ${eroare}`);
    process.exit(1);
  }
  console.log(`check-schema ${cale}: JSON-LD în regulă.`);
}
