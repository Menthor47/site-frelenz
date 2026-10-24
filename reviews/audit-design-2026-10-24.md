# siteulet: design audit

**Date:** 2026-10-24 · **Commit audited:** `9bc6ca8` on `feat/site`, later rebased onto PR #3 as `f71fc5e` with the same changes (the original stays on `backup/feat-site-local-2026-10-24`) · The audit itself changed nothing in the repository; the fixes applied afterwards are in section 8.

This is the second audit of the day. The first one (`reviews/audit-ui-ux-2026-10-24.md`) covered UX, conversion, accessibility and functionality; its UI-02, CODE-01, CODE-02, CODE-04 and SEO-02 are fixed in `9bc6ca8` (`f71fc5e` on `feat/site`). This one looks only at the design itself: identity, typography, colour, layout, motion and the words as part of the design. Where an issue is already in the first audit, this report points to it instead of repeating it.

## 1. Scope

**Lens.** A design studio's critique: is the identity specific to this client, and does every structural device carry information? The checks:
- type set by the classic rules, with lines under 80 characters;
- motion used once, on purpose, rather than everywhere;
- words that name things the way the visitor would;
- a check against the defaults that make a site look generated, listed in section 2.

**Method**
- The production build of `9bc6ca8` (`dist/`), served statically, in Chrome through Playwright, at 1440×900 and at 390×844 with reduced motion. Pages: `/`, `/servicii/`, `/servicii/seo/`, `/cum-lucrez/`, `/despre/`, `/contact/`, `/termeni-si-conditii/` and the 404.
- Scripted measurements:
  - characters per line for every running-text element of 60 characters or more;
  - every font size, weight and line height in use;
  - every background colour painted;
  - how much of each card's inner width its content uses;
  - running animations per page.
- The font files' OpenType features, read with fontkit (already a dependency).
- A scan of the visible text of all 18 pages, and of the built CSS.
- The full-page screenshots from the first audit; the fixes in `9bc6ca8` render byte-identically.

**Not covered:** UX, conversion and functionality (first audit), real Safari and real phones, and how the site looks once case studies and photos exist.

## 2. Verdict

The site has a real point of view, which is rare.
- **The concept is grounded in the client's world.** Spec §5.1 makes the metro the single metaphor, in the colours of Bucharest's M1–M4 lines, for a consultant whose H1 says „din București”. The metaphor runs through everything: the map band, problem-to-service rows drawn as line segments, the process drawn as two routes, „Ești aici” on the service maps, the favicon as a station.
- **The H1 on Acasă is a station sign laid over the map.** That uses type as part of the design, not just a carrier for words.
- **The type is chosen for a reason.** Atkinson Hyperlegible Next was designed for legibility, which suits someone selling accessible sites. It's one family at three weights, on a 1.25 scale, with slight negative tracking on large headings and 1.6 leading for body text.

What holds it back:
- every section gets the same white card, and on desktop most of those cards are half empty (D-01);
- the trains run on every page, so the one animated moment is no longer special (D-02);
- a few slips in the system: the FAQ escapes the site's own line-length rule (D-03), there are two near-blacks (D-04), and the icons promised in the spec are missing (D-05).

None of this needs a redesign.

**Check against the defaults of generated sites (verified on all 18 pages and the built CSS)**

| Default | On this site |
|---|---|
| Cream background, high-contrast serif, terracotta accent | No. |
| Near-black with a single acid accent | No. The night band carries four line colours, not one accent. Its near-black is a deliberate "night" (D-04 notes there are two of them). |
| Broadsheet: hairline rules, zero radius, dense columns | Partly, and justified: square corners everywhere except circles, which mean stations (spec §5.8). Rules only between FAQ pairs and rows. No dense columns. |
| SaaS card kit: identical cards, one radius, soft shadows, gradients | Partly. No radius, no shadows (the only `box-shadow` is the focus halo), no gradients. But content is cut into identical cards regardless of role (D-01). |
| Template chrome: ALL-CAPS eyebrows, „A · B” meta strings, „WORD — fragment” labels, monospace labels, „→” on links | None. No `text-transform`, no monospace, no arrows or middle dots in visible text. En dashes appear only in ranges („art. 15–22”, „UE–SUA”). |

