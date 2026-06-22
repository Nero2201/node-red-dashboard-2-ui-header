# node-red-dashboard-2-ui-header

A header node for **FlowFuse Dashboard 2.0**. It behaves like a small
group whose elements (text, buttons, dropdowns) are rendered **in the header next to the
page title** — on **every** page of the dashboard.

## How It Works (Brief)

- The node is **ui-base-scoped** (no Group/Page) → the Baseline layout
  renders it globally on all pages.
- Content is mounted via Vue **Teleport** into fixed app bar targets:
  - `#app-bar-title` → left, directly next to the page title (`Position: Left`)
  - `#app-bar-actions` → right in the app bar (`Position: Right`)
- Items are configured **directly in the node** (core widgets cannot be nested in a foreign group).

## Item Types

| Type | Behavior |
|------|----------|
| Text | Static text, or *Dynamic* → displays the latest `msg.payload` |
| Button | Sends `{ payload, topic }` into the flow on click |
| Dropdown | Sends `{ payload: value, topic }` on selection. Options: `value=Label` (one per line) |

## Installation (Local Development)

```bash
# in the plugin directory
npm install
npm run build      # generates resources/ui-header.umd.js

# install into Node-RED user directory
cd ~/.node-red
npm install /Users/ben/Coding_root/nodered/ui-header
```

Then restart Node-RED. After changes to the `/ui` directory, run
`npm run build` again.

## Usage

1. Drag the `ui header` node from the palette.
2. Select the dashboard (ui-base) and position.
3. Add items (Text/Button/Dropdown).
4. Deploy → content appears in the header.
5. Buttons/dropdowns emit `msg` objects; messages sent to the node's input
   update *Dynamic* text items.
