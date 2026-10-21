import LegalId from '../../src/components/LegalId.astro';
import { render, textOf } from './helpers';

// Datele firmei și starea DRAFT sunt simulate: testele nu depind de valorile din src/site.config.ts
// (azi marcaje [DE COMPLETAT], mâine datele reale ale lui Alex) și nici de modul în care e pornit build-ul.
const stare = vi.hoisted(() => ({
  draft: false,
  pfa: { denumire: '', nrRegCom: '', cui: '', sediu: '' },
}));

vi.mock('../../src/lib/env', () => ({
  get DRAFT() {
    return stare.draft;
  },
}));

vi.mock('../../src/site.config', () => ({
  site: {
    nume: 'Alex Ionescu',
    oras: 'București',
    telefonAfisat: '0721 000 111',
    telefonE164: '+40721000111',
    email: 'contact@exemplu.test',
    pfa: stare.pfa,
  },
}));

const REALE = {
  denumire: 'Ionescu Alex PFA',
  nrRegCom: 'F40/1234/2024',
  cui: '12345678',
  sediu: 'Str. Exemplu 1, București',
};

const MARCAJE = {
  denumire: '[DE COMPLETAT:#1]',
  nrRegCom: '[DE COMPLETAT:#1]',
  cui: '[DE COMPLETAT:#1]',
  sediu: '[DE COMPLETAT:#2]',
};

describe('LegalId cu datele firmei completate', () => {
  beforeEach(() => {
    stare.draft = false;
    Object.assign(stare.pfa, REALE);
  });

  test('scurt: denumirea, numărul de la Registrul Comerțului, CUI-ul și „București”, fără sediu', async () => {
    const h = await render(LegalId, { variant: 'scurt' });
    const text = textOf(h);
    expect(text).toContain('Denumire Ionescu Alex PFA');
    expect(text).toContain('Număr la Registrul Comerțului F40/1234/2024');
    expect(text).toContain('CUI 12345678');
    expect(text).toContain('Oraș București');
    // Sediul e la domiciliu: în subsol nu apare adresa (§7.1), nici în text, nici în vreun atribut.
    expect(h).not.toContain('Str. Exemplu 1');
    expect(text).not.toContain('Sediu profesional');
  });

  test('scurt: linkul „Date de identificare” duce la /contact/#date-firma, iar telefonul și e-mailul lipsesc', async () => {
    const h = await render(LegalId, { variant: 'scurt' });
    expect(h).toMatch(/<a\b[^>]*href="\/contact\/#date-firma"[^>]*>Date de identificare<\/a>/);
    expect(h).not.toContain('tel:');
    expect(h).not.toContain('mailto:');
    expect(textOf(h)).not.toContain('0721 000 111');
  });

  test('complet: aceleași date, plus sediul, telefonul și e-mailul', async () => {
    const h = await render(LegalId, { variant: 'complet' });
    const text = textOf(h);
    expect(text).toContain('Denumire Ionescu Alex PFA');
    expect(text).toContain('Număr la Registrul Comerțului F40/1234/2024');
    expect(text).toContain('CUI 12345678');
    expect(text).toContain('Sediu profesional Str. Exemplu 1, București');
    expect(h).toContain('href="tel:+40721000111"');
    expect(text).toContain('Telefon 0721 000 111');
    expect(h).toContain('href="mailto:contact@exemplu.test"');
    expect(text).toContain('E-mail contact@exemplu.test');
  });

  test('complet: fără link spre el însuși', async () => {
    const h = await render(LegalId, { variant: 'complet' });
    expect(h).not.toContain('Date de identificare');
    expect(h).not.toContain('href="/contact/#date-firma"');
  });

  test('nu apare niciun marcaj, nici în draft, când datele sunt reale', async () => {
    stare.draft = true;
    for (const variant of ['scurt', 'complet']) {
      const h = await render(LegalId, { variant });
      expect(h, variant).not.toContain('DE COMPLETAT');
      expect(h, variant).not.toContain('class="marcaj"');
    }
  });
});

describe('LegalId cu marcaje, în producție', () => {
  beforeEach(() => {
    stare.draft = false;
    Object.assign(stare.pfa, MARCAJE);
  });

  test.each(['scurt', 'complet'])('%s: marcajul nu ajunge în HTML, iar rândurile dispar cu tot cu etichetă', async (variant) => {
    const h = await render(LegalId, { variant });
    const text = textOf(h);
    expect(h).not.toContain('DE COMPLETAT');
    expect(h).not.toContain('class="marcaj"');
    for (const eticheta of ['Denumire', 'Număr la Registrul Comerțului', 'CUI', 'Sediu profesional'])
      expect(text, eticheta).not.toContain(eticheta);
  });

  test('ce nu depinde de datele firmei rămâne: „București” și linkul (scurt), telefonul și e-mailul (complet)', async () => {
    const scurt = await render(LegalId, { variant: 'scurt' });
    expect(textOf(scurt)).toContain('Oraș București');
    expect(scurt).toContain('href="/contact/#date-firma"');

    const complet = await render(LegalId, { variant: 'complet' });
    expect(complet).toContain('href="tel:+40721000111"');
    expect(complet).toContain('href="mailto:contact@exemplu.test"');
  });

  test('un singur câmp lipsă: dispare doar rândul lui', async () => {
    stare.pfa.sediu = MARCAJE.sediu;
    stare.pfa.denumire = REALE.denumire;
    stare.pfa.nrRegCom = REALE.nrRegCom;
    stare.pfa.cui = REALE.cui;
    const text = textOf(await render(LegalId, { variant: 'complet' }));
    expect(text).toContain('CUI 12345678');
    expect(text).not.toContain('Sediu profesional');
  });
});

describe('LegalId cu marcaje, în previzualizarea DRAFT=1', () => {
  beforeEach(() => {
    stare.draft = true;
    Object.assign(stare.pfa, MARCAJE);
  });

  test('scurt: câmpurile PFA se văd ca marcaje, cu numărul rândului din registru', async () => {
    const h = await render(LegalId, { variant: 'scurt' });
    const text = textOf(h);
    expect(h.match(/<mark class="marcaj"/g)).toHaveLength(3);
    expect(text).toContain('Denumire [DE COMPLETAT:#1]');
    expect(text).toContain('Număr la Registrul Comerțului [DE COMPLETAT:#1]');
    expect(text).toContain('CUI [DE COMPLETAT:#1]');
    expect(text).toContain('Oraș București');
  });

  test('complet: și sediul e marcaj, cu rândul #2', async () => {
    const h = await render(LegalId, { variant: 'complet' });
    expect(h.match(/<mark class="marcaj"/g)).toHaveLength(4);
    expect(textOf(h)).toContain('Sediu profesional [DE COMPLETAT:#2]');
  });
});
