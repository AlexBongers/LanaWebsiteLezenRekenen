/**
 * Bouwstenen voor de 3D-spellen: demonnetjes, borden met tekst, glinsterdeeltjes en een podiumvloer.
 * Alles werkt met de `Podium` uit drie-d.ts.
 */
import type * as TypeThree from 'three';
import type { Podium, Three } from './drie-d';

const demonKleuren = [
  ['#60a5fa', '#1d4ed8'],
  ['#a78bfa', '#5b21b6'],
  ['#34d399', '#047857'],
  ['#f472b6', '#9d174d'],
  ['#fb923c', '#c2410c'],
];

import { isLicht } from './prestatie';

export type Demon3D = TypeThree.Group & {
  userData: {
    lijfMat: TypeThree.MeshStandardMaterial;
    kleur: TypeThree.Color;
    mond: TypeThree.Mesh;
    pupillen: TypeThree.Mesh[];
    ogen: TypeThree.Mesh[];
  };
};

/** Een grappig, niet-eng demonnetje van bolletjes (zelfde kleuren en hoorns als de 2D-demon). */
export function maakDemon3D(THREE: Three, soort: number): Demon3D {
  const n = ((soort % 60) + 60) % 60;
  const k = demonKleuren[n % demonKleuren.length];
  const hoorns = n % 3;
  const vleugels = n % 4 === 3;
  const scheel = n % 2 === 1;
  const g = new THREE.Group();

  const lijfMat = new THREE.MeshStandardMaterial({ color: k[0], roughness: 0.45, metalness: 0.05, emissive: k[1], emissiveIntensity: 0.18 });
  const lijf = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 28), lijfMat);
  lijf.scale.set(1, 1.08, 0.92);
  g.add(lijf);

  const buik = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  buik.scale.set(0.55, 0.42, 0.2);
  buik.position.set(0, -0.38, 0.86);
  g.add(buik);

  // Voetjes
  const voetMat = new THREE.MeshStandardMaterial({ color: k[1], roughness: 0.5 });
  for (const x of [-0.45, 0.45]) {
    const v = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), voetMat);
    v.scale.set(1, 0.7, 1.3);
    v.position.set(x, -1.0, 0.35);
    g.add(v);
  }

  // Hoorns
  const hoornMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.35, emissive: 0xb45309, emissiveIntensity: 0.15 });
  const kegel = (r: number, h: number, x: number, y: number, rz: number) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), hoornMat);
    m.position.set(x, y, 0.05);
    m.rotation.z = rz;
    g.add(m);
  };
  if (hoorns === 0) {
    kegel(0.2, 0.7, -0.58, 1.0, 0.45);
    kegel(0.2, 0.7, 0.58, 1.0, -0.45);
  } else if (hoorns === 1) {
    kegel(0.15, 0.45, -0.5, 1.0, 0.3);
    kegel(0.15, 0.45, 0.5, 1.0, -0.3);
    const krul = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.055, 10, 20, Math.PI * 1.5), new THREE.MeshStandardMaterial({ color: k[1], roughness: 0.5 }));
    krul.position.set(0, 1.14, 0.1);
    krul.rotation.z = 0.4;
    g.add(krul);
  } else {
    kegel(0.26, 0.9, 0, 1.12, 0);
  }

  // Vleugeltjes
  if (vleugels) {
    const vlMat = new THREE.MeshStandardMaterial({ color: k[1], roughness: 0.6, side: THREE.DoubleSide });
    for (const kant of [-1, 1]) {
      const v = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 3), vlMat);
      v.scale.set(1, 1, 0.12);
      v.position.set(kant * 1.05, 0.15, -0.3);
      v.rotation.z = kant * -1.9;
      g.add(v);
    }
  }

  // Ogen
  const oogMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
  const ogen: TypeThree.Mesh[] = [];
  const pupillen: TypeThree.Mesh[] = [];
  for (const kant of [-1, 1]) {
    const oog = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), oogMat);
    oog.scale.set(1, 1.1, 0.6);
    oog.position.set(kant * 0.4, 0.22, 0.76);
    g.add(oog);
    ogen.push(oog);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), pupilMat);
    pupil.position.set(kant * (0.4 - (scheel ? 0.07 : 0)), 0.2, 0.96);
    g.add(pupil);
    pupillen.push(pupil);
    const glans = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glans.position.set(pupil.position.x - 0.05, 0.27, 1.08);
    g.add(glans);
  }

  // Mond (lachend boogje) en blosjes
  const mond = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.05, 10, 20, Math.PI), new THREE.MeshBasicMaterial({ color: 0x3b0a2a }));
  mond.rotation.z = Math.PI;
  mond.position.set(0, -0.12, 0.94);
  g.add(mond);
  for (const kant of [-1, 1]) {
    const bloos = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.45 }));
    bloos.position.set(kant * 0.66, -0.05, 0.8);
    bloos.rotation.y = kant * 0.7;
    g.add(bloos);
  }

  const d = g as Demon3D;
  d.userData.lijfMat = lijfMat;
  d.userData.kleur = new THREE.Color(k[0]);
  d.userData.mond = mond;
  d.userData.pupillen = pupillen;
  d.userData.ogen = ogen;
  return d;
}

