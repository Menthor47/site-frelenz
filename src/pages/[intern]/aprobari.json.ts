// dist/_intern/aprobari.json (Task 20): rutele construite, cu aprobarea și data scrisă de mână a fiecăreia, pentru
// scripts/check-launch.mjs. Ruta vine din segmentul dinamic, ca /_test/: Astro ignoră directoarele care încep cu `_`.
// `public/.assetsignore` conține `_intern`, deci fișierul nu se urcă pe Cloudflare.
import type { APIRoute, GetStaticPaths } from 'astro';
import { DRAFT } from '../../lib/env';
import { paginiConstruite } from '../../lib/routes';

export const getStaticPaths = (() => [{ params: { intern: '_intern' } }]) satisfies GetStaticPaths;

export const GET: APIRoute = async () => {
  const pagini = (await paginiConstruite(DRAFT)).map(({ cale, aprobat, data }) => ({ cale, aprobat, ...(data !== undefined && { data }) }));
  return new Response(`${JSON.stringify({ draft: DRAFT, pagini }, null, 2)}\n`, { headers: { 'Content-Type': 'application/json' } });
};
