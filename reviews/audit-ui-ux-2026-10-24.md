# siteulet: UI, UX and functionality audit

**Date:** 2026-10-24 · **Commit audited:** `e9b08ef` on `feat/site` (same tree as `main` at `b17d8f9`) · The audit itself changed nothing in the repository; the fixes applied afterwards are in section 7.

## 1. Scope

**Stack** (read from the repository, not assumed)
- Astro 7.4.1 static site (`astro.config.mjs`: `output: 'static'`, `trailingSlash: 'always'`, `security.csp: true`), TypeScript strictest. One typeface, Atkinson Hyperlegible Next (variable, Fontsource, latin and latin-ext), loaded through the Astro Fonts API.
- Hosting: Cloudflare Workers static assets (`wrangler.jsonc`: assets from `./dist`, `not_found_handling: "404-page"`).
- One Worker handles `/api/*` (`worker/index.ts`):
  - it checks the request's origin and size, then validates with the same rules as the form (`src/form-rules.ts`);
  - it rate-limits to 3 sends per 60 s and sends one e-mail through the `send_email` binding to a Gmail inbox;
  - it answers with a 303 to `/contact/multumim/`, `/contact/eroare/` or `/contact/prea-multe-linkuri/`;
  - logs are off (`observability.enabled: false`).
- Security and caching: a CSP with hashes in a `<meta>`; the other security headers and the caching rules in `public/_headers` (`/_astro/*` immutable, `noindex` on `*.workers.dev`).
- By design: no analytics, cookies, third-party scripts or consent banner (spec decision 2). Romanian only, one theme (light content with a dark header and band, decisions 25–29), so there were no language or theme variants to test.
- Scripts:
  - `npm run build`, and `npm run preview` (build, then `wrangler dev`);
  - `npm run preview:draft` (`DRAFT=1`, which shows unreleased pages and the `[DE COMPLETAT]` markers);
  - `npm run deploy` (tests, build, checks, `check:launch`, then `wrangler deploy`).
- No CI, by the owner's choice.

**Pages**
- The production build has 18 routes: `/`, `/servicii/`, six service pages, `/cum-lucrez/`, `/despre/`, `/contact/`, three form results, three legal pages and the 404. The six service pages are `seo`, `optimizare-aeo-geo`, `audit-seo`, `creare-site`, `redesign-site` and `mentenanta-site`; the form results are `multumim`, `eroare` and `prea-multe-linkuri`.
- The draft build adds seven unreleased pages: `/proiecte/` with three case studies, and `/ghiduri/` with two guides. I checked them for breakage but judged the site as a prospect sees it today, without them.
- No public page or content entry is approved yet (`src/approvals.ts`, `aprobat: false` in `src/content/`), so `check:launch` blocks a deploy, by design.

**How the site was run**
- In a scratch copy outside the repository.
- The production-like build used `SITE_URL=http://localhost:8787`, so canonical URLs and the public e-mail address read `localhost`. It was served by `wrangler dev`, as `npm run preview` does: the real Worker plus the static assets.
- The draft build was served by `astro preview`.
- `DEBUG_FORM=1` was set only in the scratch copy's `.dev.vars`.

**Browsers and viewports**
- Chrome (the system install, driven by Playwright 1.64.1), all 25 pages (18 public, 7 draft): 390×844, 768×1024 and 1440×900, plus 320 px wide with text at 200%.
- Firefox 157 and Playwright's WebKit build: all 25 pages at 390 and 1440.
- Chrome only:
  - keyboard-only runs on six pages at 1440 and on Acasă at 390;
  - reduced motion and JavaScript disabled;
  - the CPU slowed 4× to check the animation.

**Automated checks.** All of these tools are already in the project's dependencies; nothing was added or reconfigured.
- Lighthouse 13.5.0: the mobile preset with 3 runs per page (median) on all 18 public pages, and the desktop preset on 5 pages.
- axe-core 4.14 through `@axe-core/playwright` (WCAG 2.0, 2.1 and 2.2 A and AA, plus best practices), on 25 pages at 390 and 1440 in Chrome.
- html-validate, linkinator (`npm run check:links`) and the project's JSON-LD checker (`scripts/check-schema.mjs`).
- Playwright scripts for console messages, CSP reports, failed requests, overflow, first-screen geometry, keyboard order, hover and active states, and every link.

**What I couldn't test**
- A real form send, per the guardrail. The local `send_email` simulation also failed in the scratch copy (a miniflare internal error, specific to that environment). The success path rests on:
  - the Worker unit tests;
  - the end-to-end send without JavaScript that passed in the 2026-10-23 review;
  - viewing `/contact/multumim/` directly.

  The rejections (too many links, a cross-site POST) were exercised locally.
- Real Safari (macOS, iOS) and real Android devices. Playwright's WebKit on Windows lays text out at the requested weight but draws variable-font glyphs at the default weight. A 40 px test string measured 515.5, 551.3 and 569.9 px at weights 400, 700 and 800 in all three engines, yet WebKit's screenshots look regular. I treated this as a test-environment artifact, not a site defect.
- Production: Cloudflare's CDN and compression, the headers on the real domain, Email Routing, and field Core Web Vitals. The site isn't live, and the domain is still a launch marker.
- Screen readers. Accessibility was checked with axe, the accessibility tree and the keyboard runs.

