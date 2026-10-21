import { site } from '../../src/site.config';
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

const ID_WEBSITE = `${site.url}/#website`;
const ID_ALEX = `${site.url}/#alex`;

test('Service are furnizor #alex', () =>
  expect(nodService({ slug: 'seo', titlu: 'x', raspunsDirect: 'y' } as any).provider['@id']).toMatch(/\/#alex$/));

test('Person minimal nu are adresă de stradă', () =>
  expect(JSON.stringify(nodPerson(true))).not.toMatch(/streetAddress/));

test('niciun ProfessionalService', () =>
  expect(JSON.stringify(graf(nodWebSite(), nodPerson(true)))).not.toMatch(/ProfessionalService/));

test('@id-urile sunt cele din spec', () => {
  expect(nodWebSite()['@id']).toBe(ID_WEBSITE);
  expect(nodPerson(false)['@id']).toBe(ID_ALEX);
  expect(nodPerson(true)['@id']).toBe(ID_ALEX);
});

test('WebSite: nume, descrierea fixă, limbă și editor #alex', () => {
  const w = nodWebSite();
  expect(w['@type']).toBe('WebSite');
  expect(w.name).toBe('Alex Ionescu');
  expect(w.alternateName).toBe('Alex Ionescu – consultant SEO și web design, București');
  expect(w.inLanguage).toBe('ro-RO');
  expect(w.publisher).toEqual({ '@id': ID_ALEX });
});

test('Person minimal: doar nume și url spre /despre/', () => {
  const p = nodPerson(false);
  expect(p).toEqual({ '@type': 'Person', '@id': ID_ALEX, name: 'Alex Ionescu', url: `${site.url}/despre/` });
});

describe('Person complet', () => {
  const p = nodPerson(true) as Record<string, any>;

  test('are funcția, descrierea fixă și zona deservită', () => {
    expect(p['@type']).toBe('Person');
    expect(p.jobTitle).toBe('Consultant SEO și web designer');
    expect(p.description).toBe('Alex Ionescu – consultant SEO și web design, București');
    expect(p.areaServed).toEqual({ '@type': 'Country', name: 'România' });
    expect(p.knowsAbout.length).toBeGreaterThan(0);
  });

  test('adresa are doar localitatea și țara', () => {
    expect(p.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'București', addressCountry: 'RO' });
  });

  test('e-mail și telefon vin din site.config', () => {
    expect(p.email).toBe(site.email);
    expect(p.telephone).toBe(site.telefonE164);
  });

  test('fără CUI cunoscut (marcaj), fără fotografie și fără profiluri: nu apar taxID, image, sameAs', () => {
    expect(p).not.toHaveProperty('taxID');
    expect(p).not.toHaveProperty('image');
    expect(p).not.toHaveProperty('sameAs');
    expect(JSON.stringify(p)).not.toContain('DE COMPLETAT');
  });

  test('taxID apare când CUI-ul e cunoscut', () => {
    const cu = nodPerson(true, { cui: 'RO12345678', profiluri: [] }) as Record<string, any>;
    expect(cu.taxID).toBe('RO12345678');
  });

  test('taxID și image nu apar dacă valoarea e un marcaj sau e goală', () => {
    const marcat = nodPerson(true, { cui: '[DE COMPLETAT:#1]', profiluri: [], image: '[DE COMPLETAT:#6]' });
    expect(marcat).not.toHaveProperty('taxID');
    expect(marcat).not.toHaveProperty('image');
    const gol = nodPerson(true, { cui: '', profiluri: [], image: '' });
    expect(gol).not.toHaveProperty('taxID');
    expect(gol).not.toHaveProperty('image');
  });

  test('image devine URL absolut', () => {
    const cu = nodPerson(true, { cui: '', profiluri: [], image: '/alex.jpg' }) as Record<string, any>;
    expect(cu.image).toBe(`${site.url}/alex.jpg`);
  });

  test('sameAs păstrează doar profilurile reale, nu marcajele', () => {
    const cu = nodPerson(true, {
      cui: '',
      profiluri: ['https://www.linkedin.com/in/exemplu/', '[DE COMPLETAT:#20]', ''],
    }) as Record<string, any>;
    expect(cu.sameAs).toEqual(['https://www.linkedin.com/in/exemplu/']);
  });
});

describe('Service', () => {
  const s = nodService({
    slug: 'optimizare-aeo-geo',
    titlu: 'Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)',
    raspunsDirect: 'Răspunsul direct.',
  });

  test('câmpurile din spec', () => {
    expect(s['@type']).toBe('Service');
    expect(s.name).toBe('Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)');
    expect(s.serviceType).toBe('Optimizare AEO și GEO');
    expect(s.description).toBe('Răspunsul direct.');
    expect(s.provider).toEqual({ '@id': ID_ALEX });
    expect(s.areaServed).toEqual({ '@type': 'Country', name: 'România' });
    expect(s.url).toBe(`${site.url}/servicii/optimizare-aeo-geo/`);
  });

  test('serviceType cade pe titlu dacă slug-ul nu e în lista de servicii', () => {
    expect(nodService({ slug: 'necunoscut', titlu: 'Titlu', raspunsDirect: 'r' }).serviceType).toBe('Titlu');
  });
});

describe('BreadcrumbList', () => {
  const b = nodBreadcrumb([
    { nume: 'Acasă', cale: '/' },
    { nume: 'Servicii', cale: '/servicii/' },
    { nume: 'SEO', cale: '/servicii/seo/' },
  ]);

  test('poziții de la 1 și adrese absolute', () => {
    expect(b['@type']).toBe('BreadcrumbList');
    expect(b.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Acasă', item: `${site.url}/` },
      { '@type': 'ListItem', position: 2, name: 'Servicii', item: `${site.url}/servicii/` },
      { '@type': 'ListItem', position: 3, name: 'SEO', item: `${site.url}/servicii/seo/` },
    ]);
  });
});

