import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { gzipSync } from 'node:zlib';
import {
  adresareFormala,
  axe,
  cereriExterne,
  cssPePagina,
  elementeCareDepasesc,
  expect,
  faraDerulareOrizontala,
  incalcariCsp,
  test,
  zoneAtingereMici,
} from './helpers';

// Poarta `qa:page` trebuie să și pice când ceva nu e în regulă. Aici verificăm ajutoarele pe pagini făcute pentru test,
// servite prin `page.route` (fără să atingă site-ul). `test` din helpers pornește ascultarea CSP și a cererilor din prima navigare.

const STIL_DE_BAZA = '*{box-sizing:border-box}body{margin:0}';
const pagina = (corp: string, cap = '') =>
  `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Test</title><style>${STIL_DE_BAZA}</style>${cap}</head><body><main>${corp}</main></body></html>`;

/** Servește `html` la `/qa-test/` și navighează acolo. */
async function deschide(page: import('@playwright/test').Page, html: string, headers: Record<string, string> = {}) {
  await page.route('**/qa-test/', (route) => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', headers, body: html }));
  await page.goto('/qa-test/');
}

test.describe('faraDerulareOrizontala', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('pagina care încape, încape', async ({ page }) => {
    await deschide(page, pagina('<p>Text scurt.</p>'));
    expect(await faraDerulareOrizontala(page)).toBe(true);
    expect(await elementeCareDepasesc(page)).toEqual([]);
  });

  test('un element mai lat decât ecranul e prins și numit', async ({ page }) => {
    await deschide(page, pagina('<div class="lat" style="width:500px;height:10px">x</div>'));
    expect(await faraDerulareOrizontala(page)).toBe(false);
    expect((await elementeCareDepasesc(page)).join('\n')).toContain('div.lat ajunge la 500px (pagina are 320px)');
  });

  test('un overflow-x: hidden pus pe <body> nu ascunde depășirea', async ({ page }) => {
    await deschide(page, pagina('<div style="width:500px;height:10px">x</div>', '<style>body{overflow-x:hidden}</style>'));
    expect(await faraDerulareOrizontala(page)).toBe(false);
  });

  test('un tabel într-un părinte care se derulează nu strică pagina', async ({ page }) => {
    await deschide(page, pagina('<div style="overflow-x:auto"><table style="width:900px"><tr><td>x</td></tr></table></div>'));
    expect(await faraDerulareOrizontala(page)).toBe(true);
    expect(await elementeCareDepasesc(page)).toEqual([]);
  });
});

test.describe('zoneAtingereMici', () => {
  const stil = '<style>.m{display:inline-block;width:30px;height:30px}.ok{display:inline-block;width:44px;height:44px}</style>';

  test('prinde butoane, câmpuri, linkuri din meniu, din firimituri și din subsol, .buton-cta și rândurile din „De unde pornești?” sub 44px', async ({ page }) => {
    await deschide(
      page,
      pagina(
        `<header><nav><a class="m" href="/a/">Meniu</a></nav></header>
         <nav class="firimituri"><ol><li><a class="m" href="/">Acasă</a></li></ol></nav>
         <button class="m">Trimite</button><input class="m" name="nume"><select class="m"><option>x</option></select><textarea class="m" name="mesaj"></textarea>
         <a class="buton-cta m" href="/contact/">Cere o ofertă</a>
         <ul><li class="linie-rand"><a class="m" href="/b/">Rând</a></li></ul>
         <footer><a class="m" href="/c/">Subsol</a></footer>`,
        stil,
      ),
    );
    const mici = (await zoneAtingereMici(page)).join('\n');
    for (const asteptat of ['a.m „Meniu” 30×30', 'a.m „Acasă” 30×30', 'button.m „Trimite” 30×30', 'input.m[nume] 30×30', 'select.m 30×30', 'textarea.m[mesaj] 30×30', 'a.buton-cta.m „Cere o ofertă” 30×30', 'a.m „Rând” 30×30', 'a.m „Subsol” 30×30']) {
      expect(mici).toContain(asteptat);
    }
  });

  test('44×44 trece, la fel un câmp ascuns cu type=hidden', async ({ page }) => {
    await deschide(
      page,
      pagina('<button class="ok">Trimite</button><footer><a class="ok" href="/c/">Subsol</a></footer><input type="hidden" name="x">', stil),
    );
    expect(await zoneAtingereMici(page)).toEqual([]);
  });

  test('ascunsul nu se numără: display:none, scos din pagină, de 1px, aria-hidden (câmpul-capcană) și linkul de salt dinainte de focus', async ({ page }) => {
    await deschide(
      page,
      pagina(
        `<a class="sari-test" href="#c" style="position:absolute;top:0;left:0;transform:translateY(-110%);padding:4px">Sari</a>
         <button class="m" style="display:none">a</button>
         <input class="m" name="afara" style="position:absolute;left:-9999px">
         <input class="m" name="unpixel" style="width:1px;height:1px;padding:0;border:0">
         <div aria-hidden="true"><input class="m" name="capcana" tabindex="-1"></div>
         <footer><a href="#c" class="m" style="visibility:hidden">x</a></footer>`,
        stil,
      ),
    );
    expect(await zoneAtingereMici(page)).toEqual([]);
  });

  test('linkul din rândul de text nu se numără, dar linkul singur din subsol da', async ({ page }) => {
    await deschide(
      page,
      pagina(
        '<footer><p>Fără cookie-uri. <a href="/x/">Vezi cum e făcut</a>.</p><ul><li><a href="/y/">Singur</a></li></ul></footer>',
      ),
    );
    const mici = (await zoneAtingereMici(page)).join('\n');
    expect(mici).not.toContain('Vezi cum e făcut');
    expect(mici).toContain('„Singur”');
  });
});