## 3. Highest-impact improvements

1. Take the trains off the inner pages and keep the animated arrival for Acasă. **D-02**
2. Make each card hug its content, or let prose sit on the surface and keep cards for objects. **D-01**
3. Bring the FAQ answers back under the site's own 34em measure. **D-03**
4. Add the four icons the spec already calls for: error, phone, WhatsApp, e-mail. **D-05**
5. Use one night colour for the header, band and footer. **D-04**

The biggest levers overall are still in the first audit: proof of work (UX-01) and "why me" on Acasă (UX-02). Its UX-02 also shows where a "why me" line could go: the empty lower right of the hero at 1440.

## 4. Findings

**Ratings.** Impact uses the first audit's scale: how much the issue affects a prospect's trust and decision to get in touch (Critical, High, Medium, Low). Here that includes how the site's own craft reads, since it sells web design. Effort: S (copy, CSS or config, under a day), M (a few days), L (more). **Verified** means measured or observed; **inferred** means read from code or documents.

### Layout and composition

#### D-01 · One card treatment for every section, and most cards are half empty on desktop (trade-off)
- **Where:** `.carte` (`src/styles/base.css:169-184`), used on the service pages (`src/layouts/Service.astro`), `/cum-lucrez/`, `/despre/`, `/contact/` and Acasă (decision 29).
- **Problem:** everything that isn't the band becomes the same white box with the same 1px contour and padding: a list of deliverables, a five-step process, an FAQ, a legal block. The box spans the 1152px container while its text stops at the 34em measure, so on desktop many boxes are mostly empty white.
- **Evidence:** share of each card's inner width used by its content, Chrome at 1440:

  | Page | Card | Width used |
  |---|---|---|
  | `/servicii/seo/` | „Ce primești” | 58% |
  | `/servicii/seo/` | „Cum se desfășoară” | 50% |
  | `/servicii/seo/` | „Servicii înrudite” | 51% |
  | `/servicii/seo/` | „Întrebări frecvente” | 75% |
  | `/cum-lucrez/` | „Cei patru pași” | 57% |
  | `/cum-lucrez/` | „Remediere unică sau abonament lunar” | 58% |
  | `/contact/` | „Date de identificare” | 30% |
  | Acasă | „Întrebări frecvente” | 75% |

  The cards that work fill 86–100%: the `/servicii/` cards, „Pentru cine e” with „Semne că ai nevoie” side by side, the Despre story cards and the form.
- **Why it matters:**
  - structure should carry information, but here the box says nothing about the content;
  - a page of five identical boxes, each half white, reads as a template rather than a layout;
  - on a web designer's own site, prospects notice.
