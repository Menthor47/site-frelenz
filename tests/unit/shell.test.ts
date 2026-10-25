import Breadcrumbs from '../../src/components/Breadcrumbs.astro';
import Cta from '../../src/components/Cta.astro';
import Footer from '../../src/components/Footer.astro';
import Header from '../../src/components/Header.astro';
import LegalId from '../../src/components/LegalId.astro';
import { SERVICII } from '../../src/form-rules';
import Base from '../../src/layouts/Base.astro';
import Pagina404 from '../../src/pages/404.astro';
import PaginaEroare from '../../src/pages/contact/eroare.astro';
import PaginaMultumim from '../../src/pages/contact/multumim.astro';
import PaginaPreaMulteLinkuri from '../../src/pages/contact/prea-multe-linkuri.astro';
import PaginaCookies from '../../src/pages/politica-cookies.astro';
import { site } from '../../src/site.config';
import { render, textOf } from './helpers';

// Base citește colecțiile prin `astro:content`; în teste le înlocuim cu date de probă, ca rezultatul să nu depindă de src/content.
const colectii = vi.hoisted(() => ({ proiecte: [] as object[], ghiduri: [] as object[] }));
vi.mock('astro:content', () => ({
  getCollection: async (nume: 'proiecte' | 'ghiduri') => colectii[nume].map((data, i) => ({ id: `${nume}-${i}`, data })),
}));

/** Valorile `href` din HTML, în ordinea în care apar. */
const hrefuri = (html: string): string[] => [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1] ?? '');

const FRAZA_SUBSOL = 'Fără cookie-uri de urmărire și fără scripturi terțe. Vezi cum e făcut site-ul.';

describe('Header', () => {
  test('Acasă, Contact și paginile de răspuns ale formularului nu au buton în antet', async () => {
    for (const cale of ['/', '/contact/', '/contact/multumim/', '/contact/eroare/', '/contact/prea-multe-linkuri/']) {
      expect(await render(Header, { cale }), cale).not.toContain('class="buton-cta"');
    }
    expect(await render(Header, { cale: '/servicii/seo/' })).toContain('Cere o ofertă');
  });

  // Pe telefon, butonul stă lângă logo (doar vizual) și, sub 360px, „Contact” lipsește: Header le marchează prin clase.
  test('cu buton, rândul antetului e marcat pentru telefon, iar „Contact” e marcat ca dublat de buton', async () => {
    const cuButon = await render(Header, { cale: '/servicii/seo/' });
    expect(cuButon).toMatch(/class="[^"]*\bantet__rand--cu-buton\b/);
    expect(cuButon).toMatch(/<li\b[^>]*class="meniu__dublat"[^>]*>\s*<a\b[^>]*href="\/contact\/"/);
    // Ordinea din DOM rămâne logo, meniu, buton (ordinea focusului).
    expect(cuButon.indexOf('class="logo"')).toBeLessThan(cuButon.indexOf('<nav'));
    expect(cuButon.indexOf('<nav')).toBeLessThan(cuButon.indexOf('class="buton-cta"'));
    for (const cale of ['/', '/contact/', '/contact/eroare/']) {
      const faraButon = await render(Header, { cale });
      expect(faraButon, cale).not.toContain('antet__rand--cu-buton');
      expect(faraButon, cale).not.toContain('meniu__dublat');
    }
  });

  test('pe celelalte pagini butonul are clasa buton-cta și duce la /contact/', async () => {
    const h = await render(Header, { cale: '/servicii/seo/' });
    expect(h).toContain('class="buton-cta"');
    expect(hrefuri(h).at(-1)).toBe('/contact/');
  });

  test('logo-ul', async () =>
    expect(textOf(await render(Header, { cale: '/' }))).toContain('Alex Ionescu, consultant SEO'));

  test('logo-ul duce la Acasă, iar virgula și „consultant SEO” au clase proprii', async () => {
    const h = await render(Header, { cale: '/despre/' });
    expect(hrefuri(h)[0]).toBe('/');
    expect(h).toMatch(/<span class="logo__virgula"[^>]*>,<\/span>/);
    expect(h).toMatch(/<span class="logo__rol"[^>]*>consultant SEO<\/span>/);
  });

  test('meniul fără Proiecte și Ghiduri, când nu există', async () => {
    const h = await render(Header, { cale: '/despre/' });
    expect(hrefuri(h)).toEqual(['/', '/servicii/', '/cum-lucrez/', '/despre/', '/contact/', '/contact/']);
  });

  test('meniul complet, în ordinea din spec', async () => {
    const h = await render(Header, { cale: '/despre/', arataProiecte: true, arataGhiduri: true });
    expect(hrefuri(h)).toEqual([
      '/',
      '/servicii/',
      '/cum-lucrez/',
      '/proiecte/',
      '/ghiduri/',
      '/despre/',
      '/contact/',
      '/contact/',
    ]);
  });

  test('Proiecte și Ghiduri apar independent unul de altul', async () => {
    const doarProiecte = hrefuri(await render(Header, { cale: '/', arataProiecte: true }));
    expect(doarProiecte).toContain('/proiecte/');
    expect(doarProiecte).not.toContain('/ghiduri/');
    const doarGhiduri = hrefuri(await render(Header, { cale: '/', arataGhiduri: true }));
    expect(doarGhiduri).toContain('/ghiduri/');
    expect(doarGhiduri).not.toContain('/proiecte/');
  });

  test('pagina curentă și secțiunea ei sunt marcate în meniu', async () => {
    const pagina = await render(Header, { cale: '/despre/' });
    expect(pagina).toMatch(/<a\b[^>]*href="\/despre\/"[^>]*aria-current="page"/);
    const sectiune = await render(Header, { cale: '/servicii/seo/' });
    expect(sectiune).toMatch(/<a\b[^>]*href="\/servicii\/"[^>]*aria-current="true"/);
    expect(sectiune).not.toContain('aria-current="page"');
  });

  test('meniul are nume pentru cititoarele de ecran', async () =>
    expect(await render(Header, { cale: '/' })).toContain('aria-label="Meniu principal"'));
});

