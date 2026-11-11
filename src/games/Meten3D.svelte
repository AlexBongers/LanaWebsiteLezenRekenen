<script lang="ts">
  /**
   * Meten en wegen in 3D:
   *  - 'zwaarder': een gouden weegschaal zakt door naar de zware kant
   *  - 'liniaal':  een potlood ligt op een liniaal met centimeters
   *  - 'kilo':     een cadeautje en kilo-gewichtjes houden de weegschaal in balans
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, maakDeeltjes, maakSchaduw, maakSterren, maakVloer, type Deeltjes } from '../ui/drie-d-bouw';
  import type { MeetOpgave } from '../engine/generator-fase6';

  let { opgave, sleutel, goed, opFout }: { opgave: MeetOpgave; sleutel: number; goed: number; opFout: () => void } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  let weegschaal: Group;
  let balk: Group;
  let schalen: Group[] = [];
  let inhoud: Group[] = [];
  let liniaalGroep: Group | null = null;
  let doelHoek = 0;
  let hoek = 0;
  let snelheid = 0;
  let goedT = -10;
  const ARM = 2.5;
  const HOOGTE = 3.3;
  const HANG = 1.7;

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 34, camera: [0, 3.6, 9.6], kijkNaar: [0, 2.0, 0] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 16, hoog: 6, y: 0.5, diep: 4 });
        maakVloer(p, { z: -0.2, straal: 5, schaalX: 1.25, schaalZ: 0.42, kleur: 0x1e3a8a, randKleur: 0xfbbf24 });

        // Weegschaal
        const goud = new THREE.MeshPhysicalMaterial({ color: 0xfde68a, metalness: 0.6, roughness: 0.25, clearcoat: 0.8, emissive: 0x8a5a00, emissiveIntensity: 0.4 });
        weegschaal = new THREE.Group();
        const voet = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.3, 32), goud);
        voet.position.y = 0.15;
        const paal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, HOOGTE, 16), goud);
        paal.position.y = HOOGTE / 2;
        const knop = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), goud);
        knop.position.y = HOOGTE + 0.05;
        const wijzer = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.4 }));
        balk = new THREE.Group();
        balk.position.y = HOOGTE;
        const lat = new THREE.Mesh(new THREE.BoxGeometry(ARM * 2 + 0.3, 0.14, 0.2), goud);
        wijzer.position.y = 0.45;
        balk.add(lat, wijzer);
        weegschaal.add(voet, paal, knop, balk);
        for (let k = 0; k < 2; k++) {
          const schaal = new THREE.Group();
          const bak = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.16, 40), goud);
          schaal.add(bak);
          for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 + 0.5;
            const touw = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, HANG, 6), new THREE.MeshBasicMaterial({ color: 0xfde68a }));
            const vx = Math.cos(a) * 0.95;
            const vz = Math.sin(a) * 0.95;
            // Zet het touwtje schuin van de rand naar het ophangpunt
            const richting = new THREE.Vector3(-vx, HANG, -vz);
            touw.scale.y = richting.length() / HANG;
            touw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), richting.normalize());
            touw.position.set(vx / 2, HANG / 2, vz / 2);
            schaal.add(touw);
          }
          const inh = new THREE.Group();
          inh.position.y = 0.08;
          schaal.add(inh);
          inhoud.push(inh);
          schalen.push(schaal);
          weegschaal.add(schaal);
        }
        const schaduw = maakSchaduw(THREE, 1.4, 0.5);
        schaduw.position.y = 0.01;
        weegschaal.add(schaduw);
        scene.add(weegschaal);

        p.bijFrame((t, dt) => {
          // Veertje: de weegschaal schommelt even en komt dan tot rust
          const kracht = (doelHoek - hoek) * 30 - snelheid * 4.5;
          snelheid += kracht * dt;
          hoek += snelheid * dt;
          balk.rotation.z = hoek;
          schalen.forEach((s, i) => {
            const kant = i === 0 ? -1 : 1;
            s.position.set(kant * ARM * Math.cos(hoek), HOOGTE + kant * ARM * Math.sin(hoek) - HANG, 0);
            s.rotation.z = 0;
          });
          const g = Math.max(0, 1 - (t - goedT) / 1.2);
          weegschaal.position.y = Math.abs(Math.sin((t - goedT) * 10)) * 0.15 * g;
          if (liniaalGroep) liniaalGroep.position.y = 1.6 + Math.abs(Math.sin((t - goedT) * 10)) * 0.12 * g;
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

  function leeg(g: Group) {
    for (const c of [...g.children]) {
      g.remove(c);
      c.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        const mat = m.material as MeshBasicMaterial | undefined;
        mat?.map?.dispose();
        mat?.dispose?.();
      });
    }
  }

  function emojiStaand(tekst: string, grootte: number) {
    const { THREE } = podium!;
    const tex = bordTextuur(THREE, tekst, { breed: 256, hoog: 256, zonderBord: true, maat: 0.85, font: "'Noto Color Emoji', 'Apple Color Emoji', sans-serif" });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(grootte, grootte), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
    m.position.y = grootte / 2;
    return m;
  }

  function cadeau() {
    const { THREE } = podium!;
    const g = new THREE.Group();
    const doos = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.0), new THREE.MeshPhysicalMaterial({ color: 0xec4899, roughness: 0.35, clearcoat: 1 }));
    doos.position.y = 0.5;
    const lintMat = new THREE.MeshPhysicalMaterial({ color: 0xfde68a, metalness: 0.6, roughness: 0.25 });
    const lint1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.02, 0.18), lintMat);
    lint1.position.y = 0.5;
    const lint2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.02, 1.02), lintMat);
    lint2.position.y = 0.5;
    const strik1 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 10, 20), lintMat);
    strik1.position.set(-0.17, 1.1, 0);
    strik1.rotation.y = 0.4;
    const strik2 = strik1.clone();
    strik2.position.x = 0.17;
    strik2.rotation.y = -0.4;
    g.add(doos, lint1, lint2, strik1, strik2);
    return g;
  }

  function gewichten(n: number) {
    const { THREE } = podium!;
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, metalness: 0.4, roughness: 0.3, clearcoat: 1, emissive: 0x1e3a8a, emissiveIntensity: 0.35 });
    const tex = bordTextuur(THREE, '1 kg', { breed: 256, hoog: 128, zonderBord: true, inkt: '#1e3a8a', maat: 0.66, glans: 'rgba(255,255,255,0.9)' });
    const plekken: [number, number, number][] = [];
    // Onderste rij van maximaal 3, daarboven verder stapelen
    for (let i = 0; i < n; i++) {
      const laag = Math.floor(i / 3);
      const inLaag = Math.min(3, n - laag * 3);
      const k = i % 3;
      plekken.push([(k - (inLaag - 1) / 2) * 0.64, laag * 0.52, 0]);
    }
    for (const [x, y, z] of plekken) {
      const blok = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.46, 24), mat);
      blok.position.set(x, y + 0.23, z);
      const greep = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 16, Math.PI), mat);
      greep.position.set(x, y + 0.47, z);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.28), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
      label.position.set(x, y + 0.24, z + 0.31);
      g.add(blok, greep, label);
    }
    return g;
  }

  function maakLiniaal(lengte: number) {
    const { THREE } = podium!;
    const g = new THREE.Group();
    const CM = 0.72;
    const breed = 14 * CM;
    // Liniaal met streepjes en cijfers
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 256;
    const x = c.getContext('2d')!;
    const gr = x.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#fef9c3');
    gr.addColorStop(1, '#fde68a');
    x.fillStyle = gr;
    x.fillRect(0, 0, 2048, 256);
    const px = 2048 / 14;
    const nul = px * 0.5;
    x.fillStyle = '#422006';
    x.strokeStyle = '#422006';
    x.textAlign = 'center';
    x.font = '700 64px Fredoka, sans-serif';
    for (let mm = 0; mm <= 130; mm++) {
      const xx = nul + (mm / 10) * px;
      const heel = mm % 10 === 0;
      const half = mm % 5 === 0;
      x.lineWidth = heel ? 6 : 3;
      x.beginPath();
      x.moveTo(xx, 0);
      x.lineTo(xx, heel ? 90 : half ? 60 : 36);
      x.stroke();
      if (heel) x.fillText(String(mm / 10), xx, 165);
    }
    x.font = '600 40px Fredoka, sans-serif';
    x.fillText('cm', 2048 - 60, 230);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const hout = new THREE.MeshPhysicalMaterial({ color: 0xfacc15, roughness: 0.45, clearcoat: 0.6 });
    const liniaal = new THREE.Mesh(new THREE.BoxGeometry(breed, 0.12, 1.6), [hout, hout, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.5, clearcoat: 0.5 }), hout, hout, hout]);
    g.add(liniaal);
    // Potlood van 0 tot `lengte` cm
    const start = -breed / 2 + 0.5 * CM;
    const L = lengte * CM;
    const punt = Math.min(0.55, L * 0.3);
    const gum = Math.min(0.35, L * 0.15);
    const lijf = Math.max(0.1, L - punt - gum);
    const potlood = new THREE.Group();
    const r = 0.17;
    const gumM = new THREE.Mesh(new THREE.CylinderGeometry(r, r, gum, 6), new THREE.MeshPhysicalMaterial({ color: 0xf472b6, roughness: 0.6 }));
    gumM.rotation.z = Math.PI / 2;
    gumM.position.x = gum / 2;
    const huls = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.12, 12), new THREE.MeshPhysicalMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.25 }));
    huls.rotation.z = Math.PI / 2;
    huls.position.x = gum;
    const romp = new THREE.Mesh(new THREE.CylinderGeometry(r, r, lijf, 6), new THREE.MeshPhysicalMaterial({ color: 0x8b5cf6, roughness: 0.3, clearcoat: 1 }));
    romp.rotation.z = Math.PI / 2;
    romp.position.x = gum + lijf / 2;
    const hout2 = new THREE.Mesh(new THREE.ConeGeometry(r, punt, 6), new THREE.MeshStandardMaterial({ color: 0xf5d0a9, roughness: 0.8 }));
    hout2.rotation.z = -Math.PI / 2;
    hout2.position.x = gum + lijf + punt / 2;
    const stift = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, punt * 0.35, 8), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
    stift.rotation.z = -Math.PI / 2;
    stift.position.x = gum + lijf + punt - (punt * 0.35) / 2;
    potlood.add(gumM, huls, romp, hout2, stift);
    potlood.position.set(start, 0.25, -0.3);
    g.add(potlood);
    g.rotation.x = 0.85;
    g.position.set(0, 1.6, 1.4);
    return g;
  }

  function bouw() {
    if (!podium) return;
    const { scene } = podium;
    inhoud.forEach(leeg);
    if (liniaalGroep) {
      scene.remove(liniaalGroep);
      leeg(liniaalGroep);
      liniaalGroep = null;
    }
    const o = opgave;
    weegschaal.visible = o.soort !== 'liniaal';
    if (o.soort === 'zwaarder') {
      inhoud[0].add(emojiStaand(o.links.emoji, 1.5));
      inhoud[1].add(emojiStaand(o.rechts.emoji, 1.5));
      doelHoek = o.links.gewicht > o.rechts.gewicht ? 0.24 : -0.24;
      hoek = 0;
      snelheid = 0;
    } else if (o.soort === 'kilo') {
      inhoud[0].add(cadeau());
      inhoud[1].add(gewichten(o.kilo));
      // Eerst een beetje scheef, dan komt hij in balans
      hoek = 0.3;
      snelheid = 0;
      doelHoek = 0;
    } else {
      liniaalGroep = maakLiniaal(o.lengte);
      scene.add(liniaalGroep);
    }
  }

  $effect(() => {
    opgave;
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
        deeltjes?.uitbarsting(0, 2.6, 0.8, [0xfde68a, 0xffffff, 0x86efac, 0x93c5fd], 60, 4.4);
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
    pointer-events: none;
  }
</style>
