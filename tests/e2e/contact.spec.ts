// Contact și paginile de răspuns (§3.5, §4.5, Task 14), pe build-ul servit de `wrangler dev`: formularul ajunge la Worker.
// Limitatorul din `wrangler dev` numără real (3 trimiteri la 60 s pe aceeași cheie), dar doar cererile care pleacă: fișierul
// trimite un singur mesaj real; cererea cu prea multe linkuri, capcana și erorile mocate (route) nu ajung la limitator.
// Modul serial oprește restul dacă un test pică.
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { CAPCANA } from '../../src/form-rules';
import { axe, completeaza, expect, faraDerulareOrizontala, seSuprapun, test, textMarit } from './helpers';

test.describe.configure({ mode: 'serial' });

test('contactul are două scripturi executabile: al trenurilor de pe bandă (decizia 28) și al formularului (decizia 30)', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('script:not([type="application/ld+json"])')).toHaveCount(2);
  await expect(page.locator('.banda script')).toHaveCount(1);
});

test('pagina are formularul, contactele directe și datele firmei', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('h1')).toHaveText('Cere o ofertă');
  await expect(page.getByText('Din București, lucrez cu firme din toată țara')).toBeVisible();
  // Telefonul și e-mailul apar și în datele firmei (LegalId complet); aici contează contactele directe.
  const direct = page.locator('section[aria-labelledby="direct-titlu"]');
  await expect(direct.locator('a[href="tel:+40724230051"]')).toBeVisible();
  await expect(direct.locator('a[href="https://wa.me/40724230051"]')).toBeVisible();
  await expect(direct.locator('a[href^="mailto:contact@"]')).toBeVisible();
  await expect(page.locator('#date-firma')).toBeVisible();
  await expect(page.locator('header .buton-cta')).toHaveCount(0);
});

test('capcana nu se vede, nu primește focus și nu apare în arborele de accesibilitate', async ({ page }) => {
  await page.goto('/contact/');
  const capcana = page.locator(`[name="${CAPCANA}"]`);
  await expect(capcana).not.toBeInViewport();
  // Câmpul există și are eticheta lui (control), dar nu apare ca textbox în arborele de accesibilitate.
  await expect(page.getByLabel('Nu completa acest câmp')).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: 'Nu completa acest câmp' })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: /Mesaj/ })).toHaveCount(1);
  // De la Mesaj, Tab sare peste capcană, direct la buton.
  await page.locator('[name="mesaj"]').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cere o ofertă' })).toBeFocused();
});

// Review Focus #2: pe un telefon cu temă întunecată, câmpurile rămân albe, cu text negru.
test('cu tema întunecată, câmpurile formularului rămân luminoase', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const p = await context.newPage();
  await p.goto('/contact/');
  for (const selector of ['[name="nume"]', '[name="serviciu"]', '[name="mesaj"]']) {
    const { fundal, text } = await p.locator(selector).evaluate((el) => ({ fundal: getComputedStyle(el).backgroundColor, text: getComputedStyle(el).color }));
    expect(fundal, selector).toBe('rgb(255, 255, 255)');
    expect(text, selector).toBe('rgb(20, 22, 26)');
  }
  await context.close();
});

// Cu culorile forțate (modul de contrast ridicat), `background` devine Canvas: linia formularului și capătul ei trec pe CanvasText
// (ContactForm.astro). Culoarea exactă depinde de emulare, deci testul cere doar o linie pictată, alta decât fundalul paginii.
test('cu culorile forțate, linia formularului și capătul ei rămân pictate', async ({ browser }) => {
  const context = await browser.newContext({ forcedColors: 'active' });
  const p = await context.newPage();
  await p.goto('/contact/');
  const pagina = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  for (const selector of ['.formular', '.formular__capat']) {
    const { fundal, imagine } = await p.locator(selector).evaluate((el) => ({ fundal: getComputedStyle(el, '::before').backgroundColor, imagine: getComputedStyle(el, '::before').backgroundImage }));
    expect(imagine, selector).toBe('none');
    expect(fundal, selector).not.toBe('rgba(0, 0, 0, 0)');
    expect(fundal, `${selector}: are culoarea fundalului paginii (Canvas), deci nu se vede`).not.toBe(pagina);
  }
  await context.close();
});

