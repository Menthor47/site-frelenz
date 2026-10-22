import { marcajeDinText } from '../../scripts/report-placeholders.mjs';

// Raportul marcajelor (§3.4) e ce citește check:launch: un marcaj pe care nu-l vede nu poate bloca lansarea.
// Marcajele apar în două forme: valoarea `[DE COMPLETAT:#n]` (conținut, config) și `<Placeholder nr={n} />` (pagini .astro).
describe('marcajeDinText', () => {
  test('valoarea [DE COMPLETAT:#n]', () => expect(marcajeDinText('titlu: "[DE COMPLETAT:#21]"\nx: "[DE COMPLETAT:#8]"')).toEqual([8, 21]));

  test('componenta <Placeholder nr={n} />, cu sau fără spații în plus', () =>
    expect(marcajeDinText('<p><Placeholder nr={17} /></p>\n<Placeholder  nr={22}/>\n<Placeholder\n  nr={15}\n/>')).toEqual([15, 17, 22]));

  test('un număr repetat apare o singură dată, în ordine', () =>
    expect(marcajeDinText('[DE COMPLETAT:#4] [DE COMPLETAT:#4] <Placeholder nr={4} />')).toEqual([4]));

  test('fără marcaje, lista e goală (o variabilă nu e un număr)', () => expect(marcajeDinText('<Placeholder nr={marcaj} /> și text')).toEqual([]));
});
