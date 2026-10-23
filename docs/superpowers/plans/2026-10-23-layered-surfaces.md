# Suprafețe stratificate: plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conținutul de sub banda de sus primește un fundal ușor rece, iar secțiunile de conținut devin carduri albe cu contur fin, fără să se schimbe textul, ordinea informației sau comportamentul formularului.

**Architecture:** Un tokenul de fundal și un card global (`.carte`) în `base.css`; un prop `suprafata` în `Base.astro` care pune `main--suprafata` doar pe paginile cu bandă. Fiecare pagină își aplică cardurile pe propriile secțiuni. Grila Servicii și Despre și formularul de contact se fac în CSS, fără markup nou în afară de clase și un bloc de profil.

**Tech Stack:** Astro 7, CSS scris de mână pe tokenuri, Vitest (unit, `experimental_AstroContainer` prin `tests/unit/helpers.ts`), Playwright cu Chrome și `@axe-core/playwright`.

**Spec:** `docs/superpowers/specs/2026-10-23-layered-surfaces-design.md` (designul aprobat), împreună cu specificația principală `docs/superpowers/specs/2026-10-21-site-alex-ionescu-design.md`.

## Global Constraints

- Tokenuri, exact: `--suprafata: #E9EEF5`, `--card: #FFFFFF`, `--card-contur: #D5DCE6`.
- Card: `border: 1px solid var(--card-contur)`, `border-radius: 0`, fără `box-shadow`, `padding: 1.5rem` sub `48rem` și `2rem` de la `48rem` în sus, distanța dintre carduri `1.5rem`.
- `main--suprafata` apare doar pe paginile construite cu `Base` și cu `suprafata={true}`. Paginile legale, 404 și paginile de răspuns rămân pe alb.
- Nu se adaugă JavaScript nou. Pe pagina de contact rămâne un singur script executabil: cel al trenurilor din bandă (decizia 28).
- Validarea formularului, atributele din `src/form-rules.ts`, numele și ordinea câmpurilor în DOM rămân neschimbate.
- Textul paginilor nu se schimbă. Singura excepție, răspunsul la „Afișezi prețuri?”, nu se atinge până aprobă Alex (D5).
- Contrast: ink `#14161A` pe `--suprafata` are cel puțin 15:1, iar pe `--card` cel puțin 15:1 (WCAG 2.1 AA: 4,5:1 pentru text).
- Nu se face commit. Repository-ul cere commit doar la cerere; modificările rămân necommitate.

## Review Focus

1. **Formularul de contact la 200% text, pe desktop.** Grila pe două coloane trebuie să treacă pe o coloană când cardul e îngust. Testul: `text mărit la 200% pe /contact/: câmpurile nu se suprapun, fără derulare orizontală` (Task 7).
2. **Nume lungi de servicii și cuvinte lungi la 320px.** Cardurile din Servicii trebuie să rupă textul, fără derulare orizontală. Testul: `/servicii/ la 320px: fără derulare orizontală` (Task 3).
3. **Despre fără fotografie.** Cardul de profil nu are niciun `<img>` și nicio ramă goală, iar linkul din profil spre datele firmei are destinație reală (`#date-firma` există pe Contact). Testul: `profilul fără <img>, cu linkul spre #date-firma, iar ținta există` (Task 6).
4. **Paginile fără bandă rămân albe.** Paginile legale și 404 nu primesc `main--suprafata`. Testul: `pagina legală nu are main--suprafata` (Task 1).
5. **Titlul ascuns al formularului rămâne eticheta secțiunii.** Titlul „Formularul” e vizual ascuns, dar secțiunea trebuie să fie etichetată de el, iar axe nu raportează nimic. Testul: `axe pe /contact/: fără încălcări, iar secțiunea formularului are nume` (Task 7).

## Deviations from the design doc

