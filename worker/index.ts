// Worker-ul formularului (§3.5): primește doar `POST /api/contact` și răspunde doar cu redirecționări 303, 404 și 405.
// Ordinea pașilor e cea din spec: capcana, limita de trimiteri pe IP, linkurile, restul regulilor, apoi un singur e-mail.
// Nu stochează nimic și nu scrie nimic în consolă, nici în ramura de eroare (observability e oprit în wrangler.jsonc).
// Antetele le pune singur: `_headers` nu se aplică răspunsurilor generate de Worker (§3.6).
import { DESTINATAR } from '../src/form-rules';
import { buildEmail } from './email';
import { validate } from './validate';

export interface Env {
  EMAIL: SendEmail;
  RATE_LIMITER: RateLimit;
}

const CALE = '/api/contact';

const ANTETE: Readonly<Record<string, string>> = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex',
};

type Destinatie = '/contact/multumim/' | '/contact/eroare/' | '/contact/prea-multe-linkuri/';

const raspuns = (status: number, antete: Record<string, string> = {}) => new Response(null, { status, headers: { ...ANTETE, ...antete } });

const spre = (cale: Destinatie) => raspuns(303, { Location: cale });

/**
 * Pașii 2–7 din §3.5, pentru un POST pe /api/contact: capcana, limita pe IP, linkurile, celelalte reguli, apoi e-mailul.
 * Orice eroare (un corp care nu e formular, limitatorul, construirea sau trimiterea e-mailului) ajunge în `fetch`.
 */
async function destinatie(cerere: Request, env: Env, domeniu: string): Promise<Destinatie> {
  const rezultat = validate(await cerere.formData());
  if (!rezultat.ok && rezultat.motiv === 'capcana') return '/contact/multumim/';

  const { success } = await env.RATE_LIMITER.limit({ key: cerere.headers.get('cf-connecting-ip') ?? 'necunoscut' });
  if (!success) return '/contact/eroare/';

  if (!rezultat.ok) return rezultat.motiv === 'linkuri' ? '/contact/prea-multe-linkuri/' : '/contact/eroare/';

  await env.EMAIL.send(buildEmail(rezultat.date, `formular@${domeniu}`, DESTINATAR));
  return '/contact/multumim/';
}

export default {
  async fetch(cerere: Request, env: Env): Promise<Response> {
    const url = new URL(cerere.url);
    if (url.pathname !== CALE) return raspuns(404);
    if (cerere.method !== 'POST') return raspuns(405, { Allow: 'POST' });

    // Orice eroare neașteptată duce la pagina de eroare (cu contactele directe), nu la pagina de eroare a platformei.
    const cale = await destinatie(cerere, env, url.hostname).catch((): Destinatie => '/contact/eroare/');
    return spre(cale);
  },
};
