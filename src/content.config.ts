// Schemele colecțiilor (§3.4). Regulile de publicare stau în src/lib/publish.ts, aprobările paginilor .astro în src/approvals.ts.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { GRUPURI, SERVICII } from './form-rules';

// Orice slug de serviciu scris în conținut trebuie să existe în form-rules.ts,
// ca formularul, Worker-ul și paginile să accepte exact aceleași valori.
const slugServiciu = z.string().refine((slug) => SERVICII.some((s) => s.slug === slug), {
  error: (issue) => `„${String(issue.input)}” nu e un serviciu din src/form-rules.ts (${SERVICII.map((s) => s.slug).join(', ')})`,
});

const listaDeTexte = z.array(z.string().min(1));

const servicii = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servicii' }),
  schema: z.object({
    slug: slugServiciu,
    titlu: z.string().min(1),
    h1: z.string().min(1),
    descriere: z.string().min(140).max(160),
    cuvantCheie: z.string().min(1),
    secundare: listaDeTexte,
    grup: z.enum(GRUPURI),
    raspunsDirect: z.string().min(1),
    pentruCine: listaDeTexte,
    semne: listaDeTexte,
    livrabile: listaDeTexte,
    pasi: listaDeTexte,
    faq: z.array(z.object({ intrebare: z.string().min(1), raspuns: z.string().min(1) })).length(4),
    inrudite: z.array(slugServiciu),
    proiect: z.string().min(1).optional(),
    problema: z.string().min(1),
    ordine: z.number().int().positive(),
    notaGarantii: z.boolean(),
    aprobat: z.boolean(),
  }),
});

const proiecte = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proiecte' }),
  // Schema e o funcție ca să primească `image()`: capturile se importă prin astro:assets (§9.1), cu lățime și înălțime.
  schema: ({ image }) =>
    z.object({
      slug: z.string().min(1),
      titlu: z.string().min(1),
      // Meta description (§4.2): fiecare studiu de caz e o pagină.
      descriere: z.string().min(140).max(160),
      // Numele clientului sau „anonim”.
      client: z.string().min(1),
      acord: z.boolean(),
      aprobat: z.boolean(),
      context: z.string().min(1),
      problema: z.string().min(1),
      ceAmFacut: listaDeTexte,
      rezultate: z.array(
        z.object({
          text: z.string().min(1),
          sursa: z.string().min(1),
          data: z.coerce.date(),
        }),
      ),
      // Prima intrare dă linia de metrou a proiectului (§4.1).
      servicii: z.array(slugServiciu).min(1),
      // Marcajul [DE COMPLETAT:#n] cât timp serviciile de mai sus sunt provizorii (un slug nu poate fi marcaj).
      serviciiDeConfirmat: z.string().regex(/^\[DE COMPLETAT:#\d+\]$/).optional(),
      // `src`: calea imaginii, relativă la fișierul .md (ex. `./szitrans/acasa.png`).
      capturi: z.array(z.object({ src: image(), alt: z.string().min(1) })).default([]),
      // Doar pentru `acest-site`: scorurile Lighthouse măsurate în producție.
      scoruri: z
        .array(
          z.object({
            valoare: z.number().min(0).max(100),
            data: z.coerce.date(),
            versiuneLighthouse: z.string().min(1),
            sursa: z.string().min(1),
          }),
        )
        .optional(),
    }),
});

const ghiduri = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ghiduri' }),
  schema: z.object({
    slug: z.string().min(1),
    // Sub formă de întrebare (judecată de conținut, nu regulă de punctuație).
    titlu: z.string().min(1),
    // Meta description (§4.2): fiecare ghid e o pagină.
    descriere: z.string().min(140).max(160),
    // Primul paragraf, cel pe care îl citesc motoarele AI.
    raspuns: z.string().min(1),
    publicat: z.coerce.date(),
    actualizat: z.coerce.date(),
    aprobat: z.boolean(),
    serviciuLegat: slugServiciu,
  }),
});

export const collections = { servicii, proiecte, ghiduri };
