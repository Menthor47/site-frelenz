import { defineConfig } from 'astro/config';
import { site } from './src/site.config.ts';

const isDraft = process.env.DRAFT === '1';

export default defineConfig({
  output: 'static',
  // Domeniul vine dintr-o singură sursă: src/site.config.ts (suprascris cu SITE_URL doar pentru QA local).
  site: site.url,
  outDir: isDraft ? './dist-draft' : './dist',
  compressHTML: true,
  trailingSlash: 'always',
  security: {
    // CSP stabil (nu `experimental.csp`), fără niciun domeniu extern.
    csp: true,
  },
  // Shiki folosește stiluri inline, pe care style-src din CSP le-ar bloca oricum.
  markdown: { syntaxHighlight: false },
  vite: {
    define: {
      __DRAFT__: JSON.stringify(isDraft),
    },
  },
});
