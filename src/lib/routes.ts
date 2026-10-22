// Paginile construite (Task 19): sursa unică pentru imaginile OG, llms.txt și verificarea aprobărilor (check:launch).
// Paginile statice își iau de aici titlul și descrierea (§4.2); serviciile, proiectele și ghidurile, din colecții.
// /proiecte/ și /ghiduri/ se construiesc doar cu conținut publicabil (§3.4), după aceleași reguli ca paginile lor.
import { getCollection } from 'astro:content';
import { paginaAprobata } from '../approvals';
import { SERVICII, type Grup } from '../form-rules';
import { dataIso } from './format';
import { ghiduriDeConstruit, proiectePublicabile } from './publish';

export interface PaginaConstruita {
  /** Cu slash la început și la sfârșit (ex. `/servicii/seo/`). */
  cale: string;
  /** Titlul paginii, fără sufixul „ – Alex Ionescu” (îl adaugă SeoHead). */
  titlu: string;
  /** 140–160 de caractere (§4.2). */
  descriere: string;
  /** Linia de metrou a paginii (serviciu, proiect, ghid); lipsește pe celelalte. */
  grup?: Grup | undefined;
  /** Aprobarea lui Alex (§3.4): `src/approvals.ts` pentru paginile .astro, câmpul `aprobat` pentru colecții. */
  aprobat: boolean;
  /** Data scrisă de mână a textului (ghiduri: actualizat; pagini legale: ultima actualizare), ca să fie verificată la lansare. */
  data?: string | undefined;
}

/** Titlul și descrierea paginilor .astro, câte o intrare pe rută (aceleași rute ca în src/approvals.ts). */
export const PAGINI_STATICE = {
  '/': {
    titlu: 'Consultant SEO din București',
    descriere:
      'Sunt Alex Ionescu, consultant SEO din București. Lucrez la SEO, site-uri de prezentare și audituri pentru firme care vor să fie găsite în Google.',
  },
  '/servicii/': {
    titlu: 'Servicii',
    descriere:
      'Serviciile lui Alex Ionescu, pe patru linii: SEO și căutarea AI, audit, site-uri noi, redesign și mentenanță. Vezi pe scurt ce primești la fiecare.',
  },
  '/cum-lucrez/': {
    titlu: 'Cum lucrez',
    descriere:
      'Cum lucrează Alex Ionescu: evaluare, ofertă, lucru și raport. Alegi o remediere unică sau o remediere urmată de un abonament lunar, pentru firma ta.',
  },
  '/proiecte/': {
    titlu: 'Proiecte',
    descriere:
      'Proiectele lui Alex Ionescu: studii de caz cu problema fiecărui site, ce am făcut și rezultatul care s-a putut dovedi, cu sursa și data lui, scrise ca text.',
  },
  '/ghiduri/': {
    titlu: 'Ghiduri',
    descriere:
      'Ghidurile lui Alex Ionescu: răspunsuri pe înțeles la întrebările pe care și le pun firmele despre SEO, site-uri și căutarea AI, cu răspunsul chiar la început.',
  },
  '/despre/': {
    titlu: 'Despre mine',
    descriere:
      'Cine e Alex Ionescu, consultant SEO și web design din București: ce face, cum lucrează și cu cine, ce experiență are și ce instrumente folosește.',
  },
  '/contact/': {
    titlu: 'Contact',
    descriere:
      'Cere o ofertă lui Alex Ionescu: completează formularul sau scrie-i direct pe e-mail, la telefon sau pe WhatsApp. Lucrează cu firme din toată țara.',
  },
  '/contact/multumim/': {
    titlu: 'Am primit cererea ta',
    descriere:
      'Am primit cererea ta. Mă uit la ce mi-ai scris și la site-ul tău, apoi îți trimit oferta: ce lucrez, în ce ordine și ce primești de la mine.',
  },
  '/contact/eroare/': {
    titlu: 'Mesajul n-a plecat',
    descriere:
      'Mesajul din formular n-a plecat. Apasă Înapoi ca să-l recuperezi și încearcă din nou peste un minut, sau scrie-mi direct pe e-mail sau la telefon.',
  },
  '/contact/prea-multe-linkuri/': {
    titlu: 'Mesajul are prea multe linkuri',
    descriere:
      'Mesajul trimis din formular are prea multe linkuri. Apasă Înapoi ca să-l recuperezi și scoate câteva, sau scrie-mi direct pe e-mail sau la telefon.',
  },
  '/politica-de-confidentialitate/': {
    titlu: 'Politica de confidențialitate',
    descriere:
      'Ce date prelucrează Alex Ionescu când îi scrii prin formular, pe e-mail sau pe WhatsApp: de ce, pe ce temei, cine le mai primește, cât timp și ce drepturi ai.',
    actualizat: '2026-10-22',
  },
  '/politica-cookies/': {
    titlu: 'Politica de cookie-uri',
    descriere:
      'Ce politică de cookie-uri are site-ul lui Alex Ionescu: fără cookie-uri de analiză sau de marketing; singura excepție e un cookie strict necesar al Cloudflare.',
    actualizat: '2026-10-22',
  },
  '/termeni-si-conditii/': {
    titlu: 'Termeni și condiții',
    descriere:
      'Termenii site-ului lui Alex Ionescu: cine îl administrează, cu cine lucrează, ce înseamnă o cerere de ofertă și ce nu se garantează pe acest site.',
    actualizat: '2026-10-22',
  },
  '/404/': {
    titlu: 'Pagina nu există',
    descriere:
      'Pagina pe care ai deschis-o nu există pe site-ul lui Alex Ionescu. Mergi la pagina de pornire, la servicii sau la contact ca să găsești ce căutai acolo.',
  },
} as const satisfies Record<string, { titlu: string; descriere: string; actualizat?: string }>;

