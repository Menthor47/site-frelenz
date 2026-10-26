# Chitanța de build și „Cum citește un AI pagina”: specificație de design

Data: 2026-10-24. Stare: ciornă, în așteptarea revizuirii lui Alex.
Face parte din direcțiile noi de design (A, D, B, C, E, în ordinea aleasă de Alex); aceasta e piesa 1 (A). Raportul de design din 2026-10-24 (`reviews/audit-design-2026-10-24.md`) și primul audit indică dovada muncii ca pârghia cea mai mare.

---

## 1. Obiectiv și criterii de succes

**Ce:** două componente statice care arată, pe Acasă și pe `/despre/`, calitatea măsurată a site-ului și ce citește o mașină din pagină. Site-ul dovedește singur ce vinde (spec principal, §1, punctul 4).

**Succes înseamnă:**
1. Fiecare cifră afișată a fost produsă de un instrument și poartă data măsurătorii. Nicio cifră scrisă de mână.
2. Componentele nu adaugă JavaScript, imagini sau cereri; pragurile Lighthouse (≥ 90 la toate patru categoriile, mobil) rămân respectate pe ambele pagini.
3. Un build nu poate ieși cu o chitanță goală sau invalidă, iar o lansare nu poate ieși cu măsurători mai vechi de 30 de zile.
4. Accesibilitate WCAG 2.1 AA, verificată cu axe pe ambele pagini.

**Nu face parte din piesă:** semnalistica (D), harta ca navigare (B), ritmul pe tipuri de pagină (C), tema de noapte (E). Fiecare are propria specificație.

## 2. Datele: de unde vin cifrele

`reports/` e în `.gitignore`, deci build-ul nu poate citi rezultatele Lighthouse direct. Soluția: un instantaneu comis deliberat.

- `scripts/snapshot-masuratori.mjs` citește `reports/qa/index.json` și `reports/qa/despre.json` (rezultatele `npm run qa:page`) și scrie `src/data/masuratori.json`.
- Conținutul: data rulării, pentru fiecare pagină medianele Lighthouse mobil la cele patru categorii și numărul de încălcări axe. Valorile se copiază neschimbate; scriptul nu calculează și nu rotunjește altfel decât raportul sursă.
- Scriptul refuză (cod 1) dacă un raport lipsește, dacă pasul lui a picat sau dacă are altă formă decât cea așteptată. Mesajul spune ce raport și de ce.
- Fișierul se comite doar cu acordul lui Alex, ca orice alt conținut aprobat.
- Măsurătorile vin dintr-o previzualizare locală (`qa:page`), nu din producție. Chitanța o spune explicit.

## 3. Componente

Fiecare are un singur rost și se testează separat.

### 3.1. `src/lib/masuratori.ts`
Citește și validează `src/data/masuratori.json` (la build). Expune datele tipizate și `esteVechi(acum)`: adevărat dacă instantaneul are peste 30 de zile. Un fișier lipsă sau invalid aruncă o eroare, deci build-ul pică.

### 3.2. `src/components/ChitantaBuild.astro`
Bandă în stilul biletului de metrou, cu două părți:
- **Măsurat pe [data]:** cele patru categorii Lighthouse (mobil) și încălcările axe, pentru pagina curentă. Sub ele, o frază: măsurat local, pe versiunea de previzualizare.
- **Verificat la fiecare publicare:** linkuri, glifele ș și ț, CSP, schema JSON-LD și testele Worker-ului. Afirmația e adevărată pentru că `deploy` rulează `verify` înainte (`package.json`).

Variante: plină (Acasă) și pe un rând (`/despre/`). Pagina curentă nu are cifre dacă instantaneul n-o acoperă; atunci componenta nu se afișează deloc, nu afișează cifre inventate.

### 3.3. `src/components/CumCitesteAI.astro`
Panou `<details>` (fără JavaScript) cu ce citește o mașină din pagină:
- rezumatul din `llms.txt`, produs de aceeași funcție (`llmsTxt` din `src/lib/llms.ts`);
- lista tipurilor JSON-LD ale paginii, produsă de `src/lib/jsonld.ts`.
Nu are copie scrisă de mână, deci nu se poate abate de la ce se publică.

### 3.4. Plasare
- Acasă: banda plină lângă sfârșitul paginii, înaintea îndemnului final; panoul „Cum citește un AI pagina” sub ea.
- `/despre/`: chitanța pe un rând, fără panou.

## 4. Fluxul datelor

`npm run qa:page` → `reports/qa/*.json` (local, ignorat de git) → `snapshot-masuratori` → `src/data/masuratori.json` (comis) → `masuratori.ts` → componente, la build. Pagina rezultată e complet statică.

## 5. Erori și blocaje

| Situație | Comportament |
|---|---|
| `masuratori.json` lipsește sau e invalid | `astro build` pică, cu mesaj clar |
| Raport sursă lipsă sau picat | `snapshot-masuratori` iese cu cod 1; fișierul vechi rămâne neschimbat |
| Instantaneu mai vechi de 30 de zile | `check:launch` refuză lansarea (`npm run dev` și `verify` nu sunt afectate) |
| Pagina nu are date în instantaneu | componenta nu se afișează |

## 6. Teste

- **Unit, scriptul:** respinge un raport picat sau malformat; copiază valorile neschimbate.
- **Unit, `masuratori.ts`:** fișier invalid, instantaneu vechi/proaspăt (limita de 30 de zile).
- **Unit, `check-launch`:** regula de învechire, adăugată în testele existente.
- **Component:** textul randat al chitanței (varianta plină și cea pe un rând, lipsa datelor).
- **e2e:** chitanța apare pe Acasă și pe `/despre/`; axe fără încălcări; panoul se deschide cu tastatura.
- **QA:** `npm run qa:page` pe `/` și `/despre/` după implementare, pentru Lighthouse ≥ 90.

## 7. Deciziile lui Alex (2026-10-24)

1. Pragul de învechire: 30 de zile.
2. Plasare: banda plină pe Acasă și o variantă pe un rând pe `/despre/`.
3. Sursa cifrelor: și măsurătorile Lighthouse/axe (datate), și verificările deterministe din `verify`.

## 8. Riscuri și puncte deschise

- **Cifrele mari pot pune presiune.** Dacă o rulare viitoare dă sub 90 la o categorie, chitanța o arată cinstit; build-ul nu o ascunde. Alex decide dacă repară sau republică.
- **Rândul „verificat la fiecare publicare”** rămâne adevărat doar cât timp `deploy` rulează `verify`; `tests/unit/check-scripts.test.ts` nu o păzește încă, deci implementarea adaugă un test care cere ca scriptul `deploy` să conțină `npm run verify`.
- **Formularea** textelor din chitanță (română, „tu”) o aprobă Alex, ca restul conținutului; propun ciorna la implementare, cu marcaje până atunci.
