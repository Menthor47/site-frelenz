import ContacteDirecte from '../../src/components/ContacteDirecte.astro';
import Footer from '../../src/components/Footer.astro';
import { PAGINI_STATICE } from '../../src/lib/routes';
import PaginaEroare from '../../src/pages/contact/eroare.astro';
import PaginaMultumim from '../../src/pages/contact/multumim.astro';
import PaginaPreaMulteLinkuri from '../../src/pages/contact/prea-multe-linkuri.astro';
import { site } from '../../src/site.config';
import { render, textOf } from './helpers';

// Unde apar iconițele (§5.4; auditul de design din 2026-10-24, D-05): lângă e-mail, telefon și WhatsApp, oriunde site-ul
// le dă ca linkuri de contact, și în titlul paginilor de eroare ale formularului. Base citește colecțiile: aici sunt goale.
vi.mock('astro:content', () => ({ getCollection: async () => [] }));

/** Numele iconițelor dintr-un HTML (`data-iconita`), în ordinea în care apar. */
const iconite = (html: string) => [...html.matchAll(/<svg\b[^>]*\sdata-iconita="([^"]+)"/g)].map((m) => m[1]);

/** Telefonul afișat are spații care nu se rup (U+00A0); `textOf` le face spații obișnuite, deci și valoarea așteptată. */
const telefon = site.telefonAfisat.replace(/\s/g, ' ');

test('contactele directe: fiecare canal are iconița lui, iar textul rândului rămâne același', async () => {
  const h = await render(ContacteDirecte);
  const randuri = [...h.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1] ?? '');
  expect(randuri.map(iconite)).toEqual([['email'], ['telefon'], ['whatsapp']]);
  expect(randuri.map(textOf)).toEqual([`E-mail: ${site.email}`, `Telefon: ${telefon}`, 'WhatsApp: scrie-mi pe WhatsApp']);
});

test('subsolul: telefonul, WhatsApp și e-mailul au iconițele lor, iar linkurile își păstrează textul', async () => {
  const h = await render(Footer, { arataAcestSite: false, arataProiecte: false });
  const contact = h.slice(h.indexOf('>Contact</h2>'));
  expect(iconite(contact)).toEqual(['telefon', 'whatsapp', 'email']);
  const textLinkuri = [...contact.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].slice(0, 3).map((m) => textOf(m[1] ?? ''));
  expect(textLinkuri).toEqual([telefon, 'WhatsApp', site.email]);
});

test.each([
  ['/contact/eroare/', PaginaEroare],
  ['/contact/prea-multe-linkuri/', PaginaPreaMulteLinkuri],
] as const)('%s: titlul are iconița de eroare, iar textul lui rămâne același', async (cale, Pagina) => {
  const titlu = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(await render(Pagina))?.[1] ?? '';
  expect(iconite(titlu)).toEqual(['eroare']);
  expect(textOf(titlu)).toBe(PAGINI_STATICE[cale].titlu);
});

test('pagina de mulțumire nu are iconița de eroare', async () => {
  expect(iconite(await render(PaginaMultumim))).not.toContain('eroare');
});
