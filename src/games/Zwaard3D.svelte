<script lang="ts">
  /**
   * 3D-houtbewerking voor het Klankgroepen-zwaard: elke letter is een blokje. Tik tussen de blokjes
   * om een snede te zetten; bij "Hakken!" zwiept het zwaard erdoorheen en vallen de klankgroepen uit elkaar.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Texture } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, maakDeeltjes, maakSchaduw, maakSterren, maakVloer, veer, type Deeltjes } from '../ui/drie-d-bouw';

  let {
    woord,
    knippen,
    gehakt,
    hint,
    sleutel,
    opSpleet,
    opFout,
  }: {
    woord: string;
    /** Snedes: een getal n betekent een snede tussen letter n-1 en letter n. */
    knippen: number[];
    gehakt: boolean;
    /** Klinkers geel laten oplichten. */
    hint: boolean;
    sleutel: number;
    opSpleet: (na: number) => void;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  const BW = 1.15;
  const GAP = 0.55;
  const PITCH = BW + GAP;

  type Blok = {
    i: number;
    groep: Group;
    mat: MeshStandardMaterial[];
    norm: Texture;
    klinker: Texture;
    x: number;
    start: number;
    schaduw: Mesh;
  };
  type Spleet = { na: number; x: number; teken: Mesh; blad: Mesh; kader: Mesh };

  let blokken: Blok[] = [];
  let spleten: Spleet[] = [];
  let woordGroep: Group;
  let zwaard: Group;
  let schaal = 1;
  let totaal = 0;
  let slagStart = -10;
  let sneeSinds = -10; // wanneer de blokken uit elkaar gaan
  let huidigKnippen: number[] = [];
  let huidigGehakt = false;
  let huidigHint = false;
  let verdeeld = 0; // 0..1 hoe ver de groepen uit elkaar staan

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 26, camera: [0, 2.5, 11.6], kijkNaar: [0, 0.45, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 18, hoog: 4.5, y: 0.6, diep: 4 });
        maakVloer(p, { y: -0.95, z: 0, straal: 6.2, schaalX: 1.4, schaalZ: 0.28 });

        woordGroep = new THREE.Group();
        scene.add(woordGroep);

        // Zwaard
        zwaard = new THREE.Group();
        const staal = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.8, roughness: 0.15, emissive: 0x22d3ee, emissiveIntensity: 0.7 });
        const goud = new THREE.MeshStandardMaterial({ color: 0xfde68a, metalness: 0.7, roughness: 0.25, emissive: 0xb45309, emissiveIntensity: 0.3 });
        const blad = new THREE.Mesh(new THREE.BoxGeometry(0.34, 3.6, 0.07), staal);
        blad.position.y = 1.9;
        const punt = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.5, 4), staal);
        punt.position.y = 3.95;
        punt.rotation.y = Math.PI / 4;
        punt.scale.z = 0.3;
        const kruis = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.22), goud);
        kruis.position.y = 0.1;
        const greep = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.5 }));
        greep.position.y = -0.4;
        const knop = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), goud);
        knop.position.y = -0.85;
        const gloed = new THREE.Mesh(
          new THREE.PlaneGeometry(1.6, 4.6),
          new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }),
        );
        gloed.position.y = 1.9;
        zwaard.add(blad, punt, kruis, greep, knop, gloed);
        zwaard.visible = false;
        scene.add(zwaard);

        p.bijTik((id) => opSpleet(Number(id)));

        p.bijFrame((t) => {
          // Blokjes: komen binnen met een veertje, hippen even bij het hakken
          const sinds = t - sneeSinds;
          const doel = huidigGehakt ? 1 : 0;
          verdeeld += (doel - verdeeld) * (doel ? 0.16 : 1);
          if (!huidigGehakt) verdeeld = 0;
          const groepen = 1 + huidigKnippen.length;
          for (const b of blokken) {
            const komt = Math.min(1, Math.max(0, (t - b.start) / 0.5));
            const s = Math.max(0.0001, veer(komt));
            const idx = huidigKnippen.filter((c) => c <= b.i).length;
            const uitelkaar = (idx - (groepen - 1) / 2) * 1.05 * verdeeld;
            const hup = huidigGehakt ? Math.max(0, Math.sin(Math.min(1, Math.max(0, (sinds - 0.2) / 0.55)) * Math.PI)) * 0.35 : 0;
            b.groep.position.set(b.x + uitelkaar, (1 - Math.min(1, komt)) * 3 + hup + Math.sin(t * 1.6 + b.i * 0.7) * 0.03, 0);
            b.groep.scale.setScalar(s);
            b.schaduw.position.set(b.groep.position.x * schaal, -0.93, 0.15);
            b.schaduw.scale.set(s * schaal, s * schaal * 0.55, 1);
            (b.schaduw.material as MeshBasicMaterial).opacity = 0.5 * Math.min(1, s) * Math.max(0.3, 1 - b.groep.position.y * 0.6);
            b.groep.rotation.z = Math.sin(t * 1.2 + b.i) * 0.015 + (huidigGehakt ? Math.sin((sinds - 0.2) * 9 + idx) * 0.06 * Math.max(0, 1 - sinds) : 0);
            const isK = huidigHint && 'aeiouy'.includes(woord[b.i] ?? '');
            b.mat[4].map = isK ? b.klinker : b.norm;
            b.mat[4].emissive.setHex(isK ? 0xfbbf24 : 0x000000);
            b.mat[4].emissiveIntensity = isK ? 0.35 + Math.sin(t * 4) * 0.15 : 0;
          }
          // Spleten: tikmarkering of een zwaardsnede
          for (const sp of spleten) {
            const sel = huidigKnippen.includes(sp.na);
            const idx = huidigKnippen.filter((c) => c <= sp.na - 1).length;
            // De spleet zit tussen twee groepen: precies in het midden van het uit elkaar gaan
            const mid = sp.x + ((idx - (groepen - 1) / 2) * 1.05 * verdeeld + ((idx + 1) - (groepen - 1) / 2) * 1.05 * verdeeld) / 2;
            const x = sel && huidigGehakt ? mid : sp.x;
            sp.teken.position.x = sp.x;
            sp.teken.visible = !sel;
            sp.teken.rotation.y = t * 1.6 + sp.na;
            sp.teken.position.y = -0.8 + Math.sin(t * 2.4 + sp.na) * 0.07;
            (sp.teken.material as MeshBasicMaterial).opacity = 0.5 + Math.sin(t * 3 + sp.na) * 0.25;
            sp.blad.visible = sel;
            sp.blad.position.x = x;
            (sp.blad.material as MeshBasicMaterial).opacity = huidigGehakt ? Math.max(0, 0.9 - sinds * 0.8) : 0.55 + Math.sin(t * 6) * 0.2;
            sp.kader.visible = !sel;
          }
          // Zwaardslag
          const zs = (t - slagStart) / 0.55;
          if (zs >= 0 && zs <= 1) {
            zwaard.visible = true;
            const e = zs * zs * (3 - 2 * zs);
            const halve = (totaal * schaal) / 2 + 2.6;
            zwaard.position.set(-halve + e * halve * 2, 1.9 - e * 1.6, 1.0);
            zwaard.rotation.z = -0.5 - e * 0.9;
            zwaard.rotation.x = 0.2;
          } else {
            zwaard.visible = false;
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
    if (!podium || !woordGroep) return;
    const { THREE } = podium;
    for (const b of blokken) {
      podium.scene.remove(b.schaduw);
      b.schaduw.geometry.dispose();
      woordGroep.remove(b.groep);
      b.groep.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose?.();
      });
      b.mat.forEach((m) => m.dispose());
      b.norm.dispose();
      b.klinker.dispose();
    }
    for (const s of spleten) {
      woordGroep.remove(s.teken, s.blad, s.kader);
      s.teken.geometry.dispose();
      s.blad.geometry.dispose();
      s.kader.geometry.dispose();
    }
    // Hit-vlakken van een eerdere ronde ook opruimen
    for (const m of [...woordGroep.children]) {
      if (m.userData.hit) {
        woordGroep.remove(m);
        (m as Mesh).geometry.dispose();
      }
    }
    blokken = [];
    spleten = [];
    const n = woord.length;
    totaal = n * BW + (n - 1) * GAP;
    schaal = Math.min(1.7, 14 / totaal);
    woordGroep.scale.setScalar(schaal);
    const t0 = performance.now() / 1000;
    const letterX = (i: number) => -totaal / 2 + BW / 2 + i * PITCH;
    const zij = new THREE.MeshPhysicalMaterial({ color: 0xc4b5fd, roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.2 });

    woord.split('').forEach((l, i) => {
      const font = "Andika, 'Fredoka', system-ui, sans-serif";
      const norm = bordTextuur(THREE, l, { breed: 200, hoog: 260, van: '#fffdf7', naar: '#ede9fe', rand: '#ddd6fe', inkt: '#2e1065', maat: 0.58, font });
      const klinker = bordTextuur(THREE, l, { breed: 200, hoog: 260, van: '#fffbe0', naar: '#fde68a', rand: '#fbbf24', inkt: '#422006', maat: 0.58, font });
      const voor = new THREE.MeshPhysicalMaterial({ map: norm, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
      const mats = [zij, zij, zij, zij, voor, zij] as MeshStandardMaterial[];
      const blok = new THREE.Mesh(new THREE.BoxGeometry(BW, 1.5, 0.5), mats);
      const g = new THREE.Group();
      g.add(blok);
      g.position.set(letterX(i), 0, 0);
      woordGroep.add(g);
      const schaduw = maakSchaduw(THREE, 0.85, 0.5);
      podium!.scene.add(schaduw);
      blokken.push({ i, groep: g, mat: mats, norm, klinker, x: letterX(i), start: t0 + i * 0.07, schaduw });
    });

    // Spleten tussen de letters
    for (let na = 1; na < n; na++) {
      const x = (letterX(na - 1) + letterX(na)) / 2;
      const teken = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.2, 0),
        new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      teken.position.set(x, -0.8, 0.1);
      const kader = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.25 }));
      kader.position.set(x, 0, 0.1);
      const blad = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 2.5, 0.35),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      blad.position.set(x, 0.05, 0.1);
      blad.visible = false;
      const hit = new THREE.Mesh(new THREE.BoxGeometry(PITCH * 0.88, 3, 1.4), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.set(x, 0, 0.2);
      hit.userData = { id: na, hit: true };
      woordGroep.add(teken, kader, blad, hit);
      spleten.push({ na, x, teken, blad, kader });
    }
    verdeeld = 0;
    sneeSinds = -10;
  }

  function hak() {
    if (!podium || !deeltjes) return;
    const t = performance.now() / 1000;
    slagStart = t;
    sneeSinds = t;
    // Vonken precies op de snedes, net nadat het zwaard langskomt
    for (const sp of spleten) {
      if (!huidigKnippen.includes(sp.na)) continue;
      const vertraging = ((sp.x * schaal + (totaal * schaal) / 2 + 2.6) / ((totaal * schaal) / 2 + 2.6) / 2) * 550;
      setTimeout(() => deeltjes?.uitbarsting(sp.x * schaal, 0.7, 0.9, [0x67e8f9, 0xfde68a, 0xffffff], 34, 4), vertraging);
    }
  }

  $effect(() => {
    woord;
    sleutel;
    if (gereed) untrack(bouw);
  });
  $effect(() => {
    huidigKnippen = [...knippen];
    huidigHint = hint;
  });
  let vorigGehakt = false;
  $effect(() => {
    const g = gehakt;
    huidigGehakt = g;
    if (!gereed) return;
    untrack(() => {
      if (g && !vorigGehakt) hak();
      vorigGehakt = g;
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
