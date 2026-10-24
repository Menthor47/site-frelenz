// Cuvintele cu cratimă (§5.3): „site-ul”, „site-urilor”, „într-un”, „n-a” nu se rup la capăt de rând, după cratimă.
// CSS nu poate opri ruperea după cratimă, iar fontul livrat n-are cratima fără rupere (U+2011), deci FaraRupere.astro pune
// fiecare astfel de cuvânt într-un `<span class="fara-rupere">`. Textul rămâne același; se schimbă doar unde cade rândul.

export interface Segment {
  text: string;
  /** Un cuvânt cu cratimă, care stă întreg pe un rând. */
  intreg: boolean;
}

/** Litere sau cifre legate prin cratime: „site-ul”, „într-un”, „e-mail”. Linia de pauză (–) și intervalele nu intră. */
const CU_CRATIMA = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+/gu;

/** Textul în bucăți, în ordine: cuvintele cu cratimă (`intreg`) și restul. Lipite la loc, dau exact textul primit. */
export function segmenteCratima(text: string): Segment[] {
  const segmente: Segment[] = [];
  let pozitie = 0;
  for (const potrivire of text.matchAll(CU_CRATIMA)) {
    const inceput = potrivire.index;
    if (inceput > pozitie) segmente.push({ text: text.slice(pozitie, inceput), intreg: false });
    segmente.push({ text: potrivire[0], intreg: true });
    pozitie = inceput + potrivire[0].length;
  }
  if (pozitie < text.length) segmente.push({ text: text.slice(pozitie), intreg: false });
  return segmente;
}
