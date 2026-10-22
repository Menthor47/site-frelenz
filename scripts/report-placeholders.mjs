// Scrie reports/placeholders.json: marcajele rămase în src/**/*.{md,ts,astro}, fără src/placeholders.ts (registrul
// însuși). Format: [{ fisier, nr, blocheaza }]. Un marcaj repetat în același fișier apare o singură dată.
// Marcajele au două forme: valoarea `[DE COMPLETAT:#<nr>]` (conținut, config) și componenta `<Placeholder nr={<nr>} />`
// (pagini .astro); amândouă trebuie văzute, altfel un rând blocant n-ar putea bloca lansarea (check:launch).
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REGISTRU } from '../src/placeholders.ts';

const RADACINA = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(RADACINA, 'src');
const IESIRE = join(RADACINA, 'reports', 'placeholders.json');
const EXTENSII = new Set(['.md', '.ts', '.astro']);
const EXCLUS = join(SRC, 'placeholders.ts');
// Paginile interne de test (/_test/…) se construiesc doar cu DRAFT=1: marcajele lor nu ajung niciodată în producție.
const INTERN = join(SRC, 'pages', '[intern]');
const FORME = [/\[DE COMPLETAT:#(\d+)\]/g, /<Placeholder\s+nr=\{(\d+)\}/g];

/** Numerele marcajelor dintr-un text, fiecare o dată, crescător. */
export function marcajeDinText(text) {
  const numere = new Set();
  for (const forma of FORME) for (const m of text.matchAll(forma)) numere.add(Number(m[1]));
  return [...numere].sort((a, b) => a - b);
}

function* fisiere(dir) {
  for (const intrare of readdirSync(dir).sort()) {
    const cale = join(dir, intrare);
    if (statSync(cale).isDirectory()) {
      if (cale !== INTERN) yield* fisiere(cale);
    } else if (EXTENSII.has(extname(cale)) && cale !== EXCLUS) yield cale;
  }
}

function scrieRaport() {
  const raport = [];
  const necunoscute = [];
  for (const cale of fisiere(SRC)) {
    const fisier = relative(RADACINA, cale).split(sep).join('/');
    for (const nr of marcajeDinText(readFileSync(cale, 'utf8'))) {
      const rand = REGISTRU[nr];
      if (!rand) {
        necunoscute.push(`${fisier}: #${nr}`);
        continue;
      }
      raport.push({ fisier, nr, blocheaza: rand.blocheaza });
    }
  }

  if (necunoscute.length > 0) {
    console.error(`Marcaje cu număr absent din src/placeholders.ts:\n  ${necunoscute.join('\n  ')}`);
    process.exit(1);
  }

  mkdirSync(dirname(IESIRE), { recursive: true });
  writeFileSync(IESIRE, `${JSON.stringify(raport, null, 2)}\n`);
  const blocante = raport.filter((r) => r.blocheaza).length;
  console.log(`reports/placeholders.json: ${raport.length} marcaje (${blocante} blocante)`);
}

// Scrie raportul doar când e rulat ca script (`npm run report:placeholders`), nu când îl importă un test.
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) scrieRaport();
