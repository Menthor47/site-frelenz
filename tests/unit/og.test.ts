import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { GRUPURI, type Grup } from '../../src/form-rules';
import { LINIA_GRUPULUI, type Linie } from '../../src/lib/harta';
import { ANTET, CULOAREA_LINIEI, CULORI, ESTOMPAT, imagineOg } from '../../src/lib/og';

// Lista paginilor vine din colecții; aici, din ciornele reale din src/content, ca în routes.test.ts.
const fisiere = {
  servicii: import.meta.glob<{ frontmatter: Record<string, unknown> }>('../../src/content/servicii/*.md', { eager: true }),
  proiecte: import.meta.glob<{ frontmatter: Record<string, unknown> }>('../../src/content/proiecte/*.md', { eager: true }),
  ghiduri: import.meta.glob<{ frontmatter: Record<string, unknown> }>('../../src/content/ghiduri/*.md', { eager: true }),
};

vi.mock('astro:content', () => ({
  getCollection: async (nume: keyof typeof fisiere) =>
    Object.values(fisiere[nume]).map(({ frontmatter: f }, i) => ({
      id: `${nume}-${i}`,
      data: Object.fromEntries(Object.entries(f).map(([k, v]) => [k, ['publicat', 'actualizat'].includes(k) ? new Date(String(v)) : v])),
    })),
}));

// satori nu citește CSS, deci og.ts își ține o copie a culorilor; testul o ține la zi cu tokens.css și cu metro.css.
test('culorile din og.ts sunt cele din tokens.css, iar liniile au culorile din metro.css', () => {
  const tokenuri = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
  const tok = (nume: string) => new RegExp(String.raw`--${nume}\s*:\s*(#[0-9a-fA-F]{6})\b`).exec(tokenuri)?.[1]?.toUpperCase();
  expect(CULORI).toEqual({
    ink: tok('ink'),
    paper: tok('paper'),
    blue: tok('blue'),
    noapte: tok('noapte'),
    noapteText: tok('noapte-text'),
    noapteText2: tok('noapte-text-2'),
    noapteContur: tok('noapte-contur'),
  });

  const metro = readFileSync(new URL('../../src/styles/metro.css', import.meta.url), 'utf8');
  const tokenulLiniei = (linie: Linie) => new RegExp(String.raw`\[data-linie='${linie}'\]\s*\{\s*--culoare:\s*var\(--([a-z-]+)\)`).exec(metro)?.[1];
  for (const linie of ['M1', 'M2', 'M3', 'M4'] as const) {
    const nume = tokenulLiniei(linie);
    expect(nume, `tokenul liniei ${linie} în metro.css`).toBeDefined();
    expect(CULOAREA_LINIEI[linie], linie).toBe(tok(nume ?? ''));
  }
  expect(metro).toMatch(new RegExp(String.raw`\.harta--banda \.harta__linie\s*\{\s*opacity:\s*${ESTOMPAT};`));
});

// Imaginea Open Graph (§5.9, §6.2, §3.7): 1200×630, PNG, cu fonturile statice Atkinson Hyperlegible Next 800 și 400.

/** Lățimea și înălțimea din antetul IHDR al unui PNG. */
function dimensiuni(png: Uint8Array): [number, number] {
  const v = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return [v.getUint32(16), v.getUint32(20)];
}

type Imagine = { latime: number; inaltime: number; rgba: Uint8Array };

/** Pixelii unui PNG RGBA de 8 biți, neîntrețesut, cum îl scrie resvg: blocurile IDAT dezarhivate, cu filtrele desfăcute. */
function pixeli(png: Uint8Array): Imagine {
  const v = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const [latime, inaltime] = dimensiuni(png);
  expect([png[24], png[25], png[28]], 'PNG RGBA de 8 biți, neîntrețesut').toEqual([8, 6, 0]);
  const idat: Uint8Array[] = [];
  for (let i = 8; i < png.length; ) {
    const lungime = v.getUint32(i);
    if (String.fromCharCode(...png.subarray(i + 4, i + 8)) === 'IDAT') idat.push(png.subarray(i + 8, i + 8 + lungime));
    i += 12 + lungime;
  }
  const date = inflateSync(Buffer.concat(idat));
  const rand = latime * 4;
  const rgba = new Uint8Array(rand * inaltime);
  for (let y = 0; y < inaltime; y++) {
    const filtru = date[y * (rand + 1)];
    for (let x = 0; x < rand; x++) {
      const brut = date[y * (rand + 1) + 1 + x] ?? 0;
      const a = x >= 4 ? (rgba[y * rand + x - 4] ?? 0) : 0;
      const b = y > 0 ? (rgba[(y - 1) * rand + x] ?? 0) : 0;
      const c = x >= 4 && y > 0 ? (rgba[(y - 1) * rand + x - 4] ?? 0) : 0;
      const p = a + b - c;
      const paeth = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
      const predictie = [0, a, b, (a + b) >> 1, paeth][filtru ?? 0] ?? 0;
      rgba[y * rand + x] = (brut + predictie) & 0xff;
    }
  }
  return { latime, inaltime, rgba };
}

