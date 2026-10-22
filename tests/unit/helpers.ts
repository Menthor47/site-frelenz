// Ajutoare pentru testele de componente: randarea unei componente `.astro` în HTML (Container API) și textul din HTML.
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

type Componenta = Parameters<AstroContainer['renderToString']>[0];

// Un singur container pentru tot fișierul de test: crearea lui costă mai mult decât o randare.
let container: Promise<AstroContainer> | undefined;

/** HTML-ul unei componente `.astro`, randată cu `props` și, opțional, cu HTML în sloturi (ex. corpul unui ghid). */
export async function render(Component: Componenta, props: Record<string, unknown> = {}, slots: Record<string, string> = {}): Promise<string> {
  container ??= AstroContainer.create();
  return (await container).renderToString(Component, { props, slots });
}

/** Etichetele care despart cuvinte; restul etichetelor (`span`, `a`, `strong`) dispar fără să lase spațiu. */
const ETICHETE_DE_BLOC = /<\/?(?:address|br|dd|div|dl|dt|footer|h[1-6]|header|li|nav|ol|p|section|ul)\b[^>]*>/gi;

const ENTITATI: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

/** Textul dintr-un HTML, fără etichete, cu spațiile strânse: `<span>Alex</span><span>,</span>` devine „Alex,”. */
export function textOf(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(ETICHETE_DE_BLOC, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39);/g, (e) => ENTITATI[e] ?? e)
    .replace(/\s+/g, ' ')
    .trim();
}
