import { create } from "zustand";
import type {
  TemperatureDevice,
  TemperatureReading,
  ChecklistTemplate,
  ChecklistEntry,
  Deviation,
} from "../types";
import { useAuthStore } from "./authStore";
import {
  getDevices,
  saveDevice as storageSaveDevice,
  deleteDevice as storageDeleteDevice,
  getReadings,
  saveReading as storageSaveReading,
  getChecklistTemplates,
  getChecklistEntries,
  saveChecklistEntry as storageSaveEntry,
  getDeviations,
  saveDeviation as storageSaveDeviation,
  updateDeviation as storageUpdateDeviation,
  seedDemoData,
} from "../services/storageService";

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
        getDevices(),
        getReadings(),
        getChecklistTemplates(),
        getChecklistEntries(),
        getDeviations(),
      ]);

    // Seed demo data if empty
    if (devices.length === 0) {
      await seedDemoData();
      const [seededDevices, seededChecklists] = await Promise.all([
        getDevices(),
        getChecklistTemplates(),
      ]);
      set({
        devices: seededDevices,
        readings: [],
        checklists: seededChecklists,
        entries: [],
        deviations: [],
        hydrated: true,
      });
      return;
    }

    set({ devices, readings, checklists, entries, deviations, hydrated: true });
  },

  addDevice: async (device) => {
    const newDevice = await storageSaveDevice(device);
    set({ devices: [...get().devices, newDevice] });
    return newDevice;
  },

  deleteDevice: async (id) => {
    await storageDeleteDevice(id);
    set({ devices: get().devices.filter((d) => d.id !== id) });
  },

  addReading: async (reading) => {
    const newReading = await storageSaveReading(reading);
    const readings = [newReading, ...get().readings].slice(0, 500);
    const devices = get().devices.map((d) =>
      d.id === newReading.deviceId ? { ...d, lastReading: newReading } : d,
    );
    set({ readings, devices });
    return newReading;
  },

  addChecklistEntry: async (entry) => {
    const newEntry = await storageSaveEntry(entry);
    set({ entries: [newEntry, ...get().entries].slice(0, 200) });
    return newEntry;
  },

  addDeviation: async (deviation) => {
    const newDeviation = await storageSaveDeviation(deviation);
    set({ deviations: [newDeviation, ...get().deviations] });
    return newDeviation;
  },

  updateDeviation: async (id, updates) => {
    await storageUpdateDeviation(id, updates);
    const deviations = get().deviations.map((d) =>
      d.id === id ? { ...d, ...updates } : d,
    );
    set({ deviations });
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

