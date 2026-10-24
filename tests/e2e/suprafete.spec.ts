// Stratul de suprafețe (decizia 29), verificat în browser: ce se vede, nu doar clasele din HTML.
// Paginile sunt cele din build-ul de producție, servit pe portul din playwright.config.ts.
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './helpers';

/** Mărimea fontului unui element, în pixeli. */
const marime = (page: Page, selector: string) => page.locator(selector).evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

/** Pe câte rânduri stă `cuvant` în textul elementului (1 = cuvântul nu e rupt). */
const randuriCuvant = (page: Page, selector: string, cuvant: string) =>
  page.locator(selector).evaluate((el, c) => {
    const nod = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').includes(c));
    if (nod === undefined) throw new Error(`„${c}” nu e în textul elementului`);
    const start = (nod.textContent ?? '').indexOf(c);
    const interval = document.createRange();
    interval.setStart(nod, start);
    interval.setEnd(nod, start + c.length);
    return new Set([...interval.getClientRects()].map((r) => Math.round(r.top))).size;
  }, cuvant);

test('Despre: în cardul de profil, titlul „Unelte” e mai mic decât numele', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/despre/');
  expect(await marime(page, '.despre__unelte-titlu')).toBeLessThan(await marime(page, '.despre__nume'));
});

for (const latime of [1440, 1024]) {
  test(`Contact la ${latime}px: „Sau scrie-mi direct” nu se rupe în „scrie-mi”`, async ({ page }) => {
    await page.setViewportSize({ width: latime, height: 900 });
    await page.goto('/contact/');
    expect(await randuriCuvant(page, '#direct-titlu', 'scrie-mi')).toBe(1);
  });
}

test('Servicii la 1440px: Diagnostic și Construcție stau alături, pe același rând', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/servicii/');
  const diagnostic = await page.locator('section[data-grup="diagnostic"]').boundingBox();
  const constructie = await page.locator('section[data-grup="constructie"]').boundingBox();
  expect(Math.round(constructie?.y ?? -1)).toBe(Math.round(diagnostic?.y ?? -2));
  expect(constructie?.x ?? 0).toBeGreaterThanOrEqual((diagnostic?.x ?? 0) + (diagnostic?.width ?? 0));
});

test('Servicii la 390px: Construcție stă sub Diagnostic', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/servicii/');
  const diagnostic = await page.locator('section[data-grup="diagnostic"]').boundingBox();
  const constructie = await page.locator('section[data-grup="constructie"]').boundingBox();
  expect(constructie?.y ?? 0).toBeGreaterThanOrEqual((diagnostic?.y ?? 0) + (diagnostic?.height ?? 0));
});

// Tot cardul duce la serviciu, ca rândurile din „De unde pornești?” de pe Acasă (auditul din 2026-10-24, UI-02). Clicul și
// mișcarea sunt ale mouse-ului, la coordonate: linkul acoperă cardul, deci `locator.click()` pe paragraf n-ar ajunge la el.
// Cardul stă sub prima ecranare, iar mouse-ul ajunge doar în fereastră: întâi derularea, apoi coordonatele.
async function mijlocVizibil(element: Locator): Promise<[number, number]> {
  await element.scrollIntoViewIfNeeded();
  const cutie = await element.boundingBox();
  if (cutie === null) throw new Error('elementul nu se vede');
  return [cutie.x + cutie.width / 2, cutie.y + cutie.height / 2];
}

test('Servicii: un clic pe textul unui card deschide pagina serviciului', async ({ page }) => {
  await page.goto('/servicii/');
  const card = page.locator('.serviciu-card').first();
  const href = await card.locator('h3 a').getAttribute('href');
  await page.mouse.click(...(await mijlocVizibil(card.locator('p').first())));
  await expect(page).toHaveURL(new RegExp(`${href ?? 'fără href'}$`));
});

test('Servicii: mouse-ul pe textul cardului îngroașă sublinierea numelui serviciului, ca pe Acasă', async ({ page }) => {
  await page.goto('/servicii/');
  const card = page.locator('.serviciu-card').first();
  const grosime = () => card.locator('h3 a').evaluate((a) => Number.parseFloat(getComputedStyle(a).textDecorationThickness));
  const inainte = await grosime();
  await page.mouse.move(...(await mijlocVizibil(card.locator('p').first())));
  expect(await grosime()).toBeGreaterThan(inainte);
});

test('Servicii: linia de deasupra îndemnului final se vede pe suprafață (cel puțin 1,1:1)', async ({ page }) => {
  await page.goto('/servicii/');
  const raport = await page.evaluate(() => {
    const canale = (culoare: string) => (culoare.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminanta = (culoare: string) => {
      const [r = 0, g = 0, b = 0] = canale(culoare).map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const linie = luminanta(getComputedStyle(document.querySelector('.servicii__final') as Element).borderTopColor);
    const fundal = luminanta(getComputedStyle(document.querySelector('main') as Element).backgroundColor);
    return (Math.max(linie, fundal) + 0.05) / (Math.min(linie, fundal) + 0.05);
  });
  expect(raport).toBeGreaterThanOrEqual(1.1);
});

// Antetul paginilor interioare pe telefon (auditul Impeccable din 2026-10-24, A-5): două rânduri, logo-ul cu butonul „Cere
// o ofertă” lângă el și meniul dedesubt, nu trei sau patru. Ordinea focusului rămâne logo, meniu, buton.
for (const latime of [320, 360, 390, 430]) {
  test(`la ${latime}px, antetul unei pagini de serviciu are două rânduri, cu butonul lângă logo`, async ({ page }) => {
    await page.setViewportSize({ width: latime, height: 800 });
    await page.goto('/servicii/seo/');
    const logo = (await page.locator('.antet .logo').boundingBox())!;
    const buton = (await page.locator('.antet .buton-cta').boundingBox())!;
    const meniu = (await page.locator('.antet nav').boundingBox())!;
    // Butonul e pe rândul logo-ului (se suprapun pe verticală), iar meniul e sub amândouă, pe un singur rând.
    expect(buton.y).toBeLessThan(logo.y + logo.height);
    expect(meniu.y).toBeGreaterThanOrEqual(Math.max(logo.y + logo.height, buton.y + buton.height) - 1);
    expect(meniu.height).toBeLessThanOrEqual(45);
    expect((await page.locator('.antet').boundingBox())!.height).toBeLessThanOrEqual(125);
  });
}

test('la 320px, „Contact” lipsește din meniu doar unde butonul din antet duce deja la Contact', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/servicii/seo/');
  await expect(page.locator('.meniu a[href="/contact/"]')).toBeHidden();
  await page.goto('/contact/eroare/');
  await expect(page.locator('.meniu a[href="/contact/"]')).toBeVisible();
});
