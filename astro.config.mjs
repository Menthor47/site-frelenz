import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import { inSitemap } from './src/lib/seo.ts';
import { site } from './src/site.config.ts';

const isDraft = process.env.DRAFT === '1';

export default defineConfig({
  output: 'static',
  // Domeniul vine dintr-o singură sursă: src/site.config.ts (suprascris cu SITE_URL doar pentru QA local).
  site: site.url,
  outDir: isDraft ? './dist-draft' : './dist',
  compressHTML: true,
  trailingSlash: 'always',
  // Excluderile din sitemap (paginile noindex, 404, /_test/) sunt în src/lib/seo.ts, ca să le poată testa vitest.
  integrations: [sitemap({ filter: inSitemap })],
  security: {
    // CSP stabil (nu `experimental.csp`), fără niciun domeniu extern.
    csp: true,
  },
  // Shiki folosește stiluri inline, pe care style-src din CSP le-ar bloca oricum.
  markdown: { syntaxHighlight: false },
  fonts: [
    {
      // Fontsource: woff2 se descarcă la build și se servesc de pe site (zero cereri spre alte domenii).
      provider: fontProviders.fontsource(),
      name: 'Atkinson Hyperlegible Next',
      cssVariable: '--font-sans',
      // Variabil doar pe axa de greutate, fără italic.
      weights: ['400 800'],
      styles: ['normal'],
      // latin-ext e obligatoriu pentru ș și ț (U+0218–U+021B).
      subsets: ['latin', 'latin-ext'],
      display: 'swap',
    },
  ],
  vite: {
    define: {
      __DRAFT__: JSON.stringify(isDraft),
    },
  },
});
