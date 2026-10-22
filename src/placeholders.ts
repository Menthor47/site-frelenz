// Registrul marcajelor [DE COMPLETAT:#<nr>] (spec, capitolul 12).
// `blocheaza: true` înseamnă că lipsa oprește lansarea (`check:launch`).
// Fișierul e citit și de scripts/report-placeholders.mjs, deci rămâne TypeScript
// fără sintaxă specifică (fără enum-uri, fără importuri): Node îl încarcă direct.

export type RandRegistru = {
  /** Ce lipsește. */
  ce: string;
  /** Cine completează. */
  cine: string;
  /** Dacă lipsa blochează lansarea. */
  blocheaza: boolean;
};

export const REGISTRU: Record<number, RandRegistru> = {
  1: { ce: 'Datele PFA: denumire, numărul de la Registrul Comerțului, CUI', cine: 'Alex', blocheaza: true },
  2: { ce: 'Adresa sediului profesional (decizie: adresa înregistrată sau mutarea)', cine: 'Alex', blocheaza: true },
  3: { ce: 'Domeniul final', cine: 'Alex', blocheaza: true },
  4: { ce: 'Despre: biografie, studii, experiență, instrumente', cine: 'Alex (eu redactez)', blocheaza: true },
  5: { ce: 'Profiluri pentru sameAs (LinkedIn etc.)', cine: 'Alex', blocheaza: false },
  6: { ce: 'Fotografie reală', cine: 'Alex', blocheaza: false },
  7: { ce: 'Acordul scris de la szitrans, plus rezultate verificabile și capturi datate', cine: 'Alex', blocheaza: false },
  8: { ce: 'Textul studiului anonim al magazinului online (și serviciile folosite), aprobat, cu capturi anonimizate', cine: 'Alex', blocheaza: false },
  9: { ce: 'Acordul mayalashes', cine: 'Alex', blocheaza: false },
  10: { ce: 'Rezultatele din studiile de caz (cifre, perioadă, sursă)', cine: 'Alex', blocheaza: false },
  11: { ce: 'Scorurile acestui site, măsurate în producție', cine: 'eu, după lansare', blocheaza: false },
  12: { ce: 'Volumele cuvintelor-cheie (Keyword Planner)', cine: 'Alex', blocheaza: false },
  13: { ce: 'Răspunsurile la întrebările frecvente (6 × 4, plus 4–5 pe Acasă)', cine: 'eu redactez, Alex aprobă', blocheaza: true },
  14: { ce: 'Duratele și pașii fiecărui serviciu, doar dacă Alex îi confirmă', cine: 'Alex', blocheaza: false },
  15: { ce: 'Etichetele buclei lunare din traseul abonamentului', cine: 'Alex', blocheaza: true },
  16: { ce: 'Textele celor 2 ghiduri', cine: 'eu redactez, Alex aprobă', blocheaza: false },
  17: { ce: 'Durata de păstrare a datelor: cererile din formular, corespondența, contractele și facturile, jurnalele tehnice', cine: 'Alex (cu contabilul)', blocheaza: true },
  18: { ce: 'Timpul de răspuns promis, doar dacă Alex îl confirmă', cine: 'Alex', blocheaza: false },
  19: { ce: 'Testimoniale reale, cu acord', cine: 'Alex', blocheaza: false },
  20: { ce: 'Linkul spre Google Business Profile', cine: 'Alex', blocheaza: false },
  21: { ce: 'Textul studiului szitrans: contextul, problema, ce am făcut și serviciile folosite', cine: 'Alex (eu redactez)', blocheaza: false },
  22: { ce: 'Data verificării certificării Cloudflare în Data Privacy Framework (dataprivacyframework.gov)', cine: 'eu, înainte de lansare', blocheaza: true },
};