- **Servicii:** cele patru secțiuni de linie (Vizibilitate, Diagnostic, Construcție, Reparație) nu sunt carduri, doar grupuri cu titlul lor. Cardurile sunt cele șase articole de serviciu. Motiv: un card în jurul a două carduri dublează structura.
- **Servicii, linkul:** titlul serviciului (un `<a>` spre pagina lui) este singurul link de pe card. Nu se adaugă un al doilea „Vezi serviciul →” spre aceeași adresă.
- **Despre:** regula `.despre > :global(*) { max-width: 34em }` din pagină ar limita grila nouă. Grila primește `max-width: none` după regula aceea, în același bloc `<style>`.
- **Commit:** pașii de commit din șablon se înlocuiesc cu nimic (repository-ul nu comite fără cerere).

---

### Task 1: Tokenuri, card global și prop `suprafata` în Base

**Files:**
- Modify: `src/styles/tokens.css` (adaugă cele trei tokenuri în `:root`)
- Modify: `src/styles/base.css` (adaugă `.main--suprafata` și `.carte`)
- Modify: `src/layouts/Base.astro` (prop `suprafata?: boolean`, default `false`; clasa pe `<main id="continut" tabindex="-1">`)
- Test: `tests/unit/shell.test.ts` (pagina Base), `tests/unit/contrast.test.ts` (perechile de contrast)

**Interfaces:**
- Consumes: nimic din alte sarcini.
- Produces: prop-ul `suprafata` pe `Base` (boolean, default `false`); clasele globale `.main--suprafata` (fundal `var(--suprafata)`) și `.carte` (card). Toate celelalte sarcini îl folosesc.

- [ ] **Step 1: Scrie testele care cad**

În `tests/unit/contrast.test.ts`, adaugă perechile în tabelul `test.each` (lângă perechile existente):

```ts
['--ink', '--suprafata', 4.5],
['--ink', '--card', 4.5],
```

În `tests/unit/shell.test.ts`, lângă testele pentru `Base`, adaugă:

```ts
test('suprafata=true pune main--suprafata pe main; implicit, main nu o are', async () => {
  expect(main(await pagina({ suprafata: true }))).toContain('class="main--suprafata"');
  expect(main(await pagina())).not.toContain('main--suprafata');
});
```

Dacă helperul `pagina` nu trece prop-urile mai departe, adaugă `suprafata` la tipul lui și la wrapper-ul care randează `Base`.

- [ ] **Step 2: Rulează testele, să vezi că cad**

Run: `npx vitest run tests/unit/shell.test.ts tests/unit/contrast.test.ts`
Expected: FAIL la `main--suprafata` și, pentru contrast, la tokenul `--suprafata` care lipsește din `tokens.css`.

- [ ] **Step 3: Implementează**

În `tokens.css`, în `:root`, adaugă exact:

```css
  --suprafata: #E9EEF5;
  --card: #FFFFFF;
  --card-contur: #D5DCE6;
```

În `base.css`, după regulile pentru `.contener`, adaugă:

```css
.main--suprafata {
  background: var(--suprafata);
}

/* Cardul din §5.2 al designului 2026-10-23: alb, cu contur de 1px, fără umbră și fără colțuri rotunjite. */
.carte {
  background: var(--card);
  border: 1px solid var(--card-contur);
  padding: 1.5rem;
}

@media (min-width: 48rem) {
  .carte {
    padding: 2rem;
  }
}
```

În `Base.astro`, adaugă `suprafata?: boolean` în `Props` (cu un comentariu care spune că e pe paginile cu bandă), dă `suprafata = false` la destructurare și pune pe `<main>`:

```astro
<main id="continut" tabindex="-1" class:list={[suprafata && 'main--suprafata']}>
```

- [ ] **Step 4: Rulează testele, să vezi că trec**

Run: `npx vitest run tests/unit/shell.test.ts tests/unit/contrast.test.ts`
Expected: PASS.

Verificare pentru pagina legală (Review Focus 4): adaugă în `shell.test.ts` un test care randează o pagină legală (`src/pages/politica-cookies.astro` sau un layout `Legal`) și verifică `not.toContain('main--suprafata')`. Expected: PASS fără alte modificări.

