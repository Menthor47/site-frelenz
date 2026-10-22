// Nodurile JSON-LD din §6.3. Funcțiile primesc date simple (de ex. `entry.data` din colecții), nu intrări Astro.
// Pe fiecare pagină nodurile se adună într-un singur `@graph` prin `graf(...)`, legate prin `@id`.
import { SERVICII } from '../form-rules';
import { site } from '../site.config';
import { intrebariVizibile, type IntrebareFrecventa } from './faq';
import { hasMarker } from './marker';

export const ID_WEBSITE = `${site.url}/#website`;
export const ID_ALEX = `${site.url}/#alex`;

const LIMBA = 'ro-RO';
const ROMANIA = { '@type': 'Country', name: 'România' } as const;

const absolut = (cale: string): string => new URL(cale, site.url).href;

/** O valoare opțională există dacă nu e goală și nu e un marcaj `[DE COMPLETAT:#…]` (§2 #17). */
const areValoare = (v: string | undefined): v is string => v !== undefined && v.trim() !== '' && !hasMarker(v);

const numeServiciu = (slug: string): string | undefined => SERVICII.find((s) => s.slug === slug)?.nume;

/** Data în formatul ISO `AAAA-LL-ZZ`; un text primit rămâne neschimbat. */
const data = (d: Date | string): string => (typeof d === 'string' ? d : d.toISOString().slice(0, 10));

export function nodWebSite() {
  return {
    '@type': 'WebSite',
    '@id': ID_WEBSITE,
    url: absolut('/'),
    name: site.nume,
    // Descrierea fixă din §4.2.
    alternateName: site.descriere,
    inLanguage: LIMBA,
    publisher: { '@id': ID_ALEX },
  };
}

/** Datele din care se construiește `Person` complet; implicit vin din `site.config`. */
export interface DatePersoana {
  /** CUI-ul, doar dacă e cunoscut (un marcaj nu se scrie în JSON-LD). */
  cui: string;
  /** Profiluri reale pentru `sameAs`, inclusiv Google Business Profile. */
  profiluri: readonly string[];
  /** Fotografia reală, doar după ce există (cale de pe site sau adresă absolută). */
  image?: string;
}

const DATE_SITE: DatePersoana = { cui: site.pfa.cui, profiluri: site.profiluri };

/**
 * `Person` minimal (name, url spre /despre/) pe toate paginile; complet doar pe Despre.
 * La complet nu apare niciodată adresa de stradă, iar `taxID`, `sameAs` și `image` apar doar când au valoare reală.
 */
export function nodPerson(complet: boolean, date: DatePersoana = DATE_SITE) {
  const minimal = {
    '@type': 'Person',
    '@id': ID_ALEX,
    name: site.nume,
    url: absolut('/despre/'),
  };
  if (!complet) return minimal;

  const sameAs = date.profiluri.filter(areValoare);
  return {
    ...minimal,
    jobTitle: 'Consultant SEO și web designer',
    description: site.descriere,
    address: { '@type': 'PostalAddress', addressLocality: site.oras, addressCountry: 'RO' },
    areaServed: ROMANIA,
    knowsAbout: SERVICII.map((s) => s.nume),
    email: site.email,
    telephone: site.telefonE164,
    ...(areValoare(date.cui) && { taxID: date.cui }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(areValoare(date.image) && { image: absolut(date.image) }),
  };
}

export interface DateServiciu {
  slug: string;
  titlu: string;
  raspunsDirect: string;
}

export function nodService(s: DateServiciu) {
  return {
    '@type': 'Service',
    name: s.titlu,
    serviceType: numeServiciu(s.slug) ?? s.titlu,
    description: s.raspunsDirect,
    provider: { '@id': ID_ALEX },
    areaServed: ROMANIA,
    url: absolut(`/servicii/${s.slug}/`),
  };
}

export interface PasFirimitura {
  nume: string;
  /** Calea paginii, cu slash la început și la sfârșit. */
  cale: string;
}

export function nodBreadcrumb(pasi: readonly PasFirimitura[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: pasi.map((pas, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: pas.nume,
      item: absolut(pas.cale),
    })),
  };
}

/**
 * `FAQPage` din perechile pe care le arată și pagina (`intrebariVizibile`, aceeași regulă ca în `Faq`): în producție, o pereche
 * cu marcaj nu intră în JSON-LD. Întoarce o listă de noduri, ca `nodColectie`: goală dacă nu rămâne nicio pereche.
 */
export function nodFaq(faq: readonly IntrebareFrecventa[], draft: boolean) {
  const vizibile = intrebariVizibile(faq, draft);
  if (vizibile.length === 0) return [];
  return [
    {
      '@type': 'FAQPage',
      mainEntity: vizibile.map((f) => ({
        '@type': 'Question',
        name: f.intrebare,
        acceptedAnswer: { '@type': 'Answer', text: f.raspuns },
      })),
    },
  ];
}

export interface DateArticol {
  /** Calea paginii, cu slash la început și la sfârșit. */
  cale: string;
  titlu: string;
  /** Doar la ghiduri. */
  publicat?: Date | string;
  /** Doar la ghiduri. */
  actualizat?: Date | string;
  /** Slug-urile serviciilor folosite (studiu de caz): devin `about`. */
  despre?: readonly string[];
}

