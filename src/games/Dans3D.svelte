<script lang="ts">
  /**
   * 3D-dansvloer voor Dans-sommen: de demonnetjes dobberen boven gloeiende tegels met hun antwoord.
   * Tik op een demon: poef! Fout: hij wordt grijs en lacht hihi.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, Texture } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import {
    bordTextuur,
    kleurDemon,
    maakDeeltjes,
    maakDemon3D,
    maakSchaduw,
    animeerDemon,
    maakSterren,
    veer,
    type Demon3D,
    type Deeltjes,
  } from '../ui/drie-d-bouw';

  let {
    keuzes,
    basis,
    sleutel,
    fout,
    weg,
    lacht,
    goed,
    actief,
    opKies,
    opFout,
  }: {
    keuzes: number[];
    /** Bepaalt het uiterlijk van de demonnetjes (net als de 2D-versie). */
    basis: number;
    sleutel: number;
    fout: number[];
    /** Index van de demon die wegpoeft. */
    weg: number | null;
    /** Index van de demon die hihi lacht. */
    lacht: number | null;
    /** Het goede antwoord, als het getoond moet worden. */
    goed: number | null;
    actief: boolean;
    opKies: (i: number) => void;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  type Item = {
    n: number;
    i: number;
    demon: Demon3D;
    groep: Group;
    bordMat: MeshBasicMaterial;
    tex: { norm: Texture; goed: Texture; fout: Texture };
    start: number;
    poef: number;
    wiebel: number;
    grijs: number;
    lachtTot: number;
    x: number;
    schaduw: Mesh;
  };
  let items: Item[] = [];
  let hoofdGroep: Group;
  let tegels: { mat: MeshStandardMaterial; fase: number }[] = [];

  let huidigFout: number[] = [];
  let huidigGoed: number | null = null;
  let huidigActief = false;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 34, camera: [0, 2.7, 7.6], kijkNaar: [0, 0.8, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 16, hoog: 5, y: 1, diep: 4 });

        // Dansvloer: een veld gloeiende tegels
        const vloer = new THREE.Group();
        const kleuren = [0xec4899, 0x8b5cf6, 0x22d3ee, 0x8b5cf6];
        const kolommen = 9;
        const rijen = 4;
        for (let r = 0; r < rijen; r++) {
          for (let k = 0; k < kolommen; k++) {
            const kl = kleuren[(r + k) % kleuren.length];
            const mat = new THREE.MeshStandardMaterial({ color: 0x2e1065, emissive: kl, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.1 });
            const tegel = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.16, 1.2), mat);
            tegel.position.set((k - (kolommen - 1) / 2) * 1.5, -0.08, 0.2 + (r - 1.5) * -1.3 + 0.3);
            vloer.add(tegel);
            tegels.push({ mat, fase: (k * 0.7 + r * 1.3) % 6.28 });
          }
        }
        scene.add(vloer);
        hoofdGroep = new THREE.Group();
        scene.add(hoofdGroep);

        p.bijTik((id) => {
          if (huidigActief) opKies(Number(id));
        });

        p.bijFrame((t) => {
          for (const tg of tegels) tg.mat.emissiveIntensity = 0.22 + 0.28 * (0.5 + 0.5 * Math.sin(t * 3.2 + tg.fase));
          for (const it of items) {
            const komt = Math.min(1, Math.max(0, (t - it.start) / 0.6));
            let s = Math.max(0.0001, veer(komt));
            let y = 1.15 + Math.sin(t * 2.1 + it.i * 1.3) * 0.18;
            if (komt < 1) y += (1 - komt) * 5;
            const ruk = Math.max(0, 1 - (t - it.wiebel) / 0.6);
            let rz = Math.sin(t * 1.6 + it.i) * 0.07 + Math.sin((t - it.wiebel) * 32) * 0.18 * ruk;
            let ry = Math.sin(t * 1.1 + it.i * 2) * 0.15;
            // Poef: draaien en krimpen
            if (it.poef > 0) {
              const v = Math.min(1, (t - it.poef) / 0.55);
              s *= 1 - v * v;
              ry += v * 9;
              y += v * 1.6;
            }
            it.groep.position.set(it.x, y, 0);
            it.groep.rotation.set(0, ry, rz);
            it.groep.scale.setScalar(Math.max(0.0001, s) * 0.92);
            // Schaduw op de dansvloer: kleiner en lichter als de demon hoger zweeft
            const hoog = Math.max(0, y - 1.15);
            it.schaduw.position.set(it.x, 0.02, 0.15);
            it.schaduw.scale.setScalar(Math.max(0.0001, s) * (1 - hoog * 0.12));
            (it.schaduw.material as MeshBasicMaterial).opacity = 0.55 * Math.max(0, 1 - hoog * 0.3) * Math.min(1, s);
            const isFout = huidigFout.includes(it.n);
            it.grijs += ((isFout ? 1 : 0) - it.grijs) * 0.15;
            kleurDemon(THREE, it.demon, it.grijs);
            // Mond: lachen = groot en open
            const lachend = t < it.lachtTot;
            animeerDemon(it.demon, t, lachend ? 'lacht' : huidigGoed === it.n ? 'blij' : isFout ? 'boos' : 'rust');
            const mond = it.demon.userData.mond;
            mond.scale.set(lachend ? 1.35 : isFout ? 0.8 : 1, lachend ? 1.7 + Math.sin(t * 22) * 0.25 : isFout ? 0.8 : 1, 1);
            mond.rotation.z = isFout && !lachend ? 0 : Math.PI;
            mond.position.y = isFout && !lachend ? -0.3 : -0.12;
            const goedNu = huidigGoed === it.n;
            it.bordMat.map = goedNu ? it.tex.goed : isFout ? it.tex.fout : it.tex.norm;
            it.groep.children[it.groep.children.length - 1].scale.setScalar(goedNu ? 1 + Math.sin(t * 6) * 0.06 : 1);
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
    if (!podium || !hoofdGroep) return;
    const { THREE } = podium;
    for (const it of items) {
      hoofdGroep.remove(it.groep, it.schaduw);
      it.schaduw.geometry.dispose();
      it.groep.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as MeshStandardMaterial | undefined;
        mat?.dispose?.();
      });
      for (const tx of Object.values(it.tex)) tx.dispose();
    }
    items = [];
    const t0 = performance.now() / 1000;
    const aantal = keuzes.length;
    keuzes.forEach((n, i) => {
      const x = (i - (aantal - 1) / 2) * 3.3;
      const groep = new THREE.Group();
      const demon = maakDemon3D(THREE, i + basis);
      groep.add(demon);
      // Bordje met het antwoord, vooraan op de buik
      const tex = {
        norm: bordTextuur(THREE, String(n), { breed: 256, hoog: 170, maat: 0.66 }),
        goed: bordTextuur(THREE, String(n), { breed: 256, hoog: 170, maat: 0.66, van: '#f0fdf4', naar: '#86efac', rand: '#16a34a', inkt: '#14532d' }),
        fout: bordTextuur(THREE, String(n), { breed: 256, hoog: 170, maat: 0.66, van: '#e5e7eb', naar: '#9ca3af', rand: '#6b7280', inkt: '#4b5563' }),
      };
      const bordMat = new THREE.MeshBasicMaterial({ map: tex.norm, transparent: true, toneMapped: false });
      const bord = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.16), bordMat);
      bord.position.set(0, -0.86, 1.12);
      bord.rotation.x = -0.12;
      groep.add(bord);
      // Tikvlak
      const hit = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), new THREE.MeshBasicMaterial({ visible: false }));
      hit.userData = { id: i };
      groep.add(hit);
      // Het bord moet het laatste kind zijn (animatie op schaal)
      groep.remove(bord);
      groep.add(bord);
      const schaduw = maakSchaduw(THREE, 1.25, 0.55);
      hoofdGroep.add(groep, schaduw);
      items.push({ n, i, demon, groep, bordMat, tex, start: t0 + i * 0.14, poef: 0, wiebel: -10, grijs: 0, lachtTot: -1, x, schaduw });
    });
  }

  $effect(() => {
    keuzes.join(',');
    sleutel;
    basis;
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
        const it = items.find((d) => d.n === fout[n - 1]);
        if (it) it.wiebel = performance.now() / 1000;
      }
      vorigeFouten = n;
    });
  });
  let vorigeWeg: number | null = null;
  $effect(() => {
    const w = weg;
    if (!gereed) return;
    untrack(() => {
      if (w !== null && w !== vorigeWeg) {
        const it = items[w];
        if (it) {
          it.poef = performance.now() / 1000;
          deeltjes?.uitbarsting(it.x, 1.3, 0.6, [0xfde68a, 0xf472b6, 0x67e8f9, 0xffffff], 44, 4.2);
        }
      }
      vorigeWeg = w;
    });
  });
  $effect(() => {
    const l = lacht;
    if (!gereed || l === null) return;
    untrack(() => {
      const it = items[l];
      if (it) it.lachtTot = performance.now() / 1000 + 1.3;
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
