// Paginile interioare pe telefon (spec metroul îmbunătățit, §5). Sub 48rem, banda mare cu harta se ascunde, iar firimiturile
// devin linia de metrou: o fâșie întunecată, cu câte o stație pe pas și pagina curentă ca stație mare. De la 48rem în sus,
// banda și firimiturile rămân ca până acum, iar trenurile benzii pornesc doar de la 48rem (ultimele teste). Între ele, 404 și
// linia ei cu cele cinci pagini din meniu, la 320px (§6).
import type { Page } from '@playwright/test';
import { expect, faraDerulareOrizontala, test, textMarit, trenuriInMiscare, zoneAtingereMici } from './helpers';

const TELEFON = { width: 375, height: 667 };
const FIRIMITURI = 'nav[aria-label="Firimituri"]';

/** Fiecare pas din firimituri (link sau pagina curentă): poziția, lățimea și câte rânduri ocupă eticheta. */
async function pasi(page: Page) {
  return page.evaluate((selector) => {
    return [...document.querySelectorAll(`${selector} li > *`)].map((el) => {
      const r = el.getBoundingClientRect();
      const text = document.createRange();
      text.selectNodeContents(el);
      const randuri = new Set([...text.getClientRects()].map((c) => Math.round(c.top))).size;
      return { text: (el.textContent ?? '').trim(), stanga: r.left, dreapta: r.right, latime: r.width, randuri, link: el.tagName === 'A' };
    });
  }, FIRIMITURI);
}

/** Etichetele scurte rămân întregi pe un rând, linkurile au cel puțin 44px lățime, iar pașii vecini nu se suprapun și nu se ating. */
function pasiNeatinsi(lista: Awaited<ReturnType<typeof pasi>>) {
  const scurte = lista.slice(0, -1);
  expect(scurte.map((p) => `${p.text}: ${p.randuri} rând(uri)`)).toEqual(scurte.map((p) => `${p.text}: 1 rând(uri)`));
  expect(lista.filter((p) => p.link && p.latime < 43.9).map((p) => `${p.text} ${p.latime}px`)).toEqual([]);
  // Nici suprapuse, nici lipite: între doi pași vecini rămân cel puțin 3px (coloana dintre stații e de 0,25rem).
  const lipite = lista.flatMap((p, i) => (i > 0 && lista[i - 1]!.dreapta > p.stanga - 3 ? [`${lista[i - 1]!.text} / ${p.text}`] : []));
  expect(lipite).toEqual([]);
}

test('/servicii/seo/: banda e ascunsă, firimiturile sunt linia, H1-ul se termină sub 300px', async ({ page }) => {
  await page.setViewportSize(TELEFON);
  await page.goto('/servicii/seo/');
  await expect(page.locator('.banda')).toBeHidden();
  await expect(page.locator(`${FIRIMITURI} ol`)).toHaveClass(/(^|\s)linie-statii(\s|$)/);
  const h1 = (await page.locator('h1').boundingBox())!;
  expect(h1.y + h1.height).toBeLessThanOrEqual(300);
});

test('/servicii/seo/: stația curentă e „SEO”, linkurile au 44px', async ({ page }) => {
  await page.setViewportSize(TELEFON);
  await page.goto('/servicii/seo/');
  await expect(page.locator(`${FIRIMITURI} [aria-current="page"]`)).toHaveText('SEO');
  expect(await zoneAtingereMici(page)).toEqual([]);
});

test('/despre/: linia e gri (fără grup)', async ({ page }) => {
  await page.setViewportSize(TELEFON);
  await page.goto('/despre/');
  // --noapte-text-2 (#A7B0BE). Linia e pe ::before al listei, nu pe un element de sine stătător.
  const culoare = await page.locator(`${FIRIMITURI} ol`).evaluate((ol) => getComputedStyle(ol, '::before').backgroundColor);
  expect(culoare).toBe('rgb(167, 176, 190)');
});

