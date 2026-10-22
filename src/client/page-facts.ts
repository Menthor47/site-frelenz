// Fișa paginii (§5.5), doar pe /proiecte/acest-site/: ce a descărcat browserul ca să arate pagina, măsurat în browser.
// Greutatea e suma `transferSize` din Navigation și Resource Timing. O resursă e din cache dacă `transferSize` e 0 sau mai
// mic decât `encodedBodySize` (revalidare). Fără bibliotecă, sub 1 KB după build.

interface Transfer {
  transferSize: number;
  encodedBodySize: number;
}

export interface Masuratori {
  greutateKb: number;
  cereri: number;
  dinCache: boolean;
}

const dinCache = (t: Transfer) => t.transferSize === 0 || t.transferSize < t.encodedBodySize;

export function masoara(entries: readonly Transfer[], nav: Transfer): Masuratori {
  const toate = [nav, ...entries];
  const octeti = toate.reduce((suma, t) => suma + t.transferSize, 0);
  return { greutateKb: Math.round((octeti / 1024) * 10) / 10, cereri: toate.length, dinCache: toate.some(dinCache) };
}

/** Scrie măsurătorile în rândurile `[data-masura]` ale fișei. Fără intrarea de navigare, rândurile rămân cum sunt. */
export function completeazaFisa(fisa: HTMLElement): void {
  const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (nav === undefined) return;
  const m = masoara(performance.getEntriesByType('resource') as PerformanceResourceTiming[], nav);
  const scrie = (masura: string, valoare: string) => {
    const rand = fisa.querySelector(`[data-masura="${masura}"]`);
    if (rand) rand.textContent = valoare;
  };
  scrie('greutate', `${m.greutateKb.toLocaleString('ro-RO')} KB${m.dinCache ? ', parțial din cache' : ''}`);
  scrie('cereri', String(m.cereri));
  scrie('cookieuri', String(document.cookie === '' ? 0 : document.cookie.split(';').length));
  const terte = [...document.scripts].filter((s) => s.src !== '' && new URL(s.src).origin !== location.origin);
  scrie('scripturi', String(terte.length));
}
