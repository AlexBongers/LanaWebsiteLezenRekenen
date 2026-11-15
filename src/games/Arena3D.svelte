<script lang="ts">
  /**
   * Een levende 3D-achtergrond achter spellen waar de tekst plat en scherp moet blijven.
   *  - 'concert': publiek met zwaaiende lightsticks en zwiepende spotlights (Karaoke)
   *  - 'arena':   publiek plus een gouden beker die zich vult met gloeiend goud (Tafel-kampioen)
   *  - 'droom':   zwevende muzieknoten en wolkjes in een zachte lucht (Songtekst-verhaal)
   * Alleen om naar te kijken: tikken gaat door het canvas heen.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, InstancedMesh, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { gloedTextuur, maakDeeltjes, maakSterren, type Deeltjes } from '../ui/drie-d-bouw';
  import { isLicht } from '../ui/prestatie';

  let {
    soort,
    energie = 0.5,
    vulling = 0,
    feest = 0,
    puls = 0,
    opFout = () => {},
  }: {
    soort: 'concert' | 'arena' | 'droom';
    /** 0 = rustig, 1 = uitzinnig publiek. */
    energie?: number;
    /** Hoe vol de beker is (arena), 0 tot 1. */
    vulling?: number;
    /** Telt op bij elk feestmoment: confetti en een sprongetje van het publiek. */
    feest?: number;
    /** Telt op bij een kleine gebeurtenis (nieuwe regel, bladzijde omslaan). */
    puls?: number;
    opFout?: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  let huidigEnergie = 0.5;
  let huidigVulling = 0;
  let zichtVulling = 0;
  let feestT = -10;
  let pulsT = -10;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 40, camera: [0, 3, 11], kijkNaar: [0, 2.2, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        deeltjes = maakDeeltjes(p);
        const licht = isLicht();
        maakSterren(p, { breed: 24, hoog: 9, y: 0, diep: 6, aantal: licht ? 30 : 70 });

        const helper = new THREE.Object3D();
        const animaties: ((t: number) => void)[] = [];

        // ---------- Publiek met lightsticks ----------
        if (soort !== 'droom') {
          const aantal = licht ? 36 : 72;
          const hoofden = new THREE.InstancedMesh(
            new THREE.SphereGeometry(0.36, 14, 10),
            new THREE.MeshStandardMaterial({ color: 0x1e1036, roughness: 0.9, emissive: 0x2e1065, emissiveIntensity: 0.35 }),
            aantal,
          );
          const sticks = new THREE.InstancedMesh(
            new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
            aantal,
          );
          const gloed = new THREE.InstancedMesh(
            new THREE.PlaneGeometry(0.9, 1.6),
            new THREE.MeshBasicMaterial({ map: gloedTextuur(THREE), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: false }),
            aantal,
          );
          const kleuren = [0xf472b6, 0x22d3ee, 0xa78bfa, 0xfde68a, 0x4ade80];
          const plekken: { x: number; y: number; z: number; f: number; k: number }[] = [];
          for (let i = 0; i < aantal; i++) {
            const rij = i % 3;
            const perRij = Math.ceil(aantal / 3);
            const k = Math.floor(i / 3);
            const x = -10.5 + (k / Math.max(1, perRij - 1)) * 21 + (rij % 2) * 0.35 + Math.sin(i * 2.3) * 0.2;
            plekken.push({ x: x * (1 - rij * 0.08), y: (soort === 'arena' ? -1.25 : -0.55) - rij * 0.1 + Math.sin(i) * 0.08, z: 3.8 - rij * 0.85, f: i * 1.7, k: i % kleuren.length });
            const c = new THREE.Color(kleuren[i % kleuren.length]);
            sticks.setColorAt(i, c);
            gloed.setColorAt(i, c);
          }
          for (const m of [hoofden, sticks, gloed] as InstancedMesh[]) {
            m.frustumCulled = false;
            m.raycast = () => {};
            scene.add(m);
          }
          animaties.push((t) => {
            const e = 0.35 + huidigEnergie * 0.9;
            const sprong = Math.max(0, 1 - (t - feestT) / 1.4);
            plekken.forEach((pl, i) => {
              const hup = Math.max(0, Math.sin(t * (2 + e * 4) + pl.f)) * 0.25 * e + Math.abs(Math.sin((t - feestT) * 9 + pl.f)) * 0.5 * sprong;
              helper.position.set(pl.x, pl.y + hup, pl.z);
              helper.rotation.set(0, 0, 0);
              helper.scale.setScalar(1);
              helper.updateMatrix();
              hoofden.setMatrixAt(i, helper.matrix);
              const zwaai = Math.sin(t * (1.5 + e * 3.5) + pl.f) * (0.35 + e * 0.5);
              helper.position.set(pl.x + 0.35 + Math.sin(zwaai) * 0.55, pl.y + 1.0 + hup + Math.cos(zwaai) * 0.55 - 0.55, pl.z);
              helper.rotation.set(0, 0, -zwaai);
              helper.updateMatrix();
              sticks.setMatrixAt(i, helper.matrix);
              helper.rotation.set(0, 0, -zwaai);
              helper.scale.setScalar(0.8 + e * 0.4);
              helper.updateMatrix();
              gloed.setMatrixAt(i, helper.matrix);
            });
            hoofden.instanceMatrix.needsUpdate = true;
            sticks.instanceMatrix.needsUpdate = true;
            gloed.instanceMatrix.needsUpdate = true;
            (gloed.material as MeshBasicMaterial).opacity = 0.35 + huidigEnergie * 0.4;
          });

          // Zwiepende spotlights
          if (!licht) {
            const spotKleuren = [0xf472b6, 0x22d3ee, 0xfde68a, 0xa78bfa];
            const spots: Mesh[] = spotKleuren.map((k, i) => {
              const s = new THREE.Mesh(
                new THREE.ConeGeometry(1.6, 12, 24, 1, true),
                new THREE.MeshBasicMaterial({ color: k, transparent: true, opacity: 0.08, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }),
              );
              s.position.set(-7.5 + i * 5, 7.5, -3);
              s.raycast = () => {};
              scene.add(s);
              return s;
            });
            animaties.push((t) => {
              const flits = Math.max(0, 1 - (t - pulsT) / 0.5) + Math.max(0, 1 - (t - feestT) / 1.2);
              spots.forEach((s, i) => {
                s.rotation.z = Math.sin(t * (0.5 + huidigEnergie * 0.8) + i * 1.6) * 0.45;
                (s.material as MeshBasicMaterial).opacity = 0.05 + huidigEnergie * 0.06 + flits * 0.12;
              });
            });
          }
        }

        // ---------- De beker ----------
        if (soort === 'arena') {
          const beker = new THREE.Group();
          const goud = new THREE.MeshPhysicalMaterial({ color: 0xfde68a, metalness: 0.7, roughness: 0.2, clearcoat: 1, emissive: 0x8a5a00, emissiveIntensity: 0.35, side: THREE.DoubleSide });
          const profiel = [
            [0.0, 0], [0.9, 0], [0.9, 0.25], [0.35, 0.35], [0.22, 0.9], [0.3, 1.2], [1.0, 1.5], [1.25, 2.4], [1.32, 3.1], [1.22, 3.1], [1.12, 2.45], [0.9, 1.65], [0.0, 1.55],
          ].map(([x, y]) => new THREE.Vector2(x, y));
          const cup = new THREE.Mesh(new THREE.LatheGeometry(profiel, 48), goud);
          beker.add(cup);
          for (const kant of [-1, 1]) {
            const oor = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.09, 12, 32, Math.PI * 1.2), goud);
            oor.position.set(kant * 1.3, 2.35, 0);
            oor.rotation.z = kant > 0 ? -Math.PI * 0.6 : Math.PI * 1.6;
            beker.add(oor);
          }
          const sokkel = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 0.6, 2.2),
            new THREE.MeshPhysicalMaterial({ color: 0x3b0764, roughness: 0.4, clearcoat: 1 }),
          );
          sokkel.position.y = -0.3;
          beker.add(sokkel);
          // Gloeiend goud dat erin stijgt
          const vloeibaar = new THREE.Mesh(
            new THREE.CylinderGeometry(1.15, 0.92, 1, 40),
            new THREE.MeshStandardMaterial({ color: 0xfff7c2, emissive: 0xfbbf24, emissiveIntensity: 1.2, roughness: 0.3 }),
          );
          vloeibaar.position.y = 1.6;
          beker.add(vloeibaar);
          const straal = new THREE.Mesh(
            new THREE.CircleGeometry(2.6, 40),
            new THREE.MeshBasicMaterial({ map: gloedTextuur(THREE, '#fbbf24'), transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }),
          );
          straal.position.set(0, 2, -0.8);
          beker.add(straal);
          // Iets naar voren gekanteld, zodat je in de beker kijkt en het goud ziet stijgen
          const kantel = new THREE.Group();
          kantel.rotation.x = 0.55;
          kantel.add(beker);
          kantel.position.set(4.7, 0.6, 0);
          kantel.scale.setScalar(0.68);
          scene.add(kantel);
          // Glanzend oppervlak van het goud
          const oppervlak = new THREE.Mesh(
            new THREE.CircleGeometry(1, 40),
            new THREE.MeshBasicMaterial({ color: 0xfff7c2, toneMapped: false }),
          );
          oppervlak.rotation.x = -Math.PI / 2;
          beker.add(oppervlak);
          animaties.push((t) => {
            zichtVulling += (huidigVulling - zichtVulling) * 0.06;
            const h = Math.max(0.001, zichtVulling * 1.4);
            vloeibaar.scale.set(0.6 + zichtVulling * 0.4, h, 0.6 + zichtVulling * 0.4);
            vloeibaar.position.y = 1.6 + h / 2;
            vloeibaar.visible = zichtVulling > 0.01;
            oppervlak.visible = vloeibaar.visible;
            oppervlak.position.y = 1.6 + h + 0.005;
            // De beker wordt naar boven toe breder: het oppervlak groeit mee
            const r = 0.92 + (1.15 - 0.92) * (h / 1.4);
            oppervlak.scale.setScalar(r * (0.6 + zichtVulling * 0.4));
            beker.rotation.y = t * 0.5;
            const f = Math.max(0, 1 - (t - feestT) / 1.2);
            kantel.position.y = 0.6 + Math.sin(t * 1.4) * 0.08 + Math.abs(Math.sin((t - feestT) * 8)) * 0.3 * f;
            (straal.material as MeshBasicMaterial).opacity = 0.25 + zichtVulling * 0.45 + f * 0.3;
            goud.emissiveIntensity = 0.3 + zichtVulling * 0.4;
          });
        }

        // ---------- Dromerige noten ----------
        if (soort === 'droom') {
          const notenMat = [0xf9a8d4, 0x67e8f9, 0xc4b5fd, 0xfde68a].map(
            (k) => new THREE.MeshPhysicalMaterial({ color: k, roughness: 0.2, clearcoat: 1, emissive: k, emissiveIntensity: 0.35 }),
          );
          const maakNoot = (mat: MeshStandardMaterial) => {
            const g = new THREE.Group();
            const kop = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), mat);
            kop.scale.set(1.25, 0.9, 0.8);
            const steel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 8), mat);
            steel.position.set(0.32, 0.55, 0);
            const vlag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.08), mat);
            vlag.position.set(0.5, 1.03, 0);
            vlag.rotation.z = -0.5;
            g.add(kop, steel, vlag);
            return g;
          };
          const noten: { g: Group; x: number; y: number; z: number; s: number; f: number }[] = [];
          const n = licht ? 8 : 16;
          for (let i = 0; i < n; i++) {
            const g = maakNoot(notenMat[i % notenMat.length]);
            // Vooral links naast de leeskaart (bij de heldinnen), een paar ver weg rechts
            const x = i % 4 === 3 ? 8.5 + ((i * 1.7) % 3) : -11 + ((i * 2.3) % 6.5);
            const z = -1 - ((i * 3.1) % 4);
            g.position.set(x, 0, z);
            g.scale.setScalar(0.9 + ((i * 0.37) % 0.7));
            scene.add(g);
            noten.push({ g, x, y: (i * 1.3) % 8, z, s: 0.25 + ((i * 0.13) % 0.3), f: i * 0.9 });
          }
          // Zachte wolken onderin
          const wolkMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 1, transparent: true, opacity: 0.45, emissive: 0x4c1d95, emissiveIntensity: 0.3 });
          for (let i = 0; i < 6; i++) {
            const w = new THREE.Group();
            for (const [dx, r] of [[-0.9, 0.7], [0, 1.0], [0.9, 0.65]] as [number, number][]) {
              const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), wolkMat);
              b.position.x = dx;
              w.add(b);
            }
            w.position.set(-10 + i * 4, -1.8 + (i % 2) * 0.4, -2 - (i % 3));
            w.scale.set(1.6, 0.7, 0.8);
            scene.add(w);
          }
          animaties.push((t) => {
            const extra = Math.max(0, 1 - (t - pulsT) / 1.5);
            for (const no of noten) {
              const y = ((no.y + t * (no.s + extra * 0.8)) % 10) - 2;
              no.g.position.set(no.x + Math.sin(t * 0.6 + no.f) * 0.6, y, no.z);
              no.g.rotation.set(Math.sin(t * 0.7 + no.f) * 0.3, t * 0.6 + no.f, Math.sin(t + no.f) * 0.2);
            }
          });
        }

        p.bijFrame((t) => {
          for (const a of animaties) a(t);
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

  $effect(() => {
    huidigEnergie = Math.max(0, Math.min(1, energie));
    huidigVulling = Math.max(0, Math.min(1, vulling));
  });
  let vorigFeest = 0;
  $effect(() => {
    const f = feest;
    if (!gereed) return;
    untrack(() => {
      if (f > vorigFeest) {
        feestT = performance.now() / 1000;
        const x = soort === 'arena' ? 4.7 : 0;
        deeltjes?.uitbarsting(x, 3.5, 0.5, [0xfde68a, 0xf472b6, 0x67e8f9, 0xffffff], 80, 5, 3);
      }
      vorigFeest = f;
    });
  });
  let vorigPuls = 0;
  $effect(() => {
    const p = puls;
    if (!gereed) return;
    untrack(() => {
      if (p > vorigPuls) pulsT = performance.now() / 1000;
      vorigPuls = p;
    });
  });
</script>

<canvas bind:this={canvas} class="arena" aria-hidden="true"></canvas>

<style>
  .arena {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
