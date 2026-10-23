// Contact și paginile de răspuns (§3.5, §4.5, Task 14), pe build-ul servit de `wrangler dev`: formularul ajunge la Worker.
// Limitatorul din `wrangler dev` numără real (3 trimiteri la 60 s pe aceeași cheie), dar doar cererile care pleacă: fișierul
// trimite un singur mesaj (fără JS); cererea cu prea multe linkuri și capcana nu ajung la limitator. Modul serial oprește
// restul dacă un test pică.
import AxeBuilder from '@axe-core/playwright';
import { completeaza, expect, faraDerulareOrizontala, seSuprapun, test, textMarit } from './helpers';

test.describe.configure({ mode: 'serial' });

test('contactul are un singur script executabil: al trenurilor de pe bandă, iar formularul nu depinde de el', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('script:not([type="application/ld+json"])')).toHaveCount(1);
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
  const capcana = page.locator('[name="confirmare_url"]');
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

test('text mărit la 200% pe /contact/: câmpurile nu se suprapun, fără derulare orizontală', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/contact/');
  await textMarit(page);
  expect(await seSuprapun(page, ['#formular-nume', '#formular-email', '#formular-telefon', '#formular-firma'])).toBe(false);
  expect(await faraDerulareOrizontala(page)).toBe(true);
});

// Pază împotriva eșecului tăcut: dacă `container-type` dispare de pe card, interogarea de container nu se mai aplică,
// formularul rămâne mereu pe o coloană, iar niciun alt test nu observă.
test('formularul are două coloane pe desktop și una când cardul e îngust', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/contact/');
  const coloane = () => page.locator('.formular').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(await coloane(), 'la 100%, cardul e lat').toBe(2);
  // La 100%, conținutul cardului are ~686px (prag 36rem = 576px); la 200%, ~734px, dar pragul urcă la 1152px.
  await textMarit(page);
  expect(await coloane(), 'la 200%, cardul e îngust').toBe(1);
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

test('Înapoi după prea multe linkuri readuce mesajul', async ({ page }) => {
  await completeaza(page, { mesaj: 'www.a.ro www.b.ro www.c.ro www.d.ro' });
  await page.getByRole('button', { name: 'Cere o ofertă' }).click();
  await expect(page).toHaveURL(/prea-multe-linkuri/);
  await expect(page.locator('main')).toContainText('Mesajul are mai mult de 3 linkuri.');
  await page.goBack();
  await expect(page.locator('textarea[name="mesaj"]')).toHaveValue('www.a.ro www.b.ro www.c.ro www.d.ro');
});

test('capcana completată duce la mulțumire', async ({ page }) => {
  await completeaza(page);
  await page.locator('[name="confirmare_url"]').evaluate((el) => {
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
  ['/contact/multumim/', 'Am primit cererea ta', 'Mă uit la ce mi-ai scris și la site-ul tău, apoi îți trimit oferta'],
  [
    '/contact/prea-multe-linkuri/',
    'Mesajul are prea multe linkuri',
    'Mesajul are mai mult de 3 linkuri. Apasă Înapoi în browser ca să-l recuperezi și scoate câteva linkuri, sau scrie-mi direct la',
  ],
  ['/contact/eroare/', 'Mesajul n-a plecat', 'Mesajul n-a plecat. Apasă Înapoi ca să-l recuperezi și încearcă din nou peste un minut, sau scrie-mi direct la'],
] as const) {
  test(`${cale}: noindex, fără hartă, cu textul din §3.5`, async ({ page }) => {
    await page.goto(cale);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('h1')).toContainText(titlu);
    await expect(page.locator('main')).toContainText(text);
    await expect(page.locator('.harta')).toHaveCount(0);
    if (cale !== '/contact/multumim/') {
      await expect(page.locator('main a[href^="mailto:"]')).toBeVisible();
      await expect(page.locator('main a[href^="tel:"]')).toBeVisible();
      await expect(page.locator('main a[href^="https://wa.me/"]')).toBeVisible();
    }
  });
}
