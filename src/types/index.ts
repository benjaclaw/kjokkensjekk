import type { ComplianceStatus } from "../theme";

export interface TemperatureDevice {
  id: string;
  name: string;
  type: "fridge" | "freezer" | "hot" | "other";
  minTemp: number;
  maxTemp: number;
  lastReading?: TemperatureReading;
}

export interface TemperatureReading {
  id: string;
  deviceId: string;
  temperature: number;
  status: ComplianceStatus;
  recordedBy: string;
  recordedAt: number;
  note?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  category: string;
  items: ChecklistItemTemplate[];
}

export interface ChecklistItemTemplate {
  id: string;
  text: string;
  requiresPhoto: boolean;
  requiresComment: boolean;
}

export interface ChecklistEntry {
  id: string;
  templateId: string;
  completedItems: CompletedChecklistItem[];
  completedBy: string;
  completedAt?: number;
  startedAt: number;
  status: "in_progress" | "completed";
}

export interface CompletedChecklistItem {
  itemId: string;
  result: "ok" | "deviation";
  comment?: string;
  photoUri?: string;
}

export interface Deviation {
  id: string;
  category: string;
  severity: ComplianceStatus;
  description: string;
  correctiveAction?: string;
  reportedBy: string;
  reportedAt: number;
  assignedTo?: string;
  dueDate?: number;
  status: "open" | "in_progress" | "closed";
  closedAt?: number;
  closedBy?: string;
  photoUri?: string;
}

export interface ActivityLogEntry {
  id: string;
  type: "temperature" | "checklist" | "deviation" | "compliance";
  description: string;
  userId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