---

### Task 2: Acasă — „De unde pornești?” și întrebările frecvente ca carduri

**Files:**
- Modify: `src/pages/index.astro` (prop `suprafata` pe `Base`; secțiunile `de-unde-pornesti` și `intrebari` primesc `acasa-sectiune--carte`, iar containerul din interior primește `carte`)
- Test: `tests/unit/home.test.ts` (fișier nou, același model ca `tests/unit/servicii-index.test.ts`: mock `astro:content` cu serviciile din `src/content/servicii`)

**Interfaces:**
- Consumes: `Base` cu prop-ul `suprafata` și clasa `.carte` (Task 1).
- Produces: nimic pentru alte sarcini.

Traseele (`acasa-trasee`) și banda albastră de la final nu devin carduri. Banda de sus rămâne neschimbată.

- [ ] **Step 1: Scrie testele care cad**

În `tests/unit/home.test.ts`:

```ts
test('„De unde pornești?” e un card pe suprafață', async () => {
  const h = await render(PaginaAcasa);
  expect(h).toContain('class="main--suprafata"');
  expect(h).toMatch(/<section[^>]*aria-labelledby="de-unde-pornesti"[^>]*>[\s\S]*?<div class="contener carte">/);
});

test('întrebările frecvente sunt un card, iar traseele rămân pe fundalul lor', async () => {
  const h = await render(PaginaAcasa);
  expect(h).toMatch(/<section[^>]*aria-labelledby="intrebari"[^>]*>[\s\S]*?<div class="contener carte">/);
  expect(h).not.toMatch(/acasa-trasee[^>]*>[\s\S]*?class="contener carte"/);
});
```

- [ ] **Step 2: Rulează, să vezi că cad**

Run: `npx vitest run tests/unit/home.test.ts`
Expected: FAIL (nu există clasele).

- [ ] **Step 3: Implementează**

În `index.astro`:
- `<Base ... suprafata={true}>`.
- La secțiunea `de-unde-pornesti`: adaugă `acasa-sectiune--carte` la `class`; în interior, `<div class="contener">` devine `<div class="contener carte">`.
- La secțiunea `intrebari`: la fel.
- În `<style>`, după `.acasa-sectiune { padding-block: 3.5rem; }`, adaugă `.acasa-sectiune--carte { padding-block: 1.5rem; }`. Regula vine după, deci câștigă cu aceeași specificitate.

- [ ] **Step 4: Rulează, să vezi că trec**

Run: `npx vitest run tests/unit/home.test.ts`
Expected: PASS.

Verificare vizuală se face în Task 8, nu aici.

---

### Task 3: Servicii — șase carduri în grilă

**Files:**
- Modify: `src/pages/servicii/index.astro` (prop `suprafata` pe `Base`; `article.serviciu` primește clasa `serviciu-card`; grila pe `section.linie-grup`)
- Test: `tests/unit/servicii-index.test.ts` (adaugă testele de mai jos)

**Interfaces:**
- Consumes: `Base` cu `suprafata` și `.carte`-ul de bază (Task 1). Culoarea liniei vine din `[data-grup]` pe secțiune prin `--culoare` (tokens.css), deci cardul o moștenește.
- Produces: nimic pentru alte sarcini.

Titlurile liniilor (`h2.linie-grup__titlu`) rămân în afara cardurilor. Vezi „Deviations”.

- [ ] **Step 1: Scrie testele care cad**

În `tests/unit/servicii-index.test.ts`:

```ts
test('fiecare serviciu e un card cu o singură legătură, spre pagina lui', async () => {
  const h = main(await render(PaginaServicii));
  const carduri = [...h.matchAll(/<article class="serviciu serviciu-card">([\s\S]*?)<\/article>/g)].map((m) => m[1] ?? '');
  expect(carduri).toHaveLength(SERVICII.length);
  carduri.forEach((c) => expect(c.match(/<a\b/g)).toHaveLength(1));
});

test('pagina e pe suprafață, cu grila pe linii', async () => {
  const h = await render(PaginaServicii);
  expect(h).toContain('class="main--suprafata"');
  expect(h).toContain('linie-grup__servicii');
});
```

