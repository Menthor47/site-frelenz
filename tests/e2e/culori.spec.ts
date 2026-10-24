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
