import { readFileSync } from 'node:fs';
import { CAMPURI } from '../../src/form-rules';
import { mesajEroare, rezultatDinCale, serviciuDinCautare, textContor, trimiteCererea } from '../../src/client/contact-form';

// Formularul cu JavaScript (decizia 30): ce vede vizitatorul depinde de pagina în care ajunge cererea, după redirecționarea
// 303 a Worker-ului. Fără DOM: `initFormular` e testat în e2e (tests/e2e/contact.spec.ts). Funcțiile pure (serviciul din
// link, mesajele de eroare, contorul) primesc tot ce le trebuie ca parametri și se testează aici, în Node.

describe('rezultatDinCale (decizia 30)', () => {
  test.each([
    ['/contact/multumim/', 'primit'],
    ['/contact/prea-multe-linkuri/', 'linkuri'],
    ['/contact/eroare/', 'eroare'],
    // Orice altă pagină, de exemplu una neașteptată, e tot o eroare: mesajul rămâne în formular.
    ['/contact/', 'eroare'],
    ['/api/contact', 'eroare'],
  ])('%s → %s', (cale, asteptat) => {
    expect(rezultatDinCale(cale)).toBe(asteptat);
  });
});

describe('trimiteCererea', () => {
  const raspuns = (url: string) => ({ url }) as Response;

  test('trimite POST la Worker, cu aceleași câmpuri ca un POST obișnuit (urlencoded)', async () => {
    let trimis: { url: string; init: RequestInit } | undefined;
    await trimiteCererea(
      '/api/contact',
      [
        ['nume', 'Ana Pop'],
        ['mesaj', 'a\nb'],
      ],
      async (url, init) => {
        trimis = { url, init };
        return raspuns('https://exemplu.ro/contact/multumim/');
      },
    );
    expect(trimis?.url).toBe('/api/contact');
    expect(trimis?.init.method).toBe('POST');
    expect(String(trimis?.init.body)).toBe('nume=Ana+Pop&mesaj=a%0Ab');
  });

  test('spune unde a ajuns cererea după redirecționare', async () => {
    expect(await trimiteCererea('/api/contact', [], async () => raspuns('https://exemplu.ro/contact/multumim/'))).toBe('primit');
    expect(await trimiteCererea('/api/contact', [], async () => raspuns('https://exemplu.ro/contact/prea-multe-linkuri/'))).toBe('linkuri');
    expect(await trimiteCererea('/api/contact', [], async () => raspuns('https://exemplu.ro/contact/eroare/'))).toBe('eroare');
  });

  test('o eroare de rețea e „eroare”, nu o aruncă mai departe', async () => {
    const rezultat = await trimiteCererea('/api/contact', [], async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(rezultat).toBe('eroare');
  });
});

describe('serviciuDinCautare (§4: serviciul vine din link)', () => {
  // Lista vine din aceleași reguli ca pe pagină (șase servicii și „nu-stiu”); testul nu o copiază.
  const optiuni = CAMPURI.serviciu.optiuni ?? [];

  test('lista de opțiuni nu e goală (altfel testele de mai jos n-ar dovedi nimic)', () => {
    expect(optiuni).toEqual(expect.arrayContaining(['seo', 'audit-seo', 'redesign-site', 'nu-stiu']));
  });

  test.each([
    ['?serviciu=redesign-site', 'redesign-site'],
    ['?serviciu=nu-stiu', 'nu-stiu'],
    // Doar primul `serviciu` contează, chiar dacă al doilea e și el valid.
    ['?serviciu=seo&serviciu=audit-seo', 'seo'],
    // Fără „?” în față, tot un șir de căutare valid.
    ['serviciu=seo', 'seo'],
    ['?alt=1&serviciu=creare-site', 'creare-site'],
  ])('%s → %s', (cautare, asteptat) => {
    expect(serviciuDinCautare(cautare, optiuni)).toBe(asteptat);
  });

  test.each([
    ['literele mari nu se potrivesc', '?serviciu=SEO'],
    ['spațiul de la capăt nu se taie', '?serviciu=seo%20'],
    ['cod în loc de serviciu', '?serviciu=%3Cscript%3E'],
    ['valoare goală', '?serviciu='],
    ['fără serviciu', '?alt=1'],
    ['șir gol', ''],
    // Primul `serviciu` decide: dacă e invalid, al doilea nu-l înlocuiește.
    ['primul e invalid, al doilea valid', '?serviciu=xyz&serviciu=seo'],
  ])('ignorat: %s (%s)', (_motiv, cautare) => {
    expect(serviciuDinCautare(cautare, optiuni)).toBeUndefined();
  });
});

describe('mesajEroare (§8: textele erorilor, în română)', () => {
  const valid = { valueMissing: false, typeMismatch: false };
  const gol = { valueMissing: true, typeMismatch: false };
  const nepotrivit = { valueMissing: false, typeMismatch: true };
  // Funcția nu are un prag al ei: `linkuri` și `maxLinkuri` sunt obligatorii. Pragul e cel al Worker-ului, ca pe pagină
  // (acolo vine din `data-max-linkuri`, scris din aceeași regulă).
  const MAX = CAMPURI.mesaj.maxLinkuri ?? 0;

  test('regula de linkuri există (altfel testele de mai jos n-ar dovedi nimic)', () => {
    expect(MAX).toBeGreaterThan(0);
  });

  test('Nume gol', () => {
    expect(mesajEroare('nume', gol, 0, MAX)).toBe('Scrie-ți numele.');
  });

  test('E-mail gol și e-mail greșit au texte diferite', () => {
    expect(mesajEroare('email', gol, 0, MAX)).toBe('Scrie-ți adresa de e-mail, ca să-ți pot răspunde.');
    expect(mesajEroare('email', nepotrivit, 0, MAX)).toBe('Adresa de e-mail pare incompletă. Verific-o, de exemplu nume@firma.ro.');
  });

  test('Mesaj gol', () => {
    expect(mesajEroare('mesaj', gol, 0, MAX)).toBe('Scrie-mi pe scurt ce te încurcă la site.');
  });

  test('Mesaj cu prea multe linkuri: peste prag e eroare, la prag e în regulă', () => {
    expect(mesajEroare('mesaj', valid, MAX + 1, MAX)).toBe(`Mesajul are mai mult de ${MAX} linkuri. Scoate câteva și trimite din nou.`);
    expect(mesajEroare('mesaj', valid, MAX, MAX)).toBeUndefined();
    expect(mesajEroare('mesaj', valid, 0, MAX)).toBeUndefined();
  });

  test('pragul vine din parametru, iar textul îl spune pe cel dat', () => {
    expect(mesajEroare('mesaj', valid, 6, 5)).toBe('Mesajul are mai mult de 5 linkuri. Scoate câteva și trimite din nou.');
    expect(mesajEroare('mesaj', valid, 5, 5)).toBeUndefined();
  });

  test('un prag lipsă (NaN, ca atunci când pagina n-are data-max-linkuri) nu oprește nimic', () => {
    expect(mesajEroare('mesaj', valid, 99, Number.NaN)).toBeUndefined();
  });

  test('un câmp gol are prioritate față de linkuri', () => {
    expect(mesajEroare('mesaj', gol, 9, MAX)).toBe('Scrie-mi pe scurt ce te încurcă la site.');
  });

  test('câmpurile valide n-au mesaj', () => {
    expect(mesajEroare('nume', valid, 0, MAX)).toBeUndefined();
    expect(mesajEroare('email', valid, 0, MAX)).toBeUndefined();
    // Numărul de linkuri contează doar la Mesaj.
    expect(mesajEroare('nume', valid, 9, MAX)).toBeUndefined();
    expect(mesajEroare('email', valid, 9, MAX)).toBeUndefined();
  });

  test('un tip greșit nu strică Numele și Mesajul (typeMismatch e doar al e-mailului)', () => {
    expect(mesajEroare('nume', nepotrivit, 0, MAX)).toBeUndefined();
    expect(mesajEroare('mesaj', nepotrivit, 0, MAX)).toBeUndefined();
  });
});

describe('textContor (§4: caractere și linkuri)', () => {
  test('mesaj gol', () => {
    expect(textContor('', 3000, 3)).toBe('0 / 3000 caractere · 0 / 3 linkuri');
  });

  test('numără caracterele (cu \\n) și linkurile, cu același numărător ca Worker-ul', () => {
    expect(textContor('a\nb https://x.ro www.y.ro', 3000, 3)).toBe('25 / 3000 caractere · 2 / 3 linkuri');
    // `https://www.a.ro` e un singur link, nu două.
    expect(textContor('https://www.a.ro', 3000, 3)).toBe('16 / 3000 caractere · 1 / 3 linkuri');
  });

  test('la limită, numărul de caractere ajunge la maxim', () => {
    expect(textContor('x'.repeat(3000), 3000, 3)).toMatch(/^3000 \/ 3000 /);
  });

  test('limitele vin din parametri, nu sunt scrise în funcție', () => {
    expect(textContor('abc', 10, 1)).toBe('3 / 10 caractere · 0 / 1 linkuri');
  });

  test('peste prag, contorul arată numărul real (nu se oprește la prag)', () => {
    expect(textContor('http://a.ro http://b.ro http://c.ro http://d.ro', 3000, 3)).toBe('47 / 3000 caractere · 4 / 3 linkuri');
  });
});

// Scriptul formularului nu poate crește cu mai mult de 2 KB (constrângerile globale ale planului). Datele din
// `src/form-rules.ts` (lista serviciilor cu nume și grupuri, regulile tuturor câmpurilor) ar adăuga în bundle ~760 de octeți
// fără ca browserul să aibă nevoie de ele: regulile vin din pagină (`maxlength`, `data-max-linkuri`, opțiunile listei).
describe('bugetul scriptului formularului', () => {
  test('clientul nu importă src/form-rules.ts', () => {
    const sursa = readFileSync(new URL('../../src/client/contact-form.ts', import.meta.url), 'utf8');
    expect(sursa).not.toMatch(/^(?:import|export)\b[^;]*form-rules/m);
  });
});
