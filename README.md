# Site-ul lui Alex Ionescu

Site-ul de prezentare al lui Alex Ionescu, consultant SEO și web design din București. Static, construit cu Astro, găzduit pe Cloudflare (Workers cu fișiere statice), cu un singur Worker pentru formularul de contact. Specificația completă e în `docs/superpowers/specs/2026-10-21-site-alex-ionescu-design.md`, iar planul de lucru în `docs/superpowers/plans/2026-10-21-site-alex-ionescu.md`.

Cerințe: Node 24 (`.node-version`). Instalare: `npm ci`.

## Comenzi

| Comandă | Ce face |
|---|---|
| `npm run dev` | Serverul de dezvoltare Astro (fără CSP și fără Worker). |
| `npm run build` | Build-ul de producție în `dist/`: doar paginile publicabile, fără niciun marcaj. |
| `npm run preview:draft` | Build-ul de previzualizare în `dist-draft/` (`DRAFT=1`): toate paginile, cu marcajele `[DE COMPLETAT]` vizibile. Îl vezi în browser cu `npx cross-env DRAFT=1 astro preview`. |
| `npm run test:unit` | Testele vitest (componente, pagini, conținut, scripturi). |
| `npm run test:worker` | Testele Worker-ului formularului (vitest, legăturile Cloudflare simulate). |
| `npm run test:e2e` | Testele Playwright pe build, servit cu `wrangler dev` (formularul ajunge la Worker). |
| `npm run qa:page -- <cale>` | Verificarea completă a unei pagini: build, html-validate, schema, Playwright (axe, 320px, text mărit, CSP), Lighthouse pe mobil (3 rulări), capturi. Cu `QA_DIST=dist-draft` verifică previzualizarea. |
| `npm run check` | Fără ş/ţ cu sedilă; fonturile livrate au ș și ț. |
| `npm run check:links` | Linkurile interne din `dist/`. |
| `npm run report:placeholders` | `reports/placeholders.json`: marcajele rămase în sursă, cu rândul din registru. |
| `npm run check:launch` | Refuză lansarea cât timp lipsește ceva (vezi mai jos). |
| `npm run report` | `reports/raport-final.md`: scorurile pe pagină, schema, linkurile rupte și marcajele deschise. |
| `npm run deploy` | Build, `check`, `check:launch`, apoi `wrangler deploy`. **Doar cu acordul lui Alex.** |

## Cum aprobi o pagină

Nimic neaprobat nu ajunge pe site: `check:launch` refuză lansarea cât timp o pagină construită nu e aprobată.

