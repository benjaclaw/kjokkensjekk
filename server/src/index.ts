import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";

const app = express();
const PORT = process.env["PORT"] ?? 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ─── Auth ────────────────────────────────────────────────────────
app.post("/api/auth/login", (_req: Request, res: Response) => {
  // TODO: Implement JWT authentication
  res.json({ message: "Login endpoint — not yet implemented" });
});

app.post("/api/auth/register", (_req: Request, res: Response) => {
  // TODO: Implement user registration
  res.json({ message: "Register endpoint — not yet implemented" });
});

// ─── Devices ─────────────────────────────────────────────────────
app.get("/api/devices", (_req: Request, res: Response) => {
  // TODO: Fetch devices for org
  res.json([]);
});

app.post("/api/devices", (_req: Request, res: Response) => {
  // TODO: Create device
  res.status(201).json({ message: "Device created" });
});

app.get("/api/devices/:id", (req: Request, res: Response) => {
  // TODO: Fetch single device
  res.json({ id: req.params["id"] });
});

app.patch("/api/devices/:id", (req: Request, res: Response) => {
  // TODO: Update device
  res.json({ id: req.params["id"], message: "Device updated" });
});

app.delete("/api/devices/:id", (req: Request, res: Response) => {
  // TODO: Delete device
  res.json({ id: req.params["id"], message: "Device deleted" });
});

// ─── Temperature Logs ────────────────────────────────────────────
app.post("/api/temperatures", (_req: Request, res: Response) => {
  // TODO: Save temperature reading
  res.status(201).json({ message: "Temperature logged" });
});

app.get("/api/temperatures", (_req: Request, res: Response) => {
  // TODO: Query by device_id, from, to
  res.json([]);
});

// ─── Checklists ──────────────────────────────────────────────────
app.get("/api/checklists", (_req: Request, res: Response) => {
  // TODO: Fetch checklist templates for org
  res.json([]);
});

app.post("/api/checklists/:id/entries", (req: Request, res: Response) => {
  // TODO: Save completed checklist entry
  res.status(201).json({ templateId: req.params["id"], message: "Entry saved" });
});

// ─── Deviations ──────────────────────────────────────────────────
app.get("/api/deviations", (_req: Request, res: Response) => {
  // TODO: Fetch deviations for org
  res.json([]);
});

app.post("/api/deviations", (_req: Request, res: Response) => {
  // TODO: Create deviation
  res.status(201).json({ message: "Deviation created" });
});

app.patch("/api/deviations/:id", (req: Request, res: Response) => {
  // TODO: Update deviation status/resolution
  res.json({ id: req.params["id"], message: "Deviation updated" });
});

// ─── Activity Feed ───────────────────────────────────────────────
app.get("/api/activity", (_req: Request, res: Response) => {
  // TODO: Fetch activity feed for org
  res.json([]);
});

// ─── Reports ─────────────────────────────────────────────────────
app.get("/api/reports/compliance", (_req: Request, res: Response) => {
  // TODO: Calculate compliance score
  res.json({ score: 0, breakdown: {} });
});

app.get("/api/reports/temperature", (_req: Request, res: Response) => {
  // TODO: Temperature statistics
  res.json({ stats: [] });
});

// ─── Error handler ───────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Kjøkkensjekk API running on port ${PORT}`);
});

export default app;
