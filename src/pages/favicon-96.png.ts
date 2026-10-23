// Favicon-ul PNG de 96×96 (§5.4), la /favicon-96.png, pentru programele care nu citesc favicon.svg (src/lib/iconite.ts).
import type { APIRoute } from 'astro';
import { faviconPng } from '../lib/iconite';

export const GET: APIRoute = () => new Response(faviconPng(), { headers: { 'Content-Type': 'image/png' } });