test('FAQPage: întrebări și răspunsuri', () => {
  const noduri = nodFaq(
    [
      { intrebare: 'Cât durează?', raspuns: 'Depinde.' },
      { intrebare: 'Cât costă?', raspuns: 'Îți spun după ce văd site-ul.' },
    ],
    false,
  );
  expect(noduri).toHaveLength(1);
  const f = noduri[0]!;
  expect(f['@type']).toBe('FAQPage');
  expect(f.mainEntity).toEqual([
    { '@type': 'Question', name: 'Cât durează?', acceptedAnswer: { '@type': 'Answer', text: 'Depinde.' } },
    { '@type': 'Question', name: 'Cât costă?', acceptedAnswer: { '@type': 'Answer', text: 'Îți spun după ce văd site-ul.' } },
  ]);
});

describe('Article', () => {
  test('ghid: titlu, date, autor și editor #alex', () => {
    const a = nodArticle({
      cale: '/ghiduri/de-ce-nu-apare-site-ul-in-google/',
      titlu: 'De ce nu apare site-ul meu în Google?',
      publicat: new Date('2026-10-01'),
      actualizat: new Date('2026-10-15'),
    }) as Record<string, any>;
    expect(a['@type']).toBe('Article');
    expect(a.headline).toBe('De ce nu apare site-ul meu în Google?');
    expect(a.datePublished).toBe('2026-10-01');
    expect(a.dateModified).toBe('2026-10-15');
    expect(a.author).toEqual({ '@id': ID_ALEX });
    expect(a.publisher).toEqual({ '@id': ID_ALEX });
    expect(a.url).toBe(`${site.url}/ghiduri/de-ce-nu-apare-site-ul-in-google/`);
    expect(a.inLanguage).toBe('ro-RO');
  });

  test('studiu de caz: about = serviciile folosite, fără date', () => {
    const a = nodArticle({
      cale: '/proiecte/magazin-online/',
      titlu: 'Magazin online',
      despre: ['seo', 'mentenanta-site'],
    }) as Record<string, any>;
    expect(a.about).toEqual([
      { '@type': 'Service', name: 'SEO', url: `${site.url}/servicii/seo/` },
      { '@type': 'Service', name: 'Mentenanță site', url: `${site.url}/servicii/mentenanta-site/` },
    ]);
    expect(a.author).toEqual({ '@id': ID_ALEX });
    expect(a).not.toHaveProperty('datePublished');
    expect(a).not.toHaveProperty('dateModified');
  });

  test('datele primite ca text rămân neschimbate', () => {
    const a = nodArticle({ cale: '/ghiduri/x/', titlu: 'X', publicat: '2026-10-01' }) as Record<string, any>;
    expect(a.datePublished).toBe('2026-10-01');
  });
});

test('ProfilePage are mainEntity #alex', () => {
  const p = nodProfilePage() as Record<string, any>;
  expect(p['@type']).toBe('ProfilePage');
  expect(p.mainEntity).toEqual({ '@id': ID_ALEX });
  expect(p.url).toBe(`${site.url}/despre/`);
  expect(p.isPartOf).toEqual({ '@id': ID_WEBSITE });
});

test('ContactPage', () => {
  const p = nodContactPage() as Record<string, any>;
  expect(p['@type']).toBe('ContactPage');
  expect(p.url).toBe(`${site.url}/contact/`);
  expect(p.isPartOf).toEqual({ '@id': ID_WEBSITE });
});

