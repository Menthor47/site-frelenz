// Acasă (§4.3, §5.6, §5.7, Task 11; alegătorul din hero: spec metroul îmbunătățit, §3). Rulează pe build-ul de producție, ca
// vizitatorul: marcajele nu se văd, iar Proiecte lipsește cât nu există niciun proiect publicabil.
import type { Locator, Page } from '@playwright/test';
import { axe, elementeCareDepasesc, expect, faraDerulareOrizontala, ordineFocus, seSuprapun, test, textMarit, trenuriInMiscare } from './helpers';

const LINII = ['M1', 'M2', 'M3', 'M4'] as const;

/** Cele șase opțiuni ale alegătorului, în ordine: eticheta din tabelul de texte (§8), serviciul și linia grupului (M1 construcție, M2 vizibilitate, M3 reparație, M4 diagnostic). */
const OPTIUNI = [
  { slug: 'seo', eticheta: 'Nu mă găsesc clienții în Google', nume: 'SEO', linie: 'M2' },
  { slug: 'optimizare-aeo-geo', eticheta: 'Nu apar când întreabă cineva ChatGPT', nume: 'Optimizare AEO și GEO', linie: 'M2' },
  { slug: 'audit-seo', eticheta: 'Au scăzut vizitele și nu știu de ce', nume: 'Audit SEO', linie: 'M4' },
  { slug: 'creare-site', eticheta: 'N-am încă un site', nume: 'Creare site', linie: 'M1' },
  { slug: 'redesign-site', eticheta: 'Site-ul arată învechit', nume: 'Redesign site', linie: 'M3' },
  { slug: 'mentenanta-site', eticheta: 'Site-ul e lent și neactualizat', nume: 'Mentenanță site', linie: 'M3' },
] as const;

const optiune = (page: Page, eticheta: string): Locator => page.getByRole('radio', { name: eticheta });
const panou = (page: Page, slug: string): Locator => page.locator(`.alegator__panou[data-serviciu="${slug}"]`);
const linie = (page: Page, m: string): Locator => page.locator(`.harta--animata .harta__linie[data-linie="${m}"]`);
const aici = (page: Page, m: string): Locator => page.locator(`.harta--animata .harta__aici-grup[data-linie="${m}"]`);
const tren = (page: Page, m: string): Locator => page.locator(`.harta--animata .tren[data-linie="${m}"]`);

/** Trenurile au pornit (scriptul a pus clasa), deci `.tren` are cutie unde nu e ascuns din CSS. */
const trenurilePornesc = (page: Page) => expect(page.locator('.harta--animata')).toHaveClass(/trenuri-pornite/);

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
  // Butonul din hero: în `.acasa-sus` sunt și butoanele panourilor alegătorului, deci se caută în locul lui.
  const buton = await sus.locator('.acasa-sus__buton .buton-cta').boundingBox();
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
  await expect(page.locator('main .alegator input[type="radio"]')).toHaveCount(6);
  await expect(page.locator('main .alegator label')).toHaveText(OPTIUNI.map((o) => o.eticheta));
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
  await expect.poll(() => trenuriInMiscare(page)).toBe(true);
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

// Alegătorul din hero (opțiunile pe coloane, panoul „Traseul tău”) ar putea împinge pagina cu text mărit; panoul se verifică
// mai jos, după alegere.
for (const latime of [320, 768]) {
  test(`text mărit la 200%, pe ${latime}px: fără derulare orizontală`, async ({ page }) => {
    await page.setViewportSize({ width: latime, height: 900 });
    await page.goto('/');
    await textMarit(page);
    const fara = await faraDerulareOrizontala(page);
    expect(fara, fara ? '' : (await elementeCareDepasesc(page)).join('; ')).toBe(true);
  });
}

// Câte opțiuni încap pe un rând depinde de lățimea formularului, nu a ecranului (container query în AlegatorTraseu): una sub
// 19rem, două până la 36rem, trei de la 36rem.
for (const [latime, pePrimulRand] of [[320, 1], [375, 2], [768, 3]] as const) {
  test(`la ${latime}px, opțiunile din „De unde pornești?” stau ${pePrimulRand} pe rând`, async ({ page }) => {
    await page.setViewportSize({ width: latime, height: 900 });
    await page.goto('/');
    const sus = await page.locator('.alegator__optiune').evaluateAll((e) => e.map((o) => Math.round(o.getBoundingClientRect().top)));
    expect(sus).toHaveLength(6);
    expect(sus.filter((y) => y === sus[0])).toHaveLength(pePrimulRand);
  });
}

