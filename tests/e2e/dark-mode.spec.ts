import { expect, test } from '@playwright/test';

// Telefonul setat pe temă întunecată: pagina rămâne luminoasă (spec 5.1, `color-scheme: light`).
test.use({ colorScheme: 'dark' });

test('tema întunecată a telefonului nu întunecă pagina', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(await page.evaluate(() => getComputedStyle(document.body).color)).toBe('rgb(20, 22, 26)');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('light');
});
