# ProgressCrawl 0.0.70e – Readiness Plan

This document defines the final preparation steps before starting work on 0.0.70e
(Resource Nodes, Entities, POIs, Locations).

Priority 0 (worldMap save/load bridge) is excluded and assumed completed.

---

## 1. Refactor Status

- Central state: PC.state
- Access via STATE() / EXP() / MOV()
- Single startup entrypoint (bootstrap.js)
- Zones lifecycle centralized
- All scripts explicitly loaded

Refactoring is complete enough to proceed.

---

## 2. Goal of 0.0.70e

Introduce static but interactive zone content:
- Resource Nodes
- Entities
- POIs
- Locations

Requirements:
- Deterministic generation
- Persistent state (deltas preferred)
- Modular separation (defs vs instances vs UI)
- Tile-by-tile reveal compatible

---

## 3. Script & Directory Architecture

### Existing (unchanged)
scripts/
  core/
  game/
  zones/
  worldmap/
  inventory/
  equipment/
  character/
  ui/

### New (additive)
scripts/content/
  content.defs.js
  content.spawnTables.js
  content.rng.js
  content.place.js

---

## 4. Content Data Model

### Zone
zone.content = {
  resourceNodes: [],
  entities: [],
  pois: [],
  locations: []
};

### Instance
{
  id,
  defId,
  x,
  y,
  state
}

### Tile Annotation
tile.content = {
  resourceNodeId,
  entityId,
  poiId,
  locationId
};

---

## 5. Deterministic Generation

Seed layering per zone:
- baseSeed
- seed_resources
- seed_entities
- seed_pois
- seed_locations

Utilities required:
- seedFromString
- makeRng
- pickWeighted
- shuffle

---

## 6. Persistence Strategy

Option A (recommended):
- deterministic regen
- save only deltas

Option B:
- save full zone snapshots

Decision required before implementation.

---

## 7. Content Lifecycle

Single hook:
initializeZoneContent(zone, def)

Called during:
- zone creation
- zone enter (apply deltas)

No ad-hoc spawning elsewhere.

---

## 8. Interaction Pipeline

Single entrypoint:
PC.api.zone.interactAt(x, y)

Routes to:
- harvest
- encounter
- inspect
- enter location

---

## 9. POIs vs Locations

POIs:
- single tile
- small interactions

Locations:
- named places
- marker tile only (0.0.70e)

---

## 10. Readiness Checklist

- Data contracts locked
- RNG utilities added
- Persistence strategy chosen
- Content scripts loaded before zones.core.js
- Interaction entrypoint defined

---

Status: READY FOR 0.0.70e