- [ ] **Step 2: Rulează, să vezi că cad**

Run: `npx vitest run tests/unit/servicii-index.test.ts`
Expected: FAIL la `serviciu-card` și la `linie-grup__servicii`.

- [ ] **Step 3: Implementează**

În `servicii/index.astro`:
- `<Base ... suprafata={true}>`.
- Pe `<article class="serviciu">` adaugă `serviciu-card`.
- Înfășoară articolele dintr-o secțiune de linie într-un `<div class="linie-grup__servicii">`.
- În `<style>`, adaugă:

```css
.linie-grup__servicii {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
  margin-top: 1.5rem;
}

@media (min-width: 48rem) {
  .linie-grup__servicii {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Cardul e alb, cu contur, și are o bară de 4px în culoarea liniei (--culoare, moștenit din data-grup). */
.serviciu-card {
  background: var(--card);
  border: 1px solid var(--card-contur);
  border-left: 4px solid var(--culoare);
  padding: 1.5rem;
}

@media (min-width: 48rem) {
  .serviciu-card {
    padding: 2rem;
  }
}

/* Cuvintele lungi și numele de servicii se rup în card, la orice lățime (Review Focus 2). */
.serviciu-card h3 {
  overflow-wrap: anywhere;
}
```

Notă: în pagina există deja o regulă `.serviciu` (a articolului). Lasă-o; `.serviciu-card` nu o înlocuiește.

- [ ] **Step 4: Rulează, să vezi că trec**

Run: `npx vitest run tests/unit/servicii-index.test.ts`
Expected: PASS.

---

### Task 4: Pagini de serviciu — secțiunile ca carduri

**Files:**
- Modify: `src/layouts/Service.astro` (prop `suprafata={true}` pe `Base`; fiecare `<section>` din șablon primește `class="carte"`; în `<style>`, `section.carte { margin-top: 1.5rem; }`)
- Test: `tests/unit/service-page.test.ts`

**Interfaces:**
- Consumes: `Base` și `.carte` (Task 1).
- Produces: nimic pentru alte sarcini.

Secțiunile sunt: „Pentru cine e”, „Semne că ai nevoie” (într-un `.serviciu__doua`), „Ce primești”, „Cum se desfășoară”, „Un proiect” (dacă există), „Întrebări frecvente”, „Servicii înrudite”. Nota despre garanții și banda de îndemn nu sunt secțiuni de card.

- [ ] **Step 1: Scrie testul care cade**

În `tests/unit/service-page.test.ts`:

```ts
test('secțiunile paginii de serviciu sunt carduri, pe suprafață', async () => {
  const h = await render(ServicePage, { serviciu: serviciuExemplu });
  expect(h).toContain('class="main--suprafata"');
  const sectiuni = [...h.matchAll(/<section\b([^>]*)>/g)].map((m) => m[1] ?? '');
  expect(sectiuni.length).toBeGreaterThan(0);
  sectiuni.forEach((s) => expect(s).toContain('class="carte"'));
});
```

Numele `ServicePage` și `serviciuExemplu` sunt cele din fișierul de test existent; folosește-le pe cele de acolo.

- [ ] **Step 2: Rulează, să vezi că cade**

