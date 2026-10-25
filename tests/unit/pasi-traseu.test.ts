import { readFileSync } from 'node:fs';
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

// Acțiunea primului pas (§5, „Pasul 1 are acțiune”): linkul stă în primul <li>, după text; săgeata e decor, deci nu intră în
// numele accesibil. Celelalte stații rămân simple fraze.
const randuriDin = (h: string) => [...h.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1] ?? '');

test('actiunePrimulPas pune linkul doar în primul pas', async () => {
  const h = await render(PasiTraseu, { pasi, actiunePrimulPas: { text: 'Trimite cererea', href: '/contact/?serviciu=seo' } });
  const [primul = '', ...celelalte] = randuriDin(h);
  expect(primul).toMatch(/<a\b[^>]*href="\/contact\/\?serviciu=seo"[^>]*>\s*Trimite cererea/);
  expect(primul.match(/<a\b/g)).toHaveLength(1);
  // Linkul vine după textul pasului, nu înaintea lui: se verifică pe marcaj (paragraful se închide, apoi urmează linkul),
  // fiindcă textul pasului trece prin FaraRupere și cuvintele cu cratimă nu apar ca șir întreg în HTML.
  expect(primul).toMatch(/<\/p>\s*<a\b/);
  expect(celelalte).toHaveLength(1);
  for (const rand of celelalte) expect(rand).not.toMatch(/<a\b/);
});

test('săgeata din link e decor (aria-hidden), nu parte din numele linkului', async () => {
  const h = await render(PasiTraseu, { pasi, actiunePrimulPas: { text: 'Trimite cererea', href: '/contact/?serviciu=seo' } });
  const link = /<a\b[^>]*>([\s\S]*?)<\/a>/.exec(h)?.[1] ?? '';
  expect(link).toMatch(/<span\b[^>]*aria-hidden="true"[^>]*>\s*→\s*<\/span>/);
  expect(textOf(link.replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/, ''))).toBe('Trimite cererea');
});

test('fără actiunePrimulPas, niciun link', async () => {
  expect(await render(PasiTraseu, { pasi })).not.toMatch(/<a\b/);
  expect(await render(PasiTraseu, { pasi, actiunePrimulPas: undefined })).not.toMatch(/<a\b/);
});

// Linia comună a celor două trasee (A-14, spec §6): o singură linie în cerneală, fără cele două benzi colorate de dinainte.
// Culorile grupurilor rămân doar pentru servicii (varianta `grup` își ia `--culoare` din `data-grup`).
describe('linia comună în cerneală', () => {
  const sursa = readFileSync(new URL('../../src/components/PasiTraseu.astro', import.meta.url), 'utf8');
  const stiluri = (/<style>([\s\S]*?)<\/style>/.exec(sursa)?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');

  test('--culoare e --ink, fără --culoare-2 și fără degrade', () => {
    const regula = /\.pasi-traseu--comuna\s*\{([^}]*)\}/.exec(stiluri)?.[1] ?? '';
    expect(regula).toMatch(/--culoare:\s*var\(--ink\)/);
    expect(stiluri).not.toContain('--culoare-2');
    expect(stiluri).not.toMatch(/gradient/);
    // Linkul acțiunii primului pas rămâne în --blue-dark (culoarea linkurilor); linia nu ia nicio culoare de grup.
    expect(stiluri).not.toMatch(/--yellow|--green|--red|var\(--blue\)/);
  });

  test('varianta grup nu e atinsă: nu-și declară singură culoarea', () => {
    expect(stiluri).not.toMatch(/\.pasi-traseu--grup\s*\{[^}]*--culoare:/);
  });
});
