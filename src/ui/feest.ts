import confetti from 'canvas-confetti';
import { isLicht } from './prestatie';

const KLEUREN = ['#fbbf24', '#fde68a', '#f472b6', '#a78bfa', '#22d3ee', '#ffffff'];

/** Klein feestje op een plek op het scherm (bijv. waar de demon stond). */
export function glitterOp(el: Element | null) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  confetti({
    particleCount: isLicht() ? 16 : 40,
    spread: 70,
    startVelocity: 28,
    gravity: 0.9,
    ticks: 120,
    scalar: 0.9,
    shapes: ['star', 'circle'],
    colors: KLEUREN,
    origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight },
    disableForReducedMotion: true,
  });
}

/** Groot feest voor het einde van een concert. */
export function grootFeest() {
  const einde = Date.now() + 1800;
  (function frame() {
    const n = isLicht() ? 2 : 6;
    confetti({ particleCount: n, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors: KLEUREN, shapes: ['star', 'circle'] });
    confetti({ particleCount: n, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors: KLEUREN, shapes: ['star', 'circle'] });
    if (Date.now() < einde) requestAnimationFrame(frame);
  })();
}
