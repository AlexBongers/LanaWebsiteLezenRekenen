/**
 * Gedeelde spelregels voor de spellen van fase 3:
 *  - meteen goed = 2 noten, na een hint goed = 1 noot
 *  - eerste fout = hint, tweede fout = het antwoord wordt getoond en de opgave komt aan het eind terug
 *  - alleen de eerste keer telt mee voor het niveau
 */
import type { Resultaat } from '../engine/sessie';
import type { SpelProps } from './types';

export type Opgave<T> = { opgave: T; id: string };

export class Ronde<T> {
  rij: (Opgave<T> & { herhaling: boolean })[] = $state([]);
  index = $state(0);
  pogingen = $state(0);
  onthuld = $state(false);
  klaar = $state(false);
  private resultaten: Resultaat[] = [];
  private eersteFout: string | undefined;

  constructor(
    opgaven: Opgave<T>[],
    private niveau: number,
    private props: Pick<SpelProps, 'opKlaar' | 'opVoortgang'>,
  ) {
    this.rij = opgaven.map((o) => ({ ...o, herhaling: false }));
  }

  get huidig(): T {
    return this.rij[this.index].opgave;
  }

  get nummer() {
    return this.index;
  }

  /** Goed antwoord. Geeft het aantal noten terug. */
  goed(): number {
    const item = this.rij[this.index];
    if (!item.herhaling && !this.onthuld) {
      this.resultaten.push({ id: item.id, niveau: this.niveau, bron: 'niveau', goed: this.pogingen === 0, gekozen: this.eersteFout });
    }
    return this.pogingen === 0 ? 2 : 1;
  }

  /** Fout antwoord. 'hint' na de eerste fout, 'onthuld' na de tweede. */
  fout(gekozen?: string): 'hint' | 'onthuld' {
    const item = this.rij[this.index];
    if (this.pogingen === 0) this.eersteFout = gekozen;
    this.pogingen++;
    if (this.pogingen < 2) return 'hint';
    this.onthuld = true;
    if (!item.herhaling) {
      this.resultaten.push({ id: item.id, niveau: this.niveau, bron: 'niveau', goed: false, gekozen: this.eersteFout });
      this.rij = [...this.rij, { ...item, herhaling: true }];
    }
    return 'onthuld';
  }

  /** Naar de volgende opgave; false als het concert klaar is. */
  volgende(): boolean {
    if (this.klaar) return false;
    const n = this.index + 1;
    this.props.opVoortgang(n / this.rij.length);
    if (n >= this.rij.length) {
      this.klaar = true;
      this.props.opKlaar(this.resultaten);
      return false;
    }
    this.index = n;
    this.pogingen = 0;
    this.onthuld = false;
    this.eersteFout = undefined;
    return true;
  }
}
