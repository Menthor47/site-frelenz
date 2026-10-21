// Singura sursă pentru datele site-ului, inclusiv domeniul (folosit și de astro.config.mjs).
// `SITE_URL` suprascrie domeniul doar pentru QA local.
const url = process.env.SITE_URL ?? 'https://site-provizoriu.example';

export const site = {
  url,
  nume: 'Alex Ionescu',
  logoScurt: 'consultant SEO',
  descriere: 'Alex Ionescu – consultant SEO și web design, București',
  // Adresa de destinație a formularului nu stă aici, ci în form-rules.ts (o folosește și Worker-ul).
  email: `contact@${new URL(url).hostname}`,
  telefonAfisat: '0724 230 051',
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
