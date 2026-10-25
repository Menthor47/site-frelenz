// Formularul de contact cu JavaScript (decizia 30). Trimite aceleași câmpuri ca POST-ul obișnuit, prin fetch, și la o
// eroare lasă mesajul în câmpuri, cu explicația sub buton. Fără JavaScript, formularul se trimite ca până acum.
// Tot cu JavaScript (spec metroul îmbunătățit, §4): serviciul ales din link, erorile în română sub câmp și contorul de sub Mesaj.
// Nu scrie nimic în browser: fără cookie-uri, fără localStorage, fără sessionStorage. Mesajul rămâne doar în câmpuri.
// Fișierul importă un singur modul, pur și fără DOM: `worker/links.ts` (`countLinks`, aceeași funcție pe care o folosește
// Worker-ul, deci contorul din browser și serverul numără linkurile la fel). Așa poate rula și în testele Node
// (tests/unit/contact-client.test.ts). `src/form-rules.ts` NU se importă aici: datele lui (lista serviciilor, regulile tuturor
// câmpurilor) ar intra în bundle și ar depăși bugetul de 2 KB al scriptului (spec, constrângerile globale). Regulile le
// citește scriptul din pagină, scrisă de ContactForm.astro din aceleași date: `maxlength` de pe Mesaj, `data-max-linkuri` de pe
// Mesaj și valorile nevide ale listei de servicii. Funcțiile pure de mai jos (serviciul din link, mesajele de eroare, contorul)
// nu ating DOM-ul și nici `location`: primesc tot ce le trebuie ca parametri.
import { countLinks } from '../../worker/links';

/** Unde a ajuns răspunsul Worker-ului, după redirecționarea lui. */
export type Rezultat = 'primit' | 'linkuri' | 'eroare';

const CALE_REZULTAT: Readonly<Record<string, Rezultat>> = {
  '/contact/multumim/': 'primit',
  '/contact/prea-multe-linkuri/': 'linkuri',
};

/** Orice altă pagină, inclusiv `/contact/eroare/`, e o eroare: mesajul rămâne în formular. */
export function rezultatDinCale(cale: string): Rezultat {
  return CALE_REZULTAT[cale] ?? 'eroare';
}

/** `response.url` e mereu absolut în browser; baza e doar ca un URL relativ (de ex. în teste) să nu arunce. */
const BAZA_LOCALA = 'http://localhost';

/**
 * Trimite câmpurile la `actiune` (Worker-ul), în formatul unui POST obișnuit (urlencoded). Fetch urmează redirecționarea
 * 303 a Worker-ului, deci adresa răspunsului spune unde a ajuns cererea. O eroare de rețea e tot `eroare`.
 */
export async function trimiteCererea(
  actiune: string,
  campuri: [string, string][],
  fetchFn: (url: string, init: RequestInit) => Promise<Response> = fetch,
): Promise<Rezultat> {
  try {
    const raspuns = await fetchFn(actiune, { method: 'POST', body: new URLSearchParams(campuri) });
    return rezultatDinCale(new URL(raspuns.url, BAZA_LOCALA).pathname);
  } catch {
    return 'eroare';
  }
}

/**
 * Serviciul din `?serviciu=` (§4), doar dacă e exact una dintre `optiuni` (apelantul dă valorile nevide ale listei din pagină:
 * cele șase servicii și „nu-stiu”). Contează primul `serviciu`; litere mari, spații sau cod în loc de slug nu se potrivesc, deci
 * nu aleg nimic. `cautare` e `location.search`, dat de apelant ca funcția să rămână pură.
 */
export function serviciuDinCautare(cautare: string, optiuni: readonly string[]): string | undefined {
  const serviciu = new URLSearchParams(cautare).get('serviciu');
  return serviciu !== null && optiuni.includes(serviciu) ? serviciu : undefined;
}

/** Câmpurile cu mesaj de eroare scris de noi, în loc de cel al browserului (A-08). Celelalte câmpuri sunt opționale. */
export type CampCuMesaj = 'nume' | 'email' | 'mesaj';

/**
 * Mesajul din §8 pentru un câmp invalid, sau `undefined` dacă e valid. `v` e `input.validity`; `linkuri` e numărul de
 * linkuri din Mesaj (`countLinks`; la Nume și E-mail nu contează, apelantul dă 0), iar `maxLinkuri` e pragul din regulile
 * Worker-ului (`CAMPURI.mesaj.maxLinkuri`, pe pagină în `data-max-linkuri`), ca browserul și serverul să judece la fel.
 * Amândouă sunt obligatorii: funcția nu are un prag al ei. Un câmp gol are mereu prioritate. Lungimea maximă n-are mesaj:
 * o opresc atributele `maxlength`.
 */