/** `Article` pentru ghiduri și studii de caz: autor și editor sunt mereu `#alex`. */
export function nodArticle(a: DateArticol) {
  const url = absolut(a.cale);
  const despre = (a.despre ?? []).map((slug) => {
    const nume = numeServiciu(slug);
    if (nume === undefined) throw new Error(`Serviciu necunoscut în Article.about: „${slug}” nu e în src/form-rules.ts`);
    return { '@type': 'Service', name: nume, url: absolut(`/servicii/${slug}/`) };
  });
  return {
    '@type': 'Article',
    headline: a.titlu,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: LIMBA,
    author: { '@id': ID_ALEX },
    publisher: { '@id': ID_ALEX },
    ...(a.publicat !== undefined && { datePublished: data(a.publicat) }),
    ...(a.actualizat !== undefined && { dateModified: data(a.actualizat) }),
    ...(despre.length > 0 && { about: despre }),
  };
}

export function nodProfilePage() {
  return {
    '@type': 'ProfilePage',
    url: absolut('/despre/'),
    inLanguage: LIMBA,
    isPartOf: { '@id': ID_WEBSITE },
    mainEntity: { '@id': ID_ALEX },
  };
}

export function nodContactPage() {
  return {
    '@type': 'ContactPage',
    url: absolut('/contact/'),
    inLanguage: LIMBA,
    isPartOf: { '@id': ID_WEBSITE },
  };
}

export interface OptiuniWebPage {
  /** Pe Acasă: pagina vorbește despre `#alex`. */
  despreAlex?: boolean;
}

export function nodWebPage(cale: string, optiuni: OptiuniWebPage = {}) {
  return {
    '@type': 'WebPage',
    url: absolut(cale),
    inLanguage: LIMBA,
    isPartOf: { '@id': ID_WEBSITE },
    ...(optiuni.despreAlex === true && { about: { '@id': ID_ALEX } }),
  };
}

/** Paginile de listă. Conform §6.3, doar `servicii` și `ghiduri` au și `ItemList`; `proiecte` are doar `CollectionPage`. */
const COLECTII = {
  servicii: { nume: 'Servicii', cale: '/servicii/', cuLista: true },
  proiecte: { nume: 'Proiecte', cale: '/proiecte/', cuLista: false },
  ghiduri: { nume: 'Ghiduri', cale: '/ghiduri/', cuLista: true },
} as const;

export type TipColectie = keyof typeof COLECTII;

export interface ElementColectie {
  nume: string;
  /** Calea paginii elementului, cu slash la început și la sfârșit. */
  cale: string;
}

/** `CollectionPage` și, unde spec-ul o cere, `ItemList` legat prin `@id`. Întoarce o listă de noduri; `graf` o aplatizează. */
export function nodColectie(tip: TipColectie, elemente: readonly ElementColectie[]): object[] {
  const { nume, cale, cuLista } = COLECTII[tip];
  const url = absolut(cale);
  const idLista = `${url}#lista`;
  const pagina = {
    '@type': 'CollectionPage',
    url,
    name: nume,
    inLanguage: LIMBA,
    isPartOf: { '@id': ID_WEBSITE },
    ...(cuLista && { mainEntity: { '@id': idLista } }),
  };
  if (!cuLista) return [pagina];
  const lista = {
    '@type': 'ItemList',
    '@id': idLista,
    numberOfItems: elemente.length,
    itemListElement: elemente.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.nume,
      url: absolut(e.cale),
    })),
  };
  return [pagina, lista];
}

/** Nodurile specifice unei pagini, cum le dă Base lui JsonLd: cele primite, plus BreadcrumbList dacă pagina are firimituri. */
export function noduriPagina(jsonld: readonly (object | readonly object[])[], firimituri: readonly PasFirimitura[]): (object | readonly object[])[] {
  return firimituri.length > 0 ? [...jsonld, nodBreadcrumb(firimituri)] : [...jsonld];
}

/** Tipurile din `@graph`-ul paginii, în ordine, cu WebSite și Person pe care le pune JsonLd (fișa de pe acest-site, §5.5). */
export function tipuriPagina(jsonld: readonly (object | readonly object[])[], firimituri: readonly PasFirimitura[]): string[] {
  const g = graf(nodWebSite(), nodPerson(false), ...noduriPagina(jsonld, firimituri)) as { '@graph': { '@type': string }[] };
  return g['@graph'].map((nod) => nod['@type']);
}

/**
 * Adună nodurile într-un singur `@graph`. Acceptă și liste de noduri (ca cea de la `nodColectie`).
 * Două noduri cu același `@id` se unesc: rămâne cel de la urmă, pe locul celui dintâi,
 * așa că `nodPerson(true)` de pe Despre îl înlocuiește pe cel minimal pus de `JsonLd`.
 */
export function graf(...noduri: (object | readonly object[])[]): object {
  const rezultat: object[] = [];
  const pozitii = new Map<string, number>();
  for (const intrare of noduri) {
    const lista: readonly object[] = Array.isArray(intrare) ? (intrare as readonly object[]) : [intrare as object];
    for (const nod of lista) {
      const id = (nod as { '@id'?: unknown })['@id'];
      if (typeof id === 'string') {
        const pozitie = pozitii.get(id);
        if (pozitie !== undefined) {
          rezultat[pozitie] = nod;
          continue;
        }
        pozitii.set(id, rezultat.length);
      }
      rezultat.push(nod);
    }
  }
  return { '@context': 'https://schema.org', '@graph': rezultat };
}

/**
 * JSON-ul pentru `<script type="application/ld+json">`. `<` devine `<`, ca un text cu `</script>`
 * din conținut să nu poată închide eticheta; după parsare, textul rămâne cel inițial.
 */
export function serializeaza(g: object): string {
  return JSON.stringify(g).replaceAll('<', '\\u003c');
}
