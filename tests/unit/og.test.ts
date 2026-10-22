import { readFileSync } from 'node:fs';
import { CULORI, imagineOg, LINIA } from '../../src/lib/og';

// satori nu citește CSS, deci og.ts își ține o copie a culorilor; testul o ține la zi cu tokens.css.
test('culorile din og.ts sunt cele din tokens.css', () => {
  const tokenuri = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
  const tok = (nume: string) => new RegExp(String.raw`--${nume}\s*:\s*(#[0-9a-fA-F]{6})\b`).exec(tokenuri)?.[1]?.toUpperCase();
  expect({ ink: CULORI.ink, ink2: CULORI.ink2, paper: CULORI.paper, blue: CULORI.blue }).toEqual({
    ink: tok('ink'),
    ink2: tok('ink-2'),
    paper: tok('paper'),
    blue: tok('blue'),
  });
  expect(LINIA).toEqual({ vizibilitate: tok('blue'), diagnostic: tok('green'), constructie: tok('yellow'), reparatie: tok('red') });
});

// Imaginea Open Graph (§6.2, §3.7): 1200×630, PNG, cu fontul static Atkinson Hyperlegible Next 800 (latin + latin-ext).

/** Lățimea și înălțimea din antetul IHDR al unui PNG. */
function dimensiuni(png: Uint8Array): [number, number] {
  const v = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return [v.getUint32(16), v.getUint32(20)];
}

test('imaginea OG e un PNG de 1200×630', async () => {
  const png = await imagineOg({ titlu: 'Consultant SEO din București' });
  expect([...png.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(dimensiuni(png)).toEqual([1200, 630]);
});

test('merge și cu un titlu lung, cu ș și ț, și cu linia unui grup', async () => {
  const png = await imagineOg({ titlu: 'Întreținere și mentenanță site WordPress pentru firme din toată țara', grup: 'reparatie' });
  expect(dimensiuni(png)).toEqual([1200, 630]);
});

// §3.7: fișierul static nu are toate glifele din toate limbile; fiecare caracter din titlurile paginilor trebuie să existe
// în subsetul latin sau latin-ext 800, altfel satori l-ar desena lipsă fără nicio eroare.
test('fiecare caracter din titlurile paginilor are glifă în fontul imaginii OG', async () => {
  const { createRequire } = await import('node:module');
  const fontkit = await import('fontkit');
  const cere = createRequire(import.meta.url);
  const fonturi = ['latin', 'latin-ext'].map((subset) =>
    fontkit.openSync(cere.resolve(`@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-${subset}-800-normal.woff`)),
  ) as unknown as { hasGlyphForCodePoint(c: number): boolean }[];
  const { PAGINI_STATICE } = await import('../../src/lib/routes');
  const fisiere = import.meta.glob<{ frontmatter: { titlu: string } }>('../../src/content/**/*.md', { eager: true });
  const titluri = [...Object.values(PAGINI_STATICE).map((p) => p.titlu), ...Object.values(fisiere).map((m) => m.frontmatter.titlu), 'Alex Ionescu, consultant SEO'];
  const lipsa = [...new Set(titluri.join(''))].filter((c) => !fonturi.some((f) => f.hasGlyphForCodePoint(c.codePointAt(0) ?? 0)));
  expect(lipsa).toEqual([]);
});