export function mesajEroare(
  camp: CampCuMesaj,
  v: { valueMissing: boolean; typeMismatch: boolean },
  linkuri: number,
  maxLinkuri: number,
): string | undefined {
  switch (camp) {
    case 'nume':
      return v.valueMissing ? 'Scrie-ți numele.' : undefined;
    case 'email':
      if (v.valueMissing) return 'Scrie-ți adresa de e-mail, ca să-ți pot răspunde.';
      return v.typeMismatch ? 'Adresa de e-mail pare incompletă. Verific-o, de exemplu nume@firma.ro.' : undefined;
    case 'mesaj':
      if (v.valueMissing) return 'Scrie-mi pe scurt ce te încurcă la site.';
      return linkuri > maxLinkuri ? `Mesajul are mai mult de ${maxLinkuri} linkuri. Scoate câteva și trimite din nou.` : undefined;
  }
}

/**
 * Contorul de sub Mesaj (§4): caractere și linkuri, față de limite. Limitele sunt parametri (apelantul le citește din pagină:
 * `maxlength` și `data-max-linkuri`, scrise din `CAMPURI.mesaj`). În browser, `textarea.value` folosește deja `\n`, deci
 * `length` dă aceeași lungime pe care o numără Worker-ul după ce `\r\n` a devenit `\n`.
 */
export function textContor(valoare: string, maxCaractere: number, maxLinkuri: number): string {
  return `${valoare.length} / ${maxCaractere} caractere · ${countLinks(valoare)} / ${maxLinkuri} linkuri`;
}

/** Câmpurile textuale ale formularului, în ordinea din pagină. */
function campuriText(formular: HTMLFormElement): [string, string][] {
  const campuri: [string, string][] = [];
  new FormData(formular).forEach((valoare, nume) => {
    if (typeof valoare === 'string') campuri.push([nume, valoare]);
  });
  return campuri;
}

/** Câmpurile cu mesaj de eroare, în ordinea din pagină: primul invalid primește focusul. */
const CAMPURI_CU_MESAJ: readonly CampCuMesaj[] = ['nume', 'email', 'mesaj'];

/** Un câmp cu mesaj: elementul, paragraful de eroare de sub el și `aria-describedby`-ul de dinainte de eroare (nota de sub Mesaj). */
interface Verificat {
  nume: CampCuMesaj;
  camp: HTMLInputElement | HTMLTextAreaElement;
  eroare: HTMLElement;
  nota: string | null;
}

/**
 * Leagă formularul din pagină. Serviciul din `?serviciu=` se alege la pornire, iar contorul de sub Mesaj apare și urmează
 * textul. La trimitere, câmpurile se verifică întâi: un câmp invalid primește mesajul lui din §8 sub el, iar focusul trece
 * pe primul, fără nicio cerere la Worker. Apoi, un singur trimis deodată: cât timp cererea merge, butonul rămâne apăsabil
 * dar nu trimite din nou. La succes, vizitatorul ajunge pe „Am primit cererea ta”. La eroarea Worker-ului, rămâne pe
 * pagină, cu mesajul în câmpuri, iar focusul trece pe explicația de sub buton, ca să o citească și cititoarele de ecran.
 */
