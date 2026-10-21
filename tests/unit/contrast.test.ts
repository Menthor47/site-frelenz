import { readFileSync } from 'node:fs';

// Citește tokens.css și calculează contrastul WCAG 2.1 pentru perechile din §5.2.
const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

function tok(name: string): string {
  const m = css.match(new RegExp(String.raw`${name}\s*:\s*(#[0-9a-fA-F]{6})\b`));
  if (!m?.[1]) throw new Error(`Tokenul ${name} lipsește din tokens.css`);
  return m[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

test.each([
  ['--paper', '--blue', 4.5],
  ['--ink', '--green', 4.5],
  ['--ink', '--yellow', 4.5],
  ['--ink', '--red', 4.5],
  ['--blue-dark', '--paper', 4.5],
  ['--green-dark', '--paper', 4.5],
  ['--yellow-dark', '--paper', 4.5],
  ['--red-dark', '--paper', 4.5],
  ['--yellow-dark', '--tint-blue', 3],
  ['--field-border', '--paper', 3],
] as const)('%s pe %s ≥ %s', (fg, bg, min) => {
  expect(ratio(tok(fg), tok(bg))).toBeGreaterThanOrEqual(min);
});

test('negru pe albastru e sub 4,5 (interdicția din §5.2 e reală)', () => {
  expect(ratio(tok('--ink'), tok('--blue'))).toBeLessThan(4.5);
});

test('tokenurile din §5.2 au exact valorile din spec', () => {
  const asteptat: Record<string, string> = {
    '--ink': '#14161A',
    '--ink-2': '#3F4650',
    '--paper': '#FFFFFF',
    '--blue': '#2D6CDF',
    '--blue-dark': '#1A4FB8',
    '--green': '#1F9D61',
    '--green-dark': '#157347',
    '--yellow': '#F5B21B',
    '--yellow-dark': '#8A5A00',
    '--red': '#E0533D',
    '--red-dark': '#B8382A',
    '--tint-blue': '#EAF0FB',
    '--tint-yellow': '#FEF3D7',
    '--tint-green': '#E8F5EE',
    '--tint-red': '#FCEDEA',
    '--rule': '#E6E8EC',
    '--field-border': '#8A8F98',
  };
  for (const [nume, valoare] of Object.entries(asteptat)) {
    expect(tok(nume).toUpperCase(), nume).toBe(valoare);
  }
});
