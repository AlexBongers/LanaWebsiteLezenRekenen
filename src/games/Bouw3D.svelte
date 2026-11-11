<script lang="ts">
  /**
   * Speelgoedblokken met klankgroepen liggen door elkaar vooraan. Tik ze in de goede volgorde:
   * ze vliegen in een boogje naar de bouwplaats op het podium. Klaar = het woord springt en glinstert.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, Texture } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, maakDeeltjes, maakSchaduw, maakSterren, maakVloer, veer, type Deeltjes } from '../ui/drie-d-bouw';

  let {
    delen,
    extra = [],
    door,
    geplaatst,
    fouten,
    klaar,
    actief,
    sleutel,
    opKies,
    opFout,
  }: {
    delen: string[];
    /** Extra blokjes die er niet in horen (dictee). */
    extra?: string[];
    /** Volgorde waarin de blokjes vooraan liggen (indexen in `delen` + `extra`). */
    door: number[];
    /** Hoeveel blokjes al op hun plek staan. */
    geplaatst: number;
    /** Indexen van fout getikte blokjes (voor een wiebel). */
    fouten: number[];
    klaar: boolean;
    actief: boolean;
    sleutel: number;
    opKies: (deel: number) => void;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  const KLEUREN = [0xf472b6, 0x38bdf8, 0xfbbf24, 0x4ade80, 0xa78bfa];
  type Blok = {
    j: number;
    groep: Group;
    mat: MeshPhysicalMaterial;
    tex: Texture;
    schaduw: Mesh;
    beneden: { x: number; z: number; rz: number };
    boven: { x: number };
    start: number;
    vlieg: number;
    wiebel: number;
  };
  let blokken: Blok[] = [];
  let plekken: Mesh[] = [];
  let hoofd: Group;
  let huidigGeplaatst = 0;
  let huidigKlaar = false;
  let klaarT = -10;
  let huidigActief = false;
  const BOVEN_Y = 2.15;
  const BOVEN_Z = -1.0;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 34, camera: [0, 4.2, 9.2], kijkNaar: [0, 1.2, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 18, hoog: 5, y: 1.5, diep: 4 });
        maakVloer(p, { z: 0.2, straal: 6.2, schaalX: 1.1, schaalZ: 0.45, kleur: 0x134e4a, randKleur: 0x2dd4bf });
        // Bouwplaats: een verhoogd podiumpje achteraan
        const plaats = new THREE.Mesh(
          new THREE.BoxGeometry(10.5, 0.5, 1.6),
          new THREE.MeshStandardMaterial({ color: 0x5b21b6, roughness: 0.6, envMapIntensity: 0.25, emissive: 0x2e1065, emissiveIntensity: 0.5 }),
        );
        plaats.position.set(0, BOVEN_Y - 0.9, BOVEN_Z);
        const lijn = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.07, 0.07), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
        lijn.position.set(0, BOVEN_Y - 0.64, BOVEN_Z + 0.82);
        const poot = new THREE.Mesh(new THREE.BoxGeometry(10, 0.9, 1.2), new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.6 }));
        poot.position.set(0, (BOVEN_Y - 1.15) / 2, BOVEN_Z);
        scene.add(plaats, lijn, poot);
        hoofd = new THREE.Group();
        scene.add(hoofd);

        p.bijTik((id) => {
          if (huidigActief) opKies(Number(id));
        });

        p.bijFrame((t) => {
          const feest = Math.max(0, 1 - (t - klaarT) / 1.2);
          plekken.forEach((pl, j) => {
            pl.visible = j >= huidigGeplaatst;
            (pl.material as MeshBasicMaterial).opacity = 0.25 + Math.sin(t * 3 + j) * 0.12 + (j === huidigGeplaatst ? 0.25 : 0);
          });
          for (const b of blokken) {
            const komt = Math.min(1, Math.max(0, (t - b.start) / 0.55));
            const s = Math.max(0.0001, veer(komt));
            const ruk = Math.max(0, 1 - (t - b.wiebel) / 0.6);
            if (b.vlieg > 0 && t >= b.vlieg) {
              // In een boogje naar de bouwplaats
              const v = Math.min(1, (t - b.vlieg) / 0.6);
              const e = v * v * (3 - 2 * v);
              const x = b.beneden.x + (b.boven.x - b.beneden.x) * e;
              const y = 0.62 + (BOVEN_Y - 0.62) * e + Math.sin(v * Math.PI) * 1.6;
              const z = b.beneden.z + (BOVEN_Z - b.beneden.z) * e;
              const hup = huidigKlaar ? Math.abs(Math.sin((t - klaarT) * 8 + b.j * 0.6)) * 0.35 * feest : 0;
              b.groep.position.set(x, y + hup, z);
              b.groep.rotation.set(0, (1 - e) * Math.PI * 2, b.beneden.rz * (1 - e));
              b.schaduw.visible = v < 1;
            } else {
              b.groep.position.set(b.beneden.x, 0.62 + Math.sin(t * 2 + b.j) * 0.05, b.beneden.z);
              b.groep.rotation.set(0, Math.sin(t * 0.8 + b.j) * 0.1, b.beneden.rz + Math.sin((t - b.wiebel) * 30) * 0.15 * ruk);
              b.schaduw.visible = true;
            }
            b.groep.scale.setScalar(s);
            b.schaduw.position.set(b.beneden.x, 0.02, b.beneden.z);
            b.mat.emissiveIntensity = huidigKlaar ? 0.35 + Math.sin(t * 6) * 0.15 : ruk > 0 ? 0.6 * ruk : 0.08;
            b.mat.emissive.setHex(ruk > 0 && !huidigKlaar ? 0xef4444 : huidigKlaar ? 0x22c55e : b.mat.color.getHex());
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
    if (!podium || !hoofd) return;
    const { THREE } = podium;
    for (const b of blokken) {
      hoofd.remove(b.groep, b.schaduw);
      b.groep.traverse((o) => (o as Mesh).geometry?.dispose());
      b.schaduw.geometry.dispose();
      b.tex.dispose();
      b.mat.dispose();
    }
    for (const pl of plekken) {
      hoofd.remove(pl);
      pl.geometry.dispose();
    }
    blokken = [];
    plekken = [];
    const n = delen.length;
    const breedte = (d: string) => 0.9 + d.length * 0.42;
    const tussen = 0.12;
    const totaal = delen.reduce((s, d) => s + breedte(d), 0) + tussen * (n - 1);
    let links = -totaal / 2;
    const bovenX = delen.map((d) => {
      const x = links + breedte(d) / 2;
      links += breedte(d) + tussen;
      return x;
    });
    const t0 = performance.now() / 1000;
    const font = "Andika, 'Fredoka', system-ui, sans-serif";
    delen.forEach((d, j) => {
      // Lege plek op de bouwplaats
      const plek = new THREE.Mesh(
        new THREE.BoxGeometry(breedte(d), 1.2, 0.9),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.3, wireframe: true }),
      );
      plek.position.set(bovenX[j], BOVEN_Y, BOVEN_Z);
      hoofd.add(plek);
      plekken.push(plek);
    });
    const alle = [...delen, ...extra];
    door.forEach((j, k) => {
      const d = alle[j];
      const kleur = KLEUREN[(j + sleutel) % KLEUREN.length];
      const mat = new THREE.MeshPhysicalMaterial({ color: kleur, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.3, envMapIntensity: 0.5, emissive: kleur, emissiveIntensity: 0.08 });
      const tex = bordTextuur(THREE, d, { breed: 256 + d.length * 60, hoog: 200, maat: 0.6, font, van: '#fffdf7', naar: '#f5f3ff', rand: '#ffffff' });
      const voor = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.35, clearcoat: 0.6 });
      const blok = new THREE.Mesh(new THREE.BoxGeometry(breedte(d), 1.2, 0.9), [mat, mat, mat, mat, voor, mat]);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(breedte(d) + 0.3, 1.6, 1.3), new THREE.MeshBasicMaterial({ visible: false }));
      hit.userData = { id: j };
      const groep = new THREE.Group();
      groep.add(blok, hit);
      const schaduw = maakSchaduw(THREE, breedte(d) * 0.65, 0.5);
      schaduw.scale.y = 0.6;
      hoofd.add(groep, schaduw);
      const stap = Math.min(2.6, 9.4 / Math.max(1, door.length));
      const benedenX = (k - (door.length - 1) / 2) * stap;
      blokken.push({
        j,
        groep,
        mat,
        tex,
        schaduw,
        beneden: { x: benedenX, z: 1.5 + (k % 2) * 0.35, rz: ((k * 37) % 7 - 3) * 0.04 },
        boven: { x: bovenX[j] ?? 0 },
        start: t0 + k * 0.12,
        vlieg: 0,
        wiebel: -10,
      });
    });
  }

  $effect(() => {
    delen.join('|');
    extra.join('|');
    door.join(',');
    sleutel;
    if (gereed) untrack(bouw);
  });
  $effect(() => {
    huidigActief = actief;
  });
  let vorigGeplaatst = 0;
  $effect(() => {
    const g = geplaatst;
    huidigGeplaatst = g;
    if (!gereed) return;
    untrack(() => {
      if (g < vorigGeplaatst) vorigGeplaatst = 0;
      const nu = performance.now() / 1000;
      for (const b of blokken) {
        if (b.j < g && b.vlieg === 0) {
          // Meerdere tegelijk (na het onthullen)? Dan vliegen ze netjes na elkaar.
          const wacht = (b.j - vorigGeplaatst) * 0.2;
          b.vlieg = nu + wacht;
          setTimeout(() => deeltjes?.uitbarsting(b.boven.x, BOVEN_Y, BOVEN_Z + 0.6, [b.mat.color.getHex(), 0xffffff], 16, 2.5), (wacht + 0.6) * 1000);
        }
      }
      vorigGeplaatst = g;
    });
  });
  $effect(() => {
    const k = klaar;
    huidigKlaar = k;
    if (k && gereed) {
      untrack(() => {
        klaarT = performance.now() / 1000 + 0.6;
        setTimeout(() => deeltjes?.uitbarsting(0, BOVEN_Y + 0.6, BOVEN_Z + 0.6, [0x86efac, 0xfde68a, 0xf472b6, 0xffffff], 70, 4.6), 650);
      });
    }
  });
  let vorigeFouten = 0;
  $effect(() => {
    const n = fouten.length;
    if (!gereed) return;
    untrack(() => {
      if (n > vorigeFouten) {
        const b = blokken.find((x) => x.j === fouten[n - 1]);
        if (b) b.wiebel = performance.now() / 1000;
      }
      vorigeFouten = n;
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
