// Ajutoarele testelor pe pagină (Task 7). `test` de aici ascultă CSP-ul și cererile încă de la încărcare:
// testele care folosesc `incalcariCsp` sau `cereriExterne` importă `test` din acest fișier, nu din `@playwright/test`.
import AxeBuilder from '@axe-core/playwright';
import { test as base, type Page } from '@playwright/test';

export { esteNoindex, scripturiPermise } from '../../scripts/schema-expectations.mjs';
// Regula de text din §8 (ruling R3) stă în tests/shared, ca s-o poată folosi și testele de conținut, fără Playwright.
export { adresareFormala } from '../shared/adresare';

// ——— Ascultarea de la încărcare ———

const violariCsp = new WeakMap<Page, Set<string>>();
const cereriDinAfara = new WeakMap<Page, Set<string>>();

/** `page` ascultă încălcările CSP (eveniment și mesaje de consolă) și cererile spre alte origini din prima navigare. */
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const csp = new Set<string>();
    const cereri = new Set<string>();
    violariCsp.set(page, csp);
    cereriDinAfara.set(page, cereri);

    await page.exposeFunction('__qaIncalcareCsp', (text: string) => csp.add(text));
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => {
        (window as unknown as { __qaIncalcareCsp: (t: string) => void }).__qaIncalcareCsp(`${e.violatedDirective} ${e.blockedURI}`);
      });
    });
    page.on('console', (m) => {
      if (/content security policy|refused to/i.test(m.text())) csp.add(`consolă: ${m.text()}`);
    });
    const origine = baseURL ? new URL(baseURL).origin : undefined;
    page.on('request', (r) => {
      const url = r.url();
      if (/^(?:data|blob|about):/.test(url)) return;
      if (origine === undefined || new URL(url).origin !== origine) cereri.add(url);
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';

function ascultate<T>(harta: WeakMap<Page, T>, page: Page, nume: string): T {
  const valoare = harta.get(page);
  if (valoare === undefined) {
    throw new Error(`${nume}: pagina nu ascultă încă de la încărcare. Importă \`test\` din tests/e2e/helpers.ts, nu din @playwright/test.`);
  }
  return valoare;
}

/** Încălcările CSP de la încărcare încoace (directiva și resursa blocată). Gol = niciuna. */
export async function incalcariCsp(page: Page): Promise<string[]> {
  return [...ascultate(violariCsp, page, 'incalcariCsp')];
}

/** Cererile către alte origini decât cea a site-ului (zero cereri spre alte domenii, §1). Gol = niciuna. */
export async function cereriExterne(page: Page): Promise<string[]> {
  return [...ascultate(cereriDinAfara, page, 'cereriExterne')];
}

// ——— Verificările ———

/** Încălcările axe (WCAG 2.1 A/AA și bune practici), fiecare pe un rând: regulă, impact, ce și unde. Gol = nicio încălcare. */
export async function axe(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
  return violations.map((v) => {
    const tinte = v.nodes.slice(0, 5).map((n) => n.target.join(' '));
    const rest = v.nodes.length > 5 ? ` (+${v.nodes.length - 5})` : '';
    return `${v.id} (${v.impact ?? 'fără impact'}): ${v.help}: ${tinte.join(' | ')}${rest}`;
  });
}

/** `true` dacă pagina nu se derulează pe orizontală și nimic nu iese din ea (nici sub un `overflow-x: hidden` pus pe <body>). */
export async function faraDerulareOrizontala(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const latime = document.documentElement.clientWidth;
    return document.documentElement.scrollWidth <= latime && document.body.scrollWidth <= latime;
  });
}

