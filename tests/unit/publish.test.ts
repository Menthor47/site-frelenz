import { areProiecte, ghiduriDeConstruit, proiectePublicabile, proiectPublicabil } from '../../src/lib/publish';
import { APROBARI, paginaAprobata } from '../../src/approvals';
import { SERVICII } from '../../src/form-rules';

describe('proiectPublicabil', () => {
  test('anonim + aprobat se publică', () =>
    expect(proiectPublicabil({ slug: 'magazin-online', client: 'anonim', acord: false, aprobat: true }, false)).toBe(true));
  test('client cu nume fără acord nu se publică', () =>
    expect(proiectPublicabil({ slug: 'szitrans', client: 'szitrans.eu', acord: false, aprobat: true }, false)).toBe(false));
  test('acest-site fără scoruri nu se publică', () =>
    expect(proiectPublicabil({ slug: 'acest-site', client: 'Alex Ionescu', acord: true, aprobat: true, scoruri: [] }, false)).toBe(false));
  test('în draft se construiește tot', () =>
    expect(proiectPublicabil({ slug: 'szitrans', client: 'szitrans.eu', acord: false, aprobat: false }, true)).toBe(true));

  test('client cu nume, cu acord și aprobat, se publică', () =>
    expect(proiectPublicabil({ slug: 'szitrans', client: 'szitrans.eu', acord: true, aprobat: true }, false)).toBe(true));
  test('cu acord, dar neaprobat, nu se publică', () =>
    expect(proiectPublicabil({ slug: 'szitrans', client: 'szitrans.eu', acord: true, aprobat: false }, false)).toBe(false));
  test('anonim, dar neaprobat, nu se publică', () =>
    expect(proiectPublicabil({ slug: 'magazin-online', client: 'anonim', acord: false, aprobat: false }, false)).toBe(false));
  test('acest-site cu scoruri, acord și aprobat se publică', () =>
    expect(
      proiectPublicabil(
        { slug: 'acest-site', client: 'Alex Ionescu', acord: true, aprobat: true, scoruri: [{ valoare: 100 }] },
        false,
      ),
    ).toBe(true));
  test('acest-site fără câmpul scoruri nu se publică', () =>
    expect(proiectPublicabil({ slug: 'acest-site', client: 'Alex Ionescu', acord: true, aprobat: true }, false)).toBe(false));
  test('scorurile nu contează pentru celelalte proiecte', () =>
    expect(proiectPublicabil({ slug: 'magazin-online', client: 'anonim', acord: false, aprobat: true, scoruri: [] }, false)).toBe(true));
  test('în draft, acest-site apare și fără scoruri', () =>
    expect(proiectPublicabil({ slug: 'acest-site', client: 'Alex Ionescu', acord: false, aprobat: false, scoruri: [] }, true)).toBe(true));
});

describe('proiectePublicabile și areProiecte', () => {
  const anonim = { slug: 'magazin-online', client: 'anonim', acord: false, aprobat: true };
  const faraAcord = { slug: 'szitrans', client: 'szitrans.eu', acord: false, aprobat: true };
  const neaprobat = { slug: 'mayalashes', client: 'Mayalashes', acord: true, aprobat: false };

  test('în producție păstrează doar proiectele publicabile, în ordinea listei', () =>
    expect(proiectePublicabile([faraAcord, anonim, neaprobat], false)).toEqual([anonim]));
  test('în draft le păstrează pe toate', () =>
    expect(proiectePublicabile([faraAcord, anonim, neaprobat], true)).toEqual([faraAcord, anonim, neaprobat]));
  test('nu modifică lista primită', () => {
    const lista = [faraAcord, anonim];
    proiectePublicabile(lista, false);
    expect(lista).toEqual([faraAcord, anonim]);
  });
  test('areProiecte e adevărat cu cel puțin un proiect publicabil', () =>
    expect(areProiecte([faraAcord, anonim], false)).toBe(true));
  test('areProiecte e fals dacă niciun proiect nu e publicabil', () =>
    expect(areProiecte([faraAcord, neaprobat], false)).toBe(false));
  test('areProiecte e fals pe o listă goală, chiar și în draft', () => {
    expect(areProiecte([], false)).toBe(false);
    expect(areProiecte([], true)).toBe(false);
  });
  test('în draft areProiecte e adevărat cu orice proiect', () =>
    expect(areProiecte([neaprobat], true)).toBe(true));
});

describe('ghiduriDeConstruit', () => {
  test('un singur ghid aprobat nu ajunge', () =>
    expect(ghiduriDeConstruit([{ aprobat: true }, { aprobat: false }], false)).toEqual([]));
  test('două ghiduri aprobate se construiesc, fără cele neaprobate', () => {
    const a = { slug: 'a', aprobat: true };
    const b = { slug: 'b', aprobat: false };
    const c = { slug: 'c', aprobat: true };
    expect(ghiduriDeConstruit([a, b, c], false)).toEqual([a, c]);
  });
  test('lista goală dă o listă goală', () => expect(ghiduriDeConstruit([], false)).toEqual([]));
  test('în draft se construiesc toate, chiar neaprobate și sub două', () => {
    const lista = [{ aprobat: false }, { aprobat: true }];
    expect(ghiduriDeConstruit(lista, true)).toEqual(lista);
  });
});

describe('aprobări', () => {
  test('ruta lipsă din aprobări e neaprobată', () => expect(paginaAprobata('/nu-exista/')).toBe(false));
  test('chei moștenite din Object.prototype nu sunt rute aprobate', () => {
    expect(paginaAprobata('constructor')).toBe(false);
    expect(paginaAprobata('__proto__')).toBe(false);
    expect(paginaAprobata('toString')).toBe(false);
  });
  test('ruta fără slash la final nu se potrivește cu cea cu slash', () =>
    expect(paginaAprobata('/servicii')).toBe(false));

  test('cele 14 rute .astro sunt listate, toate neaprobate', () => {
    expect(Object.keys(APROBARI).sort()).toEqual(
      [
        '/',
        '/404/',
        '/contact/',
        '/contact/eroare/',
        '/contact/multumim/',
        '/contact/prea-multe-linkuri/',
        '/cum-lucrez/',
        '/despre/',
        '/ghiduri/',
        '/politica-cookies/',
        '/politica-de-confidentialitate/',
        '/proiecte/',
        '/servicii/',
        '/termeni-si-conditii/',
      ].sort(),
    );
    expect(Object.values(APROBARI).every((v) => v === false)).toBe(true);
  });
  test('toate rutele listate dau neaprobat', () => {
    for (const cale of Object.keys(APROBARI)) expect(paginaAprobata(cale)).toBe(false);
  });
  test('o rută cu valoarea true e aprobată', () => {
    const initial = APROBARI['/despre/'];
    try {
      APROBARI['/despre/'] = true;
      expect(paginaAprobata('/despre/')).toBe(true);
    } finally {
      if (initial === undefined) delete APROBARI['/despre/'];
      else APROBARI['/despre/'] = initial;
    }
  });
});

describe('ordinea serviciilor', () => {
  test('ordinea serviciilor', () =>
    expect(SERVICII.map((s) => s.slug)).toEqual([
      'seo',
      'optimizare-aeo-geo',
      'audit-seo',
      'creare-site',
      'redesign-site',
      'mentenanta-site',
    ]));
});
