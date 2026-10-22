// llms.txt (§6.5), generat la build din colecții, cu aceleași reguli de publicare ca paginile (src/lib/llms.ts).
import type { APIRoute } from 'astro';
import { DRAFT } from '../lib/env';
import { llmsTxt } from '../lib/llms';

export const GET: APIRoute = async () => new Response(await llmsTxt(DRAFT), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
