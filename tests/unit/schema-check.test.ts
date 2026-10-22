import { verificaGraf } from '../../scripts/check-schema.mjs';
import { ASTEPTARI } from '../../scripts/schema-expectations.mjs';
import {
  graf,
  nodArticle,
  nodBreadcrumb,
  nodColectie,
  nodContactPage,
  nodFaq,
  nodPerson,
  nodProfilePage,
  nodService,
  nodWebPage,
  nodWebSite,
  serializeaza,
} from '../../src/lib/jsonld';

/** O pagină cu un singur script JSON-LD, ca să se verifice doar graful. */
function htmlCuGraf(noduri: object[]): string {
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': noduri });
  return `<!doctype html><html lang="ro"><head><script type="application/ld+json">${json}</script></head><body></body></html>`;
}

/** Pagina așa cum o construiește site-ul: `WebSite` și `Person` minimal vin singure, ca în `JsonLd.astro`. */
function paginaReala(...noduri: (object | readonly object[])[]): string {
  const json = serializeaza(graf(nodWebSite(), nodPerson(false), ...noduri));
  return `<!doctype html><html lang="ro"><head><script type="application/ld+json">${json}</script></head></html>`;
}

const FAQ = [{ intrebare: 'Cât durează?', raspuns: 'Depinde de site.' }];
const acasa = { nume: 'Acasă', cale: '/' };

describe('verificaGraf: cazurile din brief', () => {
  test('pagina de serviciu fără Service e respinsă', () =>
    expect(verificaGraf(htmlCuGraf([{ '@type': 'WebSite' }]), '/servicii/seo/')).toContain('lipsește Service'));

  test('@id nerezolvat e respins', () =>
    expect(verificaGraf(htmlCuGraf([{ '@type': 'Service', provider: { '@id': 'x/#nimeni' } }]), '/servicii/seo/')).toContain(
      '@id nerezolvat: x/#nimeni',
    ));
});

describe('verificaGraf: paginile reale din §6.3 trec', () => {
  const serviciu = { slug: 'seo', titlu: 'SEO pentru firme', raspunsDirect: 'Fac site-ul tău mai ușor de găsit.' };
  const pasi = (...pe: { nume: string; cale: string }[]) => nodBreadcrumb([acasa, ...pe]);

  const pagini: [string, string, object[]][] = [
    ['/', 'Acasă', [nodWebPage('/', { despreAlex: true }), nodFaq(FAQ, false)]],
    [
      '/servicii/seo/',
      'serviciu',
      [nodService(serviciu), nodFaq(FAQ, false), pasi({ nume: 'Servicii', cale: '/servicii/' }, { nume: 'SEO', cale: '/servicii/seo/' })],
    ],
    [
      '/servicii/',
      'lista de servicii',
      [nodColectie('servicii', [{ nume: 'SEO', cale: '/servicii/seo/' }]), pasi({ nume: 'Servicii', cale: '/servicii/' })],
    ],
    ['/cum-lucrez/', 'Cum lucrez', [nodWebPage('/cum-lucrez/'), pasi({ nume: 'Cum lucrez', cale: '/cum-lucrez/' })]],
    ['/proiecte/', 'lista de proiecte', [nodColectie('proiecte', []), pasi({ nume: 'Proiecte', cale: '/proiecte/' })]],
    [
      '/proiecte/magazin/',
      'studiu de caz',
      [
        nodArticle({ cale: '/proiecte/magazin/', titlu: 'Un magazin', despre: ['seo'] }),
        pasi({ nume: 'Proiecte', cale: '/proiecte/' }, { nume: 'Un magazin', cale: '/proiecte/magazin/' }),
      ],
    ],
    [
      '/ghiduri/',
      'lista de ghiduri',
      [nodColectie('ghiduri', [{ nume: 'Ghid', cale: '/ghiduri/ghid/' }]), pasi({ nume: 'Ghiduri', cale: '/ghiduri/' })],
    ],
    [
      '/ghiduri/ce-este-seo/',
      'ghid',
      [
        nodArticle({ cale: '/ghiduri/ce-este-seo/', titlu: 'Ce este SEO', publicat: '2026-01-02', actualizat: '2026-02-03' }),
        pasi({ nume: 'Ghiduri', cale: '/ghiduri/' }, { nume: 'Ce este SEO', cale: '/ghiduri/ce-este-seo/' }),
      ],
    ],
    [
      '/despre/',
      'Despre',
      [nodPerson(true), nodProfilePage(), pasi({ nume: 'Despre', cale: '/despre/' })],
    ],
    ['/contact/', 'Contact', [nodContactPage(), pasi({ nume: 'Contact', cale: '/contact/' })]],
    [
      '/politica-cookies/',
      'pagină legală',
      [nodWebPage('/politica-cookies/'), pasi({ nume: 'Politica de cookie-uri', cale: '/politica-cookies/' })],
    ],
  ];

  test.each(pagini)('%s (%s)', (cale, _nume, noduri) => {
    expect(verificaGraf(paginaReala(...noduri), cale)).toEqual([]);
  });

  test('paginile noindex și cele interne cer doar WebSite și Person', () => {
    for (const cale of ['/contact/multumim/', '/contact/eroare/', '/contact/prea-multe-linkuri/', '/404/', '/_test/diacritice/']) {
      expect(verificaGraf(paginaReala(), cale)).toEqual([]);
    }
  });
});

