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

// Pe Acasă, proiectele stau sub H2-ul „Proiecte” (H3); pe /proiecte/, direct sub H1 (H2), ca ordinea titlurilor să fie corectă.
test('nivelul titlului proiectului: H3 implicit, H2 la cerere', async () => {
  expect(await render(ProiecteRezumat, { proiecte: [proiect()] })).toMatch(/<h3\b/);
  const h = await render(ProiecteRezumat, { proiecte: [proiect()], nivelTitlu: 2 });
  expect(h).toMatch(/<h2\b[^>]*>\s*<a href="\/proiecte\/magazin-online\/"/);
  expect(h).not.toMatch(/<h3\b/);
});
