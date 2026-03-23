# DESIGN.md — Kjøkkensjekk

Visuelt designsystem for Kjøkkensjekk — matsikkerhets-app for HACCP-compliance.

---

## 1. Fargepalett

Matsikkerhet krever tillit og profesjonalitet, men også varme og tilgjengelighet.
Inspirert av norsk natur (fjord-grønt) med klare signalfarger for compliance-status.

```
Primary:     #0D9488 — Teal/fjordgrønn — tillit, helse, renhet
Secondary:   #1E3A5F — Mørk marineblå — profesjonalitet, autoritet
Accent:      #F59E0B — Varm amber — oppmerksomhet, varsler
Success:     #10B981 — Grønn — godkjent, OK, compliance i orden
Warning:     #F59E0B — Amber — advarsel, nærmer seg grense
Danger:      #EF4444 — Rød — avvik, temperatur utenfor, kritisk
Background:  #F8FAFB — Svært lys grå-blå — ren, klinisk men varm
Surface:     #FFFFFF — Hvit — kort, input, modaler
Text:        #1A202C — Nesten svart — god lesbarhet
TextMuted:   #64748B — Myk gråblå — labels, sekundærtekst
Border:      #E2E8F0 — Lys grå — subtile skillelinjer

Dark mode:
DarkBg:      #0F172A — Dyp marineblå
DarkSurface: #1E293B — Mørk overflate
DarkText:    #F1F5F9 — Lys tekst
DarkBorder:  #334155 — Mørk border
```

### Compliance trafikklys-system
Det viktigste visuelle elementet i appen. Brukes konsekvent overalt:
- 🟢 `#10B981` — Alt i orden
- 🟡 `#F59E0B` — Trenger oppmerksomhet
- 🔴 `#EF4444` — Kritisk / avvik

---

## 2. Typografi

Profesjonell men lesbar — viktig for kjøkkenmiljø med damp, stress og fart.

```
Heading:  Inter — clean, moderne, god lesbarhet i alle størrelser
Body:     Inter — konsistent, fungerer bra i små størrelser på skjerm

h1:   28px / bold (700) / line-height 1.2    — skjermtitler
h2:   22px / semibold (600) / line-height 1.3 — seksjontitler
h3:   18px / semibold (600) / line-height 1.4 — korttitler
body: 16px / regular (400) / line-height 1.5  — standard tekst
small: 14px / regular (400) / line-height 1.4 — hjelpetekst
caption: 12px / medium (500) / line-height 1.3 — labels, timestamps
button: 16px / semibold (600) / line-height 1.0 — knapper

Temperatur-tall (spesiell):
  temp-large: 32px / bold / tabular-nums — temperaturvisning i logg
  temp-small: 18px / semibold / tabular-nums — temperatur i lister
```

Hvorfor Inter: Nøytral, profesjonell, utmerket lesbarhet i små størrelser,
God tall-lesbarhet (viktig for temperaturer), gratis via Google Fonts.

---

## 3. Spacing og Layout

```
Base unit:   4px
Scale:       4, 8, 12, 16, 20, 24, 32, 40, 48, 64

Border radius:
  sm:    8px  — inputs, pills, tags
  md:    12px — kort, knapper
  lg:    16px — modaler, store kort, bottom sheets
  xl:    24px — hero-elementer, compliance-badge
  full:  9999px — avatarer, status-dots

Shadows:
  sm:    0 1px 2px rgba(0,0,0,0.05)    — subtil elevation
  md:    0 4px 6px rgba(0,0,0,0.07)    — kort, floating elements
  lg:    0 10px 15px rgba(0,0,0,0.10)  — modaler, bottom sheets

Touch targets:
  Minimum: 48px (WCAG)
  Anbefalt: 56px for primærhandlinger
  Temperatur hurtiglogg: 64px (store knapper i kjøkken)

Bottom tab bar: 56px høyde + safe area
Status bar: Transparent, bruker system
```

---

## 4. Komponenter

### Base UI

