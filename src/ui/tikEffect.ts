/** Bij elke tik een klein glinster-effect op de plek van de vinger: alles voelt levendiger. */
const KLEUREN = ['#fde68a', '#f9a8d4', '#c4b5fd', '#a5f3fc', '#fff'];

export function installeerTikEffect() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  addEventListener(
    'pointerdown',
    (e) => {
      const laag = document.createElement('div');
      Object.assign(laag.style, {
        position: 'fixed', left: `${e.clientX}px`, top: `${e.clientY}px`, width: '0', height: '0',
        zIndex: '90', pointerEvents: 'none',
      });
      const ring = document.createElement('div');
      Object.assign(ring.style, {
        position: 'absolute', left: '-30px', top: '-30px', width: '60px', height: '60px',
        borderRadius: '50%', border: '3px solid rgba(253,230,138,0.9)', boxShadow: '0 0 16px rgba(251,191,36,0.8)',
      });
      laag.appendChild(ring);
      ring.animate([{ transform: 'scale(0.2)', opacity: 1 }, { transform: 'scale(1.4)', opacity: 0 }], { duration: 450, easing: 'ease-out' });
      for (let i = 0; i < 7; i++) {
        const ster = document.createElement('div');
        ster.textContent = i % 2 ? '✦' : '•';
        Object.assign(ster.style, {
          position: 'absolute', left: '-8px', top: '-12px', fontSize: `${12 + (i % 3) * 6}px`,
          color: KLEUREN[i % KLEUREN.length], textShadow: '0 0 8px currentColor',
        });
        laag.appendChild(ster);
        const hoek = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
        const afstand = 40 + Math.random() * 30;
        ster.animate(
          [
            { transform: 'translate(0,0) scale(0.5)', opacity: 1 },
            { transform: `translate(${Math.cos(hoek) * afstand}px, ${Math.sin(hoek) * afstand}px) scale(1.1) rotate(90deg)`, opacity: 0 },
          ],
          { duration: 550 + Math.random() * 200, easing: 'cubic-bezier(.2,.8,.3,1)' },
        );
      }
      document.body.appendChild(laag);
      setTimeout(() => laag.remove(), 800);
    },
    { passive: true },
  );
}
