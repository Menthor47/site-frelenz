import { z } from 'astro/zod';
import { collections } from '../../src/content.config';

// Schemele se verifică direct: la build, o intrare care le încalcă oprește `astro build`.
// O colecție cu imagini își face schema dintr-o funcție care primește `image()` de la Astro (la build, `image()` importă
// fișierul prin astro:assets, §9.1). Aici `image()` e înlocuită de o schemă care acceptă doar căi spre imagini.
const imagine = () => z.string().regex(/\.(?:avif|jpe?g|png|webp)$/);
type SchemaCuImagini = (context: { image: typeof imagine }) => z.ZodType;
function schema(nume: keyof typeof collections): z.ZodType {
  const s = collections[nume].schema as z.ZodType | SchemaCuImagini;
  return typeof s === 'function' ? s({ image: imagine }) : s;
}
const cadere = (nume: keyof typeof collections, date: unknown) => schema(nume).safeParse(date);
const caiCuErori = (nume: keyof typeof collections, date: unknown) =>
  (cadere(nume, date).error?.issues ?? []).map((i) => i.path.join('.'));

const faq = (n: number) => Array.from({ length: n }, (_, i) => ({ intrebare: `Întrebarea ${i + 1}?`, raspuns: `Răspunsul ${i + 1}.` }));

const serviciu = {
  slug: 'seo',
  titlu: 'Servicii SEO',
  h1: 'Servicii SEO pentru firme',
  descriere: 'x'.repeat(150),
  cuvantCheie: 'servicii SEO',
  secundare: ['optimizare SEO site'],
  grup: 'vizibilitate',
  raspunsDirect: 'Un răspuns scurt.',
  pentruCine: ['Firme'],
  semne: ['Un semn'],
  livrabile: ['Un livrabil'],
  pasi: ['Un pas'],
  faq: faq(4),
  inrudite: ['audit-seo'],
  problema: 'Firma ta nu apare în Google.',
  ordine: 1,
  notaGarantii: true,
  aprobat: false,
};

const proiect = {
  slug: 'magazin-online',
  titlu: 'Magazin online',
  descriere: 'd'.repeat(150),
  client: 'anonim',
  acord: false,
  aprobat: false,
  context: 'Context.',
  problema: 'Problema.',
  ceAmFacut: ['Un lucru'],
  rezultate: [{ text: 'Un rezultat', sursa: 'Search Console', data: '2026-11-01' }],
  servicii: ['seo'],
};

const ghid = {
  slug: 'cat-dureaza-seo',
  titlu: 'Cât durează SEO?',
  descriere: 'g'.repeat(150),
  raspuns: 'Depinde.',
  publicat: '2026-11-01',
  actualizat: '2026-11-02',
  aprobat: false,
  serviciuLegat: 'seo',
};

describe('colecția servicii', () => {
  test('o intrare completă trece', () => expect(cadere('servicii', serviciu).success).toBe(true));
  test('un slug care nu e în SERVICII pică', () =>
    expect(caiCuErori('servicii', { ...serviciu, slug: 'nu-exista' })).toEqual(['slug']));
  test('mesajul slug-ului nepotrivit numește valoarea și lista permisă', () => {
    const mesaj = cadere('servicii', { ...serviciu, slug: 'nu-exista' }).error?.issues[0]?.message;
    expect(mesaj).toContain('nu-exista');
    expect(mesaj).toContain('mentenanta-site');
  });
  test.each([0, 1, 3, 5])('faq cu %i perechi pică', (n) =>
    expect(caiCuErori('servicii', { ...serviciu, faq: faq(n) })).toEqual(['faq']));
  test('faq cu exact 4 perechi trece', () => expect(cadere('servicii', { ...serviciu, faq: faq(4) }).success).toBe(true));
  test('o pereche de faq fără răspuns pică', () =>
    expect(cadere('servicii', { ...serviciu, faq: [...faq(3), { intrebare: 'Fără răspuns?' }] }).success).toBe(false));
  test.each([139, 161])('descriere de %i caractere pică', (n) =>
    expect(caiCuErori('servicii', { ...serviciu, descriere: 'x'.repeat(n) })).toEqual(['descriere']));
  test.each([140, 160])('descriere de %i caractere trece', (n) =>
    expect(cadere('servicii', { ...serviciu, descriere: 'x'.repeat(n) }).success).toBe(true));
  test('grupul trebuie să fie una dintre valorile ASCII', () => {
    expect(caiCuErori('servicii', { ...serviciu, grup: 'construcție' })).toEqual(['grup']);
    expect(cadere('servicii', { ...serviciu, grup: 'constructie' }).success).toBe(true);
  });
  test('un serviciu înrudit necunoscut pică', () =>
    expect(caiCuErori('servicii', { ...serviciu, inrudite: ['nu-exista'] })).toEqual(['inrudite.0']));
  test('proiect e opțional', () => {
    expect(cadere('servicii', serviciu).success).toBe(true);
    expect(cadere('servicii', { ...serviciu, proiect: 'magazin-online' }).success).toBe(true);
  });
  test('aprobat e obligatoriu', () => {
    const { aprobat: _aprobat, ...faraAprobat } = serviciu;
    expect(caiCuErori('servicii', faraAprobat)).toEqual(['aprobat']);
  });
});

