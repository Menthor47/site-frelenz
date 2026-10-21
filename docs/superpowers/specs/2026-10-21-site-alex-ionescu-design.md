# Site-ul Alex Ionescu: specificație de design

Data: 2026-10-21. Stare: în așteptarea aprobării lui Alex.
Pornește de la `plan-site-alex-ionescu.md` (planul lui Alex) și de la deciziile luate în discuția din 21 octombrie 2026. Unde planul și această specificație diferă, câștigă specificația: diferențele au fost discutate și aprobate.

---

## 1. Obiectiv și criterii de succes

**Ce este:** site-ul personal de prezentare al lui Alex Ionescu, consultant SEO și web design din București. Servicii: SEO, audit SEO, creare site de prezentare, redesign, mentenanță (aducere la zi), optimizare pentru căutarea AI (AEO și GEO). Două formate de colaborare: remediere unică, sau remediere la preț redus plus abonament lunar. Clienții sunt doar profesioniști: firme, PFA-uri și alte entități profesionale din toată țara.

**Pentru ce:** cereri de ofertă de la proprietari de firme mici și mijlocii din România.

**Succes înseamnă:**
1. Vizitatorul înțelege în 10 secunde ce face Alex și pentru cine.
2. Găsește serviciul de care are nevoie din problema pe care o are.
3. Trimite o cerere de ofertă.
4. Site-ul dovedește singur ce vinde: rapid, fără cookie-uri și fără scripturi terțe, ușor de citit pentru Google și pentru motoarele AI.

**Ținte măsurabile:**
- Lighthouse 13 pe mobil: cel puțin 90 la Performanță, Accesibilitate, Bune practici și SEO, pe fiecare pagină indexabilă (mediana din 3 rulări). Paginile noindex (mulțumire, eroare, 404) trebuie să aibă cel puțin 90 la Performanță, Accesibilitate și Bune practici. La SEO, pe ele sunt acceptate doar eșecurile auditului `is-crawlable` și, pe 404, ale auditului `http-status-code`. Categoria „Agentic Browsing” din Lighthouse 13.3+ se raportează separat și nu e criteriu de acceptare.
- WCAG 2.1 AA.
- Zero cookie-uri, zero scripturi terțe, zero cereri către alte domenii.

---

## 2. Registrul deciziilor

| # | Subiect | Decizia |
|---|---|---|
| 1 | Formular | Cloudflare Worker + Email Routing, spre `idealserv51@gmail.com` (adresă de destinație verificată). |
| 1b | Găzduire | Cloudflare Workers cu fișiere statice (recomandarea actuală Cloudflare pentru proiecte noi), DNS-ul domeniului mutat la Cloudflare. Înlocuiește „Cloudflare Pages” din plan. |
| 2 | Statistici | Niciun script de statistici. Search Console, Bing Webmaster Tools și statisticile Cloudflare de pe server. Fără banner de cookie-uri. Cloudflare Web Analytics rămâne oprit, inclusiv injectarea automată. |
| 3 | Culori | Hexurile din plan, cu albastrul dominant. Proporții: 60% alb, 30% culoare, 10% negru (subsolul). Semnul din logo e virgula de sub ș și ț. |
| 4 | Pagina Acasă | „Fișa acestei pagini” lângă titlu, indexul „Ce vă supără?” în loc de carduri, procesul ca traseu de metrou, întrebări frecvente vizibile, proiecte ca fișe de dovezi. Cele două blocuri au fundal colorat deschis. În spate, o hartă de metrou animată, pe care circulă trenuri luminoase. |
| 5 | Harta de metrou | Animată doar pe Acasă. Pe celelalte pagini e statică, cu linia serviciului în față. |
| 6 | Ghiduri | 2 la lansare: „De ce nu apare site-ul meu în Google” și „Ce este GEO și prin ce diferă de SEO și AEO”. Secțiunea apare în meniu și în sitemap doar după ce Alex aprobă textele. |
| 7 | Google Business Profile | Da, cu zonă deservită (București și Ilfov) și adresa ascunsă. Îl face Alex. Recenzii doar de la clienți reali. |
| 8 | Clienți | Doar profesioniști (B2B), declarat pe site. Fără pictograma ANPC și fără procedura de retragere în 14 zile. Fără link SOL (platforma s-a închis în iulie 2025). |
| 9 | Lansare | Abia după ce pagina Despre e completă. |
| 10 | E-mail public | `contact@<domeniu>`, redirecționat spre Gmail prin Email Routing. |
| 11 | Fonturi | Bricolage Grotesque pentru titluri, Atkinson Hyperlegible Next pentru text. |
| 12 | Cuvânt-cheie web design | „creare site de prezentare”. Adresa paginii: `/servicii/creare-site/`. Unghiul din titlu: „…gândit să aducă cereri de ofertă”. Formularea inițială, „care aduce”, promitea un rezultat. |
| 13 | Cuvânt-cheie Acasă | „consultant SEO din București”. „servicii SEO” rămâne doar pe `/servicii/seo/`. |
| 14 | Repo | GitHub privat. Planul lui Alex rămâne în git. Proiectele cu nume și fără acord nu se construiesc, deci nu apar pe site-ul public (regula completă în 3.4). |
| 15 | Adresa sediului | Amânată de Alex. Până atunci [DE COMPLETAT], iar lansarea e blocată. |
| 16 | Adresare | „Dumneavoastră” peste tot. Butonul principal: „Cereți o ofertă”. |

---

## 3. Arhitectura

### 3.1 Stack

- **Astro 7.4.x**, generat 100% static, fără adaptor. Versiunea exactă se fixează la inițializare.
- **Node 24 LTS**, fixat în `.node-version` și în `engines`, ca build-ul local să fie identic cu cel de pe Cloudflare (Node 26 local e „Current”, nu LTS).
- **Cloudflare Workers** cu fișiere statice (`assets.directory = "./dist"`) plus un singur Worker pentru `/api/*`.
- Fără framework de UI, fără bibliotecă de animații, fără CSS framework. CSS scris de mână, pe tokenuri.
- `compressHTML: true`, ca să nu dispară spațiile dintre linkuri și textul românesc. Valoarea implicită în Astro 7 e `"jsx"`.

### 3.2 Structura repo-ului

```
siteulet/
  astro.config.mjs          sitemap, fonturi, CSP
  wrangler.jsonc            fișiere statice, 404, run_worker_first ['/api/*'], send_email, rate limit
  .node-version             24
  src/
    site.config.ts          SINGURA sursă pentru domeniu, nume, descriere fixă, contact, date PFA, profiluri
    content.config.ts       schemele colecțiilor
    approvals.ts            aprobarea lui Alex pentru paginile .astro, câte o intrare pe rută
    placeholders.ts         registrul [DE COMPLETAT] din capitolul 12, citit de check:launch
    content/
      servicii/*.md         6 servicii
      proiecte/*.md         studii de caz (cu câmpul acord)
      ghiduri/*.md          ghiduri (cu câmpul aprobat)
    layouts/                Base, Service, CaseStudy, Guide, Legal
    components/             vezi 3.3
    pages/                  rute, inclusiv llms.txt, robots.txt și imaginile OG
    styles/                 tokens.css, base.css, componente
    client/                 scripturi mici, puse inline: page-facts, trains, contact-enhance
  worker/
    index.ts                handler pentru POST /api/contact
    index.test.ts           teste (vitest + pool-ul Workers)
  public/
    _headers                cache, securitate, noindex pe workers.dev
    favicon.svg
  scripts/                  verificări: diacritice, marcaje, lansare, Lighthouse, schemă
  tests/                    Playwright + axe
  docs/superpowers/specs/   această specificație
  README.md                 rulare, verificare, publicare
```

### 3.3 Componente

