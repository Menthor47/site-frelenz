# Metroul îmbunătățit: plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harta de metrou duce vizitatorul de la problema lui la cererea de ofertă: firimiturile ca linie pe telefon, formularul ca traseu, alegătorul din hero-ul de pe Acasă și trei detalii (404, stații vizitate, traseele în cerneală).

**Architecture:** Totul pe componentele existente. Stările vizuale (linia aprinsă, panoul ales, stațiile pline ale formularului) sunt doar CSS, cu `:has()`, deci Acasă nu primește niciun script nou. Singurul cod client nou stă în `src/client/contact-form.ts` (alegerea din link, erorile sub câmp, contorul) și în `src/client/trains.ts` (pornește benzile doar de la 48rem).

**Tech Stack:** Astro 7 (static), CSS scris de mână pe tokenuri, TypeScript strict, Vitest (unit, `render` din `tests/unit/helpers.ts`, cu `experimental_AstroContainer`), Playwright (Chrome; Firefox și WebKit pentru `home.spec.ts`) cu `@axe-core/playwright`.

**Spec:** `docs/superpowers/specs/2026-10-24-metroul-imbunatatit-design.md` (aprobat de Alex pe 2026-10-24), împreună cu specificația principală `docs/superpowers/specs/2026-10-21-site-alex-ionescu-design.md`.

## Global Constraints

- **Nu se face commit.** Alex vrea să vadă rezultatul local întâi. La sfârșitul fiecărui task, `git status --short` arată doar fișierele din blocul **Files** al task-ului (plus cele de dinainte).
- Textele vizibile sunt exact cele din §8 al spec-ului, cu ș și ț cu virgulă (`npm run check` le verifică în `src/` și `dist/`).
- Fără atribute `style` și fără handlere `on*` în HTML (CSP, `tests/unit/shell.test.ts` „fără atribute style”). Culorile vin din tokenuri (`src/styles/tokens.css`).
- Fără scripturi, fonturi sau imagini de pe alte domenii; fără cookie-uri și fără stocare în browser.
- Acasă rămâne cu un singur script executabil (trenurile). `/contact/` rămâne cu două (trenurile din bandă și formularul). Scriptul formularului crește cu cel mult 2 KB.
- Ținte de atingere de cel puțin 44×44px (§5.8); focus vizibil și pe fundalul întunecat; nimic doar în culoare.
- Cu `prefers-reduced-motion: reduce`: fără trenuri, schimbările se fac pe loc.
- Totul merge fără JavaScript; alegătorul de pe Acasă merge și fără `:has()` (formular simplu).
- Fiecare test nou pică întâi pe codul vechi (RED). Testele care citesc regex-uri se scriu cu Write/Edit, nu cu Python din heredoc.
- Pragurile spec-ului: pe `/servicii/seo/` la 375×667 H1-ul se termină la cel mult 300px; pe Acasă la 375×667 butonul „Cere o ofertă” se termină la cel mult 667px; 0 încălcări axe; Lighthouse pe mobil cel puțin 90.

## Review Focus

1. **Înapoi din istoric pe Acasă:** alegi „Site-ul arată învechit”, intri pe pagina serviciului, apeși Înapoi; radio-ul revine bifat și panoul lui trebuie să se vadă (CSS-ul urmează starea), fără două panouri deodată. Test în Task 10.
2. **`?serviciu=` ciudat pe Contact:** `SEO` (litere mari), `seo%20`, `<script>`, doi parametri (`?serviciu=seo&serviciu=audit-seo`): doar o valoare exactă din `CAMPURI.serviciu.optiuni` alege ceva; primul parametru câștigă; restul e ignorat fără eroare. Test în Task 4.
3. **Text mărit la 200% la 320px** pe alegătorul din hero și pe fâșia-linie a firimiturilor, cu cel mai lung nume, „Optimizare AEO și GEO”: fără derulare orizontală, etichetele se rup, țintele rămân de 44px. Teste în Task 1 și Task 10.
4. **Mesajul la limită:** text lipit peste 3000 de caractere (browserul îl taie prin `maxlength`) și rânduri noi: contorul arată exact `value.length` (3000 / 3000), iar un rând nou contează ca un caracter, ca la Worker. Test în Task 4.
5. **Tableta rotită:** banda paginilor interioare pornește la 375px fără trenuri; când fereastra trece de 48rem, trenurile pornesc și butonul „Oprește trenurile” apare; înapoi sub prag, trenurile se opresc. Test în Task 2.

