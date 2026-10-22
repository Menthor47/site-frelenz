# Site-ul Alex Ionescu: specificație de design

Data: 2026-10-21. Stare: revizuită după critica externă, în așteptarea aprobării lui Alex.
Pornește de la `plan-site-alex-ionescu.md` (planul lui Alex) și de la deciziile luate în discuția din 21 octombrie 2026. Unde planul și această specificație diferă, câștigă specificația: diferențele au fost discutate și aprobate.

---

## 1. Obiectiv și criterii de succes

**Ce este:** site-ul personal de prezentare al lui Alex Ionescu, consultant SEO și web design din București. Servicii: SEO, audit SEO, creare site de prezentare, redesign, mentenanță (aducere la zi), optimizare pentru căutarea AI (AEO și GEO). Două formate de colaborare: remediere unică, sau remediere la preț redus plus abonament lunar. Clienții sunt doar profesioniști: firme, PFA-uri și alte entități profesionale din toată țara.

**Pentru ce:** cereri de ofertă de la proprietari de firme mici și mijlocii din România.

**Succes înseamnă:**
1. Vizitatorul înțelege în 10 secunde ce face Alex și pentru cine.
2. Găsește serviciul de care are nevoie pornind de la problema pe care o are.
3. Trimite o cerere de ofertă.
4. Site-ul dovedește singur ce vinde: rapid, fără cookie-uri și fără scripturi terțe, ușor de citit pentru Google și pentru motoarele AI.

**Ținte măsurabile:**
- **Lighthouse 13 pe mobil**, mediana din 3 rulări:
  - pe fiecare pagină indexabilă, cel puțin 90 la Performanță, Accesibilitate, Bune practici și SEO;
  - pe paginile noindex (`/contact/multumim/`, `/contact/eroare/`, `/contact/prea-multe-linkuri/` și 404), cel puțin 90 la Performanță, Accesibilitate și Bune practici. La SEO sunt acceptate pe ele doar eșecurile auditului `is-crawlable` și, pe 404, ale auditului `http-status-code`;
  - categoria „Agentic Browsing” din Lighthouse 13.3+ se raportează separat și nu e criteriu de acceptare.
- WCAG 2.1 AA.
- Zero cookie-uri, zero scripturi terțe, zero cereri către alte domenii.

---

## 2. Registrul deciziilor

| # | Subiect | Decizia |
|---|---|---|
| 1 | Formular | Cloudflare Worker + Email Routing, spre `idealserv51@gmail.com` (adresă de destinație verificată). |
| 1b | Găzduire | Cloudflare Workers cu fișiere statice (recomandarea actuală Cloudflare pentru proiecte noi), cu DNS-ul domeniului mutat la Cloudflare. Înlocuiește „Cloudflare Pages” din plan. |
| 2 | Statistici | Niciun script de statistici: Search Console, Bing Webmaster Tools și statisticile Cloudflare de pe server. Fără banner de cookie-uri. Cloudflare Web Analytics rămâne oprit, inclusiv injectarea automată. |
| 3 | Culori | Hexurile din plan, cu albastrul dominant. Proporții: 60% alb, 30% culoare, 10% negru (subsolul). |
| 4 | Pagina Acasă | Zona de sus are un singur rol: H1-ul „Consultant SEO din București”, un subtitlu de o frază și butonul „Cere o ofertă”, peste harta de metrou. Urmează „De unde pornești?” (schema de linie din vagon), traseul cu cele două formate, proiectele, întrebările frecvente și îndemnul final. Fișa paginii se mută pe `/proiecte/acest-site/`. |
| 5 | Harta de metrou | Animată doar pe Acasă: trenuri continue, cu un buton mic „Oprește trenurile”. Pe paginile de serviciu, de studiu de caz și de ghid e statică, cu linia grupului în față și marcajul „Ești aici”. Pe celelalte pagini, vezi tabelul din 5.6. |
| 6 | Ghiduri | 2 la lansare: „De ce nu apare site-ul meu în Google” și „Ce este GEO și prin ce diferă de SEO și AEO”. Secțiunea apare în meniu și în sitemap doar după ce Alex aprobă textele. |
| 7 | Google Business Profile | Da, cu zonă deservită (București și Ilfov) și adresa ascunsă. Îl face Alex. Recenzii doar de la clienți reali. |
| 8 | Clienți | Doar profesioniști (B2B), declarat pe site. Fără pictograma ANPC, fără procedura de retragere în 14 zile și fără link SOL (platforma s-a închis în iulie 2025). |
| 9 | Lansare | Abia după ce pagina Despre e completă. LinkedIn e opțional. |
| 10 | E-mail public | `contact@<domeniu>`, redirecționat spre Gmail prin Email Routing. |
| 11 | Fonturi | Doar Atkinson Hyperlegible Next, la greutățile 400, 700 și 800. |
| 12 | Cuvânt-cheie web design | „creare site de prezentare”, la adresa `/servicii/creare-site/`. Unghiul din titlu: „…gândit să aducă cereri de ofertă” („care aduce” promitea un rezultat). |
| 13 | Cuvânt-cheie Acasă | „consultant SEO din București”. „servicii SEO” rămâne doar pe `/servicii/seo/`. |
| 14 | Repo | GitHub privat. Planul lui Alex rămâne în git. Proiectele cu nume și fără acord nu se construiesc, deci nu apar pe site-ul public (regula completă în 3.4). |
| 15 | Adresa sediului | Amânată de Alex. Până se decide, lansarea e blocată. |
| 16 | Adresare | „Tu”, într-un ton lejer, la persoana I, fără „dumneavoastră”. Butonul principal: „Cere o ofertă”. Alex a schimbat decizia față de brieful inițial. |
| 17 | Marcaje în producție | [DE COMPLETAT] nu apare niciodată pe site-ul public. Un câmp opțional gol nu afișează nimic. Marcajele se văd doar în previzualizarea locală (`DRAFT=1`, construită separat, în `dist-draft/`), iar `check:launch` cade dacă textul apare în `dist/`. |
| 18 | Datele firmei în subsol | Subsolul are varianta scurtă (denumire, CUI, număr la Registrul Comerțului, „București”) și linkul „Date de identificare”. Adresa completă stă pe `/contact/#date-firma`, în Termeni și în Politica de confidențialitate. |
| 19 | Logo | „Alex Ionescu, consultant SEO”: virgula e intenționată și albastră. |
| 20 | Formular | Fără JavaScript. Browserul validează, iar serverul aplică aceleași reguli, dintr-un singur fișier. Singura regulă pe care browserul n-o poate verifica e limita de linkuri: mesajele cu peste 3 linkuri nu pleacă, iar regula e scrisă sub câmp. |
| 21 | Aprobare | Alex aprobă pagină cu pagină. Fiecare serviciu are 4 întrebări frecvente. |

---

## 3. Arhitectura

### 3.1 Stack

- **Astro 7.4.x**, generat 100% static, fără adaptor. Versiunea exactă se fixează la inițializare.
- **Node 24 LTS**, fixat în `.node-version` și în `engines`, ca build-ul local să fie identic cu cel de pe Cloudflare. Node 26 de pe mașina locală e „Current”, nu LTS.
- **Cloudflare Workers** cu fișiere statice (`assets.directory = "./dist"`), plus un singur Worker pentru `/api/*`.
- **Două build-uri separate:**
  - `npm run build` produce site-ul public în `dist/`;
  - `npm run preview:draft` (`DRAFT=1`) produce previzualizarea locală în `dist-draft/`, cu toate paginile (inclusiv cele neaprobate sau fără acord) și cu marcajele vizibile.

  `npm run deploy` face build-ul fără `DRAFT`, rulează `check:launch`, apoi `wrangler deploy`. Așa o previzualizare nu poate ajunge publicată din greșeală.
