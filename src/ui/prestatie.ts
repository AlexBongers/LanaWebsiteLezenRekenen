/**
 * Beeldsnelheid meten en de lichte modus bijhouden.
 *
 * Lichte modus = minder zware effecten (schaduwen, filters, wazige glaslagen, confetti),
 * zodat het ook op een trage tablet soepel blijft.
 */

/** Gemiddeld aantal beeldjes per seconde over `ms` milliseconden; null als het scherm niet zichtbaar is. */
export function meetBeeldsnelheid(ms = 2000): Promise<number | null> {
  return new Promise((klaar) => {
    let n = 0;
    let begin = 0;
    let verborgen = document.visibilityState !== 'visible';
    const opVerborgen = () => (verborgen = true);
    document.addEventListener('visibilitychange', opVerborgen, { once: true });
    const lus = (t: number) => {
      if (!begin) begin = t;
      n++;
      if (verborgen) return klaar(null);
      if (t - begin < ms) return requestAnimationFrame(lus);
      document.removeEventListener('visibilitychange', opVerborgen);
      klaar(Math.round((n / (t - begin)) * 1000));
    };
    requestAnimationFrame(lus);
  });
}

/** Onder dit aantal beeldjes per seconde schakelt de app zelf over op de lichte modus. */
export const TRAAG_ONDER = 42;

export function zetLichteModus(aan: boolean) {
  document.documentElement.classList.toggle('licht', aan);
}

export const isLicht = () => document.documentElement.classList.contains('licht');

/** Moet de lichte modus nu aan staan? */
export function wilLicht(i: { lichteModus: 'auto' | 'aan' | 'uit'; lichtGemeten: boolean | null }): boolean {
  return i.lichteModus === 'aan' || (i.lichteModus === 'auto' && i.lichtGemeten === true);
}
