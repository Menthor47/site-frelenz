// fontkit n-are tipuri proprii; testele folosesc doar deschiderea unui fișier și verificarea unei glife.
declare module 'fontkit' {
  export function openSync(cale: string): { hasGlyphForCodePoint(codePoint: number): boolean };
}
