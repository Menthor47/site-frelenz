import { readFileSync } from 'node:fs';
import MetroMap from '../../src/components/MetroMap.astro';
import { TRASEE } from '../../src/lib/harta';
import { render } from './helpers';

// Harta de metrou (§5.6): statică pe paginile de serviciu, animată (cu trenuri și buton de oprire) pe Acasă.

test('harta statică cu linia vizibilitate are „Ești aici” pe M2', async () => {
  const h = await render(MetroMap, { variant: 'static', line: 'vizibilitate' });
  expect(h).toMatch(/data-linie="M2"[^>]*data-plina/); expect(h).toContain('Ești aici');
});

test('harta animată: trenurile sunt ascunse din CSS, iar butonul are hidden', async () => {
  const h = await render(MetroMap, { variant: 'animated' });
  expect(h).toContain('class="trenuri"'); expect(h).toMatch(/<button[^>]*hidden[^>]*>Oprește trenurile/);
});

test.each([
  ['vizibilitate', 'M2'],
  ['diagnostic', 'M4'],
  ['constructie', 'M1'],
  ['reparatie', 'M3'],
] as const)('grupul %s are linia %s plină, iar celelalte rămân estompate', async (line, linie) => {
  const h = await render(MetroMap, { variant: 'static', line });
  const pline = [...h.matchAll(/data-linie="(M\d)"[^>]*data-plina/g)].map((m) => m[1]);
  expect(pline).toEqual([linie]);
  expect(h.match(/Ești aici/g)).toHaveLength(1);
});

test('harta statică fără linie: toate liniile la fel de estompate, fără „Ești aici”', async () => {
  const h = await render(MetroMap, { variant: 'static' });
  for (const linie of ['M1', 'M2', 'M3', 'M4']) expect(h).toContain(`data-linie="${linie}"`);
  expect(h).not.toContain('data-plina');
  expect(h).not.toContain('Ești aici');
});

test('harta statică nu are trenuri, buton sau script', async () => {
  const h = await render(MetroMap, { variant: 'static', line: 'reparatie' });
  expect(h).not.toContain('trenuri');
  expect(h).not.toContain('<button');
  expect(h).not.toContain('<script');
});

test('rădăcina are clasa harta, SVG-ul e decorativ, iar butonul stă în afara lui', async () => {
  const h = await render(MetroMap, { variant: 'animated' });
  expect(h).toMatch(/^<div class="harta[ "]/);
  expect(h).toMatch(/<svg[^>]*aria-hidden="true"/);
  expect(h.indexOf('<button')).toBeGreaterThan(h.indexOf('</svg>'));
  expect(h).toMatch(/<button type="button"/);
  expect(h).not.toContain('aria-pressed');
});

test('harta animată: câte un tren pe fiecare linie, pe traseul ei, pornit doar de script (begin="indefinite")', async () => {
  const h = await render(MetroMap, { variant: 'animated' });
  const trenuri = h.slice(h.indexOf('class="trenuri"'));
  for (const linie of ['M1', 'M2', 'M3', 'M4']) {
    const traseu = h.match(new RegExp(`data-linie="${linie}"[^>]*>\\s*<path[^>]*\\sd="([^"]+)"`))?.[1];
    expect(traseu, `traseul liniei ${linie}`).toBeDefined();
    const tren = trenuri.match(new RegExp(`data-linie="${linie}"[^>]*>[\\s\\S]*?(<animateMotion[^>]*>)`))?.[1] ?? '';
    expect(tren).toContain(`path="${traseu}"`);
    expect(tren).toContain('begin="indefinite"');
    expect(tren).toContain('repeatCount="indefinite"');
  }
  expect(trenuri.match(/<animateMotion\b/g)).toHaveLength(4);
  // Pe Acasă nicio linie nu e plină (data-plina): „Ești aici” e doar în marcajele ascunse, câte unul pe linie (testul de mai jos).
  expect(h).not.toContain('data-plina');
});