- **Fix (owner's call, since decision 29 chose the cards):**
  - (a) cap prose cards at the measure plus padding, so the box hugs its text;
  - (b) pair related cards on desktop, as the „Pentru cine e” card already does: „Ce primești” beside „Cum se desfășoară”, the FAQ beside „Servicii înrudite”;
  - (c) keep cards for things that are objects (a service, the profile, the form) and let prose sections sit on the surface, separated by type and spacing.

  Option (b) keeps decision 29's look and fixes most of the empty space.
- **Impact:** Medium · **Effort:** M · **Verified**

#### D-06 · The process is drawn twice on Cum lucrez, and as a plain numbered list on service pages (trade-off)
- **Where:** `src/pages/cum-lucrez.astro` (RouteMap, then „Cei patru pași”); `src/layouts/Service.astro` („Cum se desfășoară”).
- **Problem:**
  - on Cum lucrez the four stations (Evaluare, Ofertă, Lucru, Raport) appear first as a route, then again as a numbered list with the explanations;
  - on the service pages the steps are a generic numbered list in a card, not the route the rest of the site uses for process.
- **Why it matters:** the metro language is strongest when it's the actual content, not a picture repeated next to it. The numbering itself is right, since these are sequences.
- **Fix:** let the route carry the explanations, each station with its sentence under it (one diagram instead of two blocks). Reuse that component for „Cum se desfășoară” on the service pages. Spec §4.5 asks for both blocks on Cum lucrez, so this is a spec change.
- **Impact:** Low · **Effort:** M · **Verified** (content); the benefit is inferred.

### Motion

#### D-02 · The trains run on every page, so the one animated moment loses its weight (trade-off)
- **Where:** `src/components/MetroMap.astro`, `src/client/trains.ts`; decision 28 (decision 27 had kept them on Acasă only).
- **Problem:** Acasă opens with an orchestrated sequence (the lines draw, then the trains start), and that sequence is the site's one memorable moment. Since decision 28, the same animation runs in the band of every page with a band, including where people read long text.
- **Evidence:** on each of `/servicii/`, `/servicii/seo/`, `/cum-lucrez/`, `/despre/` and `/contact/` at 1440, Chrome reports 5 running Web animations plus 4 SMIL animations. The stop choice isn't remembered between pages (first audit, A11Y-01).
- **Why it matters:**
  - motion that never stops pulls the eye away from the content on every page;
  - the arrival on Acasă stops being special;
  - motion-sensitive visitors who haven't set the OS preference must stop it again on each page.
- **Fix:** remove one accessory. Keep the animated map on Acasă, and make the inner pages' band static with „Ești aici” (decision 27's version). Optionally add a single pulse on the current station when the page loads. This also removes the stop button from 14 pages and settles A11Y-01, and pairs with the first audit's UI-01 option (d).
- **Impact:** Medium · **Effort:** S · **Verified**

### Typography

The type system is in good shape (verified):
- one family, three weights (400, 700, 800);
- six tokens on a 1.25 scale, from 14.4 to 56px;
- body text at 18px with 1.6 leading;
- headings tracked in slightly (−0.01 to −0.02em);
- running text at 81 characters per line or fewer on desktop (mostly 60–77) and 28–42 on phones, apart from D-03.

One quirk is inherent to the font: its zero is slashed, so the phone number reads with Ø-like zeros. The site's subset has no plain-zero alternate (its features are `ccmp frac pnum tnum kern mark mkmk`), so leave it.

#### D-03 · FAQ answers ignore the site's own measure
- **Where:** `src/components/Faq.astro:42-44` (`.faq { max-width: 70ch }`, `dd` without a limit), compared with `src/styles/base.css:80-84`.
- **Problem:** `base.css` caps paragraphs and list items at 34em, and its comment explains why: in Atkinson, „70ch dădea ~90” characters. The FAQ still uses `70ch`, and its answers are `<dd>` elements, which the `p, li` rule doesn't reach.
- **Evidence:** average characters per line, Chrome at 1440:
  - `/servicii/seo/` FAQ answers: 101, 100 and 88;
  - Acasă: 90.

  Two-line answers average about 100, so their first line is longer still. Everything else on those pages stays at or under 81.
- **Why it matters:** the FAQ is where prices and process get answered, and lines past about 80 characters are harder to follow back to the next line.
- **Fix:** give `dd` the same `max-width: 34em` (or set `.faq` to it), in line with the comment in `base.css`.
- **Impact:** Low · **Effort:** S · **Verified**

#### D-07 · Two sizes sit off the scale
- **Where:** `src/components/RouteMap.astro:92` (`font-size: 1.25em`); `src/styles/metro.css` (`.harta__buton`, `0.8rem`).
- **Problem:**
  - the route labels on Cum lucrez compute to 28.125px, a near-twin of `--text-lg` (28px) that comes from multiplying a token by 1.25;
  - the trains button is 12.8px, below the smallest token (`--text-sm`, 14.4px).

  Nine distinct sizes are in use at 1440 where the tokens define six plus the 16px menu.