---

## Faza 1: paginile interioare pe telefon (spec §5)

### Task 1: Firimiturile ca linie și banda ascunsă sub 48rem

**Files:**
- Modify: `src/components/Breadcrumbs.astro` (stilurile)
- Modify: `src/styles/metro.css` (banda ascunsă sub 48rem)
- Create: `src/styles/linie-statii.css` (linia cu stații, folosită și de 404 în Task 11)
- Test: `tests/e2e/telefon.spec.ts` (nou), `tests/e2e/salt.spec.ts`

**Interfaces:**
- Produces: clasa globală `.linie-statii` (pe un `ol`/`ul`, cu `li` ca stații și `[aria-current="page"]` ca stația mare), cu variantele `.linie-statii--noapte` (fâșia întunecată) și `.linie-statii--cerneala` (pe alb). Culoarea liniei vine din `--culoare-linie`.

- [ ] **Step 1: Scrie testele care pică** în `tests/e2e/telefon.spec.ts`, la `page.setViewportSize({ width: 375, height: 667 })`:
  - `'/servicii/seo/: banda e ascunsă, firimiturile sunt linia, H1-ul se termină sub 300px'`: `expect(page.locator('.banda')).toBeHidden()`; `nav[aria-label="Firimituri"] ol` are clasa `linie-statii`; `(await page.locator('h1').boundingBox())!.y + height <= 300`.
  - `'/servicii/seo/: stația curentă e „SEO”, linkurile au 44px'`: `[aria-current="page"]` are textul `SEO`; `zoneAtingereMici(page)` e `[]`.
  - `'/despre/: linia e gri (fără grup)'`: culoarea calculată a liniei (`getComputedStyle(ol, '::before').backgroundColor`) e `--noapte-text-2` (`rgb(167, 176, 190)`).
  - `'la 768px, banda și firimiturile ca azi'`: `.banda` vizibilă, `ol` fără fâșia întunecată (fundalul calculat al `nav` e transparent).
  - `'text la 200%, 320px: fără derulare orizontală pe /servicii/optimizare-aeo-geo/'`: `textMarit(page)` apoi `faraDerulareOrizontala(page)` e `true`.
  - În `tests/e2e/salt.spec.ts`: același test de salt pentru `/servicii/seo/`, la 375×667 (Tab, Enter, Tab ajunge la primul link din firimituri).
- [ ] **Step 2: Rulează** `npx playwright test tests/e2e/telefon.spec.ts --project=chrome`. Expected: FAIL (banda vizibilă, H1 la ~415px).
- [ ] **Step 3: Implementează.** În `Breadcrumbs.astro`, `ol` primește clasa `linie-statii linie-statii--noapte`; stilurile fâșiei se aplică doar sub `@media (max-width: 47.98rem)`; peste prag, firimiturile arată ca azi. `--culoare-linie` vine din grupul paginii: `Base.astro` pune `data-grup={harta?.line}` pe containerul firimiturilor (grupul e deja în `harta.line`). Pe fâșia întunecată se folosesc culorile deschise, ca în subsol (`Footer.astro`): vizibilitate `--blue-light`, diagnostic `--green`, construcție `--yellow`, reparație `--red`, nu `--culoare` din `tokens.css` (galbenul închis n-ar avea 3:1 pe `--noapte`); fără grup, `--noapte-text-2`. Stația curentă: cerc `--blue` cu inel `--paper` (ca `.harta__aici`), eticheta în `--noapte-text`, 700; linkurile `--blue-light`. Etichetele stau sub stații și se rup. În `metro.css`, sub `47.98rem`: `.banda { display: none; }`. `linie-statii.css` se importă din `Breadcrumbs.astro`.
- [ ] **Step 4: Rulează** testele din Step 1 și `npx playwright test tests/e2e/salt.spec.ts`. Expected: PASS.
- [ ] **Step 5: Fără commit.** `git status --short` arată doar fișierele de mai sus.

### Task 2: Trenurile benzii pornesc doar de la 48rem

**Files:**
- Modify: `src/client/trains.ts`
- Test: `tests/e2e/telefon.spec.ts`

**Interfaces:**
- Consumes: `createTrainController` (neschimbat), `initTrains(root: HTMLElement): void` (aceeași semnătură).

