import { readFileSync } from 'node:fs';
import MetroMap from '../../src/components/MetroMap.astro';
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
  expect(h).not.toContain('data-plina');
  expect(h).not.toContain('Ești aici');
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
