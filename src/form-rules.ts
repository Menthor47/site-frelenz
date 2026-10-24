// Regulile formularului și lista serviciilor, într-un singur loc (§3.5).
// Le citesc ContactForm (atributele HTML), schema colecției `servicii` și Worker-ul de pe Cloudflare.
// De aceea fișierul nu importă nimic: nici din Astro, nici din altă parte.

/** Valorile din cod sunt ASCII, iar numele afișate (cu diacritice) se pun în componente. */
export const GRUPURI = ['vizibilitate', 'diagnostic', 'constructie', 'reparatie'] as const;
export type Grup = (typeof GRUPURI)[number];

export interface Serviciu {
  readonly slug: string;
  readonly nume: string;
  readonly grup: Grup;
  /** Ordinea fixă din „De unde pornești?”, /servicii/, subsol, llms.txt și lista din formular. */
  readonly ordine: number;
}

export const SERVICII: readonly Serviciu[] = [
  { slug: 'seo', nume: 'SEO', grup: 'vizibilitate', ordine: 1 },
  { slug: 'optimizare-aeo-geo', nume: 'Optimizare AEO și GEO', grup: 'vizibilitate', ordine: 2 },
  { slug: 'audit-seo', nume: 'Audit SEO', grup: 'diagnostic', ordine: 3 },
  { slug: 'creare-site', nume: 'Creare site', grup: 'constructie', ordine: 4 },
  { slug: 'redesign-site', nume: 'Redesign site', grup: 'reparatie', ordine: 5 },
  { slug: 'mentenanta-site', nume: 'Mentenanță site', grup: 'reparatie', ordine: 6 },
];

/** Serviciul cu slug-ul dat, sau `undefined` (de exemplu „nu-stiu” sau un câmp gol trimis din formular). */
export const gasesteServiciu = (slug: string): Serviciu | undefined => SERVICII.find((s) => s.slug === slug);

/** Serviciul cu slug-ul dat; un slug necunoscut oprește build-ul și spune cine l-a cerut (`deUnde`). */
export function cereServiciu(slug: string, deUnde: string): Serviciu {
  const serviciu = gasesteServiciu(slug);
  if (serviciu === undefined) {
    throw new Error(`${deUnde}: serviciul „${slug}” nu e în src/form-rules.ts (${SERVICII.map((s) => s.slug).join(', ')})`);
  }
  return serviciu;
}

/** Opțiunea din formular pentru cine nu știe încă de ce serviciu are nevoie; în subiectul e-mailului contează ca „fără serviciu”. */
export const FARA_SERVICIU = { slug: 'nu-stiu', nume: 'Nu știu încă' } as const;

/** Adresa la care ajunge cererea trimisă din formular. */
export const DESTINATAR = 'idealserv51@gmail.com';

/**
 * Câmpul ascuns: dacă vine completat, cererea e de la un robot. Numele nu seamănă cu nimic din ce completează singuri
 * browserul sau managerii de parole (adresă, URL, nume, e-mail): un câmp completat așa ar pierde cererea unui om (A-07).
 */
export const CAPCANA = 'camp_rezerva';

export type NumeCamp = 'nume' | 'email' | 'telefon' | 'firma' | 'site' | 'mesaj' | 'serviciu';

export interface RegulaCamp {
  readonly required: boolean;
  /** Numărul maxim de caractere, după ce `\r\n` a devenit `\n`. Lipsește la `serviciu` (select). */
  readonly maxLength?: number;
  readonly type?: 'email' | 'tel';
  /** Numărul maxim de linkuri; doar la `mesaj`. */
  readonly maxLinkuri?: number;
  /** Valorile permise; doar la `serviciu`. */
  readonly optiuni?: readonly string[];
}

export const CAMPURI: Readonly<Record<NumeCamp, RegulaCamp>> = {
  nume: { required: true, maxLength: 100 },
  email: { required: true, maxLength: 254, type: 'email' },
  telefon: { required: false, maxLength: 30, type: 'tel' },
  firma: { required: false, maxLength: 120 },
  site: { required: false, maxLength: 200 },
  mesaj: { required: true, maxLength: 3000, maxLinkuri: 3 },
  serviciu: { required: false, optiuni: [...SERVICII.map((s) => s.slug), FARA_SERVICIU.slug] },
};

/** Algoritmul WHATWG pentru „valid email address”, cel pe care îl aplică browserul la `type=email`. */
export const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
