import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  TemperatureDevice,
  TemperatureReading,
  ChecklistTemplate,
  ChecklistEntry,
  Deviation,
} from "../types";
import { useAuthStore } from "./authStore";

const KEYS = {
  devices: "kjokkensjekk_devices",
  readings: "kjokkensjekk_readings",
  checklists: "kjokkensjekk_checklists",
  entries: "kjokkensjekk_entries",
  deviations: "kjokkensjekk_deviations",
} as const;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface AppState {
  // Data
  devices: TemperatureDevice[];
  readings: TemperatureReading[];
  checklists: ChecklistTemplate[];
  entries: ChecklistEntry[];
  deviations: Deviation[];
  activeUser: string;
  hydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;

  // Devices
  addDevice: (device: Omit<TemperatureDevice, "id">) => Promise<TemperatureDevice>;
  deleteDevice: (id: string) => Promise<void>;

  // Readings
  addReading: (reading: Omit<TemperatureReading, "id">) => Promise<TemperatureReading>;

  // Checklists
  addChecklistEntry: (entry: Omit<ChecklistEntry, "id">) => Promise<ChecklistEntry>;

  // Deviations
  addDeviation: (deviation: Omit<Deviation, "id">) => Promise<Deviation>;
  updateDeviation: (id: string, updates: Partial<Deviation>) => Promise<void>;

  // User
  setActiveUser: (name: string) => void;
}

async function loadList<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data) return [];
    const parsed: unknown = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function persistList<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export const useAppStore = create<AppState>((set, get) => ({
  devices: [],
  readings: [],
  checklists: [],
  entries: [],
  deviations: [],
  activeUser: useAuthStore.getState().profile?.display_name ?? "Bruker",
  hydrated: false,

  hydrate: async () => {
    const [devices, readings, checklists, entries, deviations] =
      await Promise.all([
        loadList<TemperatureDevice>(KEYS.devices),
        loadList<TemperatureReading>(KEYS.readings),
        loadList<ChecklistTemplate>(KEYS.checklists),
        loadList<ChecklistEntry>(KEYS.entries),
        loadList<Deviation>(KEYS.deviations),
      ]);

    // Seed demo data if empty
    if (devices.length === 0) {
      const seeded = await seedDemoData();
      set({
        devices: seeded.devices,
        readings: [],
        checklists: seeded.checklists,
        entries: [],
        deviations: [],
        hydrated: true,
      });
      return;
    }

    set({ devices, readings, checklists, entries, deviations, hydrated: true });
  },

  addDevice: async (device) => {
    const newDevice: TemperatureDevice = { ...device, id: generateId() };
    const updated = [...get().devices, newDevice];
    set({ devices: updated });
    await persistList(KEYS.devices, updated);
    return newDevice;
  },

  deleteDevice: async (id) => {
    const updated = get().devices.filter((d) => d.id !== id);
    set({ devices: updated });
    await persistList(KEYS.devices, updated);
  },

  addReading: async (reading) => {
    const newReading: TemperatureReading = { ...reading, id: generateId() };
    const readings = [newReading, ...get().readings].slice(0, 500);
    const devices = get().devices.map((d) =>
      d.id === newReading.deviceId ? { ...d, lastReading: newReading } : d,
    );
    set({ readings, devices });
    await Promise.all([
      persistList(KEYS.readings, readings),
      persistList(KEYS.devices, devices),
    ]);
    return newReading;
  },

  addChecklistEntry: async (entry) => {
    const newEntry: ChecklistEntry = { ...entry, id: generateId() };
    const entries = [newEntry, ...get().entries].slice(0, 200);
    set({ entries });
    await persistList(KEYS.entries, entries);
    return newEntry;
  },

  addDeviation: async (deviation) => {
    const newDeviation: Deviation = { ...deviation, id: generateId() };
    const deviations = [newDeviation, ...get().deviations];
    set({ deviations });
    await persistList(KEYS.deviations, deviations);
    return newDeviation;
  },

  updateDeviation: async (id, updates) => {
    const deviations = get().deviations.map((d) =>
      d.id === id ? { ...d, ...updates } : d,
    );
    set({ deviations });
    await persistList(KEYS.deviations, deviations);
  },

  setActiveUser: (name) => set({ activeUser: name }),
}));

