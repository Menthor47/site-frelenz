/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getViteConfig } from 'astro/config';

// Cache-ul de module al Vitest (`fsModuleCache`, pornit implicit) păstrează pe disc componentele Astro compilate. Cheia lui nu
// ține seama de `astro.config.mjs`, deci după o schimbare de configurație (de pildă `scopedStyleStrategy` sau `vite.build`) testele
// puteau rula pe compilări vechi, cu stilurile de dinainte. Calea cache-ului poartă un hash al conținutului configurației: o
// configurație schimbată înseamnă un director nou, deci compilări noi. Directoarele vechi rămân în `node_modules`, care nu intră
// în repo; se șterg odată cu el.
const hashConfigAstro = createHash('sha256').update(readFileSync(new URL('./astro.config.mjs', import.meta.url))).digest('hex').slice(0, 12);

export default getViteConfig({
  test: {
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    fsModuleCachePath: `node_modules/.vitest-cache/astro-${hashConfigAstro}`,
  },
});
