# node-red-dashboard-2-ui-header

Eine Header-Node für **FlowFuse Dashboard 2.0**. Sie verhält sich wie eine kleine
Gruppe, deren Elemente (Text, Buttons, Dropdowns) **im Header neben dem
Seitentitel** gerendert werden – auf **jeder** Seite des Dashboards.

## Funktionsweise (kurz)

- Die Node ist **ui-base-scoped** (keine Group/Page) → das Baseline-Layout
  rendert sie global auf allen Seiten.
- Der Inhalt wird per Vue-**Teleport** in feste App-Bar-Ziele gemountet:
  - `#app-bar-title` → links, direkt neben dem Seitentitel (`Position: Left`)
  - `#app-bar-actions` → rechts in der App-Bar (`Position: Right`)
- Items werden **in der Node selbst** konfiguriert (Core-Widgets lassen sich
  nicht in eine Fremd-Group einhängen).

## Item-Typen

| Typ | Verhalten |
|-----|-----------|
| Text | Statischer Text, oder *Dynamic* → zeigt das letzte `msg.payload` |
| Button | Sendet beim Klick `{ payload, topic }` in den Flow |
| Dropdown | Sendet bei Auswahl `{ payload: value, topic }`. Optionen: `value=Label` (pro Zeile) |

## Installation (lokale Entwicklung)

```bash
# im Plugin-Ordner
npm install
npm run build      # erzeugt resources/ui-header.umd.js

# ins Node-RED user dir installieren
cd ~/.node-red
npm install /Users/ben/Coding_root/nodered/ui-header
```

Danach Node-RED neu starten. Nach Änderungen im `/ui`-Ordner jeweils erneut
`npm run build` ausführen.

## Nutzung

1. `ui header` Node aus der Palette ziehen.
2. Dashboard (ui-base) und Position wählen.
3. Items hinzufügen (Text/Button/Dropdown).
4. Deploy → Inhalt erscheint im Header.
5. Button/Dropdown geben `msg` aus; an den Eingang gesendete `msg` aktualisieren
   *Dynamic*-Text-Items.
