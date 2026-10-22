// Formatarea datelor din colecții. `z.coerce.date()` dă miezul nopții UTC, deci totul se citește în UTC,
// altfel un build rulat la vest de UTC ar arăta ziua (sau luna) de dinainte.

/** „martie 2026”. */
export const lunaAn = (data: Date): string => data.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** „5 noiembrie 2026”. */
export const ziLunaAn = (data: Date): string =>
  data.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** „2026-11-05”, pentru atributul `datetime` al lui `<time>`. */
export const dataIso = (data: Date): string => data.toISOString().slice(0, 10);
