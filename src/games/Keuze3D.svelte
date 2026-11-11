<script lang="ts">
  /**
   * 3D-keuzepodium voor de leesspellen, in drie sferen:
   *  - 'bollen': plaatjes in glazen toverbollen op gouden zuiltjes (Woord bij plaatje)
   *  - 'platen': woorden boven draaiende DJ-platen met een dansende equalizer (Rijm-rap)
   *  - 'tvs':    plaatjes op zwevende retro-tv's die sneeuw geven bij een fout (Zinnen-show)
   * Tik op een voorwerp om te kiezen. Goed = groen en glitters, fout = grijs en een wiebel.
   */
  import { onMount, untrack } from 'svelte';
  import type { Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Texture } from 'three';
  import { maakPodium, type Podium } from '../ui/drie-d';
  import { bordTextuur, gloedTextuur, maakDeeltjes, maakSchaduw, maakSterren, maakVloer, veer, type Deeltjes } from '../ui/drie-d-bouw';

  type Thema = 'bollen' | 'platen' | 'tvs';

  let {
    thema,
    labels,
    soort,
    fout,
    goed,
    actief,
    sleutel,
    opKies,
    opFout,
  }: {
    thema: Thema;
    /** Per keuze: een emoji of een woord. */
    labels: string[];
    soort: 'emoji' | 'woord';
    /** Indexen van foute keuzes. */
    fout: number[];
    /** Index van de goede keuze als die getoond wordt. */
    goed: number | null;
    actief: boolean;
    sleutel: number;
    opKies: (i: number) => void;
    opFout: () => void;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let podium: Podium | null = null;
  let gereed = $state(false);
  let deeltjes: Deeltjes | null = null;

  const KLEUREN = [0xf472b6, 0x22d3ee, 0xa78bfa, 0xfbbf24];
  const EMOJI_FONT = "'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";

  type Item = {
    i: number;
    groep: Group;
    /** Het voorwerp dat dobbert (bol, plaat of tv). */
    lijf: Group;
    label: Mesh;
    labelMat: MeshBasicMaterial;
    tex: { norm: Texture; goed: Texture; fout: Texture };
    /** Glans- of schermmateriaal dat van kleur verandert. */
    kleurMat: MeshStandardMaterial | MeshPhysicalMaterial;
    kleur: number;
    plaat?: Mesh;
    schaduw: Mesh;
    start: number;
    wiebel: number;
    feest: number;
    grijs: number;
    x: number;
  };
  let items: Item[] = [];
  let hoofd: Group;
  let ruisTex: Texture | null = null;
  let eq: Mesh[] = [];

  let huidigFout: number[] = [];
  let huidigGoed: number | null = null;
  let huidigActief = false;

  const camera: Record<Thema, { camera: [number, number, number]; kijkNaar: [number, number, number] }> = {
    bollen: { camera: [0, 2.5, 7.4], kijkNaar: [0, 1.3, 0] },
    platen: { camera: [0, 3.4, 8.2], kijkNaar: [0, 1.1, 0] },
    tvs: { camera: [0, 2.2, 7.3], kijkNaar: [0, 1.55, 0] },
  };

  onMount(() => {
    let uit = false;
    (async () => {
      try {
        if (!canvas) return;
        const p = await maakPodium(canvas, { fov: 34, ...camera[thema] });
        if (uit) return p.opruimen();
        podium = p;
        p.bijVerlies(opFout);
        const { THREE, scene } = p;
        await document.fonts?.ready;
        deeltjes = maakDeeltjes(p);
        maakSterren(p, { breed: 16, hoog: 5, y: 1.2, diep: 4 });
        const vloer = maakVloer(p, {
          z: -0.2,
          straal: 6,
          schaalX: 1.08,
          schaalZ: 0.4,
          kleur: thema === 'platen' ? 0x1e1b4b : thema === 'tvs' ? 0x134e4a : 0x4c1d95,
          randKleur: thema === 'platen' ? 0x22d3ee : thema === 'tvs' ? 0x2dd4bf : 0xf472b6,
        });
        hoofd = new THREE.Group();
        scene.add(hoofd);

        // Sneeuw voor de tv's: een ruistextuur die we laten verschuiven
        if (thema === 'tvs') {
          const c = document.createElement('canvas');
          c.width = c.height = 128;
          const g = c.getContext('2d')!;
          const beeld = g.createImageData(128, 128);
          for (let i = 0; i < beeld.data.length; i += 4) {
            const v = Math.random() * 255;
            beeld.data[i] = beeld.data[i + 1] = beeld.data[i + 2] = v;
            beeld.data[i + 3] = 255;
          }
          g.putImageData(beeld, 0, 0);
          ruisTex = new THREE.CanvasTexture(c);
          ruisTex.wrapS = ruisTex.wrapT = THREE.RepeatWrapping;
        }

        // Equalizer achter de draaitafels
        if (thema === 'platen') {
          const eqMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.8 });
          for (let i = 0; i < 18; i++) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1, 0.15), eqMat.clone());
            bar.position.set((i - 8.5) * 0.55, 0.5, -2.6);
            (bar.material as MeshBasicMaterial).color.setHSL(0.5 + i * 0.025, 0.9, 0.6);
            scene.add(bar);
            eq.push(bar);
          }
        }

        p.bijTik((id) => {
          if (huidigActief) opKies(Number(id));
        });

        p.bijFrame((t) => {
          vloer.ringMat.opacity = 0.3 + Math.sin(t * 2) * 0.12;
          eq.forEach((bar, i) => {
            const h = 0.3 + Math.abs(Math.sin(t * 3.1 + i * 0.7) * Math.sin(t * 1.7 + i * 0.3)) * 2.2;
            bar.scale.y = h;
            bar.position.y = h / 2;
          });
          if (ruisTex) ruisTex.offset.set(Math.random(), Math.random());
          for (const it of items) {
            const komt = Math.min(1, Math.max(0, (t - it.start) / 0.6));
            const s = Math.max(0.0001, veer(komt));
            const isFout = huidigFout.includes(it.i);
            const isGoed = huidigGoed === it.i;
            it.grijs += ((isFout ? 1 : 0) - it.grijs) * 0.15;
            const ruk = Math.max(0, 1 - (t - it.wiebel) / 0.6);
            const feest = Math.max(0, 1 - (t - it.feest) / 0.9);
            const dobber = thema === 'platen' ? 0 : Math.sin(t * 1.8 + it.i * 1.4) * 0.12;
            it.groep.position.set(it.x, (1 - Math.min(1, komt)) * 4, 0);
            it.groep.scale.setScalar(s * (1 + Math.sin(feest * Math.PI) * 0.12));
            it.lijf.position.y = dobber + Math.sin(feest * Math.PI) * 0.4;
            it.lijf.rotation.z = Math.sin((t - it.wiebel) * 30) * 0.12 * ruk;
            it.labelMat.map = isGoed ? it.tex.goed : isFout ? it.tex.fout : it.tex.norm;
            it.labelMat.opacity = isFout ? 0.75 : 1;
            it.schaduw.scale.setScalar(Math.max(0.0001, s) * (1 - dobber * 0.6));
            const kleur = isGoed ? 0x22c55e : it.kleur;

            if (thema === 'bollen') {
              const m = it.kleurMat as MeshPhysicalMaterial;
              m.color.setHex(kleur).lerp(new THREE.Color(0x6b7280), it.grijs);
              m.emissive.setHex(kleur);
              m.emissiveIntensity = isGoed ? 0.5 + Math.sin(t * 6) * 0.2 : 0.12 * (1 - it.grijs);
              it.lijf.rotation.y = Math.sin(t * 0.8 + it.i) * 0.25;
            } else if (thema === 'platen') {
              // Plaat draait; sneller bij goed, stil bij fout
              const snel = isGoed ? 9 : isFout ? 0 : 2.2;
              if (it.plaat) it.plaat.rotation.y += snel * 0.016;
              const m = it.kleurMat as MeshStandardMaterial;
              m.emissive.setHex(isFout ? 0x374151 : kleur);
              m.emissiveIntensity = isGoed ? 1.2 : isFout ? 0.1 : 0.6 + Math.sin(t * 4 + it.i) * 0.25;
              it.label.position.y = 2.15 + Math.sin(t * 2 + it.i) * 0.06;
            } else {
              const m = it.kleurMat as MeshPhysicalMaterial;
              m.color.setHex(it.kleur).lerp(new THREE.Color(0x6b7280), it.grijs);
              m.emissive.setHex(isGoed ? 0x22c55e : 0x000000);
              m.emissiveIntensity = isGoed ? 0.6 + Math.sin(t * 6) * 0.25 : 0;
              it.lijf.rotation.y = Math.sin(t * 0.9 + it.i * 2) * 0.12;
              // Sneeuw over het scherm bij een fout
              const sneeuw = it.lijf.userData.sneeuw as Mesh | undefined;
              if (sneeuw) {
                sneeuw.visible = it.grijs > 0.05;
                (sneeuw.material as MeshBasicMaterial).opacity = it.grijs * 0.75;
              }
            }
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

  function maakTextuur(tekst: string, staat: 'norm' | 'goed' | 'fout') {
    const { THREE } = podium!;
    if (soort === 'emoji') {
      const breed = thema === 'tvs';
      return bordTextuur(THREE, tekst, {
        breed: breed ? 384 : 256,
        hoog: 256,
        zonderBord: true,
        maat: 0.8,
        font: EMOJI_FONT,
        glans: staat === 'goed' ? '#4ade80' : undefined,
      });
    }
    const kleuren = {
      norm: { van: '#fffdf7', naar: '#ede9fe', rand: '#ffffff', inkt: '#2e1065' },
      goed: { van: '#f0fdf4', naar: '#86efac', rand: '#16a34a', inkt: '#14532d' },
      fout: { van: '#e5e7eb', naar: '#9ca3af', rand: '#6b7280', inkt: '#4b5563' },
    }[staat];
    return bordTextuur(THREE, tekst, { breed: 384, hoog: 170, maat: 0.6, font: "Andika, 'Fredoka', system-ui, sans-serif", ...kleuren });
  }

  function bouwBol(i: number, kleur: number, labelMat: MeshBasicMaterial) {
    const { THREE } = podium!;
    const lijf = new THREE.Group();
    // Gouden zuiltje
    const goud = new THREE.MeshPhysicalMaterial({ color: 0xfde68a, metalness: 0.9, roughness: 0.2, emissive: 0xb45309, emissiveIntensity: 0.15 });
    const zuil = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 0.55, 28), goud);
    zuil.position.y = 0.28;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 10, 32), goud);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.58;
    // Glazen bol met een zachte kleur
    const glas = new THREE.MeshPhysicalMaterial({
      color: kleur,
      transparent: true,
      opacity: 0.32,
      roughness: 0.05,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      emissive: kleur,
      emissiveIntensity: 0.12,
      depthWrite: false,
    });
    const bol = new THREE.Mesh(new THREE.SphereGeometry(1.15, 40, 30), glas);
    bol.position.y = 1.75;
    const gloed = new THREE.Mesh(
      new THREE.CircleGeometry(1.25, 32),
      new THREE.MeshBasicMaterial({ map: gloedTextuur(THREE, '#ffffff'), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    gloed.position.set(0, 1.75, -0.2);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.45), labelMat);
    label.position.set(0, 1.75, 0.15);
    // Glimlichtje op het glas
    const glim = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
    glim.scale.set(1, 0.6, 0.3);
    glim.position.set(-0.5, 2.35, 0.95);
    lijf.add(zuil, ring, gloed, label, bol, glim);
    bol.renderOrder = 2;
    return { lijf, label, kleurMat: glas as MeshPhysicalMaterial };
  }

  function bouwPlaat(i: number, kleur: number, labelMat: MeshBasicMaterial) {
    const { THREE } = podium!;
    const lijf = new THREE.Group();
    // Draaitafel
    const kast = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 0.35, 2.3),
      new THREE.MeshPhysicalMaterial({ color: 0x1f1d2b, metalness: 0.4, roughness: 0.35, clearcoat: 1 }),
    );
    kast.position.y = 0.18;
    const rand = new THREE.Mesh(new THREE.BoxGeometry(2.74, 0.06, 2.34), new THREE.MeshBasicMaterial({ color: kleur }));
    rand.position.y = 0.36;
    // Grammofoonplaat met groeven en een gekleurd label in het midden
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = '#0b0a12';
    g.fillRect(0, 0, 256, 256);
    for (let r = 120; r > 50; r -= 3) {
      g.strokeStyle = r % 2 ? '#1c1a28' : '#2a2838';
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(128, 128, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = `#${kleur.toString(16).padStart(6, '0')}`;
    g.beginPath();
    g.arc(128, 128, 46, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(128, 128, 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.font = '700 26px Fredoka, sans-serif';
    g.textAlign = 'center';
    g.fillText('♪', 128, 110);
    const plaatTex = new THREE.CanvasTexture(c);
    plaatTex.colorSpace = THREE.SRGBColorSpace;
    const plaat = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 0.05, 48),
      [
        new THREE.MeshStandardMaterial({ color: 0x0b0a12 }),
        new THREE.MeshPhysicalMaterial({ map: plaatTex, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }),
        new THREE.MeshStandardMaterial({ color: 0x0b0a12 }),
      ],
    );
    plaat.position.set(-0.15, 0.4, 0);
    // Gloeiende ring rond de plaat
    const gloeiMat = new THREE.MeshStandardMaterial({ color: kleur, emissive: kleur, emissiveIntensity: 0.6 });
    const gloei = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.04, 8, 48), gloeiMat);
    gloei.rotation.x = Math.PI / 2;
    gloei.position.set(-0.15, 0.4, 0);
    // Toonarm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.3), new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 }));
    arm.position.set(1.05, 0.55, -0.15);
    arm.rotation.y = 0.45;
    // Woordbord erboven
    const label = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.1), labelMat);
    label.position.set(0, 2.15, 0.2);
    label.rotation.x = -0.12;
    const paal = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), new THREE.MeshStandardMaterial({ color: kleur, emissive: kleur, emissiveIntensity: 0.5 }));
    paal.position.set(0, 1.0, -0.6);
    lijf.add(kast, rand, plaat, gloei, arm, paal, label);
    return { lijf, label, kleurMat: gloeiMat, plaat };
  }

  function bouwTv(i: number, kleur: number, labelMat: MeshBasicMaterial) {
    const { THREE } = podium!;
    const lijf = new THREE.Group();
    const kastMat = new THREE.MeshPhysicalMaterial({ color: kleur, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
    const kast = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.9, 1.2), kastMat);
    kast.position.y = 1.5;
    // Schermrand en scherm
    const rand = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.45, 0.1), new THREE.MeshStandardMaterial({ color: 0x1f1d2b, roughness: 0.4 }));
    rand.position.set(-0.12, 1.5, 0.6);
    const scherm = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.3),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, toneMapped: false }),
    );
    scherm.position.set(-0.12, 1.5, 0.66);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 1.1), labelMat);
    label.position.set(-0.12, 1.5, 0.67);
    const sneeuw = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.3), new THREE.MeshBasicMaterial({ map: ruisTex, transparent: true, opacity: 0, depthWrite: false }));
    sneeuw.position.set(-0.12, 1.5, 0.68);
    sneeuw.visible = false;
    // Knopjes
    for (const y of [1.85, 1.45]) {
      const knop = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xfde68a, metalness: 0.8, roughness: 0.25 }));
      knop.rotation.x = Math.PI / 2;
      knop.position.set(0.92, y, 0.62);
      lijf.add(knop);
    }
    // Antennes
    const metaal = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, metalness: 0.9, roughness: 0.2 });
    for (const kant of [-1, 1]) {
      const a = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), metaal);
      a.position.set(kant * 0.35, 2.85, 0);
      a.rotation.z = kant * -0.5;
      const bol = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshStandardMaterial({ color: kleur, emissive: kleur, emissiveIntensity: 0.8 }));
      bol.position.set(kant * 0.6, 3.3, 0);
      lijf.add(a, bol);
    }
    // Pootjes
    for (const kant of [-1, 1]) {
      const poot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.5, 8), metaal);
      poot.position.set(kant * 0.8, 0.35, 0);
      poot.rotation.z = kant * 0.25;
      lijf.add(poot);
    }
    lijf.add(kast, rand, scherm, label, sneeuw);
    lijf.userData.sneeuw = sneeuw;
    lijf.scale.setScalar(0.92);
    return { lijf, label, kleurMat: kastMat };
  }

  function bouw() {
    if (!podium || !hoofd) return;
    const { THREE } = podium;
    for (const it of items) {
      hoofd.remove(it.groep, it.schaduw);
      it.groep.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      it.schaduw.geometry.dispose();
      for (const t of Object.values(it.tex)) t.dispose();
    }
    items = [];
    const n = labels.length;
    const afstand = thema === 'platen' ? 3.2 : 3.0;
    const t0 = performance.now() / 1000;
    labels.forEach((tekst, i) => {
      const kleur = KLEUREN[i % KLEUREN.length];
      const tex = { norm: maakTextuur(tekst, 'norm'), goed: maakTextuur(tekst, 'goed'), fout: maakTextuur(tekst, 'fout') };
      const labelMat = new THREE.MeshBasicMaterial({ map: tex.norm, transparent: true, toneMapped: false, depthWrite: false });
      const deel = thema === 'bollen' ? bouwBol(i, kleur, labelMat) : thema === 'platen' ? bouwPlaat(i, kleur, labelMat) : bouwTv(i, kleur, labelMat);
      const groep = new THREE.Group();
      groep.add(deel.lijf);
      // Tikvlak
      const hit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 2), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 1.6;
      hit.userData = { id: i };
      groep.add(hit);
      const x = (i - (n - 1) / 2) * afstand;
      const schaduw = maakSchaduw(THREE, thema === 'platen' ? 1.8 : 1.2, 0.55);
      schaduw.position.set(x, 0.02, 0.1);
      hoofd.add(groep, schaduw);
      items.push({
        i,
        groep,
        lijf: deel.lijf,
        label: deel.label,
        labelMat,
        tex,
        kleurMat: deel.kleurMat,
        kleur,
        plaat: 'plaat' in deel ? deel.plaat : undefined,
        schaduw,
        start: t0 + i * 0.13,
        wiebel: -10,
        feest: -10,
        grijs: 0,
        x,
      });
    });
  }

  $effect(() => {
    labels.join('|');
    sleutel;
    if (gereed) untrack(bouw);
  });
  $effect(() => {
    huidigFout = [...fout];
    huidigGoed = goed;
    huidigActief = actief;
  });
  let vorigeFouten = 0;
  $effect(() => {
    const n = fout.length;
    if (!gereed) return;
    untrack(() => {
      if (n > vorigeFouten) {
        const it = items[fout[n - 1]];
        if (it) it.wiebel = performance.now() / 1000;
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
        const it = items[g];
        if (it) {
          it.feest = performance.now() / 1000;
          deeltjes?.uitbarsting(it.x, 1.9, 0.8, [0x86efac, 0xfde68a, 0xf472b6, 0xffffff], 50, 4.2);
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
