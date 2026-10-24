import { segmenteCratima } from '../../src/lib/cratima';

// Cuvintele cu cratimă țin întregi pe un rând (§5.3, FaraRupere.astro); textul nu se schimbă deloc.
const intregi = (text: string) => segmenteCratima(text).filter((s) => s.intreg).map((s) => s.text);

test('găsește cuvintele cu cratimă, inclusiv cu diacritice, majuscule și mai multe cratime', () => {
  expect(intregi('Site-ul n-a mai fost actualizat într-un an.')).toEqual(['Site-ul', 'n-a', 'într-un']);
  expect(intregi('fac redesign site-urilor de firmă; scrie-mi pe e-mail')).toEqual(['site-urilor', 'scrie-mi', 'e-mail']);
  expect(intregi('dă-mi-l')).toEqual(['dă-mi-l']);
});

test('nu atinge linia de pauză, intervalele, cratima izolată sau cea de la capăt', () => {
  expect(intregi('7–11 secunde, SEO – audit, a - b, -a, b-, --')).toEqual([]);
});

test('bucățile lipite la loc dau exact textul primit', () => {
  for (const text of ['', 'fără cratimă', 'Site-ul arată învechit și nu mai seamănă cu firma de acum.', 'a-b c-d', 'x-y']) {
    expect(segmenteCratima(text).map((s) => s.text).join('')).toBe(text);
  }
});