test('text mărit la 200% pe /contact/: câmpurile nu se suprapun, fără derulare orizontală', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/contact/');
  await textMarit(page);
  expect(await seSuprapun(page, ['#formular-nume', '#formular-email', '#formular-telefon', '#formular-firma'])).toBe(false);
  expect(await faraDerulareOrizontala(page)).toBe(true);
});

// Titlul paginilor de eroare are în față iconița de eroare (§5.2): cu textul mărit la 200%, pe 320px, cuvântul lung de
// după ea („Mesajul”) trebuie să treacă pe rândul următor, nu să iasă din pagină. La fel pe „Am primit cererea ta” (spec metroul
// îmbunătățit, §4), cu desenul liniei și cele trei opriri sub titlu.
for (const cale of ['/contact/eroare/', '/contact/prea-multe-linkuri/', '/contact/multumim/']) {
  test(`text mărit la 200% pe ${cale}, la 320px: fără derulare orizontală`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(cale);
    await textMarit(page);
    expect(await faraDerulareOrizontala(page)).toBe(true);
  });
}

// Pază împotriva eșecului tăcut: dacă `container-type` dispare de pe card, interogarea de container nu se mai aplică,
// formularul rămâne mereu pe o coloană, iar niciun alt test nu observă.
// Grila pe două coloane stă în interiorul fiecărei stații (`fieldset`); formularul însuși are mereu o coloană, cu stațiile una sub alta.
// Pe un `fieldset` browserul nu dă lățimile coloanelor în `getComputedStyle` (grila stă în caseta lui anonimă), deci se măsoară unde
// stau Numele și E-mailul din prima stație: pe același rând sunt două coloane, unul sub altul, una.
test('formularul are două coloane pe desktop și una când cardul e îngust', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/contact/');
  const coloane = async () => {
    const [nume, email] = await Promise.all(['#formular-nume', '#formular-email'].map((selector) => page.locator(selector).boundingBox()));
    return Math.abs(nume!.y - email!.y) < 2 ? 2 : 1;
  };
  expect(await coloane(), 'la 100%, cardul e lat').toBe(2);
  // La 100%, conținutul cardului are ~686px (prag 36rem = 576px); la 200%, ~734px, dar pragul urcă la 1152px.
  await textMarit(page);
  expect(await coloane(), 'la 200%, cardul e îngust').toBe(1);
});

// Formularul ca traseu (spec metroul îmbunătățit, §4): trei stații pe o linie verticală desenată și umplută doar din CSS.
// Niciunul dintre testele de mai jos nu trimite formularul: cel din `serial` trimite singurul mesaj real al fișierului.
test('cele trei stații sunt grupuri cu nume, iar legenda le dă numele', async ({ page }) => {
  await page.goto('/contact/');
  for (const legenda of ['1. Cine ești', '2. Site-ul tău (opțional)', '3. Ce te încurcă']) {
    await expect(page.getByRole('group', { name: legenda })).toHaveCount(1);
  }
  await expect(page.getByRole('group', { name: '1. Cine ești' }).getByRole('textbox', { name: /Nume/ })).toHaveCount(1);
  await expect(page.getByRole('group', { name: '3. Ce te încurcă' }).getByRole('textbox', { name: /Mesaj/ })).toHaveCount(1);
  await expect(page.getByText('Destinația: oferta ta')).toBeVisible();
});

