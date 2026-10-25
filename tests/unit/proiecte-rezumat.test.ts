import { readFileSync } from 'node:fs';
import ProiecteRezumat from '../../src/components/ProiecteRezumat.astro';
import { render, textOf } from './helpers';

// Proiectele de pe Acasă (§4.3 punctul 5): context, ce am făcut, rezultatul și link. Niciun câmp cu marcaj nu se scrie
// ca text brut (§3.4): în producție marcajul nu apare, iar un rezultat cu marcaj nu e verificabil, deci rândul lipsește.
const stare = vi.hoisted(() => ({ draft: false }));

vi.mock('../../src/lib/env', () => ({
  get DRAFT() {
    return stare.draft;
  },
}));

beforeEach(() => {
  stare.draft = false;
});

const proiect = (camp: Partial<Record<'context' | 'ceAmFacut' | 'rezultat', string>> = {}) => ({
  slug: 'magazin-online',
  titlu: 'Un magazin online',
  context: camp.context ?? 'Un magazin online cu vizite în scădere.',
  ceAmFacut: [camp.ceAmFacut ?? 'Am reparat indexarea.', 'Am rescris titlurile.'],
  rezultate: [{ text: camp.rezultat ?? 'Vizitele din Google au crescut.', sursa: 'Search Console', data: new Date('2026-03-01T00:00:00Z') }],
  // Stațiile vizitate: ordinea din frontmatter, cu două servicii dintr-un grup și unul din altul.
  servicii: ['creare-site', 'seo', 'optimizare-aeo-geo'],
});

test('fiecare proiect are titlul ca link, contextul, ce am făcut și rezultatul cu sursa și data', async () => {
  const h = await render(ProiecteRezumat, { proiecte: [proiect()] });
  expect(h).toMatch(/<h3[^>]*>\s*<a href="\/proiecte\/magazin-online\/"[^>]*>Un magazin online<\/a>/);
  const text = textOf(h);
  expect(text).toContain('Un magazin online cu vizite în scădere.');
  expect(text).toContain('Am reparat indexarea. Am rescris titlurile.');
  expect(text).toContain('Vizitele din Google au crescut. (Search Console, martie 2026)');
});

// `z.coerce.date()` dă miezul nopții UTC: luna nu trebuie să depindă de fusul orar al mașinii de build. Testul rulează
// la vest de UTC, unde miezul nopții de 1 aprilie e încă 31 martie în ora locală.
test('luna rezultatului e cea din UTC', async () => {
  const tz = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  try {
    const p = { ...proiect(), rezultate: [{ text: 'Ceva verificabil.', sursa: 'GA', data: new Date('2026-04-01T00:00:00Z') }] };
    expect(textOf(await render(ProiecteRezumat, { proiecte: [p] }))).toContain('(GA, aprilie 2026)');
  } finally {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  }
});

test('în producție, contextul și pașii cu marcaj lipsesc, fără paragraf sau rând de listă gol', async () => {
  const h = await render(ProiecteRezumat, { proiecte: [proiect({ context: '[DE COMPLETAT:#8]', ceAmFacut: '[DE COMPLETAT:#8]' })] });
  expect(h).not.toContain('DE COMPLETAT');
  expect(textOf(h)).toContain('Am rescris titlurile.');
  expect(h.match(/<li\b[^>]*>\s*Am rescris titlurile\.\s*<\/li>/g)).toHaveLength(1);
  expect(h).not.toMatch(/<(p|li)\b[^>]*>\s*<\/\1>/);
});

test('în producție, un proiect al cărui titlu e încă marcaj nu apare (n-ar avea text pe link)', async () => {
  const h = await render(ProiecteRezumat, { proiecte: [{ ...proiect(), titlu: '[DE COMPLETAT:#8]' }, { ...proiect(), slug: 'altul', titlu: 'Altul' }] });
  expect(h).not.toContain('DE COMPLETAT');
  expect(h).not.toContain('/proiecte/magazin-online/');
  expect(h).toContain('/proiecte/altul/');
});

test('în producție, rezultatul cu marcaj lipsește (nu e verificabil)', async () => {
  const h = await render(ProiecteRezumat, { proiecte: [proiect({ rezultat: '[DE COMPLETAT:#10]' })] });
  expect(h).not.toContain('DE COMPLETAT');
  expect(h).not.toContain('Search Console');
});

