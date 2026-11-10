/**
 * Kleine 3D-basis (three.js) voor de spellen met een echt podium.
 *
 * - three.js wordt pas geladen als een 3D-spel opent (dynamische import), zodat de rest van de app licht blijft.
 * - Werkt in het schaalpodium van de app: de grootte komt uit de layout, niet uit het schermformaat.
 * - Geen WebGL, of een fout bij het laden? Dan geven de spellen een nette 2D-versie.
 */
import type * as TypeThree from 'three';

export type Three = typeof TypeThree;

let geladen: Promise<Three> | null = null;

export function heeftWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function laadThree(): Promise<Three> {
  geladen ??= import('three');
  return geladen;
}

export type Podium = {
  THREE: Three;
  scene: TypeThree.Scene;
  camera: TypeThree.PerspectiveCamera;
  renderer: TypeThree.WebGLRenderer;
  /** Wordt elke beeldje aangeroepen met de tijd in seconden en de tijd sinds het vorige beeldje. */
  bijFrame: (f: (t: number, dt: number) => void) => void;
  /** Tik of klik op een object met `userData.id`; krijgt dat id. */
  bijTik: (f: (id: string | number) => void) => void;
  /** Sleep: dx in pixels sinds het vorige punt. */
  bijSleep: (f: (dx: number, dy: number) => void) => void;
  /** De grafische chip is de tekening kwijt (komt soms voor op tablets): val terug op 2D. */
  bijVerlies: (f: () => void) => void;
  tekenOpnieuw: () => void;
  opruimen: () => void;
};

export type PodiumOpties = {
  fov?: number;
  camera?: [number, number, number];
  kijkNaar?: [number, number, number];
};

