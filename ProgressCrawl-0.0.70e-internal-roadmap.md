# ProgressCrawl 0.0.70e – Internal Technical Roadmap (Step-by-Step)

This roadmap is an **internal, technical**, and **small-step** plan for implementing 0.0.70e:
- Resource Nodes
- Entities
- POIs
- Locations (marker-only, expandable later)

It assumes the refactor closeout is complete:
- `PC.state` is the source of truth
- `STATE()/EXP()/MOV()` exist
- worldMap persistence (Prio 0) is done
- `initializeZoneContent(zone, def)` exists as the intended hook point

---

## Guiding Rules (Non-Negotiable)

1) **No new globals** for state. Use `PC.state` via `STATE()/EXP()/MOV()` only.  
2) **No refactor structure** unless explicitly approved. Additive only.  
3) **No duplicated state access helpers** (do not create a second STATE/EXP/MOV).  
4) **One content lifecycle hook**: zone content is generated only by `initializeZoneContent`.  
5) **UI does not own logic**. UI calls a single interaction entrypoint.  
6) **Determinism first**: content generation must be seed-based from day one.

---

## Deliverables for 0.0.70e

- `scripts/content/` folder added with definitions + RNG + placement logic
- Zones generate and display:
  - Resource nodes (harvestable)
  - Entities (encounter placeholder)
  - POIs (open/inspect)
  - Locations (marker tiles)
- Minimal interactions that:
  - modify instance state
  - produce loot (if applicable)
  - persist via deltas
- Persistence:
  - deterministic regeneration + delta application (recommended)
- Basic debug visibility (optional but helpful)

---

## Phase 0 – Scaffolding & Contracts (No Gameplay Yet)

### Step 0.1 — Create folder + placeholder scripts
- Add folder: `scripts/content/`
- Add empty scripts:
  - `content.defs.js`
  - `content.spawnTables.js`
  - `content.rng.js`
  - `content.place.js`

### Step 0.2 — Add scripts to `index.html` (load order)
- Load content scripts **before** `zones.core.js`
- Verify boot still works (no references yet)

### Step 0.3 — Lock the in-memory schema
- Confirm these exist (or add minimal defaults):
  - `zone.content = { resourceNodes:[], entities:[], pois:[], locations:[] }`
  - optional: `tile.content = { resourceNodeId:null, entityId:null, poiId:null, locationId:null }`
- Document the schema in `docs/` (small internal note)

### Step 0.4 — Decide persistence strategy
Pick one (recommended):
- **A: deterministic generation + deltas** stored per world tile/zoneId  
or
- **B: full snapshot per zone**

This roadmap assumes **Option A** (deltas).

---

## Phase 1 – Deterministic RNG Utilities

### Step 1.1 — Implement seed helpers (in `content.rng.js`)
- `seedFromString(str)` (hash to uint32)
- `makeRng(seed)` (xorshift/mulberry)
- `rng.nextFloat()`, `rng.nextInt(min,max)`

### Step 1.2 — Implement selection helpers
- `shuffle(rng, arr)`
- `pickWeighted(rng, entries)` where entry has `{w, ...}`
- `pickManyUnique(rng, source, n)` (optional)

### Step 1.3 — Define seed layering contract
- Establish:
  - `zoneSeed` (string or number)
  - derive:
    - `seed_resources`
    - `seed_entities`
    - `seed_pois`
    - `seed_locations`
- Decide source for `zoneSeed`:
  - zone definition field, or
  - world tile metadata (recommended)

---

## Phase 2 – Content Definitions (Defs Only)

### Step 2.1 — Add minimal def registries (`content.defs.js`)
- `RESOURCE_NODE_DEFS`
- `ENTITY_DEFS`
- `POI_DEFS`
- `LOCATION_DEFS`

### Step 2.2 — Add minimal loot tables (internal)
- Create:
  - `LOOT_TABLES` or integrate with existing loot module
- Define a tiny set for tests:
  - tree → wood/sap
  - stone → stone/flint
  - stash → coin/bandage
  - wolf → meat/hide

### Step 2.3 — Define “minimum viable set” of content
Resource nodes:
- `oak_tree`
- `stone_cluster`
- `fallen_branches`
- `herb_patch` (optional)

Entities:
- `rabbit`
- `wolf`

POIs:
- `stash_small`
- `trap_snare` (inspect only)

Locations:
- `ruined_clearing`
- `cave_entrance`

### Step 2.4 — Normalize tag vocabulary (biome/era/difficulty)
- Create a consistent tags structure:
  - `biomes`, `eras`, `difficulty`
- Confirm current zone definitions expose these fields, or derive them.

---

## Phase 3 – Spawn Tables (What spawns where)

### Step 3.1 — Create SPAWN_TABLES (`content.spawnTables.js`)
- Structure keyed by:
  - biome → era → difficulty
- For each content type:
  - `countRange: [min,max]`
  - `entries: [{defId,w}, ...]`

### Step 3.2 — Add config hooks for zone templates (optional)
- If zone definitions have `templateId` or tags, optionally allow:
  - template modifier tables
- Keep simple for first pass.

### Step 3.3 — Add “spawn constraints” vocabulary
- Allowed tile kinds
- avoid near player spawn
- near water / near wall
- open areas (low wall density)

