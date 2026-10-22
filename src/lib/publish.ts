// Regulile de publicare din §3.4. Funcțiile primesc datele din colecții (`entry.data`), nu intrările întregi.
// `draft` vine din `DRAFT` (src/lib/env.ts): în previzualizarea DRAFT=1 se construiește tot.

export interface Proiect {
  readonly slug: string;
  /** Numele clientului sau „anonim”. */
  readonly client: string;
  readonly acord: boolean;
  readonly aprobat: boolean;
  /** Zod dă `undefined` la un câmp opțional absent, iar `exactOptionalPropertyTypes` cere să-l primim explicit. */
  readonly scoruri?: readonly unknown[] | undefined;
}

export interface Ghid {
  readonly aprobat: boolean;
}

/** Un ghid se construiește doar dacă există cel puțin atâtea ghiduri aprobate. */
const GHIDURI_MINIM = 2;

export function proiectPublicabil(p: Proiect, draft: boolean): boolean {
  if (draft) return true;
  if (!p.aprobat) return false;
  if (!p.acord && p.client !== 'anonim') return false;
  if (p.slug === 'acest-site') return (p.scoruri?.length ?? 0) > 0;
  return true;
}

export function proiectePublicabile<P extends Proiect>(lista: readonly P[], draft: boolean): P[] {
  return lista.filter((p) => proiectPublicabil(p, draft));
}

/** Gol dacă nu există cel puțin 2 ghiduri aprobate; în draft se construiesc toate. */
export function ghiduriDeConstruit<G extends Ghid>(lista: readonly G[], draft: boolean): G[] {
  if (draft) return [...lista];
  const aprobate = lista.filter((g) => g.aprobat);
  return aprobate.length >= GHIDURI_MINIM ? aprobate : [];
}

export function areProiecte(lista: readonly Proiect[], draft: boolean): boolean {
  return lista.some((p) => proiectPublicabil(p, draft));
}
