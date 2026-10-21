# Pasul 2 – Planul site-ului Alex Ionescu

Stack: Astro (static), găzduit pe Cloudflare Pages. Limba: română, cu diacritice corecte. Domeniul se setează într-un singur loc (`site.config`).

## 1. Harta site-ului

Fiecare pagină răspunde unei intenții de căutare diferite și are un singur cuvânt-cheie principal. Două pagini nu concurează pe același cuvânt.

```
/                                   Acasă
/servicii/                          Toate serviciile (hub)
  /servicii/seo/                    Servicii SEO
  /servicii/audit-seo/              Audit SEO și audit de site
  /servicii/web-design/             Web design / creare site
  /servicii/redesign-site/          Redesign site
  /servicii/mentenanta-site/        Aducere la zi și mentenanță
  /servicii/optimizare-aeo-geo/     Optimizare pentru căutarea AI (AEO și GEO)
/cum-lucrez/                        Procesul și cele două formate de colaborare
/proiecte/                          Portofoliu (hub)
  /proiecte/szitrans/               Studiu de caz: site szitrans.eu
  /proiecte/magazin-online-bucuresti/  Studiu de caz anonim (Amsterdam Headshop, până la acord)
  /proiecte/mayalashes/             Doar după acordul clientului
  /proiecte/acest-site/             Cum am construit acest site + scorurile Lighthouse
/ghiduri/                           Articole care răspund la întrebări (hub)
  3–5 articole la lansare (vezi secțiunea 3)
/despre/                            Despre mine [DE COMPLETAT]
/contact/                           Formular, telefon, WhatsApp
/politica-de-confidentialitate/
/politica-cookies/                  Scurtă: site-ul nu folosește cookie-uri neesențiale
/termeni-si-conditii/
/404
```

Ce NU facem, deși pare „bun la SEO”:
- **Pagini pe oraș** („SEO Cluj”, „SEO Iași” cu același text): Google le tratează ca pagini-portal (doorway) și le poate penaliza. Apare doar „din București, pentru firme din toată țara”.
- **Pagini separate pentru AEO și GEO**: intenția e prea apropiată, ar concura între ele. O pagină solidă e mai bună decât două subțiri.
- **O pagină globală de întrebări frecvente**: întrebările stau pe paginile de servicii, unde ajută la poziționare.

## 2. Structura paginilor

### Acasă
1. Titlu care spune direct ce faci și pentru cine + subtitlu + buton „Cere o ofertă”.
2. Problemele clientului (site lent, nu apare în Google, arată învechit, nu apare în ChatGPT).
3. Cele 6 servicii, câte un card colorat, cu link spre pagina fiecăruia.
4. Cum lucrez, în 3–4 pași.
5. Proiecte (2–3 carduri).
6. Întrebări frecvente generale (4–5) cu schemă FAQPage.
7. Îndemn final + contact.

### Pagină de serviciu (șablon comun pentru toate 6)
1. H1 cu cuvântul-cheie principal și un paragraf care răspunde direct: ce e serviciul și cui îi folosește (2–3 fraze, primul lucru citit de Google și de motoarele AI).
2. Pentru cine e și semnele că ai nevoie de el.
3. Ce primești concret (listă).
4. Cum se desfășoară (pași).
5. Proiect relevant, dacă există.
6. 4–6 întrebări frecvente, fiecare cu titlu-întrebare și răspuns în prima frază.
7. Linkuri către serviciile înrudite (legături interne).
8. Un singur îndemn: „Cere o ofertă”.

### Cum lucrez
Pașii (evaluare → ofertă → lucru → raport) și cele două formate, descrise fără prețuri și fără cifre: remediere unică; remediere la preț redus plus abonament lunar. „Prețul, reducerea și ce include abonamentul se stabilesc după evaluarea site-ului.”

### Studiu de caz
Context → problema → ce am făcut → rezultat (doar ce se poate dovedi, cu capturi) → servicii folosite (linkuri).

### Ghid
Titlu-întrebare, răspunsul în primul paragraf, apoi detalii, data actualizării, autorul (Alex Ionescu), linkuri spre serviciul legat.

