// Worker-ul formularului (§3.5, §10 „Worker-ul”), cu teste scrise înaintea codului. Rulează în vitest, în Node, cu
// legăturile simulate (ruling R18): `EMAIL.send` și `RATE_LIMITER.limit` sunt spioni, iar `cloudflare:email` e înlocuit
// în worker/vitest.config.ts. Comportamentul în runtime-ul Workers se verifică separat, cu `wrangler dev`.
import { readFileSync } from 'node:fs';
import { CAMPURI, CAPCANA, DESTINATAR, SERVICII } from '../src/form-rules';
import { buildEmail, buildEmailParts } from './email';
import worker from './index';
import * as modulPrincipal from './index';
import { countLinks } from './links';
import { CORP_MAXIM, validate, type Cerere } from './validate';

// workerd tratează orice export numit al modulului principal ca punct de intrare și refuză să pornească dacă nu e o funcție.
test('modulul principal (wrangler.jsonc „main”) exportă doar handler-ul', () => expect(Object.keys(modulPrincipal)).toEqual(['default']));

const VALORI_IMPLICITE = { nume: 'Ana Pop', email: 'ana@exemplu.ro', mesaj: 'Salut' };

/** Un formular valid, cu valorile implicite suprascrise; `undefined` scoate câmpul. */
function f(suprascrieri: Record<string, string | undefined> = {}): FormData {
  const form = new FormData();
  for (const [cheie, valoare] of Object.entries({ ...VALORI_IMPLICITE, ...suprascrieri })) {
    if (valoare !== undefined) form.set(cheie, valoare);
  }
  return form;
}

/** Cererea validată dintr-un formular care trebuie să fie valid. */
function cerere(suprascrieri: Record<string, string | undefined> = {}): Cerere {
  const r = validate(f(suprascrieri));
  if (!r.ok) throw new Error(`formularul de test e invalid: ${r.motiv}`);
  return r.date;
}

function mediu({ limita = true, trimitere = async () => {} }: { limita?: boolean; trimitere?: () => Promise<void> } = {}) {
  return {
    EMAIL: { send: vi.fn<(mesaj: unknown) => Promise<void>>(trimitere) },
    RATE_LIMITER: { limit: vi.fn(async () => ({ success: limita })) },
  };
}

let env = mediu();

beforeEach(() => {
  env = mediu();
});

const ORIGINE = 'https://site-provizoriu.example';

function post(form: FormData, cale = '/api/contact', e = env) {
  return worker.fetch(new Request(`${ORIGINE}${cale}`, { method: 'POST', body: form, headers: { 'cf-connecting-ip': '203.0.113.7' } }), e);
}

function get(cale: string) {
  return worker.fetch(new Request(`${ORIGINE}${cale}`), env);
}

describe('countLinks (§3.5 punctul 4)', () => {
  test('fiecare http(s):// și fiecare www. care nu vine după //, fără să conteze literele mari', () => {
    expect(countLinks('https://www.a.ro https://b.ro www.c.ro')).toBe(3);
    expect(countLinks('HTTP://a.ro http://b.ro WWW.c.ro https://d.ro')).toBe(4);
  });

  test('3 × https://www… sunt 3 linkuri', () => expect(countLinks('https://www.a.ro https://www.b.ro HTTPS://WWW.c.ro')).toBe(3));

  test('un text fără linkuri are 0', () => expect(countLinks('Salut, am un site de prezentare.')).toBe(0));
});

