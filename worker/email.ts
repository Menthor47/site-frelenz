// E-mailul cererii (§3.5 punctul 6): un singur mesaj text, UTF-8, cu toate câmpurile și cu Reply-To pe adresa vizitatorului.
// Subiectul: „Cerere de ofertă: <serviciu> – <nume (firmă)>”, sau „Cerere de ofertă – <nume (firmă)>” fără serviciu ales
// („Nu știu încă” înseamnă tot fără serviciu). mimetext codifică subiectul după RFC 2047, ca să treacă diacriticele.
// Se folosește varianta `mimetext/browser`: cea pentru Node ia sfârșitul de rând din `node:os`.
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage, Mailbox } from 'mimetext/browser';
import { SERVICII } from '../src/form-rules';
import type { Cerere } from './validate';

const GOL = '—';

const numeServiciu = (slug: string): string | undefined => SERVICII.find((s) => s.slug === slug)?.nume;

export function buildEmailParts(date: Cerere): { subiect: string; corp: string } {
  const serviciu = numeServiciu(date.serviciu);
  const cine = date.firma === '' ? date.nume : `${date.nume} (${date.firma})`;
  const subiect = serviciu === undefined ? `Cerere de ofertă – ${cine}` : `Cerere de ofertă: ${serviciu} – ${cine}`;

  const camp = (eticheta: string, valoare: string) => `${eticheta}: ${valoare === '' ? GOL : valoare}`;
  const corp = [
    camp('Nume', date.nume),
    camp('E-mail', date.email),
    camp('Telefon', date.telefon),
    camp('Firmă', date.firma),
    camp('Adresa site-ului', date.site),
    camp('Serviciu', serviciu ?? (date.serviciu === 'nu-stiu' ? 'Nu știu încă' : '')),
    '',
    'Mesaj:',
    date.mesaj,
    '',
  ].join('\n');

  return { subiect, corp };
}

/**
 * Corpul pentru `Content-Transfer-Encoding: base64`: textul cu rânduri CRLF (forma canonică a textului, RFC 2045),
 * în UTF-8, apoi base64 pe rânduri de cel mult 76 de caractere. mimetext doar scrie antetul, nu codifică.
 */
function base64Text(text: string): string {
  const octeti = new TextEncoder().encode(text.replaceAll('\n', '\r\n'));
  let binar = '';
  for (const octet of octeti) binar += String.fromCharCode(octet);
  return (btoa(binar).match(/.{1,76}/g) ?? []).join('\r\n');
}

export function buildEmail(date: Cerere, from: string, to: string): EmailMessage {
  const { subiect, corp } = buildEmailParts(date);
  const mesaj = createMimeMessage();
  mesaj.setSender({ addr: from, name: 'Formularul de pe site' });
  mesaj.setRecipient(to);
  // mimetext validează Reply-To doar ca `Mailbox`; adresa a trecut deja de EMAIL_RE, deci nu are rânduri noi.
  mesaj.setHeader('Reply-To', new Mailbox({ addr: date.email }));
  mesaj.setSubject(subiect);
  mesaj.addMessage({ contentType: 'text/plain', charset: 'UTF-8', encoding: 'base64', data: base64Text(corp) });
  return new EmailMessage(from, to, mesaj.asRaw());
}
