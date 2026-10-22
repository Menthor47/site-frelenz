// llms.txt (§6.5): un H1 cu descrierea fixă, un rezumat, apoi linkurile: Servicii (6, fiecare cu o frază), Cum lucrez,
// Proiecte publicabile, Ghiduri aprobate, Despre, Contact. Proiectele și ghidurile apar după aceleași reguli ca paginile lor
// (§3.4), deci niciun link nu duce spre o pagină care nu se construiește. Nu e prezentat ca factor de poziționare.
import { getCollection } from 'astro:content';
import { SERVICII } from '../form-rules';
import { site } from '../site.config';
import { ghiduriDeConstruit, proiectePublicabile } from './publish';
import { PAGINI_STATICE } from './routes';

const link = (text: string, cale: string, fraza: string) => `- [${text}](${site.url}${cale}): ${fraza}`;

const sectiune = (titlu: string, randuri: readonly string[]) => (randuri.length === 0 ? [] : [`## ${titlu}`, '', ...randuri, '']);

const REZUMAT =
  'Alex Ionescu e consultant SEO și web design din București și lucrează cu firme, PFA-uri și alte entități profesionale din toată țara: SEO, audit SEO, site-uri de prezentare, redesign, mentenanță și optimizare pentru căutarea AI (AEO și GEO).';

export async function llmsTxt(draft: boolean): Promise<string> {
  const servicii = (await getCollection('servicii')).map((i) => i.data).sort((a, b) => a.ordine - b.ordine);
  const proiecte = proiectePublicabile((await getCollection('proiecte')).map((i) => i.data), draft);
  const ghiduri = ghiduriDeConstruit((await getCollection('ghiduri')).map((i) => i.data), draft);
  const nume = (slug: string) => SERVICII.find((s) => s.slug === slug)?.nume ?? slug;
  const statica = (cale: keyof typeof PAGINI_STATICE, text: string) => link(text, cale, PAGINI_STATICE[cale].descriere);

  return [
    `# ${site.descriere}`,
    '',
    `> ${REZUMAT}`,
    '',
    ...sectiune(
      'Servicii',
      servicii.map((s) => link(nume(s.slug), `/servicii/${s.slug}/`, s.descriere)),
    ),
    ...sectiune('Cum lucrez', [statica('/cum-lucrez/', 'Cum lucrez')]),
    ...sectiune(
      'Proiecte',
      proiecte.map((p) => link(p.titlu, `/proiecte/${p.slug}/`, p.descriere)),
    ),
    ...sectiune(
      'Ghiduri',
      ghiduri.map((g) => link(g.titlu, `/ghiduri/${g.slug}/`, g.descriere)),
    ),
    ...sectiune('Despre', [statica('/despre/', 'Despre Alex Ionescu')]),
    ...sectiune('Contact', [statica('/contact/', 'Contact')]),
  ].join('\n');
}