- [ ] **Step 1: Scrie testele care pică:**
  - `'375px, /servicii/seo/: trenurile benzii nu pornesc'`: `trenuriInMiscare(page)` e `false`; `.harta--banda .harta__buton` e ascuns.
  - `'375px, Acasă: trenurile hărții de pe Acasă merg ca azi'`: `trenuriInMiscare(page)` e `true`.
  - `'tableta rotită: de la 375 la 800px trenurile pornesc, înapoi la 375 se opresc'`: `setViewportSize` 375 → 800 → 375, cu `trenuriInMiscare` `false` → `true` → `false`.
- [ ] **Step 2: Rulează.** Expected: FAIL la primul și al treilea test.
- [ ] **Step 3: Implementează** în `initTrains`: pentru `root.classList.contains('harta--banda')`, pornirea (legarea butonului, `buton.hidden = false`, `beginElement()` o singură dată) se face doar cât `matchMedia('(min-width: 48rem)')` se potrivește; la `change` sub prag, `trenuri.visibility(false)` și butonul se ascunde; peste prag, `visibility(true)` și butonul apare. Harta de pe Acasă (`harta--pe-acasa`) nu e afectată. Actualizează comentariul de sus al fișierului.
- [ ] **Step 4: Rulează** `npx playwright test tests/e2e/telefon.spec.ts tests/e2e/home.spec.ts`. Expected: PASS.
- [ ] **Step 5: Fără commit.**

### Task 3: Pasul 1 are acțiune pe paginile de serviciu

**Files:**
- Modify: `src/components/PasiTraseu.astro`, `src/layouts/Service.astro`
- Test: `tests/unit/pasi-traseu.test.ts`, `tests/unit/service-page.test.ts`

**Interfaces:**
- Produces: prop nou `PasiTraseu` → `actiunePrimulPas?: { text: string; href: string } | undefined`. Linkul stă în primul `li`, după text, cu săgeata `→` într-un `<span aria-hidden="true">`.

- [ ] **Step 1: Scrie testele care pică:**
  - `pasi-traseu.test.ts`: `'actiunePrimulPas pune linkul doar în primul pas'` (primul `li` conține `<a href="/contact/?serviciu=seo">Trimite cererea`; celelalte `li` n-au `<a`); `'fără actiunePrimulPas, niciun link'`.
  - `service-page.test.ts`: `test.each(SLUGURI)('%s: pasul 1 duce la /contact/?serviciu=<slug>')`.
