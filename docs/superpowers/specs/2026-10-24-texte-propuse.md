# Texte propuse (ciornă pentru Alex)

Data: 2026-10-24. Stare: **ciornă, nimic nu e aplicat pe site**. Vine din critica Impeccable din 2026-10-24
(`reviews/audit-impeccable-2026-10-24.md`, problemele 2, 3 și 4). Fiecare rând arată textul de acum, propunerea și motivul.
Alex alege rând cu rând: „da”, „nu” sau o variantă a lui. Nicio propunere nu adaugă o promisiune, o cifră sau un termen pe
care site-ul nu-l are deja.

**Conflict de știut înainte:** §6.4 din spec cere ca „Alex Ionescu” să apară cu numele în paragrafele-cheie, ca pasajele să
aibă sens și citite separat de motoarele AI. Critica spune că repetarea sună scrisă pentru o mașină (de 7 ori pe `/servicii/`).
Propunerea de mai jos e un compromis: numele rămâne o dată pe pagină în textul vizibil și peste tot în datele structurate
(`Person`, `Service.provider`) și în `llms.txt`, unde îl citesc mașinile. Dacă Alex preferă regula din §6.4, rândurile 1–3
rămân cum sunt.

## A. Numele lui Alex și cuvintele-cheie lipite în text

| # | Unde | Acum | Propunere | De ce |
|---|---|---|---|---|
| 1 | `/servicii/`, introducerea | „Eu, Alex Ionescu, lucrez pe patru linii: vizibilitate (SEO și căutarea AI), diagnostic (auditul SEO), construcție (site-uri de prezentare noi) și reparație (redesign și mentenanță). …” | „Te ajut în patru feluri: să fii găsit (SEO și căutarea AI), să afli ce nu merge (auditul SEO), să ai un site nou sau să-l repari pe cel vechi (redesign și mentenanță). Pe pagina fiecărui serviciu vezi pentru cine e, ce primești și cum se desfășoară.” | Sensul vine întâi; numele liniilor („vizibilitate”, „diagnostic”) rămân pe titlurile grupurilor, nu în frază. |
| 2 | Cardurile de pe `/servicii/` și primul paragraf al fiecărui serviciu (`raspunsDirect`) | „…eu, Alex Ionescu, fac pentru firma ta un site clar și rapid…”, „…făcută de mine, Alex Ionescu…” (în toate cele 6) | Aceeași frază, fără „eu, Alex Ionescu,” / „de mine, Alex Ionescu,”: „Fac pentru firma ta un site clar și rapid…”, „Un audit SEO e verificarea completă a site-ului tău, ca să afli ce îl împiedică să fie găsit în Google…” | Numele rămâne în titlul paginii („– Alex Ionescu”) și în datele structurate; pe card, cititorul știe deja cine scrie. |
| 3 | Aceleași paragrafe, frazele cu varianta cuvântului-cheie | „Ofer servicii SEO pentru firme: …”, „Optimizarea SEO a site-ului cuprinde…”, „Realizarea site-ului cuprinde…”, „Refacerea site-ului înseamnă…” | „Lucrez pe site-ul tău ca Google să-l poată citi și înțelege…”, „Cuprinde partea tehnică, textele paginilor și legăturile dintre ele.”, „Cuprinde structura paginilor…”, „Înseamnă design nou…” | Cuvântul-cheie stă deja în titlu și în H1; repetat în formă de dicționar, textul sună generat. |
| 4 | `/cum-lucrez/`, introducerea | „Eu, Alex Ionescu, lucrez în patru pași: …” | „Lucrez în patru pași: evaluare, ofertă, lucru și raport. …” (restul la fel) | Aceeași regulă: numele e în titlul paginii și în datele structurate. |

## B. Termeni de specialitate acolo unde se alege

