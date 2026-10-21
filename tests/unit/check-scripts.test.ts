import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Scripturile de verificare sunt porți de build: nu au voie să treacă în tăcere (exit 0 fără niciun mesaj),
// nici când sunt pornite printr-un symlink sau junction (calea din argv nu e realpath-uită, URL-ul modulului da).
const SCRIPTURI = fileURLToPath(new URL('../../scripts/', import.meta.url));
let radacina: string;

beforeEach(() => {
  radacina = mkdtempSync(join(tmpdir(), 'siteulet-check-'));
});
afterEach(() => {
  rmSync(radacina, { recursive: true, force: true });
});

function ruleaza(script: string, args: string[] = []) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd: radacina, encoding: 'utf8' });
  return { cod: r.status, iesire: `${r.stdout}${r.stderr}` };
}

/** Un director care arată spre scripts/, ca punct de intrare alternativ (junction pe Windows, symlink în rest). */
function prinLegatura(): string {
  const legatura = join(radacina, 'legatura-scripts');
  symlinkSync(SCRIPTURI, legatura, 'junction');
  return legatura;
}

describe('check-cedilla.mjs', () => {
  function fixtura(textHtml: string) {
    mkdirSync(join(radacina, 'dist'));
    mkdirSync(join(radacina, 'src'));
    writeFileSync(join(radacina, 'dist', 'index.html'), textHtml);
  }

  test('iese cu 1 și spune de ce când dist/ are o sedilă', () => {
    fixtura('<p>aş</p>');
    const r = ruleaza(join(SCRIPTURI, 'check-cedilla.mjs'));
    expect(r.cod).toBe(1);
    expect(r.iesire).toContain('sedilă U+015F');
  });

  test('iese cu 1 și când e pornit printr-un symlink/junction', () => {
    fixtura('<p>aş</p>');
    const r = ruleaza(join(prinLegatura(), 'check-cedilla.mjs'));
    expect(r.cod).toBe(1);
    expect(r.iesire).toContain('sedilă U+015F');
  });

  test('iese cu 0 și raportează când nu sunt sedile', () => {
    fixtura('<p>așț</p>');
    const r = ruleaza(join(prinLegatura(), 'check-cedilla.mjs'));
    expect(r.cod).toBe(0);
    expect(r.iesire).toContain('fără sedile');
  });

  test('iese cu 1 când dist/ lipsește', () => {
    expect(ruleaza(join(SCRIPTURI, 'check-cedilla.mjs')).cod).toBe(1);
  });
});

describe('check-font-glyphs.mjs', () => {
  test('iese cu 1 și spune de ce când dist/ nu are niciun woff2', () => {
    mkdirSync(join(radacina, 'dist'));
    const r = ruleaza(join(SCRIPTURI, 'check-font-glyphs.mjs'), [join(radacina, 'dist')]);
    expect(r.cod).toBe(1);
    expect(r.iesire).toContain('niciun fișier .woff2');
  });

  test('iese cu 1 și când e pornit printr-un symlink/junction', () => {
    mkdirSync(join(radacina, 'dist'));
    const r = ruleaza(join(prinLegatura(), 'check-font-glyphs.mjs'), [join(radacina, 'dist')]);
    expect(r.cod).toBe(1);
    expect(r.iesire).toContain('niciun fișier .woff2');
  });
});
