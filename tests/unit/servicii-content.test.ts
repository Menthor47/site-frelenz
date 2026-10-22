import type { CollectionEntry } from 'astro:content';
import type { z } from 'astro/zod';
import { collections } from '../../src/content.config';
import { SERVICII } from '../../src/form-rules';
import { hasMarker } from '../../src/lib/marker';
import { adresareFormala } from '../shared/adresare';

// Ciornele celor 6 servicii (src/content/servicii/*.md). Testele verifică regulile de conținut din §2 (#12, #13, #16, #21),
// §4.1–§4.4, §6.4 și §8 pe care schema nu le poate vedea.
// Frontmatter-ul vine din fișiere prin pluginul Markdown al lui Astro (`import.meta.glob`) și trece prin schema colecției,
// ca la build. `getCollection` nu merge aici: în vitest citește depozitul din .astro/, scris doar de `astro sync` sau build.

type DateServiciu = CollectionEntry<'servicii'>['data'];

const schema = collections.servicii.schema as z.ZodType<DateServiciu>;
const fisiere = import.meta.glob<{ frontmatter: unknown }>('../../src/content/servicii/*.md', { eager: true });

async function toate(): Promise<DateServiciu[]> {
  return Object.entries(fisiere)
    .map(([cale, modul]) => {
      const date = schema.parse(modul.frontmatter);
      // Fișierul se numește după slug, ca ruta /servicii/<slug>/ să se găsească ușor în src/content.
      if (!cale.endsWith(`/${date.slug}.md`)) throw new Error(`${cale} are slug-ul „${date.slug}”: fișierul trebuie să fie ${date.slug}.md`);
      return date;
    })
    .sort((a, b) => a.ordine - b.ordine);
}

async function serviciu(slug: string): Promise<DateServiciu> {
  const gasit = (await toate()).find((s) => s.slug === slug);
  if (gasit === undefined) throw new Error(`src/content/servicii nu are serviciul „${slug}”`);
  return gasit;
}

/** Tot textul unui serviciu, fără slug-uri și numere de ordine: ce ajunge pe pagină sau în meta. */
function texte(s: DateServiciu): string[] {
  const { slug: _slug, ordine: _ordine, grup: _grup, inrudite: _inrudite, notaGarantii: _nota, aprobat: _aprobat, faq, ...rest } = s;
  return [...Object.values(rest).flat(), ...faq.flatMap((f) => [f.intrebare, f.raspuns])].filter((v): v is string => typeof v === 'string');
}

const SLUGURI = SERVICII.map((s) => s.slug);

/** Rândurile din „De unde pornești?” (§4.3 punctul 3), exact. */
const PROBLEME: Readonly<Record<string, string>> = {
  seo: 'Clienții nu te găsesc în Google când caută ce vinzi.',
  'optimizare-aeo-geo': 'Firma ta nu apare când cineva întreabă ChatGPT despre domeniul tău.',
  'audit-seo': 'Vizitele din Google au scăzut și nu știi de ce.',
  'creare-site': 'Nu ai încă un site sau ai doar o pagină de Facebook.',
  'redesign-site': 'Site-ul arată învechit și nu mai seamănă cu firma de acum.',
  'mentenanta-site': 'Site-ul n-a mai fost actualizat de mult și se încarcă greu pe telefon.',
};

/** Cuvântul principal și cele secundare, pe pagină (§4.1). */
const CUVINTE: Readonly<Record<string, { principal: string; secundare: string[] }>> = {
  seo: { principal: 'servicii SEO', secundare: ['optimizare SEO site', 'abonament SEO'] },
  'optimizare-aeo-geo': { principal: 'optimizare pentru ChatGPT', secundare: ['AEO', 'GEO', 'vizibilitate în căutarea AI'] },
  'audit-seo': { principal: 'audit SEO', secundare: ['audit site'] },
  'creare-site': { principal: 'creare site de prezentare', secundare: ['realizare site', 'web design', 'site pentru firmă'] },
  'redesign-site': { principal: 'redesign site', secundare: ['refacere site', 'modernizare site'] },
  'mentenanta-site': {
    principal: 'mentenanță site',
    secundare: ['actualizare site', 'întreținere site WordPress', 'abonament mentenanță site'],
  },
};

