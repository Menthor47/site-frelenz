import { readFileSync } from 'node:fs';
import { SERVICII } from '../../src/form-rules';
import Service from '../../src/layouts/Service.astro';
import { render, textOf } from './helpers';

// Șablonul paginii de serviciu (§4.4) și tranziția M3 (§5.7, ruling R5). Base citește proiectele și ghidurile prin
// `astro:content`; aici colecțiile sunt goale, ca rezultatul să nu depindă de src/content.
vi.mock('astro:content', () => ({ getCollection: async () => [] }));

const NOTA = 'Nu garantez poziții în Google și nici apariții în răspunsurile motoarelor AI.';

const serviciu = {
  slug: 'seo',
  titlu: 'Servicii SEO pentru firme',
  h1: 'Servicii SEO pentru site-ul firmei tale',
  descriere: 'x'.repeat(150),
  cuvantCheie: 'servicii SEO',
  secundare: ['optimizare SEO site'],
  grup: 'vizibilitate',
  raspunsDirect: 'Ofer servicii SEO pentru firme. Eu, Alex Ionescu, lucrez pe site-ul tău.',
  pentruCine: ['Firme cu site'],
  semne: ['Semnul unu', 'Semnul doi'],
  livrabile: ['Livrabilul unu', 'Livrabilul doi'],
  pasi: ['Pasul unu', 'Pasul doi', 'Pasul trei'],
  faq: [1, 2, 3, 4].map((n) => ({ intrebare: `Întrebarea ${n}?`, raspuns: `Răspunsul ${n}.` })),
  inrudite: ['audit-seo'],
  problema: 'Clienții nu te găsesc în Google când caută ce vinzi.',
  ordine: 1,
  notaGarantii: true,
  aprobat: false,
};

const inrudite = [{ slug: 'audit-seo', nume: 'Audit SEO', problema: 'Vizitele din Google au scăzut și nu știi de ce.' }];

const pagina = (props: Record<string, unknown> = {}) => render(Service, { serviciu, inrudite, ghiduri: [], ...props });
const main = (html: string) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const titluriH2 = (html: string) => [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => textOf(m[1] ?? ''));

describe('Service.astro (§4.4)', () => {
  test('banda de sus are harta statică pe linia grupului și clasa vt-<slug>, înaintea firimiturilor și a H1-ului', async () => {
    const h = main(await pagina());
    const pozitii = ['class="banda vt-seo"', 'data-plina', 'aria-label="Firimituri"', '<h1'].map((e) => h.indexOf(e));
    expect(pozitii.every((p) => p >= 0)).toBe(true);
    expect(pozitii).toEqual([...pozitii].sort((a, b) => a - b));
    // Linia plină e M2, cea a grupului vizibilitate, și are „Ești aici”.
    expect(h).toMatch(/data-linie="M2" data-plina/);
    expect(h).toContain('Ești aici');
  });

  test('firimiturile sunt Acasă › Servicii › numele serviciului', async () => {
    const h = main(await pagina());
    const nav = h.slice(h.indexOf('aria-label="Firimituri"'), h.indexOf('</nav>'));
    expect(textOf(`<nav ${nav}</nav>`)).toBe('Acasă Servicii SEO');
  });

  test('H1-ul, apoi răspunsul direct ca prim paragraf', async () => {
    const h = main(await pagina());
    expect(h).toMatch(/<h1[^>]*>Servicii SEO pentru site-ul firmei tale<\/h1>\s*<p[^>]*>Ofer servicii SEO pentru firme\./);
  });

  test('secțiunile, în ordinea din §4.4', async () =>
    expect(titluriH2(main(await pagina()))).toEqual([
      'Pentru cine e',
      'Semne că ai nevoie',
      'Ce primești',
      'Cum se desfășoară',
      'Întrebări frecvente',
      'Servicii înrudite',
    ]));

  test('pașii sunt numerotați (o secvență), restul listelor nu', async () => {
    const h = main(await pagina());
    const ol = [...h.matchAll(/<ol\b[^>]*>([\s\S]*?)<\/ol>/g)].map((m) => m[1] ?? '').filter((l) => l.includes('Pasul'));
    expect(ol).toHaveLength(1);
    expect(ol[0]?.match(/<li\b/g)).toHaveLength(3);
    expect(h).toMatch(/<ul\b[^>]*>\s*<li\b[^>]*>Livrabilul unu/);
  });

  test('cele 4 întrebări frecvente sunt vizibile', async () => {
    const text = textOf(main(await pagina()));
    for (const n of [1, 2, 3, 4]) expect(text).toContain(`Întrebarea ${n}? Răspunsul ${n}.`);
  });

  test('nota despre garanții apare doar cu notaGarantii, după întrebările frecvente', async () => {
    const cu = textOf(main(await pagina()));
    expect(cu).toContain(NOTA);
    expect(cu.indexOf(NOTA)).toBeGreaterThan(cu.indexOf('Răspunsul 4.'));
    expect(textOf(await pagina({ serviciu: { ...serviciu, notaGarantii: false } }))).not.toContain('Nu garantez');
  });

  test('serviciile înrudite sunt linkuri spre paginile lor', async () => {
    const h = main(await pagina());
    expect(h).toMatch(/<a href="\/servicii\/audit-seo\/"[^>]*>Audit SEO<\/a>/);
  });

  test('ghidul legat și proiectul apar doar dacă le primește pagina', async () => {
    const fara = textOf(main(await pagina()));
    expect(fara).not.toContain('Ghid');
    expect(fara).not.toContain('Proiect');

    const cu = main(
      await pagina({
        ghiduri: [{ slug: 'de-ce-nu-apare-site-ul-in-google', titlu: 'De ce nu apare site-ul meu în Google?' }],
        proiect: { slug: 'magazin-online', titlu: 'Un magazin online', context: 'Un magazin cu vizite puține din Google.' },
      }),
    );
    expect(cu).toContain('href="/ghiduri/de-ce-nu-apare-site-ul-in-google/"');
    expect(cu).toContain('href="/proiecte/magazin-online/"');
    expect(titluriH2(cu)).toEqual([
      'Pentru cine e',
      'Semne că ai nevoie',
      'Ce primești',
      'Cum se desfășoară',
      'Un proiect',
      'Întrebări frecvente',
      'Servicii înrudite',
    ]);
  });

  test('un singur îndemn „Cere o ofertă” în conținut', async () => {
    const h = main(await pagina());
    expect(h.match(/class="buton-cta"/g)).toHaveLength(1);
    expect(textOf(h)).toContain('Cere o ofertă');
  });

  test('JSON-LD: Service, FAQPage și un singur BreadcrumbList', async () => {
    const h = await pagina();
    const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)?.[1] ?? '{}';
    const tipuri = (JSON.parse(json) as { '@graph': { '@type': string }[] })['@graph'].map((n) => n['@type']);
    expect(tipuri.filter((t) => ['Service', 'FAQPage', 'BreadcrumbList'].includes(t)).sort()).toEqual(['BreadcrumbList', 'FAQPage', 'Service']);
  });

  test('fără atribute style și fără scripturi în afară de JSON-LD (CSP, 0 KB JavaScript)', async () => {
    const h = await pagina();
    expect(h).not.toMatch(/\sstyle=/);
    expect(h.match(/<script\b(?![^>]*application\/ld\+json)/g)).toBeNull();
  });
});