- Fără framework de UI, fără bibliotecă de animații, fără framework CSS. CSS-ul e scris de mână, pe tokenuri.
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
    placeholders.ts         registrul din capitolul 12, citit de check:launch
    form-rules.ts           regulile formularului, citite și de HTML, și de Worker
    content/
      servicii/*.md         6 servicii
      proiecte/*.md         studii de caz (cu acord și aprobat)
      ghiduri/*.md          ghiduri (cu aprobat)
    layouts/                Base, Service, CaseStudy, Guide, Legal
    components/             vezi 3.3
    pages/                  rute, inclusiv llms.txt, robots.txt și imaginile OG
    styles/                 tokens.css, base.css, componente
    client/                 două scripturi mici, puse inline: trains (Acasă), page-facts (acest-site)
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

Fiecare componentă are un singur rol și își primește datele prin props, din `site.config.ts` sau din colecții.

| Componentă | Rol | Depinde de |
|---|---|---|
| `SeoHead` | title, description, canonical, Open Graph, robots, `lang="ro"` | site.config, props de pagină |
| `JsonLd` | un singur `@graph` per pagină (vezi 6.3) | site.config, conținutul paginii |
| `Header` | logo, meniu și butonul „Cere o ofertă”. Butonul lipsește pe Acasă (acolo butonul plin e sub titlu) și pe `/contact/` (ar trimite la aceeași pagină). „Contact” rămâne în meniu. | site.config |
| `Footer` | servicii, pagini, contact, `LegalId` în varianta scurtă, linkuri legale. Fraza despre cum e făcut site-ul apare doar după ce `/proiecte/acest-site/` există. | site.config, colecția servicii |
| `LegalId` | datele firmei cerute de Legea 365/2002: `variant="scurt"` în subsol, `variant="complet"` pe Contact, în Termeni și în Confidențialitate | site.config |
| `MetroMap` | harta SVG: `variant="animated"` pe Acasă și `variant="static"` în rest. `line` e opțional: cu `line`, linia aceea e plină și are „Ești aici”; fără `line`, toate liniile sunt estompate. Unde apare și cum, vezi tabelul din 5.6. | tokenuri de culoare |
| `LineDiagram` | „De unde pornești?”: fiecare rând e un tronson scurt de linie, cu stația-problemă, segmentul în culoarea grupului și capătul de linie cu serviciul, ca link | colecția servicii (câmpurile `problema`, `ordine`) |
| `RouteMap` | cele două trasee (remediere unică, abonament), desenate static | text din conținut |
| `PageFacts` | fișa paginii, doar pe `/proiecte/acest-site/` (vezi 5.5) | script inline mic |
| `Faq` | întrebări vizibile, cu FAQPage în graf | props |
| `Breadcrumbs` | firimituri vizibile (`nav` + `ol`), cu BreadcrumbList | ruta |
| `Cta` | îndemnul „Cere o ofertă”, spre `/contact/` | — |
| `ContactForm` | formular HTML simplu, cu POST către `/api/contact` și atribute generate din `form-rules.ts` | form-rules, site.config |
| `Placeholder` | afișează un marcaj doar în previzualizarea `DRAFT=1`. În build-ul de producție nu afișează nimic, iar componenta-părinte își ascunde secțiunea dacă rămâne goală. Fiecare marcaj se înregistrează pentru raport (vezi „Formatul marcajelor” în 3.4). | variabila de build `DRAFT`, `src/placeholders.ts` |

### 3.4 Colecțiile de conținut (câmpuri validate cu zod)

**servicii:**
- `slug`, `titlu` (title tag), `h1`, `descriere` (140–160 de caractere);
- `cuvantCheie`, `secundare[]`, `grup` (vizibilitate | diagnostic | construcție | reparație);
- `raspunsDirect` (2–3 fraze), `pentruCine[]`, `semne[]`, `livrabile[]`, `pasi[]`;
- `faq[]`, exact 4 perechi întrebare-răspuns;
- `inrudite[]`, `proiect?`;
- `problema` (rândul din „De unde pornești?”);
- `ordine` (număr): ordinea fixă din „De unde pornești?”, `/servicii/`, subsol, llms.txt și lista din formular;
- `notaGarantii` (true pe SEO și pe AEO/GEO);
- `aprobat` (boolean).

Schema colecției verifică că fiecare `slug` de serviciu există și în lista de servicii din `form-rules.ts` (3.5), ca formularul și Worker-ul să accepte exact aceleași valori.

**proiecte:**
- `slug`, `titlu`, `descriere` (140–160 de caractere, §4.2), `client` (nume sau „anonim”), `acord` (boolean), `aprobat` (boolean);
- `context`, `problema`, `ceAmFacut[]`;
- `rezultate[]`, fiecare cu `text`, `sursa`, `data`;
- `servicii[]`, `serviciiDeConfirmat?` (marcajul `[DE COMPLETAT:#n]` cât timp serviciile sunt provizorii), `capturi[]` (cu text alternativ);
- `scoruri[]`, doar pentru `acest-site`: valoare, dată, versiune Lighthouse, sursă.

**Când e publicabil un proiect:**
- (`acord: true` sau `client: "anonim"`) și `aprobat: true`;
- pentru `acest-site`, în plus, `scoruri[]` nu e gol.

Doar proiectele publicabile se construiesc și apar în sitemap, în llms.txt, pe `/proiecte/`, pe Acasă și în câmpul `proiect` al paginilor de servicii. Altfel nu există nicăieri, ca niciun link să nu ducă spre o pagină inexistentă.

Dacă nu există niciun proiect publicabil, nici `/proiecte/` nu se construiește. „Proiecte” lipsește atunci din meniu, de pe Acasă, din subsol, din sitemap și din llms.txt, după aceeași regulă ca la ghiduri.

**ghiduri:**
- `slug`, `titlu` (sub formă de întrebare), `descriere` (140–160 de caractere, §4.2), `raspuns` (primul paragraf);
- `publicat`, `actualizat`, `aprobat` (boolean), `serviciuLegat`.

Ghidurile se construiesc doar când există cel puțin 2 cu `aprobat: true`. Până atunci nu se construiește niciunul, iar secțiunea lipsește din meniu, din sitemap, din llms.txt și din linkurile paginilor de servicii.

**Aprobarea se face pagină cu pagină:**
- Un singur `aprobat` pe fiecare pagină de serviciu, proiect sau ghid.
- Paginile `.astro` au aprobarea în `src/approvals.ts`, câte o intrare pe rută: Acasă, `/servicii/`, Cum lucrez, `/proiecte/`, `/ghiduri/`, Despre, Contact, paginile legale, 404, `/contact/multumim/`, `/contact/eroare/` și `/contact/prea-multe-linkuri/`. O rută construită fără intrare în `approvals.ts` e tratată ca neaprobată.
- În build-ul de producție, serviciile și paginile `.astro` se construiesc și neaprobate, dar `check:launch` refuză lansarea dacă vreo pagină construită nu e aprobată.
- În previzualizarea `DRAFT=1` se construiesc toate paginile, inclusiv proiectele și ghidurile neaprobate sau fără acord, ca Alex să le poată citi înainte să le aprobe. Regulile de publicare de mai sus se aplică doar build-ului de producție.

**Formatul marcajelor:**
- Un marcaj e valoarea `[DE COMPLETAT:#<nr>]`, unde `<nr>` e rândul din registrul de la capitolul 12. Poate sta în Markdown, în frontmatter (de exemplu ca răspuns la o întrebare frecventă) sau în `site.config.ts`.
- Componentele trec orice astfel de valoare prin `Placeholder`. Nicio valoare cu marcaj nu se afișează ca text brut.
- Build-ul scrie marcajele rămase în `reports/placeholders.json`, cu pagina și rândul din registru.
- `src/placeholders.ts` păstrează registrul, cu `blocheaza: true` sau `false` pe fiecare rând.
- `check:launch` cade dacă rămâne vreun marcaj al unui rând cu `blocheaza: true`.

### 3.5 Formularul și Worker-ul

**Regulile, într-un singur loc.** `src/form-rules.ts` le definește o singură dată, împreună cu lista serviciilor permise (slug și nume). Componenta `ContactForm` generează din ele atributele HTML (`required`, `type`, `maxlength`), iar Worker-ul validează cu aceleași reguli.

**Ca serverul să judece exact ca browserul:**
- Înainte să numere caracterele, Worker-ul transformă `\r\n` în `\n`. Browserul numără un rând nou ca un singur caracter pentru `maxlength`, dar îl trimite ca CRLF.
- Worker-ul nu taie spațiile (trim) înainte de verificarea `required`. Browserul acceptă și un câmp care conține doar spații.
- Singura regulă pe care browserul n-o poate verifica e limita de linkuri. Pentru ea există nota de sub câmp și pagina `/contact/prea-multe-linkuri/`.

Așa o persoană reală nu primește pe server altă eroare decât cea anunțată dinainte.

| Câmp | Regula | Atribute HTML |
|---|---|---|
| Nume | obligatoriu, maximum 100 de caractere | `required maxlength=100 autocomplete=name` |
| E-mail | obligatoriu, maximum 254, format valid după algoritmul WHATWG (același pe care îl folosește browserul pentru `type=email`) | `type=email required maxlength=254 autocomplete=email` |
| Telefon | opțional, maximum 30 | `type=tel maxlength=30 autocomplete=tel` |
| Firmă | opțional, maximum 120 | `maxlength=120 autocomplete=organization` |
| Adresa site-ului | opțional, maximum 200. Text liber, ca să meargă și „exemplu.ro” fără `https://` | `inputmode=url maxlength=200` |
| Serviciu | opțional: cele 6 servicii din `form-rules.ts`, în ordinea `ordine`, plus „Nu știu încă”. O valoare necunoscută e respinsă. | `<select>` |
| Mesaj | obligatoriu, maximum 3000 de caractere, cel mult 3 linkuri | `required maxlength=3000` |
| Capcană | ascuns; dacă e completat, mesajul e de la un robot | `tabindex=-1 autocomplete=off`, ascuns din CSS și de cititoarele de ecran |

**Textele formularului** (ciorne, le aprobă Alex):
- sub câmpul Mesaj: „Cel mult 3000 de caractere și cel mult 3 linkuri.”;
- sub buton: „Folosesc datele trimise ca să-ți răspund la cerere și pentru discuțiile care urmează. Detalii în Politica de confidențialitate.”;
- butonul: „Trimite cererea”.

Fără CNP și fără bifă de acord. Pagina de contact nu are niciun JavaScript.

**Ce face Worker-ul:**
1. Primește `POST /api/contact`. Orice altă metodă primește 405, iar orice altă cale de sub `/api/` primește 404.
2. **Capcana completată:** `303` spre `/contact/multumim/`, fără niciun e-mail.
3. **Limita de trimiteri depășită** (3 cereri la 60 de secunde pe IP): `303` spre `/contact/eroare/`. E doar o protecție la rafale. Legătura de rate limit de la Cloudflare numără doar pe ferestre de 10 sau 60 de secunde, iar o limită pe oră ar cere stocarea IP-urilor.
4. **Mesajul are peste 3 linkuri:** `303` spre `/contact/prea-multe-linkuri/`. În câmpul Mesaj se numără linkurile, nu prefixele, fără să conteze literele mari sau mici:
   - fiecare `http://` sau `https://`;
   - fiecare `www.` care nu vine imediat după `//`.

   Astfel, `https://www.exemplu.ro` e un singur link.
5. **Orice altă regulă încălcată** (posibilă doar dacă cineva ocolește browserul): `303` spre `/contact/eroare/`. Intră aici și `\r` sau `\n` în Nume, Firmă, Telefon ori Adresa site-ului, care ar permite injectarea de antete în e-mail.
6. **Trimiterea e-mailului:** un singur mesaj prin `send_email`, de la `formular@<domeniu>` către `idealserv51@gmail.com`, cu Reply-To pe adresa vizitatorului.
   - **Subiectul:** „Cerere de ofertă: <serviciu> – <nume/firmă>”. Fără serviciu ales, devine „Cerere de ofertă – <nume/firmă>”.
   - **Codificarea:** subiectul se codifică după RFC 2047, ca să treacă diacriticele.
   - **Corpul:** text simplu, UTF-8, cu toate câmpurile.
7. **Dacă trimiterea reușește:** `303` spre `/contact/multumim/`. Dacă eșuează: `303` spre `/contact/eroare/`.

**Paginile de răspuns** sunt statice, noindex și lipsesc din sitemap:
- `/contact/multumim/`: „Am primit cererea ta.” și ce urmează.
- `/contact/prea-multe-linkuri/`: „Mesajul are mai mult de 3 linkuri. Apasă Înapoi în browser ca să-l recuperezi și scoate câteva linkuri, sau scrie-mi direct la…”, cu e-mailul, telefonul și WhatsApp.
- `/contact/eroare/`: „Mesajul n-a plecat. Apasă Înapoi ca să-l recuperezi și încearcă din nou peste un minut, sau scrie-mi direct la…”, cu aceleași contacte.

**Antetele.** Worker-ul răspunde doar cu redirecționări 303 și cu 405. Pe ele pune singur HSTS, `nosniff` și `X-Robots-Tag: noindex`, pentru că `_headers` nu se aplică răspunsurilor generate de Worker.

**Ce nu face Worker-ul:**
- Nu stochează nimic: fără KV, fără D1.
- Nu păstrează jurnale: în `wrangler.jsonc` are `"observability": { "enabled": false }`, iar codul nu face `console.log` cu câmpurile formularului, nici în ramura de eroare. Dacă Alex vrea totuși jurnalele Cloudflare (3 zile pe planul gratuit), ele intră în Politica de confidențialitate, la jurnalele tehnice.
- Nu trimite confirmare vizitatorului (limitare acceptată).

**Notă:** Email Routing preia înregistrările MX ale domeniului. Dacă Alex își face mai târziu o căsuță reală pe domeniu (Google Workspace, Zoho), trimiterea formularului trece pe Resend. Pașii sunt în README.

### 3.6 Configurarea Cloudflare

**`wrangler.jsonc`:**
- `not_found_handling: "404-page"`;
- `html_handling: "auto-trailing-slash"`;
- `run_worker_first: ["/api/*"]`;
- `"observability": { "enabled": false }`;
- legăturile `send_email` (cu `allowed_destination_addresses`) și rate limit.

**`_headers`:**
- pe `/_astro/*`: `Cache-Control: public, max-age=31536000, immutable`;
- pe `/*`:
  - HSTS;
  - `X-Content-Type-Options: nosniff`;
  - `Referrer-Policy: strict-origin-when-cross-origin`;
  - `Permissions-Policy` minimal;
  - `X-Frame-Options: DENY`;
  - `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`;
- `X-Robots-Tag: noindex` pe `*.workers.dev`.

**CSP-ul e împărțit în două:**
- **În `<meta>`, generat de Astro (`security.csp`):** `default-src 'self'`, `script-src` și `style-src` cu hash-uri, `base-uri 'self'`, `form-action 'self'`. Fără niciun alt domeniu.
- **În antetul HTTP din `_headers`:** doar directivele de mai sus. Browserul ignoră `frame-ancestors` dacă e pus în `<meta>`. Antetul nu conține `default-src`, `script-src` sau `style-src`: politicile se cumulează, iar un antet cu ele ar bloca scripturile inline care au hash.

**Reguli pentru scripturi și stiluri, ca să funcționeze CSP-ul:**
- Există doar două scripturi: `trains` (Acasă) și `page-facts` (`acest-site`). Se includ doar ca `<script>` procesate de Astro, fără importuri comune, ca să fie puse inline (sub `build.assetsInlineLimit`) și să primească automat hash.
- **Interzise:**
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
- Fără Turnstile: încarcă un script de pe `challenges.cloudflare.com`, deci ar încălca regula „zero scripturi terțe” și CSP-ul.
- Email Address Obfuscation oprit. Altfel Cloudflare ar înlocui e-mailul din pagină cu un script injectat.
- Rocket Loader oprit.
- Blocarea crawlerelor AI și „Managed robots.txt” oprite.
- Crawler Hints (IndexNow) pornit.

**Verificarea în producție**, înainte de lansare și după orice schimbare de setări:
- HTML-ul servit nu conține `/cdn-cgi/` sau `data-cfemail`;
- numărul de `<script>` de pe fiecare pagină e identic cu cel din `dist/`.

### 3.7 Generat la build

- **`sitemap.xml`** (`@astrojs/sitemap`): exclude `/contact/multumim/`, `/contact/eroare/`, `/contact/prea-multe-linkuri/` și 404. Ghidurile și proiectele nepublicabile nu se construiesc deloc (3.4), deci n-au cum să apară.
- **`robots.txt`:** permite tot, cu linia `Sitemap:`.
- **`llms.txt`:** generat din colecții (vezi 6.5).
- **Pagina de test pentru diacritice** (5.3) se construiește doar cu `DRAFT=1`, deci nu ajunge în `dist/` și nici în sitemap.
- **Imaginea OG** de 1200×630 pentru fiecare pagină, generată la build cu un fișier static Atkinson Hyperlegible Next 800 (latin + latin-ext), inclusiv pentru ș și ț. Fișierul variabil nu merge, pentru că generatoarele îl desenează la greutatea implicită. Generatorul se alege la implementare și trebuie să meargă pe Windows și pe Linux.
- **Raportul marcajelor** (`reports/placeholders.json`): toate marcajele rămase în conținut și în config, cu pagina și rândul din registru (format în 3.4). Raportul nu se publică.

---

## 4. Harta site-ului, cuvinte-cheie și structura paginilor

### 4.1 Harta și cuvintele-cheie

Volumele nu sunt verificate. Alex le confirmă în Keyword Planner înainte de lansare.

| Pagina | Cuvânt principal | Secundare | Harta (vezi 5.6) |
|---|---|---|---|
| `/` | consultant SEO din București | specialist SEO | animată |
| `/servicii/` | (pagină de trecere) | — | toate liniile, estompate |
| `/servicii/seo/` | servicii SEO | optimizare SEO site, abonament SEO | albastru (vizibilitate) |
| `/servicii/optimizare-aeo-geo/` | optimizare pentru ChatGPT | AEO, GEO, vizibilitate în căutarea AI | albastru (vizibilitate) |
| `/servicii/audit-seo/` | audit SEO | audit site | verde (diagnostic) |
| `/servicii/creare-site/` | creare site de prezentare | realizare site, web design, site pentru firmă | galben (construcție) |
| `/servicii/redesign-site/` | redesign site | refacere site, modernizare site | roșu (reparație) |
| `/servicii/mentenanta-site/` | mentenanță site | actualizare site, întreținere site WordPress, abonament mentenanță site | roșu (reparație) |
| `/cum-lucrez/` | (fără cuvânt propriu) | — | toate, estompate |
| `/proiecte/` | (fără cuvânt propriu) | — | toate, estompate |
| `/proiecte/<slug>/` | (fără cuvânt propriu) | — | linia primului serviciu din `servicii[]` |
| `/ghiduri/` | (fără cuvânt propriu) | — | toate, estompate |
| `/ghiduri/<slug>/` | întrebarea din titlu | — | linia din `serviciuLegat` |
| `/despre/` | Alex Ionescu | — | toate, estompate |
| `/contact/` | (fără cuvânt propriu) | — | toate, estompate |
| Paginile legale, `/404`, `/contact/multumim/`, `/contact/eroare/`, `/contact/prea-multe-linkuri/` | — | — | fără hartă |

**Proiecte:**
- `/proiecte/szitrans/`: doar cu acordul scris;
- `/proiecte/magazin-online/`: anonim, fără nume, cu detalii care nu identifică clientul;
- `/proiecte/acest-site/`: se construiește după prima măsurare în producție, într-o actualizare de după lansare;
- `/proiecte/mayalashes/`: doar după acord.

### 4.2 Reguli pentru meta

- **Title:** „<Titlu> – Alex Ionescu”, cu cel mult 60 de caractere în total. Dacă nu încape, sufixul dispare.
  - Acasă: „Consultant SEO din București – Alex Ionescu”.
  - Pagina AEO/GEO: „Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)”.
- **Description:** 140–160 de caractere, unică pe fiecare pagină, cu diacritice corecte.
- **Descrierea fixă**, folosită identic peste tot: „Alex Ionescu – consultant SEO și web design, București”.
  - Apare în `WebSite.alternateName`, în `Person.description` și pe prima linie din llms.txt.
  - Trebuie să fie identică pe LinkedIn, dacă există, și în Google Business Profile.
  - Logo-ul, „Alex Ionescu, consultant SEO”, e forma ei scurtă.
- **Un singur H1** pe pagină.
- **Canonical** absolut, din `site.config`.
- **Adrese** scurte, fără diacritice, cu cratimă și cu slash la final.

### 4.3 Acasă

Zona de sus are un singur rol: să spună în 3 secunde ce face Alex și unde se cere o ofertă. Tot restul paginii e liniștit.

1. **Antetul:** logo-ul și meniul (Servicii, Cum lucrez, Proiecte, Ghiduri — doar după aprobare —, Despre, Contact). Pe Acasă, antetul nu are butonul „Cere o ofertă”.
2. **Zona de sus**, peste harta de metrou animată:
   - H1-ul, „Consultant SEO din București”, pe un fundal alb, ca un indicator de stație;
   - subtitlul, de o frază (ciornă): „SEO, site-uri și audituri pentru firme care vor să fie găsite în Google și în căutarea AI.”;
   - butonul plin „Cere o ofertă”, imediat sub subtitlu;
   - butonul mic „Oprește trenurile”, într-un colț al hărții (vezi 5.6).
3. **„De unde pornești?”**, pe fundal alb. Componenta `LineDiagram` e desenată ca schema de linie din vagonul de metrou. Fiecare rând e un tronson scurt:
   - stația, cu problema;
   - segmentul, în culoarea grupului;
   - capătul de linie, cu serviciul, ca link.

   Semantic e o listă `<ul>` de linkuri, în ordinea câmpului `ordine` (nu e o secvență, deci nu are numere). Desenul e doar forma ei. Ciornele rândurilor:
   - SEO (albastru): „Clienții nu te găsesc în Google când caută ce vinzi.”
   - AEO/GEO (albastru): „Firma ta nu apare când cineva întreabă ChatGPT despre domeniul tău.”
   - Audit (verde): „Vizitele din Google au scăzut și nu știi de ce.”
   - Creare site (galben, desenat în #8A5A00): „Nu ai încă un site sau ai doar o pagină de Facebook.”
   - Redesign (roșu): „Site-ul arată învechit și nu mai seamănă cu firma de acum.”
   - Mentenanță (roșu): „Site-ul n-a mai fost actualizat de mult și se încarcă greu pe telefon.”
4. **„Cum lucrăm: două trasee”.** Componenta `RouteMap`, pe `--tint-blue`, desenată complet de la început:
   - **Linia remedierii unice:** Evaluare → Ofertă → Lucru → Raport. Se desenează în #8A5A00 (5,18:1 pe #EAF0FB), nu în galbenul tare, care pe fundalul albastru deschis are doar 1,63:1.
   - **Linia abonamentului**, albastră: aceleași stații, plus o buclă lunară.
   - **Etichete text vizibile** pe fiecare traseu, „Remediere unică” și „Remediere + abonament lunar”, ca diferența să nu stea doar în culoare.
   - **Stațiile din buclă** le confirmă Alex. Până atunci sunt un marcaj blocant (registrul, #15). Fără prețuri.
5. **„Proiecte”**, cu 1–3 intrări: context, ce am făcut, rezultatul (doar dacă e verificabil; altfel rândul lipsește) și link. Dacă nu există niciun proiect publicabil, secțiunea lipsește (3.4).
6. **Întrebări frecvente generale**, 4–5, vizibile, fără acordeon. Nu repetă întrebările de pe paginile de servicii. Exemple: „Afișezi prețuri?”, „Ce se întâmplă după ce trimit cererea?”, „Lucrezi și cu firme din afara Bucureștiului?”, „Pot cere doar o remediere, fără abonament?”.
7. **Banda albastră** cu îndemnul final (ciornă: „Spune-mi ce site ai și ce te încurcă.”) și butonul „Cere o ofertă”.
8. **Subsolul negru.** După ce `/proiecte/acest-site/` există, conține și fraza „Fără cookie-uri de urmărire și fără scripturi terțe. Vezi cum e făcut site-ul.”, cu link spre pagină. Formularea nu e absolută, pentru că Cloudflare poate pune în anumite situații un cookie strict necesar (7.3).

### 4.4 Pagina de serviciu (un singur șablon pentru toate 6)

1. **Banda de sus:** harta statică, cu linia grupului în față și marcajul „Ești aici” pe ea. Sub bandă, firimiturile.
2. **H1-ul** cu cuvântul-cheie, apoi `raspunsDirect`: 2–3 fraze despre ce e serviciul și cui îi folosește.
3. **„Pentru cine e”** și **„Semne că ai nevoie”**.
4. **„Ce primești”:** lista de livrabile.
5. **„Cum se desfășoară”:** pașii, numerotați pentru că sunt o secvență. Duratele apar doar dacă le confirmă Alex.
6. **Un proiect relevant**, dacă există unul publicabil.
7. **4 întrebări frecvente**, vizibile. Fiecare răspuns începe cu răspunsul direct.
8. **Doar pe SEO și AEO/GEO:** un rând care spune că nu garantez poziții în Google sau apariții în răspunsurile motoarelor AI.
9. **Serviciile înrudite** (legături interne) și ghidul legat, dacă există și e aprobat.
10. **Un singur îndemn:** „Cere o ofertă”.

### 4.5 Celelalte pagini

- **`/servicii/`:** serviciile grupate pe cele 4 linii, fiecare cu `raspunsDirect` și „Ce primești” pe scurt. Nu repetă „De unde pornești?” de pe Acasă.
- **`/cum-lucrez/`:**
  - `RouteMap` mare, cu cei patru pași explicați;
  - cele două formate, fără cifre: „Prețul, reducerea și ce include abonamentul le stabilim după ce mă uit la site-ul tău.”;
  - pagina spune clar că lucrez doar cu firme, PFA-uri și alte entități profesionale.
- **Studiul de caz:** context → problema → ce am făcut → rezultat → serviciile folosite. La rezultat intră doar ce se poate dovedi, scris ca text, cu sursa și data, plus capturi cu text alternativ.
- **`/proiecte/acest-site/`:**
  - cum e construit site-ul;
  - fișa paginii (`PageFacts`, vezi 5.5), cu o explicație pe înțeles pentru fiecare rând;
  - niciun cookie setat de site și zero scripturi terțe, cu excepția explicată în 7.3;
  - scorurile Lighthouse și PageSpeed măsurate în producție, cu data și versiunea;
  - nicio pretenție că schema FAQPage aduce fragmente îmbogățite în Google.

  Pagina se construiește doar când există scoruri reale (3.4).
- **Ghidul:** titlul-întrebare, răspunsul în primul paragraf, detaliile, data publicării și a actualizării, autorul (cu link spre Despre) și serviciul legat.
- **`/despre/`:** biografia reală, studiile, experiența, instrumentele, linkurile de profil (opționale) și o fotografie reală, când există. Până atunci, doar text, fără un cadru gol. E condiție de lansare.
- **`/contact/`:**
  - formularul;
  - telefonul (`tel:`);
  - WhatsApp, ca link simplu `https://wa.me/40724230051`, fără widget;
  - `contact@<domeniu>`;
  - „Din București, lucrez cu firme din toată țara”;
  - secțiunea `#date-firma`, cu `LegalId` complet.
- **Paginile de răspuns ale formularului:** vezi 3.5.
- **Paginile legale:** vezi capitolul 7.
- **404:** un mesaj care spune ce s-a întâmplat și linkuri spre Acasă, Servicii și Contact. Fără hartă.

---

## 5. Design

### 5.1 Principii

- **O singură metaforă, metroul.** Site-ul se prezintă ca o hartă de metrou a serviciilor. Cele patru culori sunt cele ale liniilor M1–M4 din București (M1 galben, M2 albastru, M3 roșu, M4 verde), nu ale Google. Vocabularul vizual și de text rămâne în aceeași lume: linii, stații, trasee, capăt de linie, „Ești aici”. Fără imagini de cabinet medical, laborator sau dosar.
- **Îndrăzneala stă într-un singur loc:** harta din zona de sus a paginii Acasă. Tot restul rămâne liniștit și disciplinat.
- **Interzise:** carduri colorate egale, umbre, gradiente decorative, imagini stoc, carusele și etichete cu majuscule deasupra titlurilor.
- Numerotare doar unde conținutul chiar e o secvență (pașii).
- Totul e aliniat la stânga.
- Doar temă luminoasă, pentru că paleta e construită pe alb.

### 5.2 Culori (tokenuri)

| Token | Valoare | Folosire |
|---|---|---|
| `--ink` | #14161A | text principal, subsol |
| `--ink-2` | #3F4650 | text secundar, „consultant SEO” din logo |
| `--paper` | #FFFFFF | fundal (~60%) |
| `--blue` | #2D6CDF | culoarea principală: virgula din logo, butoane, benzi, linia M2, „Ești aici” |
| `--blue-dark` | #1A4FB8 | linkuri, butoane la hover (cu text alb: 7,36:1) |
| `--green` / `--green-dark` | #1F9D61 / #157347 | grupul diagnostic, linia M4 / text pe alb |
| `--yellow` / `--yellow-dark` | #F5B21B / #8A5A00 | grupul construcție, linia M1 / text și grafică cu sens pe alb |
| `--red` / `--red-dark` | #E0533D / #B8382A | grupul reparație, linia M3 / text pe alb, erori |
| `--tint-blue` | #EAF0FB | traseul „Cum lucrăm”, fișa de pe `acest-site` |
| `--tint-yellow` | #FEF3D7 | blocuri din grupul construcție |
| `--tint-green` | #E8F5EE | blocuri din grupul diagnostic |
| `--tint-red` | #FCEDEA | blocuri din grupul reparație |
| `--rule` | #E6E8EC | linii despărțitoare |
| `--field-border` | #8A8F98 | contururile câmpurilor (3,25:1) |

**Reguli de contrast** (calculate după WCAG 2.1):
- Pe albastru apare doar text alb (4,86:1). Textul negru pe albastru are 3,73:1 și e interzis.
- Negru pe verde: 5,22:1; pe galben: 9,72:1; pe roșu: 4,72:1. Textul alb pe verde, galben sau roșu e interzis.
- Variantele închise pe alb: între 5,77:1 și 7,36:1.
- Pe tinturi (8–12%), textul închis trece de 4,96:1.
- Galbenul tare pe alb are 1,86:1, așa că nu se folosește pentru contururi, iconițe sau focus. Grafica galbenă cu sens (segmentul galben din „De unde pornești?”, traseul remedierii unice) folosește #8A5A00. Verdele (3,47:1) și roșul (3,84:1) trec pragul de 3:1 pentru grafică.
- **Hover:** butonul nu se închide la culoare cu text negru pe el. Fie trece pe varianta închisă, cu text alb, fie primește doar subliniere sau contur.
- **Linkurile din text** sunt mereu subliniate.
- **Focus:** `outline: 2px solid #14161A; outline-offset: 0;` plus `box-shadow: 0 0 0 4px #FFFFFF`, ca haloul alb să se vadă 2px în afara conturului (tehnica WCAG C40). Pe orice fundal, unul dintre cele două tonuri trece de 3:1. Focusul se verifică în subsol (#14161A), pe banda albastră și pe butonul în starea hover (#1A4FB8).
- **Erorile:** text #B8382A, mereu cu iconiță și cu text, niciodată doar prin culoare.
- **Subsolul:**
  - textul e alb, la 92% opacitate;
  - linkurile spre servicii au culoarea grupului: galben, verde, roșu, iar albastrul e #6B9BF0 (6,53:1 pe #14161A);
  - celelalte linkuri sunt albe și subliniate.

**Proporții:** ~60% alb, ~30% culoare (benzi albastre pline cu text alb, plus tinturi deschise), ~10% negru. Culorile tari de verde, galben și roșu apar doar pe elemente mici: linii, stații, segmente, etichete. Cele patru culori nu stau niciodată în ordine, ca patru blocuri egale.

### 5.3 Tipografie

- **O singură familie: Atkinson Hyperlegible Next**, variabilă doar pe axa de greutate, cu subseturile latin și latin-ext (~53–60 KB în total):
  - **800** pentru titluri, cu `letter-spacing` între −0,01em și −0,02em la mărimile mari și înălțimea rândului 1,1–1,2;
  - **700** pentru subtitluri, etichete și `strong`;
  - **400** pentru text: 18px, înălțimea rândului 1,6, cel mult ~70 de caractere pe rând.
- **Fără italic:** `styles: ["normal"]`. `em` se marchează prin greutate.
- **Scara** (raport ~1,25): 14,4 / 18 / 22,5 / 28 / 35 / H1 `clamp(2.25rem, 5vw, 3.5rem)`.
- **Etichetele** sunt în sentence case, fără majuscule.
- **Încărcarea fontului:**
  - găzduit pe site, prin Astro Fonts API (furnizor Fontsource);
  - subseturile `latin` și `latin-ext`, ambele obligatorii pentru ă, ș și ț, și ambele preîncărcate;
  - fonturi de rezervă cu metrici potrivite, ca textul să nu sară la încărcare (CLS).
- **Verificări:**
  - build-ul cade dacă găsește ş, ţ, Ş sau Ţ (U+015E/015F/0162/0163);
  - un script confirmă că fișierele woff2 livrate conțin U+0218–U+021B;
  - o pagină de test internă, nepublicată, arată „ȘȚĂÂÎ șțăâî „citat”” la 400, 700 și 800.

### 5.4 Logo și iconițe

- **Logo:** „Alex Ionescu, consultant SEO”, ca text, fără imagine:
  - „Alex Ionescu” în 800, `--ink`;
  - virgula intenționată, în `--blue`;
  - „consultant SEO” în 400, `--ink-2`.

  Sub 380px, „consultant SEO” trece pe rândul următor.
- **„Ești aici”:** o stație plină albastră, cu inel alb, pusă pe linia grupului în harta statică.
- **Favicon:** aceeași stație plină albastră.
- **Iconițe:** puține, SVG inline, doar unde au sens: eroare, telefon, WhatsApp, e-mail.

### 5.5 Fișa paginii (doar pe `/proiecte/acest-site/`)

O listă `<dl>` pe `--tint-blue`. Fiecare rând are o explicație pe înțeles, pentru că un proprietar de firmă nu știe ce înseamnă „greutate” sau „JSON-LD”.

| Rând | Ce arată | Explicația de sub rând (ciornă) |
|---|---|---|
| Greutate | totalul `transferSize` din Navigation și Resource Timing. O resursă se socotește din cache dacă `transferSize === 0` sau `transferSize < encodedBodySize` (revalidare). Dacă măcar una e din cache, apare mențiunea „parțial din cache”. | „Cât a descărcat telefonul tău ca să-ți arate pagina asta. Mai puțin înseamnă mai rapid.” |
| Cereri | numărul de cereri | „De câte ori a cerut browserul ceva de la server.” |
| Cookie-uri setate de site | „0”, adică niciun cookie vizibil pentru scripturi (`document.cookie`). Lipsa antetelor `Set-Cookie` se verifică separat, în producție (7.3), pentru că `document.cookie` nu vede cookie-urile HttpOnly. | „Site-ul nu te urmărește.” |
| Scripturi terțe | numărul de `<script src>` de pe alt domeniu, adică 0 | „Niciun cod de la alte firme nu rulează aici.” |
| Date structurate | tipurile citite din JSON-LD-ul paginii | „Eticheta pe care o citesc Google și motoarele AI ca să înțeleagă pagina.” |

**Fără JavaScript:** rândurile care se măsoară în browser afișează „se măsoară în browserul tău, dacă JavaScript e pornit”. Celelalte arată valori adevărate prin construcție, calculate la build.

**Cum rulează:**
- Scriptul inline are sub 1 KB și pornește după `load`, cu `(window.requestIdleCallback || (cb => setTimeout(cb, 200)))`, pentru că Safari nu are `requestIdleCallback`.
- Fișa nu are animații.
- Înălțimea blocului e rezervată (cifre `tabular-nums`, lățime minimă).
- Nicio cifră nu e scrisă de mână.

### 5.6 Harta de metrou

**Construcție:**
- SVG inline, decorativ (`aria-hidden="true"`);
- patru linii, M1–M4, în culorile grupurilor, la opacitate redusă, cu unghiuri de 45° ca pe hărțile de metrou;
- stații albe, cu contur;
- fără etichete de stații și fără logo Metrorex.

**Pe Acasă: liniile se desenează, apoi circulă trenurile.**
- **Liniile** se desenează o singură dată la încărcare (M1 în 5.7). E doar CSS.
- **Trenurile circulă continuu.** Pe fiecare linie merge câte un „tren”: un punct cu miez alb și halou în culoarea liniei. Viteza e constantă, cu 7–11 secunde pe parcurs, iar trenurile pornesc decalat.
- **Pe mobil:** sub 640px rămân 2 linii, M2 (albastru) și M3 (roșu), cu 2 trenuri.
- **Lizibilitatea:** titlul stă pe o plăcuță albă și opacă, peste marginea de jos a hărții; liniile și trenurile trec pe sub ea, ca într-o stație, deci textul rămâne lizibil când trece un tren (decizia lui Alex din 2026-10-22, ruling R17).

**Pornirea depinde de script:**
- Trenurile stau într-un `<g class="trenuri">` din SVG, ascuns din CSS (`display: none`) până când scriptul pune clasa de pornire. Atributul `hidden` nu ajunge aici, pentru că regula implicită a browserului pentru `[hidden]` se aplică doar elementelor HTML, nu celor din SVG.
- Butonul e un element HTML și folosește atributul `hidden`.
- Scriptul de pe Acasă (~1 KB) le afișează și pornește animația doar după ce a legat butonul și doar dacă `prefers-reduced-motion: no-preference`. Cu SMIL, animația are `begin="indefinite"` și o pornește scriptul; cu CSS, o pornește o clasă pusă de script.
- Fără JavaScript sau cu „reduced motion”, harta rămâne statică, fără trenuri și fără buton.

Așa nu există niciodată mișcare fără un buton de oprire care funcționează (WCAG 2.2.2).

**Butonul „Oprește trenurile” / „Pornește trenurile”:**
- e mic și secundar: text de 14,4px, fundal alb, contur de 1px `--ink`, colțuri drepte, într-un colț al hărții, departe de titlu și de butonul principal;
- are totuși zona de atingere de minimum 44×44px și focusul din 5.2;
- eticheta alternează și nu folosește `aria-pressed` (cele două tipare se exclud);
- e cerut de WCAG 2.2.2, pentru că animația durează mai mult de 5 secunde.

**Oprirea automată:**
- trenurile stau când harta iese din ecran (IntersectionObserver);
- alegerea vizitatorului are prioritate: după „Oprește trenurile”, IntersectionObserver nu le mai repornește, doar butonul o face.

**Implementare:** SMIL `animateMotion` sau CSS `offset-path`, alese după testul pe Chrome, Safari și Firefox. Condiții: oprirea să funcționeze și să nu existe nicio bibliotecă.

**Harta pe fiecare tip de pagină** (sursa unică; coloana din 4.1 trebuie să corespundă):

| Pagina | Harta |
|---|---|
| Acasă | animată: liniile se desenează, apoi circulă trenurile. Are butonul de oprire. |
| Paginile de serviciu | statică: linia grupului plină, cu „Ești aici”, celelalte estompate. Toate patru și pe mobil. |
| Studiu de caz | statică: linia primului serviciu din `servicii[]` plină, cu „Ești aici” |
| Ghid | statică: linia din `serviciuLegat` plină, cu „Ești aici” |
| `/servicii/`, `/cum-lucrez/`, `/proiecte/`, `/ghiduri/`, `/despre/`, `/contact/` | statică, toate liniile la fel de estompate, fără „Ești aici” |
| Paginile legale, 404, paginile de răspuns ale formularului | fără hartă |

### 5.7 Mișcare

Pe tot site-ul sunt două mișcări automate, ambele pe Acasă: desenarea liniilor (o dată) și trenurile (continuu, cu oprire). La ele se adaugă o tranziție care răspunde unui clic.

| # | Ce | Declanșare | Detalii | Cu „reduced motion” / fără suport |
|---|---|---|---|---|
| M1 | Liniile hărții se desenează | o dată, la încărcarea paginii Acasă | `stroke-dashoffset`, ~600ms, `ease-out`, doar CSS. H1-ul, subtitlul și butonul nu se animă niciodată. | liniile apar desenate, instant |
| M2 | Trenurile pe hartă | continuu, doar pe Acasă, după M1 | vezi 5.6 | trenurile și butonul ascunse |
| M3 | Segmentul din „De unde pornești?” devine banda paginii de serviciu | la clic, la navigare | CSS nativ: `@view-transition { navigation: auto; }` declarat doar în `@media (prefers-reduced-motion: no-preference)`, cu `view-transition-name` unic pe fiecare serviciu, dat prin clasă. Durata 300ms, `ease-in-out`. Pe celelalte navigări, cross-fade-ul implicit e oprit (`animation: none` pe `::view-transition-old(root)` și `::view-transition-new(root)`), ca singura mișcare să fie segmentul. Fără ClientRouter. | navigare normală, fără tranziție (la fel în Firefox și Samsung Internet) |
| M4 | Micro-interacțiuni | hover, focus | subliniere în 150ms | fără tranziții |

**Tăiate față de varianta anterioară:** completarea animată a fișei și traseul desenat la derulare. Traseul explică cele două moduri de lucru, așa că e desenat complet de la început.

**Reguli:**
- Conținutul e vizibil mereu, inclusiv fără JavaScript. Nimic nu ascunde text până rulează un script.
- Nicio animație nu schimbă layoutul. Se animă doar `transform`, `opacity`, poziția pe traseu (`animateMotion` sau `offset-distance`) și `stroke-dashoffset`, care doar repictează. Nimic nu mută conținutul (CLS).

### 5.8 Layout

- **Container** de maximum 72rem. Grilă de 12 coloane pe desktop și o coloană pe mobil.
- **Margini laterale** de 16px pe mobil și 24px pe desktop. Fără derulare pe orizontală.
- **Colțuri cu sens:**
  - drepte (0) pe blocuri, benzi, butoane și câmpuri;
  - rotunjite doar stațiile, capetele desenate ale liniilor (`stroke-linecap: round`) și „Ești aici”, adică doar unde forma face parte din harta de metrou;
  - numele serviciului de la capătul de linie din „De unde pornești?” e un link text, fără chenar rotunjit.
- Contururi de 1px. Fără umbre.
- **Zona de atingere** de minimum 44×44px pentru butoane, câmpuri, linkurile din meniu și din subsol și rândurile din „De unde pornești?”. Linkurile din interiorul textului sunt exceptate. E o țintă proprie: în WCAG 2.1, criteriul 2.5.5 (44px) e de nivel AAA.

---

## 6. SEO tehnic, date structurate și citirea de către AI

### 6.1 Indexare

- Canonical pe fiecare pagină.
- Paginile noindex: `/contact/multumim/`, `/contact/eroare/`, `/contact/prea-multe-linkuri/`, 404 și tot ce se servește de pe `*.workers.dev`.
- Firimituri vizibile pe toate paginile, în afară de Acasă.
- **Legături interne:**
  - serviciu ↔ servicii înrudite;
  - serviciu ↔ ghid legat;
  - serviciu ↔ proiect;
  - Acasă → toate serviciile, prin „De unde pornești?”.

### 6.2 Open Graph

- `og:title`, `og:description`, `og:url`, `og:type`, `og:locale=ro_RO`, `og:site_name=Alex Ionescu`.
- `og:image` de 1200×630 pe fiecare pagină, plus `twitter:card=summary_large_image`.

### 6.3 Datele structurate (un `@graph` pe pagină, cu noduri legate prin `@id`)

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
- address `PostalAddress`, doar cu addressLocality București și addressCountry RO;
- areaServed România, knowsAbout;
- email `contact@<domeniu>`, telefon;
- `taxID`, după ce e cunoscut CUI-ul;
- `sameAs`, doar spre profiluri reale, inclusiv Google Business Profile;
- `image`, doar după ce există o fotografie reală.

**Ce nu se folosește:**
- `ProfessionalService`: e marcat ca învechit în schema.org și cere adresa completă;
- `Review` și `AggregateRating`: recenziile publicate de firma însăși nu sunt eligibile;
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

Fișierul e generat la build și conține:
- un H1 = descrierea fixă;
- un paragraf cu rezumatul;
- secțiuni de linkuri: Servicii (6, fiecare cu o frază), Cum lucrez, Proiecte publicabile, Ghiduri aprobate, Despre, Contact.

Trebuie să treacă auditul llms.txt din Lighthouse 13.3+ (are H1, are linkuri, nu e prea scurt). Nu e prezentat ca factor de poziționare.

### 6.6 După lansare (în responsabilitatea lui Alex, cu pașii din README)

- Search Console: verificarea și trimiterea sitemap-ului.
- Bing Webmaster Tools.
- IndexNow, prin Crawler Hints.
- Google Business Profile, cu același nume, telefon, site și aceeași descriere.
- Prima măsurare Lighthouse și PageSpeed în producție, apoi publicarea `/proiecte/acest-site/` și a frazei din subsol.

---

## 7. Partea legală

### 7.1 Datele firmei (Legea 365/2002, art. 5)

Componenta `LegalId` are două variante, ambele citite din `site.config.ts`.

| Variantă | Unde | Conține |
|---|---|---|
| `scurt` | subsolul fiecărei pagini | denumirea exactă a PFA, CUI-ul, numărul de la Registrul Comerțului, „București” și linkul „Date de identificare” spre `/contact/#date-firma` |
| `complet` | `/contact/#date-firma`, Termeni, Politica de confidențialitate (la operator) | datele din varianta scurtă, fără linkul „Date de identificare”, plus adresa completă a sediului profesional, telefonul și e-mailul |

- **Numărul de la Registrul Comerțului** se scrie exact ca în certificatul de înregistrare. Poate fi în formatul vechi, F40/…/…, sau în cel nou, de 14 caractere. `check:launch` cere doar ca valoarea să fie completată, fără să impună un format.
- **De ce două variante:** sediul e la domiciliu, iar Alex vrea public doar „București”. Datele complete rămân accesibile permanent, dintr-un singur clic de pe orice pagină, ceea ce satisface cerința de acces permanent din Legea 365. Dacă Alex mută sediul (decizia 15 e încă deschisă), se schimbă doar valoarea din config.
- **În JSON-LD** apare doar orașul.
- **Datele lipsă** sunt marcaje blocante (registrul, #1 și #2): lansarea nu se face fără ele.

### 7.2 Politica de confidențialitate (GDPR art. 13)

1. **Operatorul:** PFA-ul, cu `LegalId` complet. Nu e nevoie de responsabil cu protecția datelor (DPO).
2. **Scopuri și temeiuri:**
   - **Răspunsul la cererea de ofertă:**
     - art. 6(1)(b), când cel care scrie ar fi el însuși parte în contract (PFA, întreprindere individuală sau familială);
     - art. 6(1)(f), când scrie în numele unei persoane juridice (administrator, angajat).
   - **Corespondența ulterioară:** 6(1)(f).
   - **Contractele și facturarea:** 6(1)(b) și 6(1)(c).
   - **Jurnalele tehnice de găzduire și securitate:** 6(1)(f).

   Pentru fiecare temei 6(1)(f), politica numește interesul legitim (art. 13(1)(d)): să răspund cererilor primite de la firme, să păstrez istoricul discuției, să protejez site-ul de abuz.
3. **Destinatari:** Cloudflare (găzduire, CDN, Worker, Email Routing), Google (căsuța Gmail) și contabilul. Meta doar dacă vizitatorul alege WhatsApp.
4. **Transferuri în afara SEE**, descrise separat pentru fiecare destinatar (art. 13(1)(f)):
   - **Cloudflare, Inc. (SUA):** pe baza deciziei de adecvare UE-SUA (Data Privacy Framework, Decizia (UE) 2023/1795) și a clauzelor contractuale standard din acordul de prelucrare Cloudflare.
   - **Gmail:** în SEE îl furnizează Google Ireland Limited. Pentru Gmail nu există un contract de prelucrare separat, iar politica nu afirmă altceva.

   Înainte de lansare și la fiecare actualizare, se verifică certificarea DPF pe dataprivacyframework.gov și se notează data verificării.
5. **Durata de păstrare:** o stabilește Alex. Termenele fiscale le confirmă contabilul (registrul, #17).
6. **Drepturi:** art. 15–22. Dreptul de opoziție (art. 21) apare într-un paragraf separat, vizibil.
7. **Plângere la ANSPDCP:** B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, 010336 București, anspdcp@dataprotection.ro.
8. **Furnizarea datelor** e necesară ca vizitatorul să primească un răspuns.
9. **Decizii automate:** nu există.
10. **Data ultimei actualizări.**

**Ce nu se scrie:** „date stocate doar în UE”, „certificat GDPR” sau orice altă afirmație neverificată.

### 7.3 Politica de cookie-uri

Textul politicii (ciornă, în tonul site-ului):

> Site-ul nu folosește cookie-uri de analiză, de marketing sau de preferințe și nici tehnologii similare (stocare locală, pixeli, amprentare). Singura excepție: dacă protecția Cloudflare îți cere o verificare de securitate (de exemplu în timpul unui atac), Cloudflare poate seta cookie-ul strict necesar `cf_clearance`, fără de care verificarea nu funcționează.

**De ce excepția:** protecția DDoS a Cloudflare e mereu pornită și poate cere astfel de verificări, deci o formulare absolută („niciun cookie”) n-ar fi adevărată. Cookie-ul e strict necesar, așa că nu cere consimțământ și nici banner.

**Când rămâne adevărată afirmația:** doar cu setările din 3.6 (Web Analytics, Bot Fight Mode, Turnstile și Email Address Obfuscation oprite). Înainte de lansare și după orice schimbare de setări, se verifică în producție antetele `Set-Cookie`, stocarea din browser și HTML-ul servit (3.6).

### 7.4 Termenii site-ului

**Conțin:**
- cine e furnizorul (`LegalId` complet);
- colaborez doar cu profesioniști (B2B);
- conținutul site-ului e proprietatea autorului;
- ghidurile sunt informații generale;
- nu garantez poziții în Google și nici apariții în răspunsurile motoarelor AI;
- o cerere de ofertă nu obligă pe nimeni;
- o colaborare începe doar pe bază de ofertă sau contract scris;
- „Site-ul e administrat din România, de un PFA înregistrat în România.”

**Nu conțin clauze comerciale:**
- durata minimă și preavizul;
- ce se întâmplă cu reducerea dacă abonamentul se oprește devreme;
- plățile;
- drepturile asupra livrabilelor;
- accesele;
- limitarea răspunderii;
- legea aplicabilă.

Toate merg într-un contract-tip separat, verificat de un avocat, cu acceptare expresă pentru clauzele din art. 1203 Cod civil. Pentru mentenanța site-urilor cu date personale (de exemplu comenzi WooCommerce), contractul are nevoie și de un acord de prelucrare după art. 28 GDPR. Contractul nu intră în acest proiect.

---

## 8. Reguli de conținut

- **Limba:** română naturală, cu diacritice corecte (ș și ț cu virgulă).
- **Vocea:** persoana I („lucrez”, „mă uit”), cu vizitatorul la „tu” („site-ul tău”, „cere o ofertă”). Fără „dumneavoastră”.
- **Tonul:** lejer și direct, ca o discuție cu un om care se pricepe. Lejer nu înseamnă familiar:
  - fără argou;
  - fără semne de exclamare în serie;
  - fără glume pe paginile legale.
- **Paginile legale** sunt tot la „tu”, dar formulate precis.
- **Nimic inventat:** testimoniale, clienți, cifre, premii, durate sau timp de răspuns.
  - Unde lipsește o dovadă opțională, partea respectivă nu apare deloc în producție.
  - Unde lipsește ceva obligatoriu, lansarea e blocată (capitolele 11 și 12).
- **Marcajul [DE COMPLETAT]** se vede doar în previzualizarea locală (`DRAFT=1`), ca Alex să știe ce mai e de completat.
- **Fără promisiuni de rezultat sau de termen** („prima pagină”, „garantat”, „apari în ChatGPT”). Textele descriu ce face Alex și ce primește clientul.
- **Testimoniale și recenzii:** doar reale, cu acordul scris al clientului, ca text, cu numele clientului și cu link spre Google Business Profile. Fără widget Google și fără schema Review.
- **Aprobare:** eu scriu ciornele (paginile, întrebările frecvente, cele 2 ghiduri), iar Alex le aprobă pagină cu pagină. Un text neaprobat nu ajunge în producție: aprobarea e câmpul `aprobat` din colecții și din `src/approvals.ts` (3.4), verificat de `check:launch`.
- **Același verb pe tot parcursul:**
  - „Cere o ofertă” (îndemnul);
  - „Trimite cererea” (butonul din formular);
  - „Am primit cererea ta” (pagina de mulțumire).

---

## 9. Performanță și accesibilitate

### 9.1 Bugete

- **JavaScript:**
  - ~1 KB pe Acasă (trenurile și butonul);
  - sub 1 KB pe `/proiecte/acest-site/` (fișa);
  - 0 KB pe toate celelalte pagini, inclusiv Contact.
- **CSS:** cel mult 25 KB pe pagină, necomprimat.
- **Fonturi:** o singură familie, Atkinson Hyperlegible Next variabilă, cu latin și latin-ext, ~53–60 KB, ambele subseturi preîncărcate.
- **Greutatea paginii Acasă:** sub 150 KB transferați. Se măsoară în producție, cu Brotli și cache gol (auditul `total-byte-weight` din Lighthouse, rulat pe domeniu). Pe `wrangler dev` nu există compresia Cloudflare, deci măsurătoarea de acolo nu contează.
- **În Lighthouse pe mobil:** LCP sub 2,5 s, CLS sub 0,05, TBT sub 100 ms.
- **Imagini:** AVIF sau WebP prin `astro:assets`, cu `width` și `height` declarate, încărcare leneșă (`loading="lazy"`) sub prima ecranare și text alternativ.

### 9.2 Accesibilitate (WCAG 2.1 AA)

- Un singur H1, cu titlurile în ordine.
- Link de salt la conținut.
- Ordinea focusului e cea logică, iar focusul e vizibil peste tot (5.2).
- **Formularul:**
  - fiecare câmp are o etichetă vizibilă;
  - câmpurile obligatorii sunt marcate în text, nu doar prin culoare;
  - limitele se spun dinainte, în text („Cel mult 3000 de caractere și cel mult 3 linkuri.”), legate de câmp prin `aria-describedby`;
  - erorile de completare le arată browserul, cu mesajele lui native;
  - respingerile de pe server duc la pagini care explică ce s-a întâmplat și ce poți face.
- **Linkurile** au un text care spune unde duc. Rândurile din „De unde pornești?” sunt linkuri reale, într-o listă `<ul>`. Fără carduri complet clicabile care ascund textul.
- **Firimiturile** stau în `nav aria-label="Firimituri"` cu `ol`, iar ultima are `aria-current="page"`.
- **Mișcarea:** vezi 5.6 și 5.7 (butonul de oprire, „reduced motion”).
- **Limba:** `lang="ro"` pe `<html>`.

---

## 10. Testare și verificare

**Pentru fiecare pagină, înainte de următoarea:**
1. `astro check` și build-ul trec.
2. Validarea HTML trece (html-validate).
3. Nu există diacritice cu sedilă.
4. Testele axe trec, prin Playwright și `@axe-core/playwright`. Se verifică în plus:
   - focusul;
   - „reduced motion”: harta statică, fără buton;
   - butonul „Oprește trenurile”: oprește, iar IntersectionObserver nu repornește trenurile după ce vizitatorul le-a oprit;
   - harta de pe Acasă fără JavaScript: statică, fără buton;
   - pagina de contact nu are niciun `<script>` executabil (singurul permis e `<script type="application/ld+json">`), iar formularul se trimite fără JavaScript;
   - nu apare nicio încălcare CSP în consolă, pe build.
5. Lighthouse 13 pe mobil, rulat local cu `wrangler dev`, mediana din 3 rulări, cu pragurile din capitolul 1. Paginile noindex au excepțiile de acolo. Chrome e instalat pe mașină. Greutatea paginii se judecă doar în producție (9.1).
6. **JSON-LD:**
   - un script verifică tipurile așteptate, legăturile `@id` și câmpurile obligatorii;
   - verificare manuală în Schema Markup Validator și în Rich Results Test, pentru BreadcrumbList, Article și ProfilePage.
7. **Linkuri:** `linkinator` peste `dist/`, recursiv. Linkurile externe se verifică separat.
8. **Marcaje:** build-ul de producție nu conține „[DE COMPLETAT” nicăieri în `dist/`. În previzualizarea `DRAFT=1` (din `dist-draft/`), marcajele apar, la fel și pagina de test pentru diacritice.
9. **Capturi de ecran:** una pe mobil și una pe desktop, revizuite înainte de pagina următoare.

**Worker-ul**, cu teste scrise înaintea codului (TDD), în vitest cu pool-ul Workers:
- **paritatea regulilor:** testele citesc `form-rules.ts` și verifică limitele exacte:
  - 100 de caractere trec, 101 nu;
  - un mesaj de 3000 de caractere cu rânduri noi trimise ca CRLF trece;
  - un câmp obligatoriu care are doar spații trece, ca în browser;
  - e-mailurile valide după algoritmul WHATWG trec, iar cele invalide nu;
  - un serviciu necunoscut e respins;
  - atributele generate în HTML corespund acelorași reguli;
- **cererea reușită:** 303 spre `/contact/multumim/`, cu un singur e-mail trimis;
- **orice regulă încălcată** (de exemplu 101 caractere sau un serviciu necunoscut): 303 spre `/contact/eroare/`, fără e-mail;
- **`\r` sau `\n` în Nume, Firmă, Telefon sau Adresa site-ului:** 303 spre `/contact/eroare/`;
- **câmpul-capcană:** 303 spre `/contact/multumim/`, fără e-mail;
- **limita de trimiteri:** 303 spre `/contact/eroare/`;
- **regula linkurilor:**
  - 3 linkuri trec, 4 nu;
  - se verifică toate formele: `http://`, `https://`, `www.`, cu litere mari sau mici;
  - 3 × `https://www.…` trec, pentru că fiecare se numără o singură dată;
  - peste 3 linkuri, răspunsul e 303 spre `/contact/prea-multe-linkuri/`;
- **e-mailul trimis:** Reply-To, subiectul codificat RFC 2047 cu diacritice, subiectul fără serviciu ales, corpul UTF-8;
- **trimiterea eșuată:** 303 spre `/contact/eroare/`;
- **antetele** puse de Worker;
- **lipsa oricărui `console.log`** cu datele din formular;
- **metode și căi:** 405 pentru orice altă metodă în afară de POST, 404 pentru orice altă cale de sub `/api/`.

**La final, un raport cu:**
- scorurile Lighthouse ale fiecărei pagini;
- rezultatul validării schemei;
- linkurile rupte, dacă există;
- lista completă a marcajelor încă deschise (din `reports/placeholders.json`).

**Scorurile pentru `/proiecte/acest-site/`** se măsoară doar în producție, cu data și versiunea. Pe `workers.dev` categoria SEO pică intenționat, din cauza noindex.

---

## 11. Condiții de lansare și publicare

Comanda `npm run check:launch` refuză lansarea până când:
1. datele PFA sunt reale (denumire, numărul de la Registrul Comerțului, CUI, adresa sediului);
2. domeniul final e setat în `site.config.ts`;
3. pagina Despre e completă: biografie, studii, experiență, instrumente. LinkedIn e opțional;
4. nicio pagină construită nu are `aprobat: false` (3.4);
5. durata de păstrare a datelor e completată în Politica de confidențialitate;
6. nu mai rămâne niciun marcaj `[DE COMPLETAT:#<nr>]` al unui rând marcat „Da” în coloana „Blochează lansarea?” din registrul de la capitolul 12. Aici intră și etichetele buclei lunare și răspunsurile la întrebările frecvente. `check:launch` compară `reports/placeholders.json` cu registrul din `src/placeholders.ts` (3.4);
7. textul „[DE COMPLETAT” nu apare nicăieri în `dist/`.

`npm run deploy` rulează automat `check:launch` după build-ul de producție, înainte de `wrangler deploy` (3.1).

**Ce nu blochează lansarea:**
- Câmpurile opționale goale (fotografia, rezultatele unui studiu de caz) nu apar deloc în producție. Nu se afișează niciun marcaj.
- Pagina `/proiecte/szitrans/` se construiește doar cu `acord: true` (3.4). Fără acord lipsește pagina, dar lansarea nu e blocată.
- `/proiecte/acest-site/` se construiește după prima măsurare în producție (6.6).

**Publicarea:**
- se face numai după un „da” explicit de la Alex;
- contul Cloudflare îl creează Alex, pe numele lui;
- `wrangler login` îl face Alex;
- Alex cumpără domeniul și schimbă nameserverele la registrar. Eu nu cumpăr și nu creez conturi.

---

## 12. Registrul marcajelor [DE COMPLETAT]

În producție, marcajele nu apar niciodată pe pagină (decizia 17). Registrul spune ce lipsește, cine completează și dacă lipsa blochează lansarea.

| # | Ce lipsește | Cine | Blochează lansarea? |
|---|---|---|---|
| 1 | Datele PFA: denumire, numărul de la Registrul Comerțului, CUI | Alex | Da |
| 2 | Adresa sediului profesional (decizie: adresa înregistrată sau mutarea) | Alex | Da |
| 3 | Domeniul final | Alex | Da |
| 4 | Despre: biografie, studii, experiență, instrumente | Alex (eu redactez) | Da |
| 5 | Profiluri pentru `sameAs` (LinkedIn etc.) | Alex | Nu (opțional) |
| 6 | Fotografie reală | Alex | Nu |
| 7 | Acordul scris de la szitrans, plus rezultate verificabile și capturi datate | Alex | Nu (fără el, pagina nu se construiește) |
| 8 | Textul studiului anonim al magazinului online (și serviciile folosite), aprobat, cu capturi anonimizate | Alex | Nu (fără el, pagina nu se construiește) |
| 9 | Acordul mayalashes | Alex | Nu (fără el, pagina nu se construiește) |
| 10 | Rezultatele din studiile de caz (cifre, perioadă, sursă) | Alex | Nu (fără ele, rândul lipsește) |
| 11 | Scorurile acestui site, măsurate în producție | eu, după lansare | Nu (fără ele, pagina nu se construiește) |
| 12 | Volumele cuvintelor-cheie (Keyword Planner) | Alex | Nu |
| 13 | Răspunsurile la întrebările frecvente (6 × 4, plus 4–5 pe Acasă) | eu redactez, Alex aprobă | Da |
| 14 | Duratele și pașii fiecărui serviciu, doar dacă Alex îi confirmă | Alex | Nu (fără ele, duratele lipsesc) |
| 15 | Etichetele buclei lunare din traseul abonamentului | Alex | Da |
| 16 | Textele celor 2 ghiduri | eu redactez, Alex aprobă | Nu (secțiunea lipsește până atunci) |
| 17 | Durata de păstrare a datelor din formular | Alex (cu contabilul) | Da |
| 18 | Timpul de răspuns promis, doar dacă Alex îl confirmă | Alex | Nu (fără el, nu se promite nimic) |
| 19 | Testimoniale reale, cu acord | Alex | Nu |
| 20 | Linkul spre Google Business Profile | Alex | Nu |
| 21 | Textul studiului szitrans: contextul, problema, ce am făcut și serviciile folosite (ruling R19) | Alex (eu redactez) | Nu (fără el, pagina nu se construiește) |

---

## 13. În afara proiectului

- Crearea profilului Google Business și strângerea recenziilor (Alex).
- Contractul-tip și clauzele comerciale ale abonamentului (Alex, cu un avocat).
- Cumpărarea domeniului, crearea contului Cloudflare și schimbarea nameserverelor (Alex).
- Validarea volumelor de căutare (Alex).
- Ghidurile 3–5 din planul inițial (mai târziu, în ritmul lui Alex).
- O căsuță de e-mail reală pe domeniu și trecerea formularului pe Resend (doar dacă Alex o cere).

## 14. Riscuri și puncte deschise

- **Adresa sediului** e încă nedecisă și blochează lansarea.
- **szitrans:** am presupus că numele poate apărea. Acordul scris e condiție pentru pagină.
- **Email Routing ocupă înregistrările MX** ale domeniului (vezi 3.5).
- **Regula de 3 linkuri** poate opri un mesaj real. Riscul e acceptat de Alex. Îl reduc nota din formular („Cel mult 3000 de caractere și cel mult 3 linkuri.”) și pagina dedicată, care explică cum se recuperează textul (butonul Înapoi).
- **Textul recuperat cu Înapoi** depinde de browser. Majoritatea păstrează valorile din formular la întoarcere, dar nu toate. Paginile de eroare dau oricum contactele directe.
- **Trenurile continue** consumă puțin procesor pe telefoanele slabe. Le limitează cele 2 trenuri de sub 640px și oprirea când harta iese din ecran.
- **Firefox și Samsung Internet** nu au tranziții între pagini. Pe ele site-ul funcționează normal, doar fără efect.
- **Lighthouse local** poate da altceva decât PageSpeed Insights, care rulează pe o versiune mai veche de Lighthouse. Pe site se publică doar valori măsurate în producție, cu data și versiunea.
- **Formularul fără confirmare** pe e-mail pentru vizitator e o limitare acceptată.