**Earlier audits.** I read:
- `reviews/audit-plan-full.md` (2026-10-22);
- `audit argon.md` (2026-10-23, untracked);
- the 2026-10-23 review (PR #2 and commit `e9b08ef`).

Items verified as fixed are left out:
- in the pages and copy: the `og:type`, the Despre and Contact heading issues, invisible dividers, long pages without cards, half-empty rows on `/servicii/`, and the false sentence in the "acest site" draft;
- in the form and Worker: the rate-limit order and the cross-site POST check;
- in tooling: `deploy` running the tests, Firefox and WebKit projects for the home page, the rollback notes, and `.gitattributes`.

Each open item says where it was first raised.

## 2. Highest-impact improvements

1. Publish proof of work: approve the szitrans and online-shop case studies, so Acasă, the service pages and Despre stop relying on copy alone. **UX-01**
2. Answer "why choose me" on Acasă, using facts the site already states. **UX-02**
3. State, next to the button, what a quote request costs and commits the visitor to. **UX-03**
4. Make the first screen name both offers (SEO and websites) and say the work covers the whole country. **UX-04**
5. On the thank-you page, say when the reply will come and from which address. **UX-05**
6. Give Alex a signal when the form stops delivering. **FN-01**
7. Reply from an address that matches the site, not an unrelated Gmail. **FN-02**
8. Shorten the dark header and band on phones, so inner pages start with content. **UI-01**
9. Explain or drop „reducerea” in the prices answer on Acasă. **UX-06**
10. Make the `/servicii/` cards behave like the rows on Acasă, and drop the six "eu, Alex Ionescu" openings there. **UI-02**, **UX-07**

## 3. Findings

**Ratings**
- **Impact** is how much the issue affects a prospect's trust and decision to get in touch: Critical, High, Medium or Low. Nothing is rated Critical: a prospect can always understand the offer and get in touch, and the launch blockers are the owner's data, which `check:launch` enforces.
- **Effort:** S is copy, CSS or configuration (under a day); M is a few days, or content work; L is more.
- **Verified** means observed or measured in this audit; **inferred** means read from code, configuration or documents.

### The five-second test (Acasă, 390×844 and 1440×900, Chrome)

| Question | Answer | Evidence |
|---|---|---|
| Whose site is it? | Yes | The logo „Alex Ionescu, consultant SEO” is at the top left at every width. |
| What is offered, and to whom? | Mostly | The H1 reads „Consultant SEO din București” and the subtitle „SEO, site-uri și audituri pentru firme care vor să fie găsite în Google și în căutarea AI.” Websites get a single word (UX-04). |
| Why choose him? | No | Nothing on Acasă says it, and production has no proof anywhere (UX-01, UX-02). |
| How to get in touch? | Yes | „Cere o ofertă” is in the hero, inside the first screen at both widths. Phone and WhatsApp appear only in the footer, on Contact and on the error pages. |

### UI

The visual system is in good shape:
- one typeface at three weights, a mostly token-based palette, square controls, and white cards on a tinted surface;
- underlined links;
- a metro-map motif used with restraint („Ești aici” on the service maps is useful wayfinding).

Interaction states are consistent (verified in Chrome):
- links gain or thicken an underline on hover;
- the CTA darkens from #2D6CDF to #1A4FB8, underlines, and moves down 1 px when pressed;
- every keyboard stop has a focus indicator, including on the dark header.

No page scrolls horizontally at any width tested, including 320 px with text at 200%. The animation runs smoothly: in 5 s with the CPU slowed 4×, no animation frame took longer than 50 ms. The only text off the type scale is the trains button (0.8rem, below the smallest token, `--text-sm` at 0.9rem); for a deliberately small, secondary control (spec §5.6) that's fine.

#### UI-01 · On phones, inner pages spend about 300 px on the header and band before the content (trade-off)
- **Where:** every page with a band (`src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/MetroMap.astro`).
- **Problem:** on phones the header takes three rows (logo, menu, CTA), and the decorative band follows before the breadcrumbs and the H1.
- **Evidence:** the top of the H1, measured in Chrome:

  | Viewport | Header | Band | H1 starts at |
  |---|---|---|---|
  | 390×844, inner pages | 158 px | 148 px | 374 px |
  | 390×844, with Proiecte and Ghiduri in the menu (draft build) | 202 px | 148 px | 418 px (462 px on guides) |
  | 768×1024 | 116 px | 144 px | 328 px |
  | 1440×900 | 68 px | 230 px | 367 px |
  | 390×844, Acasă (for comparison) | 110 px | — | 254 px |
- **Why it matters:** a visitor who lands from Google on a service page sees the same decoration on every page before the answer, and the trains restart each time.
- **Fix (owner's call):**
  - (a) keep it, per decision 28;
  - (b) a lower band on inner pages below 48rem, such as a single strip of the map;
  - (c) below about 400 px, the CTA on the same row as the menu;
  - (d) a static map without trains on inner pages, which also removes the stop button there.
- **Impact:** Medium · **Effort:** S–M · **Verified** · **First raised:** 2026-10-22 audit, D2/U3; 2026-10-23 review, F11/D5. Still open.

#### UI-02 · On `/servicii/` only the card title is clickable, unlike the rows on Acasă
- **Where:** `src/pages/servicii/index.astro:63-74` (`.serviciu-card`), compared with `src/components/LineDiagram.astro:111-118`.
- **Problem:** on Acasă, each service row is a single link: the link's `::after` covers the whole row. On `/servicii/` the card body does nothing: no hover change, a normal cursor, and only one link per card (the H3).
- **Evidence** (Chrome, 1440):
  - clicking the first card's paragraph left the page on `/servicii/`;
  - the card's computed styles were the same before and during hover;
  - clicking the problem text of the first row on Acasă opened `/servicii/seo/`; the element under the pointer was `a.linie-rand__capat`.
- **Why it matters:** the two lists of the same six services behave differently, and on phones a larger target helps.
- **Fix:** reuse the stretched-link pattern on the card: `position: relative` on the card and `::after { inset: 0 }` on the title link. Add the same hover cue as on Acasă (a thicker underline on the service name). The card keeps a single accessible name.
- **Impact:** Low · **Effort:** S · **Verified**

#### UI-03 · The same colours mean two things on Acasă (trade-off)
- **Where:** `src/components/RouteMap.astro:77-81`; spec §4.3, point 4.
- **Problem:** „Remediere unică” is drawn in the Construcție colour (#8A5A00) and the subscription in the Vizibilitate blue. This is right below „De unde pornești?”, where the same colours mean service groups.
- **Why it matters:** the colour coding becomes slightly inconsistent. The text labels carry the meaning, as the spec intends, so it confuses briefly at most.
- **Fix:** (a) draw the one-off route in ink or a neutral grey and keep blue for the subscription; (b) accept it.
- **Impact:** Low · **Effort:** S · **Inferred** (no user testing)

### UX and conversion

**In good shape (verified)**
- **Navigation and information architecture** are clear: four menu items and the CTA, breadcrumbs on inner pages, the six services grouped into four "lines", related services at the end of each service page, and every service in the footer.
- **Service pages** answer the right questions in a sensible order:
  - who it's for, the signs that you need it, and what you get;
  - how the work runs, then the FAQ;
  - an honest „Nu garantez poziții în Google și nici apariții în răspunsurile motoarelor AI.”;
  - related services.
- **The contact path** is solid:
  - visible labels marked „(obligatoriu)” or „(opțional)”, with `autocomplete` on name, e-mail, phone and company;
  - a website field that accepts „exemplu.ro” (plain text with `inputmode="url"`);
  - the limits stated under the message (3000 characters, 3 links) and a privacy note under the button;
  - it works without JavaScript;
  - after "too many links", Back restores the message and the name (verified);
  - the error page gives direct contacts: „Mesajul n-a plecat. Apasă Înapoi ca să-l recuperezi și încearcă din nou peste un minut, sau scrie-mi direct la:”, followed by e-mail, phone and WhatsApp.
- **The 404 page** is good: status 404, `noindex`, a plain explanation, and links to Acasă, Servicii and Contact.

#### UX-01 · The production build shows no proof of competence
- **Where:**
  - `src/content/proiecte/*.md`, where all three projects have `aprobat: false`;
  - `src/pages/index.astro:94-103`, where the Proiecte section renders only when a project is publishable;
  - the project slot in `src/layouts/Service.astro`;
  - `src/pages/despre.astro:33-36`.
- **Problem:** no case study, result, testimonial, review or photo appears anywhere. Despre names szitrans.eu as plain text (no link, because its study is unpublished) and describes the online shop anonymously.
- **Evidence:** the production build and screenshots:
  - `/proiecte/` doesn't exist;
  - Acasă has no Proiecte section;
  - the service pages have no project block.

  The owner-input register in spec §12 lists what's missing: #6 photo, #7 and #21 szitrans results and text, #8 shop study, #10 results, #19 testimonials, #20 Google Business Profile.
- **Why it matters:** people hiring for SEO or a website judge past work first. Today the only proof is the quality of the site itself, which few prospects can assess.
- **Fix** (owner input; nothing should be invented):
  1. Approve the szitrans study (consent given, decision 23). It then appears on Acasă and on its service pages, and the name on Despre becomes a link.
  2. Approve the anonymous shop study (#8).
  3. Add results only where they can be verified (#10).
  4. Add a real photo to Despre (#6).
  5. Use testimonials only if they're real and given with consent (#19), and collect Google reviews once the profile exists (#20).
  6. After launch, publish the "acest site" study with the production scores (#11).

  Until the szitrans study is ready, Despre could link to the live szitrans.eu, since consent exists. That's the owner's call.
- **Impact:** High · **Effort:** S to approve, M for the content · **Verified** · **First raised:** argon P1.5; 2026-10-22 audit, U1 and recommendation 11.

#### UX-02 · Acasă never says why to choose Alex
- **Where:** `src/pages/index.astro:71-117`. The differentiator appears only in `src/pages/despre.astro:30`.
- **Problem:** Acasă runs hero → problems → routes → FAQ → final CTA, and „Alex Ionescu” doesn't appear in its `<main>` at all (only in the logo). The strongest reason to hire a freelancer rather than an agency is on Despre: „Lucrez singur. Când îmi scrii, vorbești direct cu cel care face lucrarea: eu mă uit la site, eu fac oferta și eu fac modificările. La final primești un raport cu ce am schimbat.” The other reassurances are scattered:
  - „Nu garantez poziții în Google…” on the service pages;
  - „Lucrul începe doar după ce accepți oferta.” in the FAQ.
- **Evidence:** a text count on the build (zero mentions in Acasă's `<main>`). On the 1440×900 screenshot, the lower right of the hero is empty: about 650×300 px (read off the image), beside the subtitle and CTA and below the map.
- **Why it matters:** this is the question the five-second test fails, and prospects usually compare several providers.
- **Fix:** add one short "why me" element built only from facts already on the site:
  - (a) one line in that empty hero space, condensed from the Despre sentence (works alone, you talk to the person who does the work, you get a report);
  - (b) a compact card after „De unde pornești?” with three facts already on the site: direct contact with the person doing the work, a report at the end, and an optional subscription.

  Add the photo once #6 exists.
- **Impact:** High · **Effort:** S · **Verified** (content) · **Inferred** (effect)

#### UX-03 · The cost and commitment of a quote request aren't stated where people decide
- **Where:** Acasă and `/contact/`. The only explicit statement is in `src/pages/termeni-si-conditii.astro:34`.
- **Problem:** the sentence „O cerere de ofertă trimisă de pe site nu obligă pe nimeni, nici pe tine, nici pe mine.” is only in the Terms. Contact opens with „Spune-mi ce site ai și ce te încurcă, iar eu îți trimit oferta.” No page says whether the evaluation and the quote are free.
- **Why it matters:** "will this cost me, or get me a sales call?" is the main hesitation before filling in a form, especially for small firms.
- **Fix:** add one line under the hero CTA and next to the form button that reuses the Terms sentence. Add "free" only if it's true (owner input: are the evaluation and the quote free?).
- **Impact:** Medium · **Effort:** S · **Verified** (the absence)

#### UX-04 · The first screen says "SEO" and "București"; websites and the rest of the country are easy to miss (trade-off)
- **Where:**
  - the logo (decision 19);
  - the Acasă H1 (decision 13), `src/pages/index.astro:72-73`;
  - compared with `src/pages/despre.astro:77` and `:124`.
- **Problem:**
  - the logo says „consultant SEO” and the H1 „Consultant SEO din București”; websites get the single word „site-uri” in the subtitle;
  - Despre says „consultant SEO și web design”, and its profile card „Consultant SEO și web designer”, while three of the six services are about websites;
  - „din toată țara” appears only in the FAQ, on Contact, and in service-page H1s such as „Servicii SEO pentru firme din toată țara”.
- **Why it matters:** someone who needs a website, or who isn't in Bucharest, can decide the site isn't for them before scrolling. Visitors who land from Google on `/servicii/creare-site/` are less affected.
- **Fix:** this depends on positioning; the assumption here is that SEO is the lead offer.
  - (a) keep the logo and H1 (they're keyword decisions), but name websites explicitly in the subtitle and add „din toată țara” there (an open copy item since 2026-10-23);
  - (b) align the logo with Despre („consultant SEO și web design”), which changes decision 19 and the OG images;
  - (c) keep it as it is, if websites are deliberately the second line.
- **Impact:** Medium · **Effort:** S · **Verified** (copy) · **Inferred** (effect)

#### UX-05 · After sending, the visitor doesn't know when or from where the answer will come
- **Where:** `/contact/multumim/`; owner input #18.
- **Problem:** the page says „Mă uit la ce mi-ai scris și la site-ul tău, apoi îți trimit oferta: ce lucrez, în ce ordine și ce primești.” It gives no time frame and no reply address. The reply will come from the Gmail inbox (FN-02), an address the visitor has never seen on the site.
- **Why it matters:** uncertainty right after the visitor has acted, and a reply from an unknown sender is easy to miss or to filter out.
- **Fix:**
  - add the response time once Alex commits to one (#18);
  - name the address the reply will come from, or solve FN-02;
  - optionally, ask the visitor to check the spam folder;
  - repeat the same information next to the form button.
- **Impact:** Medium · **Effort:** S · **Verified** (copy)

#### UX-06 · The prices answer mentions a discount it doesn't explain
- **Where:** `src/pages/index.astro:41`.
- **Problem:** „Nu. Prețul, reducerea și ce include abonamentul le stabilim după ce mă uit la site-ul tău.” Acasă never says what the discount is. Cum lucrez does: „Cu abonamentul lunar, remedierea costă mai puțin…” (`src/pages/cum-lucrez.astro:82`).
- **Why it matters:** an unexplained "discount" raises a question at the moment of deciding.
- **Fix:** explain it in the same sentence (the subscription lowers the price of the fix), or drop the word on Acasă.
- **Impact:** Low · **Effort:** S · **Verified** · **First raised:** argon P1.2; D5 in the layered-surfaces design.

#### UX-07 · Six cards on `/servicii/` open with "eu, Alex Ionescu"
- **Where:** `src/pages/servicii/index.astro:51` (the intro) and `:67` (each card prints the service's `raspunsDirect`).
- **Evidence:** in the `<main>` of the built page, „Alex Ionescu” appears 7 times, 6 of them as „eu, Alex Ionescu”. Each service page has it once, which is fine there (direct answers, spec §6.4).
- **Why it matters:** it reads as boilerplate on the one page meant for comparing services, and skimmers see the same opening six times.
- **Fix:** D6 option (a): a short card summary without the name (a new `rezumat` field) that starts from the problem or the benefit. For the intro, the 2026-10-23 review proposed „Sunt Alex Ionescu și lucrez pe patru linii…”.
- **Impact:** Low · **Effort:** S–M · **Verified** · **First raised:** argon §5 (copy); 2026-10-23 review, F7/D6.

#### UX-08 · Jargon where labels stand alone; Despre speaks to developers
- **Where:** the service name „Optimizare AEO și GEO” (Acasă rows, `/servicii/`, the footer, related services); `src/pages/despre.astro:35-44`.
- **Problem:**
  - most business owners don't know AEO or GEO; on Acasă the problem sentence beside the name explains it, but in the footer and the related lists the name stands alone;
  - the experience section on Despre uses „datele structurate”, „etichetele meta” and „harta site-ului”;
  - the Despre profile card lists 11 tools (Astro, React, TypeScript … Git) that the „Instrumente” section above already names.
- **Why it matters:** a non-specialist skims the labels, and a list of tools doesn't tell a client what they'll get.
- **Fix:**
  - keep the service name (it's a keyword), but add a plain descriptor where it stands alone, such as „(ChatGPT și căutarea AI)”;
  - on Despre, say what each client got, in plain words;
  - in the profile card, replace the duplicated tool list with client-facing facts already on the site, or drop it.
- **Impact:** Low · **Effort:** S · **Verified**

#### UX-09 · Validation messages follow the browser's language (trade-off)
- **Where:** `src/components/ContactForm.astro` (native `required` and `type="email"`); spec §9.2; decision 20 (no JavaScript).
- **Evidence:** Chrome with an English interface (page `lang="ro"`, Playwright locale `ro-RO`) showed „Please fill out this field.” and „Please enter a part following '@'. 'ana@' is incomplete.”
- **Why it matters:** on a browser set to English, the site's only interactive step switches language.
- **Fix:** (a) accept it, since browsers set to Romanian show Romanian; (b) custom messages, which need a few lines of JavaScript and go against decision 20.
- **Impact:** Low · **Effort:** S · **Verified** · **First raised:** argon 6.3 (accepted at the time).

### Accessibility

The WCAG 2.2 AA essentials are in good shape (verified):
- **axe:** no violations on 25 pages at 390 and 1440 in Chrome. Lighthouse accessibility scores 100 on all 18 public pages.
- **Keyboard:** the order is logical: skip link, logo, menu, CTA, stop button, content, footer. Every stop has a visible indicator, there are no traps, and the footer is reachable. The skip link appears on focus and moves focus to `<main id="continut">`. The band sits inside `<main>`, so the next stop is the trains button, which keeps the motion control early.
- **Structure:** one H1 per page and no skipped heading levels. Each page has one header, main and footer; inner pages have two navs (menu and breadcrumbs), and Despre has a labelled aside.
- **Labels and alt text:** form labels are visible and associated, and every `<img>` has `alt`.
- **Reflow:** at 320 px with text at 200%, nothing overflows.
- **Reduced motion:** the trains, the line drawing and the stop button are all off.
- **Stop button:** it switches between „Oprește trenurile” and „Pornește trenurile”, and a polite live region announces „Trenurile s-au oprit.” or „Trenurile au pornit.”.

#### A11Y-01 · Stopping the trains isn't remembered (trade-off, D7)
- **Where:** `src/client/trains.ts`.
- **Problem:** the trains restart on every page with a band (15 of the 18 public pages), so a visitor who stopped them has to stop them again on each page.
- **Why it matters:** WCAG 2.2.2 is met page by page, but motion-sensitive visitors who haven't set the OS preference see the animation again after every navigation.
- **Fix:** D7 decided to keep it as is. If that's revisited: (a) remember the choice in `sessionStorage` (the cookie policy promises no local storage, and that text is Alex's); (b) no trains on inner pages (UI-01, option d).
- **Impact:** Low · **Effort:** S · **Verified** · **First raised:** 2026-10-23 review, F12/D7 (decided).

### Functionality

**In good shape (verified)**
- **Links:** across the 18 public pages, all 20 distinct link targets work:
  - internal pages return 200, and so does `wa.me`;
  - the `tel:` and `mailto:` links are well formed;
  - both in-page anchors exist, and every header link works at 390 px.
- **Console and network:** no console errors in Chrome or Firefox on any page; no failed requests, cookies, storage or third-party requests.
- **Without JavaScript:** everything works except the trains, including the form (a plain POST to the Worker).
- **Worker:** a cross-site POST gets a 303 to `/contact/eroare/` and nothing is sent. A message with too many links goes to `/contact/prea-multe-linkuri/` before the rate limit counts anything.

#### FN-01 · Nobody finds out when the form stops delivering
- **Where:**
  - `wrangler.jsonc:15` (`observability.enabled: false`);
  - `worker/index.ts:111-115`: any error leads to `/contact/eroare/`, and it's logged only when `DEBUG_FORM` is set locally;
  - README step 11 and the monthly test.
- **Problem:** if Email Routing or the Gmail destination breaks (a DNS edit, a replaced MX, a lost verification), one of two things happens:
  - the visitor sees the error page;
  - Cloudflare accepts the message and delivery fails later, so the visitor sees the thank-you page.

  Either way, Alex gets no alert and no log.
- **Why it matters:** the form is the main way to get in touch, and a silent outage loses every request until someone notices the silence.
- **Fix** (D3, the owner's call):
  - (a) keep it as is, and put the monthly test send in a calendar;
  - (b) a single fixed error event with no personal data: logs on, invocation logs off, one `console.error` without form data. The privacy policy must mention it, and that text is Alex's;
  - (c) a weekly heartbeat e-mail from a Cron Trigger, so that silence becomes the alarm.
- **Impact:** Medium · **Effort:** S–M · **Verified** (configuration) · **Inferred** (failure modes) · **First raised:** 2026-10-22 audit, Critical #1 (P1, B1, X3); argon P0.2; 2026-10-23, D3.

#### FN-02 · Replies go out from a personal Gmail address
- **Where:**
  - `wrangler.jsonc:17`: the `send_email` destination is a Gmail inbox;
  - `worker/email.ts:53`: the Reply-To is the visitor;
  - README step 4: Email Routing only forwards `contact@<domeniu>` to Gmail;
  - the README section "Varianta cu Resend" and spec §13.
- **Problem:** the site publishes `contact@<domeniu>`, but answering a request in Gmail sends it from the Gmail address, whose name doesn't match the brand.
- **Why it matters:** the first reply is where trust is won or lost. An unexpected sender looks less professional and is more likely to land in spam.
- **Fix:**
  - (a) a mailbox on the domain (Workspace or Zoho), with the form moved to Resend as the README describes. This means an MX change, a cost, and new recipients in the privacy policy, whose text is Alex's;
  - (b) keep Gmail, set its display name to „Alex Ionescu”, and name the reply address on the thank-you page (UX-05).
- **Impact:** Medium · **Effort:** S for (b), M for (a) · **Inferred** (from the configuration and README) · **First noted:** 2026-10-23 review (the row on argon P1.4).

#### FN-03 · A double click can send the request twice
- **Where:** `src/components/ContactForm.astro` (no JavaScript, decision 20) and `worker/index.ts` (no de-duplication; the limit allows 3 sends per 60 s).
- **Why it matters:** it's harmless, but two identical e-mails can lead to two replies.
- **Fix:** (a) accept it; (b) the thank-you note suggested on 2026-10-22. De-duplicating on the server would need storage (KV), which isn't worth it.
- **Impact:** Low · **Effort:** S · **Inferred** (not testable without sending) · **First raised:** 2026-10-22 audit, U2.

#### FN-04 · WebKit reports one CSP violation on `/contact/`
- **Where:** `/contact/`, on the source line that holds `<select id="formular-serviciu">`.
- **Evidence:**
  - Playwright WebKit at 390 and 1440, without screenshots:
    - the console shows „Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive…”;
    - the violation event reads `style-src-attr`, blocked `inline`, line 7, with an empty sample.
  - Every `<style>` element and stylesheet on the page still applied, with the same rule counts as in Chrome.
  - Chrome and Firefox report nothing, and the site sets no `style` attributes.
  - The same message on `/` during the crawl came from Playwright's screenshot styling and didn't recur without screenshots.
- **Why it matters:** it's probably the engine's own `<select>` internals, and there's no visible effect. A look in real Safari settles it.
- **Fix:** after launch, open `/contact/` in Safari's Web Inspector. If it's the same engine-internal report, note it and move on. Don't loosen the CSP for it.
- **Impact:** Low · **Effort:** S · **Verified** (the report) · **Inferred** (the cause)

### SEO

**In good shape (verified)**
- **Titles and headings:** titles are 22–58 characters; descriptions are unique and 140–159 characters; one H1 per page.
- **Canonicals and indexing:**
  - canonical URLs are absolute, built from `site.url`;
  - there's a sitemap, a robots.txt and an `llms.txt`;
  - the form results and the 404 are `noindex`, and the 404 returns status 404.
- **Structured data and links:** the JSON-LD graph passes the project's checker on 43 pages, and guides and case studies set `og:type` to `article`. Internal links are descriptive (related services, breadcrumbs, footer).
- **Lighthouse:** SEO scores 100 on all 14 indexable pages. The four `noindex` pages score 66 only because of `is-crawlable`, which is by design.
- **hreflang:** not needed, since the site is Romanian only.

#### SEO-01 · Social previews are plain light cards
- **Where:** `src/pages/og/[...cale].png.ts` (for example, `og/index.png` in the build).
- **Problem:** the preview is a white 1200×630 card with the logo line, the title and one blue line. It lacks the site's signature dark band.
- **Why it matters:** links get shared on WhatsApp (a published contact channel) and on LinkedIn, and for a web designer a recognisable preview is part of the pitch.
- **Fix:** draw the band in the OG template: a dark background, the page's line highlighted, and the title on the white "station sign", reusing the MetroMap geometry.
- **Impact:** Low · **Effort:** S–M · **Verified**

#### SEO-02 · Only an SVG favicon
- **Where:** `src/layouts/Base.astro:66`; `public/` holds only `favicon.svg` and `_headers`.
- **Problem:** there's no `apple-touch-icon` (used for iOS home-screen icons and some share sheets) and no PNG fallback for tools that don't read SVG.
- **Fix:** add `apple-touch-icon.png` (180×180) and a 48×48 or 96×96 PNG icon, and keep the SVG as the main one.
- **Impact:** Low · **Effort:** S · **Verified** (the files) · **Inferred** (who needs them)

#### SEO-03 · The `workers.dev` copy stays enabled
- **Where:** `wrangler.jsonc` sets neither `workers_dev` nor `preview_urls`.
- **Problem:** after the domain goes live, a second copy of the site stays up at `*.workers.dev`. It's `noindex` (`public/_headers`), and its form can't send.
- **Fix:** set `"workers_dev": false` and `"preview_urls": false` once the custom domain is bound.
- **Impact:** Low · **Effort:** S · **Verified** · **First raised:** 2026-10-22 audit, P5.

### Performance

In good shape, with no recommendations. These are lab numbers, verified on a local server without CDN compression:
- **Lighthouse 13.5, mobile, median of 3:** Performance 100 on all 18 pages. FCP 0.76–0.92 s, LCP 1.36–1.37 s, TBT 0 ms, CLS 0, and 61–65 KiB per page.
- **Desktop (5 pages):** LCP 0.34–0.35 s.
- **Assets:**
  - one script on pages with a band, and none on the legal and form-result pages;
  - 10.6 KB of CSS plus small inline blocks;
  - two woff2 fonts (19 KB and 34 KB);
  - `/_astro/*` cached as immutable.

After launch, check the field data in Search Console.

### Code health

This section covers only what affects the areas above. Having no CI is the owner's documented choice; `npm run deploy` runs the tests, which limits the risk.

#### CODE-01 · The new colours are literals, and tests pin the source text
- **Where:** 22 occurrences of #0E1116, #E8ECF2, #D9E4F7, #A7B0BE and #2A313C across 7 files: `Header.astro`, `Indemn.astro`, `PageFacts.astro`, `RouteMap.astro`, `cum-lucrez.astro`, `index.astro` and `metro.css`. The tests assert the CSS text (`tests/unit/cum-lucrez.test.ts:33`, `tests/unit/contrast.test.ts:62-63`).
- **Why it matters:** the next palette change (UI-01, SEO-01) means touching seven files, and moving a literal into a token fails tests that check strings rather than the rendered colour.
- **Fix:** move the colours to tokens in `tokens.css`, update the spec's colour table, and have the tests check the computed colour or contrast.
- **Impact:** Low · **Effort:** M · **Verified** · **First raised:** 2026-10-23 review, F13/D8.

#### CODE-02 · `.serviciu-card` duplicates `.carte`
- **Where:** `src/pages/servicii/index.astro:165-176`, compared with `src/styles/base.css:169-184`.
- **Problem:** it repeats the same background, border and padding (1.5rem, then 2rem from 48rem) and adds a left bar. It lacks `.carte > :last-child { margin-bottom: 0 }`, so the two card styles have already drifted.
- **Fix:** use `class="carte serviciu-card"`, and keep only the left bar in `.serviciu-card`.
- **Impact:** Low · **Effort:** S · **Verified**

#### CODE-03 · A deploy from this machine would build on Node 26
- **Where:** `package.json:6-7` (`>=24 <25`) and `.node-version` (24). This machine runs Node 26.5.0, and nothing sets `engine-strict`.
- **Why it matters:** `npm run deploy` builds locally, so production would come from a runtime the project doesn't target.
- **Fix:** D11: (a) Node 24 through fnm or Volta, plus `engine-strict=true` in `.npmrc`; (b) move `engines` to 26.
- **Impact:** Low · **Effort:** S · **Verified** · **First raised:** 2026-10-23 review, F16/D11.

#### CODE-04 · Case-study screenshots bypass `astro:assets` (latent)
- **Where:** `src/layouts/CaseStudy.astro:132`.
- **Why it matters:** when the #7 and #8 screenshots arrive, they would ship without dimensions or optimisation, on exactly the pages that UX-01 depends on.
- **Fix:** use `image()` in the content schema and `<Image>` in the layout.
- **Impact:** Low · **Effort:** S · **Inferred** · **First raised:** 2026-10-23 review, F10/D9.

#### CODE-05 · A merged design is still marked "proposed"
- **Where:** `docs/superpowers/specs/2026-10-23-layered-surfaces-design.md:3` reads „Stare: propus pentru revizuire”.
- **Fix:** mark it as approved, with the date.
- **Impact:** Low · **Effort:** S · **Verified** · **First raised:** 2026-10-23 review, F15.

## 4. Quick wins

High- or medium-impact items with small effort:
- **UX-02:** a "why me" line or card on Acasă, built from facts already on the site.
- **UX-01, first step:** approve the szitrans and shop case studies as soon as their texts are ready.
- **UX-03:** one line on cost and commitment under the hero CTA and next to the form button (owner input: is the evaluation free?).
- **UX-04 (a):** a subtitle that names websites and says „din toată țara”.
- **UX-05:** a response time (#18) and the reply address on the thank-you page.
- **FN-02 (b):** the Gmail display name, and the reply address on the thank-you page.
- **FN-01 (a):** put the monthly test send in a calendar today.
- **UX-06:** explain or drop „reducerea”.
- **UI-02:** make each whole card on `/servicii/` clickable.

## 5. Larger opportunities

1. **A full proof section.** Publish `/proiecte/` and the three studies, and add Proiecte to the menu (UX-01).
   - For: it closes the biggest gap.
   - Against: it needs the owner's time and verifiable results (#10), and a longer menu makes the phone header taller (UI-01).
2. **"Acest site" as a live case study.** Production Lighthouse and axe numbers, no cookies, and how the site is built: proof of exactly what's being sold.
   - For: it needs no client's consent.
   - Against: it depends on measuring after launch, and the numbers have to stay true (#11).
3. **The two drafted guides.** Content aimed at Google and at AI answers, which the service pages can link to.
   - Against: approval and upkeep, and another menu item (UI-01).
4. **A Google Business Profile with real reviews** (spec §13). Local trust, and visibility in Maps for „consultant SEO București”.
   - Against: off-site work, and reviews can only come from real clients.
5. **A mailbox on the domain, with the form moved to Resend** (FN-02).
   - For: replies come from the brand's own address.
   - Against: a monthly cost, an MX change, and a privacy-policy update (Alex's text).
6. **Price guidance**, such as ranges or what drives the price.
   - For: it pre-qualifies leads and lowers the barrier to asking.
   - Against: it contradicts the site's deliberate „Afișezi prețuri? Nu.”, anchors expectations, and needs upkeep.

   This is the owner's decision; no recommendation either way.
7. **A heartbeat for the form** (FN-01, option c).
   - For: silence becomes visible.
   - Against: a Cron Trigger to maintain, and one e-mail a week.

## 6. Assumptions and open questions

**Assumptions**
- The target clients are small firms and PFAs across Romania, whose owners aren't specialists (decision 8, and the FAQ „Cu cine lucrezi?”).
- SEO is the lead offer and websites the second line (keyword decisions 12 and 13, logo decision 19).
- Many prospects land on a service page from Google rather than on Acasă.

**Open questions for the owner**
1. **Branding:** the brief mentions it, but the site offers no branding service. If you offer it, it needs a page and a place among the lines; if you don't, there's nothing to do.
2. Are the evaluation and the quote free? (UX-03)
3. What response time can you commit to (#18)? (UX-05)
4. Will replies come from Gmail, or from a mailbox on the domain? (FN-02)
5. Positioning: keep "consultant SEO", or say "SEO și web design"? (UX-04)
6. Would your clients rather call or use WhatsApp than write? If so, a phone link in the header (on desktop) or under the hero CTA may bring more requests. The single-CTA header is deliberate, so this is a choice, not a defect.
7. When will the case-study texts (#8, #21), the szitrans results (#7, #10) and a photo (#6) be ready? They are the biggest lever in this report.
8. Launch is still blocked, by design, until these are done:
   - the PFA data (#1), the address (#2) and the domain (#3);
   - data retention (#17) and the DPF check date (#22);
   - the approval of every page.
9. Before launch, take one look on a real iPhone: the fonts, the `<select>`, and the CSP note in FN-04.

## 7. Applied fixes (2026-10-24)

The findings that need no data or decision from Alex are fixed in `f71fc5e` on `feat/site`. It was first committed as `9bc6ca8`, which `backup/feat-site-local-2026-10-24` keeps, and rebased onto PR #3 with the same changes. Three more items were settled by other commits of the day.

| Finding | Status | What changed | Verified by |
|---|---|---|---|
| UI-02 · Only the title is clickable on `/servicii/` | Fixed (`f71fc5e`) | The whole card leads to the service, as the rows on Acasă do: the title link's `::after` covers the card (`src/pages/servicii/index.astro:190-194`). Because that layer belongs to the link, hovering the card thickens the service name's underline (`a:hover`, `src/styles/base.css:116`). The card keeps one accessible name. | `tests/e2e/suprafete.spec.ts`: a click on the card's paragraph opens the service, and hovering it thickens the underline |
| CODE-02 · `.serviciu-card` duplicates `.carte` | Fixed (`f71fc5e`) | The card is `carte serviciu-card`. `.serviciu-card` keeps only its position and the 4 px line bar. | `tests/unit/servicii-index.test.ts:73` |
| CODE-01 · Colour literals, tests pinned to source text | Fixed (`f71fc5e`) | Five tokens in `src/styles/tokens.css:27-32`: `--albastru-benzi`, `--noapte`, `--noapte-text`, `--noapte-text-2` and `--noapte-contur`. They replace the 22 literals in 7 files, and none of those literals is left outside `tokens.css`. The spec's colour table (§5.2) lists them. | `tests/unit/contrast.test.ts` (contrast on the tokens); `tests/e2e/culori.spec.ts` (the computed colour in the browser); page screenshots unchanged |
| CODE-04 · Case-study screenshots bypass `astro:assets` | Fixed (`f71fc5e`) | `capturi[]` uses `image()` (`src/content.config.ts:68`), and `src/layouts/CaseStudy.astro:134` renders `<Image>`, with width, height and WebP. | `tests/unit/content-config.test.ts`, `case-study.test.ts` |
| SEO-02 · Only an SVG favicon | Fixed (`f71fc5e`) | `/favicon-96.png` and `/apple-touch-icon.png` (180×180, on the header's background) are drawn at build time from `favicon.svg` (`src/lib/iconite.ts`) and linked in `src/layouts/Base.astro:67-69`. The SVG stays the main icon. | `tests/unit/iconite.test.ts`, `shell.test.ts`; `tests/e2e/home.spec.ts` |
| FN-03 · A double click can send twice | Fixed with JavaScript (`b4d48e1`, PR #3, decision 30) | With JavaScript on, the form is sent from the page, and a second click while the request is under way sends nothing (`initFormular` in `src/client/contact-form.ts`). Without JavaScript the plain POST can still go twice, which is option (a). | `tests/e2e/contact.spec.ts:171` |
| The trains button off the type scale (UI section) | Fixed (`0a1c06e`) | It now uses `--text-sm` (design audit, D-07). | `tests/e2e/tipografie.spec.ts` |
| SEO-01 · Social previews are plain light cards | Fixed (`f02e59f`, PR #4), approved by Alex on 2026-10-24 | The preview images repeat the dark band: a `--noapte` background, the logo as on the dark header, the metro map, and the page title on the white station plaque of the Acasă H1. On pages with their own line, that line is drawn in full and the others at 0.35 opacity; elsewhere all four are in full. The map's geometry moved to `src/lib/harta.ts`, which both `MetroMap.astro` and `src/lib/og.ts` draw from. Spec §5.9 describes the image. | `tests/unit/og.test.ts`: colours from `tokens.css` and `metro.css`, each page's line read from the image's pixels, the title on the plaque, ș and ț |

**Changed in part**
- **UI-01:** since `b757633`, the header has no „Cere o ofertă” button on `/contact/` and the form-result pages. This was done for another reason: without JavaScript, the button on the error pages would open an empty form instead of Back. On every other inner page the header and band are as measured, and decision 28 stands.
- **UX-09:** still open. Since decision 30 the form already has a script, so option (b) no longer goes against a no-JavaScript rule. It still adds code, and the choice stays the owner's.

**Still open, each waiting on the owner or on the launch**

| Finding | Waits on |
|---|---|
| UX-01 · No proof of work | The case-study texts and approvals: #6, #7, #8, #10, #19, #20 and #21 (question 7) |
| UX-02 · No "why me" on Acasă | Alex's copy and his approval of Acasă |
| UX-03 · Cost and commitment of a request | Question 2: are the evaluation and the quote free? |
| UX-04 · First screen says only SEO and București | Question 5: positioning |
| UX-05 · No reply time or address after sending | Question 3 (#18) and question 4 |
| UX-06 · „reducerea” unexplained | Alex's copy (`src/pages/index.astro:41` is unchanged) |
| UX-07 · Six „eu, Alex Ionescu” openings | Alex's copy: a `rezumat` per service |
| UX-08 · Jargon | Alex's copy |
| UI-01 · Tall header and band on phones | Decision 28. The design audit's D-02 asks the same question. |
| UI-03 · Same colours, two meanings | The owner's call |
| A11Y-01 · Stopping the trains isn't remembered | D7, decided. It's settled if D-02 makes the inner pages static. |
| FN-01 · No signal when the form stops delivering | D3. Option (a) needs only a calendar entry. |
| FN-02 · Replies from Gmail | Question 4 |
| FN-04 · WebKit CSP report on `/contact/` | A look in real Safari, after launch |
| SEO-03 · The `workers.dev` copy | Binding the custom domain |
| CODE-03 · Node 26 on this machine | D11 (this machine still runs Node 26.5.0, and there's no `.npmrc`) |
| CODE-05 · Layered-surfaces design marked "proposed" | Alex's confirmation of its §7 defaults, which the document says happens at its review |

**Checked again on `0a1c06e` (2026-10-24):**
- `npm run verify` passes: `astro check` reports 0 errors, 670 unit tests and 89 Worker tests pass, the build and the cedilla and glyph checks are clean, and 20 links are scanned.
- The Chrome end-to-end suite: 86 passed and 4 skipped. The skipped ones are the `qa:page` tests, which run only with `QA_PATH`.
