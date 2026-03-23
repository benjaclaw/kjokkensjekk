# Kjøkkensjekk API Server

Backend API for Kjøkkensjekk — HACCP matsikkerhets-app.

## Oppsett

```bash
cd server
npm install
npm run dev
```

Server kjører på `http://localhost:3000`.

## Database

PostgreSQL. Kjør `schema.sql` for å opprette tabellene:

```bash
psql -d kjokkensjekk -f schema.sql
```

## API Endepunkter

### Autentisering

| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| POST | `/api/auth/login` | Logg inn med e-post og passord |
| POST | `/api/auth/register` | Registrer ny bruker |

### Enheter (Devices)

| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/api/devices` | Hent alle enheter for organisasjonen |
| POST | `/api/devices` | Opprett ny enhet |
| GET | `/api/devices/:id` | Hent en spesifikk enhet |
| PATCH | `/api/devices/:id` | Oppdater enhet |
| DELETE | `/api/devices/:id` | Slett enhet |

### Temperaturlogger

| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| POST | `/api/temperatures` | Logg ny temperaturmåling |
| GET | `/api/temperatures?device_id=&from=&to=` | Hent temperaturlogger med filter |

### Sjekklister

| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/api/checklists` | Hent alle sjekklistemaler |
| POST | `/api/checklists/:id/entries` | Lagre utfylt sjekkliste |

### Avvik

| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/api/deviations` | Hent alle avvik |
| POST | `/api/deviations` | Opprett nytt avvik |
| PATCH | `/api/deviations/:id` | Oppdater avviksstatus |

### Aktivitetsfeed

| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/api/activity` | Hent aktivitetsfeed |

### Rapporter

| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | `/api/reports/compliance` | Compliance-score og breakdown |
| GET | `/api/reports/temperature` | Temperaturstatistikk |

## Datamodell

Se `schema.sql` for komplett databaseskjema med:

- **organizations** — Organisasjoner/bedrifter
- **users** — Brukere med rolle (admin, manager, user)
- **devices** — Temperaturovervåkingsenheter
- **temperature_logs** — Temperaturmålinger
- **checklist_templates** — Sjekklistemaler med JSONB items
- **checklist_entries** — Utfylte sjekklister
- **deviations** — Avvik med status og oppfølging
- **activity_feed** — Aktivitetslogg