test('stația 1 se umple după Nume și E-mail valide', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/contact/');
  const bulina = () => page.locator('.formular__statie').first().locator('legend').evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
  const goala = await bulina();
  // Un singur câmp valid nu ajunge: Numele are nevoie și de E-mail.
  await page.locator('[name="nume"]').fill('Ana Pop');
  expect(await bulina(), 'doar Numele, E-mailul lipsește').toBe(goala);
  await page.locator('[name="email"]').fill('ana@exemplu.ro');
  const plina = await bulina();
  expect(plina, 'Nume și E-mail valide').not.toBe(goala);
  // Bulina plină ia culoarea liniei (cerneală, fără serviciu ales); cea goală, fundalul cardului.
  expect(plina).toBe('rgb(20, 22, 26)');
  // Un E-mail stricat o golește la loc.
  await page.locator('[name="email"]').fill('ana@');
  expect(await bulina(), 'E-mail invalid').toBe(goala);
  // Celelalte stații au câmpuri obligatorii goale (Mesajul) sau nu se umplu deloc (stația opțională).
  const altele = await page.locator('.formular__statie').evaluateAll((s) => s.slice(1).map((el) => getComputedStyle(el.querySelector('legend')!, '::before').backgroundColor));
  expect(altele).toEqual([goala, goala]);
});

test('linia ia culoarea grupului ales', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/contact/');
  const linia = () =>
    page.locator('.formular').evaluate((el) => {
      const s = getComputedStyle(el, '::before');
      return { culoare: s.backgroundColor, afisare: s.display };
    });
  const initial = await linia();
  expect(initial.afisare, 'pe un card lat, linia se vede').not.toBe('none');
  expect(initial.culoare, 'fără serviciu ales, linia e cerneală').toBe('rgb(20, 22, 26)');
  // Culorile de pe alb ale grupurilor (tokens.css, `--culoare`): albastru, verde, galben închis, roșu.
  const dupaServiciu: [string, string][] = [
    ['seo', 'rgb(45, 108, 223)'],
    ['audit-seo', 'rgb(31, 157, 97)'],
    ['creare-site', 'rgb(138, 90, 0)'],
    ['redesign-site', 'rgb(224, 83, 61)'],
    ['nu-stiu', 'rgb(20, 22, 26)'],
  ];
  for (const [serviciu, culoare] of dupaServiciu) {
    await page.locator('[name="serviciu"]').selectOption(serviciu);
    expect((await linia()).culoare, serviciu).toBe(culoare);
  }
  await page.locator('[name="serviciu"]').selectOption('');
  expect((await linia()).culoare, 'înapoi la „Alege un serviciu”').toBe('rgb(20, 22, 26)');
});

test('pe un card îngust, linia verticală dispare', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/contact/');
  expect(await page.locator('.formular').evaluate((el) => getComputedStyle(el, '::before').display)).toBe('none');
  // Fiecare legendă își păstrează bulina, în rând cu textul (nu scoasă din pagină).
  const bulina = await page.locator('.formular__statie legend').first().evaluate((el) => {
    const s = getComputedStyle(el, '::before');
    return { afisare: s.display, pozitie: s.position, latime: s.width };
  });
  expect(bulina.afisare).not.toBe('none');
  expect(bulina.pozitie).not.toBe('absolute');
  expect(Number.parseFloat(bulina.latime)).toBeGreaterThan(0);
});

test('axe pe /contact/: fără încălcări, iar secțiunea formularului are nume', async ({ page }) => {
  await page.goto('/contact/');
  const rezultat = await new AxeBuilder({ page }).analyze();
  expect(rezultat.violations).toEqual([]);
  await expect(page.locator('section[aria-labelledby="formular-titlu"]')).toHaveCount(1);
});

test('banda de sus are harta cu trenuri și buton de oprire, fără „Ești aici”', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('.harta--banda')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Oprește trenurile' })).toHaveCount(1);
  await expect(page.getByText('Ești aici')).toHaveCount(0);
});

test('trimiterea fără JS ajunge la „Am primit cererea ta”', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const p = await context.newPage();
  await completeaza(p);
  await p.getByRole('button', { name: 'Cere o ofertă' }).click();
  await expect(p).toHaveURL(/\/contact\/multumim\/$/);
  await expect(p.locator('h1')).toContainText('Am primit cererea ta');
  await context.close();
});