/** Zet een demon om naar grijs (fout) of terug naar zijn eigen kleur. */
export function kleurDemon(THREE: Three, d: Demon3D, grijs: number) {
  const m = d.userData.lijfMat;
  m.color.copy(d.userData.kleur).lerp(new THREE.Color(0x6b7280), grijs);
  m.emissiveIntensity = 0.18 * (1 - grijs);
}

function rondRechthoek(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export type BordOpties = {
  breed?: number;
  hoog?: number;
  inkt?: string;
  van?: string;
  naar?: string;
  rand?: string;
  rond?: boolean;
  /** Begin- en eindfractie van de tekstgrootte; standaard past de tekst netjes. */
  maat?: number;
  font?: string;
  zonderBord?: boolean;
  glans?: string;
};

/** Een bordje (of rond vel) met tekst als textuur. Past de tekst automatisch in het bord. */
export function bordTextuur(THREE: Three, tekst: string, o: BordOpties = {}) {
  const w = o.breed ?? 256;
  const h = o.hoog ?? 160;
  const c = document.createElement('canvas');
  c.width = w * 2;
  c.height = h * 2;
  const g = c.getContext('2d')!;
  g.scale(2, 2);
  if (!o.zonderBord) {
    const rand = Math.min(w, h) * 0.05;
    if (o.rond) {
      g.beginPath();
      g.ellipse(w / 2, h / 2, w / 2 - rand, h / 2 - rand, 0, 0, Math.PI * 2);
    } else {
      rondRechthoek(g, rand, rand, w - rand * 2, h - rand * 2, Math.min(w, h) * 0.22);
    }
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, o.van ?? '#fffaf0');
    gr.addColorStop(1, o.naar ?? '#fde68a');
    g.fillStyle = gr;
    g.fill();
    g.lineWidth = rand * 1.6;
    g.strokeStyle = o.rand ?? '#ffffff';
    g.stroke();
  }
  const maxBreed = w * (o.zonderBord ? 0.94 : 0.78);
  let px = (o.maat ?? 0.62) * h;
  const font = o.font ?? "Fredoka, 'Andika', system-ui, sans-serif";
  g.font = `700 ${px}px ${font}`;
  const gemeten = g.measureText(tekst).width;
  if (gemeten > maxBreed) {
    px *= maxBreed / gemeten;
    g.font = `700 ${px}px ${font}`;
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (o.glans) {
    g.shadowColor = o.glans;
    g.shadowBlur = px * 0.35;
  }
  g.fillStyle = o.inkt ?? '#2e1065';
  g.fillText(tekst, w / 2, h / 2 + px * 0.05);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Zachte lichtvlek als textuur voor glinsterdeeltjes en gloed. */
export function gloedTextuur(THREE: Three, kleur = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, kleur);
  gr.addColorStop(0.35, kleur);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type Deeltjes = {
  uitbarsting: (x: number, y: number, z: number, kleuren?: number[], aantal?: number, snelheid?: number, omhoog?: number) => void;
};

/** Glinsterende uitbarstingen voor feestmomenten. */
export function maakDeeltjes(p: Podium): Deeltjes {
  const { THREE, scene } = p;
  const tex = gloedTextuur(THREE);
  type Burst = { pts: TypeThree.Points; vel: Float32Array; leeft: number; duur: number; zwaarte: number };
  const lijst: Burst[] = [];
  const licht = isLicht();

  p.bijFrame((_t, dt) => {
    for (let i = lijst.length - 1; i >= 0; i--) {
      const b = lijst[i];
      b.leeft += dt;
      const pos = b.pts.geometry.getAttribute('position') as TypeThree.BufferAttribute;
      for (let j = 0; j < pos.count; j++) {
        b.vel[j * 3 + 1] -= b.zwaarte * dt;
        pos.setXYZ(j, pos.getX(j) + b.vel[j * 3] * dt, pos.getY(j) + b.vel[j * 3 + 1] * dt, pos.getZ(j) + b.vel[j * 3 + 2] * dt);
      }
      pos.needsUpdate = true;
      (b.pts.material as TypeThree.PointsMaterial).opacity = Math.max(0, 1 - b.leeft / b.duur);
      if (b.leeft >= b.duur) {
        scene.remove(b.pts);
        b.pts.geometry.dispose();
        (b.pts.material as TypeThree.PointsMaterial).dispose();
        lijst.splice(i, 1);
      }
    }
  });

  return {
    uitbarsting(x, y, z, kleuren = [0xfde68a, 0xf472b6, 0x67e8f9, 0xffffff], aantal = 30, snelheid = 3.4, omhoog = 1.2) {
      const n = Math.max(6, Math.round(aantal * (licht ? 0.5 : 1)));
      const pos = new Float32Array(n * 3);
      const kl = new Float32Array(n * 3);
      const vel = new Float32Array(n * 3);
      const c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        pos.set([x, y, z], i * 3);
        const hoek = Math.random() * Math.PI * 2;
        const kracht = snelheid * (0.4 + Math.random() * 0.8);
        vel.set([Math.cos(hoek) * kracht, Math.random() * snelheid * 0.7 + omhoog, (Math.random() - 0.3) * kracht * 0.6], i * 3);
        c.setHex(kleuren[i % kleuren.length]);
        kl.set([c.r, c.g, c.b], i * 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(kl, 3));
      const pts = new THREE.Points(
        geo,
        new THREE.PointsMaterial({ size: 0.3, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }),
      );
      pts.frustumCulled = false;
      pts.raycast = () => {};
      scene.add(pts);
      lijst.push({ pts, vel, leeft: 0, duur: 1.1, zwaarte: 4.2 });
    },
  };
}

/** Een ovaal podium met gloeiende rand; geeft ook de ringen terug om te laten pulseren. */
export function maakVloer(p: Podium, opties: { x?: number; y?: number; z?: number; schaalX?: number; schaalZ?: number; straal?: number; kleur?: number; randKleur?: number } = {}) {
  const { THREE, scene } = p;
  const r = opties.straal ?? 8.4;
  const groep = new THREE.Group();
  const vloer = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r + 0.4, 0.4, 64),
    new THREE.MeshStandardMaterial({ color: opties.kleur ?? 0x4c1d95, metalness: 0.15, roughness: 0.45, emissive: 0x2e1065, emissiveIntensity: 0.5 }),
  );
  vloer.position.y = -0.2;
  const randMat = new THREE.MeshBasicMaterial({ color: opties.randKleur ?? 0xf472b6 });
  const rand = new THREE.Mesh(new THREE.TorusGeometry(r + 0.2, 0.07, 12, 96), randMat);
  rand.rotation.x = Math.PI / 2;
  rand.position.y = 0.0;
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.35 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.62, 0.035, 8, 96), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.01;
  groep.add(vloer, rand, ring);
  groep.position.set(opties.x ?? 0, opties.y ?? 0, opties.z ?? 0);
  groep.scale.set(opties.schaalX ?? 1.1, 1, opties.schaalZ ?? 0.5);
  scene.add(groep);
  return { groep, randMat, ringMat };
}

