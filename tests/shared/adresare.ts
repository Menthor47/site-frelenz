// Regula de text din §8 (ruling R3), într-un singur loc: o folosesc testele pe pagină (tests/e2e/helpers.ts) și testele
// de conținut (tests/unit). Fără importuri, ca să meargă și în Playwright, și în vitest.

/**
 * Adresarea formală și promisiunile interzise (§8, ruling R3). Limite Unicode: `\b` din JS e doar ASCII și n-ar prinde „vă”.
 */
const ADRESARE_FORMALA = /(?<!\p{L})(?:vă|dumneavoastr\p{L}*|cereți|trimiteți)(?!\p{L})|garantat|prima pagină/giu;

/** Fragmentele din `text` care adresează formal sau promit ceva interzis, cu puțin context. Gol = textul e curat. */
export function adresareFormala(text: string): string[] {
  return [...text.matchAll(ADRESARE_FORMALA)].map((m) => {
    const de = m.index ?? 0;
    return `„${m[0]}” în „…${text.slice(Math.max(0, de - 25), de + m[0].length + 25).replace(/\s+/g, ' ')}…”`;
  });
}
