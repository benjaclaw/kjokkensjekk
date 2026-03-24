# SYSTEM_LOGIC.md — Kjøkkensjekk

Systemlogikk, datastruktur og brukerflyt for matsikkerhets-appen.

---

## 1. Datastruktur

### Temperaturmålinger
- **Enheter** (`TemperatureDevice`): id, navn, type (kjøl/frys/varme/annet), min/max-grenser, siste måling
- **Målinger** (`TemperatureReading`): id, enhet-ID, temperatur (°C), status (ok/warning/critical), registrert av, tidsstempel, valgfri kommentar
- Hver enhet lagrer referanse til sin siste måling (`lastReading`)
- Maks 500 målinger i lokal cache (FIFO — eldste slettes først)
- Status beregnes automatisk: innenfor min/max → ok, utenfor → critical

### Sjekklister
- **Maler** (`ChecklistTemplate`): id, navn, kategori (Renhold/Mottak/etc), liste med sjekk-punkter
- **Utfylte instanser** (`ChecklistEntry`): id, mal-ID, utfylte punkter, startet av, startet/fullført tidspunkt, status (in_progress/completed)
- Hvert utfylt punkt: resultat (ok/avvik) + valgfri kommentar + valgfritt foto
- Maks 200 entries i lokal cache

### Avvik
- **Deviation**: id, kategori, alvorlighet (ok/warning/critical/pending), beskrivelse, korrigerende tiltak, rapportert av, tidspunkt, ansvarlig, frist, status (open/in_progress/closed), lukket av/tidspunkt, foto
- Avvik kan opprettes manuelt eller genereres fra sjekkliste-punkter med resultat "avvik"
- Ingen maks-grense på antall lagrede avvik

### Lagring
- All data lagres lokalt i AsyncStorage (key-value)
- Nøkler: `kjokkensjekk_devices`, `kjokkensjekk_readings`, `kjokkensjekk_checklists`, `kjokkensjekk_entries`, `kjokkensjekk_deviations`
- Demo-data seedet automatisk ved første oppstart (3 enheter + 3 sjekkliste-maler)
- **TODO**: Backend-synkronisering (Supabase) — ikke implementert ennå

---

## 2. Tidslogikk

### Definisjon av "en dag"
- **Gjeldende**: Midnatt til midnatt (00:00–23:59) i enhetens lokale tid
- **Foreslått forbedring**: Skiftbasert (f.eks. 06:00–06:00) — krever innstilling per bedrift
- Alle timestamps lagres som Unix millisekunder (`Date.now()`)

### Gruppering
- **Per dag**: Brukes for "sjekklister i dag", "compliance score i dag"
- **Per uke/måned**: Ikke implementert — planlagt for oversikts-fanen
- Daglig reset: Sjekklister regnes som "dagens" basert på `completedAt >= midnatt`

### Daglig reset-logikk
- Sjekkliste-maler er alltid tilgjengelige — en ny entry opprettes per utfylling
- Ingen eksplisitt "reset" — system sjekker om det finnes en completed entry for i dag
- **TODO**: Automatisk påminnelse om ugjorte sjekklister (push notifications)

---

## 3. Compliance Score

### Beregning
Vektet gjennomsnitt av tre faktorer:
```
Compliance = (Temp × 0.4) + (Sjekkliste × 0.3) + (Avvik × 0.3)
```

- **Temperatur (40%)**: Andel enheter med status "ok" av totalt antall enheter
- **Sjekkliste (30%)**: Andel fullførte sjekklister i dag av totalt antall maler
- **Avvik (30%)**: Andel lukkede avvik av totalt antall avvik
- Score: 0–100, avrundet til heltall

### Trafikklys
- 🟢 ≥ 80: "Alt ser bra ut i dag"
- 🟡 60–79: "Noen ting trenger oppmerksomhet"
- 🔴 < 60: "Det er oppgaver som haster"

---

## 4. Historikk og Rapporter

### Nåværende status
- Temperaturhistorikk: Siste 500 målinger (lokalt)
- Sjekklister: Siste 200 entries (lokalt)
- Avvik: Alle lagret (ingen grense)
- Ingen eksport-funksjon ennå

### Planlagt
| Funksjon | Prioritet | Beskrivelse |
|----------|-----------|-------------|
| Filtrer historikk | Høy | Dato, enhet, bruker, kategori |
| PDF-eksport | Høy | Daglig/ukentlig compliance-rapport for Mattilsynet |
| CSV-eksport | Medium | Rådata-eksport for analyse |
| Grafvisning | Medium | Temperatur over tid per enhet |
| Lagringsperiode | Lav | Konfigurerbar (standard: 1 år) |

---

## 5. Brukerflyt

### Morgen (åpning)
```
Åpne app → Hjem-skjerm
  → Se compliance score (trafikklys)
  → Se "Kommende oppgaver" (påminnelser)
  → Trykk "Temperatur" → Logg alle enheter
  → Trykk "Sjekkliste" → Utfør daglig renholdssjekk
```

### I løpet av dagen
```
Push-varsling → "Temperatur ikke logget på 4 timer"
  → Åpne app → Temperatur → Logg
  → Rød temperatur? → "Meld avvik" → Beskriv + foto
  → Varemottak → Sjekkliste "Varemottak" → Utfør
```

### Kveld (stenging)
```
Åpne app → Hjem-skjerm
  → Compliance score oppdatert basert på dagens aktivitet
  → Er noe rødt? → Utfør manglende sjekklister
  → Sjekk "Åpne avvik" → Oppdater status
  → Alt grønt? → Ferdig for dagen
```

### Leder / Kvalitetsansvarlig
```
Åpne app → Oversikt-fanen
  → Se compliance-trend over tid (planlagt)
  → Filtrer på dato/enhet/bruker (planlagt)
  → Generer PDF-rapport (planlagt)
  → Del med Mattilsynet ved inspeksjon
```

---

## 6. Varslingslogikk

### Implementert
- Push-notifikasjoner for avvik basert på alvorlighet og frist
- Notifikasjoner scheduleres ved oppstart og oppdateres ved endring

### Planlagt
| Varsel | Trigger | Prioritet |
|--------|---------|-----------|
| Temperatur-påminnelse | Ikke logget på X timer | Høy |
| Sjekkliste-påminnelse | Daglig sjekk ikke utført innen kl. 10 | Høy |
| Avvik-frist | 24 timer før frist | Medium |
| Ukesrapport | Søndag kveld — oppsummering | Lav |

---

## 7. Flerbruker (planlagt)

### Nåværende
- Én aktiv bruker per enhet (`activeUser` i Zustand store)
- Brukerbytte: Manuelt sett navn
- Ingen autentisering

### Planlagt
- PIN-basert brukerbytte (inspirert av Safe Food Pro)
- Roller: Admin (full tilgang), Bruker (logg + sjekklister), Leser (kun oversikt)
- Aktivitetslogg per bruker

---

## 8. Offline-strategi

### Nåværende
- Full offline-støtte via AsyncStorage
- All data lever lokalt — ingen nettverkskrav

### Planlagt (med Supabase-backend)
- Lokal-first: All data skrives lokalt først
- Synk ved tilkobling: Push lokale endringer → pull server-oppdateringer
- Konflikthåndtering: Siste endring vinner (timestamp-basert)
- Offline-indikator i UI
