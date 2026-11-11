<script lang="ts">
  /**
   * 3D-podium voor Flits: spotlights, een draaiende gouden ster om op te tikken, en het woord
   * dat even in het licht verschijnt. Het woord staat al klaar voordat de flits begint,
   * zodat de flitstijd precies klopt.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial, Texture } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, gloedTextuur, maakDeeltjes, maakSchaduw, maakSterren, maakVloer, type Deeltjes } from '../ui/drie-d-bouw';

  type Fase = 'klaar' | 'flits' | 'kiezen' | 'wacht' | 'goed' | 'onthuld';

  let {
    fase,
    woord,
    sleutel,
    opTik,
    opKlaar,
    opFout,
  }: {
    fase: Fase;
    woord: string;
    sleutel: number;
    opTik: () => void;
    opKlaar: () => void;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  let ster: Group;
  let sterSchaduw: Mesh;
  let woordVlak: Mesh;
  let woordMat: MeshBasicMaterial;
  let vraagVlak: Mesh;
  let hoofdlicht: Mesh;
  let sterTekst: Mesh;
  let tex: { flits?: Texture; goed?: Texture; onthuld?: Texture } = {};
  let vraagTex: Texture | undefined;
  let faseNu: Fase = 'klaar';
  let faseSinds = -10;
  let flitsStart = -10;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 34, camera: [0, 2.5, 7.6], kijkNaar: [0, 1.55, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 14, hoog: 4.5, y: 0.8, diep: 3 });
        const vloer = maakVloer(p, { z: 0, straal: 4.6, schaalX: 1.35, schaalZ: 0.42 });

        // Spotlights: een witte hoofdbundel en twee gekleurde die zachtjes zwaaien
        const kegelMat = (kleur: number, o: number) =>
          new THREE.MeshBasicMaterial({ color: kleur, transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
        hoofdlicht = new THREE.Mesh(new THREE.ConeGeometry(2.7, 7, 40, 1, true), kegelMat(0xfff7c2, 0));
        (hoofdlicht.material as MeshBasicMaterial).side = THREE.BackSide;
        hoofdlicht.position.set(0, 3.5, 0.3);
        scene.add(hoofdlicht);
        const zijlichten: Mesh[] = [];
        for (const [x, kleur] of [[-3.8, 0xf472b6], [3.8, 0x22d3ee]] as [number, number][]) {
          const k = new THREE.Mesh(new THREE.ConeGeometry(1.5, 7, 28, 1, true), kegelMat(kleur, 0.1));
          k.position.set(x, 3.5, -0.8);
          zijlichten.push(k);
          scene.add(k);
        }

        // Gouden ster met "Tik!"
        const sh = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? 1.15 : 0.52;
          const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
          if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        sh.closePath();
        const sterGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.34, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3 });
        sterGeo.center();
        ster = new THREE.Group();
        ster.add(
          new THREE.Mesh(
            sterGeo,
            new THREE.MeshPhysicalMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 0.8, metalness: 0.75, roughness: 0.18, clearcoat: 1 }),
          ),
        );
        const halo = new THREE.Mesh(
          new THREE.CircleGeometry(1.9, 40),
          new THREE.MeshBasicMaterial({ map: gloedTextuur(THREE, '#fbbf24'), transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }),
        );
        halo.position.z = -0.3;
        ster.add(halo);
        const tik = bordTextuur(THREE, 'Tik!', { breed: 256, hoog: 128, zonderBord: true, inkt: '#78350f', maat: 0.7 });
        sterTekst = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshBasicMaterial({ map: tik, transparent: true, toneMapped: false }));
        sterTekst.position.set(0, -0.12, 0.5);
        ster.add(sterTekst);
        const hit = new THREE.Mesh(new THREE.SphereGeometry(2.1, 12, 10), new THREE.MeshBasicMaterial({ visible: false }));
        hit.userData = { id: 'ster' };
        ster.add(hit);
        ster.position.set(0, 1.7, 0);
        scene.add(ster);
        sterSchaduw = maakSchaduw(THREE, 1.3, 0.55);
        sterSchaduw.position.set(0, 0.03, 0);
        scene.add(sterSchaduw);

        // Woord en vraagteken
        woordMat = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false });
        woordVlak = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 1.85), woordMat);
        woordVlak.position.set(0, 1.85, 0.4);
        woordVlak.renderOrder = 5;
        woordVlak.visible = false;
        scene.add(woordVlak);
        vraagTex = bordTextuur(THREE, '?', { breed: 256, hoog: 256, zonderBord: true, inkt: '#f9a8d4', maat: 0.9, glans: '#ec4899' });
        vraagVlak = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: vraagTex, transparent: true, opacity: 0.55, toneMapped: false, depthWrite: false }));
        vraagVlak.position.set(0, 1.85, 0.4);
        vraagVlak.visible = false;
        scene.add(vraagVlak);

        p.bijTik((id) => {
          if (id === 'ster' && faseNu === 'klaar') opTik();
        });

        p.bijFrame((t) => {
          const sinds = t - faseSinds;
          // Ster
          const zichtbaar = faseNu === 'klaar';
          ster.visible = zichtbaar;
          sterSchaduw.visible = zichtbaar;
          sterSchaduw.scale.setScalar(1 - Math.sin(t * 2.2) * 0.08);
          if (zichtbaar) {
            const pop = Math.min(1, sinds / 0.5);
            ster.position.y = 1.7 + Math.sin(t * 2.2) * 0.12;
            ster.rotation.y = Math.sin(t * 1.3) * 0.5;
            ster.scale.setScalar((0.5 + 0.5 * (1 - Math.pow(1 - pop, 3))) * (1 + Math.sin(t * 4) * 0.04));
          }
          // Licht en woord
          const aan = faseNu === 'flits' || faseNu === 'goed' || faseNu === 'onthuld';
          const doel = aan ? 0.32 : 0.0;
          const m = hoofdlicht.material as MeshBasicMaterial;
          m.opacity += (doel - m.opacity) * 0.5;
          woordVlak.visible = aan && !!woordMat.map;
          if (woordVlak.visible) {
            const pop = faseNu === 'flits' ? Math.min(1, (t - flitsStart) / 0.1) : Math.min(1, sinds / 0.35);
            const s = faseNu === 'goed' ? 1 + Math.sin(Math.min(1, sinds / 0.5) * Math.PI) * 0.12 : 0.85 + 0.15 * pop;
            woordVlak.scale.setScalar(s);
          }
          vraagVlak.visible = faseNu === 'kiezen' || faseNu === 'wacht';
          vraagVlak.position.y = 1.85 + Math.sin(t * 2.4) * 0.1;
          zijlichten.forEach((k, i) => {
            k.rotation.z = (i ? 1 : -1) * (0.12 + Math.sin(t * 0.9 + i * 2) * 0.06);
          });
          vloer.ringMat.opacity = aan ? 0.75 : 0.3 + Math.sin(t * 2) * 0.1;
          vloer.randMat.color.setHex(faseNu === 'goed' ? 0x86efac : 0xf472b6);
        });

        gereed = true;
        zetWoord();
        opKlaar();
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

  function zetWoord() {
    if (!podium) return;
    const { THREE } = podium;
    for (const t of Object.values(tex)) t?.dispose();
    const basis = { breed: 1024, hoog: 256, zonderBord: true, maat: 0.66, font: "Andika, 'Fredoka', system-ui, sans-serif" };
    tex = {
      flits: bordTextuur(THREE, woord, { ...basis, inkt: '#ffffff', glans: '#a78bfa' }),
      goed: bordTextuur(THREE, woord, { ...basis, inkt: '#fde68a', glans: '#f59e0b' }),
      onthuld: bordTextuur(THREE, woord, { ...basis, inkt: '#bbf7d0', glans: '#22c55e' }),
    };
    for (const t of Object.values(tex)) if (t) podium.renderer.initTexture(t);
    kiesTextuur();
  }

  function kiesTextuur() {
    if (!woordMat) return;
    woordMat.map = (faseNu === 'goed' ? tex.goed : faseNu === 'onthuld' ? tex.onthuld : tex.flits) ?? null;
    woordMat.needsUpdate = true;
  }

  $effect(() => {
    woord;
    sleutel;
    if (gereed) untrack(zetWoord);
  });

  $effect(() => {
    const f = fase;
    if (!gereed) {
      faseNu = f;
      return;
    }
    untrack(() => {
      const nu = performance.now() / 1000;
      faseNu = f;
      faseSinds = nu;
      if (f === 'flits') flitsStart = nu;
      kiesTextuur();
      if (f === 'goed') {
        deeltjes?.uitbarsting(0, 1.9, 0.6, [0xfde68a, 0xf472b6, 0x67e8f9, 0xffffff], 70, 4.6);
        deeltjes?.uitbarsting(-2.2, 1.6, 0.4, [0xfde68a, 0xffffff], 24, 3);
        deeltjes?.uitbarsting(2.2, 1.6, 0.4, [0x67e8f9, 0xffffff], 24, 3);
      }
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
