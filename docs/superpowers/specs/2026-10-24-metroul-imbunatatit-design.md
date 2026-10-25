# Metroul îmbunătățit: design

Data: 2026-10-24. Stare: **cele patru secțiuni aprobate de Alex în chat, pe 2026-10-24** (Acasă, Contact, paginile interioare
pe telefon, detaliile mici). **Implementat și necommitat, pe ramura `feat/site`; așteaptă revizuirea locală a lui Alex.**
Bugetul de CSS (spec-ul principal, §9.1, 25 KB pe pagină) a cerut un pas în plus: `src/layouts/Schelet.astro` a fost scos din
`Base.astro`, Astro folosește `scopedStyleStrategy: 'class'`, iar stilurile Acasă au trecut în CSS global.
Pornește de la auditul din 2026-10-24 (`AUDIT-2026-10-24.md`, secțiunile D și F) și de la cererea „maximizează UX/UI-ul, fii
creativ”. După o variantă editorială nouă, respinsă, Alex a ales: **păstrăm metroul de azi și îl facem să lucreze.**

## 1. Obiectiv

Harta nu mai e doar decor: arată drumul vizitatorului de la problema lui la cererea de ofertă. Scopul site-ului rămâne
același: cereri de ofertă de la firmele din România, pe un site care dovedește ce vinde Alex.

Criterii de reușită, măsurabile:
- pe `/servicii/seo/`, la 375×667, H1-ul se termină cel mult la 300px (azi: 415px, măsurat);
- pe Acasă, la 375×667, butonul „Cere o ofertă” rămâne deasupra pliului (azi se termină la 553px);
- 0 încălcări axe (WCAG 2.2 AA) pe toate paginile, la 320 și 1440px; nicio derulare orizontală la 320px și cu text la 200%;
- Lighthouse pe mobil cel puțin 90 la toate categoriile pe paginile schimbate (azi: 100);
- niciun script nou pe Acasă (alegătorul e doar CSS); scriptul formularului crește cu cel mult 2 KB.

## 2. Ce nu se schimbă

- Identitatea: paleta, fontul livrat de pe site, colțurile drepte, harta de metrou cu cele patru linii, antetul și banda
  întunecate pe tabletă și desktop (deciziile 25 și 28), imaginile OG aprobate, favicon-ul.
- Regulile din spec: fără conținut inventat (marcajele rămân până vin datele reale), fără cookie-uri, fără scripturi sau fonturi
  de pe alte domenii, CSP cu hash-uri, „reduced motion” respectat, totul merge și fără JavaScript.
- Worker-ul formularului și regulile lui (`src/form-rules.ts`); limita de 3 linkuri rămâne (A-06 e o decizie separată).

## 3. Acasă: alegătorul din hero

**Așezare.** Zona întunecată de sus păstrează harta, plăcuța albă a H1-ului, subtitlul și butonul general „Cere o ofertă”
(link spre `/contact/`), în ordinea de azi. Sub buton vine „De unde pornești?”, mutat în hero ca formular de alegere.
Secțiunea separată „De unde pornești?” de mai jos dispare (altfel aceleași șase probleme ar apărea de două ori); componenta
`LineDiagram` iese din site, iar titlul aprobat rămâne ca legendă.

**Marcaj.** Un `<form method="get" action="/contact/">` cu un `<fieldset>` și `<legend>De unde pornești?</legend>`. Șase
butoane radio, `name="serviciu"`, cu valorile slug-urilor din `SERVICII` (`src/form-rules.ts`), în ordinea `ordine`, fiecare cu
eticheta scurtă din tabelul de texte (§8) și cu `data-linie` (linia grupului, din `LINIA_GRUPULUI`). După fieldset, câte un
panou „Traseul tău” pentru fiecare serviciu, toate în HTML, ascunse din CSS.

**Comportament, doar CSS** (`:has()`, în `@supports selector(:has(*))`), când un radio e ales:
- linia lui (după `data-linie`) e plină, celelalte trec la 0,35 opacitate, ca pe benzile paginilor interioare;
- „Ești aici” apare pe linia aleasă (harta de pe Acasă primește câte un marcaj ascuns pe fiecare linie, cu pozițiile din
  `src/lib/harta.ts`);