describe('verificaGraf: tabelul de așteptări', () => {
  test('fiecare rută din §6.3 cere tipurile ei: un graf doar cu WebSite și Person le trece pe toate la lipsă', () => {
    const cai = ['/', '/servicii/', '/servicii/seo/', '/cum-lucrez/', '/proiecte/', '/proiecte/x/', '/ghiduri/', '/ghiduri/x/', '/despre/', '/contact/', '/termeni-si-conditii/'];
    for (const cale of cai) {
      const intrare = ASTEPTARI.find((a: { pattern: RegExp }) => a.pattern.test(cale));
      expect(intrare, cale).toBeDefined();
      const erori = verificaGraf(paginaReala(), cale);
      for (const tip of Object.keys(intrare!.tipuri)) {
        if (tip === 'Person') continue; // Person e deja în graf (minimal); Despre îi cere câmpurile
        expect(erori, cale).toContain(`lipsește ${tip}`);
      }
    }
  });

  test('rutele noindex și /contact/multumim/ nu se potrivesc cu rutele paginilor indexabile', () => {
    for (const cale of ['/contact/multumim/', '/contact/eroare/', '/contact/prea-multe-linkuri/', '/404/', '/_test/diacritice/']) {
      expect(ASTEPTARI.find((a: { pattern: RegExp }) => a.pattern.test(cale)), cale).toBeUndefined();
    }
  });
});

describe('verificaGraf: structura scriptului', () => {
  test('fără script JSON-LD', () => {
    expect(verificaGraf('<html><body>fără nimic</body></html>', '/')).toEqual([
      'trebuie exact un <script type="application/ld+json">, am găsit 0',
    ]);
  });

  test('două scripturi JSON-LD', () => {
    const unul = htmlCuGraf([]);
    expect(verificaGraf(unul + unul, '/')).toContain('trebuie exact un <script type="application/ld+json">, am găsit 2');
  });

  test('JSON stricat', () => {
    const erori = verificaGraf('<script type="application/ld+json">{nu e json</script>', '/');
    expect(erori).toHaveLength(1);
    expect(erori[0]).toMatch(/^JSON-LD invalid: /);
  });

  test('fără @graph', () => {
    expect(verificaGraf('<script type="application/ld+json">{"@context":"https://schema.org"}</script>', '/')).toEqual([
      'lipsește @graph (o listă de noduri)',
    ]);
  });

  test('atributele fără ghilimele, ca în HTML-ul minificat de Astro, se găsesc', () => {
    const html = `<script type=application/ld+json>${serializeaza(graf(nodWebSite(), nodPerson(false)))}</script>`;
    expect(verificaGraf(html, '/contact/multumim/')).toEqual([]);
  });

  test('@context greșit', () => {
    const html = '<script type="application/ld+json">{"@context":"http://exemplu.test","@graph":[]}</script>';
    expect(verificaGraf(html, '/contact/multumim/')).toContain('@context trebuie să fie https://schema.org');
  });
});