- [ ] **Step 2: Rulează** `npx vitest run tests/unit/pasi-traseu.test.ts tests/unit/service-page.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementează** prop-ul în `PasiTraseu.astro` (link subliniat, pe rând propriu, 44px înălțime, culoarea `--blue-dark`). În `Service.astro`: `actiunePrimulPas={{ text: 'Trimite cererea', href: `/contact/?serviciu=${s.slug}` }}`.
- [ ] **Step 4: Rulează** testele din Step 1 și `npm run check:links` după `npm run build`. Expected: PASS.
- [ ] **Step 5: Fără commit.**

## Faza 2: Contact (spec §4)

### Task 4: Funcțiile pure ale formularului

**Files:**
- Modify: `src/client/contact-form.ts`
- Test: `tests/unit/contact-client.test.ts`

**Interfaces:**
- Produces (exportate din `src/client/contact-form.ts`):
  - `serviciuDinCautare(cautare: string, optiuni: readonly string[]): string | undefined` — primul `serviciu` din `URLSearchParams`, doar dacă e exact în `optiuni`.
  - `type CampCuMesaj = 'nume' | 'email' | 'mesaj'`
  - `mesajEroare(camp: CampCuMesaj, v: { valueMissing: boolean; typeMismatch: boolean }, linkuri?: number): string | undefined` — textele din §8.
  - `textContor(valoare: string, maxCaractere: number, maxLinkuri: number): string` — `` `${valoare.length} / ${maxCaractere} caractere · ${countLinks(valoare)} / ${maxLinkuri} linkuri` ``.
- Consumes: `countLinks` din `worker/links.ts`.

- [ ] **Step 1: Scrie testele care pică:**
  - `serviciuDinCautare`: `'?serviciu=redesign-site'` → `'redesign-site'`; `'?serviciu=nu-stiu'` → `'nu-stiu'`; `'?serviciu=SEO'`, `'?serviciu=seo%20'`, `'?serviciu=%3Cscript%3E'`, `''` → `undefined`; `'?serviciu=seo&serviciu=audit-seo'` → `'seo'`.
  - `mesajEroare`: `('nume', { valueMissing: true, ... })` → `'Scrie-ți numele.'`; `('email', valueMissing)` → `'Scrie-ți adresa de e-mail, ca să-ți pot răspunde.'`; `('email', typeMismatch)` → `'Adresa de e-mail pare incompletă. Verific-o, de exemplu nume@firma.ro.'`; `('mesaj', valueMissing)` → `'Scrie-mi pe scurt ce te încurcă la site.'`; `('mesaj', valid, 4)` → `'Mesajul are mai mult de 3 linkuri. Scoate câteva și trimite din nou.'`; valid și 3 linkuri → `undefined`.
  - `textContor`: `('', 3000, 3)` → `'0 / 3000 caractere · 0 / 3 linkuri'`; `('a\nb https://x.ro www.y.ro', 3000, 3)` → `'25 / 3000 caractere · 2 / 3 linkuri'`; `('x'.repeat(3000), 3000, 3)` → începe cu `'3000 / 3000'`.
- [ ] **Step 2: Rulează** `npx vitest run tests/unit/contact-client.test.ts`. Expected: FAIL (funcții lipsă).
- [ ] **Step 3: Implementează** cele trei funcții. Pragul de linkuri vine din parametru (apelantul dă `CAMPURI.mesaj.maxLinkuri`), nu e scris în funcție. Actualizează comentariul de sus („importă doar `worker/links.ts`, o funcție pură”).
- [ ] **Step 4: Rulează** testele. Expected: PASS.
- [ ] **Step 5: Fără commit.**

### Task 5: Formularul în trei stații, cu linia doar din CSS

**Files:**
- Modify: `src/components/ContactForm.astro`
- Test: `tests/unit/contact-form.test.ts`, `tests/e2e/contact.spec.ts`

**Interfaces:**
- Produces (markup pentru Task 6): fiecare câmp cu mesaj are `<p class="formular__eroare-camp" id="formular-<nume>-eroare" hidden>`; contorul e `<p class="formular__contor" id="formular-mesaj-contor" aria-live="off">`; câmpurile sunt în `fieldset.formular__statie` (al doilea cu și clasa `formular__statie--optionala`); fiecare `<option>` de serviciu are `data-grup`.

- [ ] **Step 1: Scrie testele care pică:**
  - unit: `'trei fieldset-uri, cu legendele din spec'` (`1. Cine ești`, `2. Site-ul tău (opțional)`, `3. Ce te încurcă`); `'fiecare câmp stă în fieldset-ul lui'` (nume, email, telefon, firma | site, serviciu | mesaj); `'capătul liniei: Destinația: oferta ta, lângă buton'`; `'opțiunile de serviciu au data-grup din SERVICII'`; `'elementele de eroare există și sunt ascunse'`. Testele existente (ordinea câmpurilor, regulile, capcana) rămân verzi.
  - e2e: `'stația 1 se umple după Nume și E-mail valide'` (fundalul calculat al bulinei din legenda 1 se schimbă după `fill`); `'linia ia culoarea grupului ales'` (alegi `redesign-site` → culoarea liniei e `--red`); `'pe un card îngust, linia verticală dispare'` (la 375px, `::before` al formularului are `display: none`).
- [ ] **Step 2: Rulează** testele. Expected: FAIL.
- [ ] **Step 3: Implementează** fieldset-urile (fără chenarul implicit, legenda cu bulina în `::before`), linia verticală (`.formular::before`, pe stânga, culoarea `--culoare-linie`, implicit `--ink`), regulile `:has()`: bulina plină pentru `fieldset.formular__statie:has(:required):not(:has(:invalid))`; câte o regulă pe grup pentru `.formular:has(option[data-grup="<grup>"]:checked)`; sub `@container (max-width: 36rem)` linia dispare. Grila pe două coloane rămâne în interiorul fiecărui fieldset.
- [ ] **Step 4: Rulează** `npx vitest run tests/unit/contact-form.test.ts` și `npx playwright test tests/e2e/contact.spec.ts`. Expected: PASS.
- [ ] **Step 5: Fără commit.**

### Task 6: Alegerea din link, erorile sub câmp și contorul

**Files:**
- Modify: `src/client/contact-form.ts` (`initFormular`)
- Test: `tests/e2e/contact.spec.ts`

**Interfaces:**
- Consumes: funcțiile din Task 4; markup-ul din Task 5; `CAMPURI` din `src/form-rules.ts`.

- [ ] **Step 1: Scrie testele care pică** (fără cereri reale la Worker: `page.on('request')` numără cererile spre `/api/contact`):
  - `'?serviciu=redesign-site alege serviciul'`; `'?serviciu=xyz e ignorat, lista rămâne pe Alege un serviciu'`.
  - `'trimiterea goală arată mesajele în română și mută focusul pe Nume'` (cele trei mesaje vizibile; `#formular-nume` are `aria-invalid="true"` și `aria-describedby` conține `formular-nume-eroare`; focus pe `#formular-nume`; 0 cereri).
  - `'mesajul dispare când câmpul devine valid'`.
  - `'4 linkuri: mesajul apare sub Mesaj, focusul pe Mesaj, 0 cereri'`.
  - `'contorul urmează textul'` (după `fill('a\nb')` arată `3 / 3000 caractere · 0 / 3 linkuri`).
  - `'fără JavaScript, totul ca azi'`: în contextul `javaScriptEnabled: false`, `?serviciu=seo` lasă lista goală și formularul n-are `novalidate`.
