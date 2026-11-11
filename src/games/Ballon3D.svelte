<script lang="ts">
  /** Glimmende ballonnen met getallen boven een podium. Goed getikt = knal met confetti in de kleur van de ballon. */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, Texture } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, maakDeeltjes, maakSchaduw, maakSterren, maakVloer, veer, type Deeltjes } from '../ui/drie-d-bouw';

  let {
    getallen,
    gepoft,
    fouten,
    toonVolgorde,
    actief,
    sleutel,
    opKies,
    opFout,
  }: {
    getallen: number[];
    /** Getallen die al geknald zijn. */
    gepoft: number[];
    /** Telt op bij elke foute tik; `fouten.at(-1)` is het laatst fout getikte getal. */
    fouten: number[];
    /** Na twee fouten: rangnummertjes laten zien. */
    toonVolgorde: boolean;
    actief: boolean;
    sleutel: number;
    opKies: (n: number) => void;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  const KLEUREN = [0xf472b6, 0x38bdf8, 0xa78bfa, 0xfbbf24, 0x4ade80];
  type Ballon = {
    n: number;
    groep: Group;
    lijf: Group;
    mat: MeshPhysicalMaterial;
    tex: Texture;
    rang: Mesh;
    rangTex: Texture;
    schaduw: Mesh;
    kleur: number;
    x: number;
    start: number;
    knal: number;
    wiebel: number;
  };
  let ballonnen: Ballon[] = [];
  let hoofd: Group;
  let huidigGepoft: number[] = [];
  let huidigVolgorde = false;
  let huidigActief = false;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 34, camera: [0, 2.2, 9.4], kijkNaar: [0, 2.0, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 18, hoog: 6, y: 0.5, diep: 4 });
        maakVloer(p, { z: -0.4, straal: 6.2, schaalX: 1.05, schaalZ: 0.36, kleur: 0x4c1d95, randKleur: 0xfbbf24 });
        hoofd = new THREE.Group();
        scene.add(hoofd);

        p.bijTik((id) => {
          if (huidigActief) opKies(Number(id));
        });

        p.bijFrame((t) => {
          for (const b of ballonnen) {
            const komt = Math.min(1, Math.max(0, (t - b.start) / 0.9));
            const op = veer(komt);
            const weg = huidigGepoft.includes(b.n);
            const knal = b.knal > 0 ? Math.min(1, (t - b.knal) / 0.25) : 0;
            const ruk = Math.max(0, 1 - (t - b.wiebel) / 0.6);
            b.groep.position.set(
              b.x + Math.sin(t * 0.9 + b.n) * 0.12,
              -3 + op * 3 + Math.sin(t * 1.6 + b.n * 0.7) * 0.15,
              0,
            );
            b.lijf.rotation.z = Math.sin(t * 1.2 + b.n) * 0.08 + Math.sin((t - b.wiebel) * 30) * 0.18 * ruk;
            const s = weg ? Math.max(0.0001, 1 + knal * 0.5) * (1 - knal) : 1;
            b.lijf.scale.setScalar(Math.max(0.0001, s));
            b.lijf.visible = !(weg && knal >= 1);
            b.schaduw.visible = b.lijf.visible;
            b.schaduw.scale.setScalar(0.9 + Math.sin(t * 1.6 + b.n * 0.7) * 0.06);
            b.rang.visible = huidigVolgorde && !weg;
            b.mat.emissiveIntensity = 0.12 + (huidigVolgorde ? Math.sin(t * 5) * 0.08 : 0);
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
    for (const b of ballonnen) {
      hoofd.remove(b.groep, b.schaduw);
      b.groep.traverse((o) => (o as Mesh).geometry?.dispose());
      b.schaduw.geometry.dispose();
      b.tex.dispose();
      b.rangTex.dispose();
    }
    ballonnen = [];
    const t0 = performance.now() / 1000;
    const gesorteerd = [...getallen].sort((a, b) => a - b);
    const n = getallen.length;
    getallen.forEach((g, i) => {
      const kleur = KLEUREN[(i + sleutel) % KLEUREN.length];
      const groep = new THREE.Group();
      const lijf = new THREE.Group();
      const mat = new THREE.MeshPhysicalMaterial({
        color: kleur,
        roughness: 0.15,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        sheen: 0.4,
        emissive: kleur,
        emissiveIntensity: 0.12,
      });
      const bol = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 30), mat);
      bol.scale.set(1, 1.18, 1);
      bol.position.y = 2.6;
      const knoop = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 12), mat);
      knoop.position.y = 1.36;
      knoop.rotation.x = Math.PI;
      const glim = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
      glim.scale.set(0.8, 1.3, 0.3);
      glim.position.set(-0.45, 3.15, 0.85);
      // Touwtje in een sierlijke slinger
      const punten = Array.from({ length: 12 }, (_, k) => new THREE.Vector3(Math.sin(k * 0.9) * 0.12, 1.25 - k * 0.11, 0));
      const touw = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(punten), 24, 0.018, 6),
        new THREE.MeshBasicMaterial({ color: 0xf5f3ff }),
      );
      // Getal
      const tex = bordTextuur(THREE, String(g), { breed: 256, hoog: 256, zonderBord: true, inkt: '#ffffff', maat: 0.62, glans: 'rgba(30,10,60,0.9)' });
      const getal = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
      getal.position.set(0, 2.6, 1.02);
      // Rangnummer (hint na twee fouten)
      const rangTex = bordTextuur(THREE, String(gesorteerd.indexOf(g) + 1), { breed: 128, hoog: 128, rond: true, van: '#fffbeb', naar: '#fde68a', rand: '#f59e0b', inkt: '#78350f', maat: 0.6 });
      const rang = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: rangTex, transparent: true, toneMapped: false }));
      rang.position.set(0.75, 3.55, 0.9);
      rang.visible = false;
      const hit = new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 10), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 2.5;
      hit.userData = { id: g };
      lijf.add(bol, knoop, glim, touw, getal, rang, hit);
      groep.add(lijf);
      const x = (i - (n - 1) / 2) * 2.6;
      const schaduw = maakSchaduw(THREE, 0.9, 0.35);
      schaduw.position.set(x, 0.02, 0);
      hoofd.add(groep, schaduw);
      ballonnen.push({ n: g, groep, lijf, mat, tex, rang, rangTex, schaduw, kleur, x, start: t0 + i * 0.15, knal: 0, wiebel: -10 });
    });
  }

  $effect(() => {
    getallen.join(',');
    sleutel;
    if (gereed) untrack(bouw);
  });
  $effect(() => {
    huidigVolgorde = toonVolgorde;
    huidigActief = actief;
  });
  // Nieuw geknald: knal en confetti in de kleur van de ballon
  $effect(() => {
    const lijst = [...gepoft];
    huidigGepoft = lijst;
    if (!gereed) return;
    untrack(() => {
      for (const g of lijst) {
        const b = ballonnen.find((x) => x.n === g);
        if (b && b.knal === 0) {
          b.knal = performance.now() / 1000;
          deeltjes?.uitbarsting(b.groep.position.x, b.groep.position.y + 2.6, 0.5, [b.kleur, 0xffffff, 0xfde68a], 46, 4.6);
        }
      }
    });
  });
  let vorigeFouten = 0;
  $effect(() => {
    const n = fouten.length;
    if (!gereed) return;
    untrack(() => {
      if (n > vorigeFouten) {
        const b = ballonnen.find((x) => x.n === fouten[n - 1]);
        if (b) b.wiebel = performance.now() / 1000;
      }
      vorigeFouten = n;
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
