/**
 * Voortgang van Lana, bewaard op de tablet (IndexedDB).
 */
import { get, set } from 'idb-keyval';
import type { Vaardigheid } from '../engine/adaptief';
import { FLITS_START } from '../engine/generator-lezen';

export type HeldinId = 'rumi' | 'mira' | 'zoey';

export type Sessie = {
  datum: string;
  heldin: HeldinId;
  goed: number;
  totaal: number;
  noten: number;
  seconden: number;
};

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
  instellingen: {
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
    instellingen: {
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
  return {
    ...basis,
    ...data,
    vaardigheden: { ...basis.vaardigheden, ...(data.vaardigheden ?? {}) },
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
