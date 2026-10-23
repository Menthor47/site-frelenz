# Suprafețe stratificate: design

Data: 2026-10-23. Stare: propus pentru revizuire. Valorile implicite de la secțiunea 7 au fost propuse în conversație; confirmarea lor se face la revizuirea acestui document.

Acest document completează specificația principală (`2026-10-21-site-alex-ionescu-design.md`) și o modifică doar acolo unde spune explicit. Specificația principală se actualizează după aprobarea planului de implementare.

---

## 1. Obiectiv

Conținutul de sub banda de sus are acum un singur ton, alb pe alb, și arată ca o listă de text. Propunerea: fundal de conținut ușor rece, iar fiecare secțiune de conținut devine un card alb cu contur fin. Structura paginii devine vizibilă fără să schimbe textul, ierarhia sau ordinea informației.

Antetul, banda de sus, harta, butonul de oprire și plăcuța H1 rămân așa cum au fost decise (deciziile 25, 26 și 28).

## 2. Ce nu se schimbă

- Antetul întunecat, banda întunecată, harta de metrou, butonul „Oprește trenurile” (culoarea și dimensiunea aprobate în decizia 28).
- Plăcuța H1-ului albă pe banda întunecată (decizia 25).
- Logo-ul cu virgula albastră (decizia 19).
- Fără buton „Cere o ofertă” în antetul paginii Acasă; fără antet lipicios; fără element „Acasă” în meniu (spec. §3.3).
- Subsolul, cu culorile liniilor pe linkurile de servicii (valoarea implicită, D4).
- Textul paginilor, cu o singură excepție: răspunsul la „Afișezi prețuri?” (D5), care se aplică doar după aprobarea lui Alex.
- Validarea formularului, ordinea câmpurilor în DOM, Worker-ul și paginile de răspuns.
- Paginile legale, 404 și paginile de răspuns ale formularului.

## 3. Tokenuri noi

| Token | Valoare | Folosire | Contrast |
|---|---|---|---|
| `--suprafata` | `#E9EEF5` | fundalul conținutului sub bandă | ink `#14161A` pe el: 15,54:1; față de alb: 1,17:1 |
| `--card` | `#FFFFFF` | fundalul cardurilor | — |
| `--card-contur` | `#D5DCE6` | conturul de 1px al cardurilor | față de alb: 1,38:1 |

Nu se folosește `#F8FAFC`: față de alb are 1,05:1, adică nu se vede.

Tinturile existente rămân: `#D9E4F7` (decizia 26) e fundalul benzii de trasee de pe Acasă, al benzilor de îndemn de pe paginile pe suprafață (`Indemn`), al benzii de trasee de pe `/cum-lucrez/` și al fișei de pe `/proiecte/acest-site/`; `--tint-blue` rămâne în celelalte locuri.

## 4. Regulile cardurilor

- Fiecare secțiune de conținut cu titlu H2 devine un card: fundal `--card`, contur de 1px `--card-contur`, colțuri drepte, fără umbră, padding de 24–32px.
- Cardurile stau la 24px distanță unul de altul. Distanța și paddingurile sunt în rem (1,5rem între carduri, 1,5rem sau 2rem de padding), deci cresc odată cu textul (scalarea textului, WCAG); cifrele de 24–32px sunt la mărimea implicită.
- Titlurile de secțiune rămân în afara cardului doar dacă ele sunt titlul întregii pagini (H1). Titlurile H2 rămân în interiorul cardului.
- Excepții, care își păstrează fundalul: banda de trasee de pe Acasă, banda de îndemn albastră, subsolul și banda întunecată de sus.
- Interzis, ca în spec. §5.1: carduri colorate identice, umbre, gradiente. Cardurile albe cu contur subțire nu sunt interzise.

## 5. Pe pagini

**Acasă**
- Sub banda întunecată, fundalul paginii este `--suprafata`.
- „De unde pornești?” devine un singur card cu lista de rânduri, în aceeași formă.
- Banda de trasee rămâne `#D9E4F7` (decizia 26), pe toată lățimea.
- Întrebările frecvente devin un singur card, cu cele cinci întrebări separate de linii.
- Banda albastră de îndemn rămâne neschimbată.

**Servicii** (pagina cu lista celor șase servicii)
- Fiecare serviciu devine un card. Pe desktop sunt două coloane; pe telefon, o coloană.
- În cardul fiecărui serviciu: titlul, propoziția-problemă, lista scurtă „Ce primești”, și un singur link „Vezi serviciul →” (D2).
- Bara din stânga, de 4px, are culoarea grupului: albastru, verde, roșu, și pentru construcție culoarea galbenă stabilită prin decizia R2 (D3).

**Paginile de serviciu** (cele șase)
- Fiecare secțiune cu H2 este un card: „Pentru cine e” și „Semne că ai nevoie” rămân alături într-un singur card, ca acum.
- Ordinea secțiunilor, banda de sus, „Un singur îndemn” și „Servicii înrudite” nu se schimbă.

