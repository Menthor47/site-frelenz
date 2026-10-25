// Trenurile de pe harta animată (Acasă) și de pe banda de sus a paginilor (§5.6, mișcarea M2 din §5.7).
//
// Alegerea: SMIL `animateMotion`, cu `begin="indefinite"` și cu traseul în atributul `path`. Scriptul îl pornește cu
// `beginElement()`, iar butonul și IntersectionObserver îl opresc pe loc cu `svg.pauseAnimations()` și îl repornesc cu
// `svg.unpauseAnimations()`. Fără bibliotecă și fără clase de pornire pentru fiecare tren. CSS `offset-path` ar fi cerut
// ca oprirea să se facă din `animation-play-state` pe fiecare tren.
// Testele e2e ale hărții de pe Acasă rulează pe Chromium, Firefox și WebKit (playwright.config.ts, §5.6 cere testul în toate
// trei). Calea benzii de sus (pragul de 48rem, trecerea peste el) are teste doar în Chromium (tests/e2e/telefon.spec.ts).
//
// Ordinea din spec: întâi se leagă butonul, apoi apar butonul și trenurile, apoi pornește mișcarea. Toate trei se întâmplă
// doar cu `prefers-reduced-motion: no-preference`. Altfel harta rămâne statică, fără trenuri și fără buton (WCAG 2.2.2).
// Dacă vizitatorul cere mai puțină mișcare în timpul vizitei, trenurile se opresc și dispar, ca la o încărcare cu ea.
// Butonul își schimbă eticheta (fără `aria-pressed`), iar o zonă `aria-live` anunță schimbarea și cititoarelor de ecran
// care nu citesc din nou numele butonului care are focus.
//
// Banda de sus se ascunde sub 48rem (metro.css; spec metroul îmbunătățit, §5), deci trenurile ei pornesc doar de la 48rem:
// cât timp ecranul e mai îngust nu se leagă butonul, nu se pune clasa de pornire și nu se cheamă `beginElement()`, ca SMIL
// să nu meargă pe nevăzute. Dacă ecranul se lărgește (tabletă rotită), pornesc atunci, o singură dată. Dacă se îngustează
// la loc, trenurile se opresc și butonul se ascunde; peste prag se reiau. Harta de pe Acasă nu stă în bandă și n-are prag.
import { createTrainController, type ControllerTrenuri } from '../lib/trains-controller';

export function initTrains(root: HTMLElement): void {
  const svg = root.querySelector('svg');
  const buton = root.querySelector('button');
  const miscare = matchMedia('(prefers-reduced-motion: no-preference)');
  if (!svg || !buton || !miscare.matches) return;
  const anunt = root.querySelector<HTMLElement>('[data-stare-trenuri]');

  // Pragul în rem, ca în metro.css: aceeași lățime care ascunde banda lasă și trenurile să pornească.
  const latime = root.classList.contains('harta--banda') ? matchMedia('(min-width: 48rem)') : undefined;
  const incape = () => latime === undefined || latime.matches;

  let trenuri: ControllerTrenuri | undefined;
  let pePagina = true;
  let dezactivate = false;

  const porneste = () => {
    const controller = createTrainController({
      play: () => svg.unpauseAnimations(),
      pause: () => svg.pauseAnimations(),
    });
    buton.addEventListener('click', () => {
      const oprite = controller.userToggle() === 'oprit';
      buton.textContent = oprite ? 'Pornește trenurile' : 'Oprește trenurile';
      if (anunt) anunt.textContent = oprite ? 'Trenurile s-au oprit.' : 'Trenurile au pornit.';
    });

    buton.hidden = false;
    root.classList.add('trenuri-pornite');
    // `trenuri` se setează înainte de `beginElement()`: dacă acesta ar arunca, o trecere ulterioară peste prag nu mai pornește
    // a doua oară (n-ar mai lega încă un ascultător pe buton).
    trenuri = controller;
    for (const tren of svg.querySelectorAll('animateMotion')) tren.beginElement();

    // Trenurile stau cât harta e în afara ecranului; alegerea vizitatorului rămâne a lui (vezi trains-controller).
    new IntersectionObserver((intrari) => {
      for (const intrare of intrari) pePagina = intrare.isIntersecting;
      controller.visibility(pePagina && incape());
    }).observe(root);
  };

  if (incape()) porneste();

  // Ecranul trece pragul: sub el trenurile stau și butonul dispare, peste el își revin.
  // Prima trecere peste prag le și pornește, dacă pagina s-a încărcat pe ecran îngust.
  latime?.addEventListener('change', () => {
    if (dezactivate) return;
    if (!trenuri) {
      if (incape()) porneste();
      return;
    }
    buton.hidden = !incape();
    trenuri.visibility(pePagina && incape());
  });

  miscare.addEventListener('change', (e) => {
    if (e.matches) return;
    dezactivate = true;
    trenuri?.disable();
    buton.hidden = true;
    root.classList.remove('trenuri-pornite');
  });
}