// Spec §3: harta de pe Acasă primește câte un „Ești aici” pe fiecare linie, ascuns din CSS; îl arată (în task-ul 10) doar
// linia aleasă de vizitator. Pozițiile vin din TRASEE, ca marcajul benzii.
test('harta de pe Acasă are câte un Ești aici ascuns pe fiecare linie', async () => {
  const h = await render(MetroMap, { variant: 'animated' });
  const grupuri = [...h.matchAll(/<g class="harta__aici-grup"[^>]*>([\s\S]*?)<\/g>/g)];
  expect(grupuri).toHaveLength(4);
  expect(h.match(/Ești aici/g)).toHaveLength(4);
  for (const t of TRASEE) {
    const grup = grupuri.filter((g) => g[0].includes(`data-linie="${t.linie}"`));
    expect(grup, `un singur marcaj pe ${t.linie}`).toHaveLength(1);
    const continut = grup[0]?.[1] ?? '';
    expect(continut).toMatch(new RegExp(`<circle class="harta__aici" cx="${t.aici[0]}" cy="${t.aici[1]}" r="13"`));
    const y = t.eticheta === 'sus' ? t.aici[1] - 16 : t.aici[1] + 36;
    expect(continut).toMatch(new RegExp(`<text class="harta__eticheta" x="${t.aici[0] + 18}" y="${y}">Ești aici</text>`));
  }
  // Marcajele stau deasupra tuturor liniilor (după ultima linie) și sub trenuri; nu sunt în grupurile liniilor (nu se estompează cu ele).
  const primulMarcaj = h.indexOf('class="harta__aici-grup"');
  expect(primulMarcaj).toBeGreaterThan(h.lastIndexOf('class="harta__linie"'));
  expect(primulMarcaj).toBeLessThan(h.indexOf('class="trenuri"'));
  expect(h.slice(h.lastIndexOf('class="harta__linie"'), primulMarcaj)).toContain('</g>');
  for (const linie of h.matchAll(/<g class="harta__linie"[^>]*>([\s\S]*?)<\/g>/g)) expect(linie[1]).not.toContain('harta__aici');
});

test('marcajul de pe Acasă e identic cu cel al benzii: același cerc, aceeași etichetă', async () => {
  const acasa = await render(MetroMap, { variant: 'animated' });
  for (const [grup, linie] of [['constructie', 'M1'], ['vizibilitate', 'M2'], ['reparatie', 'M3'], ['diagnostic', 'M4']] as const) {
    const banda = await render(MetroMap, { variant: 'banda', line: grup });
    const marcaj = (html: string) => html.match(/<circle class="harta__aici"[^>]*><\/circle>\s*<text class="harta__eticheta"[^>]*>Ești aici<\/text>/)?.[0].replace(/\s+/g, ' ');
    const dePeBanda = marcaj(banda);
    expect(dePeBanda, `marcajul benzii pe ${linie}`).toBeDefined();
    const dePeAcasa = acasa.match(new RegExp(`<g class="harta__aici-grup"[^>]*data-linie="${linie}"[^>]*>\\s*([\\s\\S]*?)\\s*</g>`))?.[1]?.replace(/\s+/g, ' ');
    expect(dePeAcasa, `marcajul de pe Acasă pe ${linie}`).toBe(dePeBanda);
  }
});

test('banda și harta statică rămân cu un singur Ești aici, pe linia plină', async () => {
  for (const variant of ['banda', 'static'] as const) {
    for (const [line, linie] of [['constructie', 'M1'], ['vizibilitate', 'M2'], ['reparatie', 'M3'], ['diagnostic', 'M4']] as const) {
      const h = await render(MetroMap, { variant, line });
      expect(h.match(/Ești aici/g), `${variant} ${line}`).toHaveLength(1);
      expect(h.match(/class="harta__aici"/g)).toHaveLength(1);
      expect(h).not.toContain('harta__aici-grup');
      const linia = h.match(new RegExp(`<g class="harta__linie" data-linie="${linie}" data-plina[^>]*>[\\s\\S]*?</g>`))?.[0] ?? '';
      expect(linia, `${variant} ${line}: marcajul e în grupul liniei pline`).toContain('Ești aici');
    }
    const faraLinie = await render(MetroMap, { variant });
    expect(faraLinie).not.toContain('Ești aici');
    expect(faraLinie).not.toContain('harta__aici');
  }
});

test('metro.css ascunde marcajele „Ești aici” de pe harta de pe Acasă', () => {
  const css = readFileSync(new URL('../../src/styles/metro.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(css).toMatch(/(^|\})\s*\.harta--pe-acasa\s+\.harta__aici-grup\s*\{\s*display:\s*none;?\s*\}/);
});

test('fără atribute style (CSP)', async () => {
  for (const props of [{ variant: 'animated' }, { variant: 'static' }, { variant: 'static', line: 'diagnostic' }]) {
    expect(await render(MetroMap, props)).not.toMatch(/\sstyle=/);
  }
});

test('metro.css ascunde trenurile până la pornire și desenează liniile doar fără „reduced motion”', () => {
  const css = readFileSync(new URL('../../src/styles/metro.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(css).toMatch(/(^|\})\s*\.trenuri\s*\{\s*display:\s*none;?\s*\}/);
  expect(css).toMatch(/\.trenuri-pornite\s+\.trenuri\s*\{[^}]*display:\s*block/);
  const desen = css.indexOf('stroke-dashoffset');
  expect(desen).toBeGreaterThan(-1);
  expect(css.lastIndexOf('@media (prefers-reduced-motion: no-preference)', desen)).toBeGreaterThan(-1);
});

test('harta animată are o zonă aria-live goală pentru anunțul de oprire; cea statică nu', async () => {
  const animata = await render(MetroMap, { variant: 'animated' });
  expect(animata).toMatch(/<p class="harta__anunt[^"]*" aria-live="polite" data-stare-trenuri[^>]*><\/p>/);
  expect(await render(MetroMap, { variant: 'static' })).not.toContain('aria-live');
});
