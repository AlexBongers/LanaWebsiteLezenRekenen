<script lang="ts">
  /** Nachthemel met een maan: drie sterren met een woord dalen langzaam neer. Tik de goede ster. */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, Texture } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, gloedTextuur, maakDeeltjes, maakSterren, type Deeltjes } from '../ui/drie-d-bouw';

  let {
    woorden,
    fout,
    goed,
    actief,
    sleutel,
    opKies,
    opFout,
  }: {
    woorden: string[];
    fout: number[];
    goed: number | null;
    actief: boolean;
    sleutel: number;
    opKies: (i: number) => void;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  const KLEUREN = [0xfbbf24, 0xf472b6, 0x22d3ee];
  type Ster = {
    i: number;
    groep: Group;
    mat: MeshPhysicalMaterial;
    bordMat: MeshBasicMaterial;
    tex: { norm: Texture; goed: Texture; fout: Texture };
    kleur: number;
    start: number;
    x: number;
    wiebel: number;
    vang: number;
    grijs: number;
  };
  let sterren: Ster[] = [];
  let hoofd: Group;
  let sterGeo: import('three').ExtrudeGeometry;
  let huidigFout: number[] = [];
  let huidigGoed: number | null = null;
  let huidigActief = false;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 36, camera: [0, 1.4, 9], kijkNaar: [0, 1.6, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 20, hoog: 7, y: -0.5, diep: 6, aantal: 70 });

        // Maan met een zachte gloed
        const maan = new THREE.Mesh(
          new THREE.SphereGeometry(0.9, 32, 24),
          new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfde68a, emissiveIntensity: 0.9, roughness: 0.9 }),
        );
        maan.position.set(-7.4, 4.9, -6);
        const maanGloed = new THREE.Mesh(
          new THREE.CircleGeometry(2.6, 32),
          new THREE.MeshBasicMaterial({ map: gloedTextuur(THREE, '#fde68a'), transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }),
        );
        maanGloed.position.set(-7.4, 4.9, -6.2);
        // Wolkjes
        const wolkMat = new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 1, transparent: true, opacity: 0.55 });
        const wolken: Group[] = [];
        for (const [x, y] of [[4.5, -0.3], [-3.5, -0.6], [0.5, -0.9]] as [number, number][]) {
          const w = new THREE.Group();
          for (const [dx, r] of [[-0.7, 0.55], [0, 0.75], [0.7, 0.5]] as [number, number][]) {
            const b = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), wolkMat);
            b.position.set(dx, 0, 0);
            w.add(b);
          }
          w.position.set(x, y, -2);
          w.scale.set(1.6, 0.8, 0.8);
          wolken.push(w);
          scene.add(w);
        }
        scene.add(maan, maanGloed);

        // Stervorm
        const sh = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? 1.0 : 0.46;
          const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
          if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        sh.closePath();
        sterGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.07, bevelSegments: 3 });
        sterGeo.center();

        hoofd = new THREE.Group();
        scene.add(hoofd);

        p.bijTik((id) => {
          if (huidigActief) opKies(Number(id));
        });

        p.bijFrame((t) => {
          wolken.forEach((w, i) => (w.position.x += Math.sin(t * 0.2 + i) * 0.002));
          for (const s of sterren) {
            const val = Math.min(1, Math.max(0, (t - s.start) / 1.6));
            const zacht = 1 - Math.pow(1 - val, 3);
            const isFout = huidigFout.includes(s.i);
            const isGoed = huidigGoed === s.i;
            s.grijs += ((isFout ? 1 : 0) - s.grijs) * 0.12;
            const ruk = Math.max(0, 1 - (t - s.wiebel) / 0.6);
            const vang = s.vang > 0 ? Math.min(1, (t - s.vang) / 1.2) : 0;
            const y = 6 - zacht * 4.3 + Math.sin(t * 1.4 + s.i * 2) * 0.14 - s.grijs * 0.5 + vang * vang * 4;
            s.groep.position.set(s.x + Math.sin(t * 0.7 + s.i) * 0.12, y, 0);
            s.groep.rotation.z = Math.sin(t * 1.1 + s.i) * 0.08 + Math.sin((t - s.wiebel) * 30) * 0.15 * ruk;
            const ster = s.groep.children[0];
            ster.rotation.y = Math.sin(t * 1.5 + s.i) * 0.5 + vang * 12;
            s.groep.scale.setScalar(1 + Math.sin(vang * Math.PI) * 0.25);
            s.mat.color.setHex(isGoed ? 0x86efac : s.kleur).lerp(new THREE.Color(0x6b7280), s.grijs);
            s.mat.emissive.setHex(isGoed ? 0x22c55e : s.kleur);
            s.mat.emissiveIntensity = isGoed ? 0.9 + Math.sin(t * 8) * 0.3 : 0.3 * (1 - s.grijs);
            s.bordMat.map = isGoed ? s.tex.goed : isFout ? s.tex.fout : s.tex.norm;
            const gloed = s.groep.children[1] as Mesh;
            (gloed.material as MeshBasicMaterial).opacity = (0.35 + Math.sin(t * 3 + s.i) * 0.1) * (1 - s.grijs);
          }
        });

        gereed = true;
        bouw();
      } catch {
        opFout();
      }
    })();
    return () => {
      uit = true;
      podium?.opruimen();
      podium = null;
    };
  });

  function bouw() {
    if (!podium || !hoofd) return;
    const { THREE } = podium;
    for (const s of sterren) {
      hoofd.remove(s.groep);
      s.mat.dispose();
      s.bordMat.dispose();
      for (const t of Object.values(s.tex)) t.dispose();
    }
    sterren = [];
    const t0 = performance.now() / 1000;
    const n = woorden.length;
    const font = "Andika, 'Fredoka', system-ui, sans-serif";
    woorden.forEach((w, i) => {
      const kleur = KLEUREN[i % KLEUREN.length];
      const mat = new THREE.MeshPhysicalMaterial({ color: kleur, emissive: kleur, emissiveIntensity: 0.3, metalness: 0.6, roughness: 0.2, clearcoat: 1 });
      const ster = new THREE.Mesh(sterGeo, mat);
      ster.scale.setScalar(0.85);
      const gloed = new THREE.Mesh(
        new THREE.CircleGeometry(1.6, 32),
        new THREE.MeshBasicMaterial({ map: gloedTextuur(THREE, `#${kleur.toString(16).padStart(6, '0')}`), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      gloed.position.z = -0.4;
      const tex = {
        norm: bordTextuur(THREE, w, { breed: 320, hoog: 140, maat: 0.62, font }),
        goed: bordTextuur(THREE, w, { breed: 320, hoog: 140, maat: 0.62, font, van: '#f0fdf4', naar: '#86efac', rand: '#16a34a', inkt: '#14532d' }),
        fout: bordTextuur(THREE, w, { breed: 320, hoog: 140, maat: 0.62, font, van: '#e5e7eb', naar: '#9ca3af', rand: '#6b7280', inkt: '#4b5563' }),
      };
      const bordMat = new THREE.MeshBasicMaterial({ map: tex.norm, transparent: true, toneMapped: false, depthWrite: false });
      const bord = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.0), bordMat);
      bord.position.set(0, -1.25, 0.3);
      // Een gouden draadje van de ster naar het bord
      const draad = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), new THREE.MeshBasicMaterial({ color: 0xfde68a }));
      draad.position.set(0, -0.6, 0.2);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 1.2), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = -0.5;
      hit.userData = { id: i };
      const groep = new THREE.Group();
      groep.add(ster, gloed, draad, bord, hit);
      hoofd.add(groep);
      sterren.push({ i, groep, mat, bordMat, tex, kleur, start: t0 + i * 0.25, x: (i - (n - 1) / 2) * 3.4, wiebel: -10, vang: 0, grijs: 0 });
    });
  }

  $effect(() => {
    woorden.join('|');
    sleutel;
    if (gereed) untrack(bouw);
  });
  $effect(() => {
    huidigFout = [...fout];
    huidigGoed = goed;
    huidigActief = actief;
  });
  let vorigeFouten = 0;
  $effect(() => {
    const n = fout.length;
    if (!gereed) return;
    untrack(() => {
      if (n > vorigeFouten) {
        const s = sterren[fout[n - 1]];
        if (s) s.wiebel = performance.now() / 1000;
      }
      vorigeFouten = n;
    });
  });
  let vorigGoed: number | null = null;
  $effect(() => {
    const g = goed;
    if (!gereed) return;
    untrack(() => {
      if (g !== null && g !== vorigGoed) {
        const s = sterren[g];
        if (s) {
          s.vang = performance.now() / 1000;
          deeltjes?.uitbarsting(s.groep.position.x, s.groep.position.y, 0.6, [0xfde68a, 0xffffff, 0x86efac, 0xf9a8d4], 60, 4.5);
        }
      }
      vorigGoed = g;
    });
  });
</script>

<canvas bind:this={canvas} class="drie-d" aria-hidden="true"></canvas>

<style>
  .drie-d {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
</style>
