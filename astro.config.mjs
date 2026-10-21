import { defineConfig } from 'astro/config';

const isDraft = process.env.DRAFT === '1';

export default defineConfig({
  output: 'static',
  // Provizoriu; Task 2 îl înlocuiește cu `site.url` din src/site.config.ts.
  site: 'https://site-provizoriu.example',
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
