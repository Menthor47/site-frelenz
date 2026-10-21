import { expect, test } from '@playwright/test';

// `security.csp: true` pune hash-uri pe stilurile inline. Stilul <Font> și fonturile trebuie să treacă de CSP.
test('CSP nu blochează stilurile și fonturile, iar ambele subseturi se încarcă', async ({ page, baseURL }) => {
  const mesaje: string[] = [];
  page.on('console', (m) => {
    if (/content security policy|refused to/i.test(m.text())) mesaje.push(m.text());
  });
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  const cereriExterne: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(`${baseURL}/`) && !r.url().startsWith('data:')) cereriExterne.push(r.url());
  });

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const violari = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
  expect(violari).toEqual([]);
  expect(mesaje).toEqual([]);
  expect(cereriExterne).toEqual([]);

  // Textul din Acasă are litere din ambele subseturi (latin: a, e; latin-ext: ă, ș, ț), deci ambele fișiere se încarcă.
  const incarcate = await page.evaluate(() =>
    [...document.fonts]
      .filter((f) => f.family.startsWith('Atkinson Hyperlegible Next') && !f.family.includes('fallback'))
      .map((f) => f.status),
  );
  expect(incarcate).toEqual(['loaded', 'loaded']);
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Atkinson Hyperlegible Next');
});