| # | Unde | Acum | Propunere | De ce |
|---|---|---|---|---|
| 5 | Numele serviciului în „De unde pornești?”, în subsol și în lista din formular | „Optimizare AEO și GEO” | „Apariția în ChatGPT și în căutarea AI” (titlul și H1-ul paginii păstrează „AEO și GEO”) | Un proprietar de firmă nu leagă „AEO și GEO” de ChatGPT fără să citească fraza de lângă. Atenție: numele apare și în subiectul e-mailului din formular (`src/form-rules.ts`). |
| 6 | Etichetele traseelor (RouteMap) și titlul de pe `/cum-lucrez/` | „Remediere unică” · „Remediere + abonament lunar” | Variantă: „O singură reparație” · „Reparație, apoi întreținere lunară” | „Remediere” sună clinic. Etichetele buclei („Verificare, Actualizări, Raport”) le-a ales Alex (#15) și rămân. |
| 7 | Antetul și Acasă | Meniul: „Cum lucrez”; titlul de pe Acasă: „Cum lucrăm: două trasee” | „Cum lucrez: două trasee” | Același termen peste tot; site-ul vorbește la persoana I singular. |

## C. Momentele cu miză: formularul, mulțumirea și eroarea

| # | Unde | Acum | Propunere | De ce |
|---|---|---|---|---|
| 8 | Sub lista „Serviciul de care ai nevoie” din formular | (nimic) | „Nu știi ce să alegi? Alege „Nu știu încă” și scrie-mi ce te încurcă.” | Formularul listează servicii, nu probleme; vizitatorul care a venit din „De unde pornești?” nu trebuie să țină minte numele serviciului. |
| 9 | Lângă butonul „Cere o ofertă” din formular | Doar nota despre date | Fraza de pe Acasă, deja aprobată ca ciornă: „Mă uit la site-ul tău și la ce mi-ai scris, apoi îți trimit oferta: ce lucrez, în ce ordine și ce primești. Lucrul începe doar după ce accepți oferta.” | Spune ce urmează exact în momentul în care vizitatorul ezită. Nu e text nou. |
| 10 | `/contact/multumim/` | „Mă uit la ce mi-ai scris și la site-ul tău, apoi îți trimit oferta: …” | Aceeași frază, plus termenul de răspuns **doar dacă îl confirmi** (registrul, #18): „Îți răspund în cel mult [termenul tău], pe e-mailul pe care l-ai scris.” | Fără termen, vizitatorul nu știe când să se uite în căsuță; dar promisiunea e a ta. |
| 11 | `/contact/eroare/`, primul paragraf | „Mesajul n-a plecat. Apasă Înapoi ca să-l recuperezi…” (titlul e tot „Mesajul n-a plecat”) | „Apasă Înapoi ca să-l recuperezi și încearcă din nou peste un minut, sau scrie-mi direct la:” | Titlul spune deja ce s-a întâmplat; paragraful trece direct la ce faci. |
| 12 | Contactele directe (pe `/contact/` și pe paginile de eroare) | „WhatsApp: scrie-mi pe WhatsApp” | „WhatsApp: 0724 230 051” | Repetă cuvântul; numărul spune mai mult și e același cu cel de la Telefon. |

## D. Mărunțișuri

| # | Unde | Acum | Propunere | De ce |
|---|---|---|---|---|
| 13 | Subsolul (datele firmei, varianta scurtă) | „Oraș: București” | „București” | Eticheta face rândul să arate ca un câmp de formular. |
| 14 | `/despre/` | Paragraful „Instrumente” („Astro sau React, în TypeScript … Lighthouse, axe și Playwright…”) și, în cardul de profil, lista „Unelte” | Păstrezi una dintre ele; dacă rămâne paragraful, începe cu ce câștigă clientul: „Site-urile noi le fac în Astro: se încarcă repede și n-au pluginuri de actualizat.” | Aceeași informație de două ori, scrisă pentru programatori. |

## Ce nu se schimbă
- Textele legale, întrebările frecvente ale serviciilor și fraza despre preț („Prețul, reducerea și ce include abonamentul le
  stabilim după ce mă uit la site-ul tău.”).
- Etichetele buclei lunare (#15), termenii din registrul deciziilor și titlurile paginilor (SEO).