test('fiecare serviciu din src/form-rules.ts are exact o ciornă, cu același grup și aceeași ordine', async () => {
  const lista = await toate();
  expect(lista.map((s) => s.slug)).toEqual(SLUGURI);
  for (const s of lista) {
    const regula = SERVICII.find((r) => r.slug === s.slug);
    expect({ grup: s.grup, ordine: s.ordine }, s.slug).toEqual({ grup: regula?.grup, ordine: regula?.ordine });
  }
});

test.each(SLUGURI)('%s respectă regulile de conținut', async (slug) => {
  const s = await serviciu(slug);
  expect(s.faq).toHaveLength(4);
  expect(s.descriere.length).toBeGreaterThanOrEqual(140);
  expect(s.descriere.length).toBeLessThanOrEqual(160);
  expect(s.aprobat).toBe(false);
  expect(adresareFormala(JSON.stringify(s))).toEqual([]);
});

test.each(SLUGURI)('%s: niciun proiect legat, niciun marcaj și nicio cifră inventată', async (slug) => {
  const s = await serviciu(slug);
  // Niciun proiect nu e publicabil încă (§3.4): câmpul lipsește până când există unul.
  expect(s.proiect).toBeUndefined();
  // Ce nu se știe (durate, timp de răspuns: rândurile #14 și #18) lipsește, fără marcaj.
  expect(texte(s).filter(hasMarker)).toEqual([]);
  // Fără cifre în text: nimic din ce s-ar putea scrie cu ele (durate, prețuri, rezultate) nu e confirmat.
  expect(texte(s).filter((t) => /\d/.test(t))).toEqual([]);
});

test.each(SLUGURI)('%s: cuvintele-cheie din §4.1, cel principal în H1 și în primul paragraf, care îl numește pe Alex Ionescu', async (slug) => {
  const s = await serviciu(slug);
  const asteptat = CUVINTE[slug]!;
  const mic = (t: string) => t.toLocaleLowerCase('ro');
  expect({ cuvantCheie: s.cuvantCheie, secundare: s.secundare }).toEqual({ cuvantCheie: asteptat.principal, secundare: asteptat.secundare });
  expect(mic(s.h1)).toContain(mic(s.cuvantCheie));
  // Primul paragraf e `raspunsDirect` (§4.4 punctul 2, §6.4): cuvântul principal, exact, și numele lui Alex.
  expect(mic(s.raspunsDirect)).toContain(mic(s.cuvantCheie));
  expect(s.raspunsDirect).toContain('Alex Ionescu');
});

test.each(SLUGURI)('%s: problema e rândul din „De unde pornești?”', async (slug) =>
  expect((await serviciu(slug)).problema).toBe(PROBLEME[slug]));

test.each(SLUGURI)('%s: serviciile înrudite există, sunt altele decât el și nu se repetă', async (slug) => {
  const { inrudite } = await serviciu(slug);
  expect(inrudite.length).toBeGreaterThan(0);
  expect(inrudite).not.toContain(slug);
  expect(new Set(inrudite).size).toBe(inrudite.length);
});

test('descrierile sunt unice (§4.2)', async () => {
  const descrieri = (await toate()).map((s) => s.descriere);
  expect(new Set(descrieri).size).toBe(descrieri.length);
});

test('titlul AEO/GEO și H1-ul de web design', async () => {
  expect((await serviciu('optimizare-aeo-geo')).titlu).toBe('Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)');
  expect((await serviciu('creare-site')).h1).toMatch(/gândit să aducă cereri de ofertă/);
});

test('nota despre garanții doar pe SEO și AEO/GEO', async () =>
  expect((await toate()).filter((s) => s.notaGarantii).map((s) => s.slug)).toEqual(['seo', 'optimizare-aeo-geo']));

test('„servicii SEO” rămâne doar pe /servicii/seo/ (§2 #13)', async () => {
  const cu = (await toate()).filter((s) => texte(s).some((t) => /servicii SEO/i.test(t))).map((s) => s.slug);
  expect(cu).toEqual(['seo']);
});