test('în previzualizare, marcajele trec prin Placeholder', async () => {
  stare.draft = true;
  const h = await render(ProiecteRezumat, {
    proiecte: [{ ...proiect({ context: '[DE COMPLETAT:#8]', rezultat: '[DE COMPLETAT:#10]' }), titlu: '[DE COMPLETAT:#7]' }],
  });
  expect(h.match(/<mark class="marcaj">\[DE COMPLETAT:#(?:7|8|10)\]/g)).toHaveLength(3);
});

// Pe Acasă, proiectele stau sub H2-ul secțiunii „Proiecte: stații vizitate” (H3); pe /proiecte/, direct sub H1 (H2), ca ordinea titlurilor să fie corectă.
test('nivelul titlului proiectului: H3 implicit, H2 la cerere', async () => {
  expect(await render(ProiecteRezumat, { proiecte: [proiect()] })).toMatch(/<h3\b/);
  const h = await render(ProiecteRezumat, { proiecte: [proiect()], nivelTitlu: 2 });
  expect(h).toMatch(/<h2\b[^>]*>\s*<a href="\/proiecte\/magazin-online\/"/);
  expect(h).not.toMatch(/<h3\b/);
});

// Stațiile vizitate (spec metroul îmbunătățit, §6): serviciile proiectului, ca un traseu mic. Segmentul și numele iau culoarea
// grupului prin `data-grup` (tokens.css); numele e scris, deci nimic nu se spune doar în culoare. Traseul nu e interactiv.
/** `ul.proiect__traseu` al primului proiect, cu tot conținutul, sau `''` dacă lipsește. */
const traseu = (h: string) => /<ul\b[^>]*\sclass="(?:[^"]* )?proiect__traseu(?: [^"]*)?"[^>]*>[\s\S]*?<\/ul>/.exec(h)?.[0] ?? '';

test('traseul arată serviciile proiectului, în ordinea lor, cu numele scris', async () => {
  const t = traseu(await render(ProiecteRezumat, { proiecte: [proiect()] }));
  const statii = [...t.matchAll(/<li\b[^>]*\sdata-grup="([a-z]+)"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => [m[1], textOf(m[2] ?? '')]);
  expect(statii).toEqual([
    ['constructie', 'Creare site'],
    ['vizibilitate', 'SEO'],
    ['vizibilitate', 'Optimizare AEO și GEO'],
  ]);
  // Lista are nume pentru cititoarele de ecran; nu e interactivă și nu poartă stil în linie (CSP).
  expect(t).toMatch(/^<ul\b[^>]*\saria-label="Servicii folosite"/);
  expect(t).not.toMatch(/<a\b|<button\b|\stabindex=|\sstyle=|\sonclick=/);
});

test('cu serviciiDeConfirmat, traseul lipsește în producție și apare marcajul în previzualizare', async () => {
  const provizoriu = { ...proiect(), serviciiDeConfirmat: '[DE COMPLETAT:#8]' };
  // Fără marcaj traseul există; altfel testul ar trece și pe o componentă care nu desenează niciun traseu.
  expect(traseu(await render(ProiecteRezumat, { proiecte: [proiect()] }))).not.toBe('');

  const productie = await render(ProiecteRezumat, { proiecte: [provizoriu] });
  expect(traseu(productie)).toBe('');
  expect(productie).not.toContain('DE COMPLETAT');
  expect(productie).not.toContain('Optimizare AEO și GEO');
  expect(productie).not.toMatch(/<(p|li|ul)\b[^>]*>\s*<\/\1>/);

  stare.draft = true;
  const previzualizare = await render(ProiecteRezumat, { proiecte: [provizoriu] });
  expect(traseu(previzualizare)).toBe('');
  expect(previzualizare.match(/<mark class="marcaj">\[DE COMPLETAT:#8\]/g)).toHaveLength(1);
});

// Stilul componentei, fără comentarii (ca metro.css în metro-map.test.ts). Niciun spec e2e nu randează componenta (build-ul de
// producție n-are proiecte), deci cele două reguli care s-au stricat doar la lățimi și moduri extreme se păzesc aici.
const stil = readFileSync(new URL('../../src/components/ProiecteRezumat.astro', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// La 320px cu textul mărit la 200%, 7rem (224px) e mai lat decât interiorul cardului; un minim de coloană fără `min(…, 100%)`
// scotea pagina din lățimea ei (scrollWidth 337 la 320px, pe Acasă și pe /proiecte/).
test('coloanele traseului nu sunt mai late decât rândul: minimul e limitat cu min(…, 100%)', () => {
  expect(stil).toMatch(/\.proiect__traseu\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(min\(7rem,\s*100%\),\s*1fr\)\)/);
});

// Cu culorile forțate, Chrome calculează `background-image: none` pentru un gradient, iar segmentul ar dispărea; fără
// `forced-color-adjust: none`, stațiile și numele rămân pe culorile sistemului, dar segmentul lipsește. Verificat și manual.
test('cu culorile forțate, segmentul rămâne desenat în culoarea textului', () => {
  const fortat = stil.slice(stil.indexOf('@media (forced-colors: active)'));
  expect(fortat).toMatch(/forced-color-adjust:\s*none/);
  expect(fortat).toMatch(/linear-gradient\(CanvasText,\s*CanvasText\)/);
});

test('lângă un rezultat încă de completat nu apare o dată', async () => {
  stare.draft = true;
  expect(textOf(await render(ProiecteRezumat, { proiecte: [proiect({ rezultat: '[DE COMPLETAT:#10]' })] }))).not.toContain('martie 2026');
});