test('/servicii/seo/: linia ia albastrul deschis al grupului, pe fundal întunecat', async ({ page }) => {
  await page.setViewportSize(TELEFON);
  await page.goto('/servicii/seo/');
  // --blue-light (#6B9BF0): varianta deschisă din subsol, nu `--culoare` din tokens.css, care n-ar avea 3:1 pe `--noapte`.
  const ol = page.locator(`${FIRIMITURI} ol`);
  expect(await ol.evaluate((el) => getComputedStyle(el, '::before').backgroundColor)).toBe('rgb(107, 155, 240)');
  expect(await ol.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(14, 17, 22)');
});

// Un ultim pas lung (titlul unui ghid, de pildă „Ce este GEO și prin ce diferă de SEO și AEO” sub Acasă / Ghiduri) se rupe
// el, la cuvinte; stațiile scurte își păstrează lățimea naturală. Niciun ghid nu e în build-ul de producție, așa că condiția
// se pune pe /servicii/seo/, schimbând textul ultimelor doi pași înainte de măsurare.
for (const latime of [375, 320]) {
  test(`${latime}px, ultimul pas lung: etichetele scurte rămân pe un rând, fără suprapuneri`, async ({ page }) => {
    await page.setViewportSize({ width: latime, height: 667 });
    await page.goto('/servicii/seo/');
    await page.evaluate((selector) => {
      const [, mijloc, ultimul] = document.querySelectorAll(`${selector} li > *`);
      mijloc!.textContent = 'Ghiduri';
      ultimul!.textContent = 'Ce este GEO și prin ce diferă de SEO și AEO';
    }, FIRIMITURI);
    const lista = await pasi(page);
    expect(lista).toHaveLength(3);
    // Fără asta testul n-ar dovedi nimic: eticheta lungă trebuie să se rupă pe mai multe rânduri.
    expect(lista[2]!.randuri).toBeGreaterThan(1);
    pasiNeatinsi(lista);
    expect(await faraDerulareOrizontala(page)).toBe(true);
  });
}

test('la 768px, banda și firimiturile ca azi', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/servicii/seo/');
  await expect(page.locator('.banda')).toBeVisible();
  const ol = page.locator(`${FIRIMITURI} ol`);
  await expect(ol).toHaveClass(/(^|\s)linie-statii(\s|$)/);
  // Fâșia întunecată e doar sub 48rem, iar fundalul și marginile ei negative stau pe `ol`, nu pe `nav`.
  expect(await ol.evaluate((el) => ({ fond: getComputedStyle(el).backgroundColor, marginaStanga: getComputedStyle(el).marginLeft }))).toEqual({
    fond: 'rgba(0, 0, 0, 0)',
    marginaStanga: '0px',
  });
  // Structura liniei nu se scurge peste prag: fără linia de pe ::before și fără stații, pașii pe rând, cu „/” între ei.
  expect(await ol.evaluate((el) => getComputedStyle(el, '::before').content)).toBe('none');
  expect(await ol.evaluate((el) => ({ flexWrap: getComputedStyle(el).flexWrap, columnGap: getComputedStyle(el).columnGap }))).toEqual({ flexWrap: 'wrap', columnGap: '0px' });
  const [primul, curent] = await ol.locator('li > *').evaluateAll((elemente) =>
    [elemente[0]!, elemente[elemente.length - 1]!].map((el) => {
      const stil = getComputedStyle(el);
      return { directie: stil.flexDirection, aliniere: stil.textAlign, statie: getComputedStyle(el, '::before').content, culoare: stil.color };
    }),
  );
  expect(primul).toEqual({ directie: 'row', aliniere: 'start', statie: 'none', culoare: 'rgb(26, 79, 184)' });
  expect(curent).toMatchObject({ directie: 'row', aliniere: 'start', statie: 'none', culoare: 'rgb(20, 22, 26)' });
  expect(await ol.locator('li').first().evaluate((li) => getComputedStyle(li).flexGrow)).toBe('0');
  expect(await ol.locator('li').first().evaluate((li) => getComputedStyle(li, '::after').content)).toContain('/');
});

test('text la 200%, 320px: fără derulare orizontală pe /servicii/optimizare-aeo-geo/', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/servicii/optimizare-aeo-geo/');
  await textMarit(page);
  expect(await faraDerulareOrizontala(page)).toBe(true);
  // Doar ultimul pas, lung, se rupe (și la mijlocul cuvântului, dacă n-are încotro); „Servicii” și „Acasă” rămân întregi.
  pasiNeatinsi(await pasi(page));
});

// ——— 404: linia cu cele cinci pagini din meniu, în cerneală (§6) ———
// Cloudflare servește 404-ul pentru orice adresă inexistentă (`not_found_handling: "404-page"`), deci testele merg pe o adresă care nu există.