// M3 (§5.7, ruling R5): linia din panoul „Traseul tău” al serviciului ales și banda paginii de serviciu au același
// `view-transition-name`; pe Acasă, la un moment dat, numele îl poartă un singur element randat.
test('linia din panoul ales și banda serviciului au același nume de tranziție', async ({ page }) => {
  await page.goto('/');
  const numeTranzitie = (selector: string) => page.locator(selector).evaluate((el) => getComputedStyle(el).viewTransitionName);
  // Elementele randate cu un nume `segment-…` (rădăcina are numele ei, `root`, din foaia de stil a browserului).
  const cuNume = () =>
    page.evaluate(() => [...document.querySelectorAll('*')].filter((el) => el.checkVisibility() && getComputedStyle(el).viewTransitionName.startsWith('segment-')).length);
  expect(await cuNume()).toBe(0);
  await optiune(page, 'Nu mă găsesc clienții în Google').check();
  await expect(panou(page, 'seo')).toBeVisible();
  expect(await numeTranzitie('.alegator__panou[data-serviciu="seo"] .alegator__linie.vt-seo')).toBe('segment-seo');
  expect(await cuNume()).toBe(1);
  await page.goto('/servicii/seo/');
  expect(await numeTranzitie('.banda.vt-seo')).toBe('segment-seo');
});

test('favicon-ul e stația plină albastră (§5.4)', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href');
  expect(href).toBe('/favicon.svg');
  const raspuns = await page.request.get(href!);
  expect(raspuns.ok()).toBe(true);
  expect(await raspuns.text()).toContain('#2D6CDF');
});

// Iconițele PNG se generează la build (auditul din 2026-10-24, SEO-02): fiecare iconiță din <head> trebuie să existe, cu
// tipul declarat (iconița Apple n-are `type`; e PNG).
test('fiecare iconiță din <head> se servește, cu tipul declarat', async ({ page }) => {
  await page.goto('/');
  const iconite = await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((linkuri) => linkuri.map((l) => ({ href: l.getAttribute('href') ?? '', tip: l.getAttribute('type') ?? 'image/png' })));
  expect(iconite.map((i) => i.href).sort()).toEqual(['/apple-touch-icon.png', '/favicon-96.png', '/favicon.svg']);
  for (const { href, tip } of iconite) {
    const raspuns = await page.request.get(href);
    expect(raspuns.status(), href).toBe(200);
    expect(raspuns.headers()['content-type'], href).toContain(tip);
  }
});

// §5.3: textul de citit are cel mult ~70 de caractere pe rând (34em). Răspunsurile din întrebările frecvente sunt `dd`,
// iar până la typeset ajungeau la ~100–115 caractere pe desktop.
test('la 1440px, răspunsurile din întrebările frecvente nu trec de măsura de citit (34em)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const latimi = await page.locator('.faq dd').evaluateAll((dd) =>
    dd.map((e) => e.getBoundingClientRect().width / Number.parseFloat(getComputedStyle(e).fontSize)),
  );
  expect(latimi.length).toBeGreaterThan(0);
  for (const em of latimi) expect(em).toBeLessThanOrEqual(34.01);
});

// §5.3: cuvintele cu cratimă din textele colecțiilor nu se rup la capăt de rând (FaraRupere.astro).
test('cuvintele cu cratimă din „De unde pornești?” stau întregi pe un rând', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const intregi = page.locator('.alegator__nume .fara-rupere');
  expect(await intregi.count()).toBeGreaterThan(0);
  // Un bloc în rând are un singur dreptunghi; dacă s-ar rupe la cratimă, ar avea înălțimea a două rânduri.
  const randuri = await intregi.evaluateAll((s) => s.map((e) => e.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(e).lineHeight)));
  for (const r of randuri) expect(r).toBeLessThan(1.5);
});

// ——— Alegătorul din hero (spec metroul îmbunătățit, §3): stările vin doar din CSS (`:has()` sub `@supports`) ———