describe('verificaGraf: câmpuri, legături și interdicții', () => {
  const pasi = nodBreadcrumb([acasa, { nume: 'Servicii', cale: '/servicii/' }, { nume: 'SEO', cale: '/servicii/seo/' }]);
  const serviciu = nodService({ slug: 'seo', titlu: 'SEO', raspunsDirect: 'Răspuns.' });
  const pagina = (...noduri: object[]) => paginaReala(...noduri);

  test('un câmp obligatoriu lipsă e numit', () => {
    const { areaServed: _scos, ...faraZona } = serviciu;
    expect(verificaGraf(pagina(faraZona, nodFaq(FAQ, false), pasi), '/servicii/seo/')).toContain('Service: lipsește câmpul „areaServed”');
  });

  test('un câmp gol (text, listă sau obiect) nu ține loc de valoare', () => {
    const gol = { ...serviciu, description: '  ', serviceType: [], name: {} };
    const erori = verificaGraf(pagina(gol, nodFaq(FAQ, false), pasi), '/servicii/seo/');
    expect(erori).toEqual(
      expect.arrayContaining([
        'Service: lipsește câmpul „description”',
        'Service: lipsește câmpul „serviceType”',
        'Service: lipsește câmpul „name”',
      ]),
    );
  });

  test('url-ul nodului principal trebuie să fie al paginii', () => {
    const altul = { ...serviciu, url: 'https://exemplu.test/servicii/audit-seo/' };
    expect(verificaGraf(pagina(altul, nodFaq(FAQ, false), pasi), '/servicii/seo/')).toContain(
      'Service: url-ul ține de /servicii/audit-seo/, nu de pagina /servicii/seo/',
    );
  });

  test('provider trebuie să trimită la un Person', () => {
    const catreSite = { ...serviciu, provider: { '@id': nodWebSite()['@id'] } };
    expect(verificaGraf(pagina(catreSite, nodFaq(FAQ, false), pasi), '/servicii/seo/')).toContain(
      `Service.provider trebuie să trimită la un Person, nu la ${nodWebSite()['@id']}`,
    );
  });

  test('două noduri cu același @id', () => {
    const erori = verificaGraf(htmlCuGraf([nodWebSite(), nodWebSite(), nodPerson(false)]), '/contact/multumim/');
    expect(erori).toContain(`@id duplicat: ${nodWebSite()['@id']}`);
  });

  test.each(['ProfessionalService', 'Review', 'AggregateRating', 'HowTo'])('tipul %s nu se folosește (§6.3)', (tip) => {
    expect(verificaGraf(paginaReala({ '@type': tip }), '/contact/multumim/')).toContain(`tip interzis: ${tip}`);
  });

  test('o pagină care are un tip interzis ca al doilea @type e prinsă', () => {
    expect(verificaGraf(paginaReala({ '@type': ['LocalBusiness', 'ProfessionalService'] }), '/contact/multumim/')).toContain(
      'tip interzis: ProfessionalService',
    );
  });

  test('Despre cere Person complet, nu cel minimal', () => {
    const erori = verificaGraf(paginaReala(nodProfilePage(), nodBreadcrumb([acasa, { nume: 'Despre', cale: '/despre/' }])), '/despre/');
    expect(erori).toContain('Person: lipsește câmpul „jobTitle”');
    expect(erori).toContain('Person: lipsește câmpul „knowsAbout”');
  });

  test('ghidul cere datele și editorul, studiul de caz cere serviciile folosite', () => {
    const fara = nodArticle({ cale: '/ghiduri/x/', titlu: 'X' });
    const pasiGhid = nodBreadcrumb([acasa, { nume: 'Ghiduri', cale: '/ghiduri/' }, { nume: 'X', cale: '/ghiduri/x/' }]);
    expect(verificaGraf(paginaReala(fara, pasiGhid), '/ghiduri/x/')).toEqual(
      expect.arrayContaining(['Article: lipsește câmpul „datePublished”', 'Article: lipsește câmpul „dateModified”']),
    );
    const pasiCaz = nodBreadcrumb([acasa, { nume: 'Proiecte', cale: '/proiecte/' }, { nume: 'X', cale: '/proiecte/x/' }]);
    expect(verificaGraf(paginaReala(nodArticle({ cale: '/proiecte/x/', titlu: 'X' }), pasiCaz), '/proiecte/x/')).toContain(
      'Article: lipsește câmpul „about”',
    );
  });
});

