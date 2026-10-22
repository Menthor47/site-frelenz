---
# Studiul szitrans (§4.1): se construiește doar cu acordul scris (#7) și după aprobare. Ciorna din 2026-10-22 ia faptele
# din repo-ul lui Alex (s-z-I: ANALYSIS_AND_FIXES.md, CODEBASE_AUDIT.md, index.html și sitemap.xml, decembrie 2025);
# Alex confirmă că le-a făcut el (#21). Rezultatele rămân #10. Serviciile sunt provizorii (#21): munca din repo e audit
# și corecturi, nu crearea site-ului, deci audit-seo și seo, până confirmă Alex.
slug: szitrans
titlu: "Site-ul szitrans.eu"
descriere: "Studiu de caz: site-ul szitrans.eu. Ce avea de rezolvat, ce am făcut eu, Alex Ionescu, și, unde se poate dovedi, rezultatul, cu sursa și data lui."
client: "szitrans.eu"
acord: false
aprobat: false
context: "S&Z Trading International e o firmă de transport de marfă și logistică din Málaga, care lucrează în Spania și în restul Europei. Site-ul ei, szitrans.eu, e bilingv, în engleză și spaniolă."
problema: "În decembrie 2025, site-ul arăta date care nu erau ale firmei: un număr de telefon și o adresă de e-mail provizorii, o adresă din Madrid în loc de Málaga și alt domeniu în datele structurate. La distribuire apăreau imaginea și textele generice ale platformei pe care fusese făcut. Harta site-ului nu conținea paginile noi, iar codul avea 13 erori semnalate de TypeScript și ESLint."
ceAmFacut:
  - "Am corectat numărul de telefon din meniul site-ului, pe calculator și pe telefon."
  - "Am pus datele reale ale firmei (denumirea, orașul, telefonul, e-mailul și domeniul) în datele structurate (JSON-LD) și în etichetele meta."
  - "Am înlocuit imaginea și textele de previzualizare pentru distribuire și am corectat anul înființării firmei."
  - "Am adăugat paginile noi în harta site-ului (sitemap.xml), în ambele limbi."
  - "Am redus erorile semnalate de TypeScript și ESLint de la 13 la zero."
rezultate:
  - text: "[DE COMPLETAT:#10]"
    sursa: "[DE COMPLETAT:#10]"
    data: 2026-01-01
servicii:
  - audit-seo
  - seo
serviciiDeConfirmat: "[DE COMPLETAT:#21]"
---
