export type SpelProps = {
  /** Gouden noten erbij; `bron` is de plek waar ze vandaan vliegen. */
  opNoten: (n: number, bron?: Element | null) => void;
  /** Voortgang van het schild, 0 tot 1. */
  opVoortgang: (fractie: number) => void;
  /** Klaar; per opgave of die bij de eerste poging goed was. */
  opKlaar: (resultaten: boolean[]) => void;
  /** Wordt als eerste uitgesproken (begroeting van de heldin). */
  intro?: string;
};