describe('validate: paritatea cu browserul (§3.5)', () => {
  test('formularul implicit e valid', () => expect(validate(f()).ok).toBe(true));

  test('100 de caractere în Nume trec, 101 nu', () => {
    expect(validate(f({ nume: 'a'.repeat(100) })).ok).toBe(true);
    expect(validate(f({ nume: 'a'.repeat(101) }))).toEqual({ ok: false, motiv: 'invalid' });
  });

  test.each(Object.entries(CAMPURI).filter(([, r]) => r.maxLength !== undefined))('%s: limita din form-rules.ts e exactă', (camp, regula) => {
    const max = regula.maxLength ?? 0;
    const valoare = (n: number) => (camp === 'email' ? `${'a'.repeat(n - '@exemplu.ro'.length)}@exemplu.ro` : 'a'.repeat(n));
    expect(validate(f({ [camp]: valoare(max) })).ok).toBe(true);
    expect(validate(f({ [camp]: valoare(max + 1) }))).toEqual({ ok: false, motiv: 'invalid' });
  });

  test('3000 de caractere cu rânduri noi trimise ca CRLF trec (3000 după CRLF → LF)', () =>
    expect(validate(f({ mesaj: ('a'.repeat(99) + '\r\n').repeat(30) })).ok).toBe(true));

  test('3001 caractere după normalizare nu trec', () =>
    expect(validate(f({ mesaj: ('a'.repeat(99) + '\r\n').repeat(30) + 'a' }))).toEqual({ ok: false, motiv: 'invalid' }));

  test('mesajul păstrează rândurile noi, ca LF', () => expect(cerere({ mesaj: 'unu\r\ndoi' }).mesaj).toBe('unu\ndoi'));

  test('doar spații într-un câmp obligatoriu trec, ca în browser', () => {
    expect(validate(f({ nume: '   ' })).ok).toBe(true);
    expect(validate(f({ mesaj: ' ' })).ok).toBe(true);
  });

  test.each(['nume', 'email', 'mesaj'])('%s lipsă sau gol e invalid', (camp) => {
    expect(validate(f({ [camp]: '' }))).toEqual({ ok: false, motiv: 'invalid' });
    expect(validate(f({ [camp]: undefined }))).toEqual({ ok: false, motiv: 'invalid' });
  });

  test.each(['telefon', 'firma', 'site', 'serviciu'])('%s e opțional', (camp) => expect(validate(f({ [camp]: '' })).ok).toBe(true));

  test.each(['ana@exemplu.ro', 'a.b+c@sub.exemplu.ro', "o'brien@exemplu.ro", 'ana@localhost'])('e-mail valid după WHATWG: %s', (email) =>
    expect(validate(f({ email })).ok).toBe(true));

  test.each(['ana', 'ana@', '@exemplu.ro', 'ana pop@exemplu.ro', 'ana@exemplu..ro', 'ana@-exemplu.ro'])('e-mail invalid: %s', (email) =>
    expect(validate(f({ email }))).toEqual({ ok: false, motiv: 'invalid' }));

  test.each(['nume', 'firma', 'telefon', 'site'])('CR sau LF în %s e invalid (injectare de antete)', (camp) => {
    expect(validate(f({ [camp]: 'Ana\r\nBcc: x@y.ro' }))).toEqual({ ok: false, motiv: 'invalid' });
    expect(validate(f({ [camp]: 'Ana\nBcc: x@y.ro' }))).toEqual({ ok: false, motiv: 'invalid' });
    expect(validate(f({ [camp]: 'Ana\rBcc: x@y.ro' }))).toEqual({ ok: false, motiv: 'invalid' });
  });

  test('fiecare serviciu din form-rules.ts și „nu-stiu” trec; un serviciu necunoscut e invalid', () => {
    for (const s of [...SERVICII.map((x) => x.slug), 'nu-stiu']) expect(validate(f({ serviciu: s })).ok).toBe(true);
    expect(validate(f({ serviciu: 'x' }))).toEqual({ ok: false, motiv: 'invalid' });
  });

  test('3 linkuri în Mesaj trec, 4 nu', () => {
    expect(validate(f({ mesaj: 'https://a.ro http://b.ro www.c.ro' })).ok).toBe(true);
    expect(validate(f({ mesaj: 'https://a.ro http://b.ro www.c.ro WWW.d.ro' }))).toEqual({ ok: false, motiv: 'linkuri' });
  });

  test('linkurile se numără doar în Mesaj', () => expect(validate(f({ site: 'https://www.exemplu.ro', firma: 'www.a.ro' })).ok).toBe(true));

  test('capcana completată', () => expect(validate(f({ [CAPCANA]: 'https://spam.example' }))).toEqual({ ok: false, motiv: 'capcana' }));

  test('capcana goală nu contează', () => expect(validate(f({ [CAPCANA]: '' })).ok).toBe(true));
});