const CU_PATRU_LINKURI = 'www.a.ro www.b.ro www.c.ro www.d.ro';

// Fără JavaScript, eroarea e o pagină: Înapoi readuce mesajul din istoric (decizia 30 păstrează asta).
test('fără JS, Înapoi după prea multe linkuri readuce mesajul', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const p = await context.newPage();
  await completeaza(p, { mesaj: CU_PATRU_LINKURI });
  await p.getByRole('button', { name: 'Cere o ofertă' }).click();
  await expect(p).toHaveURL(/prea-multe-linkuri/);
  await expect(p.locator('main')).toContainText('Mesajul are mai mult de 3 linkuri.');
  await p.goBack();
  await expect(p.locator('textarea[name="mesaj"]')).toHaveValue(CU_PATRU_LINKURI);
  await context.close();
});

// Formularul cu JavaScript (spec metroul îmbunătățit, §4): serviciul din link, erorile în română sub câmp și contorul.
// Niciunul dintre testele de mai jos nu trimite mesajul: cererile spre Worker se numără și nu pleacă (vezi `numaraCererile`).
/** Numără cererile spre Worker și le oprește pe loc: un test care ar trimite din greșeală n-ar consuma limita de 3 trimiteri pe minut. */
async function numaraCererile(page: Page): Promise<() => number> {
  let cereri = 0;
  page.on('request', (cerere) => {
    if (new URL(cerere.url()).pathname === '/api/contact') cereri += 1;
  });
  await page.route('**/api/contact', (ruta) => ruta.abort());
  return () => cereri;
}

const MESAJE_GOALE = {
  nume: 'Scrie-ți numele.',
  email: 'Scrie-ți adresa de e-mail, ca să-ți pot răspunde.',
  mesaj: 'Scrie-mi pe scurt ce te încurcă la site.',
} as const;

/** `aria-describedby` cu id-ul erorii ca element separat al listei (nu doar ca parte din alt id). */
const cuEroarea = (camp: keyof typeof MESAJE_GOALE) => new RegExp(`(^|\\s)formular-${camp}-eroare(\\s|$)`);

test('?serviciu=redesign-site alege serviciul', async ({ page }) => {
  await page.goto('/contact/?serviciu=redesign-site');
  await expect(page.locator('[name="serviciu"]')).toHaveValue('redesign-site');
  await expect(page.locator('[name="serviciu"] option:checked')).toHaveText('Redesign site');
});

test('?serviciu=xyz e ignorat, lista rămâne pe Alege un serviciu', async ({ page }) => {
  await page.goto('/contact/?serviciu=xyz');
  // Scriptul a pornit (altfel „ignorat” ar fi doar „nu s-a făcut nimic”), iar valoarea necunoscută n-a ales nimic.
  await expect(page.locator('form.formular')).toHaveAttribute('novalidate', '');
  await expect(page.locator('[name="serviciu"]')).toHaveValue('');
  await expect(page.locator('[name="serviciu"] option:checked')).toHaveText('Alege un serviciu');
});

test('trimiterea goală arată mesajele în română și mută focusul pe Nume', async ({ page }) => {
  const cereri = await numaraCererile(page);
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Cere o ofertă' }).click();
  for (const [camp, text] of Object.entries(MESAJE_GOALE) as [keyof typeof MESAJE_GOALE, string][]) {
    await expect(page.locator(`#formular-${camp}-eroare`), camp).toBeVisible();
    await expect(page.locator(`#formular-${camp}-eroare`), camp).toHaveText(text);
    await expect(page.locator(`#formular-${camp}`), camp).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator(`#formular-${camp}`), camp).toHaveAttribute('aria-describedby', cuEroarea(camp));
  }
  // Nota de sub Mesaj rămâne legată de câmp, alături de eroare.
  await expect(page.locator('#formular-mesaj')).toHaveAttribute('aria-describedby', /(^|\s)formular-mesaj-nota(\s|$)/);
  await expect(page.locator('#formular-nume')).toBeFocused();
  // Explicația de sub buton rămâne pentru erorile Worker-ului; formularul nu s-a pus pe „Se trimite…”.
  await expect(page.locator('[data-eroare]')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Cere o ofertă' })).not.toHaveAttribute('aria-disabled');
  await expect(page.locator('form.formular')).not.toHaveAttribute('aria-busy');
  expect(cereri()).toBe(0);
});