Fiecare componentă are un singur rol și primește datele prin props din `site.config.ts` sau din colecții.

| Componentă | Rol | Depinde de |
|---|---|---|
| `SeoHead` | title, description, canonical, Open Graph, robots, `lang="ro"` | site.config, props de pagină |
| `JsonLd` | un singur `@graph` per pagină (vezi 6.3) | site.config, conținutul paginii |
| `Header` | logo, meniu, butonul „Cereți o ofertă” | site.config |
| `Footer` | servicii, pagini, contact, bloc cu datele firmei, linkuri legale | site.config, colecția servicii |
| `LegalId` | datele firmei cerute de Legea 365/2002, refolosit în subsol, pe Contact și în politici | site.config |
| `MetroMap` | harta SVG. `variant="animated"` pe Acasă, `variant="static"` cu `line` evidențiată pe celelalte | tokenuri de culoare |
| `PageFacts` | „Fișa acestei pagini” (vezi 5.5) | script inline mic |
| `SymptomIndex` | indexul „Ce vă supără?” | colecția servicii (câmpul `simptom`) |
| `RouteMap` | cele două trasee (remediere unică, abonament) | text din conținut |
| `Faq` | întrebări vizibile, cu FAQPage în graf | props |
| `Breadcrumbs` | firimituri vizibile (`nav` + `ol`), cu BreadcrumbList | ruta |
| `Cta` | un singur îndemn per pagină: „Cereți o ofertă”, spre `/contact/?serviciu=<slug>` | props |
| `ContactForm` | formular HTML simplu, cu POST către `/api/contact` | site.config |
| `Placeholder` | marcajul vizibil [DE COMPLETAT], cu stil distinct, înregistrat pentru verificări | — |

### 3.4 Colecțiile de conținut (câmpuri validate cu zod)

**servicii:** `slug`, `titlu` (title tag), `h1`, `descriere` (140–160 de caractere), `cuvantCheie`, `secundare[]`, `grup` (vizibilitate | diagnostic | construcție | reparație), `raspunsDirect` (2–3 fraze), `pentruCine[]`, `semne[]`, `livrabile[]`, `pasi[]`, `faq[]` (4–6 perechi întrebare-răspuns), `inrudite[]`, `proiect?`, `simptom` (rândul din indexul de pe Acasă), `notaGarantii` (true pe SEO și AEO/GEO), `aprobat` (boolean).

**proiecte:** `slug`, `titlu`, `client` (nume sau „anonim”), `acord` (boolean), `aprobat` (boolean), `context`, `problema`, `ceAmFacut[]`, `rezultate[]` (fiecare cu `text`, `sursa`, `data`), `servicii[]`, `capturi[]` (cu text alternativ).

**Când e publicabil un proiect:** când (`acord: true` sau `client: "anonim"`) și `aprobat: true`. Doar proiectele publicabile se construiesc și apar în sitemap, în llms.txt, pe `/proiecte/`, pe Acasă și în câmpul `proiect` al paginilor de servicii. Altfel, nu există nicăieri, ca niciun link să nu ducă spre o pagină inexistentă.

**ghiduri:** `slug`, `titlu` (sub formă de întrebare), `raspuns` (primul paragraf), `publicat`, `actualizat`, `aprobat` (boolean), `serviciuLegat`. Ghidurile se construiesc doar când există cel puțin 2 cu `aprobat: true`. Până atunci nu se construiește niciunul, iar secțiunea lipsește din meniu, din sitemap, din llms.txt și din linkurile paginilor de servicii.

**Paginile `.astro`** (Acasă, Cum lucrez, Contact, Despre, paginile legale) au aprobarea în `src/approvals.ts`, câte o intrare pe rută. Serviciile și paginile `.astro` se construiesc și neaprobate, ca să le poată revizui Alex local. `check:launch` refuză însă lansarea dacă o pagină construită are `aprobat: false`.

### 3.5 Formularul și Worker-ul

**Câmpuri:**
- Nume (obligatoriu)
- E-mail (obligatoriu, `type=email`)
- Telefon (opțional)
- Firmă (opțional)
- Adresa site-ului (opțional)
- Serviciu (opțional; listă cu cele 6 servicii plus „Nu știu încă”)
- Mesaj (obligatoriu, maximum 3000 de caractere)
- Un câmp-capcană ascuns, pentru roboți

Fără CNP și fără bifă de acord. Sub buton scrie: „Folosesc datele trimise ca să vă răspund la cerere și pentru discuțiile care urmează. Detalii în Politica de confidențialitate.” Butonul: „Trimiteți cererea”.

**Fluxul fără JavaScript:**
1. Formularul face `POST /api/contact`.
2. Worker-ul validează pe server, verifică câmpul-capcană și limita de trimiteri (3 cereri la 60 de secunde pe IP).
3. Trimite un singur e-mail prin `send_email`: de la `formular@<domeniu>`, către `idealserv51@gmail.com`, cu Reply-To pe adresa vizitatorului. Subiectul: „Cerere de ofertă: <serviciu> – <nume/firmă>”. Corpul e text simplu, cu toate câmpurile.
4. Răspunde cu `303` către `/contact/multumim/`. Pagina e statică, marcată noindex și nu apare în sitemap.

**Erorile:**
- **Date invalide:**
  - Worker-ul ia pagina `/contact/` din fișierele statice, cu `env.ASSETS.fetch` (legătura `assets.binding: "ASSETS"`), și o rescrie cu HTMLRewriter.
  - Pune înapoi valorile trimise, escapate HTML, în câmpuri și în `<textarea>`.
  - Adaugă mesajele de eroare lângă câmpuri, legate prin `aria-describedby`, plus un rezumat al erorilor deasupra formularului.
  - Răspunde cu status 400.
  - Formularul reafișat e chiar pagina de corectare: vizitatorul nu pierde textul scris.
- **Trimitere eșuată sau limită depășită:** `303` către `/contact/eroare/` (noindex). Pagina spune că mesajul n-a plecat și oferă telefonul, WhatsApp și e-mailul.
- **Roboții prinși de capcană** primesc același `303` spre „mulțumesc”, fără e-mail trimis.

