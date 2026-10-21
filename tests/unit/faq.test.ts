import { intrebariVizibile } from '../../src/lib/faq';
import { nodFaq } from '../../src/lib/jsonld';

// Regula din §2 #17 pentru întrebările frecvente, într-un singur loc (ruling R16): în producție, o pereche cu marcaj
// [DE COMPLETAT] nu se afișează, iar FAQPage din JSON-LD primește exact perechile pe care le arată pagina.
const bune = [
  { intrebare: 'Afișezi prețuri?', raspuns: 'Nu, prețul îl stabilim după ce mă uit la site.' },
  { intrebare: 'Lucrezi cu firme?', raspuns: 'Da, doar cu firme și PFA-uri.' },
];
const cuMarcajInRaspuns = { intrebare: 'Cât durează?', raspuns: '[DE COMPLETAT:#14]' };
const cuMarcajInIntrebare = { intrebare: '[DE COMPLETAT:#13]', raspuns: 'Un răspuns.' };
const amestec = [bune[0]!, cuMarcajInRaspuns, bune[1]!, cuMarcajInIntrebare];

describe('intrebariVizibile', () => {
  test('în producție scoate perechile cu marcaj, în întrebare sau în răspuns, și păstrează ordinea', () =>
    expect(intrebariVizibile(amestec, false)).toEqual(bune));

  test('în previzualizare le păstrează pe toate (marcajul se vede prin Placeholder)', () =>
    expect(intrebariVizibile(amestec, true)).toEqual(amestec));

  test('fără marcaje, lista rămâne aceeași', () => expect(intrebariVizibile(bune, false)).toEqual(bune));

  test('nu schimbă lista primită', () => {
    const copie = structuredClone(amestec);
    intrebariVizibile(amestec, false);
    expect(amestec).toEqual(copie);
  });
});

describe('nodFaq aplică aceeași regulă', () => {
  test('în producție, FAQPage are doar perechile fără marcaj', () => {
    const noduri = nodFaq(amestec, false);
    expect(noduri).toHaveLength(1);
    expect(noduri[0]?.mainEntity.map((q) => q.name)).toEqual(bune.map((b) => b.intrebare));
    expect(JSON.stringify(noduri)).not.toContain('[DE COMPLETAT');
  });

  test('în producție, dacă nu rămâne nicio pereche, nu există nici nodul FAQPage', () => {
    expect(nodFaq([cuMarcajInRaspuns, cuMarcajInIntrebare], false)).toEqual([]);
    expect(nodFaq([], false)).toEqual([]);
  });

  test('în previzualizare, FAQPage are toate perechile, ca pagina', () =>
    expect(nodFaq(amestec, true)[0]?.mainEntity).toHaveLength(amestec.length));

  test('pagina și JSON-LD aleg aceleași perechi', () => {
    for (const draft of [false, true]) {
      const intrebari = (nodFaq(amestec, draft)[0]?.mainEntity ?? []).map((q) => q.name);
      expect(intrebari).toEqual(intrebariVizibile(amestec, draft).map((i) => i.intrebare));
    }
  });
});
