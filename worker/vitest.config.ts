// Testele Worker-ului (ruling R18): vitest în Node, fără pool-ul Workers, care cere vitest 4 (proiectul are vitest 5).
// `cloudflare:email` există doar în runtime-ul Workers; aici îl înlocuiește o clasă care păstrează ce primește.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { 'cloudflare:email': fileURLToPath(new URL('./test/cloudflare-email.ts', import.meta.url)) },
  },
  test: {
    globals: true,
    include: ['worker/**/*.test.ts'],
  },
});