describe('e-mailul (§3.5 punctul 6)', () => {
  test('subiectul cu serviciu și cu firmă', () => {
    const { subiect } = buildEmailParts(cerere({ serviciu: 'mentenanta-site', firma: 'Ștefan & Țara SRL' }));
    expect(subiect).toBe('Cerere de ofertă: Mentenanță site – Ana Pop (Ștefan & Țara SRL)');
  });

  test('subiectul fără serviciu', () => expect(buildEmailParts(cerere({ serviciu: '' })).subiect).toBe('Cerere de ofertă – Ana Pop'));

  test('„Nu știu încă” înseamnă tot fără serviciu în subiect', () =>
    expect(buildEmailParts(cerere({ serviciu: 'nu-stiu' })).subiect).toBe('Cerere de ofertă – Ana Pop'));

  test('corpul are toate câmpurile, cu mesajul la final', () => {
    const { corp } = buildEmailParts(
      cerere({ telefon: '0700 000 000', firma: 'Firma SRL', site: 'exemplu.ro', serviciu: 'seo', mesaj: 'Rândul unu\r\nRândul doi' }),
    );
    for (const rand of ['Nume: Ana Pop', 'E-mail: ana@exemplu.ro', 'Telefon: 0700 000 000', 'Firmă: Firma SRL', 'Adresa site-ului: exemplu.ro', 'Serviciu: SEO']) {
      expect(corp).toContain(rand);
    }
    expect(corp.endsWith('Rândul unu\nRândul doi\n')).toBe(true);
  });

  test('câmpurile opționale goale apar cu „—”', () => expect(buildEmailParts(cerere()).corp).toContain('Telefon: —'));

  test('mesajul MIME: de la, către, Reply-To, subiect RFC 2047 și text UTF-8', () => {
    const mesaj = buildEmail(cerere({ serviciu: 'mentenanta-site' }), 'formular@site-provizoriu.example', DESTINATAR) as unknown as {
      from: string;
      to: string;
      raw: string;
    };
    expect(mesaj.from).toBe('formular@site-provizoriu.example');
    expect(mesaj.to).toBe(DESTINATAR);
    const antete = mesaj.raw.slice(0, mesaj.raw.indexOf('\r\n\r\n'));
    expect(antete).toMatch(/^Reply-To: <?ana@exemplu\.ro>?$/im);
    const subiect = /^Subject: (=\?utf-8\?B\?([^?]+)\?=)$/im.exec(antete);
    expect(subiect).not.toBeNull();
    expect(Buffer.from(subiect?.[2] ?? '', 'base64').toString('utf8')).toBe('Cerere de ofertă: Mentenanță site – Ana Pop');
    expect(mesaj.raw).toMatch(/Content-Type: text\/plain; charset=UTF-8/i);
    expect(antete).not.toMatch(/^Bcc:/im);
  });

  // Corpul are diacritice, deci nu poate fi „7bit”: e base64, din textul UTF-8 cu rânduri CRLF (RFC 2045), pe rânduri de 76.
  test('corpul e base64, din UTF-8 cu CRLF, și niciun rând din mesaj nu se termină doar cu LF', () => {
    const date = cerere({ mesaj: 'Rândul unu\r\nȘi rândul doi, cu ț' });
    const mesaj = buildEmail(date, 'formular@site-provizoriu.example', DESTINATAR) as unknown as { raw: string };
    const [antete = '', corp = ''] = mesaj.raw.split('\r\n\r\n');
    expect(antete).toMatch(/^Content-Transfer-Encoding: base64$/im);
    expect(mesaj.raw.replaceAll('\r\n', '')).not.toContain('\n');
    for (const rand of corp.split('\r\n')) expect(rand.length).toBeLessThanOrEqual(76);
    expect(Buffer.from(corp.replaceAll('\r\n', ''), 'base64').toString('utf8')).toBe(buildEmailParts(date).corp.replaceAll('\n', '\r\n'));
  });
});

