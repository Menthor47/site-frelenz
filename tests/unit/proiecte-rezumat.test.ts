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

// `z.coerce.date()` dă miezul nopții UTC: luna nu trebuie să depindă de fusul orar al mașinii de build.
test('luna rezultatului e cea din UTC', async () => {
  const p = { ...proiect(), rezultate: [{ text: 'Ceva verificabil.', sursa: 'GA', data: new Date('2026-04-01T00:00:00Z') }] };
  expect(textOf(await render(ProiecteRezumat, { proiecte: [p] }))).toContain('(GA, aprilie 2026)');
});

test('în producție, un marcaj din context sau din ce am făcut nu apare ca text brut', async () => {
  const h = await render(ProiecteRezumat, { proiecte: [proiect({ context: '[DE COMPLETAT:#8]', ceAmFacut: '[DE COMPLETAT:#8]' })] });
  expect(h).not.toContain('DE COMPLETAT');
  expect(textOf(h)).toContain('Am rescris titlurile.');
});

test('în producție, rezultatul cu marcaj lipsește (nu e verificabil)', async () => {
  const h = await render(ProiecteRezumat, { proiecte: [proiect({ rezultat: '[DE COMPLETAT:#10]' })] });
  expect(h).not.toContain('DE COMPLETAT');
  expect(h).not.toContain('Search Console');
});

test('în previzualizare, marcajele trec prin Placeholder', async () => {
  stare.draft = true;
  const h = await render(ProiecteRezumat, { proiecte: [proiect({ context: '[DE COMPLETAT:#8]', rezultat: '[DE COMPLETAT:#10]' })] });
  expect(h.match(/<mark class="marcaj">\[DE COMPLETAT:#(?:8|10)\]/g)).toHaveLength(2);
});
