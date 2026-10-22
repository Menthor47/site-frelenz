# Full Spectrum Audit: siteulet (feat/site vs main, PR #1)

**Date**: 2026-10-22
**Mode**: Branch vs Main
**Source**: `feat/site` vs `main` ([PR #1](https://github.com/Menthor47/siteulet/pull/1)), 44 commits, 163 files, +22,050 lines
**Lenses Run**: 10/10
**Lenses Skipped**: none
**How it was run**: the parallel multi-agent run (one agent per lens plus skeptic verifiers) stopped when every agent hit the account's session usage limit, before any of them returned. All ten lenses were then run in sequence in the main session, each against its own skill checklist. Each finding below was checked against the code or a command before it was kept: file reads, `grep`, `npm audit`, the built `dist/sitemap-0.xml`, and Cloudflare's `_headers` documentation. Two suspected issues were dropped after checking (see "Refuted Findings").

**Baseline at audit time:** `npx astro check` 0 errors · 593 unit tests and 76 Worker tests pass · `npm run build` and `npm run preview:draft` exit 0 · `npm run check` and `npm run check:links` clean · `npm audit --omit=dev` 0 vulnerabilities · `check:launch` refuses launch on purpose (placeholder domain, PFA data, retention, DPF date, unapproved pages).

---

## Master Verdict: APPROVE WITH CHANGES

The code is in good shape. It is strictly typed, fails at build time on bad content, has no production dependency vulnerabilities, scores Lighthouse 100, and gates launch behind tests and approvals that already work. One item must happen before launch, and it is procedural rather than a code bug. The contact form, which is the site's only conversion path, keeps no logs by design, so a broken Email Routing setup would lose leads silently; launch needs a documented end-to-end test submission in production. The remaining findings concern verification that exists but only runs by hand (no CI, deploy skips the tests, only Chromium is tested), a cross-site POST guard on the Worker, and duplicated "service group → colour" knowledge.

## Verdict by Lens

| # | Lens | Verdict | Critical | Recommendations |
|---|------|---------|----------|-----------------|
| 1 | Design Engineer | APPROVE WITH CHANGES | 0 | 1 |
| 2 | UX Engineer | APPROVE | 0 | 1 |
| 3 | Frontend Engineer | APPROVE | 0 | 0 |
| 4 | Backend Engineer (Worker + Cloudflare config) | APPROVE WITH CHANGES | 0 | 2 |
| 5 | Structural Engineer | APPROVE WITH CHANGES | 0 | 1 |
| 6 | Repo Maintainer | APPROVE WITH CHANGES | 0 | 3 |
| 7 | Production Readiness | APPROVE WITH CHANGES | 1 | 3 |
| 8 | DX Engineer | APPROVE WITH CHANGES | 0 | 1 |
| 9 | Performance Engineer | APPROVE | 0 | 0 |
| 10 | Accessibility Engineer | APPROVE | 0 | 0 |

## All Critical Issues (Must Fix)

| # | Issue | Lens(es) | File(s) | Impact | Fix |
|---|-------|----------|---------|--------|-----|
| 1 | No end-to-end production check of the contact form, and failures leave no trace. The Worker catches every error and redirects to `/contact/eroare/` without logging (by design). The README launch steps check headers and HTML but never submit the form. | Production Readiness, Backend, DX | `worker/index.ts:51-53`, `wrangler.jsonc:15`, `README.md:49-62` | If Email Routing is misconfigured or broken later (an unverified destination, MX changed for a mailbox, a DNS edit), every quote request fails. Visitors see the error page, and Alex has no signal that leads are being lost. | Add a step to the README launch list right after step 10: "Send a test request from the live form and confirm it reaches Gmail, with Reply-To set to the address you typed." Repeat it after any DNS, MX or Email Routing change, and monthly. Optional extra in the Worker: log the error class only (no form data) when a `DEBUG_FORM` variable is set for `wrangler dev`. |

## Cross-Cutting Concerns

| Concern | Flagged By | Root Cause | Unified Fix |
|---------|-----------|------------|-------------|
| Form failures are invisible | Production Readiness (P1), Backend (B1), DX (X3) | Logging was dropped for privacy (correct), and nothing replaced it as a signal | A production test submission at launch and after mail/DNS changes (README). Opt-in error-type logging only under `wrangler dev`. |
| Verification exists but only runs by hand | Repo Maintainer (R1), Production Readiness (P2, P4) | No CI, `deploy` skips the tests, and Playwright runs Chromium only | Add a GitHub Actions workflow (astro check, unit, worker, build, check, links). Make `deploy` run `test:unit` and `test:worker`. Add Firefox and WebKit projects for `home.spec.ts` (the trains). |
| Service and group knowledge repeated across files | Design (D1), Structural (S1), Frontend (F3), Repo (R7) | The group-to-colour mapping and the slug-to-name lookup were copied into each component | Define a global `[data-grup]` rule once with `--culoare` and `--culoare-text`, plus a `--blue-light` token. Export one `serviciu(slug)` helper from `src/form-rules.ts` that throws on an unknown slug. |

## All Recommendations

| # | Recommendation | Lens | File(s) | Fix |
|---|---------------|------|---------|-----|
| 1 | Add CI. PR #1 currently shows zero checks. | Repo Maintainer, Production Readiness | `.github/` (missing) | Add a workflow on push and PR: `npx astro check`, `npm run test:unit`, `npm run test:worker`, `npm run build`, `npm run check`, `npm run check:links`. Run e2e in a second job. |
| 2 | `npm run deploy` does not run the test suites | Production Readiness | `package.json:21` | `"deploy": "npm run test:unit && npm run test:worker && npm run build && npm run check && npm run check:launch && wrangler deploy"` |
| 3 | The trains were tested only in Chrome, while the spec requires Chrome, Safari and Firefox | Production Readiness | `src/client/trains.ts:7-8`, spec §5.6 (line 549), `playwright.config.ts` (no `projects`) | Add Playwright `projects` for chromium, firefox and webkit, and run `home.spec.ts` on all three before launch. |
| 4 | No rollback instructions | Production Readiness | `README.md` | Document `npx wrangler deployments list` and `npx wrangler rollback [version-id]`. |
| 5 | The Worker accepts cross-site POSTs | Backend | `worker/index.ts:45-53` | Before parsing, return 303 to `/contact/eroare/` without sending when `Sec-Fetch-Site` is `cross-site`, or when an `Origin` header doesn't match `url.origin`. Add Worker tests for both. |
| 6 | Errors are invisible during local development as well | Backend, DX | `worker/index.ts:52` | When `env.DEBUG_FORM === '1'` (set only in `.dev.vars`), `console.error` the error's name and message, never the form data. |
| 7 | The group-to-colour mapping is duplicated, and the footer's light blue is a raw hex | Design, Structural | `Footer.astro:154-168`, `LineDiagram.astro:51-65`, `Service.astro:121-139`, `servicii/index.astro:86-100`, `Footer.astro:155` | Global `[data-grup='…']` rules in `src/styles/tokens.css`. Add `--blue-light: #6B9BF0` (spec §4, footer). |
| 8 | `.gitattributes` is missing, so every commit on Windows warns about LF→CRLF | Repo Maintainer | repo root | `* text=auto eol=lf`, then `git add --renormalize .` |
| 9 | Vulnerable dev dependencies (wrangler 4.148.0 → miniflare → sharp: high; fflate: moderate) | Repo Maintainer | `package.json:44` | `npm i -D wrangler@4.152.0 && npm audit fix`. Production dependencies have 0 vulnerabilities. |
| 10 | No one-command local run of the site plus the Worker | DX | `package.json:9-23` | `"preview": "npm run build && wrangler dev"`. Also add `"preview:draft:serve"` for the draft preview command the README spells out. |
| 11 | Despre names szitrans.eu but never links to its case study | UX | `src/pages/despre.astro:25` | When `proiectPublicabil(szitrans)` is true, render the name as a link to `/proiecte/szitrans/`. |

---

# Lens Reports

---

## 1. Design Engineer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
The whole visual layer: a token sheet (`tokens.css`), base typography and focus styles, a light-only theme, the metro-map signature (static and animated), the service "line" diagram, the two route maps, and the CTA button. Placement is component-scoped, and the colour comes from `data-grup` / `data-linie` attributes because the CSP forbids `style=`.

### Files Reviewed
| File | Visual Role | Risk |
|------|-------------|------|
| `src/styles/tokens.css` | Colour and type tokens (hex from spec §5.2) | Low |
| `src/styles/base.css` | Reset, type scale, links, focus ring (C40), container | Low |
| `src/styles/butoane.css` | `.buton-cta` | Low |
| `src/styles/metro.css`, `src/components/MetroMap.astro` | Signature map, trains, "Ești aici" | Medium (animation) |
| `src/components/LineDiagram.astro`, `RouteMap.astro` | Group colours, stations, loop | Medium (colour mapping) |
| `src/components/Footer.astro`, `Header.astro` | Dark footer, nav states | Low |
| `src/layouts/Service.astro`, `src/pages/servicii/index.astro` | Group colour per service | Medium (duplication) |
| `src/styles/transitions.css` | Cross-document view transition (M3) | Low |

### Critical Issues (Must Fix)
None.

### Recommendations
| # | Issue | File(s) | Why | Fix |
|---|-------|---------|-----|-----|
| D1 | The group-to-colour mapping (`[data-grup='vizibilitate'] { --culoare: … }`) is repeated in four components, each with its own `-dark` choices. The footer's light blue is a raw `#6b9bf0`. | `Footer.astro:154-168` (hex at :155), `LineDiagram.astro:51-65`, `Service.astro:121-139`, `servicii/index.astro:86-100` | Changing a group's colour (or adding a fifth group) means editing four places, and the rules for "graphic vs text variant" (`--yellow-dark` for construction) could drift apart. The footer blue is the only colour outside the token sheet. | Define once in `tokens.css`: `[data-grup='constructie'] { --culoare: var(--yellow-dark); --culoare-text: var(--yellow-dark); }` and so on, plus `--blue-light: #6B9BF0`. Components keep only what differs (the footer uses the bright line colours on `--ink`). |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| D2 | Tighten the header at 320–390px: the six nav links wrap to two rows under the logo, plus the CTA row | About 190px of chrome before content on a phone (screenshot `reports/screens/despre-390x844.png`). A smaller nav gap or font size at `<380px` would recover a row. A hamburger menu isn't needed and would add JS. |
| D3 | Give the submit button `.buton-cta` an `:active` state (for example `translateY(1px)`) | It's the only state missing from the button family. Hover and focus are already covered. |

### Design System Compliance
The tokens are used consistently. Every colour except one comes from `tokens.css`, and the type scale, gutters and container are tokens too. Corners are square everywhere except stations, as specified. Contrast pairs are documented next to each use (for example "galben 9,72:1"). The fragmentation risk is the duplicated group mapping (D1), not raw colours.

### Visual State Coverage
| Component/Element | Hover | Focus | Active | Disabled | Loading | Empty | Error | Dark Mode |
|-------------------|-------|-------|--------|----------|---------|-------|-------|-----------|
| `.buton-cta` (links and submit) | ✅ darker blue + underline | ✅ global C40 ring | ⚠️ none (D3) | n/a | n/a (no JS, browser loading) | n/a | n/a | n/a (light only, spec §5.1) |
| Nav links | ✅ underline | ✅ | — | n/a | n/a | n/a | n/a | n/a |
| "Oprește trenurile" button | ✅ underline | ✅ | — | n/a | hidden until script runs ✅ | n/a | n/a | n/a |
| Form fields | — | ✅ global ring | — | n/a | n/a | placeholder-free labels ✅ | native validation + error pages ✅ | n/a |
| Footer links on `--ink` | default underline | ✅ (white halo visible on ink) | — | n/a | n/a | n/a | n/a | n/a |
| Placeholder `.marcaj` | n/a | n/a | n/a | n/a | n/a | DRAFT only ✅ | n/a | n/a |

### Verdict Details
- Design Token Fidelity: CONCERNS (D1; minor)
- Visual State Coverage: PASS
- Dark Mode Parity: PASS. Light-only is a spec decision (§5.1), enforced by `color-scheme: light` and covered by `tests/e2e/dark-mode.spec.ts`.
- Animation Quality: PASS. Only `stroke-dashoffset`, `opacity` and motion paths are animated, all inside `prefers-reduced-motion: no-preference`. The line draw takes 600ms per spec §5.7.
- Visual Consistency: PASS

---

## 2. UX Engineer

**Verdict**: APPROVE

### Plan Summary
A visitor lands on Acasă and sees within 3 seconds what Alex does and where to ask for a quote. They find a service through "De unde pornești?", read the service page, and request a quote through a form that works without JavaScript and lands on a thank-you page or an error page.

### User Journey Map
1. **Trigger**: a search result or shared link lands on Acasă or a service page. OK: the H1 says "Consultant SEO din București", and the CTA sits right below it.
2. **Orientation**: header nav with Servicii, Cum lucrez, Despre and Contact; breadcrumbs on every inner page; "Ești aici" on the map. OK.
3. **Find a service**: "De unde pornești?" lists problems, each linking to a service. OK: the copy matches the user's mental model (problem first, service second).
4. **Evaluate**: the service page goes from direct answer to "Pentru cine e", "Ce primești", steps and FAQ, then related services. OK.
5. **Act**: "Cere o ofertă" leads to /contact/, with required fields labelled "(obligatoriu)" and the link limit stated under Mesaj. OK.
6. **Submit**: POST, then a 303 redirect. **Success** goes to /contact/multumim/, which says what happens next. OK. **Too many links** goes to its own page that says how to recover (the Back button). OK. **Rate limit or failure** goes to /contact/eroare/ with direct contacts. OK.
7. **Recovery after an error**: Back restores the form in most browsers. WARN: this is browser-dependent, and it's an accepted risk in spec §14.
8. **Dead ends**: 404 offers Acasă, Servicii and Contact. OK.

### Critical Issues (Must Fix)
None.

### Recommendations
| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| U1 | Despre's "Experiență" names szitrans.eu (consent given on 2026-10-22), but there's no path to its case study once that page is published | A reader interested in proof stops at a name with nowhere to click | In `despre.astro`, link the name when `proiectPublicabil` is true for `szitrans` (the page only builds once Alex approves it). |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| U2 | A double-click on "Trimite cererea" sends two identical emails (no JS, rate limit 3/min) | Harmless, but the success page could say "Dacă ai apăsat de două ori, îmi vor ajunge două mesaje, e în regulă." Or accept the risk as is. |
| U3 | Mobile header height | See D2. |

### Interaction Consistency Check
Consistent throughout: one primary CTA per page, the same "Spune-mi ce site ai și ce te încurcă." band, square controls, underlined links, and 44px targets. "Contact" in the nav and "Cere o ofertă" both go to /contact/; this is intentional (and the header CTA is hidden on /contact/).

### Verdict Details
- Discoverability: PASS
- Flow Completeness: PASS
- Error Recovery: PASS (the Back-button restoration risk is documented and accepted)
- Feedback & Status: PASS
- Consistency: PASS

---

## 3. Frontend Engineer

**Verdict**: APPROVE

### Plan Summary
Astro 7 static pages with no client framework. TypeScript is set to `strictest`, content collections are validated by zod, and slugs are cross-checked against `src/form-rules.ts` at build time. Client JS consists of two small inline modules: trains on Acasă, and the page-facts card on /proiecte/acest-site/.

### Files Reviewed
| File | Frontend Role | Risk |
|------|--------------|------|
| `src/content.config.ts` | zod schemas, slug refinement | Low |
| `src/layouts/*.astro`, `src/pages/**` | Build-time rendering | Low |
| `src/client/trains.ts`, `src/lib/trains-controller.ts` | Animation control (pure controller, tested) | Low |
| `src/client/page-facts.ts` | Resource Timing measurements | Low |
| `src/lib/jsonld.ts`, `routes.ts`, `publish.ts`, `marker.ts` | Pure logic | Low |

### Critical Issues (Must Fix)
None.

### Recommendations
None.

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| F1 | `trains.ts:17` reads `prefers-reduced-motion` once at init. Listen for `change` and pause the trains if it flips. | Rare, but the OS setting can change mid-visit. The stop button already covers the user's choice. |
| F2 | Remove the orphan JSDoc in `src/lib/jsonld.ts:16` (a comment with no declaration after it, left from moving `areValoare` to `marker.ts`) | Dead comment. |
| F3 | `SERVICII.find(...)` appears 10 times across `src/` and `worker/`, each with its own fallback or throw | One `serviciu(slug)` helper in `form-rules.ts` gives one behaviour (throw at build). See S1. |

### Render Path Analysis
All rendering happens at build time (`output: 'static'`). `Base.astro` calls `getCollection` for proiecte and ghiduri on every page; Astro caches collections, so the cost is negligible. At runtime the only DOM work is: (1) `initTrains`, which runs once and adds one IntersectionObserver plus one click listener (no teardown needed on an MPA, since each navigation is a new document); (2) `completeazaFisa`, which runs once after `load` in idle time. Nothing re-renders.

### Type Safety Assessment
Strict end to end. Collection data comes from `z.infer` via `CollectionEntry`. Props use `InferGetStaticPropsType`. There is no `any`, no `@ts-ignore`, and no `eslint-disable` (confirmed with grep). The deliberate casts are `as unknown as Parameters<typeof satori>[0]` (`og.ts:79`) and the narrowing in `graf()` (`jsonld.ts:268-270`), both local and justified. `exactOptionalPropertyTypes` is respected (`publish.ts:10-11`).

### Verdict Details
- Component Architecture: PASS
- State Management: PASS (no client state beyond the trains controller)
- Type Safety: PASS
- Rendering Performance: PASS
- Bundle Impact: PASS (no shipped framework; `dist/` has no standalone JS files because the scripts are inlined with CSP hashes)

---

## 4. Backend Engineer

**Verdict**: APPROVE WITH CHANGES

*Here "backend" means the Cloudflare Worker (`worker/`), its configuration (`wrangler.jsonc`, `public/_headers`) and the build-time scripts.*

### Plan Summary
A 55-line Worker accepts only `POST /api/contact`. It validates with the shared rules, rate-limits per IP and sends one plain-text UTF-8 email through the Email Routing binding. Every outcome is a 303 redirect to a static page. It stores nothing and logs nothing.

### Files Reviewed
| File | Backend Role | Risk |
|------|-------------|------|
| `worker/index.ts` | Routing, order of checks, error catch-all | Medium |
| `worker/validate.ts` | Field rules, header-injection guard | Low |
| `worker/email.ts` | MIME build (RFC 2047 subject, base64 body, Reply-To) | Low |
| `worker/links.ts` | Link counter | Low |
| `wrangler.jsonc` | Assets, `send_email` allowlist, rate limiter, observability off | Low |
| `public/_headers` | Security headers, immutable `_astro`, workers.dev noindex | Low |
| `scripts/check-launch.mjs` | Launch gate (fails closed) | Low |

### Critical Issues (Must Fix)
None in the code. The silent-failure risk is carried as a Production Readiness critical (P1), because its fix is operational.

### Recommendations
| # | Issue | File(s) | Why | Fix |
|---|-------|---------|-----|-----|
| B1 | Every failure collapses to `/contact/eroare/` with no trace | `worker/index.ts:51-53` | Privacy rules out production logs (correct), but with no other signal a broken mail path goes unnoticed. | Production test submission (P1). For local debugging, `if (env.DEBUG_FORM === '1') console.error(e.name, e.message)` with no form data, and `DEBUG_FORM` set only in `.dev.vars`. |
| B2 | No cross-site request guard | `worker/index.ts:45-53` | Any website can auto-submit a hidden form to `/api/contact`. Each victim's IP gets its own rate-limit bucket, so distributed abuse can flood Alex's inbox (`form-action 'self'` only restricts Alex's own pages). | Before `formData()`: `const site = cerere.headers.get('sec-fetch-site'); const origin = cerere.headers.get('origin'); if (site === 'cross-site' \|\| (origin !== null && origin !== url.origin)) return spre('/contact/eroare/');`. Same-origin browser POSTs send a matching `Origin`. Add two Worker tests. |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| B3 | Reject bodies with `Content-Length` > 16 KB before `formData()` (`worker/index.ts:33`) | The largest valid form is about 4 KB. This caps parse cost, although the Workers CPU limit already bounds it. |
| B4 | The rate-limit key falls back to the shared `'necunoscut'` bucket (`worker/index.ts:36`) | `cf-connecting-ip` is always present in production; the fallback only matters in tests. Fine, but worth a comment. |
| B5 | The sender comes from the request host, `formular@${url.hostname}` (`worker/index.ts:41`) | The README documents that the form fails on workers.dev. Using `new URL(site.url).hostname` would make that explicit and immune to `www.`. |

### Error Path Analysis
- `cerere.formData()` throws on a non-form body or JSON. It's caught at `index.ts:52`, the visitor goes to /contact/eroare/, and nothing is recorded.
- The honeypot is filled: the visitor goes to /contact/multumim/, no email is sent, and no rate-limit slot is used (spec order §3.5).
- The rate limiter rejects: /contact/eroare/ ("încearcă din nou peste un minut", which matches).
- Too many links: /contact/prea-multe-linkuri/.
- Other invalid input (browser validation bypassed): /contact/eroare/.
- `env.EMAIL.send` throws (Email Routing down, destination unverified, sender domain without Email Routing): caught, /contact/eroare/. **The visitor still gets direct contacts, but the operator gets no signal (B1, P1).**
- Header injection: CR or LF in single-line fields is rejected (`validate.ts:26`). Reply-To uses `Mailbox` after `EMAIL_RE`.

### Resource Lifecycle Audit
| Resource | Allocated In | Cleaned Up In | Error Path Cleanup | Risk |
|----------|-------------|---------------|-------------------|------|
| Request body / FormData | `index.ts:33` | Request scope | n/a | Low (B3) |
| Rate-limit slot | `index.ts:36` | Expires after 60s (CF) | n/a | Low |
| EmailMessage | `email.ts:47-56` | Request scope | n/a | Low |
| Persistent data | none (no KV, D1 or logs) | — | — | None |

### Verdict Details
- Error Handling: CONCERNS (B1: correct for visitors, invisible to the operator)
- Concurrency Safety: PASS (stateless)
- Resource Management: PASS
- IPC Correctness: PASS (browser form ↔ Worker share `src/form-rules.ts`; 76 tests)
- File System Safety: PASS (n/a; the build scripts only read)

---

## 5. Structural Engineer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
A single repo with three layers: content (Markdown collections), the static site (Astro pages, layouts, components, libs) and the edge (Worker plus config). Shared, dependency-free leaf modules (`form-rules.ts`, `site.config.ts`, `placeholders.ts`) are the contracts between them, and the build scripts import those same leaves.

### Files Reviewed
| File | Structural Role | Layer | Risk |
|------|----------------|-------|------|
| `src/form-rules.ts` | Contract: services, groups, field rules | Shared leaf | Low |
| `src/site.config.ts` | Single source for domain, contacts, PFA | Shared leaf | Low |
| `src/lib/routes.ts` | Registry of built pages (OG, llms, approvals) | Site | Low |
| `src/lib/publish.ts`, `marker.ts`, `faq.ts` | Publishing and placeholder rules | Site | Low |
| `worker/*` | Edge | Edge | Low |
| `scripts/*.mjs` | Tooling, imports the leaves directly | Build | Low |

### Critical Issues (Must Fix)
None.

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| S1 | Knowledge about service groups is spread out. Group → colour lives in 4 component stylesheets plus `metro.css` (M1–M4) and `og.ts:22-27`; slug → name/group lookup is repeated 10× (`grep SERVICII.find`) | Adding or renaming a service or group means touching many files. Some lookups throw on unknown slugs and others silently fall back (`servicii/index.astro:29` uses `?? s.titlu`). | One `serviciu(slug)` helper in `form-rules.ts` (throws), and one CSS source for group colours (D1). `og.ts` keeps its own copy because satori can't read CSS; add a unit test that compares it with `tokens.css`. |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| S2 | `src/pages/[intern]/` uses a dynamic parameter to emit `/_test/*` and `/_intern/*`, since Astro skips `_`-prefixed folders | Clever and documented in each file. A line in the README's "Unde e fiecare lucru" would save the next reader a puzzle. |

### Dependency Map
```
content/*.md ──(zod, slug refine)──► content.config.ts ──► form-rules.ts (leaf)
                                                              ▲   ▲   ▲
pages/*.astro ─► layouts/*.astro ─► components/*.astro ──────┘   │   │
      │                │                                          │   │
      └──► lib/{routes,publish,marker,faq,jsonld,seo,og,llms} ───┤   │
                     │                     └──► site.config.ts (leaf)
                     └──► approvals.ts, placeholders.ts (leaves)   │
worker/{index,validate,email} ───────────────────────────────────┘ (form-rules only)
scripts/*.mjs ──► placeholders.ts, site.config.ts, check-dist-markers.mjs
```
No cycles. Dependencies point toward the leaves. The Worker depends only on `form-rules.ts`, not on Astro.

### Boundary Crossing Analysis
| Crossing | From -> To | Clean? | Notes |
|----------|-----------|--------|-------|
| Browser form ↔ Worker | `ContactForm.astro` → `worker/validate.ts` | ✅ | Both read `CAMPURI` from `form-rules.ts`. |
| Site → Worker config | `form-rules.ts DESTINATAR` ↔ `wrangler.jsonc send_email` | ✅ | Covered by a Worker test. |
| Build → launch gate | `routes.ts` → `dist/_intern/aprobari.json` → `check-launch.mjs` | ✅ | `.assetsignore` keeps the file off the CDN. |
| Node scripts → TS sources | `scripts/*.mjs` import `src/*.ts` | ✅ | Node 24 type stripping, so the leaves avoid TS-only syntax. |

### Verdict Details
- Dependency Direction: PASS
- Module Coupling: PASS
- Cohesion: PASS
- Layer Boundaries: PASS
- Change Propagation: CONCERNS (S1)

---

## 6. Repo Maintainer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
The full implementation: 44 conventional, Romanian commits, each feature followed by a fix commit after review. The code is uniformly formatted and heavily commented (in Romanian, with spec section references).

### Files Reviewed
| File | Convention Status | Risk |
|------|------------------|------|
| `src/**`, `worker/**`, `scripts/**` | Consistent naming (Romanian identifiers, kebab-case files, PascalCase components) | Low |
| `package.json` | Exact versions, scripts documented in the README | Medium (R3) |
| `.gitignore` | Covers dist, reports, node_modules | Low (R4) |
| repo root | No `.gitattributes`, no CI, no formatter config | Medium |

### Critical Issues (Must Fix)
None.

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| R1 | No CI: PR #1 shows 0 checks | 593 + 76 tests and the content gates only protect `main` if somebody remembers to run them | `.github/workflows/ci.yml` on push and PR (Node 24): `npm ci`, `npx astro check`, `npm run test:unit`, `npm run test:worker`, `npm run build`, `npm run check`, `npm run check:links`. Run e2e (Playwright and wrangler) as a separate job. |
| R2 | No `.gitattributes`, so every commit prints "LF will be replaced by CRLF" | Line-ending churn in diffs on Windows | Add `* text=auto eol=lf` and `*.png binary`, then `git add --renormalize .` |
| R3 | Dev dependencies have known vulnerabilities: `wrangler` 4.148.0 → miniflare → sharp (high, librsvg CVE-2026-96889) and fflate (moderate). `check:launch` already warns about this. | Dev-only, but `wrangler dev` runs on Alex's machine | `npm i -D wrangler@4.152.0`, then `npm audit`. Production dependencies: 0. |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| R4 | Ignore `.anchor/` and `research_notes/` | Both are untracked and show up in every `git status`. |
| R5 | Pick one type-import style: 18 × `import type {…}` vs 6 × `import { type X, … }` | Minor inconsistency. |
| R6 | Add a formatter config (Prettier plus `prettier-plugin-astro`) matching the current style | The style is consistent today by discipline only. |
| R7 | Orphan comment at `src/lib/jsonld.ts:16` | Dead text (F2). |

### Convention Compliance Checklist
| Convention | Status | Notes |
|-----------|--------|-------|
| File placement | ✅ | components/, layouts/, lib/, client/, pages/; Worker apart |
| Naming conventions | ✅ | Romanian identifiers throughout, consistent |
| Barrel exports | n/a | No barrels; direct imports (fine for Astro) |
| Import ordering | ✅ | Externals first, then local |
| Type imports separated | ⚠️ | Mixed styles (R5) |
| Path aliases used | n/a | Relative imports, consistent |
| No dead code left | ⚠️ | One orphan comment (R7) |
| Structured logging | ✅ | No `console.*` in `src/` or `worker/` |
| No lint suppressions | ✅ | No `@ts-ignore`, `eslint-disable` or `any` |
| CLAUDE.md present | ➖ | None; README plus spec plus plan cover it |

### Reuse Opportunities
`serviciu(slug)` in `form-rules.ts` would replace 10 ad-hoc `SERVICII.find` calls (S1). A single `[data-grup]` stylesheet would replace 4 copies (D1).

### Verdict Details
- File Organization: PASS
- Naming Consistency: PASS
- Import Hygiene: PASS (minor R5)
- Code Reuse: CONCERNS (S1/D1)
- Lint Compliance: PASS (no linter configured; `astro check` strict passes)

---

## 7. Production Readiness

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
Static assets plus one Worker on Cloudflare, mail through Email Routing to Gmail. Deploy runs `build`, `check`, `check:launch` and then `wrangler deploy`, after Alex says yes. Nothing is deployed yet.

### Files Reviewed
| File | Production Role | Risk |
|------|----------------|------|
| `wrangler.jsonc` | Assets, 404, send_email, rate limiter, observability off | Medium |
| `public/_headers` | HSTS, CSP (frame-ancestors etc.), cache, workers.dev noindex | Low |
| `package.json` (`deploy`) | Release pipeline | Medium |
| `scripts/check-launch.mjs` | Launch gate | Low |
| `README.md` (launch steps) | Runbook | Medium |

### Critical Issues (Must Fix)
| # | Issue | File(s) | Production Failure Mode | Fix |
|---|-------|---------|------------------------|-----|
| P1 | The form has no production verification step and no failure signal | `README.md:49-62`, `worker/index.ts:52`, `wrangler.jsonc:15` | Any Email Routing fault (destination not verified, MX replaced by a future mailbox, a DNS edit, a Cloudflare incident) turns every quote request into `/contact/eroare/`. With logs off by design, Alex finds out only if a visitor calls. | README step 10b: "Trimite o cerere de test din formularul live; verifică în Gmail subiectul, câmpurile și Reply-To." Repeat after every DNS, MX or Email Routing change, and monthly (put it in the calendar). |

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| P2 | `deploy` does not run tests (`package.json:21`) | A local edit can ship without the 669 tests | Prepend `npm run test:unit && npm run test:worker &&`. |
| P3 | No rollback runbook | A bad deploy needs a calm, documented undo | README: `npx wrangler deployments list`, then `npx wrangler rollback <version-id>`. Static assets roll back with the version. |
| P4 | Cross-browser trains are untested; spec §5.6 requires Chrome, Safari and Firefox (`trains.ts:7-8`) | SMIL `pauseAnimations` is the WCAG 2.2.2 stop control; if it broke in one engine, the stop button would fail there | Playwright `projects`: chromium, firefox, webkit; run `home.spec.ts` on all three before launch. |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| P5 | Set `"workers_dev": false` (and `"preview_urls": false`) once the custom domain is bound | The copy at `*.workers.dev` is already `noindex` (`_headers:16-17`, the documented Cloudflare pattern) and its form can't send mail. Turning it off removes a confusing duplicate. |

### Failure Mode Analysis
| Scenario | What Fails | User Impact | Recovery | Plan Handles It? |
|----------|-----------|-------------|----------|-------------------|
| Email Routing destination unverified or broken | `env.EMAIL.send` throws | Visitor sees /contact/eroare/ with direct contacts | Fix in Cloudflare | ⚠️ Visitor yes, operator no (P1) |
| Burst of submissions from one IP | Rate limiter | 4th request within 60s → error page ("peste un minut") | Automatic | ✅ |
| Bot fills the honeypot | — | Bot sees the thank-you page; no mail | n/a | ✅ |
| Distributed cross-site spam | Inbox flood | None for visitors | Manual | ⚠️ (B2) |
| Bad deploy | Site broken | All visitors | `wrangler rollback` | ⚠️ undocumented (P3) |
| Unapproved or placeholder content | Launch | None | `check:launch` refuses | ✅ |
| QA build (SITE_URL or localhost) deployed | Wrong canonicals | SEO | `check:launch` refuses | ✅ |
| Cloudflare challenge during attack | `cf_clearance` cookie | Brief check | Automatic | ✅ (cookie policy covers it) |

### Environment Checklist
| Concern | Dev | Prod | Gap? |
|---------|-----|------|------|
| File paths | `dist/`, `dist-draft/` | `dist/` uploaded, `_intern` ignored | No |
| Network | `wrangler dev` (local bindings) | Edge + Email Routing | Mail only testable in prod (P1) |
| Permissions | Local | `wrangler login` by Alex | No (documented) |
| Config | `SITE_URL` / `DRAFT` env for QA | `site.config.ts` domain | No (`check:launch` refuses QA env) |
| Build output | Inline scripts with CSP hashes | Same; README step 10 compares `<script>` counts | No |

### Verdict Details
- E2E Flow: CONCERNS (P1)
- Error Recovery: PASS for visitors
- Data Integrity: PASS (nothing stored)
- Environment Parity: PASS
- Observability: CONCERNS (P1, by privacy design)

---

## 8. DX Engineer

**Verdict**: APPROVE WITH CHANGES

### Plan Summary
The developer is Alex, working with an AI assistant. The tooling is npm scripts for build, preview, tests, page QA, the launch gate and reports, documented in a Romanian README. Errors from the gates are specific and actionable.

### Files Reviewed
| File | DX Role | Risk |
|------|---------|------|
| `package.json` scripts | Entry points | Low |
| `README.md` | Runbook and command table | Low |
| `scripts/check-launch.mjs`, `report-placeholders.mjs`, `qa-page.mjs` | Gate output | Low |
| `src/lib/marker.ts`, `content.config.ts` | Build-time error messages | Low |

### Critical Issues (Must Fix)
None.

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| X1 | No single command to run the real site with the form locally; `npm run dev` has no Worker, and the README hides `wrangler dev` inside the e2e description | Testing a form change means reconstructing the Playwright `webServer` command by hand | `"preview": "npm run build && wrangler dev"` and `"preview:draft:serve": "cross-env DRAFT=1 astro preview"`. Also an aggregate `"verify"` script (see X2). |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| X2 | Add `"test"` / `"verify"` running `astro check`, unit, worker, build, check and links | `npm test` currently fails with "Missing script". |
| X3 | Make the Worker's swallowed errors visible under `wrangler dev` only (B1) | Today a broken email build shows up locally only as "/contact/eroare/". |

### Error Message Audit
| Error Scenario | Current Message | What Developer Needs | Suggested Message |
|---------------|----------------|---------------------|-------------------|
| Unknown marker number | "Marcaj necunoscut: #N nu există în src/placeholders.ts" | ✅ what and where | — |
| Unknown service slug in content | zod: "„x” nu e un serviciu din src/form-rules.ts (seo, …)" | ✅ lists valid values | — |
| `check:launch` before build | "lipsește dist/_intern/aprobari.json: rulează întâi `npm run build`" | ✅ fix included | — |
| `check:launch` on a draft build | "dist/ e construit cu DRAFT=1; check:launch se rulează pe build-ul de producție" | ✅ | — |
| Launch refused | Numbered list of reasons (marker #, file, page) | ✅ | — |
| Form send failure (local) | Redirect to /contact/eroare/, nothing printed | Cause of the exception | Under `DEBUG_FORM`: "formular: trimiterea a eșuat: <Error.name>: <message>" |

### Developer Journey
- **First use**: `npm i`, then `npm run dev` works. `npm run preview:draft` builds, but viewing it needs a second command copied from the README (X1).
- **Daily**: edit content, `npm run test:unit`, `qa:page -- /x/`. Fast (unit tests take about 3s).
- **Release**: `check:launch` explains exactly what's missing, and `deploy` chains the gates (but not the tests, P2).

### Verdict Details
- Error Quality: PASS
- Defaults & Config: PASS
- Keyboard Experience: n/a
- Discoverability: CONCERNS (X1, minor)
- Workflow Integration: CONCERNS (no CI, R1)

---

## 9. Performance Engineer

**Verdict**: APPROVE

### Plan Summary
A static site with no framework, local fonts, inline module scripts on only two pages, and an animated SVG map on Acasă that pauses off-screen. It is short-lived per page (MPA), so there's no long-session accumulation.

### Files Reviewed
| File | Performance Role | Risk |
|------|-----------------|------|
| `astro.config.mjs` | Fonts (one variable woff2 per subset), `compressHTML` | Low |
| `public/_headers` | `/_astro/*` immutable caching | Low |
| `src/components/MetroMap.astro`, `metro.css`, `client/trains.ts` | SMIL animation and IntersectionObserver | Low |
| `src/components/PageFacts.astro` | Idle-time measurement | Low |

### Critical Issues (Must Fix)
None.

### Recommendations
None.

### Nice-to-Haves
None material. (On phones under 640px, the trains of the hidden lines M1/M4 keep ticking inside a `display:none` group. They aren't painted, so the cost is negligible.)

### Resource Budget
| Resource | Current | After Plan | Concern? |
|----------|---------|-----------|----------|
| Requests per action | Form: 1 POST plus 1 redirect | — | No |
| Event listeners added | Acasă: 1 click + 1 IntersectionObserver; acest-site: 1 `load` | — | No |
| Memory growth per hour | None (MPA, no client state) | — | No |
| Startup time impact | Lighthouse mobile 100; fonts preloaded (2 woff2, 53 KB total) | — | No |
| Bundle size impact | `dist/` 928 KB in total (mostly OG PNGs); HTML 19–29 KB uncompressed; no standalone JS files | — | No |

### Hot Path Analysis
The only recurring work is the trains' SMIL timeline while the map is on screen. It stops through `svg.pauseAnimations()` when the IntersectionObserver reports the map is off-screen, or when the visitor presses the button. Off-screen, nothing runs. HTML is served with Cloudflare's default `max-age=0, must-revalidate` plus ETag (fresh content, cheap revalidation), and hashed assets are immutable.

### Verdict Details
- Memory Management: PASS
- IPC Efficiency: PASS (n/a)
- I/O Patterns: PASS
- Startup Impact: PASS
- Long-Session Stability: PASS

---

## 10. Accessibility Engineer

**Verdict**: APPROVE

### Plan Summary
Targets WCAG 2.1 AA. There's a skip link, a two-tone focus ring (C40), 44px targets, labelled form fields with required state stated in the text, breadcrumbs with `aria-current`, a decorative SVG hidden from AT, a pause control for the moving trains, reduced-motion support, forced-colors fallbacks, and text zoom to 200% at 320px tested in e2e. axe runs inside `qa:page` on every checked page.

### Files Reviewed
| File | A11y Role | Risk |
|------|----------|------|
| `src/layouts/Base.astro`, `src/styles/base.css` | Skip link, landmarks, focus ring | Low |
| `src/components/Header.astro`, `Breadcrumbs.astro` | Navigation, current page | Low |
| `src/components/ContactForm.astro` | Labels, required, `aria-describedby`, honeypot | Low |
| `src/components/MetroMap.astro`, `client/trains.ts` | Moving content plus stop control | Medium |
| `src/components/LineDiagram.astro`, `RouteMap.astro` | Colour plus text, forced-colors | Low |

### Critical Issues (Must Fix)
None.

### Recommendations
None.

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| A1 | The trains button changes its text ("Oprește" ↔ "Pornește trenurile"), but some screen readers don't re-announce a focused button whose name changed | Add `aria-pressed` with a fixed label ("Trenuri în mișcare"), or keep the label swap and add a visually hidden `aria-live="polite"` status. |
| A2 | React to `prefers-reduced-motion` changing mid-visit (F1) | The OS setting can change without a reload. |

### Keyboard Navigation Walkthrough
| Step | Action | Expected Focus | Expected Announcement | Plan Handles? |
|------|--------|---------------|----------------------|---------------|
| 1 | Tab on load | "Sari la conținut" (becomes visible) | link "Sari la conținut" | ✅ |
| 2 | Enter | `<main tabindex=-1>` | main landmark | ✅ |
| 3 | Tab (Acasă) | "Cere o ofertă", then "Oprește trenurile" | link, then button | ✅ (DOM order puts the stop button after the CTA, by design) |
| 4 | Enter on trains button | Stays on button; trains stop | button "Pornește trenurile" | ✅ (A1 for announcement robustness) |
| 5 | Tab through "De unde pornești?" | Each service link | link "SEO" etc. (problem text precedes it in the same item) | ✅ |
| 6 | /contact/ form | Nume → E-mail → Telefon → Firmă → Site → Serviciu → Mesaj → Trimite | "Nume (obligatoriu), required" … Mesaj with its note via `aria-describedby` | ✅ (the honeypot is `tabindex=-1` inside `aria-hidden`) |
| 7 | Submit with an empty required field | Browser focuses the field | Native validation message | ✅ |
| 8 | Footer | Service links, pages, contacts, "Date de identificare", legal links | links | ✅ (the white halo of the focus ring stays visible on `--ink`) |

### ARIA Checklist
| Element | Role | Label | States | Keyboard | Notes |
|---------|------|-------|--------|----------|-------|
| Header nav | navigation | "Meniu principal" | `aria-current=page/true` | Tab | ✅ |
| Breadcrumbs | navigation | "Firimituri" | last item `aria-current=page` | Tab | ✅ Separator has empty alt text |
| Metro map SVG | (hidden) | — | `aria-hidden=true` | — | ✅ Decorative; position conveyed by breadcrumbs |
| Trains button | button | Visible text | text swap only | Enter/Space | A1 |
| Route maps | list (`ol`/`ul`) | `aria-labelledby` route label / "Stațiile buclei lunare" | — | — | ✅ |
| Contact form | form fields | `<label for>` | `required` | Tab | ✅ Note linked via `aria-describedby` |
| Honeypot | textbox (hidden) | "Nu completa acest câmp" | `aria-hidden` container, `tabindex=-1` | not reachable | ✅ axe passes |
| FAQ | `dl` / `dt` / `dd` | — | always expanded | — | ✅ No accordion to operate |

### Verdict Details
- Screen Reader Compatibility: PASS
- Keyboard Navigation: PASS
- Focus Management: PASS (no modals; skip link targets `main`)
- Color Contrast: PASS (pairs documented in code; Lighthouse and axe accessibility at 100)
- Motion Sensitivity: PASS (reduced motion stops the trains, the line draw and view transitions; a stop button is always offered)

---

## Refuted Findings

| Lens | ID | Claim | Why refuted |
|------|----|-------|-------------|
| Production Readiness | — | The `_headers` rule `https://:version.:subdomain.workers.dev/*` might not apply on Workers static assets | Cloudflare's Workers static-assets `_headers` docs (updated 22 Sep 2026) show this exact rule under "Prevent your workers.dev URLs showing in search results". |
| Design / SEO | — | Endpoint routes (`llms.txt`, OG PNGs, `_intern/aprobari.json`) might leak into the sitemap | `dist/sitemap-0.xml` lists only the 14 HTML pages; noindex pages, `/_test/` and `/_intern/` are excluded (`src/lib/seo.ts:19-29`). |
| Repo Maintainer | R5 | Type imports use two styles | Refuted while fixing. The code is consistent: `import type {…}` for type-only imports, inline `type X` when a value and a type come from the same module. |

---

## Applied Fixes (2026-10-22)

Everything above was applied except the CI workflow (Alex's decision) and the items marked "not done" below.

| Finding | Status | What changed | Verified by |
|---|---|---|---|
| P1 (critical): form never tested in production | Fixed | README launch step 11 is now "send a test request from the live form and check Gmail". A new section, "Formularul în producție", says to repeat it after every DNS, MX or Email Routing change and monthly. | README |
| B1 / X3: errors invisible locally | Fixed | `DEBUG_FORM=1` in `.dev.vars` (gitignored) makes the Worker print the error type under `wrangler dev`, never the form data. Production stays silent. | Worker test: one `console.error` with the message and no form values. The old "nothing reaches the console" test still passes. |
| B2: cross-site POSTs | Fixed | `worker/index.ts`: a request with `Sec-Fetch-Site: cross-site`, or with a different `Origin` (`Origin: null` is allowed), goes to `/contact/eroare/` without the rate limiter and without sending an email. | 6 Worker tests; red-green confirmed by disabling the guard (4 failed) and restoring it |
| B3: unbounded body | Fixed | Bodies declared above 64 KB are refused before parsing. The largest legitimate form (3,704 characters × 9 bytes URL-encoded) is about 33 KB, and a test sends exactly that and gets through. | Worker tests |
| B4: rate-limit fallback | Fixed | Comment explaining `necunoscut` | — |
| **New bug found during the fixes** | Fixed | Exporting a constant from the Worker's main module stopped `workerd` from starting ("Incorrect type for map entry"). The unit tests ran in Node and missed it; e2e caught it. The constant moved to `worker/validate.ts`. | New test: the main module exports only `default`. e2e now starts the Worker. |
| D1 / S1 / F3: duplicated group colours and service lookups | Fixed | `[data-grup]` defines `--culoare` and `--culoare-text` once in `tokens.css`, and four components lost their copies. New `--blue-light` token. `cereServiciu(slug, deUnde)` (stops the build on an unknown slug) and `gasesteServiciu(slug)` replace 10 inline lookups. `og.ts` keeps its copy of the colours (satori can't read CSS), and a test now compares it with `tokens.css`. | Unit tests (602); `/servicii/` screenshot unchanged |
| D3: no `:active` on the button | Fixed | `.buton-cta:active { transform: translateY(1px) }` | — |
| U1: Despre ↔ szitrans | Fixed | "szitrans.eu" links to `/proiecte/szitrans/` only when that page is built. A unit test checks both cases and that no space appears before the comma that follows the link (a bug found while fixing). | Despre tests (8) |
| F1 / A2: reduced motion switched on mid-visit | Fixed | `trains.ts` listens for the change: the trains stop for good (`disable()` in the controller), and the button and trains are hidden. | Controller test and e2e (`page.emulateMedia`) |
| A1: toggle announcement | Fixed | A hidden `aria-live="polite"` region announces "Trenurile s-au oprit." / "Trenurile au pornit.". The label swap stays, without `aria-pressed` (a deliberate earlier decision, pinned by tests). | Unit and e2e |
| P2: deploy skipped the tests | Fixed | `deploy` = `npm test && build && check && check:launch && wrangler deploy` | — |
| P3: no rollback runbook | Fixed | README section "Dacă un deploy strică site-ul" (`wrangler deployments list`, `wrangler rollback`) | — |
| P4: trains only in Chrome | Fixed | Playwright projects: `chrome` (all tests), plus `firefox` and `webkit` (`home.spec.ts`). The WebKit focus-order test is skipped because WebKit, like Safari, doesn't tab to links by default. | e2e: 87 passed, 5 skipped |
| P5: workers.dev copy | Documented | README step 14 (optional, after the domain works) | — |
| R2: no `.gitattributes` | Fixed | `* text=auto eol=lf`, binaries marked; renormalized (no content changes) | `git add --renormalize .` |
| R3: dev-dependency vulnerabilities | Fixed | wrangler 4.152.0, `npm audit fix` (fflate 0.7.5). `check:launch`'s outdated warning was updated. | `npm audit`: 0 vulnerabilities |
| R4: untracked folders | Fixed | `.anchor/`, `research_notes/` and `.dev.vars` are in `.gitignore` | — |
| R7 / F2: orphan comment | Fixed | Removed from `jsonld.ts` | — |
| X1 / X2: scripts | Fixed | `preview` (build + `wrangler dev`), `preview:draft:serve`, `test`, `verify`. README table updated. | `npm run verify` exit 0 |
| S2: `[intern]` | Documented | README "Unde e fiecare lucru" | — |
| R1: CI | **Not done** | Left out at Alex's request | — |
| B5: sender from the request host | **Not done** | The Worker can't import `site.config.ts` (it reads `process.env`, which doesn't exist in workerd), and a second copy of the domain would break the single-source rule. The README already documents the workers.dev behaviour. | — |
| D2 / U3: mobile header height | **Not done** | In production the header is 3 rows (~150px at 390px: logo, 4 links, button), which is acceptable. Squeezing the nav risks the 44px touch targets. | Screenshot `cum-lucrez-390x844.png` |
| R6: formatter config | **Not done** | Adding Prettier would reformat the whole codebase for no functional gain; the style is consistent today. | — |
| U2: double submit | **Not done** | Copy decision for Alex; two identical emails are harmless | — |

**Verification after the fixes:** `npm run verify` exits 0 (astro check 0/0/0, 602 unit tests, 86 Worker tests, build, check, links). Both builds exit 0. `npx playwright test`: 87 passed, 5 skipped (Chrome, Firefox, WebKit). `qa:page` (html-validate, schema, axe, Lighthouse ×3) passes on `/`, `/servicii/`, `/servicii/seo/`, `/contact/`, `/cum-lucrez/`, and on `/despre/` and `/proiecte/szitrans/` in the draft build, all with Lighthouse mobile 100/100/100/100. `npm audit`: 0 vulnerabilities.
