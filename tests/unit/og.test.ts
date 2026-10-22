import { imagineOg } from '../../src/lib/og';

// Imaginea Open Graph (§6.2, §3.7): 1200×630, PNG, cu fontul static Atkinson Hyperlegible Next 800 (latin + latin-ext).

/** Lățimea și înălțimea din antetul IHDR al unui PNG. */
function dimensiuni(png: Uint8Array): [number, number] {
  const v = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return [v.getUint32(16), v.getUint32(20)];
}

test('imaginea OG e un PNG de 1200×630', async () => {
  const png = await imagineOg({ titlu: 'Consultant SEO din București' });
  expect([...png.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(dimensiuni(png)).toEqual([1200, 630]);
});

test('merge și cu un titlu lung, cu ș și ț, și cu linia unui grup', async () => {
  const png = await imagineOg({ titlu: 'Întreținere și mentenanță site WordPress pentru firme din toată țara', grup: 'reparatie' });
  expect(dimensiuni(png)).toEqual([1200, 630]);
});