export function initFormular(formular: HTMLFormElement): void {
  const buton = formular.querySelector<HTMLButtonElement>('button[type="submit"]');
  const zonaEroare = formular.querySelector<HTMLElement>('[data-eroare]');
  if (!buton || !zonaEroare) return;
  const eticheta = buton.textContent ?? '';
  let inCurs = false;

  // Mesajele de eroare sunt ale noastre (A-08), nu baloanele browserului: validarea nativă a formularului se oprește. Fără
  // JavaScript, atributul nu există, iar browserul validează ca până acum.
  formular.noValidate = true;

  // Serviciul din link: doar o valoare din listă alege ceva, orice altceva lasă „Alege un serviciu”. Lista permisă e chiar lista
  // din pagină (valorile nevide ale opțiunilor), scrisă de ContactForm.astro din `CAMPURI.serviciu.optiuni`. Se aplică doar cât
  // lista e încă pe „Alege un serviciu” (`value=""`, primul `<option>`): la o reîncărcare în Firefox sau la Înapoi fără bfcache,
  // browserul a restaurat deja formularul, iar alegerea vizitatorului (de pildă Audit SEO, după un link cu `?serviciu=seo`) nu se
  // suprascrie, ca să nu plece cererea cu alt serviciu decât cel ales, cu câmpurile scrise rămase la locul lor.
  const lista = formular.querySelector<HTMLSelectElement>('select[name="serviciu"]');
  if (lista && lista.value === '') {
    const dinLink = serviciuDinCautare(
      location.search,
      Array.from(lista.options, (optiune) => optiune.value).filter(Boolean),
    );
    if (dinLink !== undefined) lista.value = dinLink;
  }

  // Limitele Mesajului vin din pagină (`maxlength`, `data-max-linkuri`). Dacă lipsește vreuna (`maxLength` e -1, iar
  // `Number(undefined)` e NaN), contorul rămâne ascuns, iar pragul de linkuri nu oprește nimic: Worker-ul judecă oricum.
  const mesaj = formular.querySelector<HTMLTextAreaElement>('textarea[name="mesaj"]');
  const maxLinkuri = Number(mesaj?.dataset.maxLinkuri);

  // Contorul e `hidden` în HTML (fără JavaScript cifrele n-ar mai fi adevărate după tastare): îl arătăm odată cu prima cifră.
  const contor = formular.querySelector<HTMLElement>('#formular-mesaj-contor');
  if (mesaj && contor && mesaj.maxLength > 0 && maxLinkuri > 0) {
    const actualizeazaContorul = () => {
      contor.textContent = textContor(mesaj.value, mesaj.maxLength, maxLinkuri);
    };
    mesaj.addEventListener('input', actualizeazaContorul);
    actualizeazaContorul();
    contor.hidden = false;
  }

  const verificate: Verificat[] = CAMPURI_CU_MESAJ.flatMap((nume) => {
    const camp = formular.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${nume}"]`);
    const eroare = camp && formular.querySelector<HTMLElement>(`#${camp.id}-eroare`);
    return camp && eroare ? [{ nume, camp, eroare, nota: camp.getAttribute('aria-describedby') }] : [];
  });

  const mesajPentru = ({ nume, camp }: Verificat) => mesajEroare(nume, camp.validity, nume === 'mesaj' ? countLinks(camp.value) : 0, maxLinkuri);

  /**
   * Scrie mesajul sub câmp (sau îl scoate, la `undefined`). Cât e eroare, câmpul are `aria-invalid` și îl descrie și paragraful
   * de eroare, înaintea notei de dinainte; când e valid, `aria-describedby` revine la nota lui sau dispare.
   */
  const scrieMesajul = ({ camp, eroare, nota }: Verificat, text: string | undefined) => {
    eroare.textContent = text ?? '';
    eroare.hidden = text === undefined;
    if (text === undefined) camp.removeAttribute('aria-invalid');
    else camp.setAttribute('aria-invalid', 'true');
    const descris = text === undefined ? nota : [eroare.id, nota].filter(Boolean).join(' ');
    if (descris) camp.setAttribute('aria-describedby', descris);
    else camp.removeAttribute('aria-describedby');
  };

  // Un mesaj deja afișat se ține la zi la tastare (de pildă „gol” devine „incomplet”) și dispare când câmpul e valid. Înainte
  // de prima trimitere nu apare nimic: nu certăm pe nimeni cât scrie.
  for (const c of verificate) {
    c.camp.addEventListener('input', () => {
      if (!c.eroare.hidden) scrieMesajul(c, mesajPentru(c));
    });
  }

  const reseteaza = () => {
    inCurs = false;
    buton.removeAttribute('aria-disabled');
    buton.textContent = eticheta;
    formular.removeAttribute('aria-busy');
  };

  const arata = (rezultat: Exclude<Rezultat, 'primit'>) => {
    for (const mesaj of zonaEroare.querySelectorAll<HTMLElement>('[data-mesaj]')) mesaj.hidden = mesaj.dataset.mesaj !== rezultat;
    zonaEroare.hidden = false;
    zonaEroare.focus();
  };

  formular.addEventListener('submit', async (eveniment) => {
    eveniment.preventDefault();
    if (inCurs) return;
    // Explicația de sub buton e a unei trimiteri anterioare; câmpurile se verifică din nou, iar dacă vreunul e invalid cererea nu pleacă.
    zonaEroare.hidden = true;
    let primulInvalid: HTMLElement | undefined;
    for (const c of verificate) {
      const text = mesajPentru(c);
      scrieMesajul(c, text);
      if (text !== undefined && !primulInvalid) primulInvalid = c.camp;
    }
    if (primulInvalid) {
      primulInvalid.focus();
      return;
    }

    inCurs = true;
    buton.setAttribute('aria-disabled', 'true');
    buton.textContent = 'Se trimite…';
    formular.setAttribute('aria-busy', 'true');

    const rezultat = await trimiteCererea(formular.action, campuriText(formular));
    if (rezultat === 'primit') {
      location.assign('/contact/multumim/');
      return;
    }
    reseteaza();
    arata(rezultat);
  });

  // Din istoric (bfcache), pagina revine cu starea ei: butonul nu trebuie să rămână „Se trimite…”.
  addEventListener('pageshow', (eveniment) => {
    if (eveniment.persisted) reseteaza();
  });
}
