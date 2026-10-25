import { defineConfig } from '@playwright/test';

const PORT = 8787;
const BASE_URL = `http://localhost:${PORT}`;

// `npm run qa:page` construiește și pornește singur serverul (wrangler dev sau astro preview, după caz, și dist-draft la
// QA_DIST=dist-draft), apoi rulează Playwright cu QA_SERVER_EXTERNAL=1: Lighthouse și capturile folosesc același server.
const serverExtern = Boolean(process.env.QA_SERVER_EXTERNAL);

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
  },
  projects: [
    // Toate testele, în Chrome-ul instalat pe mașină.
    { name: 'chrome', use: { channel: 'chrome' } },
    // §5.6 cere ca trenurile (SMIL și oprirea lor) să fie verificate în Chrome, Safari și Firefox: testele Acasă rulează
    // și în Firefox și WebKit (motorul Safari), aduse o dată cu `npx playwright install firefox webkit`.
    // Firefox mai ia un singur spec în plus, contact-restaurare.spec.ts: doar el restaurează formularul la reîncărcare (alegerea
    // vizitatorului nu trebuie suprascrisă de serviciul din link), deci doar acolo se poate verifica. Nu primește celelalte specuri.
    { name: 'firefox', use: { browserName: 'firefox' }, testMatch: /(home|contact-restaurare)\.spec\.ts$/ },
    { name: 'webkit', use: { browserName: 'webkit' }, testMatch: /home\.spec\.ts$/ },
  ],
  ...(!serverExtern && {
    webServer: {
      // Site-ul static și Worker-ul formularului, ca pe Cloudflare (wrangler.jsonc): /api/* ajunge la Worker.
      command: `npm run build && npx wrangler dev --port ${PORT}`,
      url: BASE_URL,
      // Domeniul din build se suprascrie doar pentru QA local (spec 3.2).
      env: { SITE_URL: BASE_URL },
      // Un server rămas de la o rulare veche ar servi un build învechit.
      reuseExistingServer: false,
      timeout: 120_000,
    },
  }),
});
