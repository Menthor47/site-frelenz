// Imaginea Open Graph a fiecărei pagini (§5.9, §6.2, §3.7): 1200×630, PNG, generată la build cu satori (HTML → SVG) și
// resvg (SVG → PNG), care merg la fel pe Windows și pe Linux. Fonturile sunt fișierele statice Atkinson Hyperlegible Next
// 800 și 400, latin și latin-ext (pentru ș, ț, ă, â, î): fișierul variabil nu merge, generatoarele l-ar desena la
// greutatea implicită.
// Imaginea e banda de sus a site-ului (SEO-01, auditul UI/UX din 2026-10-24): pe --noapte, logo-ul ca în antet, apoi harta
// de metrou (traseele din src/lib/harta.ts) cu titlul paginii pe plăcuța albă de stație, ca H1-ul de pe Acasă.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import type { Grup } from '../form-rules';
import { LINIA_GRUPULUI, type Linie, ordineaDesenarii } from './harta';

// resvg are un modul nativ (.node) încărcat prin `__dirname`: se cere direct din Node, nu prin bundler-ul lui Vite.
// Tot prin `require` se găsesc și fișierele fontului, oricare ar fi directorul din care rulează build-ul.
const cere = createRequire(import.meta.url);
const { Resvg } = cere('@resvg/resvg-js') as typeof import('@resvg/resvg-js');

const LATIME = 1200;
const INALTIME = 630;

/** Culorile din src/styles/tokens.css (§5.2); satori nu citește CSS-ul site-ului, iar og.test.ts le compară cu tokenurile. */
export const CULORI = {
  ink: '#14161A',
  paper: '#FFFFFF',
  blue: '#2D6CDF',
  noapte: '#0E1116',
  noapteText: '#E8ECF2',
  noapteText2: '#A7B0BE',
  noapteContur: '#2A313C',
} as const;

/** Culorile tari ale liniilor M1–M4 (§5.1), ca în metro.css: pe întuneric liniile sunt decor, deci galbenul tare e permis. */
export const CULOAREA_LINIEI: Readonly<Record<Linie, string>> = {
  M1: '#F5B21B',
  M2: '#2D6CDF',
  M3: '#E0533D',
  M4: '#1F9D61',
};

/** Opacitatea liniilor estompate, ca pe banda de sus (metro.css). */
export const ESTOMPAT = 0.35;

/** Înălțimea antetului (cu linia de 2px de sub el); harta și plăcuța stau dedesubt. */
export const ANTET = 128;

// Harta se mărește de 1,25 ori, ca liniile și stațiile să se vadă și în miniatura din WhatsApp sau LinkedIn. Pe lățime
// încap 960 de unități din cele 1200, din mijloc, deci liniile ies din imagine ca pe banda de pe telefon. Pe înălțime,
// cadrul se strânge pe linii și stații (y între 28 și 212), ca harta să stea centrată cu plăcuța.
const SCARA = 1.25;
const CADRU = { x: 120, y: 28, latime: LATIME / SCARA, inaltime: 184 } as const;
// Plăcuța începe la y = 139 din desen, ca pe Acasă (58% din înălțimea hărții): M2 (120) rămâne deasupra ei, iar M1 și
// M3 (160) și M4 (200) intră pe sub ea.
const SUS_PLACUTA = (139 - CADRU.y) * SCARA;
const MARGINE = 64;

