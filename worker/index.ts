// Worker-ul formularului (§3.5): primește doar `POST /api/contact` și răspunde doar cu redirecționări 303, 404 și 405.
// Ordinea pașilor e cea din spec: capcana, linkurile, restul regulilor, apoi limita de trimiteri pe IP și un singur e-mail.
// Limita vine ultima, ca să numere doar cererile care chiar pleacă: o cerere respinsă nu consumă din ea (decizia din 2026-10-23).
// Înaintea lor, două verificări ieftine, fără să citească formularul: cererea vine de pe site (nu un formular ascuns de pe
// alt site, care s-ar trimite singur) și corpul are mărimea unui formular. Un corp fără mărime declarată se citește doar
// până la aceeași limită.
// Nu stochează nimic. În producție nu scrie nimic în consolă, nici în ramura de eroare (observability e oprit în
// wrangler.jsonc); doar sub `wrangler dev`, cu `DEBUG_FORM=1` în `.dev.vars`, scrie tipul erorii, fără datele din formular.
// Antetele le pune singur: `_headers` nu se aplică răspunsurilor generate de Worker (§3.6).
// Modulul principal exportă doar handler-ul: workerd tratează orice export numit de aici ca punct de intrare și refuză
// să pornească Worker-ul dacă exportul nu e o funcție (de aceea CORP_MAXIM stă în validate.ts).
import { DESTINATAR } from '../src/form-rules';
import { buildEmail } from './email';
import { CORP_MAXIM, validate } from './validate';

export interface Env {
  EMAIL: SendEmail;
  RATE_LIMITER: RateLimit;
  /** Doar în `.dev.vars` (ignorat de git), pentru `wrangler dev`: „1” scrie în consolă de ce n-a plecat cererea. */
  DEBUG_FORM?: string;
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
 * Cererea vine de pe alt site: browserul o spune prin `Sec-Fetch-Site: cross-site` sau, în browserele mai vechi, prin
 * `Origin`. `Origin: null` (navigare privată, extensii care ascund originea) nu înseamnă alt site, deci trece.
 */
function dePeAltSite(cerere: Request, url: URL): boolean {
  if (cerere.headers.get('sec-fetch-site') === 'cross-site') return true;
  const origine = cerere.headers.get('origin');
  return origine !== null && origine !== 'null' && origine !== url.origin;
}

/** Mărimea declarată a corpului; o cerere fără `Content-Length` (trimisă pe bucăți) e oprită de `citesteCorp`. */
function preaMare(cerere: Request): boolean {
  const lungime = Number(cerere.headers.get('content-length') ?? 0);
  return Number.isFinite(lungime) && lungime > CORP_MAXIM;
}

/** Corpul cererii, citit cel mult până la `CORP_MAXIM` octeți; `null` dacă e mai mare, fără să-l citească până la capăt. */
async function citesteCorp(cerere: Request): Promise<Uint8Array<ArrayBuffer> | null> {
  if (cerere.body === null) return new Uint8Array();
  const cititor = cerere.body.getReader();
  const bucati: Uint8Array[] = [];
  let total = 0;
  for (let bucata = await cititor.read(); !bucata.done; bucata = await cititor.read()) {
    total += bucata.value.byteLength;
    if (total > CORP_MAXIM) {
      await cititor.cancel();
      return null;
    }
    bucati.push(bucata.value);
  }
  const corp = new Uint8Array(total);
  let pozitie = 0;
  for (const bucata of bucati) {
    corp.set(bucata, pozitie);
    pozitie += bucata.byteLength;
  }
  return corp;
}

/** Pagina pentru o cerere respinsă: capcana primește mulțumirea, ca robotul să nu afle că a fost prins. */
const RESPINSA: Readonly<Record<'capcana' | 'linkuri' | 'invalid', Destinatie>> = {
  capcana: '/contact/multumim/',
  linkuri: '/contact/prea-multe-linkuri/',
  invalid: '/contact/eroare/',
};

/**
 * Pașii 2–7 din §3.5, pentru un POST pe /api/contact: capcana, linkurile, celelalte reguli, limita pe IP, apoi e-mailul.
 * Orice eroare (un corp care nu e formular, limitatorul, construirea sau trimiterea e-mailului) ajunge în `fetch`.
 */
async function destinatie(cerere: Request, env: Env, domeniu: string): Promise<Destinatie> {
  const corp = await citesteCorp(cerere);
  if (corp === null) return '/contact/eroare/';
  // Corpul citit se parsează cu tipul cererii (urlencoded sau multipart, cu tot cu `boundary`).
  const formular = await new Response(corp, { headers: { 'content-type': cerere.headers.get('content-type') ?? '' } }).formData();
  const rezultat = validate(formular);
  if (!rezultat.ok) return RESPINSA[rezultat.motiv];

  // Cloudflare pune mereu `cf-connecting-ip`; „necunoscut” e doar pentru cererile fără el (testele, `wrangler dev`).
  const { success } = await env.RATE_LIMITER.limit({ key: cerere.headers.get('cf-connecting-ip') ?? 'necunoscut' });
  if (!success) return '/contact/eroare/';

  await env.EMAIL.send(buildEmail(rezultat.date, `formular@${domeniu}`, DESTINATAR));
  return '/contact/multumim/';
}

export default {
  async fetch(cerere: Request, env: Env): Promise<Response> {
    const url = new URL(cerere.url);
    if (url.pathname !== CALE) return raspuns(404);
    if (cerere.method !== 'POST') return raspuns(405, { Allow: 'POST' });
    if (dePeAltSite(cerere, url) || preaMare(cerere)) return spre('/contact/eroare/');

    // Orice eroare neașteptată duce la pagina de eroare (cu contactele directe), nu la pagina de eroare a platformei.
    const cale = await destinatie(cerere, env, url.hostname).catch((eroare: unknown): Destinatie => {
      if (env.DEBUG_FORM === '1') {
        console.error(`formular: cererea n-a plecat: ${eroare instanceof Error ? `${eroare.name}: ${eroare.message}` : String(eroare)}`);
      }
      return '/contact/eroare/';
    });
    return spre(cale);
  },
};