describe('transitions.css (M3, §5.7, ruling R5)', () => {
  const css = readFileSync(new URL('../../src/styles/transitions.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  test('navigarea între documente are tranziție doar fără „reduced motion”', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*@view-transition\s*\{\s*navigation: auto;\s*\}\s*\}/);
    expect(css.match(/@view-transition/g)).toHaveLength(1);
  });

  test('cross-fade-ul implicit al paginii e oprit', () =>
    expect(css).toMatch(/::view-transition-old\(root\),\s*::view-transition-new\(root\)\s*\{\s*animation: none;\s*\}/));

  // Banda fără pereche pe cealaltă pagină (de la /servicii/ sau de la un serviciu înrudit) nu are cu ce se transforma:
  // fără regula asta s-ar estompa 300ms, deci ar fi încă o mișcare pe lângă segment.
  test.each(SERVICII.map((s) => s.slug))('segment-%s fără pereche apare și dispare fără animație', (slug) => {
    const reguli = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter((m) => /animation: none;/.test(m[2] ?? '')).map((m) => m[1] ?? '');
    for (const parte of ['old', 'new']) {
      expect(reguli.some((s) => s.includes(`::view-transition-${parte}(segment-${slug}):only-child`))).toBe(true);
    }
  });

  test.each(SERVICII.map((s) => s.slug))('.vt-%s are numele segment-<slug> și durează 300ms, ease-in-out', (slug) => {
    expect(css).toMatch(new RegExp(`\\.vt-${slug}\\s*\\{\\s*view-transition-name: segment-${slug};\\s*\\}`));
    const grup = new RegExp(`::view-transition-group\\(segment-${slug}\\)[^{]*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
    expect(grup).toContain('animation-duration: 300ms;');
    expect(grup).toContain('animation-timing-function: ease-in-out;');
  });
});

describe('Service.astro, culorile grupului (§5.2)', () => {
  const css = readFileSync(new URL('../../src/layouts/Service.astro', import.meta.url), 'utf8')
    .split('<style>')[1]
    ?.replace(/\/\*[\s\S]*?\*\//g, '') ?? '';
  const tokenuri = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  // Numerele pașilor sunt text, nu grafică: verdele (3,47:1) și roșul (3,84:1) trec doar pragul de 3:1 al graficii,
  // deci textul ia varianta închisă, verificată la 4,5:1 în contrast.test.ts. Regulile stau o singură dată, în tokens.css.
  test.each([
    ['vizibilitate', 'blue'],
    ['diagnostic', 'green'],
    ['constructie', 'yellow'],
    ['reparatie', 'red'],
  ])('grupul %s are textul în --%s-dark', (grup, culoare) => {
    const bloc = new RegExp(String.raw`(?:^|\n)\[data-grup='${grup}'\]\s*\{([^}]*)\}`).exec(tokenuri)?.[1] ?? '';
    expect(bloc).toContain(`--culoare-text: var(--${culoare}-dark);`);
  });

  test('șablonul nu-și redefinește culorile grupului', () => expect(css).not.toMatch(/\[data-grup=/));

  test('numerele pașilor folosesc culoarea de text a grupului', () => {
    const bloc = /\.serviciu__pasi li::marker\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(bloc).toContain('color: var(--culoare-text);');
  });
});
