import { site } from '../../src/site.config';
import { inSitemap, robotsTxt, titluPagina } from '../../src/lib/seo';

test('titlul de pe Acasă', () =>
  expect(titluPagina('Consultant SEO din București')).toBe('Consultant SEO din București – Alex Ionescu'));

test('titlul AEO/GEO rămâne fără sufix', () =>
  expect(titluPagina('Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)')).toBe(
    'Optimizare pentru ChatGPT și căutarea AI (AEO și GEO)',
  ));

test('limita de 60 de caractere include sufixul', () => {
  const sufix = ' – Alex Ionescu';
  expect(sufix).toHaveLength(15);
  // 45 + 15 = 60: încape, deci primește sufixul.
  const incape = 'a'.repeat(45);
  expect(titluPagina(incape)).toBe(incape + sufix);
  expect(titluPagina(incape)).toHaveLength(60);
  // 46 + 15 = 61: nu încape, deci sufixul dispare.
  const nuIncape = 'a'.repeat(46);
  expect(titluPagina(nuIncape)).toBe(nuIncape);
});

test('sufixul e despărțit printr-o liniuță lungă (–), nu prin cratimă', () => {
  expect(titluPagina('Servicii')).toContain(' – ');
});

test.each(['/contact/multumim/', '/contact/eroare/', '/contact/prea-multe-linkuri/', '/404/', '/_test/', '/_test/diacritice/'])(
  'sitemap-ul exclude %s',
  (cale) => {
    expect(inSitemap(`${site.url}${cale}`)).toBe(false);
  },
);

test.each(['/', '/servicii/', '/servicii/seo/', '/contact/', '/despre/', '/ghiduri/', '/proiecte/'])(
  'sitemap-ul păstrează %s',
  (cale) => {
    expect(inSitemap(`${site.url}${cale}`)).toBe(true);
  },
);

test('filtrul sitemap-ului nu depinde de domeniu', () => {
  expect(inSitemap('https://alt-domeniu.example/contact/multumim/')).toBe(false);
  expect(inSitemap('https://alt-domeniu.example/contact/')).toBe(true);
});

test('robots.txt permite tot și trimite la sitemap', () => {
  const linii = robotsTxt().split('\n');
  expect(linii).toContain('User-agent: *');
  expect(linii).toContain('Allow: /');
  expect(linii).toContain(`Sitemap: ${site.url}/sitemap-index.xml`);
  expect(linii.some((l) => /^Disallow:\s*\S/.test(l))).toBe(false);
});

test('robots.txt se încheie cu un rând nou', () => {
  expect(robotsTxt().endsWith('\n')).toBe(true);
});