/** Zachte dwarrelende sterretjes op de achtergrond (niet in de lichte modus). */
export function maakSterren(p: Podium, opties: { breed?: number; hoog?: number; diep?: number; y?: number; aantal?: number } = {}) {
  if (isLicht()) return;
  const { THREE, scene } = p;
  const n = opties.aantal ?? 48;
  const pos = new Float32Array(n * 3);
  const basis = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    basis.set(
      [(Math.random() - 0.5) * (opties.breed ?? 16), (opties.y ?? 0.5) + Math.random() * (opties.hoog ?? 6), -1 - Math.random() * (opties.diep ?? 5)],
      i * 3,
    );
  }
  pos.set(basis);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.16, map: gloedTextuur(THREE), color: 0xfde68a, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  pts.frustumCulled = false;
  pts.raycast = () => {};
  scene.add(pts);
  p.bijFrame((t) => {
    const a = geo.getAttribute('position') as TypeThree.BufferAttribute;
    for (let i = 0; i < n; i++) {
      a.setY(i, basis[i * 3 + 1] + Math.sin(t * 0.6 + i) * 0.25);
      a.setX(i, basis[i * 3] + Math.sin(t * 0.3 + i * 1.7) * 0.2);
    }
    a.needsUpdate = true;
    (pts.material as TypeThree.PointsMaterial).opacity = 0.6 + Math.sin(t * 1.5) * 0.25;
  });
}

/** Zachte easeOutBack voor binnenkomende objecten. */
export function veer(v: number) {
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2);
}
