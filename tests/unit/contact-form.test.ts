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

/** Ca în pagina Contact: titlul cardului „Sau scrie-mi direct”. */
const PROPS = { idContacte: 'direct-titlu' };

describe('ContactForm (§3.5)', () => {
  test('trimite prin POST la /api/contact, iar fără JavaScript rămâne POST-ul obișnuit', async () => {
    const h = await render(ContactForm, PROPS);
    expect(h).toMatch(/<form\b[^>]*\bmethod="post"[^>]*\baction="\/api\/contact"/);
    expect(h).not.toMatch(/\son[a-z]+=/);
    expect(h).not.toMatch(/\sstyle=/);
  });

  // Atributele se caută în orice ordine (lookahead): Astro le scrie `hidden data-eroare`, nu în ordinea din sursă.
  test('explicația de eroare e ascunsă la încărcare, cu un mesaj pentru fiecare caz', async () => {
    const h = await render(ContactForm, PROPS);
    expect(h).toMatch(/<div\b(?=[^>]*\sdata-eroare[\s>])(?=[^>]*\shidden[\s>])[^>]*>/);
    expect(h).toMatch(/<p\b(?=[^>]*\sdata-mesaj="linkuri")(?=[^>]*\shidden[\s>])[^>]*>/);
    expect(h).toMatch(/<p\b(?=[^>]*\sdata-mesaj="eroare")(?=[^>]*\shidden[\s>])[^>]*>/);
    expect(h).toContain('dar e încă aici.');
  });

  // Decizia 30 și §5.2: explicația stă sub buton, înaintea notei despre date, cu iconiță (decor, ascunsă de cititoarele de
  // ecran) și cu „contactele de pe pagină” ca link spre cardul cu contactele directe. Textul mesajelor rămâne același.
  test('explicația de eroare: sub buton, cu iconiță și cu link spre contactele de pe pagină', async () => {
    const h = await render(ContactForm, PROPS);
    const buton = h.search(/<button\b[^>]*type="submit"/);
    const eroare = h.search(/<div\b[^>]*\sdata-eroare[\s>]/);
    const nota = h.indexOf('Folosesc datele trimise');
    expect(buton).toBeGreaterThan(-1);
    expect(eroare).toBeGreaterThan(buton);
    expect(nota).toBeGreaterThan(eroare);

    const bloc = /<div\b[^>]*\sdata-eroare[\s>][\s\S]*?<\/div>/.exec(h)?.[0] ?? '';
    // Aceeași iconiță de eroare ca în titlul paginilor de eroare (Iconita, §5.4).
    expect(bloc).toMatch(/<svg\b(?=[^>]*\sdata-iconita="eroare")(?=[^>]*\saria-hidden="true")[^>]*>/);
    expect([...bloc.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [m[1], textOf(m[2] ?? '')])).toEqual([
      ['#direct-titlu', 'contactele de pe pagină'],
      ['#direct-titlu', 'contactele de pe pagină'],
    ]);
    expect(textOf(bloc)).toContain('Încearcă din nou peste un minut, sau scrie-mi direct, la contactele de pe pagină.');
  });

  test.each(Object.entries(CAMPURI) as [NumeCamp, (typeof CAMPURI)[NumeCamp]][])('%s: atributele HTML vin din form-rules', async (nume, regula) => {
    const e = camp(await render(ContactForm, PROPS), nume);
    expect(e, `câmpul ${nume} lipsește`).not.toBe('');
    expect(atribut(e, 'required') !== null).toBe(regula.required);
    if (regula.maxLength !== undefined) expect(atribut(e, 'maxlength')?.[1]).toBe(String(regula.maxLength));
    if (regula.type !== undefined) expect(atribut(e, 'type')?.[1]).toBe(regula.type);
    if (AUTOCOMPLETE[nume] !== undefined) expect(atribut(e, 'autocomplete')?.[1]).toBe(AUTOCOMPLETE[nume]);
  });

  test('Mesajul e un textarea, iar adresa site-ului e text liber cu tastatura de URL', async () => {
    const h = await render(ContactForm, PROPS);
    expect(camp(h, 'mesaj')).toMatch(/^<textarea\b/);
    const site = camp(h, 'site');
    expect(atribut(site, 'inputmode')?.[1]).toBe('url');
    expect(atribut(site, 'type')?.[1] ?? 'text').toBe('text');
  });

  test('fiecare câmp are o etichetă vizibilă, iar cele obligatorii spun asta în text', async () => {
    const h = await render(ContactForm, PROPS);
    for (const nume of Object.keys(CAMPURI)) {
      const id = atribut(camp(h, nume), 'id')?.[1];
      const eticheta = new RegExp(`<label\\b[^>]*\\bfor="${id}"[^>]*>([\\s\\S]*?)</label>`).exec(h)?.[1];
      expect(eticheta, `eticheta pentru ${nume}`).toBeDefined();
      expect(textOf(eticheta ?? '').includes('obligatoriu')).toBe(CAMPURI[nume as NumeCamp].required);
    }
  });

  test('serviciile, în ordinea din form-rules, plus „Nu știu încă”, cu o opțiune goală la început', async () => {
    const h = await render(ContactForm, PROPS);
    const select = /<select\b[^>]*\bname="serviciu"[^>]*>([\s\S]*?)<\/select>/.exec(h)?.[1] ?? '';
    const optiuni = [...select.matchAll(/<option\b[^>]*\bvalue="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)].map((m) => [m[1], textOf(m[2] ?? '')]);
    expect(optiuni[0]?.[0]).toBe('');
    expect(optiuni.slice(1)).toEqual([...[...SERVICII].sort((a, b) => a.ordine - b.ordine).map((s) => [s.slug, s.nume]), [FARA_SERVICIU.slug, FARA_SERVICIU.nume]]);
  });

  test('nota de sub Mesaj e legată de câmp prin aria-describedby', async () => {
    const h = await render(ContactForm, PROPS);
    const id = atribut(camp(h, 'mesaj'), 'aria-describedby')?.[1];
    expect(new RegExp(`<p\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</p>`).exec(h)?.[1]).toContain('Cel mult 3000 de caractere și cel mult 3 linkuri.');
  });

  test('capcana: tabindex=-1, autocomplete=off și ascunsă de cititoarele de ecran', async () => {
    const h = await render(ContactForm, PROPS);
    const e = camp(h, CAPCANA);
    expect(atribut(e, 'tabindex')?.[1]).toBe('-1');
    expect(atribut(e, 'autocomplete')?.[1]).toBe('off');
    expect(atribut(e, 'required')).toBeNull();
    // A-07: semnalele prin care 1Password, LastPass, Bitwarden și Dashlane lasă câmpul necompletat.
    expect(atribut(e, 'data-1p-ignore')?.[1]).toBe('true');
    expect(atribut(e, 'data-lpignore')?.[1]).toBe('true');
    expect(atribut(e, 'data-bwignore')?.[1]).toBe('true');
    expect(atribut(e, 'data-form-type')?.[1]).toBe('other');
    // Blocul aria-hidden conține doar eticheta și câmpul-capcană, nimic altceva.
    const bloc = new RegExp(`<div\\b[^>]*\\baria-hidden="true"[^>]*>\\s*<label\\b[^>]*>[^<]*</label>\\s*<input\\b[^>]*\\bname="${CAPCANA}"[^>]*>\\s*</div>`).exec(h);
    expect(bloc, 'capcana stă singură într-un bloc aria-hidden').not.toBeNull();
  });

  // Câmpurile pe un rând din formular sunt exact cele în care Worker-ul respinge CR/LF (worker/validate.ts).
  test('câmpurile <input> sunt cele pe un rând din validarea Worker-ului', async () => {
    const h = await render(ContactForm, PROPS);
    const inputuri = [...h.matchAll(/<input\b[^>]*\bname="([^"]+)"/g)].map((m) => m[1]).filter((n) => n !== CAPCANA);
    expect(inputuri.sort()).toEqual([...PE_UN_RAND].sort());
  });

  test('butonul „Cere o ofertă” și nota despre date, cu link spre politica de confidențialitate', async () => {
    const h = await render(ContactForm, PROPS);
    expect(h).toMatch(/<button\b[^>]*\btype="submit"[^>]*>\s*Cere o ofertă\s*<\/button>/);
    const text = textOf(h);
    expect(text).toContain('Folosesc datele trimise ca să-ți răspund la cerere și pentru discuțiile care urmează. Detalii în Politica de confidențialitate.');
    expect(h).toMatch(/<a href="\/politica-de-confidentialitate\/"[^>]*>Politica de confidențialitate<\/a>/);
  });

  test('câmpul Mesaj e ultimul câmp și are clasa de rând întreg; ordinea câmpurilor nu s-a schimbat', async () => {
    const h = await render(ContactForm, PROPS);
    // Clasa stă pe `<div>`-ul care conține câmpul `mesaj` (nicio altă etichetă `div` între deschiderea lui și câmp).
    expect(h).toMatch(/<div\b[^>]*\sclass="[^"]*\bformular__camp--mesaj\b[^"]*"[^>]*>(?:(?!<\/?div\b)[\s\S])*?\bname="mesaj"/);
    const ordine = [...h.matchAll(/name="([^"]+)"/g)].map((m) => m[1]).filter((n) => n !== CAPCANA);
    expect(ordine).toEqual(['nume', 'email', 'telefon', 'firma', 'site', 'serviciu', 'mesaj']);
  });

  test('fără CNP și fără bifă de acord', async () => {
    const h = await render(ContactForm, PROPS);
    expect(h).not.toMatch(/type="checkbox"/);
    expect(textOf(h)).not.toMatch(/CNP/);
  });
});

// Formularul ca traseu (spec metroul îmbunătățit, §4): trei stații, adică trei `fieldset`-uri cu legendele din §8. Câmpurile își
// păstrează ordinea, numele și regulile; linia și umplerea stațiilor sunt doar CSS (tests/e2e/contact.spec.ts).
describe('ContactForm: trei stații (§4)', () => {
  /** Fieldset-urile din formular: eticheta de deschidere, legenda (text) și conținutul. */
  function statii(h: string) {
    return [...h.matchAll(/<fieldset\b([^>]*)>([\s\S]*?)<\/fieldset>/g)].map((m) => ({
      atribute: m[1] ?? '',
      legenda: textOf(/<legend\b[^>]*>([\s\S]*?)<\/legend>/.exec(m[2] ?? '')?.[1] ?? ''),
      continut: m[2] ?? '',
    }));
  }
  const numeleCampurilor = (html: string) => [...html.matchAll(/<(?:input|textarea|select)\b[^>]*\bname="([^"]+)"/g)].map((m) => m[1]);

  test('trei fieldset-uri, cu legendele din spec', async () => {
    const s = statii(await render(ContactForm, PROPS));
    expect(s.map((x) => x.legenda)).toEqual(['1. Cine ești', '2. Site-ul tău (opțional)', '3. Ce te încurcă']);
    // Toate au clasa stației; doar a doua e marcată opțională (nu se umple, nu blochează nimic).
    expect(s.map((x) => /\sclass="[^"]*\bformular__statie\b/.test(x.atribute))).toEqual([true, true, true]);
    expect(s.map((x) => /\sclass="[^"]*\bformular__statie--optionala\b/.test(x.atribute))).toEqual([false, true, false]);
    // Legenda e primul copil al fieldset-ului: așa o anunță cititoarele de ecran la fiecare câmp din grup.
    for (const x of s) expect(x.continut.trimStart()).toMatch(/^<legend\b/);
  });

  test('fiecare câmp stă în fieldset-ul lui', async () => {
    const s = statii(await render(ContactForm, PROPS));
    expect(s.map((x) => numeleCampurilor(x.continut))).toEqual([['nume', 'email', 'telefon', 'firma'], ['site', 'serviciu'], ['mesaj']]);
  });

  test('capcana și butonul stau în afara fieldset-urilor', async () => {
    const h = await render(ContactForm, PROPS);
    const dupa = h.slice(h.lastIndexOf('</fieldset>'));
    expect(numeleCampurilor(dupa)).toEqual([CAPCANA]);
    expect(dupa).toMatch(/<button\b[^>]*type="submit"/);
  });

  // Capătul liniei: eticheta e text vizibil (nu aria-hidden), în același bloc cu butonul, ca să stea lângă el.
  test('capătul liniei: Destinația: oferta ta, lângă buton', async () => {
    const h = await render(ContactForm, PROPS);
    const bloc = /<div\b[^>]*\sclass="[^"]*\bformular__capat\b[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(h);
    expect(bloc, 'blocul butonului cu capătul liniei').not.toBeNull();
    const continut = bloc?.[1] ?? '';
    expect(continut).toMatch(/<button\b[^>]*\btype="submit"/);
    expect(textOf(continut)).toContain('Destinația: oferta ta');
    expect(continut).not.toMatch(/aria-hidden/);
    expect(h.indexOf('Destinația: oferta ta')).toBeGreaterThan(h.search(/<button\b[^>]*\btype="submit"/));
  });

  test('opțiunile de serviciu au data-grup din SERVICII', async () => {
    const h = await render(ContactForm, PROPS);
    const select = /<select\b[^>]*\bname="serviciu"[^>]*>([\s\S]*?)<\/select>/.exec(h)?.[1] ?? '';
    const optiuni = [...select.matchAll(/<option\b([^>]*)>/g)].map((m) => ({
      valoare: /\svalue="([^"]*)"/.exec(m[1] ?? '')?.[1],
      grup: /\sdata-grup="([^"]*)"/.exec(m[1] ?? '')?.[1],
    }));
    const dupaOrdine = [...SERVICII].sort((a, b) => a.ordine - b.ordine);
    expect(optiuni).toEqual([
      { valoare: '', grup: undefined },
      ...dupaOrdine.map((s) => ({ valoare: s.slug, grup: s.grup })),
      { valoare: FARA_SERVICIU.slug, grup: undefined },
    ]);
  });

  // Scriptul formularului (src/client/contact-form.ts, spec metroul îmbunătățit, §4) scrie mesajele în aceste elemente. Câmpurile fără mesaj (telefon, firmă, site, serviciu) nu au unul.
  test('elementele de eroare există și sunt ascunse', async () => {
    const h = await render(ContactForm, PROPS);
    const erori = [...h.matchAll(/<p\b(?=[^>]*\sclass="[^"]*\bformular__eroare-camp\b)([^>]*)>([\s\S]*?)<\/p>/g)];
    expect(erori.map((m) => /\sid="([^"]*)"/.exec(m[1] ?? '')?.[1])).toEqual(['formular-nume-eroare', 'formular-email-eroare', 'formular-mesaj-eroare']);
    for (const m of erori) {
      expect(m[1], 'ascuns la încărcare').toMatch(/\shidden[\s>=]|\shidden$/);
      expect(textOf(m[2] ?? ''), 'fără text până îl scrie scriptul').toBe('');
    }
  });

  test('fiecare eroare stă imediat sub câmpul ei', async () => {
    const h = await render(ContactForm, PROPS);
    for (const nume of ['nume', 'email', 'mesaj']) {
      const dupaCamp = h.slice(h.search(new RegExp(`<(?:input|textarea)\\b[^>]*\\bname="${nume}"`)));
      // Prima etichetă `<p` de după câmp e eroarea lui, iar între ei nu apare alt câmp, altă etichetă sau altă stație.
      const pozitieP = dupaCamp.search(/<p\b/);
      expect(dupaCamp.slice(pozitieP).match(/^<p\b[^>]*/)?.[0], nume).toContain(`id="formular-${nume}-eroare"`);
      expect(dupaCamp.slice(1, pozitieP), nume).not.toMatch(/<(?:input|textarea|select|label|fieldset|legend)\b/);
    }
  });

  // Scriptul din browser nu importă regulile (src/form-rules.ts ar intra în bundle și ar depăși bugetul de 2 KB): le citește din
  // pagină. `maxlength` e deja pe Mesaj (testul „fiecare câmp are regulile lui”); pragul de linkuri stă în `data-max-linkuri`.
  test('Mesajul spune scriptului câte linkuri are voie să aibă (data-max-linkuri, din regulile Worker-ului)', async () => {
    const h = await render(ContactForm, PROPS);
    const mesaj = camp(h, 'mesaj');
    expect(CAMPURI.mesaj.maxLinkuri, 'regula există').toBeGreaterThan(0);
    expect(mesaj).toMatch(/\sid="formular-mesaj"/);
    expect(atribut(mesaj, 'data-max-linkuri')?.[1]).toBe(String(CAMPURI.mesaj.maxLinkuri));
  });

  // Fără JavaScript contorul ar arăta cifre vechi după tastare; scriptul îl arată.
  test('contorul de sub Mesaj există, ascuns și fără anunțuri la tastare', async () => {
    const h = await render(ContactForm, PROPS);
    const contor = /<p\b(?=[^>]*\sid="formular-mesaj-contor")([^>]*)>/.exec(h)?.[1] ?? '';
    expect(contor, 'contorul').not.toBe('');
    expect(contor).toMatch(/\sclass="[^"]*\bformular__contor\b/);
    expect(contor).toMatch(/\saria-live="off"/);
    expect(contor).toMatch(/\shidden[\s>=]|\shidden$/);
  });

  test('nota despre date și zona de eroare rămân sub buton, după capătul liniei', async () => {
    const h = await render(ContactForm, PROPS);
    const capat = h.indexOf('Destinația: oferta ta');
    expect(capat).toBeGreaterThan(-1);
    expect(h.search(/<div\b[^>]*\sdata-eroare[\s>]/)).toBeGreaterThan(capat);
  });
});
