// Regulile SEO care nu țin de Astro: titlul (§4.2), sitemap-ul (§3.7) și robots.txt.
// `astro.config.mjs` importă acest fișier direct, din Node, deci importul spre config are extensia `.ts`.
import { site } from '../site.config.ts';

/** Cel mult 60 de caractere în total (§4.2). */
const LIMITA_TITLU = 60;
const SUFIX_TITLU = ` – ${site.nume}`;

/**
 * Titlul paginii: „<Titlu> – Alex Ionescu”. Dacă totalul trece de 60 de caractere,
 * sufixul dispare și rămâne doar titlul (ex. pagina AEO/GEO).
 */
export function titluPagina(titlu: string): string {
  const complet = `${titlu}${SUFIX_TITLU}`;
  return complet.length <= LIMITA_TITLU ? complet : titlu;
}

/**
 * Paginile noindex (§6.1), în afara celor din `/_test/`. Rutele au slash la final. Exportată pentru testul bugetului de CSS
 * (tests/e2e/buget-css.spec.ts), care le verifică pe acestea plus pe cele din sitemap: toate paginile publice, dintr-o listă.
 */
export const FARA_SITEMAP: readonly string[] = ['/contact/multumim/', '/contact/eroare/', '/contact/prea-multe-linkuri/', '/404/'];

/** Paginile interne de test se construiesc doar cu `DRAFT=1` și nu ajung niciodată în sitemap. */
const PREFIX_INTERN = '/_test/';

/** Filtrul pentru `@astrojs/sitemap`: primește adresa absolută a paginii. */
export function inSitemap(adresa: string): boolean {
  const { pathname } = new URL(adresa);
  const cale = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return !FARA_SITEMAP.includes(cale) && !cale.startsWith(PREFIX_INTERN);
}

/** Conținutul `robots.txt`: permite tot, inclusiv crawlerele AI (§6.4), și trimite la sitemap. */
export function robotsTxt(): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${site.url}/sitemap-index.xml`, ''].join('\n');
}
