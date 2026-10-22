// Formatarea datelor din colecții. `z.coerce.date()` dă miezul nopții UTC, deci luna se citește în UTC,
// altfel un build rulat la vest de UTC ar arăta luna de dinainte.

/** „martie 2026”. */
export const lunaAn = (data: Date): string => data.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric', timeZone: 'UTC' });
