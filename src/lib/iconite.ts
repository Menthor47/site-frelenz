// Iconițele PNG (§5.4), desenate la build din public/favicon.svg cu resvg, ca stația să aibă o singură sursă:
// - /favicon-96.png: pentru programele care nu citesc SVG; favicon.svg rămâne iconița principală;
// - /apple-touch-icon.png: pentru ecranul de start al iPhone-ului. iOS umple transparența cu negru, deci stația stă pe
//   fundalul antetului (--noapte), ca „Ești aici” pe bandă, cu o margine pe care iOS o poate rotunji la colțuri.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

// resvg are un modul nativ (.node) încărcat prin `__dirname`: se cere direct din Node, nu prin bundler-ul lui Vite (ca în og.ts).
const cere = createRequire(import.meta.url);
const { Resvg } = cere('@resvg/resvg-js') as typeof import('@resvg/resvg-js');

// Build-ul și testele rulează din rădăcina proiectului. public/ nu trece prin Vite, deci fișierele se citesc de pe disc.
const citeste = (...cale: string[]) => readFileSync(join(process.cwd(), ...cale), 'utf8');

/** Valoarea unui token de culoare din src/styles/tokens.css (§5.2), ca iconița să nu-și țină o copie a culorii. */
function token(nume: string): string {
  const valoare = new RegExp(String.raw`--${nume}\s*:\s*(#[0-9a-fA-F]{6})\b`).exec(citeste('src', 'styles', 'tokens.css'))?.[1];
  if (valoare === undefined) throw new Error(`Tokenul --${nume} lipsește din src/styles/tokens.css`);
  return valoare;
}

const png = (svg: string, latura: number) => new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: latura } }).render().asPng());

/** Favicon-ul ca PNG de 96×96, transparent în jurul stației, ca SVG-ul. */
export function faviconPng(): Uint8Array<ArrayBuffer> {
  return png(citeste('public', 'favicon.svg'), 96);
}

/** Iconița Apple: 180×180, stația pe fundal opac --noapte, cu o margine de o șesime din latură pe fiecare parte. */
export function iconitaApple(): Uint8Array<ArrayBuffer> {
  const favicon = citeste('public', 'favicon.svg');
  const cutie = /viewBox="([^"]+)"/.exec(favicon)?.[1];
  if (cutie === undefined) throw new Error('public/favicon.svg nu are viewBox');
  const desen = favicon.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return png(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="${token('noapte')}"/><svg x="8" y="8" width="32" height="32" viewBox="${cutie}">${desen}</svg></svg>`,
    180,
  );
}
