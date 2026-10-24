// Formularul de contact cu JavaScript (decizia 30). Trimite aceleași câmpuri ca POST-ul obișnuit, prin fetch, și la o
// eroare lasă mesajul în câmpuri, cu explicația sub buton. Fără JavaScript, formularul se trimite ca până acum.
// Nu scrie nimic în browser: fără cookie-uri, fără localStorage, fără sessionStorage. Mesajul rămâne doar în câmpuri.
// Fișierul nu importă nimic, ca să poată rula și în testele Node (tests/unit/contact-client.test.ts).

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

/** Câmpurile textuale ale formularului, în ordinea din pagină. */
function campuriText(formular: HTMLFormElement): [string, string][] {
  const campuri: [string, string][] = [];
  new FormData(formular).forEach((valoare, nume) => {
    if (typeof valoare === 'string') campuri.push([nume, valoare]);
  });
  return campuri;
}

/**
 * Leagă formularul din pagină. Un singur trimis deodată: cât timp cererea merge, butonul rămâne apăsabil dar nu trimite
 * din nou. La succes, vizitatorul ajunge pe „Am primit cererea ta”. La eroare, rămâne pe pagină, cu mesajul în câmpuri,
 * iar focusul trece pe explicație, ca să o citească și cititoarele de ecran.
 */
export function initFormular(formular: HTMLFormElement): void {
  const buton = formular.querySelector<HTMLButtonElement>('button[type="submit"]');
  const zonaEroare = formular.querySelector<HTMLElement>('[data-eroare]');
  if (!buton || !zonaEroare) return;
  const eticheta = buton.textContent ?? '';
  let inCurs = false;

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
    inCurs = true;
    buton.setAttribute('aria-disabled', 'true');
    buton.textContent = 'Se trimite…';
    formular.setAttribute('aria-busy', 'true');
    zonaEroare.hidden = true;

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