- [ ] **Step 2: Rulează** `npx playwright test tests/e2e/contact.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implementează** în `initFormular`: la pornire, `formular.noValidate = true`, alegerea din `serviciuDinCautare(location.search, CAMPURI.serviciu.optiuni)`, contorul (`input` pe Mesaj). La `submit`, înainte de `fetch`: pentru `nume`, `email`, `mesaj`, `mesajEroare(...)` din `validity` (și `countLinks` pentru Mesaj); dacă există erori, se scriu, se pun `aria-invalid` și `aria-describedby` (păstrând nota existentă de la Mesaj), focus pe primul câmp cu eroare, fără trimitere. La `input`, mesajul câmpului dispare când `mesajEroare` dă `undefined`. Restul (trimiterea, „Se trimite…”, explicațiile de sub buton, `pageshow`) rămâne.
- [ ] **Step 4: Rulează** testele și verifică mărimea: scriptul inline din `dist/contact/index.html` crește cu cel mult 2048 de octeți față de build-ul de dinainte de Task 4.
- [ ] **Step 5: Fără commit.**

### Task 7: „Am primit cererea ta”, cu Destinație și Ce urmează

**Files:**
- Modify: `src/pages/contact/multumim.astro`
- Test: `tests/e2e/contact.spec.ts` (testul paginilor de răspuns); `tests/unit/iconite-pagini.test.ts` randează pagina și trebuie să rămână verde

**Interfaces:** niciuna nouă.

- [ ] **Step 1: Schimbă testul** paginilor de răspuns: pentru `/contact/multumim/`, textul așteptat devine `Lucrul începe doar după ce accepți oferta`; nou: `'multumim: lista Ce urmează are trei opriri'` (`ol` cu 3 `li`, în ordinea: „Mă uit la site-ul tău și la ce mi-ai scris.”, „Îți trimit oferta: ce lucrez, în ce ordine și ce primești.”, „Lucrul începe doar după ce accepți oferta.”); pagina tot n-are `.harta`.
- [ ] **Step 2: Rulează.** Expected: FAIL.
- [ ] **Step 3: Implementează:** sub H1, desenul liniei care se termină în stația „Destinație” (SVG `aria-hidden`, clasa `destinatie`, nu `harta`), titlul „Ce urmează” (`h2`) și lista; paragraful cu linkurile spre Cum lucrez și Acasă rămâne.
- [ ] **Step 4: Rulează** testele. Expected: PASS.
- [ ] **Step 5: Fără commit.**

## Faza 3: Acasă (spec §3)

### Task 8: „Ești aici” pe fiecare linie a hărții de pe Acasă

**Files:**
- Modify: `src/components/MetroMap.astro`
- Test: `tests/unit/metro-map.test.ts`

**Interfaces:**
- Produces: pe `variant="animated"`, câte un `<g class="harta__aici-grup" data-linie="M1|M2|M3|M4">` cu cercul `.harta__aici` și `text.harta__eticheta` („Ești aici”), la `TRASEE[i].aici` și `eticheta` (ca pe bandă); ascunse implicit din CSS.

- [ ] **Step 1: Scrie testele care pică:** `'harta de pe Acasă are câte un Ești aici ascuns pe fiecare linie'` (4 grupuri, câte unul pe `data-linie`, la coordonatele din `TRASEE`); `'banda și harta statică rămân cu un singur Ești aici, pe linia plină'` (neschimbat).
- [ ] **Step 2: Rulează** `npx vitest run tests/unit/metro-map.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementează** grupurile în `MetroMap.astro` și regula `.harta--pe-acasa .harta__aici-grup { display: none; }` în `metro.css`.
- [ ] **Step 4: Rulează.** Expected: PASS.
- [ ] **Step 5: Fără commit.**

