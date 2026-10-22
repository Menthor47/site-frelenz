import { site } from '../../src/site.config';
import { parseMarker } from '../../src/lib/marker';

test('e-mailul public vine din domeniu', () => {
  expect(site.email).toBe('contact@site-provizoriu.example');
});

test('datele fixe ale site-ului', () => {
  expect(site.nume).toBe('Alex Ionescu');
  expect(site.logoScurt).toBe('consultant SEO');
  expect(site.descriere).toBe('Alex Ionescu – consultant SEO și web design, București');
  expect(site.telefonAfisat).toBe('0724\u00a0230\u00a0051');
  expect(site.telefonE164).toBe('+40724230051');
  expect(site.whatsapp).toBe('https://wa.me/40724230051');
  expect(site.oras).toBe('București');
  expect(site.profiluri).toEqual([]);
});

test('datele PFA lipsesc și sunt marcate cu rândurile #1 și #2', () => {
  expect(parseMarker(site.pfa.denumire)).toBe(1);
  expect(parseMarker(site.pfa.nrRegCom)).toBe(1);
  expect(parseMarker(site.pfa.cui)).toBe(1);
  expect(parseMarker(site.pfa.sediu)).toBe(2);
});