const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** Culoarea unei linii estompate peste --noapte, cum o compune opacitatea grupului. */
const estompata = (hex: string) => {
  const fundal = rgb(CULORI.noapte);
  return rgb(hex).map((c, i) => ESTOMPAT * c + (1 - ESTOMPAT) * (fundal[i] ?? 0)) as [number, number, number];
};

/** Pixelii care au culoarea dată, cu o toleranță pe canal; implicit, doar sub antet, unde stau harta și plăcuța. */
function cauta({ latime, inaltime, rgba }: Imagine, [r, g, b]: [number, number, number], toleranta = 0, [deLa, panaLa] = [ANTET, inaltime]) {
  const gasiti: [number, number][] = [];
  for (let y = deLa; y < panaLa; y++) {
    for (let x = 0; x < latime; x++) {
      const i = (y * latime + x) * 4;
      if (Math.abs((rgba[i] ?? 0) - r) <= toleranta && Math.abs((rgba[i + 1] ?? 0) - g) <= toleranta && Math.abs((rgba[i + 2] ?? 0) - b) <= toleranta) gasiti.push([x, y]);
    }
  }
  return gasiti;
}

const culoarea = ({ latime, rgba }: Imagine, x: number, y: number) => [...rgba.subarray((y * latime + x) * 4, (y * latime + x) * 4 + 3)];

/** Dreptunghiul care cuprinde punctele: stânga, dreapta, sus, jos (fără `Math.min(...)`, care nu duce sute de mii de argumente). */
const margini = (puncte: [number, number][]) =>
  puncte.reduce<[number, number, number, number]>(
    ([s, d, sus, jos], [x, y]) => [Math.min(s, x), Math.max(d, x), Math.min(sus, y), Math.max(jos, y)],
    [Infinity, -Infinity, Infinity, -Infinity],
  );

