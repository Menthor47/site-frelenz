// Alegerea vizitatorului nu se suprascrie (spec metroul îmbunătățit, §4): serviciul din `?serviciu=` se aplică doar cât lista e
// încă pe „Alege un serviciu”. Firefox restaurează formularul la `reload()` (Chrome nu: la reîncărcare își golește câmpurile, iar la
// Înapoi testul cu istoricul trecea și pe codul vechi), înainte să ruleze scriptul formularului. Dacă scriptul ar pune din nou
// serviciul din link peste alegerea restaurată, lista ar reveni la cel din link, iar câmpurile scrise ar rămâne la locul lor:
// cererea ar pleca cu serviciul greșit.
// Spec separat, ca să-l poată lua și proiectul firefox (playwright.config.ts) fără celelalte specuri de contact. Rulează doar în
// Firefox; în celelalte proiecte e sărit, fiindcă acolo nimic nu e restaurat și testul n-ar spune nimic despre script.
// Nu trimite formularul, deci nu atinge limitatorul local de trimiteri (contact.spec.ts face singur trimiterea reală).
import { expect, test } from './helpers';

test('după reîncărcare, serviciul ales de vizitator rămâne, nu revine la cel din link', async ({ page, browserName }) => {
  test.skip(browserName !== 'firefox', 'Doar Firefox restaurează starea formularului la reîncărcare');
  await page.goto('/contact/?serviciu=seo');
  const lista = page.locator('[name="serviciu"]');
  // Cu serviciul din link, scriptul a ales deja „SEO” (lista era goală).
  await expect(lista).toHaveValue('seo');

  await lista.selectOption('audit-seo');
  await page.locator('[name="nume"]').fill('Ana Pop');
  await page.reload();

  // Dovada că browserul a restaurat formularul (altfel testul n-ar spune nimic despre script): câmpul scris e la locul lui.
  await expect(page.locator('[name="nume"]')).toHaveValue('Ana Pop');
  await expect(lista).toHaveValue('audit-seo');
});
