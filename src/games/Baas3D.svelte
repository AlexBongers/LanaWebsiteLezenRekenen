<script lang="ts">
  /**
   * 3D-baas voor het baasgevecht: een grote demon met kroon op een gloeiend platform.
   * Elk goed antwoord stuurt een regen noten van de groep naar de baas; hij schudt, flitst en
   * valt uiteindelijk in een sterrenregen uit elkaar. Alleen een mooi plaatje: tikken kan er niet.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial, Sprite } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, kleurDemon, maakDeeltjes, maakDemon3D, maakSterren, type Demon3D, type Deeltjes } from '../ui/drie-d-bouw';

  let {
    soort,
    verslagen,
    lacht,
    aanval,
    opFout,
  }: {
    soort: number;
    verslagen: boolean;
    lacht: boolean;
    /** Telt op bij elke zing-aanval. */
    aanval: number;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  let baas: Group;
  let demon: Demon3D;
  let kroon: Group;
  let aura: Mesh;
  let noten: { sprite: Sprite; start: number; y0: number; i: number; klaar: boolean }[] = [];
  let notenGroep: Group;
  let notenTex: import('three').Texture[] = [];

  let slagT = -10;
  let lachtTot = -1;
  let verslagenT = -10;
  let huidigLacht = false;
  let huidigVerslagen = false;

  const BAAS_X = 4.1;
  const START_X = -6.4;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 34, camera: [0, 2.6, 12.5], kijkNaar: [0, 2.3, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 16, hoog: 7, y: 0.5, diep: 3, aantal: 40 });

        // Platform met gloeiende ringen onder de baas
        const plat = new THREE.Mesh(
          new THREE.CylinderGeometry(2.7, 2.9, 0.35, 48),
          new THREE.MeshStandardMaterial({ color: 0x3b0764, emissive: 0x7e22ce, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.4 }),
        );
        plat.position.set(BAAS_X, -0.2, 0);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.07, 10, 64), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
        ring.rotation.x = Math.PI / 2;
        ring.position.set(BAAS_X, 0, 0);
        scene.add(plat, ring);
        aura = new THREE.Mesh(
          new THREE.TorusGeometry(2.4, 0.05, 8, 64),
          new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }),
        );
        aura.rotation.x = Math.PI / 2;
        aura.position.set(BAAS_X, 0.05, 0);
        scene.add(aura);

        // De baas: een grote demon met een kroon
        baas = new THREE.Group();
        demon = maakDemon3D(THREE, soort);
        demon.position.y = 1.5;
        demon.scale.setScalar(1.5);
        baas.add(demon);
        kroon = new THREE.Group();
        const goud = new THREE.MeshStandardMaterial({ color: 0xfde68a, metalness: 0.7, roughness: 0.22, emissive: 0xb45309, emissiveIntensity: 0.45 });
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.82, 0.32, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xfde68a, metalness: 0.7, roughness: 0.22, emissive: 0xb45309, emissiveIntensity: 0.45, side: THREE.DoubleSide }));
        kroon.add(band);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const punt = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 4), goud);
          punt.position.set(Math.cos(a) * 0.78, 0.4, Math.sin(a) * 0.78);
          kroon.add(punt);
          const steen = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: [0xf472b6, 0x22d3ee, 0x86efac][i % 3] }));
          steen.position.set(Math.cos(a) * 0.78, 0.7, Math.sin(a) * 0.78);
          kroon.add(steen);
        }
        kroon.position.set(0, 3.25, 0.1);
        kroon.rotation.z = -0.18;
        baas.add(kroon);
        baas.position.set(BAAS_X, 0, 0);
        scene.add(baas);

        // Noten voor de zing-aanval
        notenGroep = new THREE.Group();
        scene.add(notenGroep);
        notenTex = ['♪', '♫', '♬'].map((n) => bordTextuur(THREE, n, { breed: 128, hoog: 128, zonderBord: true, inkt: '#fde68a', glans: '#ec4899', maat: 0.8, font: 'sans-serif' }));

        p.bijFrame((t, dt) => {
          const sinds = t - slagT;
          const zweef = Math.sin(t * 2.4) * 0.14;
          const val = huidigVerslagen ? Math.min(1, (t - verslagenT) / 1.0) : 0;
          // Schudden bij een treffer
          const au = sinds < 0 ? 0 : Math.max(0, 1 - sinds / 0.5);
          baas.position.x = BAAS_X + Math.sin(sinds * 28) * 0.28 * au - au * 0.2;
          baas.position.y = zweef + (val > 0 ? val * 2.2 : 0);
          baas.rotation.z = Math.sin(t * 1.8) * 0.045 + (val > 0 ? val * 9 : Math.sin(sinds * 20) * 0.1 * au);
          const s = huidigVerslagen ? Math.max(0.0001, 1 - val * val) : 1 + (huidigLacht || t < lachtTot ? Math.abs(Math.sin(t * 9)) * 0.045 : 0);
          baas.scale.setScalar(s);
          // Treffer: wit flitsen, gelach: grote mond
          const flits = au > 0.3 ? 1 : 0;
          const m = demon.userData.lijfMat;
          m.emissive.setHex(flits ? 0xffffff : 0x000000);
          m.emissiveIntensity = flits ? 0.9 : 0.12;
          if (!flits) kleurDemon(THREE, demon, 0);
          const lachend = huidigLacht || t < lachtTot;
          const mond = demon.userData.mond;
          mond.scale.set(lachend ? 1.5 : 1, lachend ? 1.9 + Math.sin(t * 20) * 0.35 : au > 0 ? 1.4 : 1, 1);
          mond.rotation.z = au > 0.1 && !lachend ? 0 : Math.PI;
          mond.position.y = au > 0.1 && !lachend ? -0.3 : -0.12;
          kroon.position.y = 3.25 + Math.sin(t * 3) * 0.04;
          aura.rotation.z = t * 0.6;
          (aura.material as MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 2.5) * 0.2;
          // Noten
          for (let i = noten.length - 1; i >= 0; i--) {
            const n = noten[i];
            const v = (t - n.start) / 0.55;
            if (v < 0) {
              n.sprite.visible = false;
              continue;
            }
            n.sprite.visible = true;
            const e = Math.min(1, v);
            const x = START_X + (BAAS_X - 1.2 - START_X) * e;
            const y = n.y0 + (2.3 - n.y0) * e + Math.sin(e * Math.PI) * 1.1;
            n.sprite.position.set(x, y, 0.8);
            n.sprite.material.rotation = e * 3 + n.i;
            const sc = 0.7 + e * 0.9;
            n.sprite.scale.set(sc, sc, 1);
            if (e >= 1 && !n.klaar) {
              n.klaar = true;
              deeltjes?.uitbarsting(BAAS_X - 1.2, 2.2, 0.8, [0xfde68a, 0xf472b6, 0xffffff], 14, 3);
            }
            if (v > 1.15) {
              notenGroep.remove(n.sprite);
              n.sprite.material.dispose();
              noten.splice(i, 1);
            }
          }
        });

        gereed = true;
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

  function schiet() {
    if (!podium || !notenGroep) return;
    const { THREE } = podium;
    const t = performance.now() / 1000;
    for (let i = 0; i < 5; i++) {
      const mat = new THREE.SpriteMaterial({ map: notenTex[i % 3], transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      notenGroep.add(sprite);
      noten.push({ sprite, start: t + i * 0.06, y0: 0.8 + i * 0.5, i, klaar: false });
    }
    // Het geraakt-effect komt als de noten aankomen
    slagT = t + 0.55 + 0.05;
  }

  let vorigeAanval = 0;
  $effect(() => {
    const a = aanval;
    if (!gereed) return;
    untrack(() => {
      if (a > vorigeAanval) schiet();
      vorigeAanval = a;
    });
  });
  $effect(() => {
    huidigLacht = lacht;
    if (lacht) lachtTot = performance.now() / 1000 + 1.2;
  });
  $effect(() => {
    const v = verslagen;
    huidigVerslagen = v;
    if (v && gereed) {
      untrack(() => {
        verslagenT = performance.now() / 1000;
        for (const d of [0, 0.25, 0.5]) {
          setTimeout(() => deeltjes?.uitbarsting(BAAS_X, 2.2, 0.8, [0xfde68a, 0xf472b6, 0x67e8f9, 0xffffff], 60, 5.5, 2), d * 1000);
        }
      });
    }
  });
</script>

<canvas bind:this={canvas} class="drie-d" aria-hidden="true"></canvas>

<style>
  .drie-d {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
