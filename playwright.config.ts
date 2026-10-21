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
    // Chrome instalat pe mașină: nu descărcăm niciun browser.
    channel: 'chrome',
  },
  ...(!serverExtern && {
    webServer: {
      // Până la Task 13 (Worker + wrangler dev) servim build-ul static cu `astro preview`.
      command: `npm run build && npx astro preview --port ${PORT}`,
      url: BASE_URL,
      // Domeniul din build se suprascrie doar pentru QA local (spec 3.2).
      env: { SITE_URL: BASE_URL },
      // Un server rămas de la o rulare veche ar servi un build învechit.
      reuseExistingServer: false,
      timeout: 120_000,
    },
  }),
});