test('focusul merge pe primul câmp invalid, nu mereu pe Nume', async ({ page }) => {
  const cereri = await numaraCererile(page);
  await page.goto('/contact/');
  await page.locator('#formular-nume').fill('Ana Pop');
  await page.locator('#formular-email').fill('ana@');
  await page.getByRole('button', { name: 'Cere o ofertă' }).click();
  await expect(page.locator('#formular-email-eroare')).toHaveText('Adresa de e-mail pare incompletă. Verific-o, de exemplu nume@firma.ro.');
  await expect(page.locator('#formular-email')).toBeFocused();
  await expect(page.locator('#formular-nume-eroare')).toBeHidden();
  await expect(page.locator('#formular-nume')).not.toHaveAttribute('aria-invalid');
  await expect(page.locator('#formular-mesaj-eroare')).toHaveText(MESAJE_GOALE.mesaj);
  expect(cereri()).toBe(0);
});

test('mesajul dispare când câmpul devine valid', async ({ page }) => {
  const cereri = await numaraCererile(page);
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Cere o ofertă' }).click();
  await expect(page.locator('#formular-nume-eroare')).toBeVisible();

  await page.locator('#formular-nume').fill('Ana');
  await expect(page.locator('#formular-nume-eroare')).toBeHidden();
  await expect(page.locator('#formular-nume')).not.toHaveAttribute('aria-invalid');
  await expect(page.locator('#formular-nume')).not.toHaveAttribute('aria-describedby');
  // Celelalte câmpuri își păstrează mesajele.
  await expect(page.locator('#formular-email-eroare')).toBeVisible();
  await expect(page.locator('#formular-mesaj-eroare')).toBeVisible();

  // Un E-mail început, dar incomplet, schimbă mesajul în loc să-l lase pe cel de „gol”; abia unul valid îl scoate.
  await page.locator('#formular-email').fill('ana@');
  await expect(page.locator('#formular-email-eroare')).toHaveText('Adresa de e-mail pare incompletă. Verific-o, de exemplu nume@firma.ro.');
  await page.locator('#formular-email').fill('ana@exemplu.ro');
  await expect(page.locator('#formular-email-eroare')).toBeHidden();
  await expect(page.locator('#formular-email')).not.toHaveAttribute('aria-invalid');

  // La Mesaj rămâne doar nota, ca înainte de eroare.
  await page.locator('#formular-mesaj').fill('Salut');
  await expect(page.locator('#formular-mesaj-eroare')).toBeHidden();
  await expect(page.locator('#formular-mesaj')).not.toHaveAttribute('aria-invalid');
  await expect(page.locator('#formular-mesaj')).toHaveAttribute('aria-describedby', 'formular-mesaj-nota');
  expect(cereri()).toBe(0);
});

