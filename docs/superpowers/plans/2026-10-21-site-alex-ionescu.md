# Site-ul Alex Ionescu: plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site static de prezentare pentru Alex Ionescu (Astro 7, Cloudflare Workers), construit și verificat pagină cu pagină, gata de publicare când Alex are domeniul.

**Architecture:**
- Astro generează static tot site-ul din colecții Markdown și din `src/site.config.ts`.
- Un singur Cloudflare Worker tratează `POST /api/contact` și trimite e-mailul prin Email Routing.
- Există două build-uri: producție (`dist/`, fără marcaje) și previzualizare (`dist-draft/`, cu toate paginile și marcajele vizibile).
- Calitatea se verifică pe fiecare pagină cu un singur pas comun, `npm run qa:page`.

**Tech Stack:** Astro 7.4.x, TypeScript, Cloudflare Workers + wrangler, vitest (+ `@cloudflare/vitest-pool-workers`), Playwright + `@axe-core/playwright`, Lighthouse 13, linkinator, html-validate, satori + `@resvg/resvg-js`, mimetext, fontkit, cross-env.

**Spec:** `docs/superpowers/specs/2026-10-21-site-alex-ionescu-design.md` (commit `9c63f84`). Fiecare task presupune că implementatorul are și specificația deschisă. Referințele „§x.y” trimit acolo.

## Global Constraints

**Platformă și domeniu**
- Node 24 LTS: `.node-version` = `24`, `engines.node` = `>=24 <25`.
- Astro 7.4.x, output static, fără adaptor. Versiunile se fixează exact (fără `^`) la Task 1.
- Domeniul provizoriu e `https://site-provizoriu.example`, scris **doar** în `src/site.config.ts`. Poate fi suprascris prin variabila `SITE_URL`, dar numai pentru QA local.
- Nimic nu se publică, nu se cumpără și nu se creează conturi. `npm run deploy` se rulează doar după un „da” explicit de la Alex (§11).

