/**
 * Voortgang van Lana, bewaard op de tablet (IndexedDB).
 */
import { get, set } from 'idb-keyval';
import type { Vaardigheid } from '../engine/adaptief';
import type { Herhaling } from '../engine/herhaling';
import { somNiveau } from '../engine/generator-rekenen';

/** Aantal rekenniveaus; was eerst 3, nu 5 kleinere stapjes. */
const REKEN_STAPPEN = 5;
import { FLITS_START } from '../engine/generator-lezen';
import { STANDAARD_AVATAR, type Avatar } from '../engine/kleedkamer';
import type { TourStand } from '../engine/tour';

export type HeldinId = 'rumi' | 'mira' | 'zoey';

/** Alle vaardigheden die apart een niveau bijhouden (één per spel, rekenen = Dans-sommen). */
export type VaardigheidId =
  | 'rekenen'
  | 'flits'
  | 'verhaal'
  | 'plaatje'
  | 'zwaard'
  | 'karaoke'
  | 'rijm'
  | 'zinnen'
  | 'springen'
  | 'dozen'
  | 'tafels';

export type Leestempo = { datum: string; liedje: string; ronde: number; seconden: number; woorden: number };

export type Sessie = {
  datum: string;
  heldin: HeldinId | 'baas';
  /** Stad op de wereldtour (sinds fase 4). */
  stad?: string;
  /** Welk spel (sinds fase 3). */
  spel?: string;
  goed: number;
  totaal: number;
  noten: number;
  seconden: number;
  auditie?: boolean;
};

export type Telling = { goed: number; totaal: number };

export type Voortgang = {
  versie: 1;
  /** Met hoeveel rekenniveaus deze voortgang is opgebouwd. */
  rekenStappen?: number;
  noten: number;
  vaardigheden: Record<VaardigheidId, Vaardigheid>;
  /** Karaoke: gemeten leestempo per ronde (voor de grafiek in de ouderhoek). */
  leestempo: Leestempo[];
  /** Karaoke-liedjes in de volgorde waarin ze gezongen zijn (oudste eerst). */
  gezongen: string[];
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
  /** Lana's eigen figuur (kleedkamer). */
  avatar: Avatar;
  /** Gekochte kleedkamer-items, bijv. "outfit:glitterjurk". */
  gekocht: string[];
  /** Wereldtour: sterren per stad per podium. */
  tour: TourStand;
  instellingen: {
    /** Na zoveel minuten volgt na het concert een pauze (0 = geen grens). */
    sessieMinuten: number;
    /** Volledig scherm bij het starten (standaard uit: dan blijven de knoppen van de tablet zichtbaar). */
    volledigScherm: boolean;
    opgavenPerSessie: number;
    apparaatStem: string | null;
    effecten: boolean;
    verhaaltjesSommen: boolean;
  };
};

export function standaardVoortgang(): Voortgang {
  return {
    versie: 1,
    rekenStappen: REKEN_STAPPEN,
    noten: 0,
    vaardigheden: {
      // Groep 4: rekenen start op R3 (tot 100 zonder overschrijding), flitsen op L2.
      rekenen: { niveau: 0, recent: [] },
      flits: { niveau: 1, recent: [] },
      verhaal: { niveau: 0, recent: [] },
      plaatje: { niveau: 0, recent: [] },
      zwaard: { niveau: 0, recent: [] },
      karaoke: { niveau: 0, recent: [] },
      rijm: { niveau: 0, recent: [] },
      zinnen: { niveau: 0, recent: [] },
      springen: { niveau: 0, recent: [] },
      dozen: { niveau: 0, recent: [] },
      tafels: { niveau: 0, recent: [] },
    },
    leestempo: [],
    gezongen: [],
    flitstijd: FLITS_START,
    gelezenVerhalen: [],
    sessies: [],
    herhaling: {},
    auditie: { rekenen: false, flits: false },
    stats: { sommen: {}, verwisselingen: {} },
    avatar: { ...STANDAARD_AVATAR },
    gekocht: [],
    tour: {},
    instellingen: {
      sessieMinuten: 15,
      volledigScherm: false,
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
  // Oude voortgang met 3 rekenniveaus: rekenen opnieuw laten beginnen met een nieuwe, rustigere auditie.
  if ((data.rekenStappen ?? 3) < REKEN_STAPPEN && data.vaardigheden) {
    data = {
      ...data,
      rekenStappen: REKEN_STAPPEN,
      vaardigheden: { ...data.vaardigheden, rekenen: { niveau: 0, recent: [], opNiveau: [] } },
      auditie: { rekenen: false, flits: data.auditie?.flits ?? gespeeld(data.vaardigheden.flits) },
      herhaling: Object.fromEntries(
        Object.entries(data.herhaling ?? {}).map(([id, item]) => {
          const m = /^som\.(\d+)([+-])(\d+)$/.exec(id);
          return [id, m ? { ...item, niveau: somNiveau(Number(m[1]), m[2] as '+' | '-', Number(m[3])) } : item];
        }),
      ),
    };
  }
  return {
    ...basis,
    ...data,
    vaardigheden: { ...basis.vaardigheden, ...(data.vaardigheden ?? {}) },
    auditie: data.auditie ?? {
      rekenen: gespeeld(data.vaardigheden?.rekenen),
      flits: gespeeld(data.vaardigheden?.flits),
    },
    stats: { ...basis.stats, ...(data.stats ?? {}) },
    avatar: { ...basis.avatar, ...(data.avatar ?? {}) },
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
