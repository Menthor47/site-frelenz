// Culorile antetului și ale benzilor, verificate în browser: ce calculează browserul din tokenuri, nu ce scrie în CSS
// (auditul din 2026-10-24, CODE-01). Valorile sunt cele din spec §5.2: --noapte #0E1116, --noapte-text #E8ECF2,
// --noapte-text-2 #A7B0BE, --noapte-contur #2A313C și --albastru-benzi #D9E4F7.
import type { Page } from '@playwright/test';
import { expect, test } from './helpers';

const NOAPTE = 'rgb(14, 17, 22)';
const NOAPTE_TEXT = 'rgb(232, 236, 242)';
const NOAPTE_TEXT_2 = 'rgb(167, 176, 190)';
const NOAPTE_CONTUR = 'rgb(42, 49, 60)';
const ALBASTRU_BENZI = 'rgb(217, 228, 247)';
const ALB = 'rgb(255, 255, 255)';

/** Valoarea calculată a proprietății CSS `proprietate` pe primul element găsit de `selector`. */
const calculat = (page: Page, selector: string, proprietate: string) =>
  page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), proprietate);

test('antetul e întunecat, cu numele alb, rolul și meniul deschise (decizia 28)', async ({ page }) => {
  await page.goto('/servicii/seo/');
  expect(await calculat(page, 'header.antet', 'background-color')).toBe(NOAPTE);
  expect(await calculat(page, 'header.antet', 'border-bottom-color')).toBe(NOAPTE_CONTUR);
  expect(await calculat(page, '.logo__nume', 'color')).toBe(ALB);
  expect(await calculat(page, '.logo__rol', 'color')).toBe(NOAPTE_TEXT_2);
  expect(await calculat(page, '.meniu a:not([aria-current])', 'color')).toBe(NOAPTE_TEXT);
});

test('banda de sus e întunecată, cu stațiile și „Ești aici” desenate în culorile nopții', async ({ page }) => {
  await page.goto('/servicii/seo/');
  expect(await calculat(page, '.banda', 'background-color')).toBe(NOAPTE);
  expect(await calculat(page, '.banda .harta__statie', 'fill')).toBe(NOAPTE);
  expect(await calculat(page, '.banda .harta__statie', 'stroke')).toBe(NOAPTE_TEXT);
  expect(await calculat(page, '.banda .harta__eticheta', 'fill')).toBe(NOAPTE_TEXT);
  expect(await calculat(page, '.banda .harta__eticheta', 'stroke')).toBe(NOAPTE);
});

test('Acasă: zona de sus e întunecată, cu text deschis', async ({ page }) => {
  await page.goto('/');
  expect(await calculat(page, '.acasa-sus', 'background-color')).toBe(NOAPTE);
  expect(await calculat(page, '.acasa-sus', 'color')).toBe(NOAPTE_TEXT);
});

// Erorile (§5.2): mereu cu iconiță și cu text. Iconița din titlul paginii de eroare e în roșul erorilor (--red-dark), iar
// titlul rămâne în culoarea textului (auditul de design din 2026-10-24, D-05).
test('pagina de eroare: iconița din titlu e roșul erorilor, iar titlul rămâne negru', async ({ page }) => {
  await page.goto('/contact/eroare/');
  await expect(page.locator('h1 svg[data-iconita="eroare"]')).toHaveCount(1);
  expect(await calculat(page, 'h1 svg[data-iconita="eroare"]', 'stroke')).toBe('rgb(184, 56, 42)');
  expect(await calculat(page, 'h1', 'color')).toBe('rgb(20, 22, 26)');
});

// Fișa de pe /proiecte/acest-site/ folosește același token, dar pagina există doar în previzualizare (DRAFT=1).
for (const [pagina, selector] of [
  ['/', '.acasa-trasee'],
  ['/cum-lucrez/', '.cum-trasee'],
  ['/servicii/seo/', '.indemn'],
  ['/servicii/seo/', '.serviciu__banda'],
] as const) {
  test(`${pagina}: ${selector} are albastrul benzilor (decizia 26), nu --tint-blue, care dispare pe suprafață`, async ({ page }) => {
    await page.goto(pagina);
    expect(await calculat(page, selector, 'background-color')).toBe(ALBASTRU_BENZI);
  });
}