describe('fetch (§3.5, pașii 1–7)', () => {
  test('reușita trimite 303 spre mulțumire și un singur e-mail, de la formular@ + domeniul cererii, către DESTINATAR', async () => {
    const r = await post(f({}));
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/contact/multumim/');
    expect(env.EMAIL.send).toHaveBeenCalledTimes(1);
    const trimis = env.EMAIL.send.mock.calls[0]?.[0] as unknown as { from: string; to: string };
    expect(trimis.from).toBe('formular@site-provizoriu.example');
    expect(trimis.to).toBe(DESTINATAR);
  });

  test('limita se aplică pe IP-ul vizitatorului', async () => {
    await post(f({}));
    expect(env.RATE_LIMITER.limit).toHaveBeenCalledWith({ key: '203.0.113.7' });
  });

  test('capcana completată duce la mulțumire, fără e-mail și fără să consume limita', async () => {
    const r = await post(f({ [CAPCANA]: 'x' }));
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/contact/multumim/');
    expect(env.EMAIL.send).not.toHaveBeenCalled();
    expect(env.RATE_LIMITER.limit).not.toHaveBeenCalled();
  });

  test('limita depășită duce la eroare, fără e-mail', async () => {
    env = mediu({ limita: false });
    const r = await post(f({}));
    expect(r.headers.get('location')).toBe('/contact/eroare/');
    expect(env.EMAIL.send).not.toHaveBeenCalled();
  });

  test('4 linkuri duc la prea-multe-linkuri, fără e-mail', async () => {
    const r = await post(f({ mesaj: 'a.ro www.b.ro www.c.ro www.d.ro www.e.ro' }));
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/contact/prea-multe-linkuri/');
    expect(env.EMAIL.send).not.toHaveBeenCalled();
  });

  test.each([
    ['101 caractere în Nume', { nume: 'a'.repeat(101) }],
    ['serviciu necunoscut', { serviciu: 'x' }],
    ['CR/LF în Firmă', { firma: 'A\r\nBcc: x@y.ro' }],
    ['e-mail invalid', { email: 'ana' }],
  ])('%s duce la eroare, fără e-mail', async (_, suprascrieri) => {
    const r = await post(f(suprascrieri));
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/contact/eroare/');
    expect(env.EMAIL.send).not.toHaveBeenCalled();
  });

  // Un `<form method="post">` fără JavaScript trimite implicit urlencoded, cu rândurile noi ca %0D%0A.
  test('un formular urlencoded, cu CRLF în Mesaj, trece și trimite mesajul cu LF', async () => {
    const corp = new URLSearchParams({ nume: 'Ana Pop', email: 'ana@exemplu.ro', mesaj: 'unu\r\ndoi' });
    const r = await worker.fetch(new Request(`${ORIGINE}/api/contact`, { method: 'POST', body: corp }), env);
    expect(r.headers.get('location')).toBe('/contact/multumim/');
    const trimis = env.EMAIL.send.mock.calls[0]?.[0] as unknown as { raw: string };
    const text = Buffer.from((trimis.raw.split('\r\n\r\n')[1] ?? '').replaceAll('\r\n', ''), 'base64').toString('utf8');
    expect(text).toContain('unu\r\ndoi');
  });

  // Limita numără doar cererile care chiar pleacă (decizia lui Alex din 2026-10-23): cine scoate un link și retrimite nu-și
  // consumă încercările. Limitatorul spune „nu” în ambele teste, ca o consultare greșită să ducă la altă pagină.
  test('prea multe linkuri duc la pagina lor fără să consulte limita', async () => {
    env = mediu({ limita: false });
    expect((await post(f({ mesaj: 'a.ro www.b.ro www.c.ro www.d.ro www.e.ro' }))).headers.get('location')).toBe('/contact/prea-multe-linkuri/');
    expect(env.RATE_LIMITER.limit).not.toHaveBeenCalled();
  });

  test('o regulă încălcată duce la eroare fără să consulte limita', async () => {
    env = mediu({ limita: false });
    expect((await post(f({ nume: 'a'.repeat(101) }))).headers.get('location')).toBe('/contact/eroare/');
    expect(env.RATE_LIMITER.limit).not.toHaveBeenCalled();
  });

  test('o eroare neașteptată (de exemplu de la limitator) duce tot la eroare, nu la pagina platformei', async () => {
    env.RATE_LIMITER.limit.mockRejectedValueOnce(new Error('legătura lipsește'));
    const r = await post(f({}));
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/contact/eroare/');
    expect(r.headers.get('x-robots-tag')).toBe('noindex');
  });

  test('un corp care nu e formular duce la eroare', async () => {
    const r = await worker.fetch(new Request(`${ORIGINE}/api/contact`, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } }), env);
    expect(r.headers.get('location')).toBe('/contact/eroare/');
  });

  test('trimiterea care aruncă o eroare duce la eroare', async () => {
    env = mediu({ trimitere: async () => Promise.reject(new Error('destinatar neverificat')) });
    const r = await post(f({}));
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/contact/eroare/');
  });

  test.each(['PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])('%s pe /api/contact primește 405 cu Allow: POST', async (metoda) => {
    const r = await worker.fetch(new Request(`${ORIGINE}/api/contact`, { method: metoda }), env);
    expect(r.status).toBe(405);
    expect(r.headers.get('allow')).toBe('POST');
  });

  test('GET primește 405 cu Allow: POST, altă cale primește 404', async () => {
    const r = await get('/api/contact');
    expect(r.status).toBe(405);
    expect(r.headers.get('allow')).toBe('POST');
    expect((await post(f({}), '/api/altceva')).status).toBe(404);
    expect((await get('/api/altceva')).status).toBe(404);
  });

  test('fiecare răspuns are HSTS, nosniff și X-Robots-Tag: noindex', async () => {
    env = mediu();
    const raspunsuri = [
      await post(f({})),
      await post(f({ [CAPCANA]: 'x' })),
      await post(f({ nume: 'a'.repeat(101) })),
      await get('/api/contact'),
      await get('/api/altceva'),
    ];
    for (const r of raspunsuri) {
      expect(r.headers.get('strict-transport-security')).toMatch(/^max-age=\d+/);
      expect(r.headers.get('x-content-type-options')).toBe('nosniff');
      expect(r.headers.get('x-robots-tag')).toBe('noindex');
    }
  });

  test('cu DEBUG_FORM=1 (doar sub wrangler dev), eroarea ajunge în consolă, fără datele din formular', async () => {
    const spion = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const e = { ...mediu({ trimitere: async () => Promise.reject(new Error('destinatar neverificat')) }), DEBUG_FORM: '1' };
      expect((await post(f({ nume: 'Nume-Secret', mesaj: 'Mesaj-Secret' }), '/api/contact', e)).headers.get('location')).toBe('/contact/eroare/');
      expect(spion).toHaveBeenCalledTimes(1);
      const text = String(spion.mock.calls[0]?.[0]);
      expect(text).toContain('Error: destinatar neverificat');
      expect(text).not.toMatch(/Nume-Secret|Mesaj-Secret/);
    } finally {
      spion.mockRestore();
    }
  });

  test('nimic din formular nu ajunge în consolă, nici la trimiterea eșuată', async () => {
    const spioni = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    try {
      await post(f({ nume: 'Nume-Secret', mesaj: 'Mesaj-Secret' }));
      env = mediu({ trimitere: async () => Promise.reject(new Error('x')) });
      await post(f({ nume: 'Nume-Secret', mesaj: 'Mesaj-Secret' }));
      await post(f({ nume: 'a'.repeat(101) }));
      for (const s of spioni) expect(s).not.toHaveBeenCalled();
    } finally {
      for (const s of spioni) s.mockRestore();
    }
  });
});

