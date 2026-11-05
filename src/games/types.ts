import type { Gepland, Resultaat } from '../engine/sessie';

export type SpelProps<T = never> = {
  /** Gouden noten erbij; `bron` is de plek waar ze vandaan vliegen. */
  opNoten: (n: number, bron?: Element | null) => void;
  /** Voortgang van het schild, 0 tot 1. */
  opVoortgang: (fractie: number) => void;
  /** Klaar; per opgave of die bij de eerste poging goed was. */
  opKlaar: (resultaten: Resultaat[]) => void;
  /** Wordt als eerste uitgesproken (begroeting van de heldin). */
  intro?: string;
  /** De geplande opgaven van dit concert (niet bij het verhaal). */
  opgaven?: Gepland<T>[];
  /** Auditie: rustiger opbouw, geen verhaaltjessommen. */
  auditie?: boolean;
};
