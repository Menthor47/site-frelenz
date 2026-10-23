// Iconița Apple de 180×180 (§5.4), la /apple-touch-icon.png, pentru ecranul de start al iPhone-ului (src/lib/iconite.ts).
import type { APIRoute } from 'astro';
import { iconitaApple } from '../lib/iconite';

export const GET: APIRoute = () => new Response(iconitaApple(), { headers: { 'Content-Type': 'image/png' } });