// Sync activeUser from authStore
useAuthStore.subscribe((state) => {
  const name = state.profile?.display_name ?? "Bruker";
  if (useAppStore.getState().activeUser !== name) {
    useAppStore.setState({ activeUser: name });
  }
});

// Demo data seeding
async function seedDemoData(): Promise<{
  devices: TemperatureDevice[];
  checklists: ChecklistTemplate[];
}> {
  const devices: TemperatureDevice[] = [
    {
      id: "demo-1",
      name: "Kjøleskap 1",
      type: "fridge",
      minTemp: 0,
      maxTemp: 4,
      lastReading: {
        id: "r-1",
        deviceId: "demo-1",
        temperature: 3.2,
        status: "ok",
        recordedBy: "System",
        recordedAt: Date.now() - 3600000,
      },
    },
    {
      id: "demo-2",
      name: "Kjøleskap 2",
      type: "fridge",
      minTemp: 0,
      maxTemp: 4,
      lastReading: {
        id: "r-2",
        deviceId: "demo-2",
        temperature: 5.1,
        status: "critical",
        recordedBy: "System",
        recordedAt: Date.now() - 7200000,
      },
    },
    {
      id: "demo-3",
      name: "Fryser",
      type: "freezer",
      minTemp: -25,
      maxTemp: -18,
      lastReading: {
        id: "r-3",
        deviceId: "demo-3",
        temperature: -20.5,
        status: "ok",
        recordedBy: "System",
        recordedAt: Date.now() - 1800000,
      },
    },
  ];

  const checklists: ChecklistTemplate[] = [
    {
      id: "cl-1",
      name: "Daglig renholdssjekk",
      category: "Renhold",
      items: [
        { id: "cl-1-1", text: "Kjøkkenbenker rengjort", requiresPhoto: false, requiresComment: false },
        { id: "cl-1-2", text: "Gulv vasket", requiresPhoto: false, requiresComment: false },
        { id: "cl-1-3", text: "Oppvaskmaskin tømt og rengjort", requiresPhoto: false, requiresComment: false },
        { id: "cl-1-4", text: "Søppel tømt", requiresPhoto: false, requiresComment: false },
        { id: "cl-1-5", text: "Håndvasker med såpe og papir", requiresPhoto: false, requiresComment: false },
        { id: "cl-1-6", text: "Kjøleskap rengjort utvendig", requiresPhoto: false, requiresComment: false },
      ],
    },
    {
      id: "cl-2",
      name: "Varemottak",
      category: "Mottak",
      items: [
        { id: "cl-2-1", text: "Temperatur på kjølevarer kontrollert", requiresPhoto: false, requiresComment: true },
        { id: "cl-2-2", text: "Emballasje intakt", requiresPhoto: false, requiresComment: false },
        { id: "cl-2-3", text: "Holdbarhetsdato sjekket", requiresPhoto: false, requiresComment: false },
        { id: "cl-2-4", text: "Varer plassert riktig i lager", requiresPhoto: false, requiresComment: false },
      ],
    },
    {
      id: "cl-3",
      name: "Ukentlig dyprengjøring",
      category: "Renhold",
      items: [
        { id: "cl-3-1", text: "Kjøleskap rengjort innvendig", requiresPhoto: true, requiresComment: false },
        { id: "cl-3-2", text: "Fryser kontrollert", requiresPhoto: false, requiresComment: false },
        { id: "cl-3-3", text: "Ventilasjon rengjort", requiresPhoto: false, requiresComment: false },
        { id: "cl-3-4", text: "Avtrekk rengjort", requiresPhoto: true, requiresComment: false },
        { id: "cl-3-5", text: "Utstyr desinfisert", requiresPhoto: false, requiresComment: false },
      ],
    },
  ];

  await Promise.all([
    persistList(KEYS.devices, devices),
    persistList(KEYS.checklists, checklists),
  ]);

  return { devices, checklists };
}
