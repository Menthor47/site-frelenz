// Aprobarea lui Alex pentru paginile .astro, câte o intrare pe rută (§3.4).
// Rutele au slash la final. O rută construită fără intrare aici e tratată ca neaprobată.
// Serviciile, proiectele și ghidurile se aprobă prin câmpul `aprobat` din frontmatter, nu aici.
export const APROBARI: Record<string, boolean> = {
  '/': false,
  '/servicii/': false,
  '/cum-lucrez/': false,
  '/proiecte/': false,
  '/ghiduri/': false,
  '/despre/': false,
  '/contact/': false,
  '/politica-de-confidentialitate/': false,
  '/politica-cookies/': false,
  '/termeni-si-conditii/': false,
  '/404/': false,
  '/contact/multumim/': false,
  '/contact/eroare/': false,
  '/contact/prea-multe-linkuri/': false,
};

export function paginaAprobata(cale: string): boolean {
  return Object.hasOwn(APROBARI, cale) && APROBARI[cale] === true;
}