Run: `npx vitest run tests/unit/service-page.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementează**

În `Service.astro`: `suprafata={true}` pe `<Base>`; `class="carte"` pe fiecare `<section>`; `section.carte { margin-top: 1.5rem; }` în `<style>`. Regula `section { margin-top: 2.5rem; }` există deja și e mai slabă; `section.carte` o bate prin specificitate.

- [ ] **Step 4: Rulează, să vezi că trece**

Run: `npx vitest run tests/unit/service-page.test.ts`
Expected: PASS.

---

### Task 5: Cum lucrez — pașii și formatele ca carduri

**Files:**
- Modify: `src/pages/cum-lucrez.astro` (prop `suprafata={true}` pe `Base`; secțiunile `pasii` și `formate` primesc `class="carte"`)
- Test: `tests/unit/cum-lucrez.test.ts`

**Interfaces:**
- Consumes: `Base` și `.carte` (Task 1).
- Produces: nimic pentru alte sarcini.

Secțiunea `cum-trasee` (banda cu harta pașilor) rămâne cu fundalul ei și nu devine card.

- [ ] **Step 1: Scrie testele care cad**

În `tests/unit/cum-lucrez.test.ts`:

```ts
test('pașii și formatele sunt carduri; banda cu trasee nu e', async () => {
  const h = await render(PaginaCumLucrez);
  expect(h).toContain('class="main--suprafata"');
  expect(h).toMatch(/<section[^>]*aria-labelledby="pasii"[^>]*class="carte"/);
  expect(h).toMatch(/<section[^>]*aria-labelledby="formate"[^>]*class="carte"/);
  expect(h).not.toMatch(/<section[^>]*class="cum-trasee[^"]*carte/);
});
```

Dacă atributul `class` vine înaintea lui `aria-labelledby` în HTML-ul randat, inversează ordinea din regex.

- [ ] **Step 2: Rulează, să vezi că cade**

Run: `npx vitest run tests/unit/cum-lucrez.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementează**

În `cum-lucrez.astro`: `suprafata={true}` pe `Base`; `class="carte"` pe secțiunile `pasii` și `formate`. Nu atinge `cum-trasee`.

- [ ] **Step 4: Rulează, să vezi că trece**

Run: `npx vitest run tests/unit/cum-lucrez.test.ts`
Expected: PASS.

---

### Task 6: Despre — coloană de poveste și profil

**Files:**
- Modify: `src/pages/despre.astro` (prop `suprafata={true}`; grila `despre__grila` cu `despre__poveste` și `aside.despre__profil`; `max-width: none` pe grilă)
- Test: `tests/unit/despre.test.ts`

**Interfaces:**
- Consumes: `Base` și `.carte` (Task 1).
- Produces: nimic pentru alte sarcini.

Lista de unelte din profil e exact cea din „Instrumente” de pe pagină, nu alta: Astro, React, TypeScript, Cloudflare, WordPress, WooCommerce, PHP, Lighthouse, axe, Playwright, Git.

- [ ] **Step 1: Scrie testele care cad**

În `tests/unit/despre.test.ts`:

```ts
test('profilul e un card, fără imagine, cu linkul spre datele firmei', async () => {
  const h = main(await render(PaginaDespre));
  const profil = h.match(/<aside[^>]*class="[^"]*despre__profil[^"]*"[^>]*>([\s\S]*?)<\/aside>/)?.[1] ?? '';
  expect(h).toMatch(/<aside[^>]*class="[^"]*\bcarte\b[^"]*despre__profil/);
  expect(profil).not.toMatch(/<img\b|<picture\b|<figure\b/);
  expect(profil).toContain('href="/contact/#date-firma"');
});

test('lista de unelte din profil e cea din „Instrumente”', async () => {
  const h = main(await render(PaginaDespre));
  const unelte = [...h.matchAll(/<li class="despre__unealta">([^<]*)<\/li>/g)].map((m) => m[1]);
  expect(unelte).toEqual(['Astro', 'React', 'TypeScript', 'Cloudflare', 'WordPress', 'WooCommerce', 'PHP', 'Lighthouse', 'axe', 'Playwright', 'Git']);
});
```

- [ ] **Step 2: Rulează, să vezi că cad**