```
Button:
  - primary (filled teal, hvit tekst) — "Lagre", "Start sjekkliste"
  - secondary (outlined teal) — "Avbryt", sekundære handlinger
  - ghost (transparent, teal tekst) — tertiære handlinger
  - danger (filled rød) — "Slett", "Meld avvik"
  - success (filled grønn) — "Godkjenn", "Lukk avvik"
  - sizes: sm (36px), md (48px), lg (56px)
  - Alle med haptic feedback på press

Input:
  - default, focused (teal border), error (rød border), disabled
  - NumericInput: Spesiell for temperatur — stor font, +/- knapper
  - SearchInput: Med ikon og clear-knapp
  - TextArea: For beskrivelser/kommentarer

Card:
  - default (hvit bg, border)
  - status-card (med venstre fargekant: grønn/gul/rød)
  - interactive (pressable, subtle scale)
  - summary-card (for dashboard KPI-er)

StatusBadge:
  - ok (grønn bg, hvit tekst)
  - warning (amber bg)
  - critical (rød bg)
  - pending (grå bg)
  - sizes: sm (pill), md (badge med ikon)

ProgressBar:
  - For sjekklister — viser X av Y fullført
  - Farge endres: grønn når ferdig, teal underveis
```

### Feature-spesifikke

```
TemperatureInput:
  - Stor tallinput (64px høyde)
  - +/- stepper-knapper på sidene
  - Umiddelbar fargefeedback: grønn (OK) / rød (avvik)
  - Enhetsindikator (°C)

ChecklistItem:
  - Tekst + stor OK (✓) / Avvik (✗) knapp-par
  - Ved avvik: ekspanderer til kommentar + foto
  - Animert strikethrough ved OK

DeviceCard:
  - Enhetsnavn, type-ikon (kjøl/frys), siste temp, status-dot
  - Pressable → åpner hurtiglogg

DeviationCard:
  - Kategori-tag, alvorlighet-badge, beskrivelse
  - Ansvarlig avatar, frist-dato
  - Status-indikator (åpen/under behandling/lukket)

ActivityFeedItem:
  - Avatar + navn, handling, tidspunkt
  - Ikon per type (temp, sjekkliste, avvik)

ComplianceScore:
  - Sirkulær progress-indikator (0-100%)
  - Trafikklys-farge basert på score
  - Animert ved oppdatering

QuickActionButton:
  - 64px sirkel med ikon + label under
  - For hjem-skjerm hurtigknapper
  - Subtle shadow, scale-animasjon
```

---

## 5. Animasjoner og Overganger

```
Page transitions:
  - Stack: slide-from-right, 250ms, ease-out
  - Modal: slide-from-bottom, 300ms, spring
  - Tab switch: crossfade, 150ms

Micro-interactions:
  - Button press: scale(0.97), 100ms, haptic light
  - Card press: scale(0.98), 100ms
  - Checkbox toggle: spring bounce, haptic medium
  - Temperature save: flash grønn/rød, 400ms
  - Avvik meld: shake + haptic heavy

Loading states:
  - Skeleton loaders for lister (enheter, sjekklister, aktivitetsfeed)
  - Spinner for lagring/synkronisering
  - Pull-to-refresh med teal-farget spinner

Success states:
  - Checkmark-animasjon ved lagring (Lottie eller Reanimated)
  - Subtle confetti ved 100% compliance-score

Status transitions:
  - Compliance-badge farge-morph (smooth transition mellom grønn/gul/rød)
  - Progress bar: animert fill, 300ms

Offline-indikator:
  - Subtil banner øverst: "Offline — synkroniserer når tilkoblet"
  - Pulserende sync-ikon ved reconnect
```

---

## 6. Ikoner

**Bibliotek: Lucide Icons** — clean, konsistent, profesjonelt.