const ADRESA_INEXISTENTA = '/aceasta-pagina-nu-exista/';
const STATII_404 = '.linie-statii--cerneala a';

/** Casetele celor cinci stații din 404: poziția, mărimea și câte rânduri ocupă eticheta (cu cel mult un rând pe cuvânt, nu se rupe în mijlocul lui). */
async function statii404(page: Page) {
  return page.evaluate((selector) => {
    return [...document.querySelectorAll(selector)].map((a) => {
      const r = a.getBoundingClientRect();
      const text = document.createRange();
      text.selectNodeContents(a);
      const randuri = new Set([...text.getClientRects()].map((c) => Math.round(c.top))).size;
      const cuvinte = (a.textContent ?? '').trim().split(/\s+/).length;
      // Punctul din colțul stâng de sus al zonei de atingere: tot linkul trebuie să primească atingerea, nu desenul stației „?” de deasupra.
      const sus = document.elementFromPoint(r.left + 3, r.top + 3);
      return {
        text: (a.textContent ?? '').trim(),
        stanga: r.left,
        dreapta: r.right,
        sus: r.top,
        latime: r.width,
        inaltime: r.height,
        randuri,
        cuvinte,
        atingereaCadeLaLink: sus !== null && a.contains(sus),
      };
    });
  }, STATII_404);
}

test('404 la 320px: fără derulare orizontală, linkuri de 44px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const raspuns = await page.goto(ADRESA_INEXISTENTA);
  expect(raspuns?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Pagina nu există');
  await expect(page.locator('.linie-statii--cerneala')).toHaveClass(/(^|\s)linie-statii(\s|$)/);
  await expect(page.locator(STATII_404)).toHaveText(['Acasă', 'Servicii', 'Cum lucrez', 'Despre', 'Contact']);
  expect(await faraDerulareOrizontala(page)).toBe(true);

  const lista = await statii404(page);
  expect(lista).toHaveLength(5);
  // Zone de atingere de cel puțin 44×44px, toate pe același rând (linia nu se rupe în două).
  expect(lista.filter((s) => s.latime < 43.9 || s.inaltime < 43.9).map((s) => `${s.text} ${Math.round(s.latime)}×${Math.round(s.inaltime)}`)).toEqual([]);
  expect(new Set(lista.map((s) => Math.round(s.sus))).size).toBe(1);
  // Eticheta se rupe cel mult între cuvinte: un rând pe cuvânt, niciodată în mijlocul unui cuvânt.
  expect(lista.filter((s) => s.randuri > s.cuvinte).map((s) => `${s.text}: ${s.randuri} rânduri`)).toEqual([]);
  // Nici suprapuse, nici lipite (coloana dintre stații e de 0,25rem), și toate în ecran.
  expect(lista.flatMap((s, i) => (i > 0 && lista[i - 1]!.dreapta > s.stanga - 3 ? [`${lista[i - 1]!.text} / ${s.text}`] : []))).toEqual([]);
  expect(lista.filter((s) => s.stanga < 0 || s.dreapta > 320).map((s) => s.text)).toEqual([]);
  // Stația ruptă, de decor, nu ia atingerea de pe Acasă și nu intră în ordinea focusului.
  expect(lista.filter((s) => !s.atingereaCadeLaLink).map((s) => s.text)).toEqual([]);
  const decor = page.locator('main svg[aria-hidden="true"]');
  await expect(decor).toHaveCount(1);
  await expect(decor).toHaveCSS('pointer-events', 'none');
  expect(await decor.evaluate((svg) => ({ focus: svg.getAttribute('tabindex'), tinte: svg.querySelectorAll('a, [tabindex]').length }))).toEqual({ focus: null, tinte: 0 });
});

/**
 * Unde se oprește conectorul punctat al stației rupte (capătul traseului, în coordonatele ferestrei) față de capătul stâng al
 * liniei: centrul liniei e la 1rem de sus (linie-statii.css), iar capătul ei stâng e marginea listei.
 */
