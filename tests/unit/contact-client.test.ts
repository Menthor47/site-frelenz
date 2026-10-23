import { rezultatDinCale, trimiteCererea } from '../../src/client/contact-form';

// Formularul cu JavaScript (decizia 30): ce vede vizitatorul depinde de pagina în care ajunge cererea, după redirecționarea
// 303 a Worker-ului. Fără DOM: `initFormular` e testat în e2e (tests/e2e/contact.spec.ts).

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
