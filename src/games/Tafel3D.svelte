<script lang="ts">
  /**
   * 3D-drumstel voor Tafel-ritme: elk antwoord staat op een drumvel. Tik op de drum om te slaan.
   * De drums pulseren mee met de beat; goed = groen en glitters, fout = grijs en een wiebel.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshStandardMaterial, MeshBasicMaterial } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, maakDeeltjes, maakSterren, maakVloer, veer, type Deeltjes } from '../ui/drie-d-bouw';

  let {
    keuzes,
    fout,
    goed,
    pols,
    actief,
    sleutel,
    opKies,
    opFout,
  }: {
    keuzes: number[];
    fout: number[];
    /** Het goede antwoord als het getoond wordt (na goed antwoord of na het antwoord onthullen). */
    goed: number | null;
    /** Telt elke beat op. */
    pols: number;
    actief: boolean;
    /** Verandert bij elke nieuwe opgave: de drums vallen opnieuw binnen. */
    sleutel: number;
    opKies: (n: number) => void;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  const KLEUREN = [0xec4899, 0x22d3ee, 0xa78bfa, 0xfbbf24];
  type Drum = {
    n: number;
    groep: Group;
    kop: Mesh;
    kopMat: MeshBasicMaterial;
    schaal: MeshStandardMaterial;
    stokken: Group;
    start: number;
    geslagen: number;
    wiebel: number;
    x: number;
    kleur: number;
    texturen: Record<'norm' | 'goed' | 'fout', import('three').Texture>;
  };
  let drums: Drum[] = [];
  let drumGroep: Group;
  let beatT = -10;
  let vloer: ReturnType<typeof maakVloer>;

  // Gewone kopieën, want de render-lus leest ze elke frame.
  let huidigFout: number[] = [];
  let huidigGoed: number | null = null;
  let huidigActief = false;

  onMount(() => {
    let weg = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 36, camera: [0, 3.9, 5.9], kijkNaar: [0, 0.75, -0.3] });
        if (weg) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 14, hoog: 4, y: 0.8 });
        vloer = maakVloer(p, { z: -0.45, straal: 5.8, schaalX: 1.05, schaalZ: 0.34 });
        drumGroep = new THREE.Group();
        scene.add(drumGroep);

        p.bijTik((id) => {
          if (!huidigActief) return;
          sla(Number(id));
          opKies(Number(id));
        });

        p.bijFrame((t) => {
          const beat = Math.max(0, 1 - (t - beatT) / 0.32);
          vloer.randMat.color.setHex(beat > 0.5 ? 0xfde68a : 0xf472b6);
          vloer.ringMat.opacity = 0.3 + beat * 0.5;
          for (const d of drums) {
            const komt = Math.min(1, Math.max(0, (t - d.start) / 0.7));
            const val = veer(komt);
            d.groep.position.y = (1 - Math.min(1, val)) * 6 * (komt < 1 ? 1 : 0) + Math.sin(t * 2 + d.x) * 0.0;
            d.groep.scale.setScalar(Math.max(0.0001, komt < 1 ? 0.6 + 0.4 * val : 1));
            // Slag: de drum wordt even platter
            const slag = Math.max(0, 1 - (t - d.geslagen) / 0.35);
            const knal = Math.sin(slag * Math.PI);
            const pulsBeat = beat * 0.05;
            d.groep.scale.y *= 1 - knal * 0.16 + pulsBeat;
            d.groep.scale.x *= 1 + knal * 0.05;
            d.groep.scale.z *= 1 + knal * 0.05;
            // Wiebel bij een fout antwoord
            const w = Math.max(0, 1 - (t - d.wiebel) / 0.6);
            d.groep.rotation.z = Math.sin((t - d.wiebel) * 30) * 0.12 * w;
            // Stokken: zwaaien mee met de beat, slaan bij een tik
            const stokHoek = -0.5 + beat * 0.35 + slag * 0.55;
            d.stokken.children[0].rotation.x = stokHoek;
            d.stokken.children[1].rotation.x = -0.5 + (1 - beat) * 0.1 + slag * 0.55;
            const isFout = huidigFout.includes(d.n);
            const isGoed = huidigGoed === d.n;
            d.kop.visible = true;
            d.kopMat.map = isGoed ? d.texturen.goed : isFout ? d.texturen.fout : d.texturen.norm;
            d.schaal.emissive.setHex(isGoed ? 0x22c55e : isFout ? 0x374151 : d.kleur);
            d.schaal.emissiveIntensity = isGoed ? 0.6 + Math.sin(t * 6) * 0.25 : isFout ? 0.1 : 0.15 + beat * 0.5;
            d.schaal.color.setHex(isFout ? 0x6b7280 : d.kleur);
          }
        });

        gereed = true;
        bouw();
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
    if (!podium || !drumGroep) return;
    const { THREE } = podium;
    for (const d of [...drums]) {
      drumGroep.remove(d.groep);
      d.groep.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as MeshStandardMaterial | undefined;
        mat?.dispose?.();
      });
      for (const t of Object.values(d.texturen)) t.dispose();
    }
    drums = [];
    const aantal = keuzes.length;
    const t0 = performance.now() / 1000;
    keuzes.forEach((n, i) => {
      const kleur = KLEUREN[i % KLEUREN.length];
      const x = (i - (aantal - 1) / 2) * 3.45;
      const groep = new THREE.Group();
      groep.position.set(x, 0, -Math.abs(i - (aantal - 1) / 2) * 0.35);

      const schaal = new THREE.MeshStandardMaterial({ color: kleur, metalness: 0.35, roughness: 0.32, emissive: kleur, emissiveIntensity: 0.15 });
      const kast = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.18, 1.0, 44), schaal);
      kast.position.y = 0.5;
      groep.add(kast);
      // Gouden randen en schroefjes
      const goud = new THREE.MeshStandardMaterial({ color: 0xfde68a, metalness: 0.7, roughness: 0.25, emissive: 0xb45309, emissiveIntensity: 0.25 });
      for (const y of [0.04, 1.0]) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(y > 0.5 ? 1.25 : 1.18, 0.06, 10, 48), goud);
        r.rotation.x = Math.PI / 2;
        r.position.y = y;
        groep.add(r);
      }
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        const schroef = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), goud);
        schroef.position.set(Math.cos(a) * 1.23, 0.5, Math.sin(a) * 1.23);
        groep.add(schroef);
      }
      // Drumvel met het getal
      const texturen = {
        norm: bordTextuur(THREE, String(n), { breed: 256, hoog: 256, rond: true, van: '#ffffff', naar: '#f5d0fe', rand: '#fde68a', inkt: '#2e1065', maat: 0.55 }),
        goed: bordTextuur(THREE, String(n), { breed: 256, hoog: 256, rond: true, van: '#f0fdf4', naar: '#86efac', rand: '#16a34a', inkt: '#14532d', maat: 0.55 }),
        fout: bordTextuur(THREE, String(n), { breed: 256, hoog: 256, rond: true, van: '#e5e7eb', naar: '#9ca3af', rand: '#6b7280', inkt: '#374151', maat: 0.55 }),
      };
      const kopMat = new THREE.MeshBasicMaterial({ map: texturen.norm, transparent: true, toneMapped: false });
      const kop = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), kopMat);
      kop.rotation.x = -Math.PI / 2;
      kop.position.y = 1.012;
      groep.add(kop);
      // Tikvlak: een onzichtbare, wat grotere cilinder
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.2, 16), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 1.0;
      hit.userData = { id: n };
      groep.add(hit);

      // Drumstokken
      const stokken = new THREE.Group();
      const stokMat = new THREE.MeshStandardMaterial({ color: 0xfff7c2, emissive: 0xf59e0b, emissiveIntensity: 0.6, roughness: 0.3 });
      for (const kant of [-1, 1]) {
        const arm = new THREE.Group();
        arm.position.set(kant * 0.5, 1.55, 0.4);
        const stok = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.5, 10), stokMat);
        stok.position.y = 0.75;
        stok.rotation.z = kant * 0.28;
        const knop = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), stokMat);
        knop.position.set(kant * 0.2, 0.06, 0);
        arm.add(stok);
        arm.add(knop);
        stokken.add(arm);
      }
      stokken.position.y = 0.25;
      groep.add(stokken);

      drumGroep.add(groep);
      drums.push({ n, groep, kop, kopMat, schaal, stokken, start: t0 + i * 0.12, geslagen: -10, wiebel: -10, x, kleur, texturen });
    });
  }

  /** Slag op een drum, meteen bij het tikken. */
  function sla(n: number) {
    const d = drums.find((x) => x.n === n);
    if (!d) return;
    d.geslagen = performance.now() / 1000;
  }

  $effect(() => {
    keuzes.length;
    sleutel;
    if (gereed) untrack(bouw);
  });
  $effect(() => {
    huidigFout = [...fout];
    huidigGoed = goed;
    huidigActief = actief;
  });
  // Nieuw fout antwoord: wiebelen en slaan
  let vorigeFouten = 0;
  $effect(() => {
    const n = fout.length;
    if (!gereed) return;
    untrack(() => {
      if (n > vorigeFouten) {
        const f = drums.find((d) => d.n === fout[n - 1]);
        if (f) {
          f.geslagen = performance.now() / 1000;
          f.wiebel = performance.now() / 1000;
        }
      }
      vorigeFouten = n;
    });
  });
  $effect(() => {
    pols;
    beatT = performance.now() / 1000;
  });
  // Goed antwoord: glitters
  let vorigGoed: number | null = null;
  $effect(() => {
    const g = goed;
    if (!gereed) return;
    untrack(() => {
      if (g !== null && g !== vorigGoed) {
        const d = drums.find((x) => x.n === g);
        if (d) {
          d.geslagen = performance.now() / 1000;
          deeltjes?.uitbarsting(d.groep.position.x, 1.2, d.groep.position.z + 0.3, [0x86efac, 0xfde68a, 0xffffff], 36, 3.6);
        }
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