describe('colecția proiecte', () => {
  test('o intrare fără scoruri trece', () => expect(cadere('proiecte', proiect).success).toBe(true));
  test('serviciiDeConfirmat e opțional și, când există, e un marcaj', () => {
    expect(cadere('proiecte', { ...proiect, serviciiDeConfirmat: '[DE COMPLETAT:#8]' }).success).toBe(true);
    expect(cadere('proiecte', { ...proiect, serviciiDeConfirmat: 'de confirmat' }).success).toBe(false);
  });

  // Fiecare pagină are descrierea ei de 140–160 de caractere (§4.2), iar studiile de caz se construiesc din colecție.
  test('descrierea are 140–160 de caractere', () => {
    expect(cadere('proiecte', { ...proiect, descriere: 'd'.repeat(139) }).success).toBe(false);
    expect(cadere('proiecte', { ...proiect, descriere: 'd'.repeat(161) }).success).toBe(false);
    const { descriere: _, ...faraDescriere } = proiect;
    expect(cadere('proiecte', faraDescriere).success).toBe(false);
  });
  test('scorurile sunt opționale și, când există, au toate câmpurile', () => {
    const scor = { valoare: 98, data: '2026-11-10', versiuneLighthouse: '13.0.0', sursa: 'Lighthouse, mobil' };
    expect(cadere('proiecte', { ...proiect, scoruri: [scor] }).success).toBe(true);
    expect(cadere('proiecte', { ...proiect, scoruri: [] }).success).toBe(true);
    const { versiuneLighthouse: _v, ...incomplet } = scor;
    expect(cadere('proiecte', { ...proiect, scoruri: [incomplet] }).success).toBe(false);
  });
  test('un scor în afara intervalului 0–100 pică', () =>
    expect(
      cadere('proiecte', {
        ...proiect,
        scoruri: [{ valoare: 101, data: '2026-11-10', versiuneLighthouse: '13.0.0', sursa: 's' }],
      }).success,
    ).toBe(false));
  test('datele rezultatelor devin Date, din șir sau din Date', () => {
    const rezultat = (data: unknown) => ({ ...proiect, rezultate: [{ text: 't', sursa: 's', data }] });
    for (const data of ['2026-11-01', new Date('2026-11-01')]) {
      const parsat = cadere('proiecte', rezultat(data));
      expect(parsat.success).toBe(true);
      expect((parsat.data as typeof proiect & { rezultate: { data: Date }[] }).rezultate[0]?.data).toBeInstanceOf(Date);
    }
    expect(cadere('proiecte', rezultat('nu e dată')).success).toBe(false);
  });
  test('servicii[] nu poate fi gol și acceptă doar slug-uri cunoscute', () => {
    expect(caiCuErori('proiecte', { ...proiect, servicii: [] })).toEqual(['servicii']);
    expect(caiCuErori('proiecte', { ...proiect, servicii: ['nu-exista'] })).toEqual(['servicii.0']);
  });
  // Capturile trec prin `image()` (astro:assets, §9.1), ca la build să primească lățime, înălțime și format optimizat.
  test('sursa unei capturi trebuie să fie o imagine, nu orice text', () =>
    expect(caiCuErori('proiecte', { ...proiect, capturi: [{ src: './captura.txt', alt: 'Captura paginii' }] })).toEqual(['capturi.0.src']));
  test('o captură fără text alternativ pică', () =>
    expect(caiCuErori('proiecte', { ...proiect, capturi: [{ src: '/x.png', alt: '' }] })).toEqual(['capturi.0.alt']));
  test('capturile lipsă devin listă goală', () =>
    expect((cadere('proiecte', proiect).data as { capturi: unknown[] }).capturi).toEqual([]));
  test('acord și aprobat sunt obligatorii', () => {
    const { acord: _a, aprobat: _p, ...rest } = proiect;
    expect(caiCuErori('proiecte', rest).sort()).toEqual(['acord', 'aprobat']);
  });
});

describe('colecția ghiduri', () => {
  test('o intrare completă trece', () => expect(cadere('ghiduri', ghid).success).toBe(true));
  test('descrierea are 140–160 de caractere și e obligatorie (§4.2)', () => {
    expect(cadere('ghiduri', { ...ghid, descriere: 'g'.repeat(139) }).success).toBe(false);
    expect(cadere('ghiduri', { ...ghid, descriere: 'g'.repeat(161) }).success).toBe(false);
    const { descriere: _, ...faraDescriere } = ghid;
    expect(cadere('ghiduri', faraDescriere).success).toBe(false);
  });
  test.each(['De ce nu apare site-ul meu în Google', 'Ce este GEO și prin ce diferă de SEO și AEO'])(
    'titlul ghidului de lansare „%s” trece, și fără semnul întrebării',
    (titlu) => expect(cadere('ghiduri', { ...ghid, titlu }).success).toBe(true),
  );
  test('titlul gol pică', () => expect(caiCuErori('ghiduri', { ...ghid, titlu: '' })).toEqual(['titlu']));
  test('serviciuLegat necunoscut pică', () =>
    expect(caiCuErori('ghiduri', { ...ghid, serviciuLegat: 'nu-exista' })).toEqual(['serviciuLegat']));
  test('publicat și actualizat devin Date', () => {
    const date = cadere('ghiduri', ghid).data as { publicat: Date; actualizat: Date };
    expect(date.publicat).toBeInstanceOf(Date);
    expect(date.actualizat).toBeInstanceOf(Date);
  });
});
