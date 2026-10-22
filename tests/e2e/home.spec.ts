// Acasă (§4.3, §5.6, §5.7, Task 11). Rulează pe build-ul de producție, ca vizitatorul: marcajele nu se văd, iar Proiecte
// lipsește cât nu există niciun proiect publicabil.
import type { Page } from '@playwright/test';
import { elementeCareDepasesc, expect, faraDerulareOrizontala, ordineFocus, seSuprapun, test, trenuriInMiscare } from './helpers';

/** Textul la 200%, ca din setarea browserului. Din CSSOM, nu din `<style>`: CSP-ul paginii blochează stilurile inline. */
async function textMarit(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
}

test('zona de sus are un singur rol', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Consultant SEO din București');
  await expect(page.locator('main a', { hasText: 'Cere o ofertă' }).first()).toBeVisible();
  await expect(page.locator('header .buton-cta')).toHaveCount(0);
  await expect(page.getByText('Fișa acestei pagini')).toHaveCount(0);
});

test('subtitlul, apoi butonul plin, imediat sub titlu', async ({ page }) => {
  await page.goto('/');
  const sus = page.locator('.acasa-sus');
  await expect(sus.locator('p').first()).toHaveText('SEO, site-uri și audituri pentru firme care vor să fie găsite în Google și în căutarea AI.');
  const titlu = await page.locator('h1').boundingBox();
  const subtitlu = await sus.locator('p').first().boundingBox();
  const buton = await sus.locator('.buton-cta').boundingBox();
  expect(titlu && subtitlu && buton).toBeTruthy();
  expect(subtitlu!.y).toBeGreaterThan(titlu!.y + titlu!.height - 1);
  expect(buton!.y).toBeGreaterThan(subtitlu!.y + subtitlu!.height - 1);
});

test('titlul stă peste hartă, pe fundal alb, ca un indicator de stație', async ({ page }) => {
  await page.goto('/');
  const titlu = (await page.locator('h1').boundingBox())!;
  const harta = (await page.locator('.harta--animata').boundingBox())!;
  // Muchia de sus a plăcuței cade între M2 (la jumătatea hărții) și M3 (la două treimi), iar plăcuța iese sub hartă.
  const sus = (titlu.y - harta.y) / harta.height;
  expect(sus).toBeGreaterThan(0.5);
  expect(sus).toBeLessThan(2 / 3);
  expect(titlu.y + titlu.height).toBeGreaterThan(harta.y + harta.height);
  expect(await page.locator('h1').evaluate((h) => getComputedStyle(h).backgroundColor)).toBe('rgb(255, 255, 255)');
});

test('ordinea secțiunilor (§4.3)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main h2')).toHaveText(['De unde pornești?', 'Cum lucrăm: două trasee', 'Întrebări frecvente']);
  await expect(page.locator('main .linie-rand')).toHaveCount(6);
  await expect(page.locator('main .linie-rand a')).toHaveText([
    'SEO',
    'Optimizare AEO și GEO',
    'Audit SEO',
    'Creare site',
    'Redesign site',
    'Mentenanță site',
  ]);
  await expect(page.locator('main').getByText('Spune-mi ce site ai și ce te încurcă.')).toBeVisible();
});

test('cel mult un script executabil pe pagină', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('script:not([type="application/ld+json"])').count()).toBeLessThanOrEqual(1);
});

test('ordinea focusului: butonul de oprire vine după „Cere o ofertă”', async ({ page }) => {
  test.skip(test.info().project.name === 'webkit', 'WebKit, ca Safari, sare implicit peste linkuri la Tab; ordinea din DOM e verificată în Chrome și Firefox');
  await page.goto('/');
  const ordine = await ordineFocus(page);
  expect(ordine.indexOf('Cere o ofertă')).toBeGreaterThanOrEqual(0);
  expect(ordine.indexOf('Oprește trenurile')).toBeGreaterThan(ordine.indexOf('Cere o ofertă'));
});

test('trenurile circulă după ce se desenează liniile', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);
  expect(await trenuriInMiscare(page)).toBe(true);
});