describe('cererile care nu vin de la formularul site-ului', () => {
  const trimite = (antete: Record<string, string>, corp: BodyInit = f()) =>
    worker.fetch(new Request(`${ORIGINE}/api/contact`, { method: 'POST', body: corp, headers: { 'cf-connecting-ip': '203.0.113.7', ...antete } }), env);

  test.each([
    ['Sec-Fetch-Site: cross-site', { 'sec-fetch-site': 'cross-site' }],
    ['Origin de pe alt site', { origin: 'https://alt-site.example' }],
    ['Origin pe http în loc de https', { origin: 'http://site-provizoriu.example' }],
    // A-11 din auditul din 2026-10-24: un iframe cu sandbox de pe alt site trimite `Origin: null`, iar un browser fără
    // Fetch Metadata (Safari sub 16.4) nu spune nimic altceva.
    ['Origin: null fără Sec-Fetch-Site', { origin: 'null' }],
    ['Origin: null cu Sec-Fetch-Site: same-site (un subdomeniu)', { origin: 'null', 'sec-fetch-site': 'same-site' }],
  ])('%s: eroare, fără limitator și fără e-mail', async (_, antete) => {
    const r = await trimite(antete);
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/contact/eroare/');
    expect(env.RATE_LIMITER.limit).not.toHaveBeenCalled();
    expect(env.EMAIL.send).not.toHaveBeenCalled();
  });

  test.each([
    ['Sec-Fetch-Site: same-origin și Origin-ul site-ului', { 'sec-fetch-site': 'same-origin', origin: ORIGINE }],
    ['Origin: null cu Sec-Fetch-Site: same-origin (politică no-referrer, extensii)', { origin: 'null', 'sec-fetch-site': 'same-origin' }],
    ['fără Origin și fără Sec-Fetch-Site (clienți vechi)', {}],
  ])('%s: cererea pleacă', async (_, antete) => {
    expect((await trimite(antete)).headers.get('location')).toBe('/contact/multumim/');
    expect(env.EMAIL.send).toHaveBeenCalledTimes(1);
  });

  test(`un corp declarat peste ${CORP_MAXIM} octeți duce la eroare, fără să fie citit`, async () => {
    const corp = new URLSearchParams({ ...VALORI_IMPLICITE, mesaj: 'a'.repeat(CORP_MAXIM) });
    const r = await trimite({ 'content-length': String(corp.toString().length) }, corp);
    expect(r.headers.get('location')).toBe('/contact/eroare/');
    expect(env.RATE_LIMITER.limit).not.toHaveBeenCalled();
    expect(env.EMAIL.send).not.toHaveBeenCalled();
  });

  /** Un corp trimis pe bucăți, fără `Content-Length` (cum nu face niciun browser): mărimea se află doar citindu-l. */
  const peBucati = (text: string) =>
    worker.fetch(
      new Request(`${ORIGINE}/api/contact`, {
        method: 'POST',
        body: new Blob([text]).stream(),
        duplex: 'half',
        headers: { 'cf-connecting-ip': '203.0.113.7', 'content-type': 'application/x-www-form-urlencoded' },
      } as RequestInit),
      env,
    );

  test(`un corp pe bucăți peste ${CORP_MAXIM} octeți duce la eroare, chiar dacă restul formularului e valid`, async () => {
    // Câmpurile formularului sunt valide; surplusul stă într-un câmp pe care validarea nu-l citește.
    const corp = `${new URLSearchParams(VALORI_IMPLICITE).toString()}&umplutura=${'a'.repeat(CORP_MAXIM)}`;
    const r = await peBucati(corp);
    expect(r.headers.get('location')).toBe('/contact/eroare/');
    expect(env.RATE_LIMITER.limit).not.toHaveBeenCalled();
    expect(env.EMAIL.send).not.toHaveBeenCalled();
  });

  test('un corp pe bucăți sub limită pleacă, cu textul neschimbat', async () => {
    const r = await peBucati(new URLSearchParams({ ...VALORI_IMPLICITE, mesaj: 'Rând cu diacritice: ș, ț, „ și ”' }).toString());
    expect(r.headers.get('location')).toBe('/contact/multumim/');
    const trimis = env.EMAIL.send.mock.calls[0]?.[0] as unknown as { raw: string };
    const text = Buffer.from((trimis.raw.split('\r\n\r\n')[1] ?? '').replaceAll('\r\n', ''), 'base64').toString('utf8');
    expect(text).toContain('Rând cu diacritice: ș, ț, „ și ”');
  });

  test('cel mai mare formular valid, numai din „ (9 octeți urlencoded fiecare), încape sub limită și pleacă', async () => {
    const plin = Object.fromEntries(
      Object.entries(CAMPURI)
        .filter(([camp, r]) => r.maxLength !== undefined && camp !== 'email')
        .map(([camp, r]) => [camp, '„'.repeat(r.maxLength ?? 0)]),
    );
    const corp = new URLSearchParams({ ...plin, email: `${'a'.repeat(242)}@exemplu.ro`, serviciu: 'nu-stiu' });
    const lungime = new TextEncoder().encode(corp.toString()).length;
    expect(lungime).toBeGreaterThan(30_000);
    expect(lungime).toBeLessThan(CORP_MAXIM);
    expect((await trimite({ 'content-length': String(lungime) }, corp)).headers.get('location')).toBe('/contact/multumim/');
  });
});

