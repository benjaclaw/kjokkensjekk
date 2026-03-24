import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type {
  TemperatureDevice,
  TemperatureReading,
  ChecklistTemplate,
  ChecklistEntry,
  Deviation,
} from "../types";

export interface ReportData {
  companyName: string;
  date: Date;
  complianceScore: number;
  devices: TemperatureDevice[];
  readings: TemperatureReading[];
  checklists: ChecklistTemplate[];
  entries: ChecklistEntry[];
  deviations: Deviation[];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("nb-NO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("nb-NO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusLabel(status: string): string {
  switch (status) {
    case "ok":
      return "OK";
    case "warning":
      return "Advarsel";
    case "critical":
      return "Kritisk";
    case "pending":
      return "Venter";
    case "open":
      return "Åpen";
    case "in_progress":
      return "Under arbeid";
    case "closed":
      return "Lukket";
    default:
      return status;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "ok":
    case "closed":
      return "#10B981";
    case "warning":
    case "in_progress":
      return "#F59E0B";
    case "critical":
    case "open":
      return "#EF4444";
    default:
      return "#64748B";
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

function scoreText(score: number): string {
  if (score >= 80) return "Alt ser bra ut i dag";
  if (score >= 60) return "Noen ting trenger oppmerksomhet";
  return "Det er oppgaver som haster";
}

function buildHtml(data: ReportData): string {
  const todayStart = new Date(data.date);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(data.date);
  todayEnd.setHours(23, 59, 59, 999);

  const todayReadings = data.readings.filter(
    (r) => r.recordedAt >= todayStart.getTime() && r.recordedAt <= todayEnd.getTime(),
  );

  const todayEntries = data.entries.filter(
    (e) =>
      e.status === "completed" &&
      (e.completedAt ?? 0) >= todayStart.getTime() &&
      (e.completedAt ?? 0) <= todayEnd.getTime(),
  );

  const openDeviations = data.deviations.filter((d) => d.status !== "closed");

  const deviceMap = new Map(data.devices.map((d) => [d.id, d]));
  const templateMap = new Map(data.checklists.map((t) => [t.id, t]));

  // --- Temperature table rows ---
  const tempRows = todayReadings
    .sort((a, b) => a.recordedAt - b.recordedAt)
    .map((r) => {
      const device = deviceMap.get(r.deviceId);
      const color = statusColor(r.status);
      return `<tr>
        <td>${escapeHtml(device?.name ?? "Ukjent")}</td>
        <td>${r.temperature.toFixed(1)} °C</td>
        <td><span class="badge" style="background:${color}15;color:${color}">${statusLabel(r.status)}</span></td>
        <td>${formatTime(r.recordedAt)}</td>
        <td>${escapeHtml(r.recordedBy)}</td>
      </tr>`;
    })
    .join("");

  // --- Checklist sections ---
  const checklistSections = todayEntries
    .map((entry) => {
      const template = templateMap.get(entry.templateId);
      if (!template) return "";
      const itemMap = new Map(template.items.map((i) => [i.id, i]));
      const rows = entry.completedItems
        .map((ci) => {
          const item = itemMap.get(ci.itemId);
          const isOk = ci.result === "ok";
          const color = isOk ? "#10B981" : "#EF4444";
          const label = isOk ? "OK" : "Avvik";
          return `<tr>
            <td>${escapeHtml(item?.text ?? ci.itemId)}</td>
            <td><span class="badge" style="background:${color}15;color:${color}">${label}</span></td>
            <td>${ci.comment ? escapeHtml(ci.comment) : "—"}</td>
          </tr>`;
        })
        .join("");

      return `<div class="checklist-block">
        <div class="checklist-header">
          <strong>${escapeHtml(template.name)}</strong>
          <span>Utfylt av ${escapeHtml(entry.completedBy)} kl. ${formatTime(entry.completedAt ?? entry.startedAt)}</span>
        </div>
        <table>
          <thead><tr><th>Punkt</th><th>Status</th><th>Kommentar</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    })
    .join("");

  // --- Deviation rows ---
  const deviationRows = openDeviations
    .sort((a, b) => {
      const sevOrder = { critical: 0, warning: 1, ok: 2, pending: 3 };
      return (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4);
    })
    .map((d) => {
      const sevColor = statusColor(d.severity);
      const statColor = statusColor(d.status);
      return `<tr>
        <td>${escapeHtml(d.description)}</td>
        <td><span class="badge" style="background:${sevColor}15;color:${sevColor}">${statusLabel(d.severity)}</span></td>
        <td>${escapeHtml(d.reportedBy)}</td>
        <td>${d.dueDate ? formatDate(new Date(d.dueDate)) : "—"}</td>
        <td><span class="badge" style="background:${statColor}15;color:${statColor}">${statusLabel(d.status)}</span></td>
      </tr>`;
    })
    .join("");

  const sc = scoreColor(data.complianceScore);

  return `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1A202C; padding: 32px; line-height: 1.5; }
  h1 { font-size: 20px; color: #0D9488; margin-bottom: 2px; }
  h2 { font-size: 14px; color: #1A202C; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #0D9488; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px; }
  .header-left h1 { margin-bottom: 2px; }
  .header-left p { font-size: 11px; color: #64748B; }
  .score-box { text-align: center; padding: 12px 24px; border: 3px solid ${sc}; border-radius: 12px; }
  .score-value { font-size: 36px; font-weight: 700; color: ${sc}; }
  .score-label { font-size: 10px; color: #64748B; }
  .score-text { font-size: 11px; color: ${sc}; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; color: #64748B; padding: 6px 8px; border-bottom: 2px solid #E2E8F0; }
  td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-size: 11px; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  .checklist-block { margin-bottom: 12px; }
  .checklist-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 11px; }
  .empty { color: #64748B; font-style: italic; padding: 8px 0; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 10px; color: #64748B; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>Kjøkkensjekk — Daglig rapport</h1>
    <p>${formatDate(data.date)}</p>
    <p>${escapeHtml(data.companyName)}</p>
  </div>
  <div class="score-box">
    <div class="score-value">${data.complianceScore}%</div>
    <div class="score-label">Compliance Score</div>
    <div class="score-text">${scoreText(data.complianceScore)}</div>
  </div>
</div>

<h2>Temperaturlogg</h2>
${
  todayReadings.length > 0
    ? `<table>
  <thead><tr><th>Enhet</th><th>Temperatur</th><th>Status</th><th>Klokkeslett</th><th>Registrert av</th></tr></thead>
  <tbody>${tempRows}</tbody>
</table>`
    : '<p class="empty">Ingen temperaturmålinger registrert i dag.</p>'
}

<h2>Sjekklister</h2>
${todayEntries.length > 0 ? checklistSections : '<p class="empty">Ingen sjekklister fullført i dag.</p>'}

<h2>Åpne avvik</h2>
${
  openDeviations.length > 0
    ? `<table>
  <thead><tr><th>Beskrivelse</th><th>Alvorlighet</th><th>Rapportert av</th><th>Frist</th><th>Status</th></tr></thead>
  <tbody>${deviationRows}</tbody>
</table>`
    : '<p class="empty">Ingen åpne avvik.</p>'
}

<div class="footer">
  Generert ${formatDateTime(new Date())} — Generert av Kjøkkensjekk
</div>

</body>
</html>`;
}

export async function generateDailyReport(data: ReportData): Promise<string> {
  const html = buildHtml(data);
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function shareDailyReport(data: ReportData): Promise<void> {
  const uri = await generateDailyReport(data);
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Del daglig rapport",
    UTI: "com.adobe.pdf",
  });
}
