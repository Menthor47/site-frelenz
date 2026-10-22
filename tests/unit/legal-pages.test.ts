import Pagina404 from '../../src/pages/404.astro';
import PaginaCookies from '../../src/pages/politica-cookies.astro';
import PaginaConfidentialitate from '../../src/pages/politica-de-confidentialitate.astro';
import PaginaTermeni from '../../src/pages/termeni-si-conditii.astro';
import { adresareFormala } from '../shared/adresare';
import { render, textOf } from './helpers';

// Paginile legale (§7.2, §7.3, §7.4) și 404 (§4.5): la „tu”, formulate precis, fără hartă (§5.6).
const stare = vi.hoisted(() => ({ draft: false }));

vi.mock('../../src/lib/env', () => ({
  get DRAFT() {
    return stare.draft;
  },
}));

vi.mock('astro:content', () => ({ getCollection: async () => [] }));

beforeEach(() => {
  stare.draft = false;
});

const main = (h: string) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));
const titluri = (h: string, nivel: number) =>
  [...h.matchAll(new RegExp(`<h${nivel}\\b[^>]*>([\\s\\S]*?)</h${nivel}>`, 'g'))].map((m) => textOf(m[1] ?? ''));
const tipuri = (h: string) =>
  (JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)?.[1] ?? '{}') as { '@graph': { '@type': string }[] })['@graph'].map(
    (n) => n['@type'],
  );

const LEGALE = [
  ['politica-de-confidentialitate', PaginaConfidentialitate],
  ['politica-cookies', PaginaCookies],
  ['termeni-si-conditii', PaginaTermeni],
] as const;

describe.each(LEGALE)('/%s/', (_, Pagina) => {
  test('fără hartă, cu firimituri; JSON-LD WebPage și un singur BreadcrumbList', async () => {
    const h = await render(Pagina);
    expect(main(h)).not.toContain('class="harta');
    expect(main(h)).toContain('aria-label="Firimituri"');
    expect(tipuri(h).filter((t) => t === 'WebPage')).toHaveLength(1);
    expect(tipuri(h).filter((t) => t === 'BreadcrumbList')).toHaveLength(1);
  });

  test('data ultimei actualizări, cu <time>', async () => expect(main(await render(Pagina))).toMatch(/Ultima actualizare: <time datetime="\d{4}-\d{2}-\d{2}"/));

  test('la „tu”, fără promisiuni interzise, fără atribute style și fără scripturi', async () => {
    const h = await render(Pagina);
    expect(adresareFormala(textOf(main(h)))).toEqual([]);
    expect(h).not.toMatch(/\sstyle=/);
    expect(h.match(/<script\b(?![^>]*application\/ld\+json)/g)).toBeNull();
  });
});

