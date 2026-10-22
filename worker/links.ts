// Numărul de linkuri din Mesaj (§3.5 punctul 4). Se numără linkurile, nu prefixele, fără să conteze literele mari:
// fiecare `http://` sau `https://` și fiecare `www.` care nu vine imediat după `//`, deci `https://www.a.ro` e un singur link.
export const countLinks = (text: string): number =>
  (text.match(/https?:\/\//gi)?.length ?? 0) + (text.match(/(?<!\/\/)www\./gi)?.length ?? 0);