async function conector404(page: Page) {
  return page.evaluate(() => {
    const conector = document.querySelector<SVGPathElement>('main svg[aria-hidden="true"] .negasit__conector')!;
    const capat = conector.getPointAtLength(conector.getTotalLength());
    const punct = new DOMPoint(capat.x, capat.y).matrixTransform(conector.getScreenCTM()!);
    const lista = document.querySelector('.linie-statii--cerneala')!.getBoundingClientRect();
    return { x: punct.x, y: punct.y, listaStanga: lista.left, listaSus: lista.top, rem: parseFloat(getComputedStyle(document.documentElement).fontSize) };
  });
}

test('404: stația ruptă se leagă punctat de capătul liniei, fără să iasă din ecran, nici la 320px cu text la 200%', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(ADRESA_INEXISTENTA);
  const decor = (await page.locator('main svg[aria-hidden="true"]').boundingBox())!;
  const lista = (await page.locator('.linie-statii--cerneala').boundingBox())!;
  // Desenul stă deasupra liniei, în marginile paginii.
  expect(decor.y).toBeLessThan(lista.y);
  expect(decor.x).toBeGreaterThanOrEqual(0);
  // Testul fixează capătul geometric al traseului: centrul liniei (la 1rem de sus) și capătul ei stâng (la 0,125rem de margine, adică
  // jumătate din grosimea de 4px a liniei). Punctele se desenează din 7 în 7 de la începutul traseului, deci ultimul punct vizibil
  // poate sta mai sus de capăt; aici nu se măsoară unde cade el. Rămâne așa și când textul se mărește (desenul se măsoară în rem).
  for (const marire of [false, true]) {
    if (marire) await textMarit(page);
    const c = await conector404(page);
    expect(Math.abs(c.y - (c.listaSus + c.rem)), `capătul conectorului pe verticală (rem ${c.rem}px)`).toBeLessThanOrEqual(1);
    expect(Math.abs(c.x - (c.listaStanga + 0.125 * c.rem)), `capătul conectorului pe orizontală (rem ${c.rem}px)`).toBeLessThanOrEqual(1);
  }
  expect(await faraDerulareOrizontala(page)).toBe(true);
  const mari = await statii404(page);
  expect(mari.filter((s) => s.latime < 43.9 || s.inaltime < 43.9).map((s) => s.text)).toEqual([]);
  expect(mari.filter((s) => s.stanga < 0 || s.dreapta > 320).map((s) => s.text)).toEqual([]);
});

// Linia trece prin fiecare rând de stații: când textul mărit nu mai lasă cele cinci stații pe un rând, ele trec pe rânduri noi, iar
// fiecare rând are linia lui, de la un capăt la altul (nu doar primul). Segmentul de linie stă pe `li::before`, ca să urmeze stațiile.

/** Rândurile de stații din 404 și segmentul de linie al fiecărui `li` (`li::before`), cum le calculează browserul. */
async function linie404(page: Page) {
  return page.evaluate(() => {
    const lista = document.querySelector('.linie-statii--cerneala')!;
    const l = lista.getBoundingClientRect();
    const randuri = new Map<
      number,
      { text: string; stanga: number; dreapta: number; segmentStanga: number; segmentDreapta: number; latimeSegment: number; continut: string; pozitie: string; sus: string; inaltime: string; fond: string }[]
    >();
    for (const li of lista.querySelectorAll('li')) {
      const r = li.getBoundingClientRect();
      const segment = getComputedStyle(li, '::before');
      const rand = randuri.get(Math.round(r.top)) ?? [];
      rand.push({
        text: (li.textContent ?? '').trim(),
        stanga: r.left,
        dreapta: r.right,
        // Unde stă segmentul: din `left` și `width` calculate (pentru un element absolut, valorile folosite, în px) plus caseta `li`-ului.
        latimeSegment: parseFloat(segment.width),
        segmentStanga: r.left + parseFloat(segment.left),
        segmentDreapta: r.left + parseFloat(segment.left) + parseFloat(segment.width),
        continut: segment.content,
        pozitie: segment.position,
        sus: segment.top,
        inaltime: segment.height,
        fond: segment.backgroundColor,
      });
      randuri.set(Math.round(r.top), rand);
    }
    return {
      stanga: l.left,
      dreapta: l.right,
      liniaListei: getComputedStyle(lista, '::before').content,
      rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
      randuri: [...randuri.values()],
    };
  });
}

/**
 * Ce nu e în regulă cu linia, rând cu rând. Gol = fiecare rând are linia lui de 4px în cerneală, cu segmente care acoperă fiecare `li`, fără goluri
 * între stații, de la marginea listei la cealaltă. Segmentele ies 0,5px peste `li`, ca să nu rămână cusături la scalare fracționară.
 */