Document these constraints in comments for later expansion.

---

## Phase 4 – Placement Engine (Create instances)

### Step 4.1 — Add a tile query utility in `content.place.js`
- Build lists of candidate tiles:
  - walkable
  - not wall
  - not blocked
- Add optional constraints:
  - min distance from entry spawn

### Step 4.2 — Implement placement for resource nodes
- Inputs:
  - zone tiles
  - derived RNG
  - spawn table
- Output:
  - append instances to `zone.content.resourceNodes`
  - set tile pointers if using `tile.content`

### Step 4.3 — Implement placement for POIs
- Same pattern as nodes
- Ensure “once” state exists in instance defaults

### Step 4.4 — Implement placement for entities
- Decide blocking behavior:
  - simplest: entities do **not** block movement in 0.0.70e
  - or: wolves block; rabbits don’t
- Enforce collision rules:
  - only one “blocking” content per tile

### Step 4.5 — Implement placement for locations
- Marker-only placement
- Prefer edges/walls for caves (optional)
- Prefer open areas for clearings (optional)

### Step 4.6 — Add debug hooks (optional)
- `window.debugZoneContent()` prints placed instances

---

## Phase 5 – Wire Into Zone Lifecycle

### Step 5.1 — Implement/extend `initializeZoneContent(zone, def)` in `zones.core.js`
- Derive seeds
- Fetch appropriate spawn tables based on zone context
- Call placement functions:
  - `placeResourceNodes(...)`
  - `placeEntities(...)`
  - `placePois(...)`
  - `placeLocations(...)`

### Step 5.2 — Ensure content is created once per zone instance
- Do not re-run on every render
- Content should be created at zone creation time

### Step 5.3 — Apply deltas on zone enter (Option A)
- When entering a zone:
  - fetch saved deltas for that zoneId
  - mark instances as harvested/defeated/opened
  - or remove instances from lists
- Store deltas under:
  - world tile metadata keyed by zoneId, or
  - a separate `PC.state.zoneDeltas` map

Keep deltas tiny.

---

## Phase 6 – UI Rendering (Visible on explored tiles)

### Step 6.1 — Add tile-level rendering markers in `zones.ui.js`
- Only show markers on explored tiles
- Priorities (example):
  - entity > POI > node > location

### Step 6.2 — Add tooltips
- Tooltip content comes from defs + instance state
- Keep minimal: name + “(harvested)” / “(opened)” / etc.

### Step 6.3 — Add click routing
- Clicking a tile calls:
  - `PC.api.zone.interactAt(x,y)` (new)
- UI does not decide interaction type; it just routes.

---

## Phase 7 – Interactions (Minimal Gameplay)

### Step 7.1 — Implement interaction router
- Determine tile content in order of priority
- Call the corresponding handler

### Step 7.2 — Resource node harvest
- On harvest:
  - roll loot table
  - add items to inventory
  - set instance state (depleted / chargesLeft)
  - persist delta
  - re-render zone UI

### Step 7.3 — POI open/inspect
- Open stash:
  - roll loot
  - mark opened
  - persist delta
- Trap (inspect only for now):
  - show message
  - optionally mark discovered

### Step 7.4 — Entity encounter placeholder
- For 0.0.70e:
  - auto-resolve encounter:
    - “Defeated” + loot
  - mark defeated
  - persist delta
- Later patches can replace this with combat/events.

### Step 7.5 — Location inspect/enter placeholder
- Marker-only interaction:
  - show message/panel stub
  - mark discovered
  - persist delta

---

## Phase 8 – Persistence & Autosave

### Step 8.1 — Define delta storage format
Example per zoneId:
```
{
  harvested: { rn_0001: true, rn_0002: true },
  defeated: { e_0004: true },
  opened: { poi_0003: true },
  discoveredLocations: { loc_0001: true }
}
```

### Step 8.2 — Write delta on interaction
- Update delta structure for the current zoneId
- Trigger `saveCurrentGame()` after each interaction

### Step 8.3 — Apply delta on load
- Ensure after loading a save:
  - entering zones applies deltas consistently
  - world map remains authoritative

---

## Phase 9 – QA Checklist (Tight, Practical)

### Step 9.1 — Determinism tests
- Same zoneId + same seed → same content placement
- Different seed → different placement

### Step 9.2 — Save/Load tests
- Harvest node → save → reload → node remains harvested
- Open stash → save → reload → stash remains opened
- Defeat entity → save → reload → entity remains defeated
- Enter zones and check VISITED state persists

### Step 9.3 — UI correctness
- Content markers only appear on explored tiles
- Tooltips show correct state labels
- Click interactions do not fire on unexplored tiles (if that rule is desired)

---

## Phase 10 – “Done” Criteria for 0.0.70e

0.0.70e is complete when:

- Zones spawn deterministic content using spawn tables
- Content is rendered and interactable
- Interactions grant loot and update state
- State persists correctly across save/load
- No new global state patterns were introduced

---

## Optional Stretch Goals (Only if time/energy)

- Better placement constraints (near water/walls/open areas)
- Content density scaling by difficulty
- Debug overlay toggle (show all content regardless of explored)
- First pass at “entity roaming” as an event (still deterministic)

---

End.
