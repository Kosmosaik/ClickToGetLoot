
# ProgressCrawl — 0.0.70d Refactor Summary & Handoff Guide

This document is an authoritative project handoff for the next GPT assistant.
It explains what was refactored, why, how the architecture is structured now,
and strict rules to follow to avoid breaking the project again.

---

## 1. Refactor Goal

- Centralize runtime state
- Remove scattered globals
- Separate state, logic, and UI
- Prepare safely for 0.0.70e (resources, entities, POIs)

This was an incremental refactor, not a rewrite.

---

## 2. PC Namespace

PC = ProgressCrawl.
PC is the only global namespace.

---

## 3. Authoritative State — pc.core.js

Defines state ONLY.

```
scripts/core/pc.core.js
```

- currentHP
- characterComputed
- currentZone / isInZone
- worldMap
- exploration timers/state
- movement timers/state

No logic. No UI.

---

## 4. State Access API — pc.api.js

```
scripts/core/pc.api.js
```

Provides the ONLY legal access to state:

- PC.api.exp()
- PC.api.mov()
- PC.api.zone()
- PC.api.worldMap()

No feature file should touch PC.state directly.

---

## 5. game.js Responsibility

- Game flow
- Zone entry / exit
- Save/load hooks
- Screen transitions

Removed:
- Exploration logic
- Movement logic
- UI guards

---

## 6. Zones Architecture

zones.core.js  
- Zone creation & normalization

zones.exploration.js (NEW)  
- Auto + manual exploration logic

zones.movement.js (NEW)  
- Tile movement and path execution

zones.ui.js  
- UI only (buttons, guards, rendering calls)

---

## 7. World Map

worldmap.core.js  
- Data & adjacency rules

worldmap.ui.js  
- Rendering & interaction

---

## 8. Script Load Order (Critical)

1. config.js
2. pc.core.js
3. pc.api.js
4. core systems
5. zones.data / generator
6. worldmap.core → ui
7. zones.core → exploration → movement → ui
8. game.creation.js
9. game.js
10. bootstrap.js

---

## 9. What Was Removed

- Duplicate globals
- Exploration timers in game.js
- Movement logic in UI
- Direct state mutation across scripts

No gameplay content was removed.

---

## 10. Rules for Next GPT Assistant

- NEVER guess file contents
- Work on ONE file at a time
- Never duplicate state access
- Never refactor structure without approval
- Always provide full replacement blocks
- Summarize changes before continuing

---

## 11. Rules for the User

Use phrases like:

- "Work only on this file"
- "Do not assume structure"
- "Ask me to paste code if missing"
- "No refactor unless approved"

---

## 12. Current Status

- Game stable
- Exploration working
- World map working
- Refactor complete

Next step: 0.0.70e content.

---