describe('Politica de confidențialitate (§7.2)', () => {
  test('cele 10 puncte, în ordine, cu dreptul de opoziție într-o secțiune separată', async () => {
    expect(titluri(main(await render(PaginaConfidentialitate)), 2)).toEqual([
      'Cine îți prelucrează datele',
      'Ce date prelucrez, de ce și pe ce temei',
      'Cine mai primește datele',
      'Transferuri în afara Spațiului Economic European',
      'Cât timp păstrez datele',
      'Drepturile tale',
      'Dreptul de opoziție',
      'Plângere la ANSPDCP',
      'Dacă nu-mi dai datele',
      'Decizii automate',
    ]);
  });

  test('operatorul are datele firmei complete (LegalId complet)', async () =>
    expect(main(await render(PaginaConfidentialitate))).toContain('date-firma--complet'));

  test('temeiurile: art. 6 alin. (1) lit. (b), (c) și (f), cu interesul legitim numit', async () => {
    const text = textOf(main(await render(PaginaConfidentialitate)));
    for (const temei of ['art. 6 alin. (1) lit. (b)', 'art. 6 alin. (1) lit. (c)', 'art. 6 alin. (1) lit. (f)']) expect(text).toContain(temei);
    for (const interes of ['să răspund cererilor primite de la firme', 'să păstrez istoricul discuției', 'să protejez site-ul de abuz']) {
      expect(text).toContain(interes);
    }
  });

  test('destinatarii și transferurile, fără afirmații neverificate', async () => {
    const text = textOf(main(await render(PaginaConfidentialitate)));
    for (const parte of ['Cloudflare', 'Google', 'contabil', 'WhatsApp', 'Decizia (UE) 2023/1795', 'Google Ireland Limited']) expect(text).toContain(parte);
    expect(text).not.toMatch(/stocate doar în UE|certificat GDPR|conform GDPR/i);
  });

  test('ANSPDCP, cu adresa și e-mailul exacte', async () => {
    const text = textOf(main(await render(PaginaConfidentialitate)));
    expect(text).toContain('B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, 010336 București');
    expect(text).toContain('anspdcp@dataprotection.ro');
  });

  test('durata de păstrare (#17) și data verificării DPF (#22) sunt marcaje, vizibile doar în previzualizare', async () => {
    expect(main(await render(PaginaConfidentialitate))).not.toContain('DE COMPLETAT');
    stare.draft = true;
    const h = main(await render(PaginaConfidentialitate));
    expect(h).toContain('[DE COMPLETAT:#17]');
    expect(h).toContain('[DE COMPLETAT:#22]');
  });

  test('fără decizii automate', async () => expect(textOf(main(await render(PaginaConfidentialitate)))).toContain('Nu iau decizii automate'));
});

describe('Politica de cookie-uri (§7.3)', () => {
  test('textul exact din spec', async () => {
    const text = textOf(main(await render(PaginaCookies)));
    expect(text).toContain(
      'Site-ul nu folosește cookie-uri de analiză, de marketing sau de preferințe și nici tehnologii similare (stocare locală, pixeli, amprentare). Singura excepție: dacă protecția Cloudflare îți cere o verificare de securitate (de exemplu în timpul unui atac), Cloudflare poate seta cookie-ul strict necesar cf_clearance, fără de care verificarea nu funcționează.',
    );
    expect(text).not.toMatch(/niciun cookie/i);
  });
});

describe('Termenii site-ului (§7.4)', () => {
  test('lista din spec, cu frazele exacte', async () => {
    const h = main(await render(PaginaTermeni));
    const text = textOf(h);
    expect(h).toContain('date-firma--complet');
    for (const fraza of [
      'Lucrez doar cu firme, PFA-uri și alte entități profesionale.',
      'Nu garantez poziții în Google și nici apariții în răspunsurile motoarelor AI.',
      'Site-ul e administrat din România, de un PFA înregistrat în România.',
    ]) {
      expect(text).toContain(fraza);
    }
    for (const idee of ['proprietatea autorului', 'informații generale', 'nu obligă pe nimeni', 'ofertă sau contract scris']) expect(text).toContain(idee);
  });

  test('fără clauze comerciale (ele merg în contractul-tip separat)', async () =>
    expect(textOf(main(await render(PaginaTermeni)))).not.toMatch(/preaviz|durata minimă|limitarea răspunderii|legea aplicabilă|plata|plăți/i));
});

describe('404 (§4.5)', () => {
  test('noindex, fără hartă și fără firimituri, cu linkuri spre Acasă, Servicii și Contact', async () => {
    const h = await render(Pagina404);
    expect(h).toMatch(/<meta name="robots" content="noindex"/);
    expect(main(h)).not.toContain('class="harta');
    expect(main(h)).not.toContain('aria-label="Firimituri"');
    for (const cale of ['/', '/servicii/', '/contact/']) expect(main(h)).toContain(`href="${cale}"`);
    expect(titluri(main(h), 1)).toEqual(['Pagina nu există']);
  });

  test('spune ce s-a întâmplat', async () => expect(textOf(main(await render(Pagina404)))).toMatch(/nu duce la nicio pagină/));
});
