// Trenurile de pe harta animată de pe Acasă (§5.6, mișcarea M2 din §5.7).
//
// Alegerea: SMIL `animateMotion`, cu `begin="indefinite"` și cu traseul în atributul `path`. Scriptul îl pornește cu
// `beginElement()`, iar butonul și IntersectionObserver îl opresc pe loc cu `svg.pauseAnimations()` și îl repornesc cu
// `svg.unpauseAnimations()`. Fără bibliotecă și fără clase de pornire pentru fiecare tren. CSS `offset-path` ar fi cerut
// ca oprirea să se facă din `animation-play-state` pe fiecare tren.
// Testat manual doar în Chrome, singurul browser de pe mașina de lucru. Firefox și Safari rămân de verificat de mână
// înainte de lansare (§5.6 cere testul în toate trei).
//
// Ordinea din spec: întâi se leagă butonul, apoi apar butonul și trenurile, apoi pornește mișcarea. Toate trei se întâmplă
// doar cu `prefers-reduced-motion: no-preference`. Altfel harta rămâne statică, fără trenuri și fără buton (WCAG 2.2.2).
import { createTrainController } from '../lib/trains-controller';

export function initTrains(root: HTMLElement): void {
  const svg = root.querySelector('svg');
  const buton = root.querySelector('button');
  if (!svg || !buton || !matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

  const trenuri = createTrainController({
    play: () => svg.unpauseAnimations(),
    pause: () => svg.pauseAnimations(),
  });
  buton.addEventListener('click', () => {
    buton.textContent = trenuri.userToggle() === 'oprit' ? 'Pornește trenurile' : 'Oprește trenurile';
  });

  buton.hidden = false;
  root.classList.add('trenuri-pornite');
  for (const miscare of svg.querySelectorAll('animateMotion')) miscare.beginElement();

  // Trenurile stau cât harta e în afara ecranului; alegerea vizitatorului rămâne a lui (vezi trains-controller).
  new IntersectionObserver((intrari) => {
    for (const intrare of intrari) trenuri.visibility(intrare.isIntersecting);
  }).observe(root);
}