test('4 linkuri: mesajul apare sub Mesaj, focusul pe Mesaj, 0 cereri', async ({ page }) => {
  const cereri = await numaraCererile(page);
  await completeaza(page, { mesaj: CU_PATRU_LINKURI });
  await page.getByRole('button', { name: 'Cere o ofertă' }).click();
  await expect(page.locator('#formular-mesaj-eroare')).toHaveText('Mesajul are mai mult de 3 linkuri. Scoate câteva și trimite din nou.');
  await expect(page.locator('#formular-mesaj')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#formular-mesaj')).toBeFocused();
  // Nume și E-mail sunt bune; explicația de sub buton nu apare, iar mesajul scris rămâne.
  await expect(page.locator('#formular-nume-eroare')).toBeHidden();
  await expect(page.locator('#formular-email-eroare')).toBeHidden();
  await expect(page.locator('[data-eroare]')).toBeHidden();
  await expect(page.locator('#formular-mesaj')).toHaveValue(CU_PATRU_LINKURI);
  expect(cereri()).toBe(0);

  // Cu trei linkuri mesajul dispare, fără altă trimitere.
  await page.locator('#formular-mesaj').fill('www.a.ro www.b.ro www.c.ro');
  await expect(page.locator('#formular-mesaj-eroare')).toBeHidden();
  expect(cereri()).toBe(0);
});

test('contorul urmează textul', async ({ page }) => {
  await page.goto('/contact/');
  const contor = page.locator('#formular-mesaj-contor');
  await expect(contor).toBeVisible();
  await expect(contor).toHaveText('0 / 3000 caractere · 0 / 3 linkuri');
  await expect(contor).toHaveAttribute('aria-live', 'off');
  await page.locator('#formular-mesaj').fill('a\nb');
  await expect(contor).toHaveText('3 / 3000 caractere · 0 / 3 linkuri');
  const cuLinkuri = 'vezi www.a.ro și https://b.ro';
  await page.locator('#formular-mesaj').fill(cuLinkuri);
  await expect(contor).toHaveText(`${cuLinkuri.length} / 3000 caractere · 2 / 3 linkuri`);
});

test('fără JavaScript, totul ca azi', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const p = await context.newPage();
  await p.goto('/contact/?serviciu=seo');
  // Lista rămâne goală, validarea e a browserului, iar contorul (ale cărui cifre n-ar mai fi adevărate) rămâne ascuns.
  await expect(p.locator('[name="serviciu"]')).toHaveValue('');
  await expect(p.locator('form.formular')).not.toHaveAttribute('novalidate');
  await expect(p.locator('#formular-mesaj-contor')).toBeHidden();
  await expect(p.locator('.formular__eroare-camp:visible')).toHaveCount(0);
  await context.close();
});

// Cu JavaScript, formularul nu pleacă de pe pagină nici când Worker-ul răspunde „prea multe linkuri” (de exemplu dacă
// numărătoarea lui ar diferi de cea din browser): explicația apare sub buton, iar mesajul rămâne în câmpuri. Răspunsul e mocat,
// pentru că cele 4 linkuri nu mai ajung la Worker (le oprește contorul din pagină, testul de mai sus).
test('cu JS, Worker-ul răspunde „prea multe linkuri”: explicația apare pe pagină, cu focusul pe ea, iar mesajul rămâne', async ({ page }) => {
  await page.route('**/api/contact', (ruta) => ruta.fulfill({ status: 303, headers: { Location: '/contact/prea-multe-linkuri/' } }));
  await completeaza(page);
  await page.getByRole('button', { name: 'Cere o ofertă' }).click();
  await expect(page.locator('[data-eroare]')).toBeVisible();
  await expect(page.locator('[data-eroare]')).toBeFocused();
  await expect(page.locator('[data-mesaj="linkuri"]')).toContainText('Mesajul are mai mult de 3 linkuri');
  await expect(page.locator('[data-mesaj="eroare"]')).toBeHidden();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.locator('textarea[name="mesaj"]')).toHaveValue('Salut, am un site de prezentare.');

  // Sub buton (decizia 30), cu iconița de eroare (§5.2), iar „contactele de pe pagină” duc la cardul cu contactele directe.
  const buton = await page.getByRole('button', { name: 'Cere o ofertă' }).boundingBox();
  const eroare = await page.locator('[data-eroare]').boundingBox();
  expect(eroare!.y).toBeGreaterThanOrEqual(buton!.y + buton!.height);
  await expect(page.locator('[data-eroare] svg')).toBeVisible();
  await page.locator('[data-mesaj="linkuri"] a').click();
  await expect(page).toHaveURL(/#direct-titlu$/);
  await expect(page.locator('#direct-titlu')).toBeInViewport();
});