### Task 9: Alegătorul „De unde pornești?” în hero

**Files:**
- Create: `src/components/AlegatorTraseu.astro`
- Modify: `src/pages/index.astro`
- Delete: `src/components/LineDiagram.astro` și blocul `describe('LineDiagram')` din `tests/unit/blocks.test.ts`
- Test: `tests/unit/alegator-traseu.test.ts` (nou), `tests/unit/home.test.ts`

**Interfaces:**
- Produces: `AlegatorTraseu` cu prop-ul `randuri: readonly { slug: string; nume: string; grup: Grup; eticheta: string; pasi: readonly string[] }[]`. Markup: `form.alegator[data-alegator][method="get"][action="/contact/"]` → `fieldset` → `legend` cu `<h2 id="de-unde-pornesti">De unde pornești?</h2>` → șase `label` cu `input[type=radio][name="serviciu"][value=<slug>][data-linie=<LINIA_GRUPULUI[grup]>]`; `button.alegator__trimite-general[type=submit]` („Cere o ofertă”); câte un `div.alegator__panou[data-serviciu=<slug>]` cu `h3` „Traseul tău: <nume>”, `PasiTraseu` cu `orizontal`, `button[type=submit]` „Cere oferta pentru <nume>” și `a[href="/servicii/<slug>/"]` „Vezi pagina <nume>” + săgeata ascunsă. Linia din panou poartă clasa `vt-<slug>`.
- Consumes: `PasiTraseu` (cu `orizontal`), `LINIA_GRUPULUI`, `cereServiciu`.

- [ ] **Step 1: Scrie testele care pică:**
  - `alegator-traseu.test.ts`: `'șase radio-uri, cu valorile și ordinea din SERVICII'`; `'fiecare radio are data-linie din LINIA_GRUPULUI'`; `'etichetele sunt cele din spec'` (cele șase texte din §8, exact); `'un panou pe serviciu, cu pașii din colecție, butonul și linkul spre pagina serviciului'`; `'formularul trimite GET la /contact/'`; `'legenda conține H2-ul De unde pornești?'`; `'butonul general există (pentru browserele fără :has())'`.
  - `home.test.ts`: `'„De unde pornești?” stă în hero, nu mai e un card pe suprafață'` (înlocuiește testul vechi); `'Acasă nu mai are .linie-rand'`.