function probleme404(linie: Awaited<ReturnType<typeof linie404>>): string[] {
  const probleme: string[] = [];
  // Linia nu mai e pe listă (ar trece doar pe primul rând), ci pe fiecare stație.
  if (linie.liniaListei !== 'none') probleme.push(`lista are încă linia ei pe ::before (${linie.liniaListei})`);
  linie.randuri.forEach((rand, i) => {
    for (const s of rand) {
      // Centrul liniei, la 1rem de sus, ca în linie-statii.css: acolo stau centrele stațiilor.
      const asteptat = `absolut 4px rgb(20, 22, 26) sus ${linie.rem - 2}px`;
      const gasit = `${s.pozitie === 'absolute' && s.continut !== 'none' ? 'absolut' : `${s.pozitie}/${s.continut}`} ${s.inaltime} ${s.fond} sus ${parseFloat(s.sus)}px`;
      if (gasit !== asteptat) probleme.push(`rândul ${i + 1}, „${s.text}”: ${gasit} (se aștepta ${asteptat})`);
    }
    // Segmentul acoperă tot `li`-ul (nu un segment de 0px care trece neobservat). Condiția e scrisă negat, ca o valoare lipsă (NaN) să pice.
    for (const s of rand) {
      if (!(s.latimeSegment >= s.dreapta - s.stanga - 0.01)) probleme.push(`rândul ${i + 1}, „${s.text}”: segmentul are ${s.latimeSegment}px, mai puțin decât stația (${s.dreapta - s.stanga}px)`);
      if (!(s.segmentStanga <= s.stanga + 0.01 && s.segmentDreapta >= s.dreapta - 0.01)) {
        probleme.push(`rândul ${i + 1}, „${s.text}”: segmentul (${s.segmentStanga}–${s.segmentDreapta}) nu acoperă stația (${s.stanga}–${s.dreapta})`);
      }
    }
    const primul = rand[0]!;
    const ultimul = rand[rand.length - 1]!;
    if (Math.abs(primul.stanga - linie.stanga) > 0.5) probleme.push(`rândul ${i + 1} nu pornește de la marginea stângă a listei`);
    if (Math.abs(ultimul.dreapta - linie.dreapta) > 0.5) probleme.push(`rândul ${i + 1} nu ajunge la marginea dreaptă a listei`);
    rand.slice(1).forEach((s, j) => {
      if (Math.abs(s.stanga - rand[j]!.dreapta) > 0.5) probleme.push(`rândul ${i + 1}: gol între „${rand[j]!.text}” și „${s.text}”`);
      // Segmentele vecine se suprapun cu cel puțin 0,5px (nu doar se ating): fără asta, la scalare fracționară rămâne o cusătură mai deschisă.
      if (!(rand[j]!.segmentDreapta - s.segmentStanga >= 0.5)) probleme.push(`rândul ${i + 1}: segmentele „${rand[j]!.text}” și „${s.text}” nu se suprapun`);
    });
  });
  return probleme;
}

/** Textul mărit cu `procent`, ca din setarea browserului (ca `textMarit`, dar nu doar la 200%). */
async function marestePanaLa(page: Page, procent: number) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate((p) => {
    document.documentElement.style.fontSize = `${p}%`;
  }, procent);
}

test('404 la 320px cu text la 200%: fiecare rând de stații are linia lui', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(ADRESA_INEXISTENTA);
  await textMarit(page);
  const linie = await linie404(page);
  // Fără asta testul n-ar dovedi nimic: la 200% stațiile trebuie să treacă pe mai multe rânduri.
  expect(linie.randuri.length).toBeGreaterThan(1);
  expect(probleme404(linie)).toEqual([]);
  expect(await faraDerulareOrizontala(page)).toBe(true);
});