- trenurile celorlalte linii se ascund; merge doar trenul liniei alese;
- sub 640px, linia aleasă se vede chiar dacă e M1 sau M4 (azi ascunse pe telefon pe Acasă);
- apare panoul serviciului: titlul „Traseul tău: <Serviciu>”, pașii reali ai serviciului (câmpul `pasi` din colecția
  `servicii`, aceiași ca pe pagina lui), desenați cu `PasiTraseu` cu opțiunea existentă `orizontal` (orizontal când panoul are
cel puțin 48rem, vertical sub; interogare de container, nu de ecran), butonul de trimitere
  „Cere oferta pentru <Serviciu>” (trimite formularul: `/contact/?serviciu=<slug>`) și linkul „Vezi pagina <Serviciu> →”.
  Linia din panou poartă clasa `vt-<slug>`, deci tranziția M3 (segment → banda paginii de serviciu, §5.7) pornește de aici.

**Fără `:has()` sau fără CSS.** Panourile rămân ascunse, iar sub fieldset se vede un buton de trimitere general, „Cere o
ofertă”; în `@supports`, butonul general dispare și rămân doar butoanele din panouri. Formularul trimite oricum serviciul ales.

**Accesibilitate.** Radio-uri native (săgețile schimbă alegerea), ținte de 44px, focus vizibil pe fundal întunecat, alegerea
nu stă doar în culoare (bulina, conturul de 2px și titlul panoului numesc serviciul). Harta rămâne `aria-hidden`. Panourile
ascunse cu `display: none` nu ajung la cititoarele de ecran.

**Reduced motion.** Fără trenuri (ca azi), schimbările se fac pe loc.

## 4. Contact: formularul ca traseu

**Trei stații.** Câmpurile își păstrează ordinea, regulile și numele; se grupează în trei `fieldset`-uri cu legende:
„1. Cine ești” (Nume, E-mail, Telefon, Firmă), „2. Site-ul tău (opțional)” (Adresa site-ului, Serviciul), „3. Ce te încurcă”
(Mesaj). Butonul de trimitere e capătul liniei, cu eticheta „Destinația: oferta ta” lângă el.

**Linia se umple, doar CSS.** O linie verticală leagă stațiile, pe marginea din stânga a cardului formularului. O stație devine
plină când câmpurile ei obligatorii sunt valide (`:has(:required:valid)`, fără câmpuri invalide); „Site-ul tău” e marcată
opțională și nu blochează nimic. Culoarea liniei e a grupului serviciului ales în listă
(`.formular:has(option[value="seo"]:checked)`), cerneală când nu e ales niciun serviciu sau e ales „Nu știu încă”. Sub 36rem (lățimea cardului), linia
verticală dispare, iar fiecare legendă își păstrează bulina.

**Serviciul vine din link** (din alegătorul de pe Acasă și din pasul 1 al paginilor de serviciu). `src/client/contact-form.ts`
citește `?serviciu=` și alege opțiunea doar dacă valoarea e în `CAMPURI.serviciu.optiuni` (cele 6 servicii și „nu-stiu”); orice
altceva e ignorat. Fără JavaScript, lista rămâne goală, ca azi.

**Erori în română, sub câmp (A-08).** Cu JavaScript, scriptul pune `novalidate` pe formular și verifică la trimitere cu
`checkValidity()` pe fiecare câmp. Pentru fiecare câmp invalid scrie mesajul din §8 într-un `<p>` de sub câmp (legat prin
`aria-describedby`, alături de nota existentă unde există), pune `aria-invalid="true"` și mută focusul pe primul câmp invalid.
Mesajul dispare când câmpul devine valid. Lungimea maximă n-are mesaj: o opresc atributele `maxlength`, ca azi. Fără
JavaScript, rămâne validarea browserului.

**Contorul de sub Mesaj.** „<n> / 3000 caractere · <k> / 3 linkuri”, actualizat la tastare; linkurile se numără cu
`countLinks` din `worker/links.ts`, aceeași funcție ca în Worker. Peste 3 linkuri, trimiterea se oprește pe pagină, cu mesajul
din §8 sub Mesaj și focusul pe câmp, fără cerere la server. Explicațiile de eroare existente de sub buton (decizia 30) rămân
pentru erorile de la Worker.

