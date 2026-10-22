import { lunaAn } from '../../src/lib/format';

// Datele din colecții vin din `z.coerce.date()`, la miezul nopții UTC: luna se citește în UTC, oriunde rulează build-ul.
test('luna și anul, în română, citite în UTC', () => {
  const tz = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  try {
    expect(lunaAn(new Date('2026-04-01T00:00:00Z'))).toBe('aprilie 2026');
  } finally {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  }
});