// Modul de contrast ridicat scoate fundalul butoanelor; conturul transparent (butoane.css) devine vizibil în locul lui.
test('în modul de contrast ridicat, butonul de trimitere are contur', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/contact/');
  const contur = await page.getByRole('button', { name: 'Cere o ofertă' }).evaluate((b) => {
    const s = getComputedStyle(b);
    return { stil: s.borderTopStyle, latime: s.borderTopWidth };
  });
  expect(contur.stil).toBe('solid');
  expect(Number.parseFloat(contur.latime)).toBeGreaterThan(0);
});

// Răspunsurile Worker-ului de eroare sunt mocate: așa nu se consumă din limita de trimiteri a `wrangler dev`.
test('cu JS, o eroare a Worker-ului lasă toate câmpurile completate pe pagină', async ({ page }) => {
  await page.route('**/api/contact', (ruta) => ruta.fulfill({ status: 303, headers: { Location: '/contact/eroare/' } }));
  await completeaza(page);
  await page.getByRole('button', { name: 'Cere o ofertă' }).click();
  await expect(page.locator('[data-mesaj="eroare"]')).toBeVisible();
  await expect(page.locator('[data-eroare]')).toBeFocused();
  await expect(page.locator('[name="nume"]')).toHaveValue('Ana Pop');
  await expect(page.locator('[name="email"]')).toHaveValue('ana@exemplu.ro');
  await expect(page.getByRole('button', { name: 'Cere o ofertă' })).toBeEnabled();
});

test('cu JS, un dublu clic în timpul trimiterii nu trimite a doua oară', async ({ page }) => {
  let cereri = 0;
  await page.route('**/api/contact', async (ruta) => {
    cereri += 1;
    await new Promise((rezolva) => setTimeout(rezolva, 300));
    await ruta.fulfill({ status: 303, headers: { Location: '/contact/eroare/' } });
  });
  await completeaza(page);
  await page.getByRole('button', { name: 'Cere o ofertă' }).dblclick();
  await expect(page.locator('[data-mesaj="eroare"]')).toBeVisible();
  expect(cereri).toBe(1);
});

test('cu JS, o cădere de rețea lasă mesajul pe pagină, nu un ecran de eroare al browserului', async ({ page }) => {
  await page.route('**/api/contact', (ruta) => ruta.abort());
  await completeaza(page);
  await page.getByRole('button', { name: 'Cere o ofertă' }).click();
  await expect(page.locator('[data-mesaj="eroare"]')).toBeVisible();
  await expect(page.locator('[name="mesaj"]')).toHaveValue('Salut, am un site de prezentare.');
});

test('capcana completată duce la mulțumire', async ({ page }) => {
  await completeaza(page);
  await page.locator(`[name="${CAPCANA}"]`).evaluate((el) => {
    (el as HTMLInputElement).value = 'https://spam.example';
  });
  await page.getByRole('button', { name: 'Cere o ofertă' }).click();
  await expect(page).toHaveURL(/\/contact\/multumim\/$/);
});

test('browserul oprește un Nume de 101 caractere înainte de trimitere (maxlength)', async ({ page }) => {
  await completeaza(page, { nume: 'a'.repeat(101) });
  expect(await page.locator('[name="nume"]').inputValue()).toHaveLength(100);
});

