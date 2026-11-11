<script lang="ts">
  /**
   * Verliefde harten: een groot hart in twee helften. Links staat een getal, rechts een vraagteken.
   * Goed: de rechterhelft krijgt het getal, de helften klikken tegen elkaar en er zweven hartjes op.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, Texture } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, gloedTextuur, maakDeeltjes, maakSchaduw, maakSterren, maakVloer, type Deeltjes } from '../ui/drie-d-bouw';

  let {
    totaal,
    deel,
    antwoord,
    toon,
    wiebel,
    sleutel,
    opFout,
  }: {
    totaal: number;
    deel: number;
    antwoord: number;
    /** Laat het antwoord zien en klik de helften samen. */
    toon: boolean;
    /** Telt op bij elk fout antwoord. */
    wiebel: number;
    sleutel: number;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  let links: Group;
  let rechts: Group;
  let linksLabel: MeshBasicMaterial;
  let rechtsLabel: MeshBasicMaterial;
  let totaalLabel: MeshBasicMaterial;
  let rechtsMat: MeshPhysicalMaterial;
  let tex: Texture[] = [];
  let samenT = -10;
  let wiebelT = -10;
  let nieuwT = -10;
  let huidigToon = false;
  let hartjes: { m: Mesh; start: number; x: number; snel: number }[] = [];
  let hartGeo: import('three').ShapeGeometry;
  let hartMat: MeshBasicMaterial;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 34, camera: [0, 2.2, 9.8], kijkNaar: [0, 2.35, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 16, hoog: 6, y: 0.5, diep: 4 });
        maakVloer(p, { z: -0.2, straal: 4.6, schaalX: 1.3, schaalZ: 0.4, kleur: 0x500724, randKleur: 0xf472b6 });

        // Halve hartvorm (linkerhelft); de rechterhelft is het spiegelbeeld
        const half = new THREE.Shape();
        half.moveTo(0, -1.55);
        half.bezierCurveTo(-0.6, -1.0, -1.75, -0.3, -1.75, 0.55);
        half.bezierCurveTo(-1.75, 1.35, -1.15, 1.75, -0.75, 1.75);
        half.bezierCurveTo(-0.35, 1.75, -0.05, 1.5, 0, 1.15);
        half.lineTo(0, -1.55);
        const geo = new THREE.ExtrudeGeometry(half, { depth: 0.55, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.12, bevelSegments: 4, curveSegments: 24 });
        geo.translate(0, 0, -0.27);

        const maakHelft = (kleur: number, spiegel: boolean) => {
          const g = new THREE.Group();
          const mat = new THREE.MeshPhysicalMaterial({ color: kleur, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.5, emissive: kleur, emissiveIntensity: 0.2, side: THREE.DoubleSide });
          const m = new THREE.Mesh(geo, mat);
          if (spiegel) m.scale.x = -1;
          const labelMat = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false });
          const label = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.35), labelMat);
          label.position.set(spiegel ? 0.85 : -0.85, 0.35, 0.42);
          g.add(m, label);
          return { g, mat, labelMat };
        };
        const l = maakHelft(0xf472b6, false);
        const r = maakHelft(0xc026d3, true);
        links = l.g;
        rechts = r.g;
        linksLabel = l.labelMat;
        rechtsLabel = r.labelMat;
        rechtsMat = r.mat;
        links.position.set(-0.6, 2.1, 0);
        rechts.position.set(0.6, 2.1, 0);
        scene.add(links, rechts);

        // Het grote getal zweeft in een gouden wolkje boven het hart
        totaalLabel = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false });
        const totaalBord = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), totaalLabel);
        totaalBord.position.set(0, 4.3, 0.2);
        scene.add(totaalBord);
        const gloed = new THREE.Mesh(
          new THREE.CircleGeometry(3.2, 40),
          new THREE.MeshBasicMaterial({ map: gloedTextuur(THREE, '#f9a8d4'), transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }),
        );
        gloed.position.set(0, 2.2, -0.8);
        scene.add(gloed);
        const schaduw = maakSchaduw(THREE, 2.2, 0.5);
        schaduw.scale.y = 0.45;
        schaduw.position.set(0, 0.02, 0.1);
        scene.add(schaduw);

        // Kleine zwevende hartjes voor het feest
        const klein = new THREE.Shape();
        klein.moveTo(0, -0.3);
        klein.bezierCurveTo(-0.15, -0.18, -0.35, -0.05, -0.35, 0.12);
        klein.bezierCurveTo(-0.35, 0.3, -0.1, 0.36, 0, 0.2);
        klein.bezierCurveTo(0.1, 0.36, 0.35, 0.3, 0.35, 0.12);
        klein.bezierCurveTo(0.35, -0.05, 0.15, -0.18, 0, -0.3);
        hartGeo = new THREE.ShapeGeometry(klein, 12);
        hartMat = new THREE.MeshBasicMaterial({ color: 0xf9a8d4, transparent: true, side: THREE.DoubleSide, depthWrite: false });

        p.bijFrame((t, dt) => {
          const samen = huidigToon ? Math.min(1, (t - samenT) / 0.45) : 0;
          const klik = samen * samen * (3 - 2 * samen);
          const komt = Math.min(1, Math.max(0, (t - nieuwT) / 0.6));
          const uitElkaar = (1 - komt) * 3;
          const w = Math.max(0, 1 - (t - wiebelT) / 0.5);
          const zweef = Math.sin(t * 1.6) * 0.08;
          const kloppen = huidigToon ? 1 + Math.max(0, Math.sin((t - samenT) * 9)) * 0.06 * Math.max(0, 1 - (t - samenT) / 2) : 1 + Math.sin(t * 2.4) * 0.015;
          links.position.set(-0.6 + klik * 0.58 - uitElkaar, 2.1 + zweef, 0);
          rechts.position.set(0.6 - klik * 0.58 + uitElkaar + Math.sin((t - wiebelT) * 32) * 0.12 * w, 2.1 + zweef, 0);
          links.rotation.y = Math.sin(t * 0.9) * 0.15 * (1 - klik) + klik * Math.sin(t * 1.2) * 0.12;
          rechts.rotation.y = links.rotation.y;
          links.scale.setScalar(kloppen);
          rechts.scale.setScalar(kloppen);
          rechtsMat.color.setHex(huidigToon ? 0xf472b6 : 0xc026d3);
          rechtsMat.emissive.setHex(huidigToon ? 0xf472b6 : w > 0 ? 0x6b7280 : 0xc026d3);
          totaalBord.position.y = 4.3 + Math.sin(t * 2) * 0.06;
          (gloed.material as MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 2) * 0.08 + klik * 0.3;
          for (let i = hartjes.length - 1; i >= 0; i--) {
            const h = hartjes[i];
            const v = (t - h.start) / 2.2;
            h.m.position.set(h.x + Math.sin(t * 3 + h.x) * 0.3, 1 + v * 4 * h.snel, 0.6);
            h.m.rotation.z = Math.sin(t * 2 + h.x) * 0.3;
            h.m.visible = v >= 0;
            (h.m.material as MeshBasicMaterial).opacity = Math.max(0, 1 - v);
            if (v >= 1) {
              scene.remove(h.m);
              (h.m.material as MeshBasicMaterial).dispose();
              hartjes.splice(i, 1);
            }
          }
          void dt;
        });

        gereed = true;
        zetGetallen();
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

  function maakTex(tekst: string, kleur = '#ffffff') {
    const { THREE } = podium!;
    return bordTextuur(THREE, tekst, { breed: 256, hoog: 256, zonderBord: true, inkt: kleur, maat: 0.66, glans: 'rgba(80,7,36,0.9)' });
  }

  function zetGetallen() {
    if (!podium) return;
    const { THREE } = podium;
    tex.forEach((t) => t.dispose());
    const l = maakTex(String(deel));
    const r = maakTex(huidigToon ? String(antwoord) : '?', huidigToon ? '#ffffff' : '#fbcfe8');
    const tot = bordTextuur(THREE, String(totaal), { breed: 256, hoog: 176, rond: true, van: '#fffbeb', naar: '#fde68a', rand: '#f59e0b', inkt: '#9d174d', maat: 0.6 });
    tex = [l, r, tot];
    linksLabel.map = l;
    rechtsLabel.map = r;
    totaalLabel.map = tot;
    linksLabel.needsUpdate = rechtsLabel.needsUpdate = totaalLabel.needsUpdate = true;
  }

  $effect(() => {
    totaal;
    deel;
    antwoord;
    sleutel;
    if (gereed)
      untrack(() => {
        huidigToon = false;
        nieuwT = performance.now() / 1000;
        zetGetallen();
      });
  });
  $effect(() => {
    const t = toon;
    if (!gereed) return;
    untrack(() => {
      if (t && !huidigToon) {
        huidigToon = true;
        samenT = performance.now() / 1000;
        zetGetallen();
        const { THREE, scene } = podium!;
        setTimeout(() => deeltjes?.uitbarsting(0, 2.1, 0.6, [0xf9a8d4, 0xfde68a, 0xffffff, 0xf472b6], 60, 4.2), 420);
        const nu = performance.now() / 1000;
        for (let i = 0; i < 10; i++) {
          const m = new THREE.Mesh(hartGeo, hartMat.clone());
          m.scale.setScalar(0.6 + Math.random() * 0.7);
          scene.add(m);
          hartjes.push({ m, start: nu + i * 0.12, x: (Math.random() - 0.5) * 6, snel: 0.7 + Math.random() * 0.6 });
        }
      } else if (!t) huidigToon = false;
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