// Traseele în cerneală (A-14, spec §6): culorile grupurilor rămân doar pentru servicii. Ambele trasee din RouteMap sunt în
// --ink (#14161A): remedierea unică e linia plină, care se termină într-o stație plină, iar abonamentul e aceeași linie,
// continuată de bucla punctată. Se verifică ce calculează browserul, pe pseudo-elementele care desenează linia.
const INK = 'rgb(20, 22, 26)';

/** Valoarea calculată a proprietății `proprietate` pe pseudo-elementul `pseudo` al primului element găsit de `selector`. */
const calculatPseudo = (page: Page, selector: string, pseudo: string, proprietate: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el, [ps, p]) => getComputedStyle(el, ps).getPropertyValue(p), [pseudo, proprietate] as const);

for (const [pagina, radacina] of [
  ['/', '.acasa-trasee'],
  ['/cum-lucrez/', '.cum-trasee'],
] as const) {
  test(`${pagina}: traseele din ${radacina} sunt în --ink, iar bucla abonamentului e punctată`, async ({ page }) => {
    await page.goto(pagina);
    const unic = `${radacina} .traseu--unic`;
    const abonament = `${radacina} .traseu--abonament`;

    // Segmentele dintre stații și eșantionul din fața etichetei: ambele trasee, în cerneală. Eșantionul e plin la remedierea
    // unică și punctat la abonament.
    expect(await calculatPseudo(page, `${unic} .pas`, '::after', 'background-color')).toBe(INK);
    expect(await calculatPseudo(page, `${abonament} .pas`, '::after', 'background-color')).toBe(INK);
    expect(await calculatPseudo(page, `${unic} .traseu__eticheta`, '::before', 'border-top-color')).toBe(INK);
    expect(await calculatPseudo(page, `${abonament} .traseu__eticheta`, '::before', 'border-top-color')).toBe(INK);
    expect(await calculatPseudo(page, `${unic} .traseu__eticheta`, '::before', 'border-top-style')).toBe('solid');
    expect(await calculatPseudo(page, `${abonament} .traseu__eticheta`, '::before', 'border-top-style')).toBe('dashed');

    // Eșantionul punctat are cel puțin 5 grosimi: mai scurt, browserul îl desenează plin și nu s-ar mai deosebi de cel plin.
    const lungime = parseFloat(await calculatPseudo(page, `${abonament} .traseu__eticheta`, '::before', 'width'));
    const grosime = parseFloat(await calculatPseudo(page, `${abonament} .traseu__eticheta`, '::before', 'border-top-width'));
    expect(lungime).toBeGreaterThanOrEqual(5 * grosime);

    // Bucla: chenarul liniei, în cerneală și punctat pe toate laturile.
    for (const latura of ['top', 'right', 'bottom', 'left']) {
      expect(await calculat(page, `${abonament} .bucla`, `border-${latura}-color`)).toBe(INK);
      expect(await calculat(page, `${abonament} .bucla`, `border-${latura}-style`)).toBe('dashed');
    }

    // Stațiile: cele goale au fundalul paginii; capătul remedierii unice e plin, în cerneală. Abonamentul nu se termină aici,
    // deci ultima lui stație dinaintea buclei rămâne goală.
    expect(await calculatPseudo(page, `${unic} .pas:last-child`, '::before', 'background-color')).toBe(INK);
    expect(await calculatPseudo(page, `${unic} .pas:first-child`, '::before', 'background-color')).toBe(ALB);
    expect(await calculatPseudo(page, `${abonament} .pasi--spre-bucla .pas:last-child`, '::before', 'background-color')).toBe(ALB);
  });

  // Cu culorile forțate, fundalurile și degradeurile dispar, dar chenarul punctat și stația plină trebuie să rămână: liniile
  // trec pe CanvasText (culoarea textului în acest mod), iar capătul plin tot pe CanvasText, nu pe fundalul paginii.
  test(`${pagina}: cu culorile forțate, bucla rămâne punctată, linia vizibilă, iar capătul remedierii unice plin`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto(pagina);
    const unic = `${radacina} .traseu--unic`;
    const abonament = `${radacina} .traseu--abonament`;
    const text = await calculat(page, `${radacina} .trasee`, 'color');

    expect(await calculat(page, `${abonament} .bucla`, 'border-top-style')).toBe('dashed');
    expect(await calculat(page, `${abonament} .bucla`, 'border-top-color')).toBe(text);
    expect(await calculatPseudo(page, `${unic} .pas`, '::after', 'background-color')).toBe(text);
    expect(await calculatPseudo(page, `${unic} .traseu__eticheta`, '::before', 'border-top-color')).toBe(text);
    expect(await calculatPseudo(page, `${abonament} .traseu__eticheta`, '::before', 'border-top-color')).toBe(text);
    expect(await calculatPseudo(page, `${abonament} .traseu__eticheta`, '::before', 'border-top-style')).toBe('dashed');
    // Capătul plin e pe culoarea textului; stațiile goale, pe fundalul paginii (altă culoare).
    expect(await calculatPseudo(page, `${unic} .pas:last-child`, '::before', 'background-color')).toBe(text);
    expect(await calculatPseudo(page, `${unic} .pas:first-child`, '::before', 'background-color')).not.toBe(text);
  });
}

