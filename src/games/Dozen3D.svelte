<script lang="ts">
  /**
   * 3D-podium voor Lightstick-dozen: dozen van 10 gloeiende lichtstokken en losse stokken.
   * Slepen draait het podium. Bij een fout (geen WebGL) geeft `opFout` een seintje voor de 2D-versie.
   */
  import { onMount } from 'svelte';
  import type { Object3D, Group, Mesh } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { maakSchaduw, maakSterren } from '../ui/drie-d-bouw';

  let { dozen, los, opFout }: { dozen: number; los: number; opFout: () => void } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let klaar = $state(false);

  type Item = { obj: Object3D; start: number; weg: boolean };
  const doosItems: Item[] = [];
  const stokItems: Item[] = [];
  let doosGroep: Group;
  let stokGroep: Group;
  let draai = 0;
  let bouwDoos: () => Object3D;
  let bouwStok: () => Object3D;

  const DOOS_PER_RIJ = 5;
  const doosPlek = (i: number) => {
    const rij = Math.floor(i / DOOS_PER_RIJ);
    const kol = i % DOOS_PER_RIJ;
    return { x: kol * 1.72 - 3.9, z: rij * -1.6 + 0.9 };
  };
  const stokPlek = (i: number) => ({ x: 5.2 + (i % 5) * 0.36, z: Math.floor(i / 5) * -1.0 + 0.9 });

  onMount(() => {
    let weg = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 36, camera: [1.6, 4.4, 10.2], kijkNaar: [1.6, 0.55, -0.5] });
        if (weg) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;

        // Vloer: een rond podium met een gloeiende rand
        const vloer = new THREE.Mesh(
          new THREE.CylinderGeometry(8.4, 8.8, 0.4, 64),
          new THREE.MeshPhysicalMaterial({ color: 0x4c1d95, metalness: 0.1, roughness: 0.6, envMapIntensity: 0.3, emissive: 0x2e1065, emissiveIntensity: 0.5 }),
        );
        vloer.position.set(1.6, -0.25, -0.5);
        vloer.scale.set(1.05, 1, 0.5);
        const rand = new THREE.Mesh(
          new THREE.TorusGeometry(8.6, 0.07, 12, 96),
          new THREE.MeshBasicMaterial({ color: 0xf472b6 }),
        );
        rand.rotation.x = Math.PI / 2;
        rand.position.set(1.6, -0.03, -0.5);
        rand.scale.set(1.05, 1, 0.5);
        scene.add(vloer, rand);
        maakSterren(p, { breed: 18, hoog: 4, y: 2, diep: 4, aantal: 36 });

        doosGroep = new THREE.Group();
        stokGroep = new THREE.Group();
        doosGroep.scale.setScalar(1.18);
        stokGroep.scale.setScalar(1.18);
        scene.add(doosGroep, stokGroep);

        const stokGeo = new THREE.CylinderGeometry(0.075, 0.075, 1.05, 14);
        const gloeiGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.1, 14);
        const stokMat = new THREE.MeshStandardMaterial({ color: 0xffd1e8, emissive: 0xf0489c, emissiveIntensity: 1.5, roughness: 0.35 });
        const gloeiMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
        const doosGeo = new THREE.BoxGeometry(1.55, 1.3, 1.0);
        const doosMat = new THREE.MeshPhysicalMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.38, roughness: 0.08, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, ior: 1.5, specularIntensity: 1 });
        const kaderGeo = new THREE.EdgesGeometry(doosGeo);
        const kaderMat = new THREE.LineBasicMaterial({ color: 0xddd6fe });

        bouwStok = () => {
          const g = new THREE.Group();
          const s = new THREE.Mesh(stokGeo, stokMat);
          s.position.y = 0.55;
          s.scale.set(1.6, 1.3, 1.6);
          const gl = new THREE.Mesh(gloeiGeo, gloeiMat);
          gl.position.y = 0.55;
          gl.scale.set(1.6, 1.3, 1.6);
          const sch = maakSchaduw(THREE, 0.35, 0.5);
          sch.position.y = -0.03;
          g.add(s, gl, sch);
          return g;
        };
        bouwDoos = () => {
          const g = new THREE.Group();
          const kast = new THREE.Mesh(doosGeo, doosMat);
          kast.position.y = 0.65;
          const kader = new THREE.LineSegments(kaderGeo, kaderMat);
          kader.position.copy(kast.position);
          const sch = maakSchaduw(THREE, 1.15, 0.55);
          sch.scale.y = 0.75;
          sch.position.y = -0.03;
          g.add(kast, kader, sch);
          for (let i = 0; i < 10; i++) {
            const s = new THREE.Mesh(stokGeo, stokMat);
            s.position.set(-0.6 + (i % 5) * 0.3, 0.62, i < 5 ? 0.2 : -0.2);
            g.add(s);
          }
          return g;
        };

        p.bijFrame((t, dt) => {
          // Doelen: pop-in met een beetje veer, weg = krimpen
          for (const lijst of [doosItems, stokItems]) {
            for (const it of lijst) {
              const v = Math.min(1, Math.max(0, (t - it.start) / 0.4));
              // easeOutBack: komt met een kleine veer binnen, krimpt rustig weg
              const c1 = 1.70158;
              const terug = 1 + (c1 + 1) * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2);
              it.obj.scale.setScalar(Math.max(0.0001, it.weg ? 1 - v : terug));
            }
            for (let i = lijst.length - 1; i >= 0; i--) {
              const it = lijst[i];
              if (it.weg && t - it.start > 0.4) {
                it.obj.parent?.remove(it.obj);
                lijst.splice(i, 1);
              }
            }
          }
          if (!p.camera.userData.reduceer) {
            doosGroep.position.y = Math.sin(t * 1.6) * 0.03;
            stokMat.emissiveIntensity = 1.35 + Math.sin(t * 3) * 0.25;
          }
          // Draai met sleep, en zwenk rustig terug naar het midden als je loslaat
          const hoek = draai;
          doosGroep.rotation.y = hoek;
          stokGroep.rotation.y = hoek;
          draai += (0 - draai) * Math.min(1, dt * 0.6);
        });
        p.bijSleep((dx) => {
          draai = Math.max(-0.9, Math.min(0.9, draai + dx * 0.006));
        });

        klaar = true;
        sync();
      } catch {
        opFout();
      }
    })();
    return () => {
      weg = true;
      podium?.opruimen();
      podium = null;
    };
  });

  function sync() {
    if (!podium || !klaar) return;
    const t = performance.now() / 1000;
    pasAan(doosItems, doosGroep, dozen, bouwDoos, (i) => doosPlek(i), t);
    pasAan(stokItems, stokGroep, los, bouwStok, (i) => stokPlek(i), t);
  }

  function pasAan(
    items: Item[],
    groep: Group,
    aantal: number,
    bouw: () => Object3D,
    plek: (i: number) => { x: number; z: number },
    t: number,
  ) {
    const actief = items.filter((i) => !i.weg);
    for (let i = actief.length; i < aantal; i++) {
      const o = bouw();
      const { x, z } = plek(i);
      o.position.set(x, 0, z);
      o.scale.setScalar(0.0001);
      groep.add(o);
      items.push({ obj: o, start: t, weg: false });
    }
    for (let i = actief.length - 1; i >= aantal; i--) {
      actief[i].weg = true;
      actief[i].start = t;
    }
  }

  $effect(() => {
    // Opnieuw bekijken als het aantal verandert
    dozen;
    los;
    sync();
  });
</script>

<canvas bind:this={canvas} class="drie-d" aria-label="Lichtstokken en dozen in 3D"></canvas>

<style>
  .drie-d {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: grab;
  }
</style>
