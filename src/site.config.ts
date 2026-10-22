// Singura sursă pentru datele site-ului, inclusiv domeniul (folosit și de astro.config.mjs).
// `SITE_URL` suprascrie domeniul doar pentru QA local.
/** Domeniul provizoriu, până îl alege Alex (registrul, #3); check:launch refuză lansarea cu el. */
export const DOMENIU_PROVIZORIU = 'https://site-provizoriu.example';

const url = process.env.SITE_URL ?? DOMENIU_PROVIZORIU;

export const site = {
  url,
  nume: 'Alex Ionescu',
  logoScurt: 'consultant SEO',
  descriere: 'Alex Ionescu – consultant SEO și web design, București',
  // Adresa de destinație a formularului nu stă aici, ci în form-rules.ts (o folosește și Worker-ul).
  email: `contact@${new URL(url).hostname}`,
  // Spații fără rupere (U+00A0), ca numărul să nu se rupă pe două rânduri; html-validate cere asta (tel-non-breaking).
  telefonAfisat: '0724\u00a0230\u00a0051',
  telefonE164: '+40724230051',
  whatsapp: 'https://wa.me/40724230051',
  oras: 'București',
  pfa: {
    denumire: '[DE COMPLETAT:#1]',
    nrRegCom: '[DE COMPLETAT:#1]',
    cui: '[DE COMPLETAT:#1]',
    sediu: '[DE COMPLETAT:#2]',
  },
  profiluri: [] as string[],
};