// Spec §3: harta de pe Acasă are câte un „Ești aici” pe fiecare linie, în HTML, dar ascuns din CSS până alege vizitatorul. Testele
// unitare văd doar marcajul și regula de CSS, deci aici se verifică pe pagina randată că, înainte de alegere, niciun marcaj nu se
// vede, liniile sunt toate pline (nicio linie nu e estompată) și panourile sunt ascunse.
test('înainte de orice alegere, niciun „Ești aici” nu se vede, liniile sunt pline și panourile ascunse', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('input[name="serviciu"]:checked')).toHaveCount(0);
  await expect(page.locator('.harta--animata .harta__aici-grup')).toHaveCount(4);
  for (const m of LINII) {
    await expect(aici(page, m)).toBeHidden();
    await expect(linie(page, m)).toHaveCSS('opacity', '1');
  }
  for (const o of OPTIUNI) await expect(panou(page, o.slug)).toBeHidden();
});

test('alegerea aprinde linia ei și le estompează pe celelalte', async ({ page }) => {
  await page.goto('/');
  await optiune(page, 'Site-ul arată învechit').check();
  for (const m of LINII) {
    await expect(linie(page, m)).toHaveCSS('opacity', m === 'M3' ? '1' : '0.35');
    if (m === 'M3') await expect(aici(page, m)).toBeVisible();
    else await expect(aici(page, m)).toBeHidden();
  }
  // Altă alegere mută lumina pe linia ei, pe loc.
  await optiune(page, 'N-am încă un site').check();
  for (const m of LINII) {
    await expect(linie(page, m)).toHaveCSS('opacity', m === 'M1' ? '1' : '0.35');
    if (m === 'M1') await expect(aici(page, m)).toBeVisible();
    else await expect(aici(page, m)).toBeHidden();
  }
});

test('se vede doar panoul serviciului ales, cu butonul spre /contact/?serviciu=redesign-site', async ({ page }) => {
  await page.goto('/');
  await optiune(page, 'Site-ul arată învechit').check();
  await expect(panou(page, 'redesign-site')).toBeVisible();
  await expect(page.locator('.alegator__panou').filter({ visible: true })).toHaveCount(1);
  for (const o of OPTIUNI.filter((x) => x.slug !== 'redesign-site')) await expect(panou(page, o.slug)).toBeHidden();
  const ales = panou(page, 'redesign-site');
  await expect(ales.getByRole('heading', { name: 'Traseul tău: Redesign site' })).toBeVisible();
  expect(await ales.locator('li').count()).toBeGreaterThan(0);
  // Panoul cu butonul lui înlocuiește butonul general.
  await expect(page.locator('.alegator__trimite-general')).toBeHidden();
  await ales.getByRole('button', { name: 'Cere oferta pentru Redesign site' }).click();
  await expect(page).toHaveURL(/\/contact\/\?serviciu=redesign-site$/);
});

test('merge doar trenul liniei alese', async ({ page }) => {
  await page.goto('/');
  await trenurilePornesc(page);
  for (const m of LINII) await expect(tren(page, m)).toBeVisible();
  await optiune(page, 'Site-ul arată învechit').check();
  await expect(tren(page, 'M3')).toBeVisible();
  for (const m of LINII.filter((x) => x !== 'M3')) await expect(tren(page, m)).toBeHidden();
  await expect.poll(() => trenuriInMiscare(page)).toBe(true);
});

test('tastatura: săgețile schimbă alegerea', async ({ page }) => {
  await page.goto('/');
  const prima = optiune(page, OPTIUNI[0].eticheta);
  await prima.check();
  // Clicul pe un radio nu-i dă focus în WebKit (ca în Safari): focusul se dă explicit, ca la o intrare cu Tab.
  await prima.focus();
  await expect(panou(page, 'seo')).toBeVisible();
  // Radio-uri native, în aceeași grupă: săgeata în jos alege următoarea, în sus pe cea de dinainte.
  await page.keyboard.press('ArrowDown');
  await expect(optiune(page, OPTIUNI[1].eticheta)).toBeChecked();
  await expect(panou(page, 'optimizare-aeo-geo')).toBeVisible();
  await expect(panou(page, 'seo')).toBeHidden();
  await page.keyboard.press('ArrowDown');
  await expect(optiune(page, OPTIUNI[2].eticheta)).toBeChecked();
  await expect(panou(page, 'audit-seo')).toBeVisible();
  await expect(panou(page, 'optimizare-aeo-geo')).toBeHidden();
  // Audit SEO e pe M4: lumina trece de pe M2 pe M4, odată cu alegerea.
  await expect(linie(page, 'M4')).toHaveCSS('opacity', '1');
  await expect(linie(page, 'M2')).toHaveCSS('opacity', '0.35');
  await expect(aici(page, 'M4')).toBeVisible();
  await page.keyboard.press('ArrowUp');
  await expect(optiune(page, OPTIUNI[1].eticheta)).toBeChecked();
  await expect(panou(page, 'optimizare-aeo-geo')).toBeVisible();
  await expect(linie(page, 'M2')).toHaveCSS('opacity', '1');
});