describe('verificaGraf: BreadcrumbList, ItemList, FAQPage', () => {
  const serviciu = nodService({ slug: 'seo', titlu: 'SEO', raspunsDirect: 'Răspuns.' });
  const verifica = (...noduri: object[]) => verificaGraf(paginaReala(serviciu, nodFaq(FAQ, false), ...noduri), '/servicii/seo/');
  const bun = nodBreadcrumb([acasa, { nume: 'Servicii', cale: '/servicii/' }, { nume: 'SEO', cale: '/servicii/seo/' }]);

  test('firimituri corecte nu dau erori', () => {
    expect(verifica(bun)).toEqual([]);
  });

  test('ultimul pas trebuie să fie pagina curentă', () => {
    const gresit = nodBreadcrumb([acasa, { nume: 'Servicii', cale: '/servicii/' }]);
    expect(verifica(gresit)).toContain('BreadcrumbList: ultimul pas e /servicii/, dar pagina e /servicii/seo/');
  });

  test('primul pas trebuie să fie Acasă', () => {
    const gresit = nodBreadcrumb([{ nume: 'Servicii', cale: '/servicii/' }, { nume: 'SEO', cale: '/servicii/seo/' }]);
    expect(verifica(gresit)).toContain('BreadcrumbList: primul pas e /servicii/, nu Acasă (/)');
  });

  test('pozițiile trebuie să fie 1, 2, 3…', () => {
    const stricat = structuredClone(bun) as { itemListElement: { position: number }[] };
    stricat.itemListElement[1]!.position = 5;
    expect(verifica(stricat)).toContain('BreadcrumbList: pasul 2 are position 5, nu 2');
  });

  test('un pas fără nume sau fără adresă absolută', () => {
    const stricat = structuredClone(bun) as { itemListElement: { name?: string; item: string }[] };
    delete stricat.itemListElement[0]!.name;
    stricat.itemListElement[1]!.item = '/servicii/';
    const erori = verifica(stricat);
    expect(erori).toContain('BreadcrumbList: pasul 1 nu are „name”');
    expect(erori).toContain('BreadcrumbList: pasul 2 nu are „item” cu adresă absolută');
  });

  test('FAQPage fără răspuns', () => {
    const stricat = { '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Cât?' }] };
    const erori = verificaGraf(paginaReala(serviciu, stricat, bun), '/servicii/seo/');
    expect(erori).toContain('FAQPage: întrebarea 1 nu are „acceptedAnswer.text”');
  });

  test('FAQPage fără nicio întrebare', () => {
    const erori = verificaGraf(paginaReala(serviciu, { '@type': 'FAQPage', mainEntity: [] }, bun), '/servicii/seo/');
    expect(erori).toContain('FAQPage: lipsește câmpul „mainEntity”');
  });

  test('ItemList cu numberOfItems greșit', () => {
    const [pagina, lista] = nodColectie('servicii', [{ nume: 'SEO', cale: '/servicii/seo/' }]) as [object, { numberOfItems: number }];
    const stricat = { ...lista, numberOfItems: 4 };
    const erori = verificaGraf(
      paginaReala(pagina, stricat, nodBreadcrumb([acasa, { nume: 'Servicii', cale: '/servicii/' }])),
      '/servicii/',
    );
    expect(erori).toContain('ItemList: numberOfItems e 4, dar lista are 1 elemente');
  });
});