describe('Footer', () => {
  test('subsolul fără acest-site nu are fraza', async () =>
    expect(await render(Footer, { arataAcestSite: false, arataProiecte: false })).not.toContain(
      'Vezi cum e făcut site-ul',
    ));

  test('cu acest-site are fraza exactă din §4.3, cu link spre pagină', async () => {
    const h = await render(Footer, { arataAcestSite: true, arataProiecte: true });
    expect(textOf(h)).toContain(FRAZA_SUBSOL);
    expect(h).toMatch(/<a\b[^>]*href="\/proiecte\/acest-site\/"[^>]*>Vezi cum e făcut site-ul<\/a>/);
  });

  test('serviciile apar în ordinea din form-rules, fiecare cu grupul lui', async () => {
    const h = await render(Footer, { arataAcestSite: false, arataProiecte: false });
    const asteptate = [...SERVICII].sort((a, b) => a.ordine - b.ordine);
    for (const s of asteptate) {
      const link = new RegExp(`<a(?=[^>]*href="/servicii/${s.slug}/")(?=[^>]*data-grup="${s.grup}")[^>]*>${s.nume}</a>`);
      expect(h, s.slug).toMatch(link);
    }
    const pozitii = asteptate.map((s) => h.indexOf(`href="/servicii/${s.slug}/"`));
    expect(pozitii).toEqual([...pozitii].sort((a, b) => a - b));
    expect(pozitii.every((p) => p >= 0)).toBe(true);
  });

  test('Proiecte apare în subsol doar cu proiecte publicabile', async () => {
    expect(hrefuri(await render(Footer, { arataAcestSite: false, arataProiecte: true }))).toContain('/proiecte/');
    expect(hrefuri(await render(Footer, { arataAcestSite: false, arataProiecte: false }))).not.toContain('/proiecte/');
  });

  test('paginile, contactul și linkurile legale', async () => {
    const h = await render(Footer, { arataAcestSite: false, arataProiecte: false });
    const linkuri = hrefuri(h);
    for (const cale of [
      '/servicii/',
      '/cum-lucrez/',
      '/despre/',
      '/contact/',
      '/politica-de-confidentialitate/',
      '/politica-cookies/',
      '/termeni-si-conditii/',
      `tel:${site.telefonE164}`,
      site.whatsapp,
      `mailto:${site.email}`,
    ])
      expect(linkuri, cale).toContain(cale);
  });

  test('conține LegalId în varianta scurtă', async () => {
    const h = await render(Footer, { arataAcestSite: false, arataProiecte: false });
    expect(h).toContain('href="/contact/#date-firma"');
    expect(textOf(h)).toContain('București');
  });
});