describe('public/_headers (§3.6)', () => {
  const antete = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
  const regula = (cale: string) => {
    const bloc = antete.split(/\r?\n(?=\S)/).find((b) => b.split(/\r?\n/)[0] === cale) ?? '';
    return Object.fromEntries(
      bloc
        .split(/\r?\n/)
        .slice(1)
        .filter((r) => /^\s+\S/.test(r))
        .map((r) => {
          const [nume = '', ...valoare] = r.trim().split(': ');
          return [nume.toLowerCase(), valoare.join(': ')];
        }),
    );
  };

  test('HSTS și nosniff sunt aceleași pe site și pe răspunsurile Worker-ului', async () => {
    const r = await post(f({}));
    expect(regula('/*')['strict-transport-security']).toBe(r.headers.get('strict-transport-security'));
    expect(regula('/*')['x-content-type-options']).toBe(r.headers.get('x-content-type-options'));
  });

  test('CSP-ul din antet n-are default-src, script-src sau style-src (ar bloca scripturile cu hash din <meta>)', () => {
    expect(regula('/*')['content-security-policy']).toBe("frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
  });

  test('adresele *.workers.dev au noindex', () => expect(regula('https://:version.:subdomain.workers.dev/*')['x-robots-tag']).toBe('noindex'));
});

describe('wrangler.jsonc (§3.6)', () => {
  // JSONC: comentariile stau doar pe rânduri proprii, deci se pot scoate fără să atingem șirurile cu „//”.
  const config = JSON.parse(
    readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
      .split('\n')
      .filter((rand) => !/^\s*\/\//.test(rand))
      .join('\n'),
  ) as Record<string, any>;

  test('allowed_destination_addresses e exact [DESTINATAR]', () =>
    expect(config.send_email).toEqual([{ name: 'EMAIL', allowed_destination_addresses: [DESTINATAR] }]));

  test('limita: 3 cereri la 60 de secunde', () => expect(config.ratelimits?.[0]).toMatchObject({ name: 'RATE_LIMITER', simple: { limit: 3, period: 60 } }));

  test('assets, Worker-ul doar pe /api/* și fără jurnale', () => {
    expect(config.main).toBe('worker/index.ts');
    expect(config.assets).toEqual({ directory: './dist', not_found_handling: '404-page', html_handling: 'auto-trailing-slash', run_worker_first: ['/api/*'] });
    expect(config.observability).toEqual({ enabled: false });
  });
});
