// Starea trenurilor de pe hărțile animate (Acasă și banda de sus a paginilor, §5.6), fără DOM, ca s-o poată testa vitest.
// Două lucruri decid dacă trenurile merg: alegerea vizitatorului (butonul) și dacă harta e pe ecran (IntersectionObserver).
// Alegerea are prioritate: după „Oprește trenurile”, doar butonul le mai repornește.

export type StareTrenuri = 'pornit' | 'oprit';

export interface ComenziTrenuri {
  /** Pornește din nou animațiile oprite (SMIL: `svg.unpauseAnimations()`). */
  play(): void;
  /** Oprește animațiile pe loc (SMIL: `svg.pauseAnimations()`). */
  pause(): void;
}

export interface ControllerTrenuri {
  /** Butonul: schimbă alegerea vizitatorului și o întoarce; eticheta butonului o urmează. */
  userToggle(): StareTrenuri;
  /** Harta a intrat (`true`) sau a ieșit (`false`) din ecran. */
  visibility(visible: boolean): void;
  /** Dacă trenurile merg acum: „pornit” doar cât vizitatorul nu le-a oprit și harta e pe ecran. */
  state(): StareTrenuri;
  /** Vizitatorul a cerut mai puțină mișcare în timpul vizitei: trenurile se opresc definitiv, oricum s-ar mișca harta. */
  disable(): void;
}

/** Pornește în starea „merg”, pentru că scriptul a pornit deja animațiile; `play`/`pause` se cer doar la schimbare. */
export function createTrainController({ play, pause }: ComenziTrenuri): ControllerTrenuri {
  let oprite = false;
  let pePagina = true;
  let dezactivate = false;
  let merg = true;

  function aplica() {
    const trebuie = !dezactivate && !oprite && pePagina;
    if (trebuie === merg) return;
    merg = trebuie;
    if (merg) play();
    else pause();
  }

  return {
    userToggle() {
      oprite = !oprite;
      aplica();
      return oprite ? 'oprit' : 'pornit';
    },
    visibility(visible) {
      pePagina = visible;
      aplica();
    },
    state: () => (merg ? 'pornit' : 'oprit'),
    disable() {
      dezactivate = true;
      aplica();
    },
  };
}
