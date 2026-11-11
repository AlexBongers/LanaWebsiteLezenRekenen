<script lang="ts">
  /**
   * Een grote glimmende wekker met belletjes. De wijzers draaien naar elke nieuwe tijd.
   * Goed antwoord: de wekker rinkelt en schudt; fout: een klein wiebeltje.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { gloedTextuur, maakDeeltjes, maakSchaduw, maakSterren, maakVloer, type Deeltjes } from '../ui/drie-d-bouw';
  import type { Tijd } from '../engine/generator-fase5';

  let {
    tijd,
    rinkel,
    wiebel,
    opFout,
  }: {
    tijd: Tijd;
    /** Telt op bij elk goed antwoord. */
    rinkel: number;
    /** Telt op bij elk fout antwoord. */
    wiebel: number;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  let wekker: Group;
  let uurWijzer: Group;
  let minWijzer: Group;
  let hamer: Mesh;
  // Wijzerstanden in rondjes (1 = een hele keer rond), zodat ze altijd vooruit draaien
  let minVan = 0;
  let minNaar = 0;
  let uurVan = 0;
  let uurNaar = 0;
  let draaiStart = -10;
  let rinkelT = -10;
  let wiebelT = -10;

  function zetTijd(t: Tijd, direct = false) {
    const nieuwMin = t.min / 60;
    const nieuwUur = ((t.uur % 12) + t.min / 60) / 12;
    // Minutenwijzer draait altijd minstens een rondje vooruit: leuk om naar te kijken
    const nu = performance.now() / 1000;
    const huidigMin = minNaar;
    let doelMin = Math.floor(huidigMin) + nieuwMin;
    while (doelMin < huidigMin + 1) doelMin += 1;
    let doelUur = Math.floor(uurNaar) + nieuwUur;
    if (doelUur < uurNaar) doelUur += 1;
    minVan = direct ? doelMin : minNaar;
    uurVan = direct ? doelUur : uurNaar;
    minNaar = doelMin;
    uurNaar = doelUur;
    draaiStart = direct ? -10 : nu;
  }

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 32, camera: [0, 2.2, 10.5], kijkNaar: [0, 2.3, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 16, hoog: 6, y: 0.5, diep: 4 });
        maakVloer(p, { z: -0.3, straal: 4.4, schaalX: 1.25, schaalZ: 0.38, kleur: 0x4c1d95, randKleur: 0xf472b6 });

        wekker = new THREE.Group();
        scene.add(wekker);
        const kast = new THREE.MeshPhysicalMaterial({ color: 0xf472b6, roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1 });
        const goud = new THREE.MeshPhysicalMaterial({ color: 0xfde68a, metalness: 0.95, roughness: 0.18, emissive: 0xb45309, emissiveIntensity: 0.12 });

        const lijf = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.8, 64), kast);
        lijf.rotation.x = Math.PI / 2;
        lijf.position.y = 2.5;
        const rand = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.13, 16, 64), goud);
        rand.position.set(0, 2.5, 0.42);

        // Wijzerplaat met cijfers en streepjes
        const c = document.createElement('canvas');
        c.width = c.height = 1024;
        const g = c.getContext('2d')!;
        const gr = g.createRadialGradient(512, 440, 50, 512, 512, 512);
        gr.addColorStop(0, '#ffffff');
        gr.addColorStop(1, '#fdf2f8');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(512, 512, 512, 0, Math.PI * 2);
        g.fill();
        for (let i = 0; i < 60; i++) {
          const a = (i / 60) * Math.PI * 2;
          const groot = i % 5 === 0;
          g.strokeStyle = groot ? '#7c3aed' : '#c4b5fd';
          g.lineWidth = groot ? 12 : 5;
          g.beginPath();
          g.moveTo(512 + Math.sin(a) * (groot ? 430 : 455), 512 - Math.cos(a) * (groot ? 430 : 455));
          g.lineTo(512 + Math.sin(a) * 485, 512 - Math.cos(a) * 485);
          g.stroke();
        }
        g.fillStyle = '#2e1065';
        g.font = '700 120px Fredoka, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        for (let u = 1; u <= 12; u++) {
          const a = (u / 12) * Math.PI * 2;
          g.fillText(String(u), 512 + Math.sin(a) * 345, 512 - Math.cos(a) * 345 + 8);
        }
        const plaatTex = new THREE.CanvasTexture(c);
        plaatTex.colorSpace = THREE.SRGBColorSpace;
        plaatTex.anisotropy = 8;
        const plaat = new THREE.Mesh(new THREE.CircleGeometry(1.95, 64), new THREE.MeshBasicMaterial({ map: plaatTex, toneMapped: false }));
        plaat.position.set(0, 2.5, 0.41);

        // Glazen glans over de wijzerplaat
        const glas = new THREE.Mesh(
          new THREE.CircleGeometry(1.95, 64),
          new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0, clearcoat: 1, depthWrite: false }),
        );
        glas.position.set(0, 2.5, 0.62);

        // Wijzers (draaien om het midden)
        const maakWijzer = (lengte: number, dik: number, kleur: number, z: number) => {
          const w = new THREE.Group();
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(dik, lengte, 0.05),
            new THREE.MeshStandardMaterial({ color: kleur, roughness: 0.3, metalness: 0.2 }),
          );
          m.position.y = lengte / 2 - 0.15;
          const punt = new THREE.Mesh(new THREE.ConeGeometry(dik * 0.9, 0.3, 4), m.material);
          punt.position.y = lengte - 0.05;
          punt.scale.z = 0.3;
          w.add(m, punt);
          w.position.set(0, 2.5, z);
          return w;
        };
        uurWijzer = maakWijzer(1.05, 0.2, 0x2e1065, 0.46);
        minWijzer = maakWijzer(1.55, 0.12, 0xdb2777, 0.5);
        const dop = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), goud);
        dop.position.set(0, 2.5, 0.55);

        // Belletjes, hamertje en pootjes
        const bellen: Mesh[] = [];
        for (const kant of [-1, 1]) {
          const bel = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), goud);
          bel.position.set(kant * 1.25, 4.55, -0.1);
          bel.rotation.z = kant * -0.5;
          const voet = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), goud);
          voet.position.set(kant * 1.05, 4.25, -0.1);
          voet.rotation.z = kant * -0.5;
          const poot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.6, 12), goud);
          poot.position.set(kant * 1.3, 0.35, 0);
          poot.rotation.z = kant * 0.35;
          wekker.add(bel, voet, poot);
          bellen.push(bel);
        }
        hamer = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), goud);
        hamer.position.set(0, 4.75, -0.1);
        const steel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), goud);
        steel.position.set(0, 4.5, -0.1);
        const gloed = new THREE.Mesh(
          new THREE.CircleGeometry(3.4, 48),
          new THREE.MeshBasicMaterial({ map: gloedTextuur(THREE, '#f9a8d4'), transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }),
        );
        gloed.position.set(0, 2.6, -0.8);
        const schaduw = maakSchaduw(THREE, 2.3, 0.55);
        schaduw.position.set(0, 0.02, 0.1);
        schaduw.scale.y = 0.5;
        wekker.add(gloed, lijf, rand, plaat, glas, uurWijzer, minWijzer, dop, hamer, steel);
        scene.add(schaduw);

        p.bijFrame((t) => {
          // Wijzers draaien met een zachte veer naar hun plek
          const v = Math.min(1, Math.max(0, (t - draaiStart) / 1.4));
          const e = 1 - Math.pow(1 - v, 3);
          const minPos = minVan + (minNaar - minVan) * e;
          const uurPos = uurVan + (uurNaar - uurVan) * e;
          minWijzer.rotation.z = -minPos * Math.PI * 2;
          uurWijzer.rotation.z = -uurPos * Math.PI * 2;
          // Rinkelen: snel schudden, hamertje heen en weer
          const r = Math.max(0, 1 - (t - rinkelT) / 1.2);
          const w = Math.max(0, 1 - (t - wiebelT) / 0.5);
          wekker.rotation.z = Math.sin(t * 50) * 0.06 * r + Math.sin((t - wiebelT) * 28) * 0.05 * w + Math.sin(t * 1.2) * 0.015;
          wekker.position.y = Math.abs(Math.sin(t * 25)) * 0.12 * r + Math.sin(t * 1.5) * 0.04;
          hamer.position.x = Math.sin(t * 40) * 0.5 * r;
          bellen.forEach((b, i) => (b.scale.setScalar(1 + Math.abs(Math.sin(t * 40 + i)) * 0.06 * r)));
          (gloed.material as import('three').MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 2) * 0.1 + r * 0.4;
        });

        gereed = true;
        zetTijd(tijd, false);
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

  $effect(() => {
    const t = { ...tijd };
    if (gereed) untrack(() => zetTijd(t));
  });
  let vorigeRinkel = 0;
  $effect(() => {
    const r = rinkel;
    if (!gereed) return;
    untrack(() => {
      if (r > vorigeRinkel) {
        rinkelT = performance.now() / 1000;
        deeltjes?.uitbarsting(-1.25, 4.6, 0.4, [0xfde68a, 0xffffff, 0xf9a8d4], 30, 3.5);
        deeltjes?.uitbarsting(1.25, 4.6, 0.4, [0xfde68a, 0xffffff, 0x86efac], 30, 3.5);
      }
      vorigeRinkel = r;
    });
  });
  let vorigeWiebel = 0;
  $effect(() => {
    const w = wiebel;
    if (!gereed) return;
    untrack(() => {
      if (w > vorigeWiebel) wiebelT = performance.now() / 1000;
      vorigeWiebel = w;
    });
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
