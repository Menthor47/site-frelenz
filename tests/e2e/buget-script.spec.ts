// Bugetul scriptului formularului (spec metroul îmbunătățit, §1: „scriptul formularului crește cu cel mult 2 KB”). Alături de
// buget-css.spec.ts: acela păzește CSS-ul fiecărei pagini, acesta păzește scriptul de pe /contact/, ca o funcție adăugată la
// formular să nu-l umfle pe neobservate. Scriptul trenurilor nu are buget în spec, deci nu se măsoară aici.
import { expect, test } from './helpers';

/** 1131 de octeți (spec-ul principal, §9.1, măsurat pe 2026-10-24) plus cei 2 KB permiși de spec-ul metroul îmbunătățit. */
const LIMITA = 1131 + 2048;

test('scriptul formularului de pe /contact/ rămâne sub 3179 de octeți necomprimat', async ({ page }) => {
  await page.goto('/contact/');
  // Scriptul formularului e cel din afara benzii (în bandă stă cel al trenurilor). Astro îl pune inline cât e mic; dacă ar
  // depăși pragul de inline al lui Vite, ar veni dintr-un fișier, deci se măsoară și așa.
  const scripturi = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLScriptElement>('script:not([type="application/ld+json"])')]
      .filter((s) => !s.closest('.banda'))
      .map((s) => ({ src: s.getAttribute('src'), text: s.textContent ?? '' })),
  );
  expect(scripturi, 'un singur script al formularului în afara benzii').toHaveLength(1);
  const { src, text } = scripturi[0]!;
  const octeti = src === null ? Buffer.byteLength(text, 'utf8') : (await (await page.request.get(src)).body()).length;
  expect(octeti, `scriptul formularului are ${octeti} octeți (limita ${LIMITA})`).toBeLessThanOrEqual(LIMITA);
});