// Spec §3: alegerea nu stă în niciun script, ci în radio-ul ales dintr-un formular GET. La „Înapoi” din pagina serviciului browserul
// restaurează starea formularului (radio-ul bifat), iar `:has()` redesenează panoul și harta: vizitatorul se întoarce la ce alesese.
test('Înapoi din pagina serviciului păstrează alegerea și panoul ei', async ({ page }) => {
  await page.goto('/');
  await optiune(page, 'Site-ul arată învechit').check();
  await page.getByRole('link', { name: 'Vezi pagina Redesign site' }).click();
  await expect(page).toHaveURL(/\/servicii\/redesign-site\/$/);
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(optiune(page, 'Site-ul arată învechit')).toBeChecked();
  await expect(panou(page, 'redesign-site')).toBeVisible();
  for (const o of OPTIUNI.filter((x) => x.slug !== 'redesign-site')) await expect(panou(page, o.slug)).toBeHidden();
});

test('375×667: butonul Cere o ofertă se termină deasupra pliului; linia M1 aleasă se vede pe telefon', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const buton = (await page.locator('.acasa-sus__buton .buton-cta').boundingBox())!;
  expect(buton.y + buton.height).toBeLessThanOrEqual(667);
  await trenurilePornesc(page);
  // Fără alegere, sub 640px harta păstrează doar M2 și M3.
  for (const m of ['M1', 'M4']) {
    await expect(linie(page, m)).toBeHidden();
    await expect(tren(page, m)).toBeHidden();
  }
  await optiune(page, 'N-am încă un site').check();
  // Linia aleasă, marcajul ei și trenul ei se văd; M4 rămâne ascunsă, iar M2 și M3 se estompează.
  await expect(linie(page, 'M1')).toBeVisible();
  await expect(linie(page, 'M1')).toHaveCSS('opacity', '1');
  await expect(aici(page, 'M1')).toBeVisible();
  await expect(tren(page, 'M1')).toBeVisible();
  for (const m of ['M2', 'M3']) await expect(linie(page, m)).toHaveCSS('opacity', '0.35');
  await expect(linie(page, 'M4')).toBeHidden();
  await expect(tren(page, 'M4')).toBeHidden();
  await expect(aici(page, 'M4')).toBeHidden();
  // Desenul se taie la margini (`slice`): linia aleasă și marcajul ei trebuie să încapă în fereastra hărții.
  const desen = (await page.locator('.harta--animata svg').boundingBox())!;
  const m1 = (await linie(page, 'M1').boundingBox())!;
  expect(m1.x).toBeLessThan(desen.x + desen.width);
  expect(m1.x + m1.width).toBeGreaterThan(desen.x);
  const marcaj = (await aici(page, 'M1').boundingBox())!;
  expect(marcaj.x).toBeGreaterThanOrEqual(desen.x - 0.5);
  expect(marcaj.x + marcaj.width).toBeLessThanOrEqual(desen.x + desen.width + 0.5);
});

