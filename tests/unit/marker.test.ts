import { hasMarker, parseMarker, renderMarker, faraMarcaje } from '../../src/lib/marker';
import { REGISTRU } from '../../src/placeholders';

test('parseMarker', () => {
  expect(parseMarker('[DE COMPLETAT:#4]')).toBe(4);
  expect(parseMarker('text normal')).toBeNull();
});

test('hasMarker', () => {
  expect(hasMarker('[DE COMPLETAT:#12]')).toBe(true);
  expect(hasMarker('înainte [DE COMPLETAT:#3] după')).toBe(true);
  expect(hasMarker('text normal')).toBe(false);
  expect(hasMarker('[DE COMPLETAT]')).toBe(false);
});

test('renderMarker în producție e gol', () => {
  expect(renderMarker(4, false)).toBe('');
  expect(renderMarker(4, true)).toContain('[DE COMPLETAT:#4]');
  expect(renderMarker(4, true)).toContain(REGISTRU[4]!.ce);
});

test('renderMarker în draft e un <mark class="marcaj">, fără atribut style', () => {
  const html = renderMarker(4, true);
  expect(html.startsWith('<mark class="marcaj">')).toBe(true);
  expect(html.endsWith('</mark>')).toBe(true);
  expect(html).not.toContain('style=');
});

test('renderMarker cere un rând existent în registru', () => {
  expect(() => renderMarker(99, true)).toThrow(/#99/);
});

test('registrul are 21 de rânduri și 7 blocante', () => {
  expect(Object.keys(REGISTRU)).toHaveLength(21);
  expect(Object.entries(REGISTRU).filter(([, r]) => r.blocheaza).map(([n]) => +n))
    .toEqual([1, 2, 3, 4, 13, 15, 17]);
});

describe('faraMarcaje (ce rămâne de afișat, §3.4)', () => {
  const are = (s: string) => s.startsWith('[DE COMPLETAT');
  test('în producție scoate valorile cu marcaj', () => expect(faraMarcaje(['a', '[DE COMPLETAT:#8]', 'b'], are, false)).toEqual(['a', 'b']));
  test('în previzualizare le păstrează pe toate', () => expect(faraMarcaje(['a', '[DE COMPLETAT:#8]'], are, true)).toEqual(['a', '[DE COMPLETAT:#8]']));
});