// LegalId (câmpurile, varianta scurtă/completă, marcajele, DRAFT) are fișierul lui: tests/unit/legal-id.test.ts.

describe('Breadcrumbs', () => {
  const pasi = [
    { nume: 'Acasă', cale: '/' },
    { nume: 'Servicii', cale: '/servicii/' },
  ];

  test('firimiturile', async () => {
    const h = await render(Breadcrumbs, { pasi });
    expect(h).toContain('aria-label="Firimituri"');
    expect(h).toContain('aria-current="page"');
  });

  test('sunt o listă ordonată, iar doar ultimul pas nu e link', async () => {
    const h = await render(Breadcrumbs, { pasi });
    expect(h).toContain('<ol');
    expect(hrefuri(h)).toEqual(['/']);
    expect(h).toMatch(/<span\b[^>]*aria-current="page"[^>]*>Servicii<\/span>/);
    expect(textOf(h)).toBe('Acasă Servicii');
  });
});

describe('Cta', () => {
  test('„Cere o ofertă”, spre /contact/, cu clasa buton-cta', async () => {
    const h = await render(Cta);
    expect(h).toMatch(/<a\b[^>]*class="buton-cta"/);
    expect(hrefuri(h)).toEqual(['/contact/']);
    expect(textOf(h)).toBe('Cere o ofertă');
  });
});

describe('fără atribute style (CSP, §3.6)', () => {
  test.each([
    ['Header', () => render(Header, { cale: '/servicii/', arataProiecte: true, arataGhiduri: true })],
    ['Footer', () => render(Footer, { arataAcestSite: true, arataProiecte: true })],
    ['LegalId', () => render(LegalId, { variant: 'complet' })],
    ['Breadcrumbs', () => render(Breadcrumbs, { pasi: [{ nume: 'Acasă', cale: '/' }] })],
    ['Cta', () => render(Cta)],
  ])('%s', async (_nume, randare) => {
    const h = await randare();
    expect(h).not.toMatch(/\sstyle=/);
    expect(h).not.toMatch(/\son[a-z]+=/);
  });
});