// Spec §3: „Ești aici” stă pe stațiile din src/lib/harta.ts, aceleași ca pe bandă și în imaginile OG. Pe telefon (sub 48rem)
// plăcuța H1 acoperă partea de jos a hărții, deci metro.css mută marcajul pe altă stație a liniei sau îi mută eticheta. Locul
// plăcuței depinde de butonul „Oprește trenurile”, care stă deasupra hărții cât merg trenurile și lipsește cu „reduced motion”
// (plăcuța coboară atunci cu 52px față de hartă): se măsoară ambele așezări. Marcajul (cercul și eticheta) trebuie să stea
// în afara plăcuței, în ecran și în partea vizibilă a desenului (`slice` taie marginile), pe o stație a liniei lui.
for (const latime of [320, 375, 600]) {
  for (const miscare of ['no-preference', 'reduce'] as const) {
    const asezare = miscare === 'reduce' ? 'fără butonul de oprire (reduced motion)' : 'cu butonul de oprire deasupra hărții';
    test(`${latime}px, ${asezare}: „Ești aici” al liniei alese nu e sub plăcuța H1, stă pe o stație și în partea vizibilă a hărții`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: latime, height: 800 }, reducedMotion: miscare });
      const p = await context.newPage();
      await p.goto('/');
      if (miscare === 'no-preference') await expect(p.getByRole('button', { name: 'Oprește trenurile' })).toBeVisible();
      else await expect(p.getByRole('button', { name: /trenurile/ })).toBeHidden();
      const toate: string[] = [];
      for (const o of OPTIUNI) {
        await optiune(p, o.eticheta).check();
        await expect(aici(p, o.linie)).toBeVisible();
        const probleme = await p.evaluate((m) => {
          const cutie = (el: Element) => el.getBoundingClientRect();
          const placuta = cutie(document.querySelector('h1')!);
          const desen = cutie(document.querySelector('.harta--animata svg')!);
          const ecran = document.documentElement.clientWidth;
          const grup = document.querySelector(`.harta--animata .harta__aici-grup[data-linie="${m}"]`)!;
          const cerc = cutie(grup.querySelector('.harta__aici')!);
          const eticheta = cutie(grup.querySelector('.harta__eticheta')!);
          // Jumătate din conturul cercului (5 unități) și din haloul etichetei (6 unități) la scara de 0,6 a desenului: 2px.
          const margine = 2;
          const rezultat: string[] = [];
          for (const [nume, c] of [['cercul', cerc], ['eticheta', eticheta]] as const) {
            if (c.left - margine < placuta.right && c.right + margine > placuta.left && c.top - margine < placuta.bottom && c.bottom + margine > placuta.top) {
              rezultat.push(`${nume} se atinge de plăcuță`);
            }
            if (c.left < Math.max(0, desen.left) - 0.5 || c.right > Math.min(ecran, desen.right) + 0.5) rezultat.push(`${nume} iese din partea vizibilă pe orizontală`);
            // Firefox dă textului tot câmpul rândului (cu ~5px mai înalt decât Chrome și WebKit, în sus peste literele mari), deci
            // eticheta primește 1,5px de toleranță pe verticală; literele rămân în desen.
            const toleranta = nume === 'eticheta' ? 1.5 : 0.5;
            if (c.top < desen.top - toleranta || c.bottom > desen.bottom + toleranta) rezultat.push(`${nume} iese din desen pe verticală`);
          }
          const centru = (r: DOMRect) => [r.left + r.width / 2, r.top + r.height / 2] as const;
          const [cx, cy] = centru(cerc);
          const peStatie = [...document.querySelectorAll(`.harta--animata .harta__linie[data-linie="${m}"] .harta__statie`)].some((s) => {
            const [sx, sy] = centru(cutie(s));
            return Math.abs(sx - cx) < 1 && Math.abs(sy - cy) < 1;
          });
          if (!peStatie) rezultat.push('cercul nu stă pe o stație a liniei lui');
          return rezultat;
        }, o.linie);
        toate.push(...probleme.map((pb) => `${o.slug} (${o.linie}): ${pb}`));
      }
      // Toate opțiunile se verifică înainte de aserțiune, ca un eșec să arate fiecare linie care are problema.
      expect(toate).toEqual([]);
      await context.close();
    });
  }
}

test('reduced motion: fără trenuri, alegerea merge', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const p = await context.newPage();
  await p.goto('/');
  await expect(p.locator('.trenuri')).toBeHidden();
  await optiune(p, 'Site-ul arată învechit').check();
  await expect(p.locator('.trenuri')).toBeHidden();
  await expect(tren(p, 'M3')).toBeHidden();
  await expect(linie(p, 'M3')).toHaveCSS('opacity', '1');
  await expect(linie(p, 'M1')).toHaveCSS('opacity', '0.35');
  await expect(aici(p, 'M3')).toBeVisible();
  await expect(panou(p, 'redesign-site')).toBeVisible();
  await context.close();
});