/** Zet een 3D-podium op in een canvas en geeft de bouwstenen terug. */
export async function maakPodium(canvas: HTMLCanvasElement, opties: PodiumOpties = {}): Promise<Podium> {
  const THREE = await laadThree();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opties.fov ?? 38, 1, 0.1, 100);
  camera.position.set(...(opties.camera ?? [0, 3, 9]));
  camera.lookAt(...(opties.kijkNaar ?? [0, 0.6, 0]));

  // Podiumlicht: zacht roze van links, turkoois van rechts, warm van boven.
  scene.add(new THREE.HemisphereLight(0xc4b5fd, 0x1b0b3a, 1.1));
  const roze = new THREE.PointLight(0xf472b6, 90, 30);
  roze.position.set(-6, 5, 5);
  const blauw = new THREE.PointLight(0x22d3ee, 70, 30);
  blauw.position.set(7, 4, 4);
  const goud = new THREE.DirectionalLight(0xfde68a, 1.6);
  goud.position.set(0, 8, 6);
  scene.add(roze, blauw, goud);

  const reduceer = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frames: ((t: number, dt: number) => void)[] = [];
  const tikken: ((id: string | number) => void)[] = [];
  const sleepjes: ((dx: number, dy: number) => void)[] = [];
  let raf = 0;
  let vorige = performance.now();
  let pixelRatio = 1;
  // Lichte modus: nooit scherper dan de schermpixels (CSS) zelf.
  let kwaliteitMax = document.documentElement.classList.contains('licht') ? 1 : 2;
  const verliezen: (() => void)[] = [];
  let gestopt = false;
  let zichtbaar = true;

  function pasMaatAan() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    // Het hele spel staat op een schaalpodium: reken het schaalstuk mee voor scherpe pixels.
    const schaal = canvas.getBoundingClientRect().width / w || 1;
    pixelRatio = Math.max(0.75, Math.min(kwaliteitMax, (window.devicePixelRatio || 1) * schaal));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const waarnemer = new ResizeObserver(pasMaatAan);
  waarnemer.observe(canvas);
  pasMaatAan();

  function teken() {
    renderer.render(scene, camera);
  }

  // Traag? Dan zakt de scherpte vanzelf, zodat het spel soepel blijft (liever iets zachter dan stotterend).
  let traag = 0;
  let gemeten = 0;

  function lus(nu: number) {
    if (gestopt) return;
    const dt = Math.min(0.1, (nu - vorige) / 1000);
    vorige = nu;
    if (zichtbaar && dt > 0) {
      gemeten++;
      if (dt > 0.034) traag++;
      if (gemeten >= 45) {
        if (traag > 20 && pixelRatio > 0.8) {
          kwaliteitMax = Math.max(0.75, pixelRatio * 0.78);
          pasMaatAan();
        }
        gemeten = 0;
        traag = 0;
      }
    }
    if (zichtbaar) {
      for (const f of frames) f(nu / 1000, dt);
      teken();
    }
    raf = requestAnimationFrame(lus);
  }
  raf = requestAnimationFrame(lus);

  const opZichtbaar = () => (zichtbaar = document.visibilityState === 'visible');
  document.addEventListener('visibilitychange', opZichtbaar);

  // Tikken en slepen
  const straal = new THREE.Raycaster();
  let start: { x: number; y: number } | null = null;
  let laatste: { x: number; y: number } | null = null;
  let verplaatst = 0;

  const pak = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { nx: ((e.clientX - r.left) / r.width) * 2 - 1, ny: -((e.clientY - r.top) / r.height) * 2 + 1 };
  };
  canvas.addEventListener('pointerdown', (e) => {
    start = laatste = { x: e.clientX, y: e.clientY };
    verplaatst = 0;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!start || !laatste) return;
    const dx = e.clientX - laatste.x;
    const dy = e.clientY - laatste.y;
    verplaatst += Math.abs(dx) + Math.abs(dy);
    laatste = { x: e.clientX, y: e.clientY };
    if (verplaatst > 8) sleepjes.forEach((f) => f(dx, dy));
  });
  canvas.addEventListener('pointerup', (e) => {
    const was = start;
    start = laatste = null;
    if (!was || verplaatst > 8) return;
    const { nx, ny } = pak(e);
    straal.setFromCamera(new THREE.Vector2(nx, ny), camera);
    const treffers = straal.intersectObjects(scene.children, true);
    for (const t of treffers) {
      let o: TypeThree.Object3D | null = t.object;
      while (o && o.userData.id === undefined) o = o.parent;
      if (o) {
        tikken.forEach((f) => f(o!.userData.id));
        return;
      }
    }
  });
  canvas.addEventListener('pointercancel', () => (start = laatste = null));
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    verliezen.forEach((f) => f());
  });

  function opruimen() {
    gestopt = true;
    verliezen.length = 0; // opruimen is geen verlies: de melding mag het spel niet naar 2D sturen
    cancelAnimationFrame(raf);
    waarnemer.disconnect();
    document.removeEventListener('visibilitychange', opZichtbaar);
    scene.traverse((o) => {
      const m = o as TypeThree.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as TypeThree.Material | TypeThree.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
        (x as TypeThree.MeshBasicMaterial).map?.dispose?.();
        x.dispose();
      });
    });
    renderer.dispose();
    renderer.forceContextLoss();
  }

  if (reduceer) {
    // Minder beweging: het podium tekent nog steeds, maar zonder sierlijke zweving.
    camera.userData.reduceer = true;
  }

  return {
    THREE,
    scene,
    camera,
    renderer,
    bijFrame: (f) => frames.push(f),
    bijTik: (f) => tikken.push(f),
    bijSleep: (f) => sleepjes.push(f),
    bijVerlies: (f) => verliezen.push(f),
    tekenOpnieuw: teken,
    opruimen,
  };
}

/** Een stukje tekst als platte afbeelding (voor getallen op het 3D-podium). */
export function tekstTextuur(THREE: Three, tekst: string, opties: { kleur?: string; px?: number; breed?: number } = {}) {
  const px = opties.px ?? 128;
  const breed = opties.breed ?? 160;
  const c = document.createElement('canvas');
  c.width = breed * 2;
  c.height = px * 2;
  const g = c.getContext('2d')!;
  g.scale(2, 2);
  g.font = `700 ${px * 0.78}px Fredoka, 'Andika', system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = px * 0.14;
  g.strokeStyle = 'rgba(26, 11, 46, 0.9)';
  g.fillStyle = opties.kleur ?? '#ffffff';
  g.strokeText(tekst, breed / 2, px / 2 + px * 0.04);
  g.fillText(tekst, breed / 2, px / 2 + px * 0.04);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
