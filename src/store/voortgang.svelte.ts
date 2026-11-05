/**
 * Voortgang van Lana, bewaard op de tablet (IndexedDB).
 */
import { get, set } from 'idb-keyval';
import type { Vaardigheid } from '../engine/adaptief';
import type { Herhaling } from '../engine/herhaling';
import { FLITS_START } from '../engine/generator-lezen';

export type HeldinId = 'rumi' | 'mira' | 'zoey';

export type Sessie = {
  datum: string;
  heldin: HeldinId;
  goed: number;
  totaal: number;
  noten: number;
  seconden: number;
  auditie?: boolean;
};

export type Telling = { goed: number; totaal: number };

export type Voortgang = {
  versie: 1;
  noten: number;
  vaardigheden: {
    rekenen: Vaardigheid;
    flits: Vaardigheid;
    verhaal: Vaardigheid;
  };
  flitstijd: number;
  gelezenVerhalen: string[];
  sessies: Sessie[];
  /** Herhalingsdoosjes: sleutel ("som.47+8", "woord.lucht") → doos. */
  herhaling: Herhaling;
  /** Is de auditie per wereld al gedaan? */
  auditie: { rekenen: boolean; flits: boolean };
  /** Voor het overzicht in de ouderhoek. */
  stats: {
    /** Per soort som, bijv. "min tot 100 met overschrijding". */
    sommen: Record<string, Telling>;
    /** Verwisselde woorden, bijv. "lucht→licht": 3. */
    verwisselingen: Record<string, number>;
  };
  instellingen: {
    /** Na zoveel minuten volgt na het concert een pauze (0 = geen grens). */
    sessieMinuten: number;
    opgavenPerSessie: number;
    apparaatStem: string | null;
    effecten: boolean;
    verhaaltjesSommen: boolean;
  };
};

export function standaardVoortgang(): Voortgang {
  return {
    versie: 1,
    noten: 0,
    vaardigheden: {
      // Groep 4: rekenen start op R3 (tot 100 zonder overschrijding), flitsen op L2.
      rekenen: { niveau: 1, recent: [] },
      flits: { niveau: 1, recent: [] },
      verhaal: { niveau: 0, recent: [] },
    },
    flitstijd: FLITS_START,
    gelezenVerhalen: [],
    sessies: [],
    herhaling: {},
    auditie: { rekenen: false, flits: false },
    stats: { sommen: {}, verwisselingen: {} },
    instellingen: {
      sessieMinuten: 15,
      opgavenPerSessie: 8,
      apparaatStem: null,
      effecten: true,
      verhaaltjesSommen: true,
    },
  };
}

const SLEUTEL = 'voortgang';

export const vg: Voortgang = $state(standaardVoortgang());

/** Vul ontbrekende velden aan (bij een oudere versie of een import). */
function samenvoegen(basis: Voortgang, data: Partial<Voortgang>): Voortgang {
  // Wie al gespeeld heeft voordat de auditie bestond, hoeft die niet meer te doen.
  const gespeeld = (v?: Vaardigheid) => (v?.recent.length ?? 0) > 0;
  return {
    ...basis,
    ...data,
    vaardigheden: { ...basis.vaardigheden, ...(data.vaardigheden ?? {}) },
    auditie: data.auditie ?? {
      rekenen: gespeeld(data.vaardigheden?.rekenen),
      flits: gespeeld(data.vaardigheden?.flits),
    },
    stats: { ...basis.stats, ...(data.stats ?? {}) },
    instellingen: { ...basis.instellingen, ...(data.instellingen ?? {}) },
  };
}

export async function laadVoortgang() {
  try {
    const data = await get<Partial<Voortgang>>(SLEUTEL);
    if (data) Object.assign(vg, samenvoegen(standaardVoortgang(), data));
  } catch {
    // Opslag niet beschikbaar (bijv. privévenster): dan alleen voor deze keer.
  }
}

export async function bewaar() {
  try {
    await set(SLEUTEL, $state.snapshot(vg));
  } catch {
    // negeren
  }
}

export function exporteer(): string {
  return JSON.stringify($state.snapshot(vg), null, 2);
}

export async function importeer(json: string) {
  const data = JSON.parse(json) as Partial<Voortgang>;
  if (typeof data !== 'object' || data === null || !('vaardigheden' in data)) {
    throw new Error('Dit is geen back-up van Lana’s Gouden Missie.');
  }
  Object.assign(vg, samenvoegen(standaardVoortgang(), data));
  await bewaar();
}

export async function wisAlles() {
  Object.assign(vg, standaardVoortgang());
  await bewaar();
}