Run: `npx vitest run tests/unit/despre.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementează**

În `despre.astro`:
- `suprafata={true}` pe `<Base>`.
- Mută secțiunile (inclusiv „Profiluri”, dacă există) într-un `<div class="despre__poveste">`, fiecare cu `class="carte"`.
- Adaugă după el:

```astro
<aside class="carte despre__profil" aria-label="Profil">
  <p class="despre__nume">{site.nume}</p>
  <p>Consultant SEO și web designer, din București.</p>
  <h2 class="despre__unelte-titlu">Unelte</h2>
  <ul class="despre__unelte">
    {UNELTE.map((u) => <li class="despre__unealta">{u}</li>)}
  </ul>
  <p><a href="/contact/#date-firma">Date de identificare</a></p>
</aside>
```

Unde `UNELTE` e constanta din frontmatter, cu cele unsprezece valori din test. `site` e deja importat în pagină.
- Învelește `despre__poveste` și `aside` într-un `<div class="despre__grila">`.
- În `<style>`, după regula `.despre > :global(*) { max-width: 34em; }`, adaugă:

```css
/* Grila are nevoie de toată lățimea containerului; regula de mai sus ar limita-o la 34em. */
.despre__grila {
  max-width: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
}

@media (min-width: 64rem) {
  .despre__grila {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: start;
  }
}

.despre__profil {
  display: grid;
  gap: 0.75rem;
}

.despre__nume {
  margin: 0;
  font-size: var(--text-md);
  font-weight: 800;
}
```

Alinierea listei de unelte și a titlului „Unelte” se face cu clasele existente ale paginii; nu adaugă alte reguli.

- [ ] **Step 4: Rulează, să vezi că trec**

Run: `npx vitest run tests/unit/despre.test.ts`
Expected: PASS.

---

### Task 7: Contact — formular și carduri, cu grilă care se rupe singură

**Files:**
- Modify: `src/pages/contact/index.astro` (prop `suprafata={true}`; cele trei secțiuni — formularul, contactul direct și `#date-firma` — primesc `carte`; formularul primește `carte--formular` și `container-type: inline-size`)
- Modify: `src/components/ContactForm.astro` (câmpul Mesaj primește `formular__camp--mesaj`; `.formular` devine grilă cu două coloane într-un container de cel puțin 36rem)
- Modify: `tests/e2e/home.spec.ts` (mută `textMarit` în `tests/e2e/helpers.ts`, ca să o poată folosi și contactul)
- Test: `tests/unit/contact-form.test.ts`, `tests/e2e/contact.spec.ts`

**Interfaces:**
- Consumes: `Base` și `.carte` (Task 1). Ordinea câmpurilor vine din `CAMPURI_TEXT` și din blocul de `serviciu`/`mesaj` din `ContactForm.astro`; nu se schimbă.
- Produces: `textMarit(page)` exportat din `tests/e2e/helpers.ts`.

Perechile din grilă, în ordinea DOM: Nume | E-mail; Telefon | Firmă; Adresa site-ului | Serviciu; Mesaj pe toată lățimea; butonul sub el. Capcana e absolută, deci nu intră în grilă.

- [ ] **Step 1: Scrie testele care cad**

În `tests/unit/contact-form.test.ts`:

```ts
test('câmpul Mesaj e ultimul câmp și are clasa de rând întreg; ordinea câmpurilor nu s-a schimbat', async () => {
  const h = await render(ContactForm);
  expect(h.match(/formular__camp--mesaj/g)).toHaveLength(1);
  const ordine = [...h.matchAll(/name="([^"]+)"/g)].map((m) => m[1]).filter((n) => n !== CAPCANA);
  expect(ordine).toEqual(['nume', 'email', 'telefon', 'firma', 'site', 'serviciu', 'mesaj']);
});
```

Dacă `CAPCANA` nu e importat în fișier, importă-l din `src/form-rules.ts` (e deja acolo, în alte teste). Dacă lista de nume nu coincide cu cea din `form-rules.ts`, folosește lista din acel fișier, nu pe aceasta.