describe('Base', () => {
  const pagina = (props: Record<string, unknown> = {}) =>
    render(Base, { titlu: 'Titlu', descriere: 'Descriere', cale: '/despre/', aprobat: false, ...props });
  /** Partea din HTML dintre două etichete (ex. antetul sau subsolul). */
  const parte = (html: string, eticheta: string) => html.slice(html.indexOf(`<${eticheta}`), html.indexOf(`</${eticheta}>`));

  const anonim = { slug: 'magazin-online', client: 'anonim', acord: false, aprobat: true };
  const acestSite = { slug: 'acest-site', client: 'Alex Ionescu', acord: true, aprobat: true, scoruri: [{ valoare: 100 }] };
  const ghid = (aprobat: boolean) => ({ aprobat });

  beforeEach(() => {
    colectii.proiecte = [];
    colectii.ghiduri = [];
  });

  test('og:type e „website”, iar pe paginile-articol (ghiduri, studii de caz) e „article”, ca în JSON-LD', async () => {
    expect(await pagina()).toMatch(/<meta property="og:type" content="website"/);
    expect(await pagina({ articol: true })).toMatch(/<meta property="og:type" content="article"/);
  });

  test('iconițele (§5.4): favicon.svg, un PNG de 96×96 pentru programele care nu citesc SVG și iconița Apple', async () => {
    const linkuri = [...(await pagina()).matchAll(/<link\b([^>]*)>/g)].map((m) => m[1] ?? '').filter((a) => /\brel="(?:icon|apple-touch-icon)"/.test(a));
    const atribute = (a: string) => Object.fromEntries([...a.matchAll(/\b(rel|href|type|sizes)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
    expect(linkuri.map(atribute)).toEqual(
      expect.arrayContaining([
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'icon', href: '/favicon-96.png', type: 'image/png', sizes: '96x96' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ]),
    );
    expect(linkuri).toHaveLength(3);
  });

  test('ordinea în pagină: linkul de salt, antetul, conținutul, subsolul', async () => {
    const h = await pagina();
    const pozitii = ['class="sari"', '<header', '<main', '<footer'].map((e) => h.indexOf(e));
    expect(pozitii.every((p) => p >= 0)).toBe(true);
    expect(pozitii).toEqual([...pozitii].sort((a, b) => a - b));
  });

  test('antetul primește calea paginii: pe Acasă nu are buton, pe celelalte are', async () => {
    expect(parte(await pagina({ cale: '/' }), 'header')).not.toContain('buton-cta');
    expect(parte(await pagina({ cale: '/despre/' }), 'header')).toContain('buton-cta');
  });

  test('fără firimituri, pagina nu are nici navigația, nici BreadcrumbList', async () => {
    const h = await pagina();
    expect(h).not.toContain('aria-label="Firimituri"');
    expect(h).not.toContain('BreadcrumbList');
  });

  test('cu firimituri: se văd în <main> și intră în singurul JSON-LD al paginii', async () => {
    const firimituri = [
      { nume: 'Acasă', cale: '/' },
      { nume: 'Despre', cale: '/despre/' },
    ];
    const h = await pagina({ firimituri });
    expect(parte(h, 'main')).toContain('aria-label="Firimituri"');

    const scripturi = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(scripturi).toHaveLength(1);
    const noduri = (JSON.parse(scripturi[0]?.[1] ?? '{}') as { '@graph': { '@type': string; itemListElement?: { name: string }[] }[] })['@graph'];
    const lista = noduri.find((nod) => nod['@type'] === 'BreadcrumbList');
    expect(lista?.itemListElement?.map((pas) => pas.name)).toEqual(['Acasă', 'Despre']);
  });

  test('firimiturile primite se adaugă la nodurile JSON-LD ale paginii, nu le înlocuiesc', async () => {
    const h = await pagina({ jsonld: [{ '@type': 'WebPage', url: 'https://exemplu.test/' }], firimituri: [{ nume: 'Acasă', cale: '/' }] });
    expect(h).toContain('"@type":"WebPage"');
    expect(h).toContain('"@type":"BreadcrumbList"');
  });

  test('fără proiecte și ghiduri, meniul și subsolul nu le leagă', async () => {
    const h = await pagina();
    expect(hrefuri(parte(h, 'header'))).not.toContain('/proiecte/');
    expect(hrefuri(parte(h, 'header'))).not.toContain('/ghiduri/');
    expect(hrefuri(parte(h, 'footer'))).not.toContain('/proiecte/');
    expect(h).not.toContain('Vezi cum e făcut site-ul');
  });

  test('un proiect publicabil pune Proiecte în antet și în subsol, dar nu și fraza', async () => {
    colectii.proiecte = [anonim];
    const h = await pagina();
    expect(hrefuri(parte(h, 'header'))).toContain('/proiecte/');
    expect(hrefuri(parte(h, 'footer'))).toContain('/proiecte/');
    expect(h).not.toContain('Vezi cum e făcut site-ul');
  });

  test('un proiect nepublicabil (fără acord, cu nume) nu apare nicăieri', async () => {
    colectii.proiecte = [{ ...anonim, client: 'szitrans.eu', acord: false }];
    const h = await pagina();
    expect(hrefuri(h)).not.toContain('/proiecte/');
  });

  test('fraza din subsol apare doar cu acest-site publicabil', async () => {
    colectii.proiecte = [anonim, acestSite];
    expect(parte(await pagina(), 'footer')).toContain('Vezi cum e făcut site-ul');

    colectii.proiecte = [anonim, { ...acestSite, scoruri: [] }];
    expect(await pagina()).not.toContain('Vezi cum e făcut site-ul');
  });

  test('Ghiduri apare în meniu doar cu cel puțin 2 ghiduri aprobate', async () => {
    colectii.ghiduri = [ghid(true), ghid(false)];
    expect(hrefuri(parte(await pagina(), 'header'))).not.toContain('/ghiduri/');

    colectii.ghiduri = [ghid(true), ghid(true)];
    expect(hrefuri(parte(await pagina(), 'header'))).toContain('/ghiduri/');
  });

  test('banda cu harta stă înaintea firimiturilor; cu `tranzitie`, poartă clasa vt-<slug> (R5)', async () => {
    const firimituri = [
      { nume: 'Acasă', cale: '/' },
      { nume: 'Servicii', cale: '/servicii/' },
      { nume: 'SEO', cale: '/servicii/seo/' },
    ];
    const main = parte(await pagina({ cale: '/servicii/seo/', firimituri, harta: { line: 'vizibilitate', tranzitie: 'seo' } }), 'main');
    const pozitii = ['class="banda vt-seo"', 'class="harta harta--noapte harta--animata harta--banda harta--cu-linie"', 'aria-label="Firimituri"'].map((e) => main.indexOf(e));
    expect(pozitii.every((p) => p >= 0)).toBe(true);
    expect(pozitii).toEqual([...pozitii].sort((a, b) => a - b));
    expect(main.match(/vt-/g)).toHaveLength(1);
  });

  // A-05 din auditul din 2026-10-24: pe paginile cu bandă, primul lucru focusabil din <main> era butonul trenurilor.
  test('cu bandă și firimituri, „Sari la conținut” duce sub bandă, la firimituri, nu la butonul trenurilor', async () => {
    const firimituri = [
      { nume: 'Acasă', cale: '/' },
      { nume: 'Despre', cale: '/despre/' },
    ];
    const h = await pagina({ firimituri, harta: {} });
    expect(h).toContain('<a class="sari" href="#continut">');
    expect(h.match(/\sid="continut"/g)).toHaveLength(1);
    const tinta = h.indexOf(' id="continut"');
    expect(tinta).toBeGreaterThan(h.indexOf('class="harta__buton"'));
    expect(tinta).toBeLessThan(h.indexOf('aria-label="Firimituri"'));
    expect(h.slice(h.lastIndexOf('<', tinta), h.indexOf('>', tinta))).toMatch(/\stabindex="-1"/);
    expect(/<main\b[^>]*>/.exec(h)?.[0]).not.toMatch(/\s(?:id|tabindex)=/);
  });

  test('fără bandă, sau cu bandă dar fără firimituri, ținta saltului rămâne <main>', async () => {
    const firimituri = [{ nume: 'Acasă', cale: '/' }];
    for (const props of [{}, { firimituri }, { harta: {} }]) {
      const h = await pagina(props);
      const main = /<main\b[^>]*>/.exec(h)?.[0] ?? '';
      expect(main, JSON.stringify(props)).toMatch(/\sid="continut"/);
      expect(main, JSON.stringify(props)).toMatch(/\stabindex="-1"/);
      expect(h.match(/\sid="continut"/g), JSON.stringify(props)).toHaveLength(1);
    }
  });

  // A-18: comentariile pentru dezvoltator nu ajung în pagini.
  test('HTML-ul paginii nu are comentarii', async () => {
    expect(await pagina({ harta: {}, firimituri: [{ nume: 'Acasă', cale: '/' }] })).not.toContain('<!--');
  });

  test('fără `tranzitie`, banda nu are nicio clasă vt-, iar fără `harta` nu există nici banda', async () => {
    expect(await pagina({ harta: {} })).toContain('class="banda"');
    expect(await pagina({ harta: {} })).not.toContain('vt-');
    expect(await pagina()).not.toContain('class="banda');
  });

  test('ghidurile nu au link în subsol', async () => {
    colectii.ghiduri = [ghid(true), ghid(true)];
    expect(hrefuri(parte(await pagina(), 'footer'))).not.toContain('/ghiduri/');
  });

  test('suprafata=true pune main--suprafata pe main; implicit, main nu o are', async () => {
    expect(parte(await pagina({ suprafata: true }), 'main')).toContain('class="main--suprafata"');
    expect(parte(await pagina(), 'main')).not.toContain('main--suprafata');
  });

  test('o pagină legală (layout Legal) nu primește main--suprafata', async () => {
    expect(parte(await render(PaginaCookies), 'main')).not.toContain('main--suprafata');
  });

  test('404 și paginile de răspuns ale formularului nu primesc main--suprafata', async () => {
    for (const Pagina of [Pagina404, PaginaEroare, PaginaMultumim, PaginaPreaMulteLinkuri]) {
      expect(parte(await render(Pagina), 'main')).not.toContain('main--suprafata');
    }
  });
});

// 404 (spec metroul îmbunătățit, §6): fraza din §8 și cele cinci pagini din meniu, pe linia cu stații în cerneală; stația ruptă „?” e decor.
describe('404', () => {
  const principal = async () => {
    const h = await render(Pagina404);
    return h.slice(h.indexOf('<main'), h.indexOf('</main>'));
  };
  /** Lista cu stații din 404 și conținutul ei; `null` dacă nu există o listă cu exact clasele liniei în cerneală. */
  const lista = (html: string) => {
    const m = /<(ul|ol)\b[^>]*\sclass="linie-statii linie-statii--cerneala"[^>]*>([\s\S]*?)<\/\1>/.exec(html);
    return m ? { eticheta: m[1] ?? '', continut: m[2] ?? '' } : null;
  };

  test('404: fraza și cele cinci stații, în ordinea meniului', async () => {
    const main = await principal();
    // Fraza stă sub paragraful existent, nu în locul lui.
    expect(textOf(main)).toContain('Ai coborât la o stație care nu e pe hartă. Alege una de mai jos.');
    expect(main.indexOf('nu duce la nicio pagină')).toBeGreaterThan(-1);
    expect(main.indexOf('nu duce la nicio pagină')).toBeLessThan(main.indexOf('Ai coborât la o stație'));

    const statii = lista(main);
    expect(statii, 'lista cu clasele „linie-statii linie-statii--cerneala”').not.toBeNull();
    const linkuri = [...(statii?.continut ?? '').matchAll(/<a\b[^>]*\shref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [m[1], textOf(m[2] ?? '')]);
    expect(linkuri).toEqual([
      ['/', 'Acasă'],
      ['/servicii/', 'Servicii'],
      ['/cum-lucrez/', 'Cum lucrez'],
      ['/despre/', 'Despre'],
      ['/contact/', 'Contact'],
    ]);
    // Câte un `li` pe stație, și niciuna nu e „aici”: pagina nu e pe hartă.
    expect(statii?.continut.match(/<li\b/g)).toHaveLength(5);
    expect(statii?.continut).not.toContain('aria-current');
    // Lista cu trei linkuri de dinainte a dispărut.
    expect(main).not.toContain('negasit__linkuri');
    expect(hrefuri(main)).toEqual(linkuri.map(([href]) => href));

    // „În ordinea meniului”: după Acasă (logo-ul antetului) vin aceleași pagini, în aceeași ordine, ca în meniul principal.
    const antet = await render(Header, { cale: '/404/' });
    const meniu = antet.slice(antet.indexOf('<nav'), antet.indexOf('</nav>'));
    expect(['/', ...hrefuri(meniu)]).toEqual(linkuri.map(([href]) => href));
    expect([...meniu.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((m) => textOf(m[1] ?? ''))).toEqual(linkuri.slice(1).map(([, text]) => text));
  });

  test('stația ruptă e aria-hidden', async () => {
    const main = await principal();
    const svg = /<svg\b[^>]*>[\s\S]*?<\/svg>/.exec(main)?.[0] ?? '';
    // Un singur desen în pagină: stația „?”. Decor pur: ascuns cititorului de ecran, fără nume, fără ținte de focus.
    expect(main.match(/<svg\b/g)).toHaveLength(1);
    expect(svg).toMatch(/^<svg\b[^>]*\saria-hidden="true"/);
    expect(svg).not.toMatch(/\s(?:tabindex|role|aria-label|aria-labelledby|style)=/);
    expect(svg).not.toMatch(/<(?:title|desc|text|a|foreignObject)\b/);
    // Culorile stau în CSS, din tokenuri (`--ink`, `--paper`): niciun `fill`/`stroke` ca atribut și nicio culoare scrisă în desen.
    expect(svg).not.toMatch(/\s(?:fill|stroke)(?:-[a-z]+)?=/);
    expect(svg).not.toMatch(/#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\(|currentColor/i);
    // Nu stă în lista de linkuri, deci nu poate intra în numele niciunui link.
    expect(lista(main)?.continut).not.toContain('<svg');
    expect(main).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<svg\b/);
  });
});
