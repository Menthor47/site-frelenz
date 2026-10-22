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

async function formular(cerere: Request): Promise<FormData | undefined> {
  try {
    return await cerere.formData();
  } catch {
    return undefined;
  }
}

async function trimite(env: Env, ...argumente: Parameters<typeof buildEmail>): Promise<Destinatie> {
  try {
    await env.EMAIL.send(buildEmail(...argumente));
    return '/contact/multumim/';
  } catch {
    return '/contact/eroare/';
  }
}

export default {
  async fetch(cerere: Request, env: Env): Promise<Response> {
    const url = new URL(cerere.url);
    if (url.pathname !== CALE) return raspuns(404);
    if (cerere.method !== 'POST') return raspuns(405, { Allow: 'POST' });

    const form = await formular(cerere);
    if (form === undefined) return spre('/contact/eroare/');

    const rezultat = validate(form);
    if (!rezultat.ok && rezultat.motiv === 'capcana') return spre('/contact/multumim/');

    const { success } = await env.RATE_LIMITER.limit({ key: cerere.headers.get('cf-connecting-ip') ?? 'necunoscut' });
    if (!success) return spre('/contact/eroare/');

    if (!rezultat.ok) return spre(rezultat.motiv === 'linkuri' ? '/contact/prea-multe-linkuri/' : '/contact/eroare/');

    return spre(await trimite(env, rezultat.date, `formular@${url.hostname}`, DESTINATAR));
  },
};