test.describe('axe', () => {
  test('pagina curată nu dă încălcări', async ({ page }) => {
    await deschide(page, pagina('<h1>Titlu</h1><p>Text.</p>'));
    expect(await axe(page)).toEqual([]);
  });

  test('o imagine fără text alternativ e prinsă, cu regula și elementul', async ({ page }) => {
    await deschide(page, pagina('<h1>Titlu</h1><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" id="poza">'));
    const incalcari = await axe(page);
    expect(incalcari.join('\n')).toContain('image-alt');
    expect(incalcari.join('\n')).toContain('#poza');
  });

  test('contrastul prea mic e prins', async ({ page }) => {
    await deschide(page, pagina('<h1>Titlu</h1><p style="color:#bbb;background:#fff">Text greu de citit.</p>'));
    expect((await axe(page)).join('\n')).toContain('color-contrast');
  });
});

test.describe('incalcariCsp și cereriExterne', () => {
  test('un script inline blocat de CSP e înregistrat din prima navigare', async ({ page }) => {
    await deschide(page, pagina('<p>x</p><script>window.ruleaza = 1</script>'), { 'content-security-policy': "script-src 'none'" });
    const incalcari = (await incalcariCsp(page)).join('\n');
    expect(incalcari).toContain('script-src');
  });

  test('fără CSP încălcat, lista e goală', async ({ page }) => {
    await deschide(page, pagina('<p>x</p>'), { 'content-security-policy': "script-src 'none'" });
    expect(await incalcariCsp(page)).toEqual([]);
  });

  test('încălcările de pe prima pagină rămân după o a doua navigare', async ({ page }) => {
    await deschide(page, pagina('<script>1</script>'), { 'content-security-policy': "script-src 'none'" });
    await page.route('**/alta/', (route) => route.fulfill({ contentType: 'text/html', body: pagina('<p>curat</p>') }));
    await page.goto('/alta/');
    expect((await incalcariCsp(page)).join('\n')).toContain('script-src');
  });

  test('o cerere spre alt domeniu e prinsă, una spre site nu', async ({ page }) => {
    await page.route('https://exemplu.example/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: 'a{}' }));
    await deschide(page, pagina('<p>x</p>', '<link rel="stylesheet" href="https://exemplu.example/s.css">'));
    expect(await cereriExterne(page)).toEqual(['https://exemplu.example/s.css']);
  });
});

test.describe('cssPePagina', () => {
  // Un server adevărat, nu `page.route`: `cssPePagina` cere fișierele CSS prin `page.request`, care nu trece prin `route`.
  const LEGAT = 'p{color:red}'.repeat(10); // 120 de octeți
  const INLINE = 'a::after{content:"ș"}'; // „ș” are 2 octeți în UTF-8
  let server: Server;
  let origine = '';

  test.beforeAll(async () => {
    server = createServer((cerere, raspuns) => {
      if (cerere.url === '/s.css') {
        // Comprimat, ca în producție: contează octeții necomprimați.
        raspuns.writeHead(200, { 'content-type': 'text/css', 'content-encoding': 'gzip' }).end(gzipSync(LEGAT));
      } else if (cerere.url === '/') {
        raspuns.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(pagina('<p>x</p>', `<link rel="stylesheet" href="/s.css"><style>${INLINE}</style>`));
      } else if (cerere.url === '/cu-lipsa/') {
        raspuns.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(pagina('<p>x</p>', '<link rel="stylesheet" href="/lipsa.css">'));
      } else {
        raspuns.writeHead(404).end();
      }
    });
    await new Promise<void>((rezolva) => server.listen(0, '127.0.0.1', rezolva));
    origine = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  test.afterAll(() => new Promise<void>((rezolva) => server.close(() => rezolva())));

  test('adună octeții din <style> (în UTF-8) și din fișierele CSS legate, necomprimați', async ({ page }) => {
    await page.goto(`${origine}/`);
    expect(Buffer.byteLength(INLINE)).toBe(INLINE.length + 1);
    expect(await cssPePagina(page)).toBe(Buffer.byteLength(LEGAT) + Buffer.byteLength(INLINE) + Buffer.byteLength(STIL_DE_BAZA));
  });

  test('un CSS legat care nu se încarcă e o eroare, nu zero octeți', async ({ page }) => {
    await page.goto(`${origine}/cu-lipsa/`);
    await expect(cssPePagina(page)).rejects.toThrow(/lipsa.css a răspuns 404/);
  });
});

test.describe('adresareFormala', () => {
  test('prinde „vă”, „dumneavoastră”, „Cereți”, „trimiteți”, „garantat” și „prima pagină”, cu litere mari sau mici', () => {
    for (const text of ['Vă mulțumesc', 'pentru dumneavoastră', 'dumneavoastra', 'Cereți o ofertă', 'Trimiteți cererea', 'rezultat garantat', 'Prima pagină în Google']) {
      expect(adresareFormala(text), text).toHaveLength(1);
    }
  });

  test('nu prinde cuvinte care doar conțin aceleași litere, nici adresarea cu „tu”', () => {
    for (const text of ['Cere o ofertă', 'Trimite cererea', 'învăț', 'vărsat', 'avă', 'cărți', 'Am primit cererea ta']) {
      expect(adresareFormala(text), text).toEqual([]);
    }
  });

  test('numește fragmentul și contextul', () => {
    expect(adresareFormala('Pentru a ne contacta, Cereți o ofertă acum.')).toEqual(['„Cereți” în „…Pentru a ne contacta, Cereți o ofertă acum.…”']);
  });
});