describe('WebPage', () => {
  test('simplu: adresa absolută și site-ul din care face parte', () => {
    const p = nodWebPage('/cum-lucrez/') as Record<string, any>;
    expect(p['@type']).toBe('WebPage');
    expect(p.url).toBe(`${site.url}/cum-lucrez/`);
    expect(p.isPartOf).toEqual({ '@id': ID_WEBSITE });
    expect(p.inLanguage).toBe('ro-RO');
    expect(p).not.toHaveProperty('about');
  });

  test('pe Acasă are about #alex', () => {
    const p = nodWebPage('/', { despreAlex: true }) as Record<string, any>;
    expect(p.url).toBe(`${site.url}/`);
    expect(p.about).toEqual({ '@id': ID_ALEX });
  });
});

describe('colecții', () => {
  const servicii = [
    { nume: 'SEO', cale: '/servicii/seo/' },
    { nume: 'Audit SEO', cale: '/servicii/audit-seo/' },
  ];

  test('servicii: CollectionPage legat de un ItemList', () => {
    const noduri = nodColectie('servicii', servicii) as Record<string, any>[];
    const pagina = noduri.find((n) => n['@type'] === 'CollectionPage')!;
    const lista = noduri.find((n) => n['@type'] === 'ItemList')!;
    expect(pagina.url).toBe(`${site.url}/servicii/`);
    expect(pagina.isPartOf).toEqual({ '@id': ID_WEBSITE });
    expect(pagina.mainEntity).toEqual({ '@id': lista['@id'] });
    expect(lista.numberOfItems).toBe(2);
    expect(lista.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'SEO', url: `${site.url}/servicii/seo/` },
      { '@type': 'ListItem', position: 2, name: 'Audit SEO', url: `${site.url}/servicii/audit-seo/` },
    ]);
  });

  test('ghiduri: tot CollectionPage + ItemList', () => {
    const noduri = nodColectie('ghiduri', [{ nume: 'Ghid', cale: '/ghiduri/ghid/' }]) as Record<string, any>[];
    expect(noduri.map((n) => n['@type'])).toEqual(['CollectionPage', 'ItemList']);
    expect(noduri[0]!.url).toBe(`${site.url}/ghiduri/`);
  });

  test('proiecte: doar CollectionPage, fără ItemList (spec 6.3)', () => {
    const noduri = nodColectie('proiecte', [{ nume: 'Proiect', cale: '/proiecte/proiect/' }]) as Record<string, any>[];
    expect(noduri.map((n) => n['@type'])).toEqual(['CollectionPage']);
    expect(noduri[0]!.url).toBe(`${site.url}/proiecte/`);
    expect(noduri[0]).not.toHaveProperty('mainEntity');
  });
});

describe('graf', () => {
  test('un singur @graph cu @context schema.org', () => {
    const g = graf(nodWebSite(), nodPerson(false)) as Record<string, any>;
    expect(g['@context']).toBe('https://schema.org');
    expect(g['@graph']).toHaveLength(2);
  });

  test('aplatizează listele de noduri (nodColectie întoarce mai multe)', () => {
    const g = graf(nodWebSite(), nodColectie('servicii', [{ nume: 'SEO', cale: '/servicii/seo/' }])) as Record<string, any>;
    expect(g['@graph'].map((n: any) => n['@type'])).toEqual(['WebSite', 'CollectionPage', 'ItemList']);
  });

  test('două noduri cu același @id: rămâne cel de la urmă, pe locul primului', () => {
    const g = graf(nodWebSite(), nodPerson(false), nodBreadcrumb([{ nume: 'Acasă', cale: '/' }]), nodPerson(true)) as Record<
      string,
      any
    >;
    const tipuri = g['@graph'].map((n: any) => n['@type']);
    expect(tipuri).toEqual(['WebSite', 'Person', 'BreadcrumbList']);
    expect(g['@graph'][1].jobTitle).toBe('Consultant SEO și web designer');
  });

  test('nodurile fără @id nu se unesc între ele', () => {
    const pereche = [{ intrebare: 'x', raspuns: 'y' }];
    const g = graf(nodFaq(pereche, false), nodFaq(pereche, false)) as Record<string, any>;
    expect(g['@graph']).toHaveLength(2);
  });
});

describe('serializeaza', () => {
  test('întoarce JSON valid', () => {
    const g = graf(nodWebSite());
    expect(JSON.parse(serializeaza(g))).toEqual(g);
  });

  test('< devine \\u003c, deci nu poate închide eticheta <script>', () => {
    const text = serializeaza(graf(nodFaq([{ intrebare: 'x', raspuns: '</script><script>alert(1)</script>' }], false)));
    expect(text).not.toContain('<');
    expect(text).toContain('\\u003c/script>');
    // După parsare, textul inițial se recuperează întreg.
    const inapoi = JSON.parse(text);
    expect(inapoi['@graph'][0].mainEntity[0].acceptedAnswer.text).toBe('</script><script>alert(1)</script>');
  });
});