În `tests/e2e/contact.spec.ts`:

```ts
test('text mărit la 200% pe /contact/: câmpurile nu se suprapun, fără derulare orizontală', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/contact/');
  await textMarit(page);
  expect(await seSuprapun(page, ['#formular-nume', '#formular-email', '#formular-telefon', '#formular-firma'])).toBe(false);
  expect(await faraDerulareOrizontala(page)).toBe(true);
});

test('axe pe /contact/: fără încălcări, iar secțiunea formularului are nume', async ({ page }) => {
  await page.goto('/contact/');
  const rezultat = await new AxeBuilder({ page }).analyze();
  expect(rezultat.violations).toEqual([]);
  await expect(page.locator('section[aria-labelledby="formular-titlu"]')).toHaveCount(1);
});
```

`AxeBuilder` vine din `@axe-core/playwright` (e deja în dependențe). Dacă `seSuprapun` sau `faraDerulareOrizontala` nu sunt importate în `contact.spec.ts`, importă-le din `./helpers`.

- [ ] **Step 2: Rulează, să vezi că cad**

Run: `npx vitest run tests/unit/contact-form.test.ts`
Expected: FAIL la `formular__camp--mesaj`.

Run: `QA_SERVER_EXTERNAL=1 npx playwright test tests/e2e/contact.spec.ts --project=chrome` (după `npx astro build`, cu serverul pe 8787 pornit)
Expected: testele noi pot trece deja pe pagina neschimbată, pentru că nu depind de clase noi. Ele trebuie să treacă și după implementare; dacă trec înainte, păstrează-le ca protecție.

- [ ] **Step 3: Implementează**

În `ContactForm.astro`:
- Pe wrapper-ul câmpului Mesaj (`<div class="formular__camp">` care conține `textarea name="mesaj"`) adaugă `formular__camp--mesaj`.
- În `<style>`, schimbă `.formular` astfel:

```css
.formular {
  container-type: inline-size;
  display: grid;
  gap: 1.25rem;
  max-width: none;
}

@container (min-width: 36rem) {
  .formular {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: 1.25rem;
  }

  .formular__camp--mesaj,
  .formular__trimite {
    grid-column: 1 / -1;
  }
}
```

Regula `container-type` e pe `.formular`, deci containerul are lățimea cardului, nu a ecranului. Așa grila se rupe singură la 200% text (Review Focus 1).

În `contact/index.astro`:
- `suprafata={true}` pe `<Base>`.
- Secțiunea formularului: `class="carte carte--formular"`.
- Secțiunea „Sau scrie-mi direct”: `class="carte"`.
- Secțiunea `.contact__firma` (`#date-firma`): `class="carte contact__firma"`. Scoate regula `border-top` din `.contact__firma`, ca să nu se dubleze cu contururile cardului.
- Păstrează `.ascuns` pe titlul „Formularul”.

- [ ] **Step 4: Rulează, să vezi că trec**

Run: `npx vitest run tests/unit/contact-form.test.ts`
Expected: PASS.

Run: `npx astro build` apoi `QA_SERVER_EXTERNAL=1 npx playwright test tests/e2e/contact.spec.ts --project=chrome`
Expected: toate testele din `contact.spec.ts` trec, inclusiv cele două noi.

---

### Task 8: Verificare întreagă și vizuală

**Files:** niciunul; doar verificare.

**Interfaces:**
- Consumes: toate sarcinile 1–7.

- [ ] **Step 1: Teste unitare și verificarea tipurilor**

Run: `npx vitest run`
Expected: toate testele trec (numărul crește față de 602 cu testele noi).

Run: `npx astro check`
Expected: 0 erori, 0 avertismente.

- [ ] **Step 2: Suita e2e completă pe Chrome**

Run: `npx astro build`, apoi `QA_SERVER_EXTERNAL=1 npx playwright test --project=chrome`
Expected: toate testele trec, cu excepția celor care sunt deja sărite în suita de dinainte de modificări (`test.skip` sau `describe.skip` din fișierele existente). Dacă apare un test căzut, repară-l, nu-l șterge.