test('fără JavaScript: alegerea merge, doar din CSS', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const p = await context.newPage();
  await p.goto('/');
  await optiune(p, 'Site-ul arată învechit').click();
  await expect(panou(p, 'redesign-site')).toBeVisible();
  await expect(linie(p, 'M3')).toHaveCSS('opacity', '1');
  await expect(linie(p, 'M2')).toHaveCSS('opacity', '0.35');
  await expect(aici(p, 'M3')).toBeVisible();
  await context.close();
});

/** Cuvintele din textul unui element care se rup între rânduri (un cuvânt rupt are cutii pe două rânduri). Gol = niciunul. */
async function cuvinteRupte(element: Locator): Promise<string[]> {
  return element.evaluate((el) => {
    const rupte: string[] = [];
    const parcurgere = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let nod = parcurgere.nextNode(); nod; nod = parcurgere.nextNode()) {
      const text = nod.textContent ?? '';
      for (const cuvant of text.matchAll(/\S+/g)) {
        const zona = document.createRange();
        zona.setStart(nod, cuvant.index);
        zona.setEnd(nod, cuvant.index + cuvant[0].length);
        if (new Set([...zona.getClientRects()].map((c) => Math.round(c.top))).size > 1) rupte.push(cuvant[0]);
      }
    }
    return rupte;
  });
}

// WCAG 1.4.4 și 1.4.10 (§5.8): cu textul la 200% pe 320px, nici opțiunile, nici panoul „Traseul tău” al niciunui serviciu nu ies
// din formular sau din pagină (butonul și linkul din panou au nume lungi: „Optimizare AEO și GEO”, „Mentenanță site”). Și nu
// le rup în litere: într-un container îngust, panoul și butonul își strâng padding-ul lateral (AlegatorTraseu.astro), ca cel mai
// lung cuvânt să încapă întreg. Un ecran și mai îngust ar rupe cuvântul ca ultimă soluție (`overflow-wrap`), dar la 320px încape.
test('text la 200%, 320px: alegătorul nu derulează orizontal, iar butonul și linkul din panou nu rup cuvinte', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await textMarit(page);
  for (const o of OPTIUNI) {
    await optiune(page, o.eticheta).check();
    await expect(panou(page, o.slug)).toBeVisible();
    const fara = await faraDerulareOrizontala(page);
    expect(fara, fara ? '' : `${o.slug}: ${(await elementeCareDepasesc(page)).join('; ')}`).toBe(true);
    expect(await page.locator('.alegator').evaluate((f) => f.scrollWidth > f.clientWidth), `${o.slug}: formularul se derulează`).toBe(false);
    expect(await cuvinteRupte(panou(page, o.slug).locator('.buton-cta')), `${o.slug}: cuvinte rupte în buton`).toEqual([]);
    expect(await cuvinteRupte(panou(page, o.slug).locator('.alegator__vezi')), `${o.slug}: cuvinte rupte în link`).toEqual([]);
  }
});

// Pe telefon, după o atingere `:hover` rămâne pe ultima opțiune atinsă (hover „lipicios”): fundalul de hover ar părea o a doua
// alegere. De aceea regula de hover e doar în `@media (hover: hover)` (AlegatorTraseu.astro). `hasTouch` face ca interogarea
// `(hover: none)` să se potrivească în toate cele trei motoare; cu mouse-ul, aceeași opțiune are fundalul de hover.
test('hover-ul opțiunii se aplică doar cu mouse, nu și pe un ecran tactil', async ({ page, browser }) => {
  const fundal = (p: Page) => optiune(p, 'N-am încă un site').evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.goto('/');
  await optiune(page, 'N-am încă un site').hover();
  expect(await fundal(page), 'cu mouse').toBe('rgb(42, 49, 60)');

  const context = await browser.newContext({ hasTouch: true });
  const tactil = await context.newPage();
  await tactil.goto('/');
  expect(await tactil.evaluate(() => matchMedia('(hover: none)').matches), 'emularea tactilă a pornit').toBe(true);
  await optiune(tactil, 'N-am încă un site').hover();
  expect(await fundal(tactil), 'pe ecran tactil').toBe('rgba(0, 0, 0, 0)');
  await context.close();
});