```
Stroke width: 1.5px (standard Lucide)
Standard størrelse: 24px
Liten: 20px (i lister, badges)
Stor: 28px (tab bar, hurtigknapper)

Ikon-mapping:
  Hjem:          home / layout-dashboard
  Temperatur:    thermometer
  Sjekklister:   clipboard-check
  Avvik:         alert-triangle
  Oversikt:      bar-chart-3
  Lagre:         save / check
  Avbryt:        x
  Legg til:      plus
  Rediger:       pencil
  Slett:         trash-2
  Foto:          camera
  Varsler:       bell
  Bruker:        user
  Innstillinger: settings
  Kjøleskap:     refrigerator (custom SVG)
  Fryser:        snowflake
  Synk:          refresh-cw
  PDF:           file-text
  Klokke:        clock
  Sjekk OK:      check-circle
  Avvik:         x-circle
  Filter:        filter
  Søk:           search
```

Ingen generiske AI-ikoner. Ingen ikoner med boks/ramme rundt.

---

## 7. Inspirasjon

```
1. FoodDocs (fooddocs.com)
   Hva vi låner:
   - Trafikklys-system for compliance-oversikt (grønn/gul/rød)
   - Smart notifikasjoner med instruksjoner
   - Enkel dashboard med tydelig status
   Hva vi gjør bedre: Norsk, mobil-først, offline-støtte

2. Safe Food Pro (safefoodpro.com)
   Hva vi låner:
   - PIN-signering for enkelt brukerbytte
   - Bluetooth-termometer-konsept (v2)
   - Daglige forms med tydelig flow
   Hva vi gjør bedre: Enklere UI, raskere temperaturlogg

3. SafetyCulture / iAuditor (safetyculture.com)
   Hva vi låner:
   - Mobile-first inspection flow
   - Clean, uncluttered interface
   - Offline med synk
   Hva vi gjør bedre: Spesialisert for kjøkken/mat (ikke generisk inspeksjon)
```

---

## 8. UI-bibliotek Vurdering

| Bibliotek | Vurdering | Valg |
|-----------|-----------|------|
| NativeWind/Tailwind | Base styling — alltid | ✅ Bruk |
| React Native Paper | Material-ish, men for generisk | ❌ Skip |
| Tamagui | Overkill for denne appen | ❌ Skip |
| Gluestack | God tilgjengelighet, men ekstra kompleksitet | ❌ Skip |
| Custom components | Full kontroll over look & feel | ✅ Bruk |

**Beslutning:** NativeWind + custom komponenter. Appen har spesifikke behov
(temperaturinput, compliance-farger, sjekkliste-flow) som ikke passer standard-libs.

Tilleggspakker:
- `react-native-reanimated` — animasjoner
- `expo-haptics` — taktil feedback
- `expo-camera` — foto ved avvik
- `react-native-svg` — compliance-sirkel, grafer
- `@react-native-async-storage/async-storage` — offline cache
- `expo-notifications` — push-varsler

---

## 9. Nøkkelskjermer — Visuell Beskrivelse

### Hjem
- Øverst: Stor compliance-badge (sirkel, 80px) med score og farge
- Under: 3 hurtigknapper i rad (Temperatur, Sjekkliste, Meld avvik)
- Midt: "Kommende oppgaver" — liste med tid, type, status
- Nederst: Aktivitetsfeed — siste handlinger fra teamet

### Temperaturlogg
- Liste med DeviceCards (ikon, navn, siste temp, status-dot)
- Trykk → bottom sheet med stor NumericInput
- +/- knapper, umiddelbar fargefeedback
- "Lagre" → checkmark-animasjon → tilbake til liste
- Batch-modus: swipe-gjennom alle enheter sekvensielt

### Sjekkliste
- Header med navn og progressbar
- Liste med ChecklistItems (punkt + OK/Avvik knapper)
- Ved avvik: glir ned felt for kommentar + foto
- Nederst: "Fullfør og signer" knapp
- 100%: confetti + compliance oppdateres

### Avvik
- Filter-chips øverst (Alle, Åpne, Under behandling, Lukket)
- DeviationCards i liste
- FAB (floating action button) for "Nytt avvik"
- Avvik-detalj: Tidslinje med hendelser, kommentarer, statusendringer
