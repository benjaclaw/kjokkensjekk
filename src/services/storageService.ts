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

  // Seed historikk-data: 20 readings per device over 7 dager
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const demoReadings: TemperatureReading[] = [];

  // Kjøleskap 1 (0–4°C): mostly in range, a few spikes
  const fridge1Temps = [
    2.8, 3.1, 3.5, 2.9, 3.0, 4.2, 3.3, 2.7, 3.8, 3.1,
    5.3, 3.4, 2.6, 3.0, 3.7, 4.8, 3.2, 2.5, 3.6, 3.2,
  ];
  for (let i = 0; i < 20; i++) {
    const t = fridge1Temps[i];
    const status = t >= 0 && t <= 4 ? "ok" : "critical";
    demoReadings.push({
      id: `seed-r1-${i}`,
      deviceId: "demo-1",
      temperature: t,
      status: status as TemperatureReading["status"],
      recordedBy: "System",
      recordedAt: now - (7 * DAY) + i * ((7 * DAY) / 20),
    });
  }

  // Kjøleskap 2 (0–4°C): more unstable, several out-of-range
  const fridge2Temps = [
    3.9, 4.5, 5.1, 4.8, 3.6, 3.2, 3.8, 5.5, 4.1, 3.5,
    2.9, 4.3, 5.8, 4.6, 3.7, 3.1, 4.9, 5.2, 4.0, 5.1,
  ];
  for (let i = 0; i < 20; i++) {
    const t = fridge2Temps[i];
    const status = t >= 0 && t <= 4 ? "ok" : "critical";
    demoReadings.push({
      id: `seed-r2-${i}`,
      deviceId: "demo-2",
      temperature: t,
      status: status as TemperatureReading["status"],
      recordedBy: "System",
      recordedAt: now - (7 * DAY) + i * ((7 * DAY) / 20),
    });
  }

  await setList(KEYS.readings, demoReadings);

  const demoChecklists: ChecklistTemplate[] = [
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
    {
      id: "cl-4",
      name: "Personlig hygiene",
      category: "Hygiene",
      items: [
        { id: "cl-4-1", text: "Rent arbeidstøy/uniform", requiresPhoto: false, requiresComment: false },
        { id: "cl-4-2", text: "Hårvern brukt", requiresPhoto: false, requiresComment: false },
        { id: "cl-4-3", text: "Ingen smykker/klokker", requiresPhoto: false, requiresComment: false },
        { id: "cl-4-4", text: "Hender vasket og desinfisert", requiresPhoto: false, requiresComment: false },
        { id: "cl-4-5", text: "Ingen synlige sår uten plaster", requiresPhoto: false, requiresComment: false },
        { id: "cl-4-6", text: "Syke ansatte holdt hjemme", requiresPhoto: false, requiresComment: false },
      ],
    },
    {
      id: "cl-5",
      name: "Allergenkontroll",
      category: "Allergen",
      items: [
        { id: "cl-5-1", text: "Allergenliste oppdatert og tilgjengelig", requiresPhoto: false, requiresComment: false },
        { id: "cl-5-2", text: "Allergenfrie soner merket", requiresPhoto: false, requiresComment: false },
        { id: "cl-5-3", text: "Separate redskaper for allergenfri mat", requiresPhoto: false, requiresComment: false },
        { id: "cl-5-4", text: "Personale opplært i allergenhåndtering", requiresPhoto: false, requiresComment: false },
        { id: "cl-5-5", text: "Kryssforurensning forhindret", requiresPhoto: false, requiresComment: false },
      ],
    },
    {
      id: "cl-6",
      name: "Kjøle- og frysekontroll",
      category: "Temperatur",
      items: [
        { id: "cl-6-1", text: "Kjøleskapstemperatur under 4°C", requiresPhoto: false, requiresComment: true },
        { id: "cl-6-2", text: "Frysertemperatur under -18°C", requiresPhoto: false, requiresComment: true },
        { id: "cl-6-3", text: "Varer plassert riktig (rå under, ferdig over)", requiresPhoto: false, requiresComment: false },
        { id: "cl-6-4", text: "Ingen overfylte kjøleskap", requiresPhoto: false, requiresComment: false },
        { id: "cl-6-5", text: "Dato-merking på alle varer", requiresPhoto: false, requiresComment: false },
        { id: "cl-6-6", text: "Utgåtte varer fjernet", requiresPhoto: false, requiresComment: false },
      ],
    },
    {
      id: "cl-7",
      name: "Skadedyrkontroll",
      category: "Skadedyr",
      items: [
        { id: "cl-7-1", text: "Ingen tegn til skadedyr", requiresPhoto: false, requiresComment: false },
        { id: "cl-7-2", text: "Feller kontrollert og dokumentert", requiresPhoto: false, requiresComment: true },
        { id: "cl-7-3", text: "Dører og vinduer tett", requiresPhoto: false, requiresComment: false },
        { id: "cl-7-4", text: "Søppel tømt og lukket", requiresPhoto: false, requiresComment: false },
        { id: "cl-7-5", text: "Lager ryddig og rent", requiresPhoto: false, requiresComment: false },
      ],
    },
    {
      id: "cl-8",
      name: "Stengerutiner",
      category: "Daglig",
      items: [
        { id: "cl-8-1", text: "Alt utstyr rengjort og desinfisert", requiresPhoto: false, requiresComment: false },
        { id: "cl-8-2", text: "Matavfall kastet", requiresPhoto: false, requiresComment: false },
        { id: "cl-8-3", text: "Gulv vasket og desinfisert", requiresPhoto: false, requiresComment: false },
        { id: "cl-8-4", text: "Kjøle-/frysetemperatur OK", requiresPhoto: false, requiresComment: true },
        { id: "cl-8-5", text: "Komfyr, ovn, grill slått av", requiresPhoto: false, requiresComment: false },
        { id: "cl-8-6", text: "Dører og vinduer lukket og låst", requiresPhoto: false, requiresComment: false },
      ],
    },
  ];

  await setList(KEYS.checklists, demoChecklists);
}
