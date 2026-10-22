// Imaginea Open Graph a fiecărei pagini (§6.2, §3.7): 1200×630, PNG, generată la build cu satori (HTML → SVG) și resvg
// (SVG → PNG), care merg la fel pe Windows și pe Linux. Fontul e fișierul static Atkinson Hyperlegible Next 800, latin și
// latin-ext (pentru ș, ț, ă, â, î): fișierul variabil nu merge, generatoarele l-ar desena la greutatea implicită.
// Pe imagine: logo-ul ca text, titlul paginii și o linie de metrou în culoarea grupului paginii (albastru, fără grup).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import satori from 'satori';
import type { Grup } from '../form-rules';

// resvg are un modul nativ (.node) încărcat prin `__dirname`: se cere direct din Node, nu prin bundler-ul lui Vite.
const { Resvg } = createRequire(import.meta.url)('@resvg/resvg-js') as typeof import('@resvg/resvg-js');

const LATIME = 1200;
const INALTIME = 630;

/** Culorile din src/styles/tokens.css (§5.2); satori nu citește CSS-ul site-ului. */
const CULORI = { ink: '#14161A', ink2: '#3F4650', paper: '#FFFFFF', blue: '#2D6CDF' } as const;

/** Liniile M1–M4 (§5.1): pe imagine linia e decor, deci galbenul tare e permis, ca pe harta din bandă. */
const LINIA: Readonly<Record<Grup, string>> = {
  vizibilitate: '#2D6CDF',
  diagnostic: '#1F9D61',
  constructie: '#F5B21B',
  reparatie: '#E0533D',
};

const FONTURI = ['latin', 'latin-ext'].map((subset) => ({
  name: `Atkinson ${subset}`,
  data: readFileSync(join(process.cwd(), 'node_modules', '@fontsource', 'atkinson-hyperlegible-next', 'files', `atkinson-hyperlegible-next-${subset}-800-normal.woff`)),
  weight: 800 as const,
  style: 'normal' as const,
}));

type Nod = { type: string; props: { style?: Record<string, unknown> | undefined; children?: Nod | string | (Nod | string)[] | undefined } };
const el = (type: string, style: Record<string, unknown>, children?: Nod['props']['children']): Nod => ({ type, props: { style, children } });

/** Titlurile lungi primesc un corp mai mic, ca să încapă pe cel mult trei rânduri. */
const marimeTitlu = (titlu: string) => (titlu.length > 60 ? 54 : titlu.length > 36 ? 64 : 76);

export interface DateOg {
  titlu: string;
  grup?: Grup | undefined;
}

export async function imagineOg({ titlu, grup }: DateOg): Promise<Uint8Array> {
  const culoare = grup === undefined ? CULORI.blue : LINIA[grup];
  const statie = el('div', { width: 44, height: 44, borderRadius: 22, background: CULORI.paper, border: `7px solid ${CULORI.ink}` });

  const pagina = el(
    'div',
    {
      width: LATIME,
      height: INALTIME,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px 80px',
      background: CULORI.paper,
      fontFamily: 'Atkinson latin, Atkinson latin-ext',
      color: CULORI.ink,
    },
    [
      el('div', { display: 'flex', fontSize: 38 }, [
        el('span', {}, 'Alex Ionescu'),
        el('span', { color: CULORI.blue }, ','),
        el('span', { color: CULORI.ink2, marginLeft: 12 }, 'consultant SEO'),
      ]),
      el('div', { display: 'flex', fontSize: marimeTitlu(titlu), lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 1000 }, titlu),
      el('div', { display: 'flex', alignItems: 'center', position: 'relative', height: 44 }, [
        el('div', { position: 'absolute', left: 0, right: 0, top: 13, height: 18, borderRadius: 9, background: culoare }),
        el('div', { display: 'flex', width: '100%', justifyContent: 'space-between' }, [statie, statie, statie, statie]),
      ]),
    ],
  );

  const svg = await satori(pagina as unknown as Parameters<typeof satori>[0], { width: LATIME, height: INALTIME, fonts: FONTURI });
  return new Resvg(svg, { fitTo: { mode: 'width', value: LATIME } }).render().asPng();
}
