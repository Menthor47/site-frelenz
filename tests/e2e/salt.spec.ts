// Linkul „Sari la conținut” (A-05 din auditul din 2026-10-24), cu tastatura, în Chrome. Pe paginile cu bandă, saltul trece
// peste hartă și peste butonul trenurilor: următorul Tab ajunge la firimituri. Pe Acasă (harta e în conținut, fără bandă),
// ținta rămâne <main>.
import { expect, test } from './helpers';

for (const cale of ['/servicii/seo/', '/contact/', '/despre/']) {
  test(`${cale}: după „Sari la conținut”, Tab ajunge la firimituri, nu la butonul trenurilor`, async ({ page }) => {
    await page.goto(cale);
    await page.keyboard.press('Tab');
    await expect(page.locator('a.sari')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(page.locator('nav[aria-label="Firimituri"] a').first()).toBeFocused();
  });
}

// Pe telefon banda e ascunsă (display: none), deci nici butonul trenurilor nu mai are focus; firimiturile (linia) rămân ținta.
test('/servicii/seo/ la 375×667: după „Sari la conținut”, Tab ajunge la primul link din firimituri', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/servicii/seo/');
  await page.keyboard.press('Tab');
  await expect(page.locator('a.sari')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.locator('nav[aria-label="Firimituri"] a').first()).toBeFocused();
});

test('Acasă: după „Sari la conținut”, Tab ajunge în <main>', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.locator('main :focus')).toHaveCount(1);
});