- **Serviciile, proiectele și ghidurile:** câmpul `aprobat: true` din fișierul lor din `src/content/`.
- **Celelalte pagini** (Acasă, Servicii, Cum lucrez, Despre, Contact, paginile legale, 404, paginile de răspuns ale formularului): intrarea lor din `src/approvals.ts`.
- Înainte să aprobi, citește pagina în previzualizare (`npm run preview:draft`, apoi `npx cross-env DRAFT=1 astro preview`), unde se văd marcajele rămase.
- Răspunsurile la întrebările frecvente (registrul, #13) sunt ciorne în paginile lor: le aprobi odată cu pagina.

## Ce verifică `check:launch`

Rulează pe build-ul de producție (`npm run build`, fără `SITE_URL` și fără `DRAFT` în mediu) și cade cu lista de motive până când:

1. datele PFA sunt completate în `src/site.config.ts` (denumire, numărul de la Registrul Comerțului, CUI, sediul);
2. domeniul final e pus în `src/site.config.ts`;
3. pagina Despre e completă (biografie, studii, experiență, instrumente);
4. fiecare pagină construită e aprobată;
5. nu mai rămâne niciun marcaj al unui rând blocant din registru (`src/placeholders.ts`), inclusiv durata de păstrare a datelor, etichetele buclei lunare și data verificării certificării Cloudflare;
6. textul „[DE COMPLETAT” nu apare nicăieri în `dist/`.

Refuză și un `dist/` construit pentru QA (cu `localhost` sau cu domeniul provizoriu) și orice `[DE COMPLETAT` din orice fișier text din `dist/`.

Afișează și avertismente care nu blochează: datele scrise de mână în ghiduri și în paginile legale (pune data aprobării) și `npm audit` pentru dependențele de dezvoltare.

## Pașii lui Alex pentru publicare, în ordine

1. Cumperi domeniul.
2. Creezi contul Cloudflare, pe numele tău.
3. Schimbi nameserverele la registrar, spre Cloudflare.
4. Activezi Email Routing, verifici `idealserv51@gmail.com` și redirecționezi `contact@<domeniu>` spre el. Email Routing preia înregistrările MX ale domeniului.
5. Aplici regulile de zonă din §3.6, una câte una: Always Use HTTPS și 301 de la www spre varianta fără www; Web Analytics oprit; Bot Fight Mode oprit; fără Turnstile; Email Address Obfuscation oprit; Rocket Loader oprit; blocarea crawlerelor AI și „Managed robots.txt” oprite; Crawler Hints (IndexNow) pornit.
6. Pui domeniul real în `src/site.config.ts`.
7. Rulezi `npx wrangler login`.
8. Rulezi `npm run deploy`, doar după ce `npm run check:launch` trece și doar cu acordul tău. Primul deploy creează Worker-ul `siteulet` pe `*.workers.dev`.
9. Legi domeniul de Worker: în Cloudflare, Workers & Pages → `siteulet` → Settings → Domains & Routes → Add → Custom domain, cu domeniul fără www. Din dashboard, domeniul rămâne scris doar în `site.config.ts`; varianta din `wrangler.jsonc` (`routes` cu `custom_domain: true`) l-ar pune într-un al doilea loc.
10. Verifici în producție: antetele `Set-Cookie` (nu trebuie să existe), că HTML-ul servit nu conține `/cdn-cgi/` sau `data-cfemail` și că numărul de `<script>` de pe fiecare pagină e același ca în `dist/`.
11. Configurezi Google Search Console (cu verificarea prin DNS, nu printr-un fișier HTML: un fișier HTML în plus ar fi o pagină neaprobată pentru `check:launch`), Bing Webmaster Tools, IndexNow și Google Business Profile.
12. Faci prima măsurare Lighthouse și PageSpeed în producție, o treci în `src/content/proiecte/acest-site.md` (`scoruri`), cu data și versiunea, și pui `aprobat: true`; atunci se construiește pagina „Acest site” și apare în subsol fraza „Fără cookie-uri de urmărire și fără scripturi terțe. Vezi cum e făcut site-ul.”

**Formularul pe `*.workers.dev`:** adresa de trimitere e `formular@<domeniul cererii>`. Pe un domeniu `workers.dev` nu există Email Routing, deci trimiterea eșuează și vizitatorul ajunge pe `/contact/eroare/`. Formularul merge doar pe domeniul tău.

**Limita de trimiteri** (3 cereri pe minut de pe același IP) folosește spațiul de nume `1001` din `wrangler.jsonc`. Dacă ai alte limitatoare în același cont Cloudflare, alege alt număr.

## Verificarea manuală a schemei, înainte de lansare

- [Schema Markup Validator](https://validator.schema.org/) pe o pagină de serviciu, pe un ghid și pe Despre.
- [Rich Results Test](https://search.google.com/test/rich-results) pentru BreadcrumbList, Article și ProfilePage.
- Verifici certificarea Cloudflare în Data Privacy Framework pe [dataprivacyframework.gov](https://www.dataprivacyframework.gov/) și treci data în Politica de confidențialitate (marcajul #22).

## Varianta cu Resend

Dacă îți faci o căsuță reală pe domeniu (Google Workspace, Zoho), Email Routing nu mai poate prelua MX-urile, deci formularul trece pe Resend:

1. Creezi contul Resend și verifici domeniul (înregistrările SPF și DKIM pe care ți le dă Resend).
2. Pui cheia API ca secret: `npx wrangler secret put RESEND_API_KEY`.
3. În `worker/index.ts`, în locul lui `env.EMAIL.send(...)`, trimiți același subiect și același corp prin API-ul Resend (`POST https://api.resend.com/emails`), cu `reply_to` pe adresa vizitatorului. Scoți legătura `send_email` din `wrangler.jsonc`.
4. Actualizezi destinatarii din Politica de confidențialitate (Resend în locul lui Email Routing) și transferurile.

## Chei experimentale

`astro.config.mjs` nu folosește nicio cheie `experimental`: CSP-ul vine din `security.csp`, iar fonturile din `fonts`. Doar testele folosesc o interfață experimentală, `experimental_AstroContainer` din `astro/container` (`tests/unit/helpers.ts`), ca să randeze componentele; site-ul nu depinde de ea.

## Unde e fiecare lucru

- `src/site.config.ts`: domeniul, contactele, datele PFA.
- `src/form-rules.ts`: regulile formularului și lista serviciilor (le folosesc și paginile, și Worker-ul).
- `src/placeholders.ts`: registrul marcajelor `[DE COMPLETAT:#n]`.
- `src/approvals.ts`: aprobările paginilor `.astro`.
- `src/lib/routes.ts`: titlul și descrierea paginilor statice și lista paginilor construite (imaginile OG, llms.txt, aprobările).
- `worker/`: Worker-ul formularului. `wrangler.jsonc`, `public/_headers`: configurarea Cloudflare.
