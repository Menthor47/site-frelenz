import { readFileSync } from 'node:fs';
import { CAMPURI, CAPCANA, cereServiciu, DESTINATAR, EMAIL_RE, FARA_SERVICIU, gasesteServiciu, SERVICII } from '../../src/form-rules';

describe('gasesteServiciu și cereServiciu', () => {
  test('găsesc serviciul după slug', () => {
    expect(gasesteServiciu('audit-seo')?.nume).toBe('Audit SEO');
    expect(cereServiciu('creare-site', 'test').grup).toBe('constructie');
  });

  test('„nu-stiu” și câmpul gol nu sunt servicii: gasesteServiciu dă undefined', () => {
    expect(gasesteServiciu(FARA_SERVICIU.slug)).toBeUndefined();
    expect(gasesteServiciu('')).toBeUndefined();
  });

  test('cereServiciu oprește build-ul pentru un slug necunoscut și spune cine l-a cerut', () =>
    expect(() => cereServiciu('web-design', 'proiecte/szitrans')).toThrow(/^proiecte\/szitrans: serviciul „web-design” nu e în src\/form-rules\.ts \(seo, /));
});

describe('SERVICII', () => {
  test('are 6 servicii, în ordinea 1–6', () => {
    expect(SERVICII).toHaveLength(6);
    expect(SERVICII.map((s) => s.ordine)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  test('grupurile sunt cele din specificație (valori ASCII)', () =>
    expect(SERVICII.map((s) => [s.slug, s.grup])).toEqual([
      ['seo', 'vizibilitate'],
      ['optimizare-aeo-geo', 'vizibilitate'],
      ['audit-seo', 'diagnostic'],
      ['creare-site', 'constructie'],
      ['redesign-site', 'reparatie'],
      ['mentenanta-site', 'reparatie'],
    ]));
  test('numele afișate sunt nenule și diferite între ele', () => {
    for (const s of SERVICII) expect(s.nume.trim()).not.toBe('');
    expect(new Set(SERVICII.map((s) => s.nume)).size).toBe(SERVICII.length);
  });
  test('slug-urile sunt ASCII, cu cratimă', () => {
    for (const s of SERVICII) expect(s.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });
});

describe('constante', () => {
  test('destinatarul', () => expect(DESTINATAR).toBe('idealserv51@gmail.com'));
  test('capcana', () => expect(CAPCANA).toBe('camp_rezerva'));
  // A-07 din auditul din 2026-10-24: un nume ca „confirmare_url” poate fi completat de un manager de parole sau de
  // completarea automată, iar cererea unui om s-ar pierde ca spam. Numele nu conține niciun cuvânt pe care îl caută ele.
  test('numele capcanei nu seamănă cu un câmp pe care l-ar completa automat browserul sau un manager de parole', () =>
    expect(CAPCANA).not.toMatch(/url|site|web|mail|name|nume|phone|tel|adres|address|firm|company|org|oras|city|zip|postal|user|pass|login|card/i));
});

describe('CAMPURI', () => {
  test('lungimile maxime din tabelul 3.5', () => {
    expect(CAMPURI.nume.maxLength).toBe(100);
    expect(CAMPURI.email.maxLength).toBe(254);
    expect(CAMPURI.telefon.maxLength).toBe(30);
    expect(CAMPURI.firma.maxLength).toBe(120);
    expect(CAMPURI.site.maxLength).toBe(200);
    expect(CAMPURI.mesaj.maxLength).toBe(3000);
  });
  test('câmpurile obligatorii: nume, e-mail și mesaj', () => {
    expect(CAMPURI.nume.required).toBe(true);
    expect(CAMPURI.email.required).toBe(true);
    expect(CAMPURI.mesaj.required).toBe(true);
    expect(CAMPURI.telefon.required).toBe(false);
    expect(CAMPURI.firma.required).toBe(false);
    expect(CAMPURI.site.required).toBe(false);
    expect(CAMPURI.serviciu.required).toBe(false);
  });
  test('tipurile de input', () => {
    expect(CAMPURI.email.type).toBe('email');
    expect(CAMPURI.telefon.type).toBe('tel');
    expect(CAMPURI.nume.type).toBeUndefined();
    expect(CAMPURI.site.type).toBeUndefined();
  });
  test('cel mult 3 linkuri în mesaj, doar acolo', () => {
    expect(CAMPURI.mesaj.maxLinkuri).toBe(3);
    expect(CAMPURI.nume.maxLinkuri).toBeUndefined();
  });
  test('opțiunile serviciului: cele 6 slug-uri, în ordine, plus „nu-stiu”', () => {
    expect(CAMPURI.serviciu.optiuni).toEqual([...SERVICII.map((s) => s.slug), 'nu-stiu']);
    expect(CAMPURI.serviciu.maxLength).toBeUndefined();
  });
  test('capcana nu e unul dintre câmpurile vizibile', () =>
    expect(Object.keys(CAMPURI)).not.toContain(CAPCANA));
});

describe('EMAIL_RE (algoritmul WHATWG pentru „valid email address”)', () => {
  test.each([
    'a@b.ro',
    'nume.prenume+tag@exemplu.ro',
    "o'neil@exemplu.ro",
    'a`b@exemplu.ro',
    'x@localhost',
    'a@b-c.exemplu.ro',
    'A@EXEMPLU.RO',
    `${'a'.repeat(64)}@${'b'.repeat(63)}.ro`,
  ])('acceptă %s', (adresa) => expect(EMAIL_RE.test(adresa)).toBe(true));

  test.each([
    '',
    'fara-arond.ro',
    'a@',
    '@b.ro',
    'a b@exemplu.ro',
    'a@b..ro',
    'a@-b.ro',
    'a@b-.ro',
    'a@exemplu.ro.',
    'a@@exemplu.ro',
    'a@exemplu .ro',
    'știu@exemplu.ro',
    'a@exemplu.ro\n',
    `a@${'b'.repeat(64)}.ro`,
  ])('respinge %j', (adresa) => expect(EMAIL_RE.test(adresa)).toBe(false));

  test('nu are steag global (test() repetat nu poate depinde de lastIndex)', () =>
    expect(EMAIL_RE.global).toBe(false));
});

describe('independența de Astro', () => {
  test('form-rules.ts nu importă nimic (Worker-ul îl folosește direct)', () => {
    const sursa = readFileSync(new URL('../../src/form-rules.ts', import.meta.url), 'utf8');
    expect(sursa).not.toMatch(/^\s*import\s/m);
    expect(sursa).not.toMatch(/from\s+['"]/);
    expect(sursa).not.toMatch(/\brequire\(/);
  });
});