for (const [latime, procent] of [
  [320, 100],
  [412, 150],
  [1280, 100],
] as const) {
  test(`404 la ${latime}px cu text la ${procent}%: linia trece prin toate stațiile, pe orice număr de rânduri`, async ({ page }) => {
    await page.setViewportSize({ width: latime, height: 800 });
    await page.goto(ADRESA_INEXISTENTA);
    await marestePanaLa(page, procent);
    const linie = await linie404(page);
    expect(linie.randuri.length).toBeGreaterThanOrEqual(1);
    expect(linie.randuri.flat()).toHaveLength(5);
    expect(probleme404(linie)).toEqual([]);
    expect(await faraDerulareOrizontala(page)).toBe(true);
    if (procent === 100) expect(linie.randuri).toHaveLength(1);
    // Pe ecran lat, lista se oprește la 36rem (nu se întinde pe tot containerul), iar linia umple toată lista.
    if (latime === 1280) expect(Math.abs(linie.dreapta - linie.stanga - 36 * linie.rem)).toBeLessThanOrEqual(0.5);
  });
}

// ——— Contrast ridicat (forced colors): linia nu dispare ———
// Cu culorile forțate, `background` devine Canvas și o linie desenată doar cu `background` s-ar topi în pagină. Regulile
// `@media (forced-colors: active)` din linie-statii.css și 404.astro o pun pe CanvasText. Testul nu fixează paleta sistemului
// (Canvas și CanvasText depind de emulare): cere doar ca linia să aibă culoare și să fie alta decât fundalul paginii.

/** Fundalul unui pseudo-element al primului element găsit de `selector` și fundalul paginii (Canvas, cu culorile forțate). */
async function fundalPseudo(page: Page, selector: string, pseudo: '::before' | '::after') {
  return page.locator(selector).first().evaluate(
    (el, p) => ({ pseudo: getComputedStyle(el, p).backgroundColor, imagine: getComputedStyle(el, p).backgroundImage, pagina: getComputedStyle(document.body).backgroundColor }),
    pseudo,
  );
}

test.describe('culorile forțate (contrast ridicat)', () => {
  test.use({ forcedColors: 'active' });

  test('/servicii/seo/ la 375px: linia firimiturilor și stația curentă sunt pictate', async ({ page }) => {
    await page.setViewportSize(TELEFON);
    await page.goto('/servicii/seo/');
    const linie = await fundalPseudo(page, `${FIRIMITURI} ol`, '::before');
    expect(linie.imagine).toBe('none');
    expect(linie.pseudo).not.toBe('rgba(0, 0, 0, 0)');
    expect(linie.pseudo, 'linia are culoarea fundalului paginii (Canvas): nu se vede').not.toBe(linie.pagina);
    const curenta = await fundalPseudo(page, `${FIRIMITURI} [aria-current="page"]`, '::before');
    expect(curenta.pseudo, 'stația curentă are culoarea fundalului paginii (Canvas): nu se vede').not.toBe(curenta.pagina);
  });

  test('404 la 320px: segmentele liniei sunt pictate', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(ADRESA_INEXISTENTA);
    const segment = await fundalPseudo(page, '.linie-statii--cerneala li', '::before');
    expect(segment.imagine).toBe('none');
    expect(segment.pseudo).not.toBe('rgba(0, 0, 0, 0)');
    expect(segment.pseudo, 'segmentul are culoarea fundalului paginii (Canvas): nu se vede').not.toBe(segment.pagina);
  });
});

// ——— Trenurile benzii pornesc doar de la 48rem (§5) ———
// Banda ascunsă cu `display: none` are trenuri cu lățime 0, deci `trenuriInMiscare` singură n-ar prinde un script care le ține
// pornite pe nevăzute. De aceea testele întreabă și scriptul: dacă a pornit SMIL (`getStartTime()` aruncă până la primul
// `beginElement()`), dacă a pus clasa trenurilor și dacă butonul a rămas cu atributul `hidden`.

/** Starea scriptului de trenuri pe banda de sus: ce a pornit, nu doar ce se vede. */
async function stareBanda(page: Page) {
  return page.evaluate(() => {
    const harta = document.querySelector('.harta--banda')!;
    const svg = harta.querySelector('svg')!;
    const pornit = (tren: Element) => {
      try {
        (tren as SVGAnimationElement).getStartTime();
        return true;
      } catch {
        return false;
      }
    };
    return {
      clasaTrenuri: harta.classList.contains('trenuri-pornite'),
      butonAscuns: harta.querySelector('.harta__buton')!.hasAttribute('hidden'),
      trenuriPornite: [...svg.querySelectorAll('animateMotion')].filter(pornit).length,
      trenuriTotal: svg.querySelectorAll('animateMotion').length,
      inPauza: svg.animationsPaused(),
    };
  });
}

