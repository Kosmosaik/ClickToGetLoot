# ProgressCrawl – Refactoring Patch Notes  
## Version: 0.0.70d → 0.0.70e (Pre-Content Refactor Closeout)

These patch notes cover **structural, architectural, and stability refactors**
completed prior to starting **0.0.70e (Resources, Entities, POIs)**.

This update does **not** add new gameplay content.
Its purpose is to stabilize the codebase and prevent future refactor debt.

---

## 🧠 Core Architecture

### Centralized Game State
- Introduced **single source of truth** via `PC.state`
- Removed scattered globals and implicit state ownership
- Added authoritative access helpers:
  - `STATE()`
  - `EXP()`
  - `MOV()`

### Stable Public API Layer
- Formalized `PC.api` as the only supported interaction surface
- Prevented accidental overwrites of `PC.api`
- Added explicit action routing:
  - Zone entry
  - Exploration control
  - World map navigation

---

## 🔄 Save / Load System

### World Map Persistence (Prio 0)
- Fixed world map ownership to live exclusively in `PC.state`
- Eliminated implicit global `worldMap` mutations
- World map progress now persists correctly:
  - Visited zones
  - Current position
  - Fog state

### Backward-Compatible Healing
- Added validation + fallback logic for older or malformed saves
- Automatically regenerates missing world maps on load
- Prevents corrupted saves from breaking progression

---

## 🗺️ World Map & Zones

### Deterministic Zone Lifecycle
- Unified world → zone entry flow
- Zone creation, entry spawn, and fog updates centralized
- Zone exploration state no longer desyncs on reload

### Reliable Progress Saving
- World map progress is now saved **at the moment it changes**
- Entering a zone immediately persists VISITED state
- Exploration completion continues to trigger autosaves

---

## 🎮 Game Bootstrap & Load Order

### Single Startup Entry Point
- Removed startup logic from scattered modules
- `bootstrap.js` is now the sole initialization authority

### Dependency Validation
- Added boot-time sanity checks for required functions
- Missing scripts now fail loudly with clear errors

---

## 🧩 Modularization Improvements

### Script Ownership Cleanup
- UI modules resolve their own DOM references
- Removed cross-file variable dependencies
- Each system now owns its own initialization logic

### Refactor Artifacts Removed
- Eliminated broken helper duplicates and typo-based accessors
- Normalized all state reads/writes through official helpers

---

## 🧪 Developer Tooling

### Debug Helpers
- Added stable debug accessors:
  - `debugWorldMap()`
  - `debugZoneState()`
  - `debugCharacterComputed()`

These helpers reflect **actual runtime state**, not cached copies.

---

## 📦 Internal Structure Status

### Refactor State: **CLOSED**
- No further structural refactoring required before content work
- Architecture is stable enough for additive development

### Next Target
➡ **0.0.70e – Zone Content**
- Resource Nodes
- Entities
- POIs
- Locations

All future work will build on the contracts established here.

---

_End of refactoring patch notes._