// Fără `:has()` formularul rămâne un formular simplu. Browserele de azi îl au, deci regulile din `@supports selector(:has(*))`
// se scot din CSSOM (CSP-ul blochează stilurile inline, CSSOM-ul nu): pagina arată cum ar arăta fără `:has()`.
test('cu :has() presupus lipsă: butonul general e în pagină', async ({ page }) => {
  await page.goto('/');
  const general = page.locator('.alegator__trimite-general');
  await expect(general).toHaveCount(1);
  const scoase = await page.evaluate(() => {
    let n = 0;
    for (const foaie of document.styleSheets) {
      for (let i = foaie.cssRules.length - 1; i >= 0; i--) {
        const regula = foaie.cssRules[i];
        if (regula instanceof CSSSupportsRule && /:has\(/.test(regula.conditionText)) {
          foaie.deleteRule(i);
          n++;
        }
      }
    }
    return n;
  });
  expect(scoase, 'regulile din @supports selector(:has(*))').toBeGreaterThan(0);
  await expect(general).toBeVisible();
  expect((await general.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await optiune(page, 'Site-ul arată învechit').check();
  for (const o of OPTIUNI) await expect(panou(page, o.slug)).toBeHidden();
  for (const m of LINII) {
    await expect(linie(page, m)).toHaveCSS('opacity', '1');
    await expect(aici(page, m)).toBeHidden();
  }
  // Alegerea se vede și așa: chenarul de 2px al opțiunii. Iar butonul general trimite serviciul ales.
  await expect(optiune(page, 'Site-ul arată învechit')).toHaveCSS('border-top-width', '2px');
  await general.click();
  await expect(page).toHaveURL(/\/contact\/\?serviciu=redesign-site$/);
});

// Spec §3: cu `:has()` butonul general „Cere o ofertă” dispare (`display: none`) și rămân doar butoanele din panouri. Butonul ascuns
// rămâne butonul implicit al formularului (primul submit din document), deci Enter pe un radio, adică trimiterea implicită, tot
// trimite alegerea spre `/contact/?serviciu=<slug>`, ca pentru cine nu folosește mouse-ul.
test('Enter pe o opțiune trimite formularul cu serviciul ales, deși butonul general e ascuns', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.alegator__trimite-general')).toBeHidden();
  const ales = optiune(page, 'N-am încă un site');
  await ales.check();
  await ales.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/contact\/\?serviciu=creare-site$/);
});

// Alegerea nu stă doar în culoare (§5.2): chenarul crește la 2px și ia culoarea liniei ei (aceeași ca pe hartă).
test('opțiunea aleasă are chenar de 2px în culoarea liniei ei; celelalte, de 1px', async ({ page }) => {
  await page.goto('/');
  const stilul = (l: Locator) => l.evaluate((el) => ({ latime: getComputedStyle(el).borderTopWidth, culoare: getComputedStyle(el).borderTopColor }));
  for (const o of OPTIUNI) {
    expect((await stilul(optiune(page, o.eticheta))).latime, `${o.slug} înainte de alegere`).toBe('1px');
  }
  for (const o of OPTIUNI) {
    await optiune(page, o.eticheta).check();
    const culoareaLiniei = await page.locator(`.harta--animata .harta__linie[data-linie="${o.linie}"] .harta__traseu`).evaluate((p) => getComputedStyle(p).stroke);
    expect(await stilul(optiune(page, o.eticheta)), o.slug).toEqual({ latime: '2px', culoare: culoareaLiniei });
    for (const altele of OPTIUNI.filter((x) => x.slug !== o.slug)) expect((await stilul(optiune(page, altele.eticheta))).latime, `${altele.slug} cât e ales ${o.slug}`).toBe('1px');
  }
});

test('axe: fără încălcări, nici după ce vizitatorul alege', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(await axe(page), 'înainte de alegere').toEqual([]);
  await optiune(page, 'Site-ul arată învechit').check();
  await expect(panou(page, 'redesign-site')).toBeVisible();
  expect(await axe(page), 'după alegere').toEqual([]);
});
