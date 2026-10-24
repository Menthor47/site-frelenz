import ContactForm from '../../src/components/ContactForm.astro';
import { CAMPURI, CAPCANA, FARA_SERVICIU, SERVICII, type NumeCamp } from '../../src/form-rules';
import { PE_UN_RAND } from '../../worker/validate';
import { render, textOf } from './helpers';

// Formularul de contact (§3.5): atributele HTML vin din aceleași reguli ca Worker-ul (src/form-rules.ts). Funcționează fără
// JavaScript; cu JavaScript, trimiterea și explicația de eroare vin din src/client/contact-form.ts (decizia 30).

/** Eticheta de deschidere a câmpului `nume` (input, textarea sau select). */
function camp(h: string, nume: string): string {
  return new RegExp(`<(?:input|textarea|select)\\b[^>]*\\bname="${nume}"[^>]*>`).exec(h)?.[0] ?? '';
}

const atribut = (eticheta: string, nume: string) => new RegExp(`\\s${nume}(?:="([^"]*)")?(?=[\\s>/])`).exec(eticheta);

const AUTOCOMPLETE: Partial<Record<NumeCamp, string>> = { nume: 'name', email: 'email', telefon: 'tel', firma: 'organization' };

describe('ContactForm (§3.5)', () => {
  test('trimite prin POST la /api/contact, iar fără JavaScript rămâne POST-ul obișnuit', async () => {
    const h = await render(ContactForm);
    expect(h).toMatch(/<form\b[^>]*\bmethod="post"[^>]*\baction="\/api\/contact"/);
    expect(h).not.toMatch(/\son[a-z]+=/);
    expect(h).not.toMatch(/\sstyle=/);
  });

  test('explicația de eroare e ascunsă la încărcare, cu un mesaj pentru fiecare caz', async () => {
    const h = await render(ContactForm);
    expect(h).toMatch(/<div\b[^>]*\bdata-eroare\b[^>]*\bhidden\b[^>]*>/);
    expect(h).toMatch(/<p\b[^>]*\bdata-mesaj="linkuri"[^>]*\bhidden\b[^>]*>/);
    expect(h).toMatch(/<p\b[^>]*\bdata-mesaj="eroare"[^>]*\bhidden\b[^>]*>/);
    expect(h).toContain('dar e încă aici.');
  });

  test.each(Object.entries(CAMPURI) as [NumeCamp, (typeof CAMPURI)[NumeCamp]][])('%s: atributele HTML vin din form-rules', async (nume, regula) => {
    const e = camp(await render(ContactForm), nume);
    expect(e, `câmpul ${nume} lipsește`).not.toBe('');
    expect(atribut(e, 'required') !== null).toBe(regula.required);
    if (regula.maxLength !== undefined) expect(atribut(e, 'maxlength')?.[1]).toBe(String(regula.maxLength));
    if (regula.type !== undefined) expect(atribut(e, 'type')?.[1]).toBe(regula.type);
    if (AUTOCOMPLETE[nume] !== undefined) expect(atribut(e, 'autocomplete')?.[1]).toBe(AUTOCOMPLETE[nume]);
  });

  test('Mesajul e un textarea, iar adresa site-ului e text liber cu tastatura de URL', async () => {
    const h = await render(ContactForm);
    expect(camp(h, 'mesaj')).toMatch(/^<textarea\b/);
    const site = camp(h, 'site');
    expect(atribut(site, 'inputmode')?.[1]).toBe('url');
    expect(atribut(site, 'type')?.[1] ?? 'text').toBe('text');
  });

  test('fiecare câmp are o etichetă vizibilă, iar cele obligatorii spun asta în text', async () => {
    const h = await render(ContactForm);
    for (const nume of Object.keys(CAMPURI)) {
      const id = atribut(camp(h, nume), 'id')?.[1];
      const eticheta = new RegExp(`<label\\b[^>]*\\bfor="${id}"[^>]*>([\\s\\S]*?)</label>`).exec(h)?.[1];
      expect(eticheta, `eticheta pentru ${nume}`).toBeDefined();
      expect(textOf(eticheta ?? '').includes('obligatoriu')).toBe(CAMPURI[nume as NumeCamp].required);
    }
  });

  test('serviciile, în ordinea din form-rules, plus „Nu știu încă”, cu o opțiune goală la început', async () => {
    const h = await render(ContactForm);
    const select = /<select\b[^>]*\bname="serviciu"[^>]*>([\s\S]*?)<\/select>/.exec(h)?.[1] ?? '';
    const optiuni = [...select.matchAll(/<option\b[^>]*\bvalue="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)].map((m) => [m[1], textOf(m[2] ?? '')]);
    expect(optiuni[0]?.[0]).toBe('');
    expect(optiuni.slice(1)).toEqual([...[...SERVICII].sort((a, b) => a.ordine - b.ordine).map((s) => [s.slug, s.nume]), [FARA_SERVICIU.slug, FARA_SERVICIU.nume]]);
  });

  test('nota de sub Mesaj e legată de câmp prin aria-describedby', async () => {
    const h = await render(ContactForm);
    const id = atribut(camp(h, 'mesaj'), 'aria-describedby')?.[1];
    expect(new RegExp(`<p\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</p>`).exec(h)?.[1]).toContain('Cel mult 3000 de caractere și cel mult 3 linkuri.');
  });

  test('capcana: tabindex=-1, autocomplete=off și ascunsă de cititoarele de ecran', async () => {
    const h = await render(ContactForm);
    const e = camp(h, CAPCANA);
    expect(atribut(e, 'tabindex')?.[1]).toBe('-1');
    expect(atribut(e, 'autocomplete')?.[1]).toBe('off');
    expect(atribut(e, 'required')).toBeNull();
    // Blocul aria-hidden conține doar eticheta și câmpul-capcană, nimic altceva.
    const bloc = new RegExp(`<div\\b[^>]*\\baria-hidden="true"[^>]*>\\s*<label\\b[^>]*>[^<]*</label>\\s*<input\\b[^>]*\\bname="${CAPCANA}"[^>]*>\\s*</div>`).exec(h);
    expect(bloc, 'capcana stă singură într-un bloc aria-hidden').not.toBeNull();
  });

  // Câmpurile pe un rând din formular sunt exact cele în care Worker-ul respinge CR/LF (worker/validate.ts).
  test('câmpurile <input> sunt cele pe un rând din validarea Worker-ului', async () => {
    const h = await render(ContactForm);
    const inputuri = [...h.matchAll(/<input\b[^>]*\bname="([^"]+)"/g)].map((m) => m[1]).filter((n) => n !== CAPCANA);
    expect(inputuri.sort()).toEqual([...PE_UN_RAND].sort());
  });

  test('butonul „Cere o ofertă” și nota despre date, cu link spre politica de confidențialitate', async () => {
    const h = await render(ContactForm);
    expect(h).toMatch(/<button\b[^>]*\btype="submit"[^>]*>\s*Cere o ofertă\s*<\/button>/);
    const text = textOf(h);
    expect(text).toContain('Folosesc datele trimise ca să-ți răspund la cerere și pentru discuțiile care urmează. Detalii în Politica de confidențialitate.');
    expect(h).toMatch(/<a href="\/politica-de-confidentialitate\/"[^>]*>Politica de confidențialitate<\/a>/);
  });

  test('câmpul Mesaj e ultimul câmp și are clasa de rând întreg; ordinea câmpurilor nu s-a schimbat', async () => {
    const h = await render(ContactForm);
    // Clasa stă pe `<div>`-ul care conține câmpul `mesaj` (nicio altă etichetă `div` între deschiderea lui și câmp).
    expect(h).toMatch(/<div\b[^>]*\sclass="[^"]*\bformular__camp--mesaj\b[^"]*"[^>]*>(?:(?!<\/?div\b)[\s\S])*?\bname="mesaj"/);
    const ordine = [...h.matchAll(/name="([^"]+)"/g)].map((m) => m[1]).filter((n) => n !== CAPCANA);
    expect(ordine).toEqual(['nume', 'email', 'telefon', 'firma', 'site', 'serviciu', 'mesaj']);
  });

  test('fără CNP și fără bifă de acord', async () => {
    const h = await render(ContactForm);
    expect(h).not.toMatch(/type="checkbox"/);
    expect(textOf(h)).not.toMatch(/CNP/);
  });
});