export type CaleStatica = keyof typeof PAGINI_STATICE;

const grupul = (slug: string): Grup | undefined => SERVICII.find((s) => s.slug === slug)?.grup;

/** Toate paginile care se construiesc, în producție (`draft` fals) sau în previzualizarea DRAFT=1. */
export async function paginiConstruite(draft: boolean): Promise<PaginaConstruita[]> {
  const servicii = (await getCollection('servicii')).map((i) => i.data).sort((a, b) => a.ordine - b.ordine);
  const proiecte = proiectePublicabile((await getCollection('proiecte')).map((i) => i.data), draft);
  const ghiduri = ghiduriDeConstruit((await getCollection('ghiduri')).map((i) => i.data), draft);

  const lipsesc = new Set<string>([...(proiecte.length === 0 ? ['/proiecte/'] : []), ...(ghiduri.length === 0 ? ['/ghiduri/'] : [])]);
  const statice = Object.entries(PAGINI_STATICE)
    .filter(([cale]) => !lipsesc.has(cale))
    .map(([cale, p]) => ({ cale, titlu: p.titlu, descriere: p.descriere, aprobat: paginaAprobata(cale), data: 'actualizat' in p ? p.actualizat : undefined }));

  return [
    ...statice,
    ...servicii.map((s) => ({ cale: `/servicii/${s.slug}/`, titlu: s.titlu, descriere: s.descriere, grup: s.grup, aprobat: s.aprobat })),
    ...proiecte.map((p) => ({ cale: `/proiecte/${p.slug}/`, titlu: p.titlu, descriere: p.descriere, grup: grupul(p.servicii[0] ?? ''), aprobat: p.aprobat })),
    ...ghiduri.map((g) => ({
      cale: `/ghiduri/${g.slug}/`,
      titlu: g.titlu,
      descriere: g.descriere,
      grup: grupul(g.serviciuLegat),
      aprobat: g.aprobat,
      data: dataIso(g.actualizat),
    })),
  ];
}

/** Calea imaginii Open Graph a unei pagini: `/` → `/og/index.png`, `/servicii/seo/` → `/og/servicii/seo.png`. */
export const ogPentru = (cale: string): string => `/og/${cale === '/' ? 'index' : cale.slice(1, -1)}.png`;