- **Why it matters:** in-between sizes read as indecision. The button's size is deliberate (spec §5.6, "small and secondary"), but it's the one control a motion-sensitive visitor needs.
- **Fix:** set the labels to `var(--text-lg)` on the large route and `var(--text-md)` on the compact one. Give the button `--text-sm`, which matters less if D-02 removes it from inner pages.
- **Impact:** Low · **Effort:** S · **Verified**

### Colour

#### D-04 · Two near-blacks, and layers that lean on very small steps
- **Where:**
  - the header and band use `--noapte` (#0E1116); the footer uses `--ink` (#14161A) (`src/components/Footer.astro:92`);
  - the light layers: `--paper`, `--suprafata`, `--albastru-benzi`, `--tint-blue`, `--card-contur`, `--rule`.
- **Problem:**
  - the two dark bars that frame every page are two different near-blacks, only 1.04:1 apart: too close to be a choice, too far to be the same;
  - the layered look relies on very small steps: surface against white 1.17:1, the band blue against the surface 1.10:1.
- **Evidence:** the painted colours (verified); 1.04:1 and 1.10:1 computed with the WCAG formula. That the layers merge on dim or sunlit phone screens is inferred, not tested on a device.
- **Why it matters:** the night colour is part of the identity, and it should be one colour. Layers that disappear on a cheap screen turn the structure into plain white.
- **Fix:**
  - put the footer on `--noapte`, or make it deliberately different;
  - look at Acasă and a service page on a phone at low brightness and outdoors. If the band and cards merge, deepen `--albastru-benzi` one step rather than adding another tint.
- **Impact:** Low · **Effort:** S · **Verified** (colours) · **Inferred** (screens)

### Iconography and imagery

#### D-05 · The icons the spec calls for aren't there
- **Where:** spec §5.4 („Iconițe: puține, SVG inline, doar unde au sens: eroare, telefon, WhatsApp, e-mail”) and §5.2 („Erorile: … mereu cu iconiță și cu text”); `/contact/`, `/contact/eroare/`, `/contact/prea-multe-linkuri/`, the footer.
- **Problem:** the only SVG on any page is the map. The error pages have no icon, and phone, WhatsApp and e-mail are text labels only.
- **Why it matters:**
  - an error state is recognised faster with a symbol, and the spec promises one;
  - small channel icons make the „Sau scrie-mi direct” card scannable at a glance.
- **Fix:** add four inline SVG icons in the site's line style. They need `aria-hidden="true"`, since the text stays the name. Use a generic chat bubble, not the WhatsApp logo.
- **Impact:** Low · **Effort:** S · **Verified**

There's no other imagery yet, and that's not a design fault: it waits on content (first audit, UX-01).

### Copy as design

In good shape (verified):
- **Consistent vocabulary:** „Cere o ofertă” on every button, „Am primit cererea ta” after sending.
- **Error states explain and direct:** „Mesajul n-a plecat. Apasă Înapoi ca să-l recuperezi…”, with no apology and no vagueness.
- **Plain styling:** sentence case everywhere; no labels above headings; numbering only on real sequences.
- **Headings in the visitor's words:** „De unde pornești?”, „Ce primești”, „Semne că ai nevoie”.

The copy issues that remain are in the first audit: UX-02 (why me), UX-04 (websites in the first screen), UX-07 (repetition), UX-08 (jargon).

## 5. Quick wins

- **D-02:** a static band on inner pages; the trains only on Acasă.
- **D-03:** `max-width: 34em` on the FAQ answers.
- **D-04:** the footer on `--noapte`.
- **D-07:** the route labels and the trains button on the type tokens.
- **D-05:** four inline icons.

## 6. Larger opportunities

1. **Say the idea out loud once.** No page mentions the metro, so the four colours can also read as Google's. One sentence on Despre, or in the „acest site” case study, would turn the palette into a story: the map uses the colours of Bucharest's M1–M4 lines. Do it once and plainly, not as a tagline.
   - Against: it's the owner's copy, and the joke shouldn't be explained more than once.
2. **One continuous journey on Acasă.** Let the hero's lines carry on down into „De unde pornești?”, whose rows are already line segments in the same colours, so the first scroll reads as following a line from the map to your stop.
   - Against: it must still hold at 320px with text at 200%, and it adds drawing code to the page that matters most.
3. **Steps as stations everywhere** (D-06). One route component that carries explanations, used on Cum lucrez and on every service page.
   - Against: a spec change, and the numbered list is simpler to edit.
4. **A frame for case-study screenshots,** decided before the first ones arrive (first audit, UX-01 and CODE-04). For example, a station card on the line of the project's service, so the proof looks like part of the map.
   - Against: more design work before the content exists.

## 7. Open questions for the owner

1. Trains on every page (decision 28), or the animated map only on Acasă (decision 27)? (D-02)
2. Should cards hug their text, sit in pairs, or should prose come out of the cards? (D-01)
3. May the site say, once, that the colours are Bucharest's metro lines? (opportunity 1)
4. Should the footer use the same night colour as the header? (D-04)

## 8. Applied fixes (2026-10-24)

The three findings that needed no decision from the owner are fixed in `0a1c06e` on `feat/site`. It was first committed as `33a7529`, which `backup/feat-site-local-2026-10-24` keeps, then cherry-picked with the same changes after the branch was reset to `origin/feat/site`.

| Finding | Status | What changed | Verified by |
|---|---|---|---|
| D-03 · FAQ answers ignore the measure | Fixed | The answers (`.faq dd`) stop at the paragraphs' 34em (`src/components/Faq.astro:68`). The list keeps its 70ch. | `tests/e2e/tipografie.spec.ts`: the widest line of `.faq dd` at 1440, measured in the browser |
| D-05 · The icons aren't there | Fixed | A new `Iconita` component (`src/components/Iconita.astro`) draws four inline SVG icons with `aria-hidden`: error, phone, WhatsApp (a generic chat bubble, not the logo) and e-mail. Phone, WhatsApp and e-mail appear in the direct contacts and the footer. The error icon sits in the title of the error pages, in `--red-dark`, and stays inline at 320 px with text at 200%. | `tests/unit/iconita.test.ts`, `iconite-pagini.test.ts`; `tests/e2e/culori.spec.ts` (the error icon's colour); `tests/e2e/contact.spec.ts` (no horizontal scroll at 320 px on the error pages) |
| D-07 · Two sizes off the scale | Fixed | The route labels use `--text-md` on the compact route and `--text-lg` on the large one (`src/components/RouteMap.astro`). The trains button uses `--text-sm`: 14.4 px instead of 12.8 px (`src/styles/metro.css`). | `tests/e2e/tipografie.spec.ts`: every font size in use is on the scale |

Spec §5.2, §5.3, §5.4 and §5.6 and decision 28 describe the changes.

**Still open, each waiting on the owner (section 7)**

| Finding | State on `0a1c06e` | Waits on |
|---|---|---|
| D-01 · One card treatment | Unchanged. Decision 29 chose the cards. | Question 2: hug, pair or take prose out of the cards |
| D-02 · Trains on every page | Unchanged. Decision 28 stands. It also settles UI-01 (d) and A11Y-01 of the first audit. | Question 1 |
| D-04 · Two near-blacks | Unchanged: the footer is still on `--ink` (`src/components/Footer.astro:93`). | Question 4 |
| D-06 · The process drawn twice | Unchanged. Spec §4.5 asks for both blocks. | A spec change |
| Opportunity 1 · Name the metro once | Not started. It's the owner's copy. | Question 3 |

**Checked again on `0a1c06e` (2026-10-24):**
- `npm run verify` passes: `astro check` reports 0 errors, 670 unit tests and 89 Worker tests pass, the build and the cedilla and glyph checks are clean, and 20 links are scanned.
- The Chrome end-to-end suite: 86 passed and 4 skipped. The skipped ones are the `qa:page` tests, which run only with `QA_PATH`.
