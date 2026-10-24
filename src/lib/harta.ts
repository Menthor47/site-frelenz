// Geometria hărții de metrou (§5.6), într-un singur loc: o desenează MetroMap.astro (Acasă și banda de sus) și imaginile
// Open Graph (src/lib/og.ts), care nu pot importa o componentă Astro.
import type { Grup } from '../form-rules';

export type Linie = 'M1' | 'M2' | 'M3' | 'M4';

/** Grupurile pe linii (§5.1): construcție M1 galben, vizibilitate M2 albastru, reparație M3 roșu, diagnostic M4 verde. */
export const LINIA_GRUPULUI: Readonly<Record<Grup, Linie>> = {
  constructie: 'M1',
  vizibilitate: 'M2',
  reparatie: 'M3',
  diagnostic: 'M4',
};

export interface Traseu {
  readonly linie: Linie;
  /** Doar segmente orizontale și la 45°, în unitățile desenului (1200×240). */
  readonly d: string;
  readonly statii: readonly (readonly [number, number])[];
  /** Stația pe care stă „Ești aici”. E în mijlocul desenului, ca să se vadă și la 320px (x între 333 și 867). */
  readonly aici: readonly [number, number];
  /** Eticheta stă deasupra stației sau dedesubt, unde nu calcă pe altă linie. */
  readonly eticheta: 'sus' | 'jos';
  /** Secundele unui drum dintr-un capăt în celălalt (§5.6: 7–11) și locul din tur de unde pleacă trenul (0–1). */
  readonly tren: { readonly drum: number; readonly plecare: number };
}

// Liniile se împletesc: la stânga, de sus în jos, M1, M2, M3, M4; la dreapta, invers. Se schimbă la 45°,
// iar unde se întâlnesc pe M2 au stații de corespondență (400, 640 și 840).
// Ordinea e și ordinea desenării: M2 trece pe deasupra.
export const TRASEE: readonly Traseu[] = [
  {
    linie: 'M1',
    d: 'M100 40H560L680 160H1160',
    statii: [[200, 40], [330, 40], [460, 40], [640, 120], [960, 160], [1090, 160]],
    aici: [460, 40],
    eticheta: 'sus',
    tren: { drum: 9, plecare: 0.15 },
  },
  {
    linie: 'M3',
    d: 'M40 160H360L440 80H1120',
    statii: [[130, 160], [260, 160], [400, 120], [520, 80], [700, 80], [1000, 80]],
    aici: [700, 80],
    eticheta: 'sus',
    tren: { drum: 10, plecare: 0.35 },
  },
  {
    linie: 'M4',
    d: 'M160 200H760L920 40H1140',
    statii: [[260, 200], [420, 200], [600, 200], [840, 120], [1040, 40]],
    aici: [600, 200],
    eticheta: 'sus',
    tren: { drum: 11, plecare: 0.8 },
  },
  {
    linie: 'M2',
    d: 'M40 120H1160',
    statii: [[130, 120], [260, 120], [400, 120], [520, 120], [640, 120], [840, 120], [990, 120], [1110, 120]],
    aici: [520, 120],
    eticheta: 'jos',
    tren: { drum: 8, plecare: 0.6 },
  },
];

/** Linia plină se desenează ultima, deasupra celor estompate. */
export const ordineaDesenarii = (plina: Linie | undefined): readonly Traseu[] => [
  ...TRASEE.filter((t) => t.linie !== plina),
  ...TRASEE.filter((t) => t.linie === plina),
];
