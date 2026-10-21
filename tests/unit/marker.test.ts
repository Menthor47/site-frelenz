import { hasMarker, parseMarker, renderMarker } from '../../src/lib/marker';
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

test('registrul are 20 de rânduri și 7 blocante', () => {
  expect(Object.keys(REGISTRU)).toHaveLength(20);
  expect(Object.entries(REGISTRU).filter(([, r]) => r.blocheaza).map(([n]) => +n))
    .toEqual([1, 2, 3, 4, 13, 15, 17]);
});