- [ ] **Step 2: Rulează** `npx vitest run tests/unit/alegator-traseu.test.ts tests/unit/home.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementează** componenta și pune-o în `index.astro`, în `.acasa-sus`, după `<MetroMap variant="animated" />` (ordinea focusului rămâne „Cere o ofertă”, „Oprește trenurile”, apoi alegătorul), pe coloana `text` a grilei. Etichetele stau într-un `const ETICHETE: Readonly<Record<string, string>>` în `index.astro`, cu textele din §8; `randuri` se construiesc din colecția `servicii` (`pasi`, `grup`, `slug`) și `cereServiciu(...).nume`. Scoate secțiunea `aria-labelledby="de-unde-pornesti"`, importul și componenta `LineDiagram`.
- [ ] **Step 4: Rulează** `npm test`. Expected: PASS (inclusiv `servicii-index.test.ts` „nu repetă De unde pornești”).
- [ ] **Step 5: Fără commit.**

### Task 10: Stările alegătorului, doar din CSS

**Files:**
- Modify: `src/components/AlegatorTraseu.astro` (stilurile), `src/styles/metro.css`, `src/styles/transitions.css` (dacă regulile `vt-` cer ajustări)
- Modify: `tests/e2e/home.spec.ts`, `tests/e2e/helpers.ts` (`ZONE_DE_ATINGERE`: `'.linie-rand a'` → `'.alegator label'`)
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: markup-ul din Task 8 și Task 9 (`data-alegator`, `data-linie`, `data-serviciu`, `.harta__aici-grup`).

- [ ] **Step 1: Scrie testele care pică** în `home.spec.ts` (rulează și în Firefox și WebKit):
  - `'alegerea aprinde linia ei și le estompează pe celelalte'`: după `check()` pe „Site-ul arată învechit”, opacitatea calculată a `.harta__linie[data-linie="M3"]` e `1`, a celorlalte `0.35`; `.harta__aici-grup[data-linie="M3"]` e vizibil.
  - `'se vede doar panoul serviciului ales, cu butonul spre /contact/?serviciu=redesign-site'` (clic pe buton → URL-ul conține `serviciu=redesign-site`).
  - `'merge doar trenul liniei alese'`: `.tren[data-linie="M3"]` vizibil, celelalte ascunse.
  - `'tastatura: săgețile schimbă alegerea'`.
  - `'Înapoi din pagina serviciului păstrează alegerea și panoul ei'` (Review Focus 1: alegi, apeși linkul „Vezi pagina”, `goBack()`, panoul `redesign-site` vizibil, celelalte ascunse).
  - `'375×667: butonul Cere o ofertă se termină deasupra pliului; linia M1 aleasă se vede pe telefon'`.
  - `'reduced motion: fără trenuri, alegerea merge'`.
  - `'text la 200%, 320px: alegătorul nu derulează orizontal'` (Review Focus 3).
  - `'cu :has() presupus lipsă: butonul general e în pagină'` (verifică markup-ul; regula `@supports` care îl ascunde există în CSS-ul paginii).
  - Înlocuiește testele vechi ale rândurilor (`la 768px, problema și capătul…`, `cuvintele cu cratimă din „De unde pornești?”…`); testul tranziției M3 verifică acum linia din panou (`vt-<slug>` → `view-transition-name: segment-<slug>`).
- [ ] **Step 2: Rulează** `npx playwright test tests/e2e/home.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implementează** în `@supports selector(:has(*))`: câte o regulă pe linie (M1–M4) pentru `[data-alegator]` ales → liniile celelalte la `opacity: 0.35`, `.harta__aici-grup` al liniei vizibil, `.tren` al celorlalte linii ascunse, linia aleasă vizibilă și sub 640px; câte o regulă pe slug pentru panou (`input[value="<slug>"]:checked` → `.alegator__panou[data-serviciu="<slug>"]` vizibil); butonul general ascuns. Regulile care leagă alegătorul de hartă stau în `metro.css`, cu selectorul `.acasa-sus:has([data-alegator] input[data-linie="M?"]:checked)`. Aspectul etichetelor: chenar `--noapte-text-2` de 1px, ales: chenar 2px în culoarea liniei, bulina „●” înaintea textului.
- [ ] **Step 4: Rulează** `npx playwright test tests/e2e/home.spec.ts` (toate trei browserele) și `npm test`. Expected: PASS.
- [ ] **Step 5: Fără commit.**

## Faza 4: detaliile mici (spec §6)

### Task 11: 404 cu linia paginilor principale

**Files:**
- Modify: `src/pages/404.astro`
- Test: `tests/unit/shell.test.ts` (importă deja `Pagina404`) și `tests/e2e/telefon.spec.ts`

**Interfaces:**
- Consumes: `.linie-statii` și `.linie-statii--cerneala` din Task 1.

- [ ] **Step 1: Scrie testele care pică:** `'404: fraza și cele cinci stații, în ordinea meniului'` (textul „Ai coborât la o stație care nu e pe hartă. Alege una de mai jos.”; linkurile `/`, `/servicii/`, `/cum-lucrez/`, `/despre/`, `/contact/`, într-o listă cu clasa `linie-statii linie-statii--cerneala`); `'stația ruptă e aria-hidden'`; e2e `'404 la 320px: fără derulare orizontală, linkuri de 44px'`.
- [ ] **Step 2: Rulează.** Expected: FAIL.
- [ ] **Step 3: Implementează:** fraza sub paragraful existent, lista cu cinci linkuri în locul celei cu trei, stația „?” ca SVG `aria-hidden`, legată punctat de linie.
- [ ] **Step 4: Rulează.** Expected: PASS.
- [ ] **Step 5: Fără commit.**

### Task 12: Stații vizitate pe cardurile de proiect