- [ ] **Step 3: Verificare vizuală**

Pe serverul de pe 8787, la 1440, 375 și 320 (cu text mărit la 200% pe 320), verifică pe fiecare pagină: Acasă, Servicii, `/servicii/seo/`, Cum lucrez, Despre, Contact, și o pagină legală (`/politica-cookies/`).

Criterii:
- cardurile sunt albe, cu contur subțire, fără umbră, cu colțuri drepte;
- fundalul conținutului e `#E9EEF5` pe paginile cu bandă și alb pe cele legale;
- nu apare derulare orizontală la niciuna dintre lățimi;
- la 200% pe contact, câmpurile stau pe o coloană când cardul e îngust.

- [ ] **Step 4: Verificare de accesibilitate**

Run: `QA_SERVER_EXTERNAL=1 npx playwright test tests/e2e/contact.spec.ts -g axe --project=chrome`
Expected: PASS. Pentru celelalte pagini modificate, rulează axe pe fiecare URL din lista de la Step 3 (un test scurt cu `AxeBuilder`, după modelul celui de pe contact).

---

### Task 9: Specificația principală, după implementare

**Files:**
- Modify: `docs/superpowers/specs/2026-10-21-site-alex-ionescu-design.md`

**Interfaces:**
- Consumes: sarcinile 1–8 aprobate.
- Produces: nimic.

Se actualizează numai după ce testele și verificările din Task 8 trec.

- [ ] **Step 1: Adaugă decizia 29 în registrul din §2**

Un rând nou după rândul 28: „Suprafețe stratificate (2026-10-23): fundal `--suprafata` sub bandă, carduri albe cu contur `--card-contur` pentru secțiunile de conținut; Servicii cu șase carduri în grilă; Despre cu profil; Contact pe două coloane. Detalii în `docs/superpowers/specs/2026-10-23-layered-surfaces-design.md`.”

- [ ] **Step 2: Actualizează §4.3, §4.4, §4.5, §5.1, §5.2**

- §4.3, punctul 3: „De unde pornești?” pe fundal alb devine card pe `--suprafata`.
- §4.4: secțiunile paginii de serviciu sunt carduri pe `--suprafata`.
- §4.5: Servicii cu carduri în grilă; Despre cu coloana de profil; Contact cu două coloane.
- §5.1: cardurile albe cu contur de 1px sunt permise; umbrele și cardurile colorate identice rămân interzise.
- §5.2: trei rânduri noi în tabelul de tokenuri (`--suprafata`, `--card`, `--card-contur`), cu valorile și contrastele din design.

- [ ] **Step 3: Verifică**

Run: `grep -n "suprafat\|card-contur" docs/superpowers/specs/2026-10-21-site-alex-ionescu-design.md`
Expected: apar rândurile noi din §2, §5.2 și referințele din §4.3–§4.5.

---

## Self-review

- **Acoperire:** fiecare secțiune din design are o sarcină: tokenuri și card (1), Acasă (2), Servicii (3), pagini de serviciu (4), Cum lucrez (5), Despre (6), Contact (7), verificare (8), spec (9). Cele cinci puncte din Review Focus au teste în sarcinile lor.
- **Tipuri și nume:** `suprafata` (prop), `main--suprafata`, `.carte`, `carte--formular`, `serviciu-card`, `linie-grup__servicii`, `despre__grila`, `despre__poveste`, `despre__profil`, `despre__unealta`, `formular__camp--mesaj` sunt folosite la fel în toate sarcinile.
- **Ambiguități rămase:** la Task 1 și Task 6 testele depind de cum randează helperii (`pagina`, `ServicePage`, `serviciuExemplu`); fiecare sarcină spune ce să verifice dacă helperul nu corespunde.
- **Lungime:** planul are în jur de 330 de linii, adică mai puțin decât specificația principală (≈940).