test('imaginea OG e un PNG de 1200×630', async () => {
  const png = await imagineOg({ titlu: 'Consultant SEO din București' });
  expect([...png.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(dimensiuni(png)).toEqual([1200, 630]);
});

test('fundalul e --noapte, cu logo-ul în antet (alb, virgula albastră) și plăcuța albă dedesubt', async () => {
  const img = pixeli(await imagineOg({ titlu: 'Consultant SEO din București' }));
  for (const [x, y] of [[2, 2], [1197, 2], [2, 627], [1197, 627]] as const) expect(culoarea(img, x, y), `colțul ${x},${y}`).toEqual(rgb(CULORI.noapte));
  const antet = (hex: string, toleranta = 0) => cauta(img, rgb(hex), toleranta, [0, ANTET]).length;
  expect(antet(CULORI.paper), '„Alex Ionescu”, alb').toBeGreaterThan(500);
  expect(antet(CULORI.blue), 'virgula albastră').toBeGreaterThan(20);
  expect(antet(CULORI.noapteText2, 2), '„consultant SEO”, în --noapte-text-2').toBeGreaterThan(200);
  expect(cauta(img, rgb(CULORI.paper)).length, 'plăcuța albă').toBeGreaterThan(50_000);
});

test.each(GRUPURI)('grupul %s: linia lui e plină, celelalte sunt estompate', async (grup: Grup) => {
  const img = pixeli(await imagineOg({ titlu: 'Audit SEO pentru site-ul tău', grup }));
  for (const linie of ['M1', 'M2', 'M3', 'M4'] as const) {
    const plina = cauta(img, rgb(CULOAREA_LINIEI[linie])).length;
    const estompate = cauta(img, estompata(CULOAREA_LINIEI[linie]), 2).length;
    if (linie === LINIA_GRUPULUI[grup]) {
      expect(plina, `${linie}, linia grupului, plină`).toBeGreaterThan(1000);
      expect(estompate, `${linie}, linia grupului, nu e estompată`).toBe(0);
    } else {
      expect(plina, `${linie}, altă linie, nu e plină`).toBe(0);
      expect(estompate, `${linie}, altă linie, estompată`).toBeGreaterThan(1000);
    }
  }
});

test('fără grup (Acasă, Servicii, Contact…), toate liniile sunt pline', async () => {
  const img = pixeli(await imagineOg({ titlu: 'Contact' }));
  for (const linie of ['M1', 'M2', 'M3', 'M4'] as const) {
    expect(cauta(img, rgb(CULOAREA_LINIEI[linie])).length, linie).toBeGreaterThan(1000);
    expect(cauta(img, estompata(CULOAREA_LINIEI[linie]), 2).length, linie).toBe(0);
  }
});

// Plăcuța se strânge pe titlu (§5.9), dar nu sub cel mai lung cuvânt: un cuvânt singur pe rând ieșea din ea.
test.each([
  ['Contact', 600],
  ['Politica de confidențialitate', 900],
  ['Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)', 1072],
])('„%s” stă întreg pe plăcuță, care nu e mai lată de %ipx', async (titlu, maxim) => {
  const img = pixeli(await imagineOg({ titlu }));
  const [stanga, dreapta, sus, jos] = margini(cauta(img, rgb(CULORI.paper)));
  expect(stanga, 'plăcuța începe la marginea din stânga').toBe(64);
  expect(dreapta - stanga + 1, 'lățimea plăcuței').toBeLessThanOrEqual(maxim);
  const text = cauta(img, rgb(CULORI.ink));
  expect(text.length, 'titlul e desenat').toBeGreaterThan(1000);
  const afara = text.filter(([x, y]) => x < stanga || x > dreapta || y < sus || y > jos);
  expect(afara, 'litere în afara plăcuței').toEqual([]);
});

// ș și ț se desenează cu virgula de dedesubt (§5.3), nu ca o literă lipsă: sub rândul cel mai de jos al lui s și t
// trebuie să mai fie cerneală.
test.each([
  ['ș', 's'],
  ['ț', 't'],
])('%s are virgula de dedesubt', async (cuVirgula, fara) => {
  const jos = async (titlu: string) => margini(cauta(pixeli(await imagineOg({ titlu })), rgb(CULORI.ink)))[3];
  expect(await jos(`A${cuVirgula}a`)).toBeGreaterThan((await jos(`A${fara}a`)) + 10);
});

test('ruta /og/ dă fiecărei pagini titlul și grupul ei, deci linia ei pe imagine', async () => {
  const { getStaticPaths } = await import('../../src/pages/og/[...cale].png');
  const { paginiConstruite } = await import('../../src/lib/routes');
  const cai = await getStaticPaths();
  const pagini = await paginiConstruite(false);
  expect(cai.map((c) => c.props)).toEqual(pagini.map((p) => ({ titlu: p.titlu, grup: p.grup })));
  const servicii = cai.filter((c) => c.params.cale.startsWith('servicii/'));
  expect(servicii.length).toBe(6);
  for (const s of servicii) expect(s.props.grup, s.params.cale).toBeDefined();
  expect(cai.find((c) => c.params.cale === 'index')?.props.grup).toBeUndefined();
});

test('merge și cu un titlu lung, cu ș și ț, și cu linia unui grup', async () => {
  const png = await imagineOg({ titlu: 'Întreținere și mentenanță site WordPress pentru firme din toată țara', grup: 'reparatie' });
  expect(dimensiuni(png)).toEqual([1200, 630]);
});

// §3.7: fișierul static nu are toate glifele din toate limbile; fiecare caracter din titlurile paginilor trebuie să existe
// în subsetul latin sau latin-ext 800, altfel satori l-ar desena lipsă fără nicio eroare. „consultant SEO” e în 400.
test('fiecare caracter din titlurile paginilor are glifă în fontul imaginii OG', async () => {
  const { createRequire } = await import('node:module');
  const fontkit = await import('fontkit');
  const cere = createRequire(import.meta.url);
  const fonturi = (greutate: number) =>
    ['latin', 'latin-ext'].map((subset) =>
      fontkit.openSync(cere.resolve(`@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-${subset}-${greutate}-normal.woff`)),
    ) as unknown as { hasGlyphForCodePoint(c: number): boolean }[];
  const { PAGINI_STATICE } = await import('../../src/lib/routes');
  const fisiereMd = import.meta.glob<{ frontmatter: { titlu: string } }>('../../src/content/**/*.md', { eager: true });
  const titluri = [...Object.values(PAGINI_STATICE).map((p) => p.titlu), ...Object.values(fisiereMd).map((m) => m.frontmatter.titlu), 'Alex Ionescu,'];
  const lipsa = (text: string, greutate: number) => [...new Set(text)].filter((c) => !fonturi(greutate).some((f) => f.hasGlyphForCodePoint(c.codePointAt(0) ?? 0)));
  expect(lipsa(titluri.join(''), 800)).toEqual([]);
  expect(lipsa('consultant SEO', 400)).toEqual([]);
});