**„Am primit cererea ta”.** H1-ul rămâne. Sub el: linia se termină în stația albastră „Destinație”, apoi „Ce urmează”, cu trei
opriri luate din răspunsul aprobat odată cu Acasă (întrebarea „Ce se întâmplă după ce trimit cererea?”). Timpul de răspuns
apare doar după ce Alex îl dă (marcajul #18, ascuns în producție ca azi).

## 5. Paginile interioare pe telefon

**Firimiturile devin linia (sub 48rem).** Marcajul rămâne același (`nav aria-label="Firimituri"`, `ol`, `aria-current="page"`
pe ultimul pas). Sub 48rem, CSS-ul îl face o fâșie întunecată (`--noapte`) lipită de antet: o linie în culoarea grupului
paginii (`--noapte-text-2` pe paginile fără grup: Servicii, Cum lucrez, Despre, Contact, listele), câte o stație pe pas, cu
eticheta dedesubt, iar pagina curentă e stația mare albastră „Ești aici”, cu numele îngroșat. Linkurile au 44px și culoarea
`--blue-light` (6,53:1 pe fundalul întunecat), eticheta curentă `--noapte-text`. Cu text mărit, etichetele se rup sub stații și
fâșia crește în înălțime.

**Banda mare se ascunde sub 48rem**, cu trenurile, butonul „Oprește trenurile” și zona `aria-live`. `src/client/trains.ts`
pornește trenurile doar cu `(min-width: 48rem)` și le pornește dacă ecranul se lărgește (tabletă rotită); sub prag nu rulează
nimic. Rezolvă A-03 și, pe telefon, A-13. Acasă nu e afectată: harta ei stă în conținut, nu în bandă.

**Pasul 1 are acțiune (toate lățimile).** În „Cum se desfășoară”, pe fiecare pagină de serviciu, primul pas („Îmi trimiți
cererea…”) primește linkul „Trimite cererea →” spre `/contact/?serviciu=<slug>`. Banda finală cu îndemnul rămâne.

## 6. Detaliile mici

**404, „Pagina nu există”.** H1-ul rămâne. Sub el, fraza din §8 și o linie cu cinci stații, paginile din meniu: Acasă,
Servicii, Cum lucrez, Despre, Contact (linkuri reale, într-o listă). Linia se desenează ca firimiturile de pe telefon (aceeași
clasă de linie cu stații), dar în cerneală, pe fundal alb, la toate lățimile. O stație
ruptă, „?”, legată punctat de linie, e doar decor (`aria-hidden`). Rămâne `noindex`, fără bandă, fără script.

**Stații vizitate.** Pe cardurile de proiect (secțiunea de pe Acasă și `/proiecte/`), un traseu mic din serviciile folosite
(câmpul `servicii` al proiectului), fiecare segment în culoarea grupului lui și cu numele serviciului scris dedesubt. Traseul
lipsește cât timp serviciile sunt provizorii (`serviciiDeConfirmat` cu marcaj, ca la magazinul online, #8). Titlul secțiunii de
pe Acasă devine „Proiecte: stații vizitate”; meniul rămâne „Proiecte”. În producție nu apare nimic până la primul proiect
aprobat (#7, #21 pentru szitrans).

**Traseele în cerneală (A-14).** Pe Acasă („Cum lucrăm: două trasee”) și pe Cum lucrez, ambele trasee din `RouteMap` sunt în
`--ink`: „Remediere unică” e o linie plină care se termină într-o stație plină; „Remediere + abonament lunar” e aceeași linie,
continuată de bucla punctată „Se repetă lunar”. Legenda deosebește plin de punctat. Culorile grupurilor rămân doar pentru
servicii, peste tot.

## 7. Componente și fișiere

| Unde | Ce se schimbă |
|---|---|
| `src/pages/index.astro` | alegătorul în hero (§3); fără secțiunea „De unde pornești?”; titlul secțiunii de proiecte |
| `src/components/MetroMap.astro`, `src/styles/metro.css` | marcajele „Ești aici” pe fiecare linie a hărții de pe Acasă; regulile `:has()`; banda ascunsă sub 48rem |
| `src/components/AlegatorTraseu.astro` (nou) | formularul de alegere și panourile; primește serviciile din pagină |
| `src/components/LineDiagram.astro` | se scoate, cu testele lui |
| `src/components/PasiTraseu.astro` | opțiunea de link pe primul pas (§5) |
| `src/components/ContactForm.astro`, `src/client/contact-form.ts` | fieldset-uri, linia, erorile sub câmp, contorul, alegerea din link (§4) |
| `src/pages/contact/multumim.astro` | „Destinație” și „Ce urmează” (§4) |
| `src/components/Breadcrumbs.astro` | fâșia-linie sub 48rem (§5) |
| `src/client/trains.ts` | pornește doar de la 48rem (§5) |
| `src/pages/404.astro` | linia cu stații (§6) |
| `src/components/ProiecteRezumat.astro` | traseul serviciilor pe card (§6) |
| `src/components/RouteMap.astro` | traseele în cerneală, bucla punctată (§6) |
| `docs/superpowers/specs/2026-10-21-site-alex-ionescu-design.md` | deciziile 31–34 (§10) și secțiunile pe care le refac |
| `tests/e2e/home.spec.ts`, `tests/unit/home.test.ts` | testele rândurilor din „De unde pornești?” (768px pe un rând, cuvintele cu cratimă, numele tranziției M3) trec pe alegător și pe panouri |
| `tests/e2e/salt.spec.ts` | pe telefon, după „Sari la conținut”, Tab ajunge tot la primul pas din fâșia-linie |

## 8. Texte de aprobat (ciorne)

Toate sunt la „tu”, fără cifre sau promisiuni noi. Se aprobă odată cu pagina lor (`src/approvals.ts` sau frontmatter).

| Unde | Text propus |
|---|---|
| Acasă, alegătorul: SEO | Nu mă găsesc clienții în Google |
| Acasă, alegătorul: Optimizare AEO și GEO | Nu apar când întreabă cineva ChatGPT |
| Acasă, alegătorul: Audit SEO | Au scăzut vizitele și nu știu de ce |
| Acasă, alegătorul: Creare site | N-am încă un site |
| Acasă, alegătorul: Redesign site | Site-ul arată învechit |
| Acasă, alegătorul: Mentenanță site | Site-ul e lent și neactualizat |
| Acasă, panoul | Traseul tău: <Serviciu> · Cere oferta pentru <Serviciu> · Vezi pagina <Serviciu> → |
| Acasă, butonul general din formular (fără `:has()`) | Cere o ofertă |
| Acasă, titlul proiectelor | Proiecte: stații vizitate |
| Contact, legendele | 1. Cine ești · 2. Site-ul tău (opțional) · 3. Ce te încurcă |
| Contact, capătul liniei | Destinația: oferta ta |
| Contact, eroare: Nume gol | Scrie-ți numele. |
| Contact, eroare: E-mail gol | Scrie-ți adresa de e-mail, ca să-ți pot răspunde. |
| Contact, eroare: E-mail greșit | Adresa de e-mail pare incompletă. Verific-o, de exemplu nume@firma.ro. |
| Contact, eroare: Mesaj gol | Scrie-mi pe scurt ce te încurcă la site. |
| Contact, eroare: prea multe linkuri (înainte de trimitere) | Mesajul are mai mult de 3 linkuri. Scoate câteva și trimite din nou. |
| Contact, contorul | <n> / 3000 caractere · <k> / 3 linkuri |
| „Am primit cererea ta” | Destinație · Ce urmează (cele trei opriri, din răspunsul aprobat de pe Acasă) |
| Paginile de serviciu, pasul 1 | Trimite cererea → |
| 404 | Ai coborât la o stație care nu e pe hartă. Alege una de mai jos. |

## 9. Faze de implementare

Fiecare fază se poate publica singură și trece prin aceleași verificări (§11). Ordinea urmează dependențele.

0. **Înainte (separat): A-01**, verificarea întregului site în `deploy` și în CI. Recomandată înaintea fazei 1, ca toate
   fazele să treacă prin ea. Designul ei așteaptă aprobarea separat.
1. **Paginile interioare pe telefon** (§5): câștigul măsurat cel mai mare, cu cel mai puțin cod. Linkul de la pasul 1 merge și
   înainte de faza 2 (deschide Contact fără alegere).
2. **Contact** (§4): alegerea din link de aici o folosesc fazele 1 și 3.
3. **Acasă** (§3).
4. **Detaliile mici** (§6).

## 10. Decizii noi pentru spec-ul principal

Deciziile 31–34 sunt în registrul din `2026-10-21-site-alex-ionescu-design.md` (tabelul de decizii), unde le-au adăugat fazele implementate; tabelul de mai jos le păstrează aici, cu ce refac:

| Nr. | Decizie | Reface |
|---|---|---|
| 31 | Pe telefon (sub 48rem), banda cu harta lipsește pe paginile interioare; firimiturile devin linia de metrou, iar trenurile rulează doar de la 48rem. Pasul 1 din „Cum se desfășoară” are linkul spre cerere. | decizia 28 (doar sub 48rem), §5.6, §9.2 |
| 32 | Formularul de contact e un traseu în trei stații, cu erorile sub câmp, contorul și serviciul ales din link; pagina de mulțumire arată „Ce urmează”. | deciziile 20 și 30, §3.5, §4.5 |
| 33 | Pe Acasă, „De unde pornești?” e alegătorul din hero, doar CSS; secțiunea separată dispare. | decizia 4, §4.3, §5.7 (M3) |
| 34 | Traseele de lucru sunt în cerneală (plin și punctat); culorile grupurilor sunt doar pentru servicii. Proiectele arată serviciile folosite ca traseu. 404 are linia paginilor principale. | §5.2, §4.3, §4.6 |

## 11. Testare

**Pentru fiecare fază:** `npm run verify`, `npm run test:e2e` (Chrome, Firefox, WebKit), verificarea întregului site (A-01:
axe WCAG 2.2, CSP, 320px, zone de 44px), `npm run qa:page` cu Lighthouse pe paginile schimbate, `html-validate`, fără sedile.
Fiecare test nou pică întâi pe codul vechi.

**Unitare (vitest, Astro container):**
- Acasă: șase radio-uri cu valorile din `SERVICII`, un panou pe serviciu, cu pașii din colecție, butonul și linkul spre pagina
  serviciului; fără `LineDiagram`; formularul trimite GET la `/contact/`.
- Contact: trei fieldset-uri cu legende, fiecare câmp în fieldset-ul lui, elementele de eroare legate prin `aria-describedby`;
  `contact-form.ts`: alegerea din link acceptă doar valorile din `optiuni`; contorul numără ca `countLinks`.
- Paginile de serviciu: pasul 1 are linkul cu slug-ul paginii.
- 404: linkurile sunt paginile din meniu; stația „?” e `aria-hidden`.
- Proiecte: traseul apare doar cu servicii confirmate. `RouteMap`: fără tokenurile grupurilor.

**End-to-end (Playwright):**
- Acasă: alegerea unui radio aprinde linia lui (opacitatea calculată), arată panoul potrivit și ascunde celelalte; butonul
  panoului duce la `/contact/?serviciu=<slug>`; la 375px, butonul general rămâne deasupra pliului; cu „reduced motion”, fără
  trenuri; tastatura alege cu săgețile.
- Contact: `?serviciu=redesign-site` alege serviciul, `?serviciu=xyz` e ignorat; trimiterea goală arată mesajele în română și
  mută focusul; 4 linkuri opresc trimiterea fără cerere la server; stația 1 se umple după Nume și E-mail valide; fără
  JavaScript, totul ca azi.
- Telefon (375×667): pe `/servicii/seo/`, banda e ascunsă, fâșia-linie se vede, H1-ul se termină sub 300px, trenurile nu
  pornesc; la 768px, banda și trenurile ca azi.
- Detalii: culoarea calculată a traseelor e `--ink`; 404 are cele cinci linkuri.

## 12. Riscuri

- `:has()` lipsește doar în browserele foarte vechi (Firefox sub 121, Safari sub 15.4): acolo alegătorul e un formular simplu,
  care merge. Testele e2e rulează și în Firefox și WebKit pe Acasă.
- Fără secțiunea „De unde pornești?”, Acasă pierde șase linkuri cu textul problemei; rămân linkurile din panouri (în HTML),
  din meniu și din subsol.
- Șase panouri ascunse adaugă HTML pe Acasă (estimat 3–4 KB necomprimat); CSS-ul pe pagină rămâne sub limita de 25 KB din
  `page-basics`.
- Pe telefon, banda de sus lipsește de pe paginile interioare: o schimbare vizibilă a deciziei 28, aprobată acum doar pentru
  ecranele sub 48rem.
- Textele din §8 cer aprobarea lui Alex; până atunci paginile rămân neaprobate și `check:launch` blochează lansarea, ca azi.
