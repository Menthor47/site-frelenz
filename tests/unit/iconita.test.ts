import Iconita from '../../src/components/Iconita.astro';
import { render } from './helpers';

// Iconița (§5.4; auditul de design din 2026-10-24, D-05): un desen SVG inline, ascuns cititoarelor de ecran; numele îl dă
// textul de lângă ea. Unde apare: tests/unit/iconite-pagini.test.ts.

/** Numele iconițelor dintr-un HTML (`data-iconita`), în ordinea în care apar. */
const iconite = (html: string) => [...html.matchAll(/<svg\b[^>]*\sdata-iconita="([^"]+)"/g)].map((m) => m[1]);

test.each(['eroare', 'telefon', 'whatsapp', 'email'])('„%s” e un desen SVG ascuns cititoarelor de ecran, fără stil inline', async (nume) => {
  const h = await render(Iconita, { nume });
  expect(iconite(h)).toEqual([nume]);
  expect(h).toMatch(/<svg\b[^>]*\saria-hidden="true"/);
  expect(h).toMatch(/<svg\b[^>]*\sfocusable="false"/);
  expect(h).toMatch(/<path\b[^>]*\sd="[^"]+"/);
  expect(h).not.toMatch(/\sstyle=/);
});