// Legenda formatelor din Cum lucrez: același limbaj ca traseele, în cerneală, cu linia plină pentru remedierea unică și linia
// punctată pentru abonament (nimic doar în culoare).
test('/cum-lucrez/: legenda formatelor deosebește linia plină de cea punctată, ambele în --ink', async ({ page }) => {
  await page.goto('/cum-lucrez/');
  expect(await calculatPseudo(page, '.format--unic', '::before', 'border-top-color')).toBe(INK);
  expect(await calculatPseudo(page, '.format--abonament', '::before', 'border-top-color')).toBe(INK);
  expect(await calculatPseudo(page, '.format--unic', '::before', 'border-top-style')).toBe('solid');
  expect(await calculatPseudo(page, '.format--abonament', '::before', 'border-top-style')).toBe('dashed');
});

test('/cum-lucrez/: legenda formatelor rămâne vizibilă cu culorile forțate, plin față de punctat', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/cum-lucrez/');
  const text = await calculat(page, '.cum__formate', 'color');
  expect(await calculatPseudo(page, '.format--unic', '::before', 'border-top-color')).toBe(text);
  expect(await calculatPseudo(page, '.format--abonament', '::before', 'border-top-color')).toBe(text);
  expect(await calculatPseudo(page, '.format--unic', '::before', 'border-top-style')).toBe('solid');
  expect(await calculatPseudo(page, '.format--abonament', '::before', 'border-top-style')).toBe('dashed');
});

// „Cei patru pași” din Cum lucrez (PasiTraseu `comuna`): linia comună a ambelor trasee era două benzi colorate alăturate; acum e
// o singură linie în cerneală, cu grosimea celorlalte linii (0,5rem), pe orizontală (desktop) și pe verticală (telefon).
for (const [nume, fereastra, dimensiune] of [
  ['pe desktop (orizontală)', { width: 1280, height: 800 }, 'height'],
  ['pe telefon (verticală)', { width: 375, height: 667 }, 'width'],
] as const) {
  test(`/cum-lucrez/: linia comună a celor patru pași e o singură linie în --ink ${nume}`, async ({ page }) => {
    await page.setViewportSize(fereastra);
    await page.goto('/cum-lucrez/');
    const pas = '.pasi-traseu--comuna .pasi-traseu__pas';
    expect(await calculatPseudo(page, pas, '::after', 'background-color')).toBe(INK);
    expect(await calculatPseudo(page, pas, '::after', 'background-image')).toBe('none');
    expect(await calculatPseudo(page, pas, '::after', dimensiune)).toBe('8px');
  });
}

test('/cum-lucrez/: linia comună a celor patru pași rămâne vizibilă cu culorile forțate', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/cum-lucrez/');
  const text = await calculat(page, '.pasi-traseu--comuna', 'color');
  expect(await calculatPseudo(page, '.pasi-traseu--comuna .pasi-traseu__pas', '::after', 'background-color')).toBe(text);
});
