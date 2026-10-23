// Trenurile de pe harta animată (Acasă) și de pe banda de sus a paginilor (§5.6, mișcarea M2 din §5.7).
//
// Alegerea: SMIL `animateMotion`, cu `begin="indefinite"` și cu traseul în atributul `path`. Scriptul îl pornește cu
// `beginElement()`, iar butonul și IntersectionObserver îl opresc pe loc cu `svg.pauseAnimations()` și îl repornesc cu
// `svg.unpauseAnimations()`. Fără bibliotecă și fără clase de pornire pentru fiecare tren. CSS `offset-path` ar fi cerut
// ca oprirea să se facă din `animation-play-state` pe fiecare tren.
// Testele e2e rulează pe Chromium, Firefox și WebKit (playwright.config.ts, §5.6 cere testul în toate trei).
//
// Ordinea din spec: întâi se leagă butonul, apoi apar butonul și trenurile, apoi pornește mișcarea. Toate trei se întâmplă
// doar cu `prefers-reduced-motion: no-preference`. Altfel harta rămâne statică, fără trenuri și fără buton (WCAG 2.2.2).
// Dacă vizitatorul cere mai puțină mișcare în timpul vizitei, trenurile se opresc și dispar, ca la o încărcare cu ea.
// Butonul își schimbă eticheta (fără `aria-pressed`), iar o zonă `aria-live` anunță schimbarea și cititoarelor de ecran
// care nu citesc din nou numele butonului care are focus.
import { createTrainController } from '../lib/trains-controller';

export function initTrains(root: HTMLElement): void {
  const svg = root.querySelector('svg');
  const buton = root.querySelector('button');
  const miscare = matchMedia('(prefers-reduced-motion: no-preference)');
  if (!svg || !buton || !miscare.matches) return;
  const anunt = root.querySelector<HTMLElement>('[data-stare-trenuri]');

  const trenuri = createTrainController({
    play: () => svg.unpauseAnimations(),
    pause: () => svg.pauseAnimations(),
  });
  buton.addEventListener('click', () => {
    const oprite = trenuri.userToggle() === 'oprit';
    buton.textContent = oprite ? 'Pornește trenurile' : 'Oprește trenurile';
    if (anunt) anunt.textContent = oprite ? 'Trenurile s-au oprit.' : 'Trenurile au pornit.';
  });

  buton.hidden = false;
  root.classList.add('trenuri-pornite');
  for (const tren of svg.querySelectorAll('animateMotion')) tren.beginElement();

  // Trenurile stau cât harta e în afara ecranului; alegerea vizitatorului rămâne a lui (vezi trains-controller).
  new IntersectionObserver((intrari) => {
    for (const intrare of intrari) trenuri.visibility(intrare.isIntersecting);
  }).observe(root);

  miscare.addEventListener('change', (e) => {
    if (e.matches) return;
    trenuri.disable();
    buton.hidden = true;
    root.classList.remove('trenuri-pornite');
  });
}