test('butonul oprește trenurile, iar derularea nu le repornește', async ({ page }) => {
  await page.goto('/');
  const buton = page.getByRole('button', { name: 'Oprește trenurile' });
  await expect(buton).not.toHaveAttribute('aria-pressed');
  await buton.click();
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, -3000);
  await page.waitForTimeout(300);
  await expect(page.getByRole('button', { name: 'Pornește trenurile' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pornește trenurile' })).not.toHaveAttribute('aria-pressed');
  expect(await trenuriInMiscare(page)).toBe(false);
});

test('oprirea și pornirea se anunță în zona aria-live, pentru cititoarele de ecran', async ({ page }) => {
  await page.goto('/');
  const anunt = page.locator('[data-stare-trenuri]');
  await expect(anunt).toHaveAttribute('aria-live', 'polite');
  await expect(anunt).toHaveText('');
  await page.getByRole('button', { name: 'Oprește trenurile' }).click();
  await expect(anunt).toHaveText('Trenurile s-au oprit.');
  await page.getByRole('button', { name: 'Pornește trenurile' }).click();
  await expect(anunt).toHaveText('Trenurile au pornit.');
});

test('„reduced motion” cerut în timpul vizitei oprește trenurile și ascunde butonul', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Oprește trenurile' })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('button', { name: /trenurile/ })).toBeHidden();
  await expect(page.locator('.trenuri')).toBeHidden();
  expect(await trenuriInMiscare(page)).toBe(false);
});

test('reduced motion: fără trenuri și fără buton', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const p = await context.newPage();
  await p.goto('/');
  await expect(p.locator('.trenuri')).toBeHidden();
  await expect(p.getByRole('button', { name: /trenurile/ })).toBeHidden();
  await context.close();
});

test('fără JavaScript: harta e statică', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const p = await context.newPage();
  await p.goto('/');
  await expect(p.locator('.trenuri')).toBeHidden();
  await expect(p.getByRole('button', { name: /trenurile/ })).toBeHidden();
  await expect(p.locator('h1')).toBeVisible();
  await context.close();
});

test('text mărit la 200%, pe 320px: nimic nu se suprapune', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await textMarit(page);
  expect(await seSuprapun(page, ['h1', 'main .buton-cta', '.harta button'])).toBe(false);
});

// Pistele fixe din LineDiagram (Task 9) ar putea împinge pagina la 768px cu text mărit.
for (const latime of [320, 768]) {
  test(`text mărit la 200%, pe ${latime}px: fără derulare orizontală`, async ({ page }) => {
    await page.setViewportSize({ width: latime, height: 900 });
    await page.goto('/');
    await textMarit(page);
    const fara = await faraDerulareOrizontala(page);
    expect(fara, fara ? '' : (await elementeCareDepasesc(page)).join('; ')).toBe(true);
  });
}

// Cu text normal, de la 768px, rândul din „De unde pornești?” stă pe o singură linie (container query în LineDiagram).
test('la 768px, problema și capătul de linie stau pe același rând', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');
  const rand = page.locator('main .linie-rand').first();
  const problema = (await rand.locator('.linie-rand__problema').boundingBox())!;
  const capat = (await rand.locator('.linie-rand__capat').boundingBox())!;
  expect(capat.x).toBeGreaterThan(problema.x + problema.width - 1);
  expect(Math.abs(capat.y + capat.height / 2 - (problema.y + problema.height / 2))).toBeLessThan(capat.height);
});

// M3 (§5.7, ruling R5): segmentul de pe Acasă și banda paginii de serviciu au același `view-transition-name`.
test('segmentul din „De unde pornești?” și banda serviciului au același nume de tranziție', async ({ page }) => {
  await page.goto('/');
  const numeTranzitie = (selector: string) => page.locator(selector).evaluate((el) => getComputedStyle(el).viewTransitionName);
  expect(await numeTranzitie('.linie-rand__segment.vt-seo')).toBe('segment-seo');
  await page.goto('/servicii/seo/');
  expect(await numeTranzitie('.banda.vt-seo')).toBe('segment-seo');
});

test('favicon-ul e stația plină albastră (§5.4)', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toBe('/favicon.svg');
  const raspuns = await page.request.get(href!);
  expect(raspuns.ok()).toBe(true);
  expect(await raspuns.text()).toContain('#2D6CDF');
});
