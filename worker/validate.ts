// Validarea cererii, cu aceleași reguli ca browserul (§3.5): regulile vin din src/form-rules.ts, ca atributele HTML.
// Ordinea: capcana, apoi linkurile din Mesaj (singura regulă pe care browserul n-o vede), apoi restul regulilor.
// Pentru fiecare câmp: `\r\n` devine `\n` (browserul numără un rând nou ca un caracter, dar îl trimite ca CRLF), lungimea
// e `string.length`, `required` se aplică fără trim (browserul acceptă un câmp doar cu spații), apoi formatul e-mailului.
// `\r` sau `\n` într-un câmp pe un rând ar permite injectarea de antete în e-mail, deci e respins.
import { CAMPURI, CAPCANA, EMAIL_RE, type NumeCamp } from '../src/form-rules';
import { countLinks } from './links';

export type Cerere = Readonly<Record<NumeCamp, string>>;

export type Rezultat = { ok: true; date: Cerere } | { ok: false; motiv: 'capcana' | 'linkuri' | 'invalid' };

/** Câmpurile care trebuie să rămână pe un singur rând. */
const PE_UN_RAND: readonly NumeCamp[] = ['nume', 'email', 'telefon', 'firma', 'site'];

const CAMPURI_FORMULAR = Object.keys(CAMPURI) as NumeCamp[];

const text = (valoare: FormDataEntryValue | null): string => (typeof valoare === 'string' ? valoare.replaceAll('\r\n', '\n') : '');

function campValid(camp: NumeCamp, valoare: string): boolean {
  const regula = CAMPURI[camp];
  if (valoare === '') return !regula.required;
  if (regula.maxLength !== undefined && valoare.length > regula.maxLength) return false;
  if (regula.type === 'email' && !EMAIL_RE.test(valoare)) return false;
  if (regula.optiuni !== undefined && !regula.optiuni.includes(valoare)) return false;
  return !(PE_UN_RAND.includes(camp) && /[\r\n]/.test(valoare));
}

export function validate(form: FormData): Rezultat {
  if (text(form.get(CAPCANA)) !== '') return { ok: false, motiv: 'capcana' };

  const date = Object.fromEntries(CAMPURI_FORMULAR.map((camp) => [camp, text(form.get(camp))])) as Record<NumeCamp, string>;

  const maxLinkuri = CAMPURI.mesaj.maxLinkuri ?? Number.POSITIVE_INFINITY;
  if (countLinks(date.mesaj) > maxLinkuri) return { ok: false, motiv: 'linkuri' };

  if (!CAMPURI_FORMULAR.every((camp) => campValid(camp, date[camp]))) return { ok: false, motiv: 'invalid' };

  return { ok: true, date };
}