**Files:**
- Modify: `src/components/ProiecteRezumat.astro`, `src/pages/index.astro` (titlul secțiunii), `src/pages/proiecte/[...lista].astro` (dă câmpurile noi)
- Test: `tests/unit/proiecte-rezumat.test.ts`

**Interfaces:**
- Produces: prop-ul fiecărui proiect primește `servicii: readonly string[]` și `serviciiDeConfirmat?: string | undefined`. Traseul e un `ul.proiect__traseu` cu câte un `li[data-grup]` pe serviciu, cu numele serviciului (din `cereServiciu`).

- [ ] **Step 1: Scrie testele care pică:** `'traseul arată serviciile proiectului, în ordinea lor, cu numele scris'`; `'cu serviciiDeConfirmat, traseul lipsește în producție și apare marcajul în previzualizare'` (ca regula din `Faq`/`LegalId`); `'Acasă: titlul secțiunii e Proiecte: stații vizitate'`.
- [ ] **Step 2: Rulează** `npx vitest run tests/unit/proiecte-rezumat.test.ts tests/unit/home.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implementează** traseul (segmentele în `--culoare` din `data-grup`, stațiile albe cu contur `--ink`, numele sub segment în `--culoare-text`) și dă câmpurile din cele două pagini.
- [ ] **Step 4: Rulează.** Expected: PASS.
- [ ] **Step 5: Fără commit.**

### Task 13: Traseele în cerneală

**Files:**
- Modify: `src/components/RouteMap.astro`, `src/components/PasiTraseu.astro` (varianta `comuna`), `src/pages/cum-lucrez.astro` (rândurile 163 și 167, legenda formatelor)
- Test: `tests/unit/blocks.test.ts` (RouteMap), `tests/e2e/culori.spec.ts`

**Interfaces:** niciuna nouă. Varianta `comuna` din `PasiTraseu` devine o linie în cerneală (fără `--culoare-2`).

- [ ] **Step 1: Scrie testele care pică:** unit `'RouteMap nu folosește culorile grupurilor'` (nici `--yellow-dark`, nici `--blue` în stilurile componentei; `.bucla` are `border-style: dashed`); e2e `'traseele de pe Acasă și din Cum lucrez sunt în --ink'` (culoarea calculată a liniilor `rgb(20, 22, 26)`; bucla punctată).
- [ ] **Step 2: Rulează.** Expected: FAIL.
- [ ] **Step 3: Implementează:** `--culoare: var(--ink)` pentru ambele trasee; capătul remedierii unice e o stație plină; bucla abonamentului e punctată; legenda din `cum-lucrez.astro` deosebește linia plină de cea punctată; `comuna` din `PasiTraseu` e o singură linie în cerneală. Actualizează comentariile care pomenesc #8A5A00 și albastrul.
- [ ] **Step 4: Rulează** `npm test` și `npx playwright test tests/e2e/culori.spec.ts`. Expected: PASS.
- [ ] **Step 5: Fără commit.**

## Încheiere

### Task 14: Spec-ul principal și verificarea întreagă

**Files:**
- Modify: `docs/superpowers/specs/2026-10-21-site-alex-ionescu-design.md` (deciziile 31–34 din §10 al spec-ului nou și secțiunile pe care le refac), `docs/superpowers/specs/2026-10-24-metroul-imbunatatit-design.md` (starea: implementat, necommitat)

- [ ] **Step 1: Adaugă deciziile 31–34** în tabelul de decizii, cu textul din §10, și marchează în deciziile 4, 20, 28 și 30 ce refac.
- [ ] **Step 2: Rulează** `npm run verify`. Expected: 0 erori la `astro check`, toate testele unitare și ale Worker-ului trec, build-ul face 18 pagini, `check` și `check:links` trec.
- [ ] **Step 3: Rulează** `npm run test:e2e`. Expected: toate trec, în Chrome, Firefox și WebKit.
- [ ] **Step 4: Rulează** `npm run qa:page -- /`, `/servicii/seo/`, `/contact/`, `/contact/multumim/`, `/cum-lucrez/`, `/404/`. Expected: axe 0, Lighthouse pe mobil cel puțin 90 la fiecare categorie, fără derulare la 320px.
- [ ] **Step 5: Pornește site-ul local pentru Alex** (`npm run preview`, `http://localhost:8787`) și reconstruiește apoi `dist/` de producție (`npm run build`). **Fără commit**: Alex se uită local și decide.
