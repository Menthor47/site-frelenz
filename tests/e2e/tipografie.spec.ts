// Tipografia, măsurată în browser (§5.3; auditul de design din 2026-10-24, D-03 și D-07): lungimea rândurilor și mărimile
// de text, cum le desenează browserul.
import type { Page } from '@playwright/test';
import { expect, test } from './helpers';

/**
 * Cel mai lat rând desenat al fiecărui element găsit de `selector`, în em (lățimea rândului împărțită la mărimea textului):
 * fiecare caracter își ia rândul după poziția pe ecran, iar rândul e lat de la primul la ultimul caracter.
 */
const randulCelMaiLatInEm = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((elemente) =>
    elemente.map((el) => {
      const randuri = new Map<number, { stanga: number; dreapta: number }>();
      const umbla = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let nod = umbla.nextNode(); nod !== null; nod = umbla.nextNode()) {
        const text = nod.textContent ?? '';
        for (let i = 0; i < text.length; i++) {
          if (text[i]?.trim() === '') continue;
          const interval = document.createRange();
          interval.setStart(nod, i);
          interval.setEnd(nod, i + 1);
          const cutie = interval.getClientRects()[0];
          if (cutie === undefined) continue;
          const sus = Math.round(cutie.top);
          const rand = randuri.get(sus) ?? { stanga: cutie.left, dreapta: cutie.right };
          randuri.set(sus, { stanga: Math.min(rand.stanga, cutie.left), dreapta: Math.max(rand.dreapta, cutie.right) });
        }
      }
      const latime = Math.max(0, ...[...randuri.values()].map((r) => r.dreapta - r.stanga));
      return Math.round((latime / Number.parseFloat(getComputedStyle(el).fontSize)) * 100) / 100;
    }),
  );

// §5.3: textul are măsura paragrafelor, 34em (~70 de caractere). Răspunsurile din FAQ sunt `<dd>`, nu paragrafe, deci
// trebuie să ajungă la ele aceeași regulă (înainte se rupeau la lățimea listei, 70ch, cu rânduri de peste 100 de caractere).
for (const cale of ['/', '/servicii/seo/']) {
  test(`${cale}: răspunsurile din „Întrebări frecvente” se rup la măsura paragrafelor (34em), la 1440px`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(cale);
    const latimi = await randulCelMaiLatInEm(page, '.faq dd');
    expect(latimi.length).toBeGreaterThan(0);
    expect(latimi.filter((em) => em > 34)).toEqual([]);
  });
}

// Scara (§5.3): tokenurile din tokens.css (14,4, 18, 22,5, 28 și 35px, plus H1-ul, care la 1440px ajunge la plafonul lui,
// 56px) și 16px, mărimea meniului. Textul din desenele SVG se scalează cu desenul, deci nu intră.
const SCARA = ['14.4px', '16px', '18px', '22.5px', '28px', '35px', '56px'];

for (const cale of ['/', '/servicii/', '/servicii/seo/', '/cum-lucrez/', '/despre/', '/contact/']) {
  test(`${cale}: fiecare text are o mărime de pe scara tipografică, la 1440px`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(cale);
    const inAfara = await page.evaluate((scara) => {
      const gasite = new Set<string>();
      for (const el of document.querySelectorAll('body *')) {
        if (el.closest('svg') !== null) continue;
        const areText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '');
        const cutie = el.getBoundingClientRect();
        if (!areText || cutie.width === 0 || cutie.height === 0) continue;
        const marime = getComputedStyle(el).fontSize;
        if (!scara.includes(marime)) gasite.add(`${marime} ${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
      }
      return [...gasite];
    }, SCARA);
    expect(inAfara).toEqual([]);
  });
}
