import { findCedilla } from '../../scripts/check-cedilla.mjs';

test('găsește sedilele', () => {
  expect(findCedilla('aş ţ ș ț')).toEqual([1, 3]);
});

test('găsește și majusculele cu sedilă (U+015E, U+0162)', () => {
  expect(findCedilla('\u015E \u0162')).toEqual([0, 2]);
});

test('virgula corectă (ș, ț, Ș, Ț) nu e semnalată', () => {
  expect(findCedilla('ȘȚ șț ăâî')).toEqual([]);
});
