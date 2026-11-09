<script lang="ts">
  /**
   * 3D-getallenlijn als lichtgevende catwalk. Tik op een streepje om daar naartoe te springen;
   * de gouden ster springt met een boogje.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshStandardMaterial, MeshBasicMaterial } from 'three';
  import { maakPodium, tekstTextuur, type Podium } from '../ui/drie-d';

  let {
    van,
    tot,
    stap,
    positie,
    fout,
    doelen,
    getoond,
    opTik,
    opFout,
  }: {
    van: number;
    tot: number;
    stap: number;
    /** Waar de ster staat (null = nog niet gesprongen). */
    positie: number | null;
    fout: number[];
    /** Doelen die groen oplichten (als het antwoord getoond wordt). */
    doelen: number[];
    /** Bij welke streepjes staat een cijfer? */
    getoond: number[];
    opTik: (n: number) => void;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);

  const LENGTE = 15.6; // wereldbreedte van het getallenlijntje
  type Streep = { n: number; tick: Mesh; label: Mesh | null; gloed: Mesh };
  let strepen: Streep[] = [];
  let lijnGroep: Group;
  let ster: Group;
  let sterX = 0;
  let sterVan = 0;
  let sterNaar = 0;
  let sterStart = -10;
  let sterZichtbaar = false;
  let teken: (n: number) => number;

  // Bewust gewone (niet-reactieve) kopieën: de render-lus leest deze elke frame.
  let huidigFout: number[] = [];
  let huidigDoelen: number[] = [];
  let huidigToon: number[] = [];

  onMount(() => {
    let weg = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 34, camera: [0, 5.4, 9.4], kijkNaar: [0, 0.2, 0.75] });
        if (weg) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;

        // Catwalk
        const baan = new THREE.Mesh(
          new THREE.BoxGeometry(LENGTE + 1.6, 0.5, 3.4),
          new THREE.MeshStandardMaterial({ color: 0x3b1a6e, metalness: 0.2, roughness: 0.4, emissive: 0x2e1065, emissiveIntensity: 0.6 }),
        );
        baan.position.y = -0.25;
        const streep = new THREE.Mesh(
          new THREE.BoxGeometry(LENGTE + 1.6, 0.02, 0.06),
          new THREE.MeshBasicMaterial({ color: 0xfde68a }),
        );
        streep.position.set(0, 0.012, -0.55);
        const rand1 = new THREE.Mesh(new THREE.BoxGeometry(LENGTE + 1.6, 0.05, 0.06), new THREE.MeshBasicMaterial({ color: 0xf472b6 }));
        rand1.position.set(0, 0.005, 1.67);
        scene.add(baan, streep, rand1);

        lijnGroep = new THREE.Group();
        scene.add(lijnGroep);

        // Ster: een 5-puntige ster met dikte
        const sh = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? 0.78 : 0.35;
          const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) sh.moveTo(x, y);
          else sh.lineTo(x, y);
        }
        sh.closePath();
        const sterGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
        sterGeo.center();
        const sterMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 1.4, metalness: 0.3, roughness: 0.25 });
        ster = new THREE.Group();
        ster.add(new THREE.Mesh(sterGeo, sterMat));
        const halo = new THREE.Mesh(
          new THREE.CircleGeometry(1.0, 32),
          new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }),
        );
        halo.position.z = -0.2;
        ster.add(halo);
        ster.visible = false;
        scene.add(ster);

        p.bijTik((id) => opTik(Number(id)));

        p.bijFrame((t) => {
          // Streepjes: kleur volgens fout of doel
          for (const s of strepen) {
            const m = s.tick.material as MeshStandardMaterial;
            const isFout = huidigFout.includes(s.n);
            const isDoel = huidigDoelen.includes(s.n);
            const kleur = isFout ? 0xf87171 : isDoel ? 0x86efac : 0xffffff;
            m.color.setHex(kleur);
            m.emissive.setHex(kleur);
            m.emissiveIntensity = isDoel ? 1 + Math.sin(t * 6) * 0.5 : isFout ? 0.9 : 0.55;
            const gl = s.gloed.material as MeshBasicMaterial;
            gl.opacity = isDoel ? 0.35 + Math.sin(t * 6) * 0.15 : 0;
            s.gloed.visible = isDoel;
          }
          // De ster springt in een boog
          if (sterZichtbaar) {
            const v = Math.min(1, Math.max(0, (t - sterStart) / 0.55));
            const ease = v * v * (3 - 2 * v);
            sterX = sterVan + (sterNaar - sterVan) * ease;
            const hoogte = Math.sin(v * Math.PI) * (1.7 + Math.abs(sterNaar - sterVan) * 0.05);
            ster.position.set(sterX, 1.55 + hoogte + Math.sin(t * 2.5) * 0.05, 0);
            ster.rotation.y = Math.sin(t * 1.4) * 0.35 + v * Math.PI * 2;
            ster.scale.setScalar(1 + Math.sin(v * Math.PI) * 0.15);
          }
        });

        gereed = true;
        bouw();
        verplaatsSter(positie, true);
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

  function bouw() {
    if (!podium || !lijnGroep) return;
    const { THREE } = podium;
    // Oude streepjes opruimen
    for (const s of strepen) {
      lijnGroep.remove(s.tick, s.gloed);
      s.tick.geometry.dispose();
      (s.tick.material as MeshStandardMaterial).dispose();
      s.gloed.geometry.dispose();
      (s.gloed.material as MeshBasicMaterial).dispose();
      if (s.label) {
        lijnGroep.remove(s.label);
        ((s.label.material as MeshBasicMaterial).map as { dispose(): void } | null)?.dispose();
        (s.label.material as MeshBasicMaterial).dispose();
        s.label.geometry.dispose();
      }
      s.tick.userData = {};
    }
    strepen = [];
    for (const m of [...lijnGroep.children]) {
      if (m.userData.hit) {
        lijnGroep.remove(m);
        (m as Mesh).geometry.dispose();
      }
    }
    const aantal = Math.round((tot - van) / stap);
    teken = (n) => ((n - van) / (tot - van)) * LENGTE - LENGTE / 2;
    const afstand = LENGTE / aantal;

    for (let i = 0; i <= aantal; i++) {
      const n = van + i * stap;
      const tien = n % 10 === 0;
      const x = teken(n);
      const hoog = tien ? 1.15 : 0.7;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(tien ? 0.14 : 0.09, hoog, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.4 }),
      );
      tick.position.set(x, hoog / 2, -0.55);
      const gloed = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 1.5, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      gloed.position.set(x, 0.75, -0.55);
      gloed.visible = false;
      lijnGroep.add(tick, gloed);

      // Tikvlak: een bredere, onzichtbare doos rond het streepje
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(afstand * 0.98, 2.4, 2.6),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hit.position.set(x, 0.9, 0.3);
      hit.userData = { id: n, hit: true };
      lijnGroep.add(hit);

      strepen.push({ n, tick, label: null, gloed });
    }
    zetLabels();
  }

  /** Cijfers erbij of weghalen; ze worden pas getekend als ze nodig zijn. */
  function zetLabels() {
    if (!podium) return;
    const { THREE } = podium;
    for (const s of strepen) {
      const wil = huidigToon.includes(s.n);
      if (wil && !s.label) {
        const tien = s.n % 10 === 0;
        const tekst = String(s.n);
        const tex = tekstTextuur(THREE, tekst, { px: 128, breed: 192, kleur: tien ? '#ffffff' : '#fde68a' });
        const breed = tien ? 1.9 : 1.35;
        const label = new THREE.Mesh(
          new THREE.PlaneGeometry(breed, breed * (128 / 192)),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }),
        );
        label.position.set(s.tick.position.x, 0.2, 1.0);
        label.rotation.x = -1.2;
        lijnGroep.add(label);
        s.label = label;
      } else if (!wil && s.label) {
        lijnGroep.remove(s.label);
        ((s.label.material as MeshBasicMaterial).map as { dispose(): void } | null)?.dispose();
        (s.label.material as MeshBasicMaterial).dispose();
        s.label.geometry.dispose();
        s.label = null;
      }
    }
  }

  function verplaatsSter(n: number | null, direct = false) {
    if (!podium || !ster) return;
    if (n === null) {
      sterZichtbaar = false;
      ster.visible = false;
      return;
    }
    const doel = teken(n);
    if (!sterZichtbaar) {
      sterZichtbaar = true;
      ster.visible = true;
      sterVan = doel - 0.01;
    } else {
      sterVan = sterX;
    }
    sterNaar = doel;
    sterStart = direct ? -10 : performance.now() / 1000;
  }

  // Nieuwe opgave: de lijn opnieuw opbouwen
  $effect(() => {
    van;
    tot;
    stap;
    if (gereed) {
      untrack(() => {
        bouw();
        verplaatsSter(positie, true);
      });
    }
  });
  $effect(() => {
    huidigFout = [...fout];
    huidigDoelen = [...doelen];
    huidigToon = [...getoond];
    if (gereed) untrack(zetLabels);
  });
  $effect(() => {
    const n = positie;
    if (gereed) untrack(() => verplaatsSter(n));
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