**Limbă și text**
- Text în română, cu ș și ț cu virgulă. Build-ul cade la U+015E, U+015F, U+0162 sau U+0163 (§5.3).
- Vizitatorul e numit cu „tu”, iar Alex vorbește la persoana I. Fără „dumneavoastră”.
- Lanțul de verbe: „Cere o ofertă” → „Trimite cererea” → „Am primit cererea ta” (§8).
- Nimic inventat (testimoniale, clienți, cifre, durate) și fără promisiuni de rezultat. Unde lipsește o informație, se pune marcajul `[DE COMPLETAT:#<nr>]`, cu numărul rândului din registrul §12.
- Textul „[DE COMPLETAT” nu apare niciodată în `dist/` (§2 #17).

**Performanță**
- Zero cookie-uri, zero scripturi terțe, zero cereri spre alte domenii.
- JavaScript: ~1 KB pe Acasă, sub 1 KB pe `/proiecte/acest-site/`, 0 KB în rest. Excepție: `<script type="application/ld+json">`.
- CSS: cel mult 25 KB pe pagină. Pagina Acasă: sub 150 KB transferați, măsurat în producție.
- Fonturi: doar Atkinson Hyperlegible Next, variabil 400–800, cu subseturile `latin` și `latin-ext`, fără italic.

**Design și accesibilitate**
- Culorile și regulile de contrast din §5.2. Pe albastru, doar text alb. Grafica galbenă cu sens folosește `#8A5A00`.
- Colțuri de 0 peste tot, cu excepția stațiilor, a capetelor de linie (`stroke-linecap: round`) și a marcajului „Ești aici”. Fără umbre, fără carduri, fără etichete cu majuscule.
- Lighthouse pe mobil: cel puțin 90 la cele 4 categorii, cu excepțiile pentru paginile noindex (§1). WCAG 2.1 AA. Zona de atingere: 44×44px (§5.8).

**CSP**
- Interzise: `<script is:inline>` (în afară de JSON-LD), `define:vars`, atributele `style="…"` și handler-ele `on…` (§3.6).

**Git**
- Commit la fiecare task. Fără push.
- Fiecare mesaj de commit se încheie cu `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Ecran îngust de 320px**, cu cuvinte românești lungi („întreținere site WordPress”, titlul paginii AEO/GEO). Niciun element nu iese din pagină, deci nu apare derulare orizontală. Testul e în Task 7 (`qa:page`) și rulează pe fiecare pagină.
2. **Telefon setat pe temă întunecată.** Pagina și câmpurile din formular rămân luminoase și lizibile (`color-scheme: light`). Testul e în Task 3.
3. **Navigare de la tastatură pe Acasă.** Butonul „Oprește trenurile” vine în ordinea de focus după „Cere o ofertă”, niciodată înainte. Testul e în Task 11.
4. **Butonul Înapoi** după `/contact/prea-multe-linkuri/` readuce textul scris în Mesaj (Chromium). Testul e în Task 14.
5. **Text mărit la 200%**, la 320px: H1-ul, butonul „Cere o ofertă” și butonul de oprire nu se suprapun. Testul e în Task 11.

---

### Task 1: Proiectul Astro și cele două build-uri

**Files:**
- Create: `package.json`, `.node-version`, `.gitignore`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/env.d.ts`, `src/lib/env.ts`, `src/pages/index.astro` (temporar), `tests/unit/env.test.ts`

**Interfaces:**
- Produces:
  - `DRAFT: boolean` din `src/lib/env.ts`, care citește `__DRAFT__`, definit prin `vite.define` din `process.env.DRAFT === '1'`;
  - scripturile npm `dev`, `build`, `preview:draft`, `test:unit`.

- [ ] **Step 1:** Instalează pachetele și fixează versiunile exacte:
  - Rulează `npm view <pachet> version` pentru `astro`, `@astrojs/sitemap`, `@astrojs/check`, `typescript`, `vitest`, `cross-env`.
  - Scrie valorile exacte în `package.json`, fără `^`.
  - Verifică în documentația versiunii instalate numele exacte pentru Fonts API, `security.csp` și `astro/container`. Dacă sunt încă sub `experimental`, folosește cheile `experimental.*` și notează asta în README la Task 20.
- [ ] **Step 2:** Scrie `astro.config.mjs`:
  - `output: 'static'`;
  - `site` citit din `src/site.config.ts` (pus la Task 2; până atunci, valoarea provizorie);
  - `outDir: process.env.DRAFT === '1' ? './dist-draft' : './dist'`;
  - `compressHTML: true`;
  - `trailingSlash: 'always'`;
  - `vite.define.__DRAFT__ = JSON.stringify(process.env.DRAFT === '1')`;
  - `security.csp` activat, fără niciun alt domeniu.

  Scripturile:
  - `"build": "astro build"`;
  - `"preview:draft": "cross-env DRAFT=1 astro build"`;
  - `"test:unit": "vitest run"`.

  `vitest.config.ts` folosește `getViteConfig` din `astro/config`. În `.gitignore` intră `dist/`, `dist-draft/`, `reports/`, `.wrangler/` și `node_modules/`.
- [ ] **Step 3: Scrie testul care pică:**
  ```ts
  // tests/unit/env.test.ts
  import { DRAFT } from '../../src/lib/env';
  test('build-ul implicit nu e draft', () => { expect(DRAFT).toBe(false); });
  ```
- [ ] **Step 4:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL, pentru că modulul nu există.
- [ ] **Step 5:** Creează `src/lib/env.ts` (`export const DRAFT: boolean = __DRAFT__;`) și declarația din `src/env.d.ts`. Rulează `npm run test:unit`. Rezultat așteptat: PASS.
- [ ] **Step 6: Verifică cele două build-uri:**
  - `npm run build` trebuie să creeze `dist/index.html`;
  - `npm run preview:draft` trebuie să creeze `dist-draft/index.html`;
  - `.node-version` trebuie să conțină `24`.
- [ ] **Step 7:** Commit: `chore: proiect Astro, build de producție și de previzualizare`.

---

### Task 2: Configurarea site-ului, registrul și marcajele

**Files:**
- Create:
  - `src/site.config.ts`, `src/placeholders.ts`, `src/lib/marker.ts`, `src/components/Placeholder.astro`;
  - `scripts/report-placeholders.mjs`;
  - testele `tests/unit/marker.test.ts`, `tests/unit/site-config.test.ts`.

**Interfaces:**
- Produces:
  - `site` din `src/site.config.ts`:
    - `url` (`process.env.SITE_URL ?? 'https://site-provizoriu.example'`);
    - `nume = 'Alex Ionescu'`, `logoScurt = 'consultant SEO'`;
    - `descriere = 'Alex Ionescu – consultant SEO și web design, București'`;
    - `email` (`contact@` + numele de domeniu din `url`). Adresa de destinație a formularului nu stă aici, ci în `form-rules.ts` (Task 4), pentru că o folosește și Worker-ul;
    - `telefonAfisat = '0724 230 051'`, `telefonE164 = '+40724230051'`, `whatsapp = 'https://wa.me/40724230051'`;
    - `oras = 'București'`;
    - `pfa: { denumire, nrRegCom, cui, sediu }`, toate cu valoarea `'[DE COMPLETAT:#1]'`, iar `sediu` cu `'[DE COMPLETAT:#2]'`;
    - `profiluri: string[] = []`.
  - `REGISTRU: Record<number, { ce: string; cine: string; blocheaza: boolean }>` din `src/placeholders.ts`: cele 20 de rânduri din §12, cu `blocheaza: true` exact pentru #1, #2, #3, #4, #13, #15 și #17.
  - Din `src/lib/marker.ts`:
    - `parseMarker(v: string): number | null`;
    - `hasMarker(v: string): boolean`;
    - `renderMarker(nr: number, draft: boolean): string`, care întoarce `''` când `draft` e fals.
  - `<Placeholder nr={n} />`, care afișează `renderMarker(nr, DRAFT)`.
  - `node scripts/report-placeholders.mjs`, care scrie `reports/placeholders.json` sub forma `[{ fisier, nr, blocheaza }]`. Scanează `src/**/*.{md,ts,astro}`, fără `src/placeholders.ts`.

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  test('parseMarker', () => {
    expect(parseMarker('[DE COMPLETAT:#4]')).toBe(4);
    expect(parseMarker('text normal')).toBeNull();
  });
  test('renderMarker în producție e gol', () => {
    expect(renderMarker(4, false)).toBe('');
    expect(renderMarker(4, true)).toContain('[DE COMPLETAT:#4]');
    expect(renderMarker(4, true)).toContain(REGISTRU[4].ce);
  });
  test('registrul are 20 de rânduri și 7 blocante', () => {
    expect(Object.keys(REGISTRU)).toHaveLength(20);
    expect(Object.entries(REGISTRU).filter(([, r]) => r.blocheaza).map(([n]) => +n))
      .toEqual([1, 2, 3, 4, 13, 15, 17]);
  });
  test('e-mailul public vine din domeniu', () => {
    expect(site.email).toBe('contact@site-provizoriu.example');
  });
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3:** Implementează modulele de mai sus.
  - `renderMarker` întoarce un `<mark class="marcaj">[DE COMPLETAT:#n] — <ce></mark>`.
  - `report-placeholders.mjs` caută expresia `/\[DE COMPLETAT:#(\d+)\]/g`.
  - Adaugă scriptul `"report:placeholders"`.
- [ ] **Step 4:** Rulează `npm run test:unit && npm run report:placeholders`. Rezultat așteptat: PASS. `reports/placeholders.json` conține #1 și #2 din `site.config.ts`.
- [ ] **Step 5:** Commit: `feat: configurarea site-ului, registrul și marcajele`.

---

### Task 3: Tokenuri, font și layoutul de bază

**Files:**
- Create:
  - `src/styles/tokens.css`, `src/styles/base.css`, `src/layouts/Base.astro`;
  - `scripts/check-cedilla.mjs`, `scripts/check-font-glyphs.mjs`;
  - `src/pages/_test/diacritice.astro` (doar în draft);
  - testele `tests/unit/contrast.test.ts`, `tests/unit/cedilla.test.ts`, `tests/e2e/dark-mode.spec.ts`, plus `playwright.config.ts`.
- Modify: `astro.config.mjs` (fonturile), `package.json`

**Interfaces:**
- Produces:
  - variabilele CSS din §5.2, cu exact aceleași nume și valori;
  - `--font-sans`;
  - `Base.astro`, cu props `{ titlu: string; descriere: string; cale: string; aprobat: boolean; noindex?: boolean }`. Randează `<html lang="ro">`, `color-scheme: light`, linkul de salt „Sari la conținut” și `<main id="continut">`;
  - din `scripts/check-cedilla.mjs`: `findCedilla(text: string): number[]`, cu indexurile caracterelor U+015E, U+015F, U+0162 și U+0163.

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  // contrast.test.ts — citește tokens.css și calculează contrastul WCAG
  test.each([
    ['--paper', '--blue', 4.5], ['--ink', '--green', 4.5], ['--ink', '--yellow', 4.5],
    ['--ink', '--red', 4.5], ['--blue-dark', '--paper', 4.5], ['--green-dark', '--paper', 4.5],
    ['--yellow-dark', '--paper', 4.5], ['--red-dark', '--paper', 4.5],
    ['--yellow-dark', '--tint-blue', 3], ['--field-border', '--paper', 3],
  ])('%s pe %s ≥ %s', (fg, bg, min) => expect(ratio(tok(fg), tok(bg))).toBeGreaterThanOrEqual(min));
  test('negru pe albastru e sub 4,5 (interdicția din §5.2 e reală)', () =>
    expect(ratio(tok('--ink'), tok('--blue'))).toBeLessThan(4.5));
  // cedilla.test.ts
  test('găsește sedilele', () => expect(findCedilla('aş ţ ș ț')).toEqual([1, 3]));
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3:** Scrie `tokens.css` cu valorile din §5.2 și `base.css`:
  - scara tipografică din §5.3: 18px la 1,6; H1 `clamp(2.25rem, 5vw, 3.5rem)` la greutatea 800;
  - focusul din §5.2 (`outline` de 2px plus `box-shadow 0 0 0 4px #fff`);
  - linkurile subliniate;
  - `border-radius: 0` global.

  Configurează fontul (furnizor Fontsource, `Atkinson Hyperlegible Next`, `weights: ['400 800']`, `styles: ['normal']`, `subsets: ['latin','latin-ext']`) și preîncarcă-l în `Base.astro`.
- [ ] **Step 4:** Scrie cele două scripturi de verificare:
  - `check-cedilla.mjs` parcurge `dist/**/*.{html,txt,xml}` și `src/**/*` și iese cu cod 1 la prima sedilă găsită.
  - `check-font-glyphs.mjs` deschide fiecare `.woff2` din `dist/_astro` cu fontkit și iese cu cod 1 dacă vreun fișier `latin-ext` nu are U+0218–U+021B.

  Adaugă scriptul `"check": "node scripts/check-cedilla.mjs && node scripts/check-font-glyphs.mjs"`. Pagina `_test/diacritice` afișează „ȘȚĂÂÎ șțăâî „citat”” la greutățile 400, 700 și 800. În producție, `getStaticPaths` o exclude, deci se construiește doar cu `DRAFT`.
- [ ] **Step 5: Scrie testul e2e care pică.** `playwright.config.ts` pornește `webServer`: `npx wrangler dev --port 8787`, cu `SITE_URL=http://localhost:8787`, după `npm run build`. Până la Task 13 folosește `npx astro preview --port 8787`.
  ```ts
  test('tema întunecată a telefonului nu întunecă pagina', async ({ browser }) => {
    const p = await (await browser.newContext({ colorScheme: 'dark' })).newPage();
    await p.goto('/');
    expect(await p.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 255, 255)');
  });
  ```
- [ ] **Step 6:** Rulează `npm run test:unit && npm run build && npm run check && npx playwright test dark-mode`. Rezultat așteptat: PASS. `dist/` nu conține `_test/`, iar `dist-draft/` îl conține.
- [ ] **Step 7:** Commit: `feat: tokenuri, font Atkinson, layout de bază și verificări pentru diacritice`.

---

### Task 4: Modelul de conținut (colecții, reguli de publicare, formular, aprobări)

**Files:**
- Create: `src/form-rules.ts`, `src/content.config.ts`, `src/lib/publish.ts`, `src/approvals.ts`, `tests/unit/publish.test.ts`, `tests/unit/form-rules.test.ts`

**Interfaces:**
- Produces:
  - Din `src/form-rules.ts`:
    - `Grup = 'vizibilitate' | 'diagnostic' | 'constructie' | 'reparatie'`. Valorile din cod sunt ASCII, iar numele afișate au diacritice;
    - `SERVICII`, un array de `{ slug, nume, grup, ordine }` cu cele 6 servicii, în ordinea: `seo` (vizibilitate, 1), `optimizare-aeo-geo` (vizibilitate, 2), `audit-seo` (diagnostic, 3), `creare-site` (constructie, 4), `redesign-site` (reparatie, 5), `mentenanta-site` (reparatie, 6);
    - `DESTINATAR = 'idealserv51@gmail.com'`;
    - `CAMPURI`, cu regulile din tabelul §3.5: `nume` 100, `email` 254 + `type:'email'`, `telefon` 30, `firma` 120, `site` 200, `mesaj` 3000 + `maxLinkuri: 3`, `serviciu` cu valorile `SERVICII` + `'nu-stiu'`;
    - `CAPCANA = 'confirmare_url'`;
    - `EMAIL_RE`, expresia regulată WHATWG pentru „valid email address”;
    - fișierul nu importă nimic din Astro, ca să-l poată folosi și Worker-ul.
  - Colecțiile `servicii`, `proiecte` și `ghiduri`, cu câmpurile din §3.4:
    - schema `servicii` verifică `faq.length === 4` și existența `slug`-ului în `SERVICII`;
    - schema `proiecte` are `scoruri` opțional.
  - Din `src/lib/publish.ts`:
    - `proiectPublicabil(p, draft): boolean`;
    - `proiectePublicabile(lista, draft)`;
    - `ghiduriDeConstruit(lista, draft): Ghid[]` (array gol sub 2 ghiduri aprobate);
    - `areProiecte(lista, draft): boolean`.
  - `APROBARI: Record<string, boolean>` din `src/approvals.ts`, cu cele 12 rute din §3.4, toate pe `false`, și `paginaAprobata(cale): boolean`, care întoarce `false` dacă ruta lipsește.

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  test('anonim + aprobat se publică', () =>
    expect(proiectPublicabil({ slug: 'magazin-online', client: 'anonim', acord: false, aprobat: true }, false)).toBe(true));
  test('client cu nume fără acord nu se publică', () =>
    expect(proiectPublicabil({ slug: 'szitrans', client: 'szitrans.eu', acord: false, aprobat: true }, false)).toBe(false));
  test('acest-site fără scoruri nu se publică', () =>
    expect(proiectPublicabil({ slug: 'acest-site', client: 'Alex Ionescu', acord: true, aprobat: true, scoruri: [] }, false)).toBe(false));
  test('în draft se construiește tot', () =>
    expect(proiectPublicabil({ slug: 'szitrans', client: 'szitrans.eu', acord: false, aprobat: false }, true)).toBe(true));
  test('un singur ghid aprobat nu ajunge', () =>
    expect(ghiduriDeConstruit([{ aprobat: true }, { aprobat: false }] as any, false)).toEqual([]));
  test('ruta lipsă din aprobări e neaprobată', () => expect(paginaAprobata('/nu-exista/')).toBe(false));
  test('ordinea serviciilor', () =>
    expect(SERVICII.map(s => s.slug)).toEqual(['seo','optimizare-aeo-geo','audit-seo','creare-site','redesign-site','mentenanta-site']));
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3:** Implementează după §3.4.
  - Un proiect e publicabil dacă `draft` e adevărat, sau dacă (`acord` sau `client === 'anonim'`) și `aprobat`, iar pentru `slug === 'acest-site'` și `scoruri.length > 0`.
  - `EMAIL_RE` = `/^[a-zA-Z0-9.!#$%&'*+\/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/`.
- [ ] **Step 4:** Rulează `npm run test:unit`. Rezultat așteptat: PASS.
- [ ] **Step 5:** Commit: `feat: colecții, reguli de publicare, regulile formularului și aprobări`.

---

### Task 5: SEO de bază (meta, JSON-LD, sitemap, robots)

**Files:**
- Create: `src/lib/seo.ts`, `src/lib/jsonld.ts`, `src/components/SeoHead.astro`, `src/components/JsonLd.astro`, `src/pages/robots.txt.ts`, `tests/unit/seo.test.ts`, `tests/unit/jsonld.test.ts`
- Modify: `src/layouts/Base.astro` (folosește `SeoHead` și `JsonLd`; noi props `jsonld?: object[]`), `astro.config.mjs` (sitemap cu `filter`)

**Interfaces:**
- Produces:
  - Din `src/lib/seo.ts`: `titluPagina(titlu: string): string`. Adaugă „ – Alex Ionescu” doar dacă totalul are cel mult 60 de caractere.
  - Din `src/lib/jsonld.ts`, funcțiile care construiesc nodurile:
    - `nodWebSite()`, `nodPerson(complet: boolean)`, `nodService(s)`, `nodBreadcrumb(pasi: {nume, cale}[])`, `nodFaq(faq)`, `nodArticle(a)`, `nodProfilePage()`, `nodContactPage()`, `nodColectie(tip, elemente)`, `nodWebPage(cale)`;
    - `graf(...noduri): object`;
    - `@id`-urile sunt `${site.url}/#website` și `${site.url}/#alex`.
  - `SeoHead`, cu props `{ titlu, descriere, cale, noindex? }`. Randează canonicalul absolut și Open Graph (§6.2). `og:image` vine la Task 19.

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  test('titlul de pe Acasă', () =>
    expect(titluPagina('Consultant SEO din București')).toBe('Consultant SEO din București – Alex Ionescu'));
  test('titlul AEO/GEO rămâne fără sufix', () =>
    expect(titluPagina('Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)'))
      .toBe('Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)'));
  test('Service are furnizor #alex', () =>
    expect(nodService({ slug: 'seo', titlu: 'x', raspunsDirect: 'y' } as any).provider['@id']).toMatch(/\/#alex$/));
  test('Person minimal nu are adresă de stradă', () =>
    expect(JSON.stringify(nodPerson(true))).not.toMatch(/streetAddress/));
  test('niciun ProfessionalService', () =>
    expect(JSON.stringify(graf(nodWebSite(), nodPerson(true)))).not.toMatch(/ProfessionalService/));
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3:** Implementează după §6.3.
  - `taxID` și `image` apar doar dacă valoarea există și nu e marcaj.
  - `robots.txt`: `User-agent: *`, `Allow: /` și `Sitemap: ${site.url}/sitemap-index.xml`.
  - Sitemap-ul exclude `/contact/multumim/`, `/contact/eroare/`, `/contact/prea-multe-linkuri/`, `/404/` și `/_test/`.
- [ ] **Step 4:** Rulează `npm run test:unit && npm run build`. Rezultat așteptat: PASS. `dist/robots.txt` conține linia `Sitemap:`.
- [ ] **Step 5:** Commit: `feat: meta, JSON-LD, sitemap și robots`.

---

### Task 6: Scheletul paginilor (antet, subsol, date firmă, firimituri, îndemn)

**Files:**
- Create: `src/components/Header.astro`, `Footer.astro`, `LegalId.astro`, `Breadcrumbs.astro`, `Cta.astro`, `tests/unit/helpers.ts`, `tests/unit/shell.test.ts`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: `site`, `SERVICII` (pentru linkurile din subsol, în ordine), `ghiduriDeConstruit`, `areProiecte`.
- Produces:
  - `Header`, cu props `{ cale, arataProiecte: boolean, arataGhiduri: boolean }`;
  - `Footer`, cu props `{ arataAcestSite: boolean, arataProiecte: boolean }`;
  - `LegalId`, cu props `{ variant: 'scurt' | 'complet' }`;
  - `Breadcrumbs`, cu props `{ pasi: { nume: string; cale: string }[] }`;
  - `Cta`, fără props, cu link spre `/contact/` și textul „Cere o ofertă”;
  - `Base.astro`, cu noi props `{ firimituri?, harta? }`;
  - în `tests/unit/helpers.ts`: `render(Component, props): Promise<string>` (prin `experimental_AstroContainer`) și `textOf(html): string` (textul fără etichete). Le folosesc toate testele de componente de mai departe.

- [ ] **Step 1: Scrie testele care pică** (Astro Container API, `renderToString`):
  ```ts
  test('Acasă și Contact nu au buton în antet', async () => {
    for (const cale of ['/', '/contact/'])
      expect(await render(Header, { cale })).not.toContain('class="buton-cta"');
    expect(await render(Header, { cale: '/servicii/seo/' })).toContain('Cere o ofertă');
  });
  test('logo-ul', async () => expect(textOf(await render(Header, { cale: '/' }))).toContain('Alex Ionescu, consultant SEO'));
  test('LegalId scurt: fără adresă, cu link', async () => {
    const h = await render(LegalId, { variant: 'scurt' });
    expect(h).toContain('href="/contact/#date-firma"');
    expect(h).toContain('București');
  });
  test('LegalId complet nu are link spre el însuși', async () =>
    expect(await render(LegalId, { variant: 'complet' })).not.toContain('Date de identificare</a>'));
  test('subsolul fără acest-site nu are fraza', async () =>
    expect(await render(Footer, { arataAcestSite: false, arataProiecte: false })).not.toContain('Vezi cum e făcut site-ul'));
  test('firimiturile', async () => {
    const h = await render(Breadcrumbs, { pasi: [{ nume: 'Acasă', cale: '/' }, { nume: 'Servicii', cale: '/servicii/' }] });
    expect(h).toContain('aria-label="Firimituri"'); expect(h).toContain('aria-current="page"');
  });
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3:** Implementează după §3.3, §5.2 (culorile din subsol), §5.4 (logo-ul) și §7.1.
  - Câmpurile PFA care conțin marcaje trec prin `<Placeholder>`.
  - Meniul: Servicii, Cum lucrez, Proiecte (doar cu `arataProiecte`), Ghiduri (doar cu `arataGhiduri`), Despre, Contact.
  - Fraza din subsol e exact cea din §4.3, punctul 8.
- [ ] **Step 4:** Rulează `npm run test:unit && npm run build`. Rezultat așteptat: PASS.
- [ ] **Step 5:** Commit: `feat: antet, subsol, date firmă, firimituri și îndemn`.

---

### Task 7: Unealta de verificare pe pagină (`qa:page`)

**Files:**
- Create:
  - `.htmlvalidate.json`;
  - `scripts/check-dist-markers.mjs`, `scripts/qa-lighthouse.mjs`, `scripts/check-schema.mjs`, `scripts/schema-expectations.mjs`, `scripts/qa-page.mjs`;
  - `tests/e2e/helpers.ts`, `tests/e2e/page-basics.spec.ts`, `tests/unit/schema-check.test.ts`.
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `npm run qa:page -- <cale>` rulează, în ordine: build cu `SITE_URL=http://localhost:8787`, `check`, `check-dist-markers`, html-validate pe fișierul paginii, `check-schema`, Playwright `page-basics` pentru acea cale, Lighthouse (3 rulări) și capturile. Scrie `reports/qa/<cale>.json` și iese cu cod 1 la orice eșec.
  - Din `scripts/check-schema.mjs`: `verificaGraf(html: string, cale: string): string[]` (lista de erori).
  - Din `scripts/qa-lighthouse.mjs`: `ruleaza(url, { noindex }): { scoruri, trece }`.
  - Din `tests/e2e/helpers.ts`: `axe(page)`, `faraDerulareOrizontala(page)`, `zoneAtingereMici(page): string[]` și `incalcariCsp(page): string[]` (ascultă `securitypolicyviolation` din momentul încărcării).
  - Serverul folosit: `wrangler dev --port 8787` dacă există `wrangler.jsonc` (de la Task 13 încolo), altfel `astro preview --port 8787`.
  - Cu `QA_DIST=dist-draft`, `qa:page` construiește cu `preview:draft`, servește cu `cross-env DRAFT=1 astro preview --port 8787` și nu rulează `check-dist-markers`.

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  // schema-check.test.ts
  test('pagina de serviciu fără Service e respinsă', () =>
    expect(verificaGraf(htmlCuGraf([{ '@type': 'WebSite' }]), '/servicii/seo/')).toContain('lipsește Service'));
  test('@id nerezolvat e respins', () =>
    expect(verificaGraf(htmlCuGraf([{ '@type': 'Service', provider: { '@id': 'x/#nimeni' } }]), '/servicii/seo/'))
      .toContain('@id nerezolvat: x/#nimeni'));
  ```
  ```ts
  // page-basics.spec.ts — calea vine din QA_PATH
  test('elementele de bază', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(process.env.QA_PATH!);
    expect(await faraDerulareOrizontala(page)).toBe(true);
    expect(await axe(page)).toEqual([]);
    expect(await page.locator('h1').count()).toBe(1);
    expect(await page.locator('script:not([type="application/ld+json"])').count()).toBeLessThanOrEqual(scripturiPermise(process.env.QA_PATH!));
    expect(await zoneAtingereMici(page)).toEqual([]);   // butoane, câmpuri, meniu, subsol, rândurile din linie: ≥ 44×44
    expect(await incalcariCsp(page)).toEqual([]);
    const titlu = await page.title(); expect(titlu.length).toBeLessThanOrEqual(60);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc!.length).toBeGreaterThanOrEqual(140); expect(desc!.length).toBeLessThanOrEqual(160);
    expect(await page.locator('body').innerText()).not.toMatch(/dumneavoastr|\bvă\b|Cereți|Trimiteți|garantat|prima pagină/i);
    expect(await cssPePagina(page)).toBeLessThanOrEqual(25 * 1024);   // octeți necomprimați, CSS legat + inline
  });
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3:** Implementează:
  - **`schema-expectations.mjs`** pune tabelul din §6.3 într-un map cu pattern pe rută. `scripturiPermise` dă 1 pentru `/` și `/proiecte/acest-site/` și 0 pentru restul.
  - **`cssPePagina(page)`** adună octeții necomprimați ai fiecărui `<link rel="stylesheet">` și ai fiecărui `<style>`.
  - **`check-dist-markers.mjs`** iese cu cod 1 dacă `dist/` conține „[DE COMPLETAT”.
  - **Lighthouse:** folosește API-ul Node cu `chrome-launcher` (headless) și `formFactor` mobil. Rulează de 3 ori și ia mediana pe categorie. Pragul e 90 la `performance`, `accessibility`, `best-practices` și `seo`. Pentru paginile noindex, la SEO se cere scorul 1 pe fiecare audit cu greutate, în afară de `is-crawlable` și `http-status-code`.
  - **Capturile** se fac la 390×844 și la 1440×900, în `reports/screens/`.
  - Scrie scripturile `qa:page`, `test:e2e` și `check:links` (`linkinator dist --recurse --skip "^https?://(?!localhost)"`).
- [ ] **Step 4:** Rulează `npm run test:unit && npm run qa:page -- /`. Rezultat așteptat: pentru pagina temporară, toate verificările PASS.
- [ ] **Step 5:** Commit: `feat: verificarea pe pagină (validare, schemă, axe, Lighthouse, capturi)`.

---

### Task 8: Harta de metrou și trenurile

**Files:**
- Create: `src/components/MetroMap.astro`, `src/client/trains.ts`, `src/lib/trains-controller.ts`, `src/styles/metro.css`, `tests/unit/trains-controller.test.ts`, `tests/unit/metro-map.test.ts`

**Interfaces:**
- Produces:
  - `MetroMap`, cu props `{ variant: 'animated' | 'static'; line?: 'vizibilitate' | 'diagnostic' | 'constructie' | 'reparatie' }`. Grupurile se mapează pe linii: vizibilitate → M2 albastru, diagnostic → M4 verde, construcție → M1 galben, reparație → M3 roșu.
  - `createTrainController({ play, pause }): { userToggle(): 'oprit' | 'pornit'; visibility(visible: boolean): void; state(): 'pornit' | 'oprit' }`.
  - `initTrains(root: HTMLElement): void` în `src/client/trains.ts`. Pornește doar cu `prefers-reduced-motion: no-preference`: scoate `hidden` de pe buton, pune clasa `trenuri-pornite` pe hartă și leagă IntersectionObserver.

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  test('după oprirea manuală, vizibilitatea nu repornește trenurile', () => {
    const c = createTrainController({ play: vi.fn(), pause: vi.fn() });
    c.userToggle(); c.visibility(false); c.visibility(true);
    expect(c.state()).toBe('oprit');
  });
  test('oprite automat la ieșirea din ecran, repornite la întoarcere', () => {
    const play = vi.fn(); const c = createTrainController({ play, pause: vi.fn() });
    c.visibility(false); c.visibility(true);
    expect(c.state()).toBe('pornit'); expect(play).toHaveBeenCalled();
  });
  test('harta statică cu linia vizibilitate are „Ești aici” pe M2', async () => {
    const h = await render(MetroMap, { variant: 'static', line: 'vizibilitate' });
    expect(h).toMatch(/data-linie="M2"[^>]*data-plina/); expect(h).toContain('Ești aici');
  });
  test('harta animată: trenurile sunt ascunse din CSS, iar butonul are hidden', async () => {
    const h = await render(MetroMap, { variant: 'animated' });
    expect(h).toContain('class="trenuri"'); expect(h).toMatch(/<button[^>]*hidden[^>]*>Oprește trenurile/);
  });
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3:** Implementează după §5.6 și §5.7 (M1, M2):
  - SVG `aria-hidden`, cu linii la 45° și stații albe cu contur;
  - liniile se desenează cu `stroke-dashoffset` (~600ms, `ease-out`), doar sub `prefers-reduced-motion: no-preference`;
  - `.trenuri { display: none }`, apoi `.trenuri-pornite .trenuri { display: block }`;
  - sub 640px rămân doar M2 și M3, fiecare cu câte un tren;
  - eticheta butonului alternează între „Oprește trenurile” și „Pornește trenurile”, fără `aria-pressed`;
  - mișcarea trenurilor se face cu SMIL `animateMotion` (`begin="indefinite"`) sau cu CSS `offset-path`. Alege-o pe cea care trece testul manual în Chrome, Firefox și Safari și scrie alegerea în comentariul de sus din `trains.ts`.

  Scriptul ajunge pe pagină doar ca `<script>` procesat de Astro. Mărimea lui, după minificare, trebuie să fie de cel mult 1,2 KB.
- [ ] **Step 4:** Rulează `npm run test:unit`. Rezultat așteptat: PASS.
- [ ] **Step 5:** Commit: `feat: harta de metrou, statică și animată, cu oprirea trenurilor`.

---

### Task 9: „De unde pornești?”, cele două trasee și întrebările frecvente

**Files:**
- Create: `src/components/LineDiagram.astro`, `src/components/RouteMap.astro`, `src/components/Faq.astro`, `tests/unit/blocks.test.ts`

**Interfaces:**
- Consumes: `SERVICII`, colecția `servicii` (câmpurile `problema`, `ordine`, `grup`), `Placeholder`.
- Produces:
  - `LineDiagram`, cu props `{ randuri: { problema: string; slug: string; nume: string; grup: string }[] }`;
  - `RouteMap`, cu props `{ marime: 'compact' | 'mare' }`. Stațiile buclei lunare sunt `<Placeholder nr={15} />` până le confirmă Alex;
  - `Faq`, cu props `{ intrebari: { q: string; a: string }[] }`. Randează doar elemente vizibile, iar nodul FAQPage îl adaugă pagina, nu componenta.

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  test('LineDiagram e o listă neordonată, în ordinea primită', async () => {
    const h = await render(LineDiagram, { randuri: rânduriExemplu });
    expect(h).toMatch(/^<ul|<ul /); expect(h).not.toContain('<ol');
    expect([...h.matchAll(/href="(\/servicii\/[^"]+)"/g)].map(m => m[1])).toEqual(rânduriExemplu.map(r => `/servicii/${r.slug}/`));
  });
  test('segmentul galben folosește galbenul închis', async () =>
    expect(await render(LineDiagram, { randuri: [{ ...r, grup: 'constructie' }] })).toContain('data-grup="constructie"'));
  test('RouteMap are etichetele traseelor', async () => {
    const t = textOf(await render(RouteMap, { marime: 'compact' }));
    expect(t).toContain('Remediere unică'); expect(t).toContain('Remediere + abonament lunar');
  });
  test('Faq e vizibil, fără acordeon', async () =>
    expect(await render(Faq, { intrebari: [{ q: 'Afișezi prețuri?', a: 'Nu.' }] })).not.toContain('<details'));
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3:** Implementează după §4.3 (punctele 3 și 4), §5.2 și §5.8:
  - CSS-ul colorează segmentul după `data-grup`, iar pentru construcție folosește `--yellow-dark`;
  - linia remedierii unice din `RouteMap` e desenată în `#8A5A00`;
  - capătul de linie e un link text, fără chenar;
  - fiecare rând are o zonă de atingere de 44px;
  - fiecare segment primește clasa `vt-<slug>` pentru tranziția M3, cu `view-transition-name` declarat în CSS.
- [ ] **Step 4:** Rulează `npm run test:unit`. Rezultat așteptat: PASS.
- [ ] **Step 5:** Commit: `feat: schema de linie, traseele și întrebările frecvente`.

---

### Task 10: Cele 6 pagini de serviciu și `/servicii/`

**Files:**
- Create: `src/content/servicii/{seo,optimizare-aeo-geo,audit-seo,creare-site,redesign-site,mentenanta-site}.md`, `src/layouts/Service.astro`, `src/pages/servicii/[slug].astro`, `src/pages/servicii/index.astro`, `src/styles/transitions.css`, `tests/unit/servicii-content.test.ts`

**Interfaces:**
- Consumes: colecția `servicii`, `MetroMap`, `Faq`, `Cta`, `Breadcrumbs`, `nodService`, `nodFaq`, `nodBreadcrumb`, `nodColectie`, `proiectePublicabile`, `ghiduriDeConstruit`.
- Produces: rutele `/servicii/<slug>/` și `/servicii/`, plus `view-transition-name: segment-<slug>` pe banda paginii de serviciu.

- [ ] **Step 1: Scrie testele care pică** (citesc frontmatter-ul cu `getCollection` prin Container API sau cu gray-matter):
  ```ts
  test.each(SERVICII.map(s => s.slug))('%s respectă regulile de conținut', async slug => {
    const s = await serviciu(slug);
    expect(s.faq).toHaveLength(4);
    expect(s.descriere.length).toBeGreaterThanOrEqual(140); expect(s.descriere.length).toBeLessThanOrEqual(160);
    expect(s.aprobat).toBe(false);
    expect(JSON.stringify(s)).not.toMatch(/dumneavoastr|\bvă\b|Cereți|garantat|prima pagină/i);
  });
  test('titlul AEO/GEO și H1-ul de web design', async () => {
    expect((await serviciu('optimizare-aeo-geo')).titlu).toBe('Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)');
    expect((await serviciu('creare-site')).h1).toMatch(/gândit să aducă cereri de ofertă/);
  });
  test('nota despre garanții doar pe SEO și AEO/GEO', async () =>
    expect((await toate()).filter(s => s.notaGarantii).map(s => s.slug)).toEqual(['seo', 'optimizare-aeo-geo']));
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3: Scrie ciornele celor 6 fișiere.**
  - **Cuvintele-cheie și grupurile** sunt cele din §4.1. Câmpul `problema` e exact rândul din §4.3, punctul 3.
  - **Tonul și vocea:** „tu”, persoana I, fără promisiuni.
  - **Ce nu știu încă** (durate, de exemplu) lipsește, fără marcaj (rândul #14 nu blochează).
  - **Răspunsurile la întrebările frecvente** sunt ciorne și se aprobă odată cu pagina.
  - **Nota despre garanții:** „Nu garantez poziții în Google și nici apariții în răspunsurile motoarelor AI.”
- [ ] **Step 4: Construiește paginile:**
  - **`Service.astro`** urmează structura din §4.4, cu `MetroMap static line={grup}` în bandă.
  - **`/servicii/`** urmează §4.5: grupat pe linii, fără să repete „De unde pornești?”.
  - **`transitions.css`:** `@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }`, plus `::view-transition-old(root), ::view-transition-new(root) { animation: none; }`. Durata pentru `segment-*` e de 300ms, cu `ease-in-out`.
- [ ] **Step 5:** Rulează `npm run test:unit`, apoi `npm run qa:page --` pe fiecare dintre cele 7 rute. Rezultat așteptat: PASS pe toate. Revizuiește capturile din `reports/screens/`.
- [ ] **Step 6:** Commit: `feat: paginile de serviciu și /servicii/ (ciorne, neaprobate)`.

---

### Task 11: Pagina Acasă

**Files:**
- Create: `tests/e2e/home.spec.ts`
- Modify: `src/pages/index.astro`, `src/approvals.ts` (rămâne `false`), `tests/e2e/helpers.ts` (adaugă `ordineFocus(page): string[]`, `trenuriInMiscare(page): boolean` și `seSuprapun(page, selectori): boolean`)

**Interfaces:**
- Consumes: `MetroMap animated`, `initTrains`, `LineDiagram`, `RouteMap compact`, `Faq`, `Cta`, `proiectePublicabile`, `nodWebPage`, `nodFaq`.

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  test('zona de sus are un singur rol', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Consultant SEO din București');
    await expect(page.locator('main a', { hasText: 'Cere o ofertă' }).first()).toBeVisible();
    await expect(page.locator('header .buton-cta')).toHaveCount(0);
    await expect(page.getByText('Fișa acestei pagini')).toHaveCount(0);
  });
  test('ordinea focusului: butonul de oprire vine după „Cere o ofertă”', async ({ page }) => {
    await page.goto('/'); const ordine = await ordineFocus(page);
    expect(ordine.indexOf('Oprește trenurile')).toBeGreaterThan(ordine.indexOf('Cere o ofertă'));
  });
  test('butonul oprește trenurile, iar derularea nu le repornește', async ({ page }) => {
    await page.goto('/'); await page.getByRole('button', { name: 'Oprește trenurile' }).click();
    await page.mouse.wheel(0, 3000); await page.mouse.wheel(0, -3000);
    await expect(page.getByRole('button', { name: 'Pornește trenurile' })).toBeVisible();
    expect(await trenuriInMiscare(page)).toBe(false);
  });
  test('reduced motion: fără trenuri și fără buton', async ({ browser }) => {
    const p = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage(); await p.goto('/');
    await expect(p.locator('.trenuri')).toBeHidden(); await expect(p.getByRole('button', { name: /trenurile/ })).toBeHidden();
  });
  test('fără JavaScript: harta e statică', async ({ browser }) => {
    const p = await (await browser.newContext({ javaScriptEnabled: false })).newPage(); await p.goto('/');
    await expect(p.locator('.trenuri')).toBeHidden(); await expect(p.getByRole('button', { name: /trenurile/ })).toBeHidden();
  });
  test('text mărit la 200%, pe 320px: nimic nu se suprapune', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 }); await page.goto('/');
    await page.addStyleTag({ content: 'html{font-size:200%}' });
    expect(await seSuprapun(page, ['h1', 'main .buton-cta', '.harta button'])).toBe(false);
  });
  ```
- [ ] **Step 2:** Rulează `npx playwright test home`. Rezultat așteptat: FAIL.
- [ ] **Step 3:** Construiește pagina după §4.3, punctele 1–8, cu textele din spec:
  - H1-ul;
  - subtitlul;
  - rândurile din „De unde pornești?”, din câmpul `problema`;
  - cele 4–5 întrebări frecvente generale, la „tu”;
  - banda finală, „Spune-mi ce site ai și ce te încurcă.”

  Secțiunea Proiecte apare doar dacă `areProiecte(...)`.
- [ ] **Step 4:** Rulează `npx playwright test home && npm run qa:page -- /`. Rezultat așteptat: PASS, cu cel mult 1 script executabil pe pagină.
- [ ] **Step 5:** Commit: `feat: pagina Acasă`.

---

### Task 12: Cum lucrez

**Files:**
- Create: `src/pages/cum-lucrez.astro`

**Interfaces:**
- Consumes: `RouteMap mare`, `MetroMap static` (fără `line`), `Breadcrumbs`, `Cta`, `nodWebPage`, `nodBreadcrumb`.

- [ ] **Step 1:** Construiește pagina după §4.5:
  - cei patru pași explicați;
  - fraza exactă: „Prețul, reducerea și ce include abonamentul le stabilim după ce mă uit la site-ul tău.”;
  - mențiunea B2B: „Lucrez doar cu firme, PFA-uri și alte entități profesionale.”
- [ ] **Step 2:** Rulează `npm run qa:page -- /cum-lucrez/`. Rezultat așteptat: PASS. Marcajul #15 apare doar în `dist-draft/`.
- [ ] **Step 3:** Commit: `feat: pagina Cum lucrez`.

---

### Task 13: Worker-ul formularului (TDD)

**Files:**
- Create:
  - `worker/links.ts`, `worker/validate.ts`, `worker/email.ts`, `worker/index.ts`;
  - `worker/vitest.config.ts`, `worker/index.test.ts`;
  - `wrangler.jsonc`, `public/_headers`, `public/.assetsignore`.
- Modify: `package.json` (`test:worker`), `playwright.config.ts` (`webServer` → `wrangler dev`)

**Interfaces:**
- Consumes: `CAMPURI`, `SERVICII`, `CAPCANA`, `EMAIL_RE`, `DESTINATAR` din `../src/form-rules.ts`. Worker-ul nu importă `site.config.ts`, pentru că acolo se citește `process.env`.
- Produces:
  - `countLinks(text: string): number`;
  - `validate(form: FormData): { ok: true; date: Cerere } | { ok: false; motiv: 'capcana' | 'linkuri' | 'invalid' }`;
  - `buildEmailParts(date: Cerere): { subiect: string; corp: string }`;
  - `buildEmail(date: Cerere, from: string, to: string): EmailMessage` (mimetext, subiect RFC 2047). `from` = `formular@` + hostname-ul cererii, iar `to` = `DESTINATAR`;
  - `default { fetch(req, env: { EMAIL: SendEmail; RATE_LIMITER: RateLimit }) }`.

  În teste, `f(suprascrieri)` construiește un `FormData` valid, cu valorile implicite `nume: 'Ana Pop'`, `email: 'ana@exemplu.ro'`, `mesaj: 'Salut'`.

- [ ] **Step 1: Scrie testele care pică.** Fiecare rând din §10, partea „Worker-ul”, devine un test. Cele care fixează valorile:
  ```ts
  test('countLinks', () => {
    expect(countLinks('https://www.a.ro https://b.ro www.c.ro')).toBe(3);
    expect(countLinks('HTTP://a.ro http://b.ro WWW.c.ro https://d.ro')).toBe(4);
  });
  test('3000 de caractere cu CRLF trec', () =>
    expect(validate(f({ mesaj: ('a'.repeat(99) + '\r\n').repeat(30) })).ok).toBe(true)); // 3000 după normalizarea CRLF→LF
  test('101 caractere în Nume e invalid', () => expect(validate(f({ nume: 'a'.repeat(101) }))).toEqual({ ok: false, motiv: 'invalid' }));
  test('CR/LF în Nume e invalid', () => expect(validate(f({ nume: 'Ana\r\nBcc: x@y.ro' }))).toEqual({ ok: false, motiv: 'invalid' }));
  test('doar spații într-un câmp obligatoriu trec', () => expect(validate(f({ nume: '   ' })).ok).toBe(true));
  test('serviciu necunoscut e invalid', () => expect(validate(f({ serviciu: 'x' }))).toEqual({ ok: false, motiv: 'invalid' }));
  test('reușita trimite 303 spre mulțumire și un singur e-mail', async () => {
    const r = await post(f({})); expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/contact/multumim/'); expect(env.EMAIL.send).toHaveBeenCalledTimes(1);
  });
  test('4 linkuri duc la prea-multe-linkuri, fără e-mail', async () => {
    const r = await post(f({ mesaj: 'a.ro www.b.ro www.c.ro www.d.ro www.e.ro' }));
    expect(r.headers.get('location')).toBe('/contact/prea-multe-linkuri/'); expect(env.EMAIL.send).not.toHaveBeenCalled();
  });
  test('subiectul fără serviciu', () =>
    expect(buildEmailParts(f({ serviciu: '' })).subiect).toBe('Cerere de ofertă – Ana Pop'));
  test('GET primește 405, altă cale primește 404', async () => {
    expect((await get('/api/contact')).status).toBe(405); expect((await post(f({}), '/api/altceva')).status).toBe(404);
  });
  ```
  Restul testelor:
  - capcana completată → 303 spre mulțumire, fără e-mail;
  - limita de trimiteri depășită → 303 spre eroare;
  - `send` aruncă o eroare → 303 spre eroare;
  - fiecare răspuns are antetele HSTS, `nosniff` și `X-Robots-Tag: noindex`;
  - un spion pe `console.log` nu e apelat niciodată cu valori din formular;
  - lista `allowed_destination_addresses` din `wrangler.jsonc` e exact `[DESTINATAR]`.
- [ ] **Step 2:** Rulează `npm run test:worker`. Rezultat așteptat: FAIL.
- [ ] **Step 3: Implementează `countLinks`.** Algoritmul e fixat de spec:
  ```ts
  export const countLinks = (t: string) =>
    (t.match(/https?:\/\//gi)?.length ?? 0) + (t.match(/(?<!\/\/)www\./gi)?.length ?? 0);
  ```
  **`validate`** lucrează în ordinea de mai jos:
  1. normalizează `\r\n` în `\n`;
  2. măsoară lungimea cu `string.length`;
  3. aplică `required` fără trim;
  4. verifică `EMAIL_RE`;
  5. respinge `\r` sau `\n` în câmpurile pe un rând;
  6. numără linkurile doar în Mesaj.

  **`index.ts`** aplică ordinea din §3.5, pașii 1–7.
- [ ] **Step 4:** Rulează `npm run test:worker`. Rezultat așteptat: PASS.
- [ ] **Step 5: Scrie configurarea.**
  - **`wrangler.jsonc`** (§3.6):
    - `main: "worker/index.ts"`;
    - `assets: { directory: "./dist", not_found_handling: "404-page", html_handling: "auto-trailing-slash", run_worker_first: ["/api/*"] }`;
    - `observability: { enabled: false }`;
    - `send_email: [{ name: "EMAIL", allowed_destination_addresses: ["idealserv51@gmail.com"] }]`;
    - rate limit cu `limit: 3, period: 60`. Cheia exactă o verifici în documentația wrangler instalată.
  - **`public/_headers`:** exact antetele din §3.6, inclusiv regula pentru `https://:version.:subdomain.workers.dev/*`.
  - **`public/.assetsignore`:** conține `_intern`.
- [ ] **Step 6:** Rulează `npm run build && npx wrangler dev --port 8787`, apoi `curl -sI http://localhost:8787/`. Rezultat așteptat: antetele din `_headers` sunt prezente, iar `/nu-exista/` întoarce 404.
- [ ] **Step 7:** Commit: `feat: Worker-ul formularului, configurarea wrangler și antetele`.

---

### Task 14: Contact și paginile de răspuns

**Files:**
- Create: `src/components/ContactForm.astro`, `src/pages/contact/index.astro`, `src/pages/contact/multumim.astro`, `src/pages/contact/eroare.astro`, `src/pages/contact/prea-multe-linkuri.astro`, `tests/unit/contact-form.test.ts`, `tests/e2e/contact.spec.ts`
- Modify: `tests/e2e/helpers.ts` (adaugă `completeaza(page, suprascrieri?)`, care deschide `/contact/` și completează câmpurile obligatorii)

**Interfaces:**
- Consumes: `CAMPURI`, `SERVICII`, `CAPCANA`, `LegalId complet`, `nodContactPage`, Worker-ul de la Task 13.

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  test('atributele HTML vin din form-rules', async () => {
    const h = await render(ContactForm, {});
    for (const [nume, r] of Object.entries(CAMPURI)) if ('maxLength' in r) expect(h).toContain(`name="${nume}"`) && expect(h).toMatch(new RegExp(`name="${nume}"[^>]*maxlength="${r.maxLength}"`));
    expect(h).toContain('Cel mult 3000 de caractere și cel mult 3 linkuri.');
    expect(h).toContain('>Trimite cererea<');
  });
  ```
  ```ts
  test('contactul nu are niciun script executabil', async ({ page }) => {
    await page.goto('/contact/'); await expect(page.locator('script:not([type="application/ld+json"])')).toHaveCount(0);
  });
  test('trimiterea fără JS ajunge la „Am primit cererea ta”', async ({ browser }) => {
    const p = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
    await completeaza(p); await p.getByRole('button', { name: 'Trimite cererea' }).click();
    await expect(p).toHaveURL(/\/contact\/multumim\/$/); await expect(p.locator('h1')).toContainText('Am primit cererea ta');
  });
  test('Înapoi după prea multe linkuri readuce mesajul', async ({ page }) => {
    await completeaza(page, { mesaj: 'www.a.ro www.b.ro www.c.ro www.d.ro' });
    await page.getByRole('button', { name: 'Trimite cererea' }).click();
    await expect(page).toHaveURL(/prea-multe-linkuri/); await page.goBack();
    await expect(page.locator('textarea[name="mesaj"]')).toHaveValue('www.a.ro www.b.ro www.c.ro www.d.ro');
  });
  ```
- [ ] **Step 2:** Rulează `npm run test:unit && npx playwright test contact`. Rezultat așteptat: FAIL.
- [ ] **Step 3:** Construiește paginile după §3.5 și §4.5:
  - **Formularul** are etichete vizibile, iar câmpurile obligatorii sunt marcate în text.
  - **Nota de sub Mesaj** e legată de câmp prin `aria-describedby`.
  - **Capcana** e ascunsă vizual și pentru cititoarele de ecran, cu `tabindex=-1` și `autocomplete=off`.
  - **Contactele:** `tel:`, WhatsApp (link simplu), e-mailul și secțiunea `#date-firma` cu `LegalId complet`.
  - **Paginile de răspuns** sunt noindex, cu textele exacte din §3.5.
- [ ] **Step 4:** Rulează `npx playwright test contact`, apoi `npm run qa:page --` pe `/contact/` și pe cele 3 pagini de răspuns. Rezultat așteptat: PASS. La paginile noindex se aplică excepțiile SEO.
- [ ] **Step 5:** Commit: `feat: Contact, formularul fără JavaScript și paginile de răspuns`.

---

### Task 15: Proiecte, studiul de caz și `acest-site`

**Files:**
- Create:
  - `src/content/proiecte/{szitrans,magazin-online,acest-site}.md`;
  - `src/layouts/CaseStudy.astro`, `src/components/PageFacts.astro`, `src/client/page-facts.ts`;
  - `src/pages/proiecte/index.astro`, `src/pages/proiecte/[slug].astro`;
  - `tests/unit/page-facts.test.ts`.

**Interfaces:**
- Consumes: `proiectePublicabile`, `areProiecte`, `MetroMap static`, `nodArticle`, `nodColectie`.
- Produces:
  - `masoara(entries: PerformanceResourceTiming[], nav: PerformanceNavigationTiming): { greutateKb: number; cereri: number; dinCache: boolean }`;
  - `PageFacts`, cu props `{ tipuriSchema: string[] }`.

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  test('revalidarea contează ca resursă din cache', () =>
    expect(masoara([{ transferSize: 300, encodedBodySize: 5000 } as any], nav(2000, 2000)).dinCache).toBe(true));
  test('totalul greutății în KB', () =>
    expect(masoara([{ transferSize: 1024, encodedBodySize: 1024 } as any], nav(1024, 1024)).greutateKb).toBe(2));
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3: Scrie conținutul și construiește paginile.**
  - **`szitrans.md`:** `client: 'szitrans.eu'`, `acord: false`, `aprobat: false`. Rezultatele sunt `[DE COMPLETAT:#10]`, iar acordul e rândul #7.
  - **`magazin-online.md`:** `client: 'anonim'`, `aprobat: false`, fără niciun detaliu care să identifice clientul.
  - **`acest-site.md`:** `acord: true`, `aprobat: false`, `scoruri: []`.
  - **`PageFacts`** urmează §5.5: explicațiile de sub fiecare rând, textul pentru cazul fără JavaScript și `requestIdleCallback` cu `setTimeout` ca rezervă.
  - **Ce se construiește:** `/proiecte/` și pagina fiecărui proiect, doar pentru proiectele publicabile.
- [ ] **Step 4: Verifică cele două build-uri.**
  - `npm run build`: `dist/proiecte/` nu există, pentru că nimic nu e publicabil încă.
  - `npm run preview:draft`: cele 3 pagini există în `dist-draft/`.
  - Rulează `npm run qa:page --` pe fiecare pagină din draft (cu `QA_DIST=dist-draft`, din care se ignoră `check-dist-markers`). Rezultat așteptat: PASS.
- [ ] **Step 5:** Commit: `feat: proiecte, studiu de caz și fișa paginii (ascunse până la publicare)`.

---

### Task 16: Ghidurile

**Files:**
- Create: `src/content/ghiduri/{de-ce-nu-apare-site-ul-in-google,ce-este-geo}.md`, `src/layouts/Guide.astro`, `src/pages/ghiduri/index.astro`, `src/pages/ghiduri/[slug].astro`

**Interfaces:**
- Consumes: `ghiduriDeConstruit`, `nodArticle`, `nodColectie`, `MetroMap static line={grupul serviciuLegat}`.

- [ ] **Step 1:** Scrie cele 2 ciorne, cu `aprobat: false`:
  - titlurile exacte: „De ce nu apare site-ul meu în Google” și „Ce este GEO și prin ce diferă de SEO și AEO”;
  - răspunsul vine în primul paragraf;
  - `serviciuLegat` e `audit-seo`, respectiv `optimizare-aeo-geo`;
  - nicio cifră sau afirmație fără sursă.
- [ ] **Step 2:** Construiește paginile după §4.5.
- [ ] **Step 3: Verifică cele două build-uri.**
  - `npm run build`: `dist/ghiduri/` nu există, iar Ghiduri lipsește din meniu.
  - `npm run preview:draft`: paginile există în `dist-draft/`.
  - Rulează `qa:page` în draft. Rezultat așteptat: PASS.
- [ ] **Step 4:** Commit: `feat: ghidurile (ascunse până la aprobare)`.

---

### Task 17: Despre

**Files:**
- Create: `src/pages/despre.astro`

**Interfaces:**
- Consumes: `nodProfilePage`, `nodPerson(true)`, `Placeholder`.

- [ ] **Step 1:** Construiește pagina după §4.5:
  - biografia, studiile, experiența și instrumentele sunt `[DE COMPLETAT:#4]`;
  - profilurile apar doar dacă `site.profiluri` nu e gol;
  - fără fotografie și fără cadru gol.
- [ ] **Step 2:** Rulează `npm run qa:page -- /despre/`. Rezultat așteptat: PASS. `ProfilePage` are `mainEntity` = `#alex`.
- [ ] **Step 3:** Commit: `feat: pagina Despre (ciornă cu marcaje)`.

---

### Task 18: Paginile legale și 404

**Files:**
- Create: `src/pages/politica-de-confidentialitate.astro`, `src/pages/politica-cookies.astro`, `src/pages/termeni-si-conditii.astro`, `src/pages/404.astro`, `src/layouts/Legal.astro`

**Interfaces:**
- Consumes: `LegalId complet`, `Placeholder`, `nodWebPage`, `nodBreadcrumb`.

- [ ] **Step 1: Scrie paginile după §7.2, §7.3 și §7.4, la „tu”.**
  - **Confidențialitatea** are cele 10 puncte din §7.2. Durata de păstrare e `[DE COMPLETAT:#17]`, iar dreptul de opoziție e un paragraf separat.
  - **Cookie-urile** au textul exact din §7.3.
  - **Termenii** au lista din §7.4, fără clauze comerciale.
  - **404** urmează §4.5: fără hartă, cu linkuri spre Acasă, Servicii și Contact.
- [ ] **Step 2:** Rulează `npm run qa:page --` pe cele 3 rute legale și pe `/404/`. Rezultat așteptat: PASS. 404 are excepțiile SEO.
- [ ] **Step 3:** Commit: `feat: paginile legale și 404`.

---

### Task 19: Imaginile OG și llms.txt

**Files:**
- Create: `src/lib/routes.ts`, `src/pages/og/[...cale].png.ts`, `src/pages/llms.txt.ts`, `tests/unit/llms.test.ts`, `tests/unit/og.test.ts`
- Modify: `src/components/SeoHead.astro` (`og:image`)

**Interfaces:**
- Produces:
  - `paginiConstruite(draft: boolean): { cale: string; titlu: string; descriere: string }[]`, sursa unică pentru imaginile OG, llms.txt și aprobări;
  - `ogPentru(cale: string): string` (`/og/<cale>.png`).

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  test('llms.txt începe cu descrierea fixă și listează serviciile', async () => {
    const t = await llms();
    expect(t.split('\n')[0]).toBe('# Alex Ionescu – consultant SEO și web design, București');
    for (const s of SERVICII) expect(t).toContain(`/servicii/${s.slug}/`);
    expect(t).not.toContain('/proiecte/'); expect(t).not.toContain('/ghiduri/');
  });
  test('imaginea OG are 1200×630', async () => expect(dimensiuni(await og('/'))).toEqual([1200, 630]));
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3: Implementează.**
  - **Imaginile OG** se fac cu satori și resvg. Fontul e static, Atkinson Hyperlegible Next 800 (fișierele `.woff` latin și latin-ext din `@fontsource/atkinson-hyperlegible-next`). Pe imagine apar titlul paginii, „Alex Ionescu, consultant SEO” și linia grupului.
  - **llms.txt** urmează §6.5: secțiunile Proiecte și Ghiduri apar doar dacă există conținut publicabil.
- [ ] **Step 4:** Rulează `npm run test:unit && npm run build`. Rezultat așteptat: PASS, iar fiecare pagină construită are o imagine OG. Verifică în draft că diacriticele ș și ț se văd corect pe o imagine.
- [ ] **Step 5:** Commit: `feat: imaginile OG și llms.txt`.

---

### Task 20: `check:launch`, deploy, README și raportul final

**Files:**
- Create: `src/pages/_intern/aprobari.json.ts`, `scripts/check-launch.mjs`, `scripts/report-final.mjs`, `README.md`, `tests/unit/check-launch.test.ts`
- Modify: `package.json` (`check:launch`, `deploy`, `report`)

**Interfaces:**
- Consumes: `paginiConstruite`, `paginaAprobata`, colecțiile (`aprobat`), `REGISTRU`, `reports/placeholders.json`, `site`.
- Produces: `verificaLansarea({ site, aprobari, marcaje, distHtml }): string[]`, lista de motive de refuz (goală = poate lansa).

- [ ] **Step 1: Scrie testele care pică:**
  ```ts
  test('refuză domeniul provizoriu', () =>
    expect(verificaLansarea(ok({ site: { url: 'https://site-provizoriu.example' } }))).toContain('domeniul e încă provizoriu'));
  test('refuză un marcaj blocant', () =>
    expect(verificaLansarea(ok({ marcaje: [{ fisier: 'x', nr: 15, blocheaza: true }] }))).toContain('marcaj blocant #15 în x'));
  test('acceptă un marcaj neblocant', () =>
    expect(verificaLansarea(ok({ marcaje: [{ fisier: 'x', nr: 6, blocheaza: false }] }))).toEqual([]));
  test('refuză o pagină neaprobată', () =>
    expect(verificaLansarea(ok({ aprobari: { '/': false } }))).toContain('pagină neaprobată: /'));
  test('refuză textul marcajului în dist', () =>
    expect(verificaLansarea(ok({ distHtml: ['<p>[DE COMPLETAT:#4]</p>'] }))).toContain('marcaj în dist/'));
  ```
- [ ] **Step 2:** Rulează `npm run test:unit`. Rezultat așteptat: FAIL.
- [ ] **Step 3: Implementează.**
  - **`aprobari.json.ts`** scrie `dist/_intern/aprobari.json` cu toate rutele construite. `.assetsignore` îl ține afară din upload.
  - **`check-launch.mjs`** rulează `report:placeholders`, citește fișierele și cade cu lista de motive. O pagină din `dist/` care lipsește din `aprobari.json` contează ca neaprobată.
  - **Scripturi:**
    - `"check:launch": "npm run report:placeholders && node scripts/check-launch.mjs"`;
    - `"deploy": "npm run build && npm run check && npm run check:launch && wrangler deploy"`.
- [ ] **Step 4: Scrie `README.md`.**
  - **Comenzi:** `dev`, `preview:draft`, `test:unit`, `test:worker`, `test:e2e`, `qa:page`, `check:links`, `report`.
  - **Cum aprobi o pagină:** câmpul `aprobat` sau intrarea din `src/approvals.ts`.
  - **Pașii lui Alex pentru publicare, în ordine:**
    1. cumpără domeniul;
    2. creează contul Cloudflare pe numele lui;
    3. schimbă nameserverele;
    4. activează Email Routing, verifică `idealserv51@gmail.com` și redirecționează `contact@` spre el;
    5. aplică regulile de zonă din §3.6, una câte una;
    6. pune domeniul real în `site.config.ts`;
    7. rulează `wrangler login`;
    8. rulează `npm run deploy`, doar după ce `check:launch` trece și doar cu acordul lui;
    9. verifică în producție antetele `Set-Cookie`, `/cdn-cgi/` și `data-cfemail`;
    10. configurează Search Console, Bing, IndexNow și Google Business Profile;
    11. face prima măsurare Lighthouse și PageSpeed și o pune în `acest-site.md` (`scoruri`).
  - **Verificarea manuală a schemei** înainte de lansare: Schema Markup Validator pe o pagină de serviciu, un ghid și Despre, plus Rich Results Test pentru BreadcrumbList, Article și ProfilePage (§10).
  - **Varianta cu Resend**, pentru cazul în care Alex își face o căsuță pe domeniu.
  - **Ce chei experimentale s-au folosit**, dacă au fost (de la Task 1).
- [ ] **Step 5: Scrie `report-final.mjs`.** Adună `reports/qa/*.json`, rezultatul linkinator, al schemei și `reports/placeholders.json` în `reports/raport-final.md`, cu un tabel de scoruri pe pagină și lista marcajelor deschise.
- [ ] **Step 6:** Rulează `npm run test:unit && npm run test:worker && npm run test:e2e && npm run check:links && npm run report`. Rezultat așteptat: toate testele PASS și raportul generat. `npm run check:launch` trebuie să **refuze** (domeniu provizoriu, pagini neaprobate, marcajele #1–#4, #13, #15, #17), iar acesta e rezultatul corect până la decizia lui Alex.
- [ ] **Step 7:** Commit: `feat: verificarea de lansare, scriptul de deploy, README și raportul final`.
