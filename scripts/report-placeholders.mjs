// Scrie reports/placeholders.json: marcajele [DE COMPLETAT:#<nr>] rămase în src/**/*.{md,ts,astro},
// fără src/placeholders.ts (registrul însuși). Format: [{ fisier, nr, blocheaza }].
// Un marcaj repetat în același fișier apare o singură dată.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGISTRU } from '../src/placeholders.ts';

const RADACINA = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(RADACINA, 'src');
const IESIRE = join(RADACINA, 'reports', 'placeholders.json');
const EXTENSII = new Set(['.md', '.ts', '.astro']);
const EXCLUS = join(SRC, 'placeholders.ts');
const MARCAJ = /\[DE COMPLETAT:#(\d+)\]/g;

function* fisiere(dir) {
  for (const intrare of readdirSync(dir).sort()) {
    const cale = join(dir, intrare);
    if (statSync(cale).isDirectory()) yield* fisiere(cale);
    else if (EXTENSII.has(extname(cale)) && cale !== EXCLUS) yield cale;
  }
}

const raport = [];
const necunoscute = [];
for (const cale of fisiere(SRC)) {
  const fisier = relative(RADACINA, cale).split(sep).join('/');
  const numere = new Set();
  for (const m of readFileSync(cale, 'utf8').matchAll(MARCAJ)) numere.add(Number(m[1]));
  for (const nr of [...numere].sort((a, b) => a - b)) {
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