test('375px, /servicii/seo/: trenurile benzii nu pornesc', async ({ page }) => {
  await page.setViewportSize(TELEFON);
  await page.goto('/servicii/seo/');
  await page.waitForTimeout(1000);
  expect(await trenuriInMiscare(page)).toBe(false);
  await expect(page.locator('.harta--banda .harta__buton')).toBeHidden();
  // Scriptul n-a făcut nimic: butonul rămâne `hidden`, trenurile fără clasă de pornire și nicio animație SMIL începută.
  const stare = await stareBanda(page);
  expect(stare.trenuriTotal).toBeGreaterThan(0);
  expect(stare).toMatchObject({ clasaTrenuri: false, butonAscuns: true, trenuriPornite: 0 });
});

test('375px, Acasă: trenurile hărții de pe Acasă merg ca azi', async ({ page }) => {
  await page.setViewportSize(TELEFON);
  await page.goto('/');
  await expect.poll(() => trenuriInMiscare(page)).toBe(true);
  await expect(page.getByRole('button', { name: 'Oprește trenurile' })).toBeVisible();
});

test('tableta rotită: de la 375 la 800px trenurile pornesc, înapoi la 375 se opresc', async ({ page }) => {
  await page.setViewportSize(TELEFON);
  await page.goto('/servicii/seo/');
  expect(await trenuriInMiscare(page)).toBe(false);
  expect(await stareBanda(page)).toMatchObject({ clasaTrenuri: false, butonAscuns: true, trenuriPornite: 0 });

  // Peste prag: butonul apare, trenurile pornesc (o singură dată) și merg.
  await page.setViewportSize({ width: 800, height: 1024 });
  await expect(page.getByRole('button', { name: 'Oprește trenurile' })).toBeVisible();
  await expect.poll(() => trenuriInMiscare(page)).toBe(true);
  const pornita = await stareBanda(page);
  expect(pornita).toMatchObject({ clasaTrenuri: true, butonAscuns: false, inPauza: false });
  expect(pornita.trenuriPornite).toBe(pornita.trenuriTotal);

  // Înapoi sub prag: butonul se ascunde, iar trenurile stau pe loc, nu merg pe nevăzute.
  await page.setViewportSize(TELEFON);
  await expect(page.locator('.harta--banda .harta__buton')).toBeHidden();
  await expect.poll(async () => (await stareBanda(page)).inPauza).toBe(true);
  expect(await stareBanda(page)).toMatchObject({ butonAscuns: true });
  expect(await trenuriInMiscare(page)).toBe(false);

  // Și din nou peste prag: trenurile se repornesc, tot cu butonul vizibil.
  await page.setViewportSize({ width: 800, height: 1024 });
  await expect(page.getByRole('button', { name: 'Oprește trenurile' })).toBeVisible();
  await expect.poll(() => trenuriInMiscare(page)).toBe(true);
  expect(await stareBanda(page)).toMatchObject({ butonAscuns: false, inPauza: false });
});

test('tableta rotită: alegerea vizitatorului de a opri trenurile rămâne după ce ecranul trece pragul', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1024 });
  await page.goto('/servicii/seo/');
  await page.getByRole('button', { name: 'Oprește trenurile' }).click();
  await page.setViewportSize(TELEFON);
  await expect(page.locator('.harta--banda .harta__buton')).toBeHidden();
  await page.setViewportSize({ width: 800, height: 1024 });
  await expect(page.getByRole('button', { name: 'Pornește trenurile' })).toBeVisible();
  expect(await trenuriInMiscare(page)).toBe(false);
  expect(await stareBanda(page)).toMatchObject({ inPauza: true });
});

test('„reduced motion” cerut sub prag: lărgirea ecranului nu pornește trenurile și nu aduce butonul înapoi', async ({ page }) => {
  await page.setViewportSize(TELEFON);
  await page.goto('/servicii/seo/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 800, height: 1024 });
  await expect(page.locator('.banda')).toBeVisible();
  await expect(page.getByRole('button', { name: /trenurile/ })).toBeHidden();
  expect(await trenuriInMiscare(page)).toBe(false);
  expect(await stareBanda(page)).toMatchObject({ clasaTrenuri: false, butonAscuns: true, trenuriPornite: 0 });
});
