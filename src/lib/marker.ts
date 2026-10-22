import { REGISTRU } from '../placeholders';

// Un marcaj e valoarea `[DE COMPLETAT:#<nr>]`, unde <nr> e rândul din registru (spec 3.4).
// Expresia fără `g`: `test` și `exec` nu păstrează stare între apeluri.
const MARCAJ = /\[DE COMPLETAT:#(\d+)\]/;

/** Numărul rândului din primul marcaj al valorii, sau `null` dacă nu are marcaj. */
export function parseMarker(v: string): number | null {
  const m = MARCAJ.exec(v);
  return m?.[1] === undefined ? null : Number(m[1]);
}

export function hasMarker(v: string): boolean {
  return MARCAJ.test(v);
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * HTML-ul marcajului pentru previzualizarea `DRAFT=1`.
 * În producție (`draft` fals) întoarce șirul gol, deci „[DE COMPLETAT” nu ajunge în `dist/`.
 * Fără atribut `style` (CSP); aspectul vine din clasa `marcaj`.
 */
export function renderMarker(nr: number, draft: boolean): string {
  if (!draft) return '';
  const rand = REGISTRU[nr];
  if (!rand) throw new Error(`Marcaj necunoscut: #${nr} nu există în src/placeholders.ts`);
  return `<mark class="marcaj">[DE COMPLETAT:#${nr}] — ${escapeHtml(rand.ce)}</mark>`;
}

/**
 * Ce rămâne de afișat dintr-o listă (§3.4): în producție, valorile cu marcaj lipsesc; în previzualizarea DRAFT=1 rămân
 * toate, iar marcajul trece prin `Placeholder`. `areMarcaj` spune ce înseamnă „cu marcaj” pentru un element.
 */
export function faraMarcaje<T>(lista: readonly T[], areMarcaj: (x: T) => boolean, draft: boolean): readonly T[] {
  return draft ? lista : lista.filter((x) => !areMarcaj(x));
}
