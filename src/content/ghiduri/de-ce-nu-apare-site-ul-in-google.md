---
slug: de-ce-nu-apare-site-ul-in-google
titlu: "De ce nu apare site-ul meu în Google"
descriere: "De ce poate lipsi site-ul tău din Google: Google nu l-a găsit, nu poate citi paginile sau nu le vede ca un răspuns bun. Și cum verifici fiecare motiv, pe rând."
raspuns: "Site-ul tău poate lipsi din Google din câteva motive: Google nu l-a găsit încă, nu poate citi paginile sau i se cere să nu le indexeze, paginile nu răspund la ce caută oamenii ori site-ul are probleme tehnice. Le poți verifica pe rând."
publicat: 2026-10-22
actualizat: 2026-10-22
aprobat: false
serviciuLegat: audit-seo
---

## Google nu știe încă de site

Un site nou sau o pagină nouă nu apare imediat. Google descoperă paginile urmând linkurile de pe alte pagini și citind sitemap-ul site-ului. Dacă niciun alt site nu trimite spre al tău și n-ai trimis sitemap-ul în Google Search Console, Google poate să nu știe că site-ul există.

Ce poți face: adaugă site-ul în Google Search Console, trimite sitemap-ul și cere indexarea paginii principale, cu instrumentul de inspectare a adresei URL.

## Google nu poate citi paginile sau i se cere să nu le indexeze

Uneori chiar site-ul îl oprește pe Google, fără să știe proprietarul:

- o etichetă `noindex` rămasă din perioada în care site-ul era în lucru îi cere lui Google să nu arate pagina în rezultate;
- un fișier robots.txt care blochează tot site-ul îl împiedică pe Google să citească paginile, deci nu are ce înțelege din ele;
- o parolă pusă pe site, care n-a mai fost scoasă, ține și vizitatorii, și Google afară.

`noindex` și robots.txt nu sunt același lucru: primul cere ca pagina să nu apară în rezultate, al doilea doar oprește citirea ei. În Google Search Console, raportul de indexare a paginilor arată ce pagini nu sunt indexate și motivul dat de Google.

## Paginile nu răspund la ce caută oamenii

Google poate să cunoască site-ul și totuși să nu-l arate. El arată paginile pe care le consideră cel mai bun răspuns la căutare. Dacă oamenii caută „instalator în Cluj”, iar pagina ta are doar un salut și o fotografie, Google nu are de unde să știe că ea răspunde la căutarea lor.

Titlurile paginilor, textul de pe ele și felul în care sunt legate între ele îi spun lui Google despre ce e fiecare pagină.

## Site-ul are probleme tehnice

Și un site cunoscut de Google poate fi încurcat de probleme pe care vizitatorul nu le vede imediat:

- pagini care dau erori sau nu se încarcă atunci când le cere Google;
- același text pe mai multe adrese (cu și fără www, cu http și cu https): Google alege o singură adresă pe care s-o arate, iar uneori nu e cea pe care o vrei tu.

## Cum verifici singur

- Caută în Google `site:` urmat de adresa site-ului tău, de exemplu `site:exemplu.ro`. Rezultatele arată o parte din paginile pe care Google le are; dacă nu apare niciuna, probabil că site-ul nu e indexat.
- În Google Search Console, raportul de indexare a paginilor arată ce pagini lipsesc și de ce, iar instrumentul de inspectare a adresei URL îți spune dacă o anumită pagină e indexată.
- Caută în Google exact ce ar căuta un client al tău și vezi ce pagini apar în locul alor tale.

## Când merită un audit

Dacă ai verificat și tot nu știi de ce nu apare site-ul, eu, Alex Ionescu, fac un [audit SEO](/servicii/audit-seo/): găsesc ce îl încurcă pe Google și în ce ordine merită reparat, iar tu primești totul într-un raport scris, pe înțeles.