### Despre
Cine sunt, experiența, instrumentele, cum lucrez [DE COMPLETAT]. Fără fotografie până la una reală.

### Contact
Formularul (regulile din Pasul 1), telefon 0724 230 051, buton WhatsApp, e-mail idealserv51@gmail.com, „București – lucrez cu firme din toată țara”.

## 3. Cuvinte-cheie (de validat)

Volumele nu sunt verificate. Înainte de lansare, le confirmăm în Google Keyword Planner sau în alt instrument, iar după lansare în Search Console.

| Pagina | Cuvânt-cheie principal | Secundare |
|---|---|---|
| Acasă | consultant SEO București | specialist SEO, servicii SEO și web design |
| /servicii/seo/ | servicii SEO | optimizare SEO, optimizare site Google |
| /servicii/audit-seo/ | audit SEO | audit site, analiză SEO site |
| /servicii/web-design/ | web design București | creare site de prezentare, realizare site |
| /servicii/redesign-site/ | redesign site | refacere site, modernizare site |
| /servicii/mentenanta-site/ | mentenanță site | actualizare site, întreținere site WordPress |
| /servicii/optimizare-aeo-geo/ | optimizare pentru ChatGPT | AEO, GEO, vizibilitate în căutarea AI |

Ghiduri pentru lansare (fiecare țintește o întrebare):
1. Ce este un audit SEO și ce primești în el
2. De ce nu apare site-ul meu în Google
3. Cât de des trebuie actualizat un site WordPress
4. Ce este GEO și cum apare o firmă în răspunsurile ChatGPT
5. Redesign sau site nou: cum alegi

## 4. Direcția vizuală

- **Fundal:** predominant alb. Culorile apar în secțiuni alternate, carduri și butoane.
- **Culoare pe serviciu:** albastru #2D6CDF (SEO, AEO/GEO), verde #1F9D61 (audit), galben #F5B21B (web design), roșu #E0533D (redesign, mentenanță). Textul alb merge doar pe albastru; pe celelalte, text #14161A.
- **Text colorat pe alb:** #1A4FB8, #157347, #8A5A00, #B8382A.
- **Subsol:** negru #14161A, text alb, linkuri în galben, verde, roșu sau albastru deschis #6B9BF0.
- **Tipografie:** un font sans-serif cu personalitate pentru titluri și unul foarte lizibil pentru text, ambele găzduite local și verificate că au ș și ț cu virgulă (multe fonturi nu le au corect).
- **Logo:** din text, „Alex Ionescu”, cu un mic semn grafic din cele patru culori.
- **Mișcare:** animații discrete în CSS, oprite pentru cine a cerut mai puțină mișcare.
- **Fără:** imagini stoc, fotografii generice, carusele.

## 5. Bune practici tehnice

- Un singur H1 pe pagină, titluri sub 60 de caractere, descrieri de 140–160 de caractere, unice pe fiecare pagină.
- URL-uri scurte, fără diacritice, cu cratime.
- Canonical, sitemap.xml, robots.txt, pagină 404, redirecționare unică spre varianta HTTPS cu sau fără www.
- Date structurate: ProfessionalService și Person (Acasă, Despre), Service (fiecare serviciu), FAQPage, BreadcrumbList, Article (ghiduri).
- Open Graph și imagine socială 1200×630 pentru fiecare pagină.
- Firimituri (breadcrumbs) vizibile și legături interne între servicii, proiecte și ghiduri.
- Imagini WebP sau AVIF, cu dimensiuni declarate și text alternativ.
- Ținte: Lighthouse pe mobil minim 90 la toate categoriile; WCAG 2.1 AA.
- Opțional pentru motoarele AI: fișier llms.txt (nu e un standard confirmat, dar nu strică).
- Cloudflare Web Analytics, fără cookie-uri și fără banner.
- După lansare: Search Console, trimiterea sitemap-ului, verificarea indexării.

## 6. Rămân de completat

Date PFA, pagina Despre, domeniul final, acordurile pentru Amsterdam Headshop și mayalashes.ro.
