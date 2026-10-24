import PasiTraseu from '../../src/components/PasiTraseu.astro';
import { render, textOf } from './helpers';

// Pașii desenați ca linie de metrou (§5.1, §5.6): o listă ordonată, cu stația și linia din CSS (contor și pseudo-elemente),
// deci în HTML rămân doar pașii, în ordine, cu numele ca titlu când există.
const pasi = [
  { nume: 'Evaluare', text: 'Mă uit la site-ul tău.' },
  { nume: 'Ofertă', text: 'Îți trimit oferta.' },
];

test('o listă ordonată, cu un <li> pe pas, în ordinea primită, fără stil inline', async () => {
  const h = await render(PasiTraseu, { pasi });
  expect(h.match(/<ol\b/g)).toHaveLength(1);
  const randuri = [...h.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1] ?? '');
  expect(randuri.map((r) => textOf(/<h3\b[^>]*>([\s\S]*?)<\/h3>/.exec(r)?.[1] ?? ''))).toEqual(['Evaluare', 'Ofertă']);
  expect(randuri.map((r) => textOf(/<p\b[^>]*>([\s\S]*?)<\/p>/.exec(r)?.[1] ?? ''))).toEqual(['Mă uit la site-ul tău.', 'Îți trimit oferta.']);
  expect(h).not.toMatch(/\sstyle=/);
});

test('fără nume, pașii sunt doar fraze, fără titluri', async () => {
  const h = await render(PasiTraseu, { pasi: [{ text: 'Primul.' }, { text: 'Al doilea.' }] });
  expect(h).not.toContain('<h3');
  expect(h).not.toMatch(/pasi-traseu--cu-nume/);
  expect(h).toMatch(/class="[^"]*\bpasi-traseu--grup\b/);
});

test('linia comună și varianta orizontală se aleg prin clase', async () => {
  const h = await render(PasiTraseu, { pasi, linie: 'comuna', orizontal: true });
  const clase = /<ol\b[^>]*class="([^"]*)"/.exec(h)?.[1]?.split(/\s+/) ?? [];
  expect(clase).toEqual(expect.arrayContaining(['pasi-traseu', 'pasi-traseu--comuna', 'pasi-traseu--orizontal', 'pasi-traseu--cu-nume']));
});

test('cuvintele cu cratimă din text nu se rup (FaraRupere)', async () => {
  expect(await render(PasiTraseu, { pasi })).toContain('<span class="fara-rupere">site-ul</span>');
});
