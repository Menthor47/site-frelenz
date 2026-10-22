// Întrebările frecvente care se arată (§2 #17, ruling R16): în producție, o pereche cu marcaj [DE COMPLETAT] nu apare deloc,
// ca să nu rămână o întrebare fără răspuns; în previzualizarea DRAFT=1 apar toate, iar marcajul trece prin `Placeholder`.
// Regula stă aici ca s-o aplice la fel componenta `Faq` (pagina) și `nodFaq` (JSON-LD): FAQPage nu poate avea altceva decât pagina.
import { hasMarker } from './marker';

export interface IntrebareFrecventa {
  intrebare: string;
  raspuns: string;
}

/** Perechile de afișat, în ordinea primită; `draft` vine din `DRAFT` (src/lib/env.ts). Lista primită nu se schimbă. */
export function intrebariVizibile<I extends IntrebareFrecventa>(intrebari: readonly I[], draft: boolean): I[] {
  return draft ? [...intrebari] : intrebari.filter((i) => !hasMarker(i.intrebare) && !hasMarker(i.raspuns));
}