/** Harta ca SVG: linia grupului e plină, celelalte sunt estompate; fără grup, toate sunt pline, ca pe Acasă. */
export function hartaOg(grup?: Grup): string {
  const plina = grup === undefined ? undefined : LINIA_GRUPULUI[grup];
  const linii = ordineaDesenarii(plina).map((t) => {
    const statii = t.statii
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${CULORI.noapte}" stroke="${CULORI.noapteText}" stroke-width="3"/>`)
      .join('');
    // Opacitatea e pe grup, ca în metro.css: stațiile își acoperă linia înainte de compunere, deci linia nu se vede prin ele.
    return (
      `<g opacity="${plina === undefined || t.linie === plina ? 1 : ESTOMPAT}">` +
      `<path d="${t.d}" fill="none" stroke="${CULOAREA_LINIEI[t.linie]}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>` +
      `${statii}</g>`
    );
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CADRU.x} ${CADRU.y} ${CADRU.latime} ${CADRU.inaltime}">${linii.join('')}</svg>`;
}

// Fiecare subset are numele lui: cu același nume, satori ar lua doar primul fișier și ar desena ș și ț lipsă.
const font = (subset: string, weight: 400 | 800) => ({
  name: `Atkinson ${subset}`,
  data: readFileSync(cere.resolve(`@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-${subset}-${weight}-normal.woff`)),
  weight,
  style: 'normal' as const,
});
const FONTURI = [font('latin', 800), font('latin-ext', 800), font('latin', 400), font('latin-ext', 400)];

// fontkit n-are tipuri proprii; aici trebuie doar lățimea literelor din fonturile titlului (800).
type FontMasurat = { unitsPerEm: number; hasGlyphForCodePoint(cod: number): boolean; glyphForCodePoint(cod: number): { advanceWidth: number } };
const fontkit = cere('fontkit') as { create(date: Buffer): FontMasurat };
const [LATIN_800, ...ALTE_800] = FONTURI.filter((f) => f.weight === 800).map((f) => fontkit.create(f.data)) as [FontMasurat, ...FontMasurat[]];

/** Spațierea literelor din titlu, în em (§5.3: −0,01em … −0,02em la mărimile mari). */
const SPATIERE = -0.02;

/**
 * Lățimea celui mai lung cuvânt din titlu, în em, cu spațierea titlului. E suma lățimilor literelor, din subsetul care are
 * litera, ca la satori; fără kerning, care doar strânge literele, deci iese cel mult puțin mai lată decât desenul.
 */
function celMaiLungCuvant(titlu: string): number {
  const litera = (l: string) => {
    const cod = l.codePointAt(0) ?? 0;
    const f = [LATIN_800, ...ALTE_800].find((x) => x.hasGlyphForCodePoint(cod)) ?? LATIN_800;
    return f.glyphForCodePoint(cod).advanceWidth / f.unitsPerEm + SPATIERE;
  };
  return Math.max(...titlu.split(' ').map((cuvant) => [...cuvant].reduce((latime, l) => latime + litera(l), 0)));
}

type Copii = Nod | string | (Nod | string)[] | undefined;
type Nod = { type: string; props: { style?: Record<string, unknown> | undefined; children?: Copii; [atribut: string]: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: Copii, atribute: Record<string, unknown> = {}): Nod => ({
  type,
  props: { ...atribute, style, children },
});

/** Titlurile lungi primesc un corp mai mic, ca plăcuța să aibă cel mult trei rânduri. */
const marimeTitlu = (titlu: string) => (titlu.length > 44 ? 68 : titlu.length > 30 ? 76 : titlu.length > 12 ? 88 : 104);

export interface DateOg {
  titlu: string;
  grup?: Grup | undefined;
}

export async function imagineOg({ titlu, grup }: DateOg): Promise<Uint8Array> {
  const harta = `data:image/svg+xml;base64,${Buffer.from(hartaOg(grup)).toString('base64')}`;
  const marime = marimeTitlu(titlu);

  const pagina = el(
    'div',
    {
      width: LATIME,
      height: INALTIME,
      display: 'flex',
      flexDirection: 'column',
      background: CULORI.noapte,
      fontFamily: 'Atkinson latin, Atkinson latin-ext',
      overflow: 'hidden',
    },
    [
      // Antetul: logo-ul ca pe site (§5.4), pe antetul întunecat, cu linia de 1px de sub antet (aici 2px, ca să nu se piardă
      // la micșorare).
      el('div', { display: 'flex', alignItems: 'center', height: ANTET, padding: `0 ${MARGINE}px`, borderBottom: `2px solid ${CULORI.noapteContur}`, fontSize: 44 }, [
        el('span', { fontWeight: 800, color: CULORI.paper }, 'Alex Ionescu'),
        el('span', { fontWeight: 800, color: CULORI.blue }, ','),
        el('span', { fontWeight: 400, color: CULORI.noapteText2, marginLeft: '0.25em' }, 'consultant SEO'),
      ]),
      // Harta și plăcuța stau împreună, centrate în restul imaginii: plăcuța coboară peste marginea de jos a hărții.
      el('div', { display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center' }, [
        el('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative' }, [
          el('img', { position: 'absolute', top: 0, left: 0, width: LATIME, height: CADRU.inaltime * SCARA }, undefined, {
            src: harta,
            width: LATIME,
            height: CADRU.inaltime * SCARA,
          }),
          // Plăcuța de stație: albă și opacă, cu colțuri drepte și text --ink (18,11:1), ca pe Acasă; `position` o pune
          // deasupra hărții, ca liniile să treacă pe sub ea. Cu `balance`, satori rupe rândurile egal și strânge plăcuța
          // pe text; fără el, un titlu pe două rânduri ar întinde plăcuța pe toată lățimea. `balance` caută însă cea mai
          // mică lățime cu același număr de rânduri și poate coborî sub un cuvânt care nu se rupe („Contact”, sau
          // „confidențialitate” singur pe rând), care ar ieși din plăcuță. `minWidth` o ține cel puțin cât cel mai lung
          // cuvânt, plus padding-ul (0,5em pe fiecare parte).
          el(
            'div',
            {
              display: 'flex',
              position: 'relative',
              marginTop: SUS_PLACUTA,
              marginLeft: MARGINE,
              minWidth: Math.ceil((celMaiLungCuvant(titlu) + 1) * marime),
              maxWidth: LATIME - 2 * MARGINE,
              padding: '0.35em 0.5em 0.4em',
              background: CULORI.paper,
              color: CULORI.ink,
              fontSize: marime,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: `${SPATIERE}em`,
              textWrap: 'balance',
            },
            titlu,
          ),
        ]),
      ]),
    ],
  );

  const svg = await satori(pagina as unknown as Parameters<typeof satori>[0], { width: LATIME, height: INALTIME, fonts: FONTURI });
  // Fără fonturile sistemului: satori a transformat deja textul în contururi, deci build-ul e același pe orice mașină.
  return new Resvg(svg, { fitTo: { mode: 'width', value: LATIME }, font: { loadSystemFonts: false } }).render().asPng();
}
