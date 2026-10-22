// npm run report (§10, Task 20): adună într-un singur fișier, reports/raport-final.md, ce s-a verificat:
//   - scorurile Lighthouse (mediana din 3, mobil) și rezultatul fiecărui pas qa:page, pe pagină (reports/qa/*.json);
//   - validarea schemei (pasul check-schema din același raport);
//   - linkurile rupte din dist/ (linkinator, doar linkurile interne);
//   - marcajele încă deschise (reports/placeholders.json), cu rândul din registru.
// Raportul nu se publică (reports/ e în .gitignore). Rulează după `npm run build` și după qa:page pe paginile dorite.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check } from 'linkinator';
import { REGISTRU } from '../src/placeholders.ts';

const RADACINA = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QA = join(RADACINA, 'reports', 'qa');
const IESIRE = join(RADACINA, 'reports', 'raport-final.md');

const CATEGORII = ['performance', 'accessibility', 'best-practices', 'seo'];

const qa = existsSync(QA)
  ? readdirSync(QA)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(join(QA, f), 'utf8')))
      .sort((a, b) => a.cale.localeCompare(b.cale))
  : [];

const pas = (raport, nume) => raport.pasi.find((p) => p.nume.startsWith(nume))?.stare ?? '—';

const linkuri = await check({ path: join(RADACINA, 'dist'), recurse: true, linksToSkip: ['^https?://(?!127[.]0[.]0[.]1)'] });
const rupte = linkuri.links.filter((l) => l.state === 'BROKEN');

const marcaje = JSON.parse(readFileSync(join(RADACINA, 'reports', 'placeholders.json'), 'utf8'));
const peRand = new Map();
for (const m of marcaje) peRand.set(m.nr, [...(peRand.get(m.nr) ?? []), m.fisier]);

const randuri = [
  '# Raportul final',
  '',
  `Generat: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.`,
  '',
  '## Paginile verificate cu qa:page',
  '',
  `| Pagina | qa:page | Schema | ${CATEGORII.join(' | ')} | Build |`,
  `|---|---|---|${CATEGORII.map(() => '---').join('|')}|---|`,
  ...qa.map((r) => {
    const s = r.lighthouse?.scoruri ?? {};
    return `| ${r.cale} | ${r.trece ? 'PASS' : 'FAIL'} | ${pas(r, 'check-schema')} | ${CATEGORII.map((c) => s[c] ?? '—').join(' | ')} | ${r.dist}${r.noindex ? ', noindex' : ''} |`;
  }),
  '',
  qa.length === 0 ? 'Nu există niciun raport qa:page. Rulează `npm run qa:page -- <cale>` pe fiecare pagină.' : `Pagini verificate: ${qa.length}. Pe paginile noindex, SEO sub 90 e așteptat (§1).`,
  '',
  '## Linkurile din dist/',
  '',
  rupte.length === 0 ? `Niciun link rupt (${linkuri.links.length} linkuri verificate).` : `${rupte.length} linkuri rupte:`,
  ...rupte.map((l) => `- ${l.url} (din ${l.parent ?? '?'}, ${l.status ?? 'fără răspuns'})`),
  '',
  '## Marcajele încă deschise',
  '',
  '| # | Ce lipsește | Cine | Blochează | Unde |',
  '|---|---|---|---|---|',
  ...[...peRand.entries()]
    .sort(([a], [b]) => a - b)
    .map(([nr, fisiere]) => {
      const r = REGISTRU[nr];
      return `| ${nr} | ${r.ce} | ${r.cine} | ${r.blocheaza ? 'Da' : 'Nu'} | ${fisiere.join(', ')} |`;
    }),
  '',
];

mkdirSync(dirname(IESIRE), { recursive: true });
writeFileSync(IESIRE, randuri.join('\n'));
console.log(`reports/raport-final.md: ${qa.length} pagini, ${rupte.length} linkuri rupte, ${peRand.size} rânduri de marcaje deschise`);