for (const [cale, titlu, text] of [
  ['/contact/multumim/', 'Am primit cererea ta', 'Lucrul începe doar după ce accepți oferta'],
  [
    '/contact/prea-multe-linkuri/',
    'Mesajul are prea multe linkuri',
    'Mesajul are mai mult de 3 linkuri. Apasă Înapoi în browser ca să-l recuperezi și scoate câteva linkuri, sau scrie-mi direct la',
  ],
  ['/contact/eroare/', 'Mesajul n-a plecat', 'Mesajul n-a plecat. Apasă Înapoi ca să-l recuperezi și încearcă din nou peste un minut, sau scrie-mi direct la'],
] as const) {
  test(`${cale}: noindex, fără hartă și fără butonul din antet, cu textul din §3.5`, async ({ page }) => {
    await page.goto(cale);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('h1')).toContainText(titlu);
    await expect(page.locator('main')).toContainText(text);
    await expect(page.locator('.harta')).toHaveCount(0);
    // Fără JavaScript, pe paginile de eroare butonul ar deschide un formular gol în locul lui Înapoi, care readuce mesajul.
    await expect(page.locator('.antet .buton-cta')).toHaveCount(0);
    if (cale !== '/contact/multumim/') {
      await expect(page.locator('main a[href^="mailto:"]')).toBeVisible();
      await expect(page.locator('main a[href^="tel:"]')).toBeVisible();
      await expect(page.locator('main a[href^="https://wa.me/"]')).toBeVisible();
    }
  });
}

// „Am primit cererea ta” (spec metroul îmbunătățit, §4): sub H1, linia care se termină în stația albastră „Destinație”, apoi
// „Ce urmează” cu trei opriri. Niciunul dintre testele de mai jos nu trimite formularul.
test('multumim: lista Ce urmează are trei opriri', async ({ page }) => {
  await page.goto('/contact/multumim/');
  const opriri = page.locator('main ol li');
  await expect(opriri).toHaveCount(3);
  await expect(opriri).toHaveText([
    'Mă uit la site-ul tău și la ce mi-ai scris.',
    'Îți trimit oferta: ce lucrez, în ce ordine și ce primești.',
    'Lucrul începe doar după ce accepți oferta.',
  ]);
  // Desenul liniei e decor (nu are text alternativ, lista duce conținutul); nu e harta din bandă.
  await expect(page.locator('main svg.destinatie')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.harta')).toHaveCount(0);
  // Ordinea din pagină: titlul, desenul, „Ce urmează” (singurul h2 de sub h1), lista; paragraful cu linkuri vine ultimul.
  const ordine = await page.locator('main').evaluate((main) =>
    [...main.querySelectorAll('h1, h2, h3, svg.destinatie, ol, p')].filter((el) => el.closest('ol') === null || el.tagName === 'OL').map((el) => el.tagName.toLowerCase()),
  );
  expect(ordine).toEqual(['h1', 'svg', 'h2', 'ol', 'p']);
  await expect(page.getByRole('heading', { level: 2, name: 'Ce urmează' })).toHaveCount(1);
  await expect(page.locator('main a[href="/cum-lucrez/"]')).toHaveText('cum lucrez');
  await expect(page.locator('main a[href="/"]')).toHaveText('pagina de pornire');
});

// Stațiile arată ca în rest (§5.4): linia e cerneală, „Destinație” e cercul plin albastru cu inel alb, ca „Ești aici” de pe hartă.
// Culorile vin din tokenuri, deci se citesc din stilul calculat; un `--culoare` lipsă ar lăsa linia listei transparentă.
test('multumim: linia e în cerneală, iar Destinația e stația albastră', async ({ page }) => {
  await page.goto('/contact/multumim/');
  const desen = page.locator('main svg.destinatie');
  const culori = (selector: string) =>
    desen.locator(selector).first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { fill: s.fill, stroke: s.stroke };
    });
  expect((await culori('.destinatie__linie')).stroke, 'linia desenului').toBe('rgb(20, 22, 26)');
  expect(await culori('.destinatie__aici'), 'stația Destinație').toEqual({ fill: 'rgb(45, 108, 223)', stroke: 'rgb(255, 255, 255)' });
  await expect(desen.getByText('Destinație')).toHaveCount(1);
  const segment = await page.locator('main ol li').first().evaluate((el) => getComputedStyle(el, '::after').backgroundColor);
  expect(segment, 'linia listei').toBe('rgb(20, 22, 26)');
});

test('axe pe /contact/multumim/: fără încălcări', async ({ page }) => {
  await page.goto('/contact/multumim/');
  expect(await axe(page)).toEqual([]);
});