**Cum lucrez**
- Harta cu cei patru pași rămâne în banda ei de culoare.
- Secțiunile de text, inclusiv cele două formate, devin carduri.

**Despre**
- Pe desktop, două coloane. În stânga: cardurile „Cine sunt”, „Experiență”, „Instrumente”.
- În dreapta: un card de profil cu numele, rolul, locul, lista de unelte din „Instrumente” și un link către datele firmei de pe pagina Contact.
- Fotografia apare doar când există una reală. Fără cadru gol până atunci (spec. §4.5 și §6.3; D6).

**Contact**
- Pe desktop, două coloane. În stânga: un card cu formularul. În dreapta: un card cu contactul direct.
- În formular, câmpurile scurte stau câte două pe rând, în această ordine: Nume și E-mail; Telefon și Firmă; Adresa site-ului și Serviciu. Mesajul ocupă rândul întreg, iar butonul vine sub el.
- Ordinea din DOM rămâne cea din formular, deci și ordinea de focus.
- Sub cardul de contact rămâne secțiunea „Date de identificare” (spec. §3.3 și decizia 18). Nu se elimină.
- Validarea, atributele HTML și Worker-ul nu se schimbă.

## 6. Componente și stiluri

- Clasa globală `.carte` în `base.css`: fundal, contur și padding. Nu setează margini: distanța de 1,5rem dintre carduri o stabilește layoutul fiecărei pagini, iar regula globală `.carte > :last-child { margin-bottom: 0 }` din `base.css` scoate marginea de jos a ultimului element din card. Nu există o componentă nouă pentru cadrul de card.
- Clasa `.serviciu-card` pentru cardul de serviciu din lista de pe Servicii, cu bara stângă de 4px.
- Grila de două coloane pentru contact și pentru Despre, în CSS-ul paginii respective.
- Cardul de profil pentru Despre, fără imagine până când există una.

## 7. Decizii și valorile implicite

Valorile de mai jos sunt cele propuse. Revizuirea documentului le confirmă sau le schimbă.

- **D1 Suprafața:** `#E9EEF5` (implicit). Alternativă: `#E2E8F0`, cu 1,23:1 față de alb, dacă se dorește un contrast mai puternic.
- **D2 Servicii:** un singur link pe card (implicit), pentru că specificația cere o singură acțiune pe paginile de serviciu (§4.4). Alternativă: un al doilea buton „Cere o ofertă” pe fiecare card.
- **D3 Bara stângă:** 4px în culoarea grupului (implicit). Pentru construcție se folosește galbenul din harta de metrou, după decizia R2 despre galbenul liniilor. Până atunci se folosește culoarea existentă din tokenuri.
- **D4 Subsolul:** linkurile de servicii rămân colorate (implicit). Ele au 4,7–5,2:1 pe negru, adică trec AA pentru text. Alternativa este un punct colorat și linkuri albe.
- **D5 Răspunsul despre prețuri:** textul nou nu se aplică până la aprobarea lui Alex. Textul propus este cel din auditul primit, reformulat de noi și trimis separat pentru aprobare.
- **D6 Fotografia de pe Despre:** nu există deocamdată, deci cardul de profil apare fără ea (implicit).

## 8. Testare

- **Unit:**
  - fiecare secțiune cu H2 din paginile modificate este într-un `.carte`;
  - ordinea câmpurilor formularului nu se schimbă;
  - contrastul noilor tokenuri, în `tests/unit/contrast.test.ts`;
  - pagina Despre nu conține `<img>`, cât timp nu există o fotografie aprobată.
- **E2E:** formularul (trimitere, capcană, mesaj lung), butonul „Oprește trenurile”, subtitlul și butonul de pe Acasă, și scriptul unic al trenurilor pe pagina de contact.
- **Vizual:** 1440px, 375px și 320px cu text mărit la 200%, pentru paginile modificate.
- **Accesibilitate:** verificare axe pe paginile modificate.

## 9. Riscuri

- **Densitate:** prea multe carduri pot obosi. Se verifică la revizuire pe pagina Servicii și pe Contact.
- **Contrast:** delimitarea cardurilor este dată de contur (1,38:1), nu de fundal. Dacă se alege D1 cu `#E2E8F0`, delimitarea devine mai clară.
- **Focus:** grila de pe Contact nu schimbă ordinea DOM, deci nici ordinea de focus.
- **Despre fără fotografie:** cardul de profil apare fără imagine. Asta e intenționat și respectă regula fără cadru gol.

## 10. Pași următori

1. Revizuirea acestui document de către Alex, cu confirmarea sau schimbarea valorilor de la secțiunea 7.
2. Planul de implementare, scris după aprobarea documentului.
3. Actualizarea specificației principale (§2, §4.4, §4.5, §5.1, §5.2) după aprobarea planului.
4. Implementarea, testarea și verificarea vizuală.
