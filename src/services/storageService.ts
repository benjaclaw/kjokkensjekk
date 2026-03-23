import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  TemperatureDevice,
  TemperatureReading,
  ChecklistTemplate,
  ChecklistEntry,
  Deviation,
} from "../types";

// Storage keys
const KEYS = {
  devices: "kjokkensjekk_devices",
  readings: "kjokkensjekk_readings",
  checklists: "kjokkensjekk_checklists",
  entries: "kjokkensjekk_entries",
  deviations: "kjokkensjekk_deviations",
} as const;

// Write mutex
let writeLock: Promise<void> = Promise.resolve();

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const current = writeLock;
  let resolve: () => void;
  writeLock = new Promise<void>((r) => {
    resolve = r;
  });
  return current.then(fn).finally(() => resolve());
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getList<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Failed to read ${key}:`, error);
    return [];
  }
}

async function setList<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

// === Devices ===

export async function getDevices(): Promise<TemperatureDevice[]> {
  return getList<TemperatureDevice>(KEYS.devices);
}

export async function saveDevice(
  device: Omit<TemperatureDevice, "id">
): Promise<TemperatureDevice> {
  const newDevice = { ...device, id: generateId() } as TemperatureDevice;
  await withWriteLock(async () => {
    const devices = await getDevices();
    devices.push(newDevice);
    await setList(KEYS.devices, devices);
  });
  return newDevice;
}

export async function deleteDevice(id: string): Promise<void> {
  await withWriteLock(async () => {
    const devices = await getDevices();
    await setList(
      KEYS.devices,
      devices.filter((d) => d.id !== id)
    );
  });
}

// === Temperature Readings ===

export async function getReadings(deviceId?: string): Promise<TemperatureReading[]> {
  const readings = await getList<TemperatureReading>(KEYS.readings);
  if (deviceId) {
    return readings.filter((r) => r.deviceId === deviceId);
  }
  return readings;
}

export async function saveReading(
  reading: Omit<TemperatureReading, "id">
): Promise<TemperatureReading> {
  const newReading = { ...reading, id: generateId() } as TemperatureReading;
  await withWriteLock(async () => {
    const readings = await getReadings();
    readings.unshift(newReading);
    // Behold maks 500 readings
    const limited = readings.slice(0, 500);
    await setList(KEYS.readings, limited);

    // Oppdater siste reading på enheten
    const devices = await getDevices();
    const updated = devices.map((d) =>
      d.id === newReading.deviceId ? { ...d, lastReading: newReading } : d
    );
    await setList(KEYS.devices, updated);
  });
  return newReading;
}

// === Checklists ===

export async function getChecklistTemplates(): Promise<ChecklistTemplate[]> {
  return getList<ChecklistTemplate>(KEYS.checklists);
}

export async function getChecklistEntries(): Promise<ChecklistEntry[]> {
  return getList<ChecklistEntry>(KEYS.entries);
}

export async function saveChecklistEntry(
  entry: Omit<ChecklistEntry, "id">
): Promise<ChecklistEntry> {
  const newEntry = { ...entry, id: generateId() } as ChecklistEntry;
  await withWriteLock(async () => {
    const entries = await getChecklistEntries();
    entries.unshift(newEntry);
    await setList(KEYS.entries, entries.slice(0, 200));
  });
  return newEntry;
}

// === Deviations ===

export async function getDeviations(): Promise<Deviation[]> {
  return getList<Deviation>(KEYS.deviations);
}

export async function saveDeviation(
  deviation: Omit<Deviation, "id">
): Promise<Deviation> {
  const newDeviation = { ...deviation, id: generateId() } as Deviation;
  await withWriteLock(async () => {
    const deviations = await getDeviations();
    deviations.unshift(newDeviation);
    await setList(KEYS.deviations, deviations);
  });
  return newDeviation;
}

export async function updateDeviation(
  id: string,
  updates: Partial<Deviation>
): Promise<void> {
  await withWriteLock(async () => {
    const deviations = await getDeviations();
    const updated = deviations.map((d) =>
      d.id === id ? { ...d, ...updates } : d
    );
    await setList(KEYS.deviations, updated);
  });
}

// === Seed demo data ===

export async function seedDemoData(): Promise<void> {
  const devices = await getDevices();
  if (devices.length > 0) return; // Allerede data

  const demoDevices: TemperatureDevice[] = [
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

  await setList(KEYS.devices, demoDevices);
}
