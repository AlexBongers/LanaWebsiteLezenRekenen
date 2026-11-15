<script lang="ts">
  /**
   * Sorteer-show in 3D: een pakje met een woord rijdt over een lopende band naar het midden.
   * Tik op de goede mand: het pakje vliegt er in een boogje in. Fout: de mand wiebelt, het pakje schudt.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, Texture } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, maakDeeltjes, maakSchaduw, maakSterren, maakVloer, type Deeltjes } from '../ui/drie-d-bouw';
  import type { Bak } from '../engine/generator-sorteer';

  let {
    woord,
    bakken,
    goed,
    fout,
    actief,
    sleutel,
    opKies,
    opFout,
  }: {
    woord: string;
    bakken: Bak[];
    /** Index van de mand waar het pakje in moet vliegen (na een goed antwoord of onthullen). */
    goed: number | null;
    fout: number[];
    actief: boolean;
    sleutel: number;
    opKies: (i: number) => void;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  const KLEUREN = [0xf472b6, 0x38bdf8, 0xfbbf24];
  const MANDEN_X = [-3.2, 0, 3.2];
  const MAND_Z = 1.6;
  type Mand = { groep: Group; mat: MeshPhysicalMaterial; labelMat: MeshBasicMaterial; tex: Texture; wiebel: number };
  let manden: Mand[] = [];
  let pakje: Group;
  let pakjeMat: MeshPhysicalMaterial;
  let woordTex: Texture | null = null;
  let band: Texture;
  let komT = -10;
  let vliegT = -10;
  let vliegNaar = 0;
  let schudT = -10;
  let huidigActief = false;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 36, camera: [0, 4.6, 9.6], kijkNaar: [0, 1.0, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 18, hoog: 5, y: 2, diep: 4 });
        maakVloer(p, { z: 0, straal: 6.2, schaalX: 1.05, schaalZ: 0.5, kleur: 0x134e4a, randKleur: 0x2dd4bf });

        // Lopende band met bewegende streepjes
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 64;
        const g = c.getContext('2d')!;
        g.fillStyle = '#1f2937';
        g.fillRect(0, 0, 256, 64);
        g.fillStyle = '#374151';
        for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 14, 64);
        band = new THREE.CanvasTexture(c);
        band.wrapS = band.wrapT = THREE.RepeatWrapping;
        band.repeat.set(6, 1);
        const lopend = new THREE.Mesh(
          new THREE.BoxGeometry(13, 0.3, 1.6),
          [
            new THREE.MeshStandardMaterial({ color: 0x4b5563 }),
            new THREE.MeshStandardMaterial({ color: 0x4b5563 }),
            new THREE.MeshStandardMaterial({ map: band, roughness: 0.7 }),
            new THREE.MeshStandardMaterial({ color: 0x4b5563 }),
            new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.6, roughness: 0.3 }),
            new THREE.MeshStandardMaterial({ color: 0x4b5563 }),
          ],
        );
        lopend.position.set(-3, 0.95, -1.4);
        const poten = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.7, roughness: 0.3 });
        for (const x of [-8.5, -3, 2.5]) {
          const poot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 10), poten);
          poot.position.set(x, 0.4, -1.4);
          scene.add(poot);
        }
        scene.add(lopend);

        // Het pakje
        pakje = new THREE.Group();
        pakjeMat = new THREE.MeshPhysicalMaterial({ color: 0xd6a35c, roughness: 0.6, clearcoat: 0.3 });
        const voorMat = new THREE.MeshPhysicalMaterial({ roughness: 0.6, clearcoat: 0.3 });
        const doos = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 1.2), [pakjeMat, pakjeMat, pakjeMat, pakjeMat, voorMat, pakjeMat]);
        const tape = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.4 }));
        tape.position.y = 0.66;
        pakje.add(doos, tape);
        pakje.userData.voorMat = voorMat;
        scene.add(pakje);
        const pakjeSchaduw = maakSchaduw(THREE, 1.4, 0.45);
        pakjeSchaduw.scale.y = 0.5;
        scene.add(pakjeSchaduw);

        p.bijTik((id) => {
          if (huidigActief) opKies(Number(id));
        });

        p.bijFrame((t) => {
          // Pakje rijdt binnen over de band, en vliegt na een goed antwoord in de mand
          const rij = Math.min(1, Math.max(0, (t - komT) / 1.3));
          const e = 1 - Math.pow(1 - rij, 3);
          let x = -8 + e * 8;
          let y = 1.75 + (rij < 1 ? Math.abs(Math.sin(t * 14)) * 0.03 : 0);
          let z = -1.4;
          let s = 1;
          const vlieg = Math.min(1, Math.max(0, (t - vliegT) / 0.7));
          if (vliegT > 0 && t >= vliegT) {
            const v = vlieg * vlieg * (3 - 2 * vlieg);
            x = MANDEN_X[vliegNaar] * v;
            z = -1.4 + (MAND_Z + 1.4) * v;
            y = 1.75 + Math.sin(vlieg * Math.PI) * 2.2 - v * 0.9;
            s = 1 - v * 0.55;
            pakje.rotation.set(v * 0.4, v * Math.PI * 2, 0);
          } else {
            pakje.rotation.set(0, Math.sin(t * 1.2) * 0.04, Math.sin((t - schudT) * 30) * 0.08 * Math.max(0, 1 - (t - schudT) / 0.5));
          }
          pakje.position.set(x, y, z);
          pakje.scale.setScalar(s);
          pakje.visible = !(vliegT > 0 && vlieg >= 1);
          pakjeSchaduw.position.set(x, 1.12, z);
          pakjeSchaduw.visible = pakje.visible && !(vliegT > 0 && t >= vliegT);
          band.offset.x = rij < 1 ? -t * 1.5 : band.offset.x;
          // Manden
          manden.forEach((m, i) => {
            const w = Math.max(0, 1 - (t - m.wiebel) / 0.6);
            m.groep.rotation.z = Math.sin((t - m.wiebel) * 26) * 0.12 * w;
            const goedNu = vliegT > 0 && vliegNaar === i && t > vliegT + 0.6;
            m.groep.scale.setScalar(1 + (goedNu ? Math.max(0, Math.sin((t - vliegT - 0.6) * 10)) * 0.08 : 0));
            m.mat.emissiveIntensity = goedNu ? 0.6 : 0.12 + Math.sin(t * 2 + i) * 0.05;
          });
        });

        gereed = true;
        bouwManden();
        nieuwPakje();
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

  function labelTextuur(b: Bak) {
    const { THREE } = podium!;
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fffdf7';
    g.beginPath();
    g.roundRect(8, 8, 496, 240, 48);
    g.fill();
    g.lineWidth = 10;
    g.strokeStyle = '#ffffff';
    g.stroke();
    g.font = "120px 'Noto Color Emoji', 'Apple Color Emoji', sans-serif";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(b.icoon, 110, 132);
    g.font = "700 84px Fredoka, sans-serif";
    g.fillStyle = '#2e1065';
    g.fillText(b.naam, 330, 136, 300);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  function bouwManden() {
    if (!podium) return;
    const { THREE, scene } = podium;
    for (const m of manden) {
      scene.remove(m.groep);
      m.groep.traverse((o) => (o as Mesh).geometry?.dispose());
      m.tex.dispose();
    }
    manden = bakken.map((b, i) => {
      const kleur = KLEUREN[i % KLEUREN.length];
      const groep = new THREE.Group();
      const mat = new THREE.MeshPhysicalMaterial({ color: kleur, roughness: 0.45, clearcoat: 0.6, emissive: kleur, emissiveIntensity: 0.12, side: THREE.DoubleSide });
      const mand = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.95, 1.1, 32, 1, true), mat);
      mand.position.y = 0.55;
      const bodem = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), mat);
      bodem.rotation.x = -Math.PI / 2;
      bodem.position.y = 0.02;
      const rand = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.09, 10, 40), new THREE.MeshPhysicalMaterial({ color: 0xfef3c7, roughness: 0.4, clearcoat: 1 }));
      rand.rotation.x = Math.PI / 2;
      rand.position.y = 1.1;
      // Gevlochten streepjes
      for (let k = 0; k < 3; k++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0 + k * 0.1, 0.035, 6, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.3 + k * 0.3;
        groep.add(ring);
      }
      const tex = labelTextuur(b);
      const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.07), labelMat);
      label.position.set(0, 0.55, 1.35);
      label.rotation.x = -0.15;
      const hit = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.6, 2.8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 0.8;
      hit.userData = { id: i };
      const schaduw = maakSchaduw(THREE, 1.5, 0.5);
      schaduw.position.y = 0.01;
      groep.add(mand, bodem, rand, label, hit, schaduw);
      groep.position.set(MANDEN_X[i], 0, MAND_Z);
      scene.add(groep);
      return { groep, mat, labelMat, tex, wiebel: -10 };
    });
  }

  function nieuwPakje() {
    if (!podium || !pakje) return;
    const { THREE } = podium;
    woordTex?.dispose();
    woordTex = bordTextuur(THREE, woord, { breed: 512, hoog: 256, maat: 0.6, van: '#fffdf7', naar: '#fef3c7', rand: '#d6a35c', inkt: '#2e1065', font: "Andika, 'Fredoka', system-ui, sans-serif" });
    const voorMat = pakje.userData.voorMat as MeshPhysicalMaterial;
    voorMat.map = woordTex;
    voorMat.needsUpdate = true;
    komT = performance.now() / 1000;
    vliegT = -10;
  }

  $effect(() => {
    bakken.map((b) => b.id).join(',');
    sleutel;
    if (gereed) untrack(bouwManden);
  });
  $effect(() => {
    woord;
    sleutel;
    if (gereed) untrack(nieuwPakje);
  });
  $effect(() => {
    huidigActief = actief;
  });
  let vorigeFouten = 0;
  $effect(() => {
    const n = fout.length;
    if (!gereed) return;
    untrack(() => {
      if (n > vorigeFouten) {
        const m = manden[fout[n - 1]];
        const nu = performance.now() / 1000;
        if (m) m.wiebel = nu;
        schudT = nu;
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
        vliegNaar = g;
        vliegT = performance.now() / 1000;
        setTimeout(() => deeltjes?.uitbarsting(MANDEN_X[g], 1.6, MAND_Z + 0.5, [0x86efac, 0xfde68a, 0xffffff, 0xf472b6], 50, 4), 650);
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
