// Imaginile Open Graph (§6.2), câte una pentru fiecare pagină construită (src/lib/routes.ts), la `/og/<cale>.png`.
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { DRAFT } from '../../lib/env';
import { imagineOg } from '../../lib/og';
import { ogPentru, paginiConstruite } from '../../lib/routes';

export const getStaticPaths = (async () =>
  (await paginiConstruite(DRAFT)).map((p) => ({
    params: { cale: ogPentru(p.cale).slice('/og/'.length, -'.png'.length) },
    props: { titlu: p.titlu, grup: p.grup },
  }))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) =>
  // Copia într-un Uint8Array nou are un ArrayBuffer propriu, cum cere `Response`.
  new Response(new Uint8Array(await imagineOg(props)), { headers: { 'Content-Type': 'image/png' } });
