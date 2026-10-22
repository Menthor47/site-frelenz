import { dataIso, lunaAn, ziLunaAn } from '../../src/lib/format';

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

test('ziua, luna și anul, în română, citite în UTC; plus forma ISO pentru <time>', () => {
  const tz = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  try {
    expect(ziLunaAn(new Date('2026-11-05T00:00:00Z'))).toBe('5 noiembrie 2026');
    expect(dataIso(new Date('2026-11-05T00:00:00Z'))).toBe('2026-11-05');
  } finally {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  }
});
