// Ce trebuie să conțină fiecare pagină, pe rută: nodurile JSON-LD din §6.3, scripturile permise (§9.1)
// și dacă pagina e noindex (§6.1). O citesc `check-schema.mjs`, testele Playwright și Lighthouse.
import { inSitemap } from '../src/lib/seo.ts';

// Câmpurile obligatorii pe tip de nod. Un câmp gol (text cu spații, listă sau obiect fără chei) nu ține loc de valoare.
const WEBSITE = ['name', 'alternateName', 'inLanguage', 'publisher'];
const PERSON = ['name', 'url'];
const PERSON_COMPLET = [...PERSON, 'jobTitle', 'description', 'address', 'areaServed', 'knowsAbout', 'email', 'telephone'];
const SERVICE = ['name', 'serviceType', 'description', 'provider', 'areaServed', 'url'];
const BREADCRUMB = ['itemListElement'];
const FAQ = ['mainEntity'];
const PAGINA = ['url', 'inLanguage', 'isPartOf'];
const COLECTIE = [...PAGINA, 'name'];
const ITEM_LIST = ['itemListElement', 'numberOfItems'];
const ARTICOL_GHID = ['headline', 'url', 'datePublished', 'dateModified', 'author', 'publisher'];
const ARTICOL_CAZ = ['headline', 'url', 'about', 'author'];

/** Pe toate paginile, noindex și interne inclusiv: `WebSite` și `Person` (minimal). */
export const PE_TOATE = { WebSite: WEBSITE, Person: PERSON };

/**
 * Tabelul din §6.3, pe rută. `tipuri`: nodurile cerute în plus față de `PE_TOATE`, fiecare cu câmpurile lui.
 * `pagina`: tipul nodului care descrie pagina însăși, al cărui `url` trebuie să fie chiar ruta.
 * Rutele sunt exacte: `/contact/multumim/`, `/404/` și `/_test/…` nu se potrivesc cu nicio intrare, deci cer doar `PE_TOATE`.
 */
export const ASTEPTARI = [
  {
    pattern: /^\/$/,
    tipuri: { WebPage: [...PAGINA, 'about'], FAQPage: FAQ },
    pagina: 'WebPage',
  },
  {
    pattern: /^\/servicii\/$/,
    tipuri: { CollectionPage: [...COLECTIE, 'mainEntity'], ItemList: ITEM_LIST, BreadcrumbList: BREADCRUMB },
    pagina: 'CollectionPage',
  },
  {
    pattern: /^\/servicii\/[^/]+\/$/,
    tipuri: { Service: SERVICE, BreadcrumbList: BREADCRUMB, FAQPage: FAQ },
    pagina: 'Service',
  },
  {
    pattern: /^\/cum-lucrez\/$/,
    tipuri: { WebPage: PAGINA, BreadcrumbList: BREADCRUMB },
    pagina: 'WebPage',
  },
  {
    pattern: /^\/proiecte\/$/,
    tipuri: { CollectionPage: COLECTIE, BreadcrumbList: BREADCRUMB },
    pagina: 'CollectionPage',
  },
  {
    // Studiu de caz (și /proiecte/acest-site/).
    pattern: /^\/proiecte\/[^/]+\/$/,
    tipuri: { Article: ARTICOL_CAZ, BreadcrumbList: BREADCRUMB },
    pagina: 'Article',
  },
  {
    pattern: /^\/ghiduri\/$/,
    tipuri: { CollectionPage: [...COLECTIE, 'mainEntity'], ItemList: ITEM_LIST, BreadcrumbList: BREADCRUMB },
    pagina: 'CollectionPage',
  },
  {
    pattern: /^\/ghiduri\/[^/]+\/$/,
    tipuri: { Article: ARTICOL_GHID, BreadcrumbList: BREADCRUMB },
    pagina: 'Article',
  },
  {
    // `Person` complet îl înlocuiește pe cel minimal (același @id), deci câmpurile se cer pe același tip.
    pattern: /^\/despre\/$/,
    tipuri: { ProfilePage: [...PAGINA, 'mainEntity'], Person: PERSON_COMPLET, BreadcrumbList: BREADCRUMB },
    pagina: 'ProfilePage',
  },
  {
    pattern: /^\/contact\/$/,
    tipuri: { ContactPage: PAGINA, BreadcrumbList: BREADCRUMB },
    pagina: 'ContactPage',
  },
  {
    pattern: /^\/(?:politica-de-confidentialitate|politica-cookies|termeni-si-conditii)\/$/,
    tipuri: { WebPage: PAGINA, BreadcrumbList: BREADCRUMB },
    pagina: 'WebPage',
  },
];

/** Tipurile pe care §6.3 le exclude: `ProfessionalService` e învechit, recenziile proprii nu sunt eligibile, `HowTo` nu se folosește. */
export const TIPURI_INTERZISE = ['ProfessionalService', 'Review', 'AggregateRating', 'HowTo'];

/** Câmpurile care trebuie să trimită prin `{ "@id": … }` la un nod de un anumit tip (`Tip.câmp` → tipul țintei). */
export const LEGATURI = {
  'WebSite.publisher': 'Person',
  'Service.provider': 'Person',
  'Article.author': 'Person',
  'Article.publisher': 'Person',
  'WebPage.about': 'Person',
  'WebPage.isPartOf': 'WebSite',
  'CollectionPage.isPartOf': 'WebSite',
  'CollectionPage.mainEntity': 'ItemList',
  'ProfilePage.isPartOf': 'WebSite',
  'ProfilePage.mainEntity': 'Person',
  'ContactPage.isPartOf': 'WebSite',
};

/** Ce cere ruta `cale`: tipurile (cu câmpuri) din `PE_TOATE` plus cele din intrarea ei, și tipul paginii (sau `undefined`). */
export function asteptariPentru(cale) {
  const intrare = ASTEPTARI.find((a) => a.pattern.test(cale));
  return { tipuri: { ...PE_TOATE, ...intrare?.tipuri }, pagina: intrare?.pagina };
}

/**
 * Câte `<script>` fără JSON-LD are voie pagina, citit din HTML-ul ei, ca în §9.1 (după decizia 28), fără o listă de rute:
 * - 1 pe orice pagină cu hartă animată (trenurile și butonul de oprire; MetroMap o marchează cu clasa `harta--animata`);
 * - +1 pe pagina cu fișa de măsurători (PageFacts; clasa `fisa`), adică `/proiecte/acest-site/`;
 * - 0 pe paginile fără hartă (legale, 404, răspunsurile formularului) și pe cele cu harta statică.
 * Contează clasa din atributul `class`, nu o aceeași denumire din CSS-ul inline.
 */
export function scripturiPermise(html) {
  const arClasa = (clasa) => new RegExp(`class="([^"]*\\s)?${clasa}(\\s[^"]*)?"`).test(html);
  return (arClasa('harta--animata') ? 1 : 0) + (arClasa('fisa') ? 1 : 0);
}

/**
 * Paginile noindex (§6.1) și cele interne `/_test/…` sunt exact cele care lipsesc din sitemap (`src/lib/seo.ts`):
 * lista are o singură sursă.
 */
export function esteNoindex(cale) {
  return !inSitemap(new URL(cale, 'http://qa.invalid').href);
}
