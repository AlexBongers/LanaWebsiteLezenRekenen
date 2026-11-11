<script lang="ts">
  /**
   * Geld op een glanzende toonbank: munten en briefjes vallen één voor één neer.
   * Bij een hint lichten ze op volgorde op (tellen!), bij goed springen ze op en glinsteren ze.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, gloedTextuur, maakDeeltjes, maakSchaduw, maakSterren, type Deeltjes } from '../ui/drie-d-bouw';
  import type { Munt } from '../engine/generator-fase6';

  let {
    geld,
    eenheid,
    sleutel,
    goed,
    tel,
    opFout,
  }: {
    geld: Munt[];
    eenheid: 'euro' | 'cent';
    sleutel: number;
    /** Telt op bij een goed antwoord. */
    goed: number;
    /** Telt op bij een hint: het geld licht op volgorde op. */
    tel: number;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  type Stuk = { groep: Group; start: number; x: number; z: number; draai: number; gloed: Mesh; schaduw: Mesh };
  let stukken: Stuk[] = [];
  let hoofd: Group;
  let goedT = -10;
  let telT = -10;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 34, camera: [0, 6.2, 8.4], kijkNaar: [0, 0.2, 0.1] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 16, hoog: 3, y: 1, diep: 3, aantal: 30 });

        // Toonbank: een rond, glanzend fluwelen kleed met een gouden rand
        const kleed = new THREE.Mesh(
          new THREE.CylinderGeometry(5.6, 5.8, 0.3, 64),
          new THREE.MeshPhysicalMaterial({ color: 0x581c87, roughness: 0.8, sheen: 1, sheenColor: new THREE.Color(0xf0abfc), sheenRoughness: 0.4, envMapIntensity: 0.3 }),
        );
        kleed.scale.set(0.92, 1, 0.5);
        kleed.position.y = -0.15;
        const rand = new THREE.Mesh(
          new THREE.TorusGeometry(5.7, 0.09, 12, 96),
          new THREE.MeshPhysicalMaterial({ color: 0xfde68a, metalness: 0.95, roughness: 0.2 }),
        );
        rand.rotation.x = Math.PI / 2;
        rand.scale.set(0.92, 0.5, 1);
        rand.position.y = 0.01;
        const plas = new THREE.Mesh(
          new THREE.CircleGeometry(4.5, 48),
          new THREE.MeshBasicMaterial({ map: gloedTextuur(THREE, '#fde68a'), transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }),
        );
        plas.rotation.x = -Math.PI / 2;
        plas.scale.set(0.92, 0.5, 1);
        plas.position.y = 0.02;
        scene.add(kleed, rand, plas);
        hoofd = new THREE.Group();
        scene.add(hoofd);

        p.bijFrame((t) => {
          const g = Math.max(0, 1 - (t - goedT) / 1.2);
          stukken.forEach((s, i) => {
            const v = Math.min(1, Math.max(0, (t - s.start) / 0.45));
            // Vallen met een stuitertje
            const val = v < 1 ? 3.5 * (1 - v * v) : 0;
            const stuit = v >= 1 ? Math.max(0, Math.sin((t - s.start - 0.45) * 14)) * 0.15 * Math.max(0, 1 - (t - s.start - 0.45) * 3) : 0;
            const hup = Math.abs(Math.sin((t - goedT) * 9 + i * 0.6)) * 0.4 * g;
            s.groep.position.set(s.x, 0.02 + val + stuit + hup, s.z);
            s.groep.rotation.y = s.draai + (1 - v) * 4;
            s.groep.visible = t >= s.start;
            s.schaduw.visible = s.groep.visible;
            // Tellen: elk stuk licht even op, op volgorde
            const ti = t - telT - i * 0.7;
            const licht = ti > 0 && ti < 0.7 ? Math.sin((ti / 0.7) * Math.PI) : 0;
            (s.gloed.material as MeshBasicMaterial).opacity = licht * 0.9 + g * 0.5;
          });
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

  function maakMunt(waarde: number) {
    const { THREE } = podium!;
    const g = new THREE.Group();
    const goud = new THREE.MeshPhysicalMaterial({ color: 0xf6d365, metalness: 0.55, roughness: 0.3, clearcoat: 0.6, emissive: 0x7a5200, emissiveIntensity: 0.35 });
    const zilver = new THREE.MeshPhysicalMaterial({ color: 0xf1f5f9, metalness: 0.55, roughness: 0.28, clearcoat: 0.6, emissive: 0x475569, emissiveIntensity: 0.35 });
    const koper = new THREE.MeshPhysicalMaterial({ color: 0xe08a5a, metalness: 0.55, roughness: 0.32, emissive: 0x6b2e12, emissiveIntensity: 0.35 });
    const euro = eenheid === 'euro';
    const r = 1.35 * (euro ? (waarde === 2 ? 0.62 : 0.56) : waarde >= 50 ? 0.58 : waarde >= 20 ? 0.53 : waarde >= 10 ? 0.47 : 0.5);
    const buitenMat = euro ? (waarde === 2 ? zilver : goud) : waarde >= 10 ? goud : koper;
    const buiten = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 48), buitenMat);
    buiten.position.y = 0.06;
    g.add(buiten);
    if (euro) {
      const binnen = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 0.13, 48), waarde === 2 ? goud : zilver);
      binnen.position.y = 0.065;
      g.add(binnen);
    }
    const tekst = euro ? `${waarde}€` : String(waarde);
    const tex = bordTextuur(THREE, tekst, { breed: 256, hoog: 256, zonderBord: true, inkt: '#2a1a00', maat: euro ? 0.5 : 0.58, glans: 'rgba(255,255,255,0.8)' });
    const label = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 32), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
    label.rotation.x = -Math.PI / 2;
    label.position.y = 0.135;
    g.add(label);
    return { g, straal: r };
  }

  function maakBriefje(waarde: number) {
    const { THREE } = podium!;
    const g = new THREE.Group();
    const kleur = waarde === 5 ? ['#d1d5db', '#9ca3af', '#374151'] : ['#fca5a5', '#ef4444', '#7f1d1d'];
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const x = c.getContext('2d')!;
    const gr = x.createLinearGradient(0, 0, 512, 256);
    gr.addColorStop(0, kleur[0]);
    gr.addColorStop(1, kleur[1]);
    x.fillStyle = gr;
    x.fillRect(0, 0, 512, 256);
    x.strokeStyle = 'rgba(255,255,255,0.7)';
    x.lineWidth = 10;
    x.strokeRect(14, 14, 484, 228);
    for (let i = 0; i < 12; i++) {
      x.strokeStyle = 'rgba(255,255,255,0.15)';
      x.lineWidth = 3;
      x.beginPath();
      x.arc(380, 128, 30 + i * 9, 0, Math.PI * 2);
      x.stroke();
    }
    x.fillStyle = kleur[2];
    x.font = '700 150px Fredoka, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(`${waarde}`, 150, 135);
    x.font = '700 90px Fredoka, sans-serif';
    x.fillText('€', 380, 135);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const papier = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.03, 1.1),
      [
        new THREE.MeshStandardMaterial({ color: kleur[1] }),
        new THREE.MeshStandardMaterial({ color: kleur[1] }),
        new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.6, sheen: 0.4 }),
        new THREE.MeshStandardMaterial({ color: kleur[1] }),
        new THREE.MeshStandardMaterial({ color: kleur[1] }),
        new THREE.MeshStandardMaterial({ color: kleur[1] }),
      ],
    );
    papier.position.y = 0.04;
    g.add(papier);
    return { g, straal: 1.1 };
  }

  function bouw() {
    if (!podium || !hoofd) return;
    const { THREE } = podium;
    for (const s of stukken) {
      hoofd.remove(s.groep, s.schaduw);
      s.groep.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
      });
      s.schaduw.geometry.dispose();
    }
    stukken = [];
    const t0 = performance.now() / 1000 + 0.2;
    // Briefjes achteraan, munten vooraan in een rijtje
    const briefjes = geld.filter((m) => m.soort === 'briefje');
    const munten = geld.filter((m) => m.soort === 'munt');
    const plaats: { m: Munt; x: number; z: number }[] = [
      ...briefjes.map((m, i) => ({ m, x: (i - (briefjes.length - 1) / 2) * 2.5, z: -1.0 })),
      ...munten.map((m, i) => ({ m, x: (i - (munten.length - 1) / 2) * 1.9, z: briefjes.length ? 1.1 : 0.3 })),
    ];
    plaats.forEach(({ m, x, z }, i) => {
      const { g, straal } = m.soort === 'briefje' ? maakBriefje(m.waarde) : maakMunt(m.waarde);
      const gloed = new THREE.Mesh(
        new THREE.CircleGeometry(straal * 1.5, 32),
        new THREE.MeshBasicMaterial({ map: gloedTextuur(THREE, '#fde68a'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      gloed.rotation.x = -Math.PI / 2;
      gloed.position.y = 0.01;
      g.add(gloed);
      const schaduw = maakSchaduw(THREE, straal * 1.1, 0.4);
      schaduw.position.set(x, 0.015, z);
      hoofd.add(g, schaduw);
      stukken.push({ groep: g, start: t0 + i * 0.28, x, z, draai: m.soort === 'briefje' ? (i % 2 ? 0.08 : -0.06) : (i % 2 ? 0.12 : -0.1), gloed, schaduw });
    });
  }

  $effect(() => {
    geld.map((m) => m.waarde).join(',');
    sleutel;
    if (gereed) untrack(bouw);
  });
  let vorigGoed = 0;
  $effect(() => {
    const g = goed;
    if (!gereed) return;
    untrack(() => {
      if (g > vorigGoed) {
        goedT = performance.now() / 1000;
        deeltjes?.uitbarsting(0, 0.8, 0.5, [0xfde68a, 0xf2c94c, 0xffffff, 0x86efac], 60, 4.5);
      }
      vorigGoed = g;
    });
  });
  let vorigTel = 0;
  $effect(() => {
    const n = tel;
    if (!gereed) return;
    untrack(() => {
      if (n > vorigTel) telT = performance.now() / 1000;
      vorigTel = n;
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