**Antetele răspunsurilor Worker-ului.** `_headers` nu se aplică răspunsurilor generate de Worker. De aceea, Worker-ul pune singur aceleași antete de securitate (HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`), un CSP de antet propriu și `X-Robots-Tag: noindex`.

**Cu JavaScript** (îmbunătățire progresivă, sub 2 KB):
- Scriptul trimite cu `fetch` și antetul `Accept: application/json`. Doar în cazul ăsta Worker-ul răspunde cu JSON:
  - `200 {"ok":true}`: scriptul duce vizitatorul la `/contact/multumim/`;
  - `422 {"ok":false,"erori":{"<câmp>":"<mesaj>"}}`: scriptul afișează erorile lângă câmpuri, anunțate prin `aria-live`;
  - `429` sau `502 {"ok":false,"motiv":"limita"|"trimitere"}`: scriptul duce vizitatorul la `/contact/eroare/`.
- Fără antetul `Accept: application/json` rămân răspunsurile `303` și HTML. Ambele variante intră în teste.
- Câmpul Serviciu e precompletat din `?serviciu=`.

**Ce nu face Worker-ul:**
- Nu stochează nimic (fără KV sau D1).
- Nu păstrează jurnale: în `wrangler.jsonc`, `"observability": { "enabled": false }`, iar codul nu face `console.log` cu câmpurile formularului, nici în ramura de eroare. Dacă Alex vrea totuși jurnalele Cloudflare (3 zile pe planul gratuit), ele intră în Politica de confidențialitate, la jurnalele tehnice.
- Nu trimite confirmare vizitatorului (limitare acceptată).

**Notă:** Email Routing preia înregistrările MX ale domeniului. Dacă Alex își face mai târziu o căsuță reală pe domeniu (Google Workspace, Zoho), trimiterea formularului trece pe Resend. Pașii sunt descriși în README.

### 3.6 Configurarea Cloudflare

**`wrangler.jsonc`:**
- `not_found_handling: "404-page"`;
- `html_handling: "auto-trailing-slash"`;
- `run_worker_first: ["/api/*"]`;
- `assets.binding: "ASSETS"`;
- `"observability": { "enabled": false }`;
- legăturile `send_email` (cu `allowed_destination_addresses`) și rate limit.

**`_headers`:**
- `/_astro/*`: `Cache-Control: public, max-age=31536000, immutable`;
- pe `/*`: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal, `X-Frame-Options: DENY` și `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`;
- `X-Robots-Tag: noindex` pe `*.workers.dev`.

**CSP-ul e împărțit în două:**
- **În `<meta>`, generat de Astro (`security.csp`):** `default-src 'self'`, apoi `script-src` și `style-src` cu hash-uri, `base-uri 'self'`, `form-action 'self'`. Fără niciun alt domeniu.
- **În antetul HTTP din `_headers`:** doar directivele de mai sus (`frame-ancestors` etc.). Browserul ignoră `frame-ancestors` dacă e pus în `<meta>`. Antetul nu conține `default-src`, `script-src` sau `style-src`, pentru că politicile se cumulează și un antet cu ele ar bloca scripturile inline care au hash.

**Reguli pentru scripturi și stiluri, ca să funcționeze CSP-ul:**
- Scripturile din `src/client/` se includ doar ca `<script>` procesate de Astro, fără importuri comune, ca să fie puse inline (sub `build.assetsInlineLimit`) și să primească automat hash.
- Interzise:
  - `<script is:inline>`, cu excepția JSON-LD, pe care browserul nu îl execută;
  - `define:vars`;
  - atributele `style="…"`;
  - handler-ele `on…`.
- `view-transition-name` pentru fiecare serviciu și culoarea liniei se dau prin clase sau atribute `data-`, cu reguli în CSS.
- Un test Playwright pe build verifică că în consolă nu apare nicio încălcare CSP. CSP-ul nu rulează în `astro dev`.

**Reguli de zonă** (le aplică Alex în contul lui, după README):
- Always Use HTTPS și redirecționare 301 de la www spre varianta fără www.
- Web Analytics oprit.
- Bot Fight Mode oprit (pune cookie-ul `__cf_bm`).
- Fără Turnstile: încarcă un script de pe `challenges.cloudflare.com`, deci încalcă regula „zero scripturi terțe” și CSP-ul.
- Email Address Obfuscation oprit. Altfel Cloudflare ar înlocui e-mailul din subsol cu un script injectat.
- Rocket Loader oprit.
- Blocarea crawlerelor AI și „Managed robots.txt” oprite.
- Crawler Hints (IndexNow) pornit.

**Verificarea în producție**, înainte de lansare și după orice schimbare de setări: HTML-ul servit nu conține `/cdn-cgi/` sau `data-cfemail`, iar numărul de `<script>` de pe fiecare pagină e identic cu cel din `dist/`.

### 3.7 Generat la build

- `sitemap.xml` (`@astrojs/sitemap`). Exclude paginile de mulțumire și eroare și 404. Ghidurile și proiectele nepublicabile nu se construiesc deloc (3.4), deci nu au cum să apară.
- `robots.txt`: permite tot, cu linia `Sitemap:`.
- `llms.txt`, generat din colecții (vezi 6.5).
- Imagine OG de 1200×630 pentru fiecare pagină, generată la build cu fonturile site-ului (inclusiv ș și ț). Se folosește un fișier static Bricolage Grotesque 700 (latin + latin-ext), nu cel variabil, pe care generatoarele îl desenează la greutatea implicită. Generatorul se alege la implementare și trebuie să meargă pe Windows și pe Linux.
- Un raport cu toate marcajele [DE COMPLETAT] (`reports/placeholders.md`), care nu se publică.

---

## 4. Harta site-ului, cuvinte-cheie și structura paginilor

### 4.1 Harta și cuvintele-cheie

Volumele nu sunt verificate. Alex le confirmă în Keyword Planner înainte de lansare.

| Pagina | Cuvânt principal | Secundare | Grup / linie |
|---|---|---|---|
| `/` | consultant SEO din București | specialist SEO | toate |
| `/servicii/` | (pagină de trecere) | — | toate |
| `/servicii/seo/` | servicii SEO | optimizare SEO site, abonament SEO | vizibilitate (albastru) |
| `/servicii/optimizare-aeo-geo/` | optimizare pentru ChatGPT | AEO, GEO, vizibilitate în căutarea AI | vizibilitate (albastru) |
| `/servicii/audit-seo/` | audit SEO | audit site | diagnostic (verde) |
| `/servicii/creare-site/` | creare site de prezentare | realizare site, web design, site pentru firmă | construcție (galben) |
| `/servicii/redesign-site/` | redesign site | refacere site, modernizare site | reparație (roșu) |
| `/servicii/mentenanta-site/` | mentenanță site | actualizare site, întreținere site WordPress, abonament mentenanță site | reparație (roșu) |
| `/cum-lucrez/` | (fără cuvânt propriu) | — | toate, estompate |
| `/proiecte/` | (fără cuvânt propriu) | — | toate, estompate |
| `/proiecte/<slug>/` | (fără cuvânt propriu) | — | linia primului serviciu din `servicii[]` |
| `/ghiduri/` | (fără cuvânt propriu) | — | toate, estompate |
| `/ghiduri/<slug>/` | întrebarea din titlu | — | linia din `serviciuLegat` |
| `/despre/` | Alex Ionescu | — | toate, estompate |
| `/contact/` | (fără cuvânt propriu) | — | toate, estompate |
| Paginile legale, `/404`, `/contact/multumim/`, `/contact/eroare/` | — | — | fără hartă |

Proiecte la lansare:
- `/proiecte/szitrans/` (cu acord scris, vezi 10);
- `/proiecte/magazin-online/`, anonim, fără nume, cu detalii care nu identifică clientul;
- `/proiecte/acest-site/`.

`/proiecte/mayalashes/` se construiește doar după acord.

### 4.2 Reguli pentru meta

- **Title:** „<Titlu> – Alex Ionescu”, cu cel mult 60 de caractere în total. Dacă nu încape, sufixul dispare.
  - Acasă: „Consultant SEO din București – Alex Ionescu”.
  - Pagina AEO/GEO: „Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)”.
- **Description:** 140–160 de caractere, unică pe fiecare pagină, cu diacritice corecte.
- **Descrierea fixă**, folosită identic peste tot: „Alex Ionescu – consultant SEO și web design, București”. Apare în `WebSite.alternateName`, `Person.description`, subsol și prima linie din llms.txt, și trebuie să fie identică pe LinkedIn și în Google Business Profile.
- **Un singur H1** pe pagină.
- **Canonical** absolut, din `site.config`.
- **Adrese** scurte, fără diacritice, cu cratimă, cu slash la final.

### 4.3 Acasă

1. **Antet.** Logo, meniu (Servicii, Cum lucrez, Proiecte, Ghiduri — apare doar după aprobare —, Despre, Contact) și butonul „Cereți o ofertă”.
2. **Zona de sus,** peste harta de metrou animată:
   - H1 pe un fundal alb, ca eticheta de pe o hartă de metrou. Ciornă: „Consultant SEO din București. Lucrez ca firma dumneavoastră să fie mai ușor de găsit în Google și în căutarea AI.” (o aprobă Alex). Prima variantă, „Vă ajut să fiți găsiți… în răspunsurile ChatGPT”, era prea aproape de o promisiune de rezultat;
   - un subtitlu de o frază;
   - „Fișa acestei pagini”, pe fundal albastru deschis;
   - butonul „Opriți trenurile”.
3. **„Ce vă supără?”**, pe fundal galben deschis. Titlul din schiță, „…la site-ul de acum?”, presupunea că vizitatorul are deja un site. Șase rânduri, câte unul pentru fiecare serviciu. Fiecare rând are o bară în culoarea grupului și un link spre serviciu. Ciornele rândurilor:
   - SEO (albastru): „Clienții nu vă găsesc în Google când caută ce vindeți.”
   - AEO/GEO (albastru): „Firma nu apare când cineva întreabă ChatGPT despre domeniul dumneavoastră.”
   - Audit (verde): „Vizitele din Google au scăzut și nu știți de ce.”
   - Creare site (galben): „Nu aveți încă un site sau aveți doar o pagină de Facebook.”
   - Redesign (roșu): „Site-ul arată învechit și nu mai seamănă cu firma de acum.”
   - Mentenanță (roșu): „Site-ul nu a mai fost actualizat de mult și se încarcă greu pe telefon.”

   Pe fundalul galben, bara galbenă se desenează în #8A5A00, ca să rămână vizibilă.
4. **„Cum lucrăm: două trasee”.** Componenta `RouteMap`, pe fundal albastru deschis.
   - Linia remedierii unice: Evaluare → Ofertă → Lucru → Raport. Se desenează în #8A5A00 (5,18:1 pe #EAF0FB), nu în galbenul tare, care pe fundalul albastru deschis are doar 1,63:1.
   - Linia albastră e abonamentul: aceleași stații, plus o buclă lunară.
   - Fiecare traseu are o etichetă text vizibilă, „Remediere unică” și „Remediere + abonament lunar”, ca diferența să nu stea doar în culoare. Etichetele stațiilor din buclă le confirmă Alex. Până atunci rămân [DE COMPLETAT], ca să nu inventez ce include abonamentul. Fără prețuri.
5. **Proiecte**, ca 2–3 fișe de dovezi: context, ce am făcut, rezultat verificabil sau [DE COMPLETAT], link.
6. **Întrebări frecvente generale**, 4–5, vizibile, fără acordeon. Nu repetă întrebările de pe paginile de servicii. Exemple: „Afișați prețuri?”, „Ce se întâmplă după ce trimit cererea?”, „Lucrați și cu firme din afara Bucureștiului?”, „Pot cere doar o remediere, fără abonament?”.
7. **Bandă albastră** cu îndemnul final și butonul „Cereți o ofertă”.
8. **Subsol negru.**

### 4.4 Pagina de serviciu (un singur șablon pentru toate 6)

1. Banda de sus: harta statică, cu linia grupului în față. Sub ea, firimiturile.
2. H1 cu cuvântul-cheie, apoi `raspunsDirect`: 2–3 fraze despre ce e serviciul și cui folosește.
3. „Pentru cine e” și „Semne că aveți nevoie”.
4. „Ce primiți”: lista de livrabile.
5. „Cum se desfășoară”: pașii, numerotați pentru că sunt o secvență. Duratele apar doar dacă le confirmă Alex.
6. Un proiect relevant, dacă există.
7. Întrebări frecvente, 4–6, vizibile. Fiecare răspuns începe cu răspunsul direct.
8. Pe SEO și AEO/GEO: un rând care spune că nu garantez poziții în Google sau apariții în răspunsurile motoarelor AI.
9. Servicii înrudite (legături interne) și ghidul legat, dacă există și e aprobat.
10. Un singur îndemn: „Cereți o ofertă”.

### 4.5 Celelalte pagini

- **`/servicii/`:** serviciile grupate pe cele 4 linii, fiecare cu `raspunsDirect` și „Ce primiți” pe scurt. Nu repetă indexul cu simptome de pe Acasă.
- **`/cum-lucrez/`:** `RouteMap` mare, cu cei patru pași explicați. Cele două formate apar fără cifre: „Prețul, reducerea și ce include abonamentul se stabilesc după evaluarea site-ului.” Pagina spune clar că lucrez doar cu firme, PFA-uri și alte entități profesionale.
- **Studiu de caz:** context → problema → ce am făcut → rezultat (doar ce se poate dovedi, scris ca text, cu sursa și data, plus capturi cu text alternativ) → serviciile folosite.
- **`/proiecte/acest-site/`:**
  - cum e construit site-ul;
  - zero cookie-uri și zero scripturi terțe;
  - scorurile Lighthouse și PageSpeed măsurate în producție, cu data și versiunea Lighthouse, sau [DE COMPLETAT] până atunci;
  - fără pretenția că schema FAQPage aduce fragmente îmbogățite în Google.
- **Ghid:** titlul-întrebare, răspunsul în primul paragraf, detaliile, data publicării și a actualizării, autorul (link spre Despre) și serviciul legat.
- **`/despre/`:** biografia reală, studiile, experiența, instrumentele, linkurile de profil și o fotografie reală când există (până atunci, doar text). Condiție de lansare.
- **`/contact/`:** formularul, telefonul (`tel:`), WhatsApp ca link simplu `https://wa.me/40724230051` (fără widget), `contact@<domeniu>`, „Din București, lucrez cu firme din toată țara”, plus blocul cu datele firmei.
- **Paginile legale:** vezi capitolul 7.
- **404:** un mesaj care spune ce s-a întâmplat, linkuri spre Acasă, Servicii și Contact. Fără hartă.

---

## 5. Design

### 5.1 Principii

- Site-ul se prezintă ca o **hartă de metrou a serviciilor**. Cele patru culori sunt cele ale liniilor M1–M4 din București (M1 galben, M2 albastru, M3 roșu, M4 verde), nu ale Google. Elementul memorabil e harta. Tot restul rămâne liniștit și disciplinat.
- Fără carduri colorate egale, fără umbre, fără gradiente decorative, fără imagini stoc, fără carusele, fără etichete cu majuscule deasupra titlurilor.
- Numerotare doar unde conținutul chiar e o secvență (pașii).
- Totul e aliniat la stânga.
- Doar temă luminoasă: paleta e construită pe alb.

### 5.2 Culori (tokenuri)

| Token | Valoare | Folosire |
|---|---|---|
| `--ink` | #14161A | text principal, subsol |
| `--ink-2` | #3F4650 | text secundar |
| `--paper` | #FFFFFF | fundal (~60%) |
| `--blue` | #2D6CDF | culoarea principală: logo, butoane, benzi, linia M2 |
| `--blue-dark` | #1A4FB8 | linkuri, butoane la hover (text alb, 7,36:1) |
| `--green` / `--green-dark` | #1F9D61 / #157347 | grupul diagnostic, linia M4 / text pe alb |
| `--yellow` / `--yellow-dark` | #F5B21B / #8A5A00 | grupul construcție, linia M1 / text și grafică pe alb |
| `--red` / `--red-dark` | #E0533D / #B8382A | grupul reparație, linia M3 / text pe alb, erori |
| `--tint-blue` | #EAF0FB | fișa paginii, secțiunea traseului |
| `--tint-yellow` | #FEF3D7 | indexul „Ce vă supără?” |
| `--tint-green` | #E8F5EE | blocuri din grupul diagnostic |
| `--tint-red` | #FCEDEA | blocuri din grupul reparație |
| `--rule` | #E6E8EC | linii despărțitoare |
| `--field-border` | #8A8F98 | contururile câmpurilor (3,25:1) |

**Reguli de contrast** (calculate, WCAG 2.1):
- Pe albastru apare doar text alb (4,86:1). Textul negru pe albastru are 3,73:1 și e interzis.
- Negru pe verde 5,22:1, pe galben 9,72:1, pe roșu 4,72:1. Textul alb pe verde, galben sau roșu e interzis.
- Variantele închise pe alb: 5,77–7,36:1.
- Pe tinturi (8–12%), textul închis trece de 4,96:1.
- Galbenul tare pe alb are 1,86:1. Nu se folosește pentru contururi, iconițe sau focus; grafica galbenă cu sens folosește #8A5A00.
- La hover, butonul nu se închide la culoare cu text negru pe el. Fie trece pe varianta închisă cu text alb, fie primește doar subliniere sau contur.
- Linkurile din text sunt mereu subliniate.
- **Focus:** `outline: 2px solid #14161A; outline-offset: 0;` plus `box-shadow: 0 0 0 4px #FFFFFF`, ca haloul alb să se vadă 2px în afara conturului (tehnica WCAG C40). Un `box-shadow` de doar 2px ar fi acoperit de contur. Pe orice fundal, unul dintre tonuri trece de 3:1. Focusul se verifică în subsol (#14161A), pe banda albastră și pe butonul în starea hover (#1A4FB8).
- **Erorile:** text #B8382A, mereu cu iconiță și cu text, niciodată doar culoare.
- **Subsolul:** text alb la 92% opacitate. Linkurile spre servicii au culoarea grupului: galben, verde, roșu, iar pentru albastru #6B9BF0 (6,53:1 pe #14161A). Celelalte linkuri sunt albe, subliniate.

**Proporții:** ~60% alb, ~30% culoare (benzi albastre pline cu text alb și tinturi deschise), ~10% negru. Culorile tari de verde, galben și roșu apar doar pe elemente mici: linii, stații, bara rândurilor, etichete. Cele patru culori nu stau niciodată în ordine, ca patru blocuri egale.

### 5.3 Tipografie

- **Titluri:** Bricolage Grotesque static, doar greutatea 700 (~33 KB pentru latin + latin-ext). `letter-spacing: -0.01em` la mărimile mari, înălțimea rândului 1,1–1,2.
- **Text:** Atkinson Hyperlegible Next, variabil doar pe axa de greutate (400–700, ~53 KB) sau static 400 și 700. 18px, înălțimea rândului 1,6, cel mult ~70 de caractere pe rând.
- **Fără italic:** `styles: ["normal"]` pentru ambele fonturi. Sublinierea logică (`em`) se face prin greutate. Un italic ar adăuga ~58 KB și ar depăși bugetul.
- **Scara** (raport ~1,25): 14,4 / 18 / 22,5 / 28 / 35 / H1 `clamp(2.25rem, 5vw, 3.5rem)`.
- **Etichete** în sentence case, fără majuscule.
- **Încărcarea fonturilor:**
  - găzduite pe site prin Astro Fonts API (furnizor Fontsource);
  - subseturile `latin` și `latin-ext`, ambele obligatorii pentru ă, ș și ț;
  - preîncărcare doar pentru fontul de titlu;
  - fonturi de rezervă cu metrici potrivite, ca textul să nu sară la încărcare (CLS).
- **Verificări:**
  - build-ul cade dacă găsește ş, ţ, Ş sau Ţ (U+015E/015F/0162/0163);
  - un script confirmă că fișierele woff2 livrate conțin U+0218–U+021B;
  - o pagină de test internă, nepublicată, arată „ȘȚĂÂÎ șțăâî „citat”” în toate greutățile.

### 5.4 Logo și iconițe

- **Logo:** „Alex Ionescu” în Bricolage Grotesque, urmat de virgula albastră (semnul de sub ș și ț) ca SVG inline.
- **Favicon:** virgula albastră pe fundal alb.
- **Iconițe:** puține, SVG inline, doar unde au sens: eroare, telefon, WhatsApp, e-mail.

### 5.5 „Fișa acestei pagini”

O listă `<dl>` lângă H1, pe `--tint-blue`:

| Rând | Ce arată |
|---|---|
| Greutate | totalul `transferSize` din Navigation și Resource Timing. O resursă se socotește din cache dacă `transferSize === 0` sau `transferSize < encodedBodySize` (revalidare). Dacă cel puțin o resursă e din cache, rândul arată totalul cu mențiunea „parțial din cache”. |
| Cereri | numărul de cereri |
| Cookie-uri setate de site | „0”, adică niciun cookie vizibil pentru scripturi (`document.cookie`). Lipsa antetelor `Set-Cookie` se verifică separat, în producție (7.3), pentru că `document.cookie` nu vede cookie-urile HttpOnly. |
| Scripturi terțe | numărul de `<script src>` de pe alt domeniu, adică 0 |
| Date structurate | tipurile citite din JSON-LD-ul paginii |

Sub listă: cele patru linii colorate (albastrul dominant) și linkul „Ce citește un motor AI”, spre `/llms.txt`.

**Fără JavaScript:** rândurile care se măsoară în browser afișează „se măsoară în browserul dumneavoastră”. Celelalte arată valorile adevărate prin construcție, calculate la build.

**Cum rulează:** scriptul inline are sub 1 KB și pornește după `load`, cu `(window.requestIdleCallback || (cb => setTimeout(cb, 200)))`. Safari nu are `requestIdleCallback`. Înălțimea blocului e rezervată (cifre `tabular-nums`, lățime minimă), iar blocul nu e niciodată elementul LCP. Nicio cifră nu e scrisă de mână.

### 5.6 Harta de metrou

- **Construcție:** SVG inline, decorativ (`aria-hidden="true"`). Patru linii, M1–M4, în culorile grupurilor, la opacitate redusă, cu unghiuri de 45° ca pe hărțile de metrou, plus stații albe cu contur. Fără etichete și fără logo Metrorex.
- **Animată (doar pe Acasă):**
  - pe fiecare linie circulă câte un „tren”: un punct cu miez alb și halou în culoarea liniei, cu viteză constantă, câte 7–11 secunde pe parcurs, pornite decalat;
  - sub 640px rămân 2 linii și 2 trenuri;
  - liniile ocolesc titlul, iar titlul stă pe un fundal alb ca să rămână lizibil când trece un tren.
- **Pornirea trenurilor depinde de script.** Trenurile și butonul există în HTML cu atributul `hidden`. Scriptul de pe Acasă le afișează și pornește animația doar după ce a legat butonul și doar dacă `prefers-reduced-motion: no-preference`. Cu SMIL, animația are `begin="indefinite"` și o pornește scriptul; cu CSS, o clasă pusă de script. Fără JavaScript sau cu „reduced motion”, harta de pe Acasă rămâne statică, fără trenuri și fără buton. Așa nu există niciodată mișcare fără un buton de oprire care funcționează (WCAG 2.2.2).
- **Butonul:**
  - eticheta alternează între „Opriți trenurile” și „Porniți trenurile”, fără `aria-pressed` (cele două tipare se exclud);
  - e accesibil de la tastatură;
  - e cerut de WCAG 2.2.2, pentru că animația durează mai mult de 5 secunde.
- **Oprirea automată:** trenurile stau când zona iese din ecran (IntersectionObserver). Alegerea vizitatorului are prioritate: după „Opriți trenurile”, IntersectionObserver nu le mai repornește, doar butonul o face.
- **Implementare:** SMIL `animateMotion` sau CSS `offset-path`, alese la implementare, după testul pe Chrome, Safari și Firefox. Condiția: oprirea să funcționeze și să nu existe nicio bibliotecă.

**Harta pe fiecare tip de pagină** (sursa unică; coloana din 4.1 trebuie să corespundă):

| Pagina | Harta |
|---|---|
| Acasă | animată. Sub 640px: M2 (albastru) și încă o linie, 2 trenuri. |
| Paginile de serviciu | statică: linia grupului plină, celelalte estompate. Toate patru și pe mobil. |
| Studiu de caz | statică, cu linia primului serviciu din `servicii[]` plină |
| Ghid | statică, cu linia din `serviciuLegat` plină |
| `/servicii/`, `/cum-lucrez/`, `/proiecte/`, `/ghiduri/`, `/despre/`, `/contact/` | statică, toate liniile la fel de estompate |
| Paginile legale, 404, mulțumire, eroare | fără hartă |

### 5.7 Mișcare

| # | Ce | Declanșare | Detalii | Cu „reduced motion” / fără suport |
|---|---|---|---|---|
| M1 | Fișa se completează, cele patru linii se desenează | o dată, la încărcare | doar `transform` și `opacity`, decalaj de 80ms între rânduri, sub 900ms în total. H1 și subtitlul nu se animă niciodată. | starea finală, instant |
| M2 | Trenurile pe hartă | continuu, doar pe Acasă | vezi 5.6 | trenurile ascunse |
| M3 | Traseul celor două formate se trasează | la derulare | `stroke-dashoffset` cu `animation-timeline: view()`, în `@supports` și `prefers-reduced-motion: no-preference` | traseul apare complet, desenat |
| M4 | Linia din index devine banda paginii de serviciu | la navigare | CSS nativ: `@view-transition { navigation: auto; }` declarat doar în `@media (prefers-reduced-motion: no-preference)`, cu `view-transition-name` unic pe fiecare serviciu, dat prin clasă. Fără ClientRouter. | navigare normală, fără tranziție (și în Firefox, Samsung Internet) |
| M5 | Micro-interacțiuni | hover, focus, trimitere | subliniere în 150ms, starea „Se trimite…” la formular (doar cu JS) | fără tranziții |

Conținutul e vizibil mereu, inclusiv fără JavaScript. Nimic nu ascunde text până rulează un script. Nicio animație nu schimbă layoutul. Se animă doar:
- `transform` și `opacity`;
- poziția pe traseu (`animateMotion` sau `offset-distance`);
- `stroke-dashoffset`, pentru liniile desenate, care doar repictează.

Nimic nu mută conținutul (CLS).

### 5.8 Layout

- Containerul are maximum 72rem. Grilă de 12 coloane pe desktop și o coloană pe mobil.
- Margini laterale: 16px pe mobil, 24px pe desktop. Fără derulare pe orizontală.
- Colțuri de 6px pe blocuri și butoane. Contururi de 1px. Fără umbre.
- Butoanele, câmpurile, linkurile din meniu și din subsol și rândurile indexului au o zonă de atingere de minimum 44×44px. Linkurile din interiorul textului sunt exceptate. E o țintă proprie: în WCAG 2.1, criteriul 2.5.5 (44px) e de nivel AAA.

---

## 6. SEO tehnic, date structurate și citirea de către AI

### 6.1 Indexare

- Canonical pe fiecare pagină.
- Paginile noindex: mulțumire, eroare, 404 și tot ce se servește de pe `*.workers.dev`.
- Firimituri vizibile pe toate paginile, în afară de Acasă.
- Legături interne:
  - serviciu ↔ servicii înrudite;
  - serviciu ↔ ghid legat;
  - serviciu ↔ proiect;
  - Acasă → toate serviciile, prin index.

### 6.2 Open Graph

- `og:title`, `og:description`, `og:url`, `og:type`, `og:locale=ro_RO`, `og:site_name=Alex Ionescu`.
- `og:image` de 1200×630 pe fiecare pagină, plus `twitter:card=summary_large_image`.

### 6.3 Datele structurate (un `@graph` pe pagină, noduri legate prin `@id`)

| Pagina | Noduri |
|---|---|
| Toate | `WebSite` (`/#website`: name „Alex Ionescu”, alternateName = descrierea fixă, `inLanguage` „ro-RO”, publisher `#alex`) și `Person` (`/#alex`, minimal: name, url `/despre/`) |
| Acasă | `WebPage` (about `#alex`), `FAQPage` |
| Serviciu | `Service` (name, serviceType, description, provider `#alex`, areaServed = România, url), `BreadcrumbList`, `FAQPage` |
| `/servicii/` | `CollectionPage` și `ItemList` cu serviciile, `BreadcrumbList` |
| `/cum-lucrez/` | `WebPage`, `BreadcrumbList` |
| `/proiecte/` | `CollectionPage`, `BreadcrumbList` |
| Studiu de caz | `Article` (about = serviciile folosite, author `#alex`), `BreadcrumbList` |
| `/ghiduri/` | `CollectionPage` și `ItemList` cu ghidurile, `BreadcrumbList` |
| Ghid | `Article` (headline, datePublished, dateModified, author și publisher `#alex`), `BreadcrumbList` |
| Despre | `ProfilePage` (mainEntity `#alex`, complet; vezi mai jos), `BreadcrumbList` |
| Contact | `ContactPage`, `BreadcrumbList` |
| Paginile legale | `WebPage`, `BreadcrumbList` |

**`Person` complet (pe Despre):**
- name;
- jobTitle „Consultant SEO și web designer”;
- description = descrierea fixă;
- address `PostalAddress` (addressLocality București, addressCountry RO);
- areaServed România, knowsAbout;
- email `contact@<domeniu>`, telefon;
- `taxID`, după ce e cunoscut CUI-ul;
- `sameAs` doar spre profiluri reale, inclusiv Google Business Profile;
- `image`, doar după ce există o fotografie reală.

**Ce nu se folosește:**
- `ProfessionalService`: e marcat ca învechit în schema.org și cere adresa completă;
- `Review`/`AggregateRating`: recenziile publicate de firma însăși nu sunt eligibile;
- `HowTo`.

Google nu mai afișează întrebările frecvente ca fragmente îmbogățite (din 2026). Schema FAQPage rămâne pentru că o cere brieful și pentru că o citesc mașinile, dar niciun text de pe site nu promite efecte vizibile în Google.

### 6.4 Pentru motoarele AI

- Primul paragraf de pe fiecare pagină răspunde direct la întrebare.
- „Alex Ionescu” apare cu numele în paragrafele-cheie, ca pasajele să aibă sens și citite separat.
- Rezultatele sunt scrise ca text, cu sursă și dată.
- Termenii se explică pe înțeles: „căutarea AI (AEO și GEO)”, nu doar acronimele.
- ChatGPT apare doar ca denumire, fără logo și fără să sugereze vreo afiliere.
- Crawlerele AI sunt permise. Restrângerea lor e o decizie separată, pentru mai târziu.

### 6.5 llms.txt

Fișier generat la build:
- H1 = descrierea fixă;
- un paragraf cu rezumatul;
- secțiuni de linkuri: Servicii (6, fiecare cu o frază), Cum lucrez, Proiecte, Ghiduri aprobate, Despre, Contact.

Trebuie să treacă auditul llms.txt din Lighthouse 13.3+ (are H1, are linkuri, nu e prea scurt). Nu e prezentat ca factor de poziționare.

### 6.6 După lansare (în responsabilitatea lui Alex, cu pașii din README)

- Search Console: verificare și trimiterea sitemap-ului.
- Bing Webmaster Tools.
- IndexNow, prin Crawler Hints.
- Google Business Profile, cu același nume, telefon, site și aceeași descriere.

---

## 7. Partea legală

### 7.1 Datele firmei (Legea 365/2002, art. 5)

Componenta `LegalId` apare în subsolul fiecărei pagini, pe `/contact/`, în Politica de confidențialitate (la operator) și în Termeni. Conține:
- denumirea exactă a PFA, ca la Registrul Comerțului;
- adresa completă a sediului profesional;
- numărul de ordine din Registrul Comerțului, exact ca în certificatul de înregistrare. Poate fi în formatul vechi F40/…/… sau în cel nou, de 14 caractere. `check:launch` cere doar ca valoarea să fie completată, fără să impună un format;
- CUI-ul, telefonul și e-mailul.

Toate datele vin din `site.config.ts`. În JSON-LD apare doar orașul. Până se completează, apar ca [DE COMPLETAT], iar lansarea e blocată.

### 7.2 Politica de confidențialitate (GDPR art. 13)

1. **Operatorul:** PFA, cu datele din `LegalId`. Nu e nevoie de responsabil cu protecția datelor (DPO).
2. **Scopuri și temeiuri:**
   - **Răspunsul la cererea de ofertă:**
     - art. 6(1)(b), când cel care scrie ar fi el însuși parte în contract (PFA, întreprindere individuală sau familială);
     - art. 6(1)(f), când scrie în numele unei persoane juridice (administrator, angajat).
   - **Corespondența ulterioară:** 6(1)(f).
   - **Contractele și facturarea:** 6(1)(b) și 6(1)(c).
   - **Jurnalele tehnice de găzduire și securitate:** 6(1)(f).

   Pentru fiecare temei 6(1)(f), politica numește interesul legitim (art. 13(1)(d)). De exemplu: să răspund cererilor primite de la firme, să păstrez istoricul discuției, să protejez site-ul de abuz.
3. **Destinatari:** Cloudflare (găzduire, CDN, Worker, Email Routing), Google (căsuța Gmail), contabilul. Meta doar dacă vizitatorul alege WhatsApp.
4. **Transferuri în afara SEE**, descrise separat pentru fiecare destinatar (art. 13(1)(f)):
   - **Cloudflare, Inc. (SUA):** pe baza deciziei de adecvare UE-SUA (Data Privacy Framework, Decizia (UE) 2023/1795) și a clauzelor contractuale standard din acordul de prelucrare Cloudflare.
   - **Gmail:** în SEE îl furnizează Google Ireland Limited. Pentru Gmail nu există un contract de prelucrare separat, iar politica nu afirmă altceva.

   Înainte de lansare și la fiecare actualizare, se verifică certificarea DPF pe dataprivacyframework.gov și se notează data verificării.
5. **Durata de păstrare:** [DE COMPLETAT] de Alex. Termenele fiscale se confirmă cu contabilul.
6. **Drepturi:** art. 15–22. Dreptul de opoziție (art. 21) apare într-un paragraf separat, vizibil.
7. **Plângere la ANSPDCP:** B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, 010336 București, anspdcp@dataprotection.ro.
8. **Furnizarea datelor** e necesară ca vizitatorul să primească un răspuns.
9. **Decizii automate:** nu există.
10. **Data ultimei actualizări.**

**Ce nu se scrie:** „date stocate doar în UE”, „certificat GDPR” sau orice altă afirmație neverificată.

### 7.3 Politica de cookie-uri

Textul politicii:

> Site-ul nu folosește cookie-uri de analiză, de marketing sau de preferințe și nici tehnologii similare (stocare locală, pixeli, amprentare). Singura excepție: dacă protecția Cloudflare vă cere o verificare de securitate (de exemplu în timpul unui atac), Cloudflare poate seta cookie-ul strict necesar `cf_clearance`, fără de care verificarea nu funcționează.

Protecția DDoS a Cloudflare e mereu pornită și poate cere astfel de verificări, deci o formulare absolută („niciun cookie”) n-ar fi adevărată. Cookie-ul e strict necesar, așa că nu cere consimțământ sau banner.

Afirmația rămâne adevărată doar cu setările din 3.6 (Web Analytics, Bot Fight Mode, Turnstile și Email Address Obfuscation oprite). Înainte de lansare și după orice schimbare de setări, se verifică în producție antetele `Set-Cookie`, stocarea din browser și HTML-ul servit (3.6).

### 7.4 Termenii site-ului

Conțin:
- cine e furnizorul (`LegalId`);
- colaborez doar cu profesioniști (B2B);
- conținutul site-ului e proprietatea autorului;
- ghidurile sunt informații generale;
- nu garantez poziții în Google și nici apariții în răspunsurile motoarelor AI;
- o cerere de ofertă nu obligă pe nimeni;
- o colaborare începe doar pe bază de ofertă sau contract scris;
- „Site-ul e administrat din România, de un PFA înregistrat în România.”

**Nu conțin** clauze comerciale: durata minimă, preavizul, ce se întâmplă cu reducerea dacă abonamentul se oprește devreme, plăți, drepturi asupra livrabilelor, accese, limitarea răspunderii, legea aplicabilă. Acestea merg într-un contract-tip separat, verificat de un avocat, cu acceptare expresă pentru clauzele din art. 1203 Cod civil. Pentru mentenanța site-urilor cu date personale (de exemplu comenzi WooCommerce), contractul are nevoie de un acord de prelucrare după art. 28 GDPR. Contractul nu intră în acest proiect.

---

## 8. Reguli de conținut

- **Limba:** română naturală, cu diacritice corecte (ș și ț cu virgulă), scrisă la persoana I, caldă și directă. Vizitatorul e numit „dumneavoastră”.
- **Nimic inventat:** testimoniale, clienți, cifre, premii, durate, timp de răspuns. Unde lipsește o dovadă, apare marcajul vizibil [DE COMPLETAT].
- **Fără promisiuni de rezultat sau de termen** („prima pagină”, „garantat”, „apăreți în ChatGPT”). Textele descriu ce face Alex și ce primește clientul.
- **Testimoniale și recenzii:** doar reale, cu acordul scris al clientului, ca text cu nume și link spre Google Business Profile. Fără widget Google și fără schema Review.
- **Aprobare:** eu scriu ciornele (paginile, întrebările frecvente, cele 2 ghiduri), iar Alex le aprobă rând cu rând. Un text neaprobat nu ajunge în producție: aprobarea e câmpul `aprobat` din colecții și din `src/approvals.ts` (3.4), verificat de `check:launch`.
- **Același verb pe tot parcursul:** „Cereți o ofertă” (îndemnul) → „Trimiteți cererea” (butonul din formular) → „Am primit cererea dumneavoastră” (pagina de mulțumire).

---

## 9. Performanță și accesibilitate

### 9.1 Bugete

- **JavaScript:** sub 3 KB pe Acasă (fișa, trenurile, butonul de oprire, toate inline). Pe pagina de contact, sub 2 KB pentru formular. 0 KB pe celelalte pagini.
- **CSS:** cel mult 25 KB pe pagină, necomprimat.
- **Fonturi:** doar fontul de titlu se preîncarcă, cu ambele subseturi.
- **Greutatea paginii Acasă:** sub 150 KB transferați. Se măsoară în producție, cu Brotli și cache gol (auditul `total-byte-weight` din Lighthouse, rulat pe domeniu), nu pe `wrangler dev`, unde nu există compresia Cloudflare. Bugetul ține doar cu fonturile din 5.3: Bricolage static 700, Atkinson doar pe axa de greutate, fără italic. Împreună au ~86 KB.
- **În Lighthouse pe mobil:** LCP sub 2,5 s, CLS sub 0,05, TBT sub 100 ms.
- **Imagini:** AVIF sau WebP prin `astro:assets`, cu `width`/`height` declarate, încărcare leneșă (`loading="lazy"`) sub prima ecranare și text alternativ.

### 9.2 Accesibilitate (WCAG 2.1 AA)

- Un singur H1, titluri în ordine.
- Link de salt la conținut.
- Ordinea focusului e cea logică, iar focusul e vizibil peste tot (5.2).
- Formular:
  - fiecare câmp are o etichetă vizibilă;
  - erorile sunt legate de câmp prin `aria-describedby`;
  - câmpurile obligatorii sunt marcate în text, nu doar cu culoare.
- Linkurile au text care spune unde duc. Rândurile din index sunt linkuri reale. Fără carduri complet clicabile care ascund textul.
- Firimituri în `nav aria-label="Firimituri"` cu `ol`, iar ultima are `aria-current="page"`.
- Mișcarea: vezi 5.6 și 5.7 (butonul de oprire, „reduced motion”).
- `lang="ro"` pe `<html>`.

---

## 10. Testare și verificare

**Pentru fiecare pagină, înainte de următoarea:**
1. `astro check` și build-ul trec.
2. Validare HTML (html-validate).
3. Fără diacritice cu sedilă.
4. Testele axe trec, prin Playwright și `@axe-core/playwright`. Se verifică și:
   - focusul;
   - „reduced motion”;
   - formularul fără JavaScript, inclusiv păstrarea textului la erori;
   - harta de pe Acasă fără JavaScript (statică, fără buton);
   - lipsa încălcărilor CSP în consolă, pe build.
5. Lighthouse 13 pe mobil, rulat local cu `wrangler dev`, mediana din 3 rulări: pragurile din capitolul 1 (paginile noindex au excepțiile de acolo). Chrome e instalat pe mașină. Greutatea paginii se judecă doar în producție (9.1).
6. JSON-LD:
   - un script verifică tipurile așteptate, legăturile `@id` și câmpurile obligatorii;
   - verificare manuală în Schema Markup Validator și în Rich Results Test, pentru BreadcrumbList, Article și ProfilePage.
7. Linkuri: `linkinator` peste `dist/`, recursiv. Linkurile externe se verifică separat.
8. O captură de ecran pe mobil și una pe desktop, revizuite înainte de pagina următoare.

**Worker-ul**, cu teste scrise înaintea codului (TDD), în vitest cu pool-ul Workers:
- validarea câmpurilor;
- câmpul-capcană;
- limita de trimiteri;
- formatul e-mailului (Reply-To, subiect);
- redirecționările 303;
- formularul reafișat la erori: valorile păstrate și escapate, mesajele legate de câmpuri, status 400;
- răspunsurile JSON pentru `Accept: application/json` (200, 422, 429, 502);
- antetele de securitate puse de Worker;
- lipsa oricărui `console.log` cu datele din formular;
- refuzul altor metode în afară de POST.

**La final, un raport cu:**
- scorurile Lighthouse ale fiecărei pagini;
- rezultatul validării schemei;
- linkurile rupte, dacă există;
- lista completă a marcajelor [DE COMPLETAT].

**Scorurile pentru `/proiecte/acest-site/`** se măsoară doar în producție, cu data și versiunea. Pe `workers.dev` categoria SEO pică intenționat, din cauza noindex.

---

## 11. Condiții de lansare și publicare

Comanda `npm run check:launch` refuză lansarea până când:
1. datele PFA sunt reale (denumire, numărul de la Registrul Comerțului, CUI, adresa sediului);
2. domeniul final e setat în `site.config.ts`;
3. pagina Despre e completă (biografie, studii, experiență, instrumente, LinkedIn);
4. nicio pagină construită nu are `aprobat: false` (3.4), inclusiv întrebările frecvente din paginile de servicii și de pe Acasă;
5. durata de păstrare a datelor e completată în Politica de confidențialitate;
6. nu mai există niciun [DE COMPLETAT] dintr-un rând marcat „Da” în coloana „Blochează lansarea?” a registrului din capitolul 12. Asta include etichetele buclei lunare și răspunsurile la întrebările frecvente. `check:launch` citește lista blocantă din același registru, păstrat în `src/placeholders.ts`.

Celelalte marcaje (fotografia, rezultatele, scorurile acestui site) pot rămâne vizibile la lansare.

Pagina `/proiecte/szitrans/` se construiește doar cu `acord: true` (3.4). Lipsa acordului nu blochează lansarea, doar pagina.

**Publicarea:**
- se face numai după un „da” explicit de la Alex;
- contul Cloudflare e creat de Alex și pe numele lui;
- `wrangler login` îl face Alex;
- Alex schimbă nameserverele la registrar și cumpără domeniul. Eu nu cumpăr și nu creez conturi.

---

## 12. Registrul marcajelor [DE COMPLETAT]

| # | Ce lipsește | Cine | Blochează lansarea? |
|---|---|---|---|
| 1 | Datele PFA: denumire, numărul de la Registrul Comerțului, CUI | Alex | Da |
| 2 | Adresa sediului profesional (decizie: adresa înregistrată sau mutare) | Alex | Da |
| 3 | Domeniul final | Alex | Da |
| 4 | Despre: biografie, studii, experiență, instrumente | Alex (eu redactez) | Da |
| 5 | Profiluri pentru `sameAs` (LinkedIn etc.) | Alex | Da, pentru LinkedIn |
| 6 | Fotografie reală | Alex | Nu |
| 7 | Acordul scris de la szitrans, plus rezultate verificabile și capturi datate | Alex | Doar pentru pagina szitrans |
| 8 | Textul studiului anonim al magazinului online, aprobat, cu capturi anonimizate | Alex | Doar pentru acea pagină |
| 9 | Acordul mayalashes | Alex | Nu (pagina nu există până atunci) |
| 10 | Rezultatele din studiile de caz (cifre, perioadă, sursă) | Alex | Nu |
| 11 | Scorurile acestui site, măsurate în producție | eu, după lansare | Nu |
| 12 | Volumele cuvintelor-cheie (Keyword Planner) | Alex | Nu |
| 13 | Răspunsurile la întrebările frecvente (6 × 4–6, plus 4–5 pe Acasă) | eu redactez, Alex aprobă | Da |
| 14 | Duratele și pașii fiecărui serviciu, doar dacă Alex îi confirmă | Alex | Nu |
| 15 | Etichetele buclei lunare din traseul abonamentului | Alex | Da |
| 16 | Textele celor 2 ghiduri | eu redactez, Alex aprobă | Nu (secțiunea e ascunsă până atunci) |
| 17 | Durata de păstrare a datelor din formular | Alex (cu contabilul) | Da |
| 18 | Timpul de răspuns promis, doar dacă Alex îl confirmă | Alex | Nu |
| 19 | Testimoniale reale, cu acord | Alex | Nu |
| 20 | Linkul spre Google Business Profile | Alex | Nu |

---

## 13. În afara proiectului

- Crearea profilului Google Business și strângerea recenziilor (Alex).
- Contractul-tip și clauzele comerciale ale abonamentului (Alex, cu un avocat).
- Cumpărarea domeniului, crearea contului Cloudflare, schimbarea nameserverelor (Alex).
- Validarea volumelor de căutare (Alex).
- Ghidurile 3–5 din planul inițial (mai târziu, în ritmul lui Alex).
- O căsuță de e-mail reală pe domeniu și trecerea formularului pe Resend (doar dacă Alex o cere).

## 14. Riscuri și puncte deschise

- **Adresa sediului** e încă nedecisă și blochează lansarea.
- **szitrans:** am presupus că numele poate apărea. Acordul scris e condiție pentru pagină.
- **Email Routing ocupă înregistrările MX** ale domeniului (vezi 3.5).
- **Firefox și Samsung Internet** nu au tranziții între pagini, iar Firefox nu are animații legate de derulare. Pe ele site-ul funcționează normal, doar fără efectul respectiv.
- **Lighthouse local** poate da altceva decât PageSpeed Insights, care rulează pe o versiune mai veche de Lighthouse. Pe site se publică doar valori măsurate în producție, cu data și versiunea.
- **Formularul fără confirmare** pe e-mail pentru vizitator: e o limitare acceptată.