/** Elementele vizibile care ies la dreapta din pagină, fără cele tăiate de un părinte cu `overflow` (acelea se derulează în ele). Pentru mesajul de eroare. */
export async function elementeCareDepasesc(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const latime = document.documentElement.clientWidth;
    const descrie = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}`;
    const taiat = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const { overflowX } = getComputedStyle(p);
        if (overflowX !== 'visible') return true;
      }
      return false;
    };
    const iesite: string[] = [];
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.right <= latime + 0.5) continue;
      if (getComputedStyle(el).position === 'fixed' || taiat(el)) continue;
      iesite.push(`${descrie(el)} ajunge la ${Math.round(r.right)}px (pagina are ${latime}px)`);
    }
    return iesite.slice(0, 10);
  });
}

/** Ce trebuie să aibă cel puțin 44×44px (§5.8). Linkurile din interiorul textului sunt exceptate. */
const ZONE_DE_ATINGERE = ['button', 'input:not([type=hidden])', 'select', 'textarea', 'header nav a', 'footer a', '.buton-cta', '.linie-rand a'];
const ATINGERE_MIN = 44;

/**
 * Elementele care ar trebui să aibă cel puțin 44×44px și au mai puțin, ca „selector „text” LxÎ”. Gol = toate încap.
 * Nu se numără elementele ascunse (display/visibility, `hidden`, `aria-hidden`, scoase din pagină sau de 1px, ca skip link înainte de
 * focus și câmpul-capcană) și linkurile din rândurile de text.
 */
export async function zoneAtingereMici(page: Page): Promise<string[]> {
  return page.evaluate(
    ({ selectori, minim }) => {
      const ascuns = (el: Element, r: DOMRect) =>
        !el.checkVisibility({ checkVisibilityCSS: true, opacityProperty: true }) ||
        el.closest('[hidden], [aria-hidden="true"]') !== null ||
        r.width <= 1 ||
        r.height <= 1 ||
        r.right <= 0 ||
        r.bottom <= 0;
      const inText = (el: Element) => {
        const p = el.closest('p');
        return el.tagName === 'A' && p !== null && (p.textContent ?? '').trim().length > (el.textContent ?? '').trim().length;
      };
      const descrie = (el: Element) => {
        const controlDeFormular = ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
        const text = controlDeFormular ? '' : (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30);
        const nume = el.getAttribute('name') ?? el.getAttribute('type') ?? '';
        return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}${nume ? `[${nume}]` : ''}${text ? ` „${text}”` : ''}`;
      };
      const mici: string[] = [];
      for (const el of new Set(document.querySelectorAll(selectori.join(',')))) {
        const r = el.getBoundingClientRect();
        if (ascuns(el, r) || inText(el)) continue;
        if (r.width + 0.1 < minim || r.height + 0.1 < minim) mici.push(`${descrie(el)} ${Math.round(r.width * 10) / 10}×${Math.round(r.height * 10) / 10}`);
      }
      return mici;
    },
    { selectori: ZONE_DE_ATINGERE, minim: ATINGERE_MIN },
  );
}

/** Octeții necomprimați de CSS ai paginii: fiecare `<link rel="stylesheet">` (cum îl primește browserul, decomprimat) plus fiecare `<style>`. */
export async function cssPePagina(page: Page): Promise<number> {
  const { linkuri, inline } = await page.evaluate(() => ({
    linkuri: [...document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]')].map((l) => l.href),
    inline: [...document.querySelectorAll('style')].map((s) => s.textContent ?? ''),
  }));
  let octeti = inline.reduce((suma, text) => suma + Buffer.byteLength(text, 'utf8'), 0);
  for (const href of linkuri) {
    const raspuns = await page.request.get(href);
    if (!raspuns.ok()) throw new Error(`cssPePagina: ${href} a răspuns ${raspuns.status()}`);
    octeti += (await raspuns.body()).length;
  }
  return octeti;
}

// ——— Acasă (Task 11) ———

/**
 * Numele elementelor care primesc focusul la Tab, în ordine, de la începutul paginii până când focusul se întoarce
 * la primul element (sau după `maxim` pași). Numele e `aria-label` sau textul, fără spații în plus.
 */
export async function ordineFocus(page: Page, maxim = 80): Promise<string[]> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const nume: string[] = [];
  let primul: string | undefined;
  for (let i = 0; i < maxim; i++) {
    await page.keyboard.press('Tab');
    const curent = await page.evaluate(() => {
      const el = document.activeElement;
      if (el === null || el === document.body) return undefined;
      const text = el.getAttribute('aria-label') ?? el.textContent ?? '';
      return { id: `${el.tagName}|${el.getAttribute('href') ?? ''}|${text}`, text: text.trim().replace(/\s+/g, ' ') };
    });
    if (curent === undefined || curent.id === primul) break;
    primul ??= curent.id;
    nume.push(curent.text);
  }
  return nume;
}

/** `true` dacă vreun tren de pe harta animată își schimbă poziția pe ecran în `ms` milisecunde. */
export async function trenuriInMiscare(page: Page, ms = 400): Promise<boolean> {
  const pozitii = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.harta--animata .tren')]
        .filter((t) => t.getBoundingClientRect().width > 0)
        .map((t) => {
          const r = t.getBoundingClientRect();
          return `${Math.round(r.x)},${Math.round(r.y)}`;
        }),
    );
  const inainte = await pozitii();
  await page.waitForTimeout(ms);
  const dupa = await pozitii();
  return inainte.length > 0 && inainte.some((p, i) => p !== dupa[i]);
}

/**
 * `true` dacă două dintre elementele vizibile găsite de `selectori` se suprapun (dreptunghiurile se intersectează cu mai
 * mult de 1px). Un element nu se compară cu el însuși și nici cu propriii părinți sau copii.
 */
export async function seSuprapun(page: Page, selectori: readonly string[]): Promise<boolean> {
  return page.evaluate((lista) => {
    const elemente = [...new Set(lista.flatMap((s) => [...document.querySelectorAll(s)]))].filter((el) =>
      el.checkVisibility({ checkVisibilityCSS: true }),
    );
    const cutii = elemente.map((el) => ({ el, r: el.getBoundingClientRect() })).filter(({ r }) => r.width > 0 && r.height > 0);
    for (const [i, a] of cutii.entries()) {
      for (const b of cutii.slice(i + 1)) {
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const peLatime = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const peInaltime = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (peLatime > 1 && peInaltime > 1) return true;
      }
    }
    return false;
  }, selectori);
}
