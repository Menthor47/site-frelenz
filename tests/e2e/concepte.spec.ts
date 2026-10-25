import { cereriExterne, expect, incalcariCsp, test } from './helpers';

// Conceptul AETHER // LABS (cererea lui Alex din 2026-10-25): pagina lui, păstrată cum a fost făcută, se deschide din cardul
// de pe /despre/. Trei lucruri diferă de original și se verifică aici: fonturile vin de pe site, nu de la Google; pagina e
// noindex (antet și meta); banda de jos spune că e un concept și duce înapoi la site.
const CALE = '/concepte/aether-labs/';

test('conceptul se deschide din cardul de pe /despre/', async ({ page }) => {
  await page.goto('/despre/');
  await page.getByRole('link', { name: 'AETHER // LABS' }).click();
  await expect(page).toHaveURL(CALE);
  await expect(page).toHaveTitle(/AETHER \/\/ LABS/);
});

test('conceptul nu face nicio cerere spre alte servere, nu încalcă CSP-ul și are fonturile lui', async ({ page }) => {
  await page.goto(CALE);
  await page.evaluate(() => document.fonts.ready);
  expect(await cereriExterne(page)).toEqual([]);
  expect(await incalcariCsp(page)).toEqual([]);
  const fonturi = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')));
  for (const familie of ['Syne', 'Plus Jakarta Sans', 'Space Mono']) expect(fonturi, familie).toContain(familie);
});

test('conceptul e noindex și spune că e un concept, cu link înapoi la site', async ({ page }) => {
  const raspuns = await page.goto(CALE);
  expect(raspuns?.status()).toBe(200);
  expect(raspuns?.headers()['x-robots-tag']).toBe('noindex');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  const banda = page.getByRole('complementary', { name: 'Despre această pagină' });
  await expect(banda).toContainText('Concept de design făcut de Alex Ionescu');
  await expect(banda).toContainText('sunt inventate');
  const inapoi = banda.getByRole('link', { name: '← Înapoi la site' });
  const cutie = await inapoi.boundingBox();
  expect(cutie?.height ?? 0).toBeGreaterThanOrEqual(44);
  await inapoi.click();
  await expect(page).toHaveURL('/despre/');
});
