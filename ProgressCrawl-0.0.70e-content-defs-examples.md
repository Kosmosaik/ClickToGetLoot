# ProgressCrawl 0.0.70e – Content Defs Design Examples

This file provides **example content definitions** for 0.0.70e to act as a reference for how to structure:
- Resource Nodes
- Entities
- POIs
- Locations
- Loot tables (minimal examples)
- Spawn tables (minimal examples)

These are **examples** meant to guide implementation in `scripts/content/content.defs.js`
and `scripts/content/content.spawnTables.js`.

---

## 1) Design Principles (for defs)

### Def vs Instance
- **Definition (Def):** describes *what* something is.
- **Instance:** describes *where it is* + *current state*.

### Keep instances small
Instance should generally store:
- `id`, `defId`, `x`, `y`
- `state` (harvested, charges, cooldown, hp, defeated, opened, etc.)

### Tags drive spawn eligibility
Use tags for:
- biome, era, difficulty
- “requires adjacency” (nearWater, nearWall, inClearing)
- collision rules (blocksMovement)

---

## 2) Shared Enums & Helpers (examples)

```js
// Example enums (could live in content.defs.js)
const CONTENT_KIND = {
  RESOURCE_NODE: "resourceNode",
  ENTITY: "entity",
  POI: "poi",
  LOCATION: "location",
};

const CONTENT_INTERACTION = {
  HARVEST: "harvest",
  ENCOUNTER: "encounter",
  OPEN: "open",
  INSPECT: "inspect",
  ENTER: "enter",
};
```

---

## 3) Loot Tables (minimal examples)

> Keep loot tables separate so nodes/entities/POIs can reference them by id.

```js
// Minimal example loot tables
const LOOT_TABLES = {
  lt_tree_basic: {
    rolls: 1,
    entries: [
      { itemId: "wood",  w: 70, qty: [1, 3] },
      { itemId: "sap",   w: 25, qty: [1, 2] },
      { itemId: "seed",  w: 5,  qty: [1, 1] },
    ],
  },

  lt_stone_basic: {
    rolls: 1,
    entries: [
      { itemId: "stone", w: 80, qty: [1, 4] },
      { itemId: "flint", w: 20, qty: [1, 2] },
    ],
  },

  lt_wolf_basic: {
    rolls: 1,
    entries: [
      { itemId: "meat_raw", w: 70, qty: [1, 2] },
      { itemId: "hide",     w: 30, qty: [1, 1] },
    ],
  },

  lt_stash_basic: {
    rolls: 2,
    entries: [
      { itemId: "coin",      w: 45, qty: [3, 15] },
      { itemId: "bandage",   w: 25, qty: [1, 2] },
      { itemId: "torch",     w: 20, qty: [1, 2] },
      { itemId: "rare_gem",  w: 10, qty: [1, 1] },
    ],
  },
};
```

---

## 4) Resource Node Defs (examples)

Resource Nodes are **static** interactables (harvestable).
They typically:
- appear on a tile
- have charges / cooldown / depleted state
- yield loot on harvest

```js
const RESOURCE_NODE_DEFS = {
  oak_tree: {
    id: "oak_tree",
    kind: "resourceNode",
    name: "Oak Tree",
    glyph: "T",
    tags: { biomes: ["forest"], eras: ["era0"], difficulty: ["easy","normal"] },
    placement: {
      allowedTileKinds: ["floor"],
      requireExploredToShow: true,
      near: null, // e.g. { kind: "water", dist: 2 }
    },
    interaction: {
      type: "harvest",
      lootTableId: "lt_tree_basic",
      cooldownTurns: 0, // 0 for one-time harvest (deplete)
      charges: 1,
      tools: null, // e.g. { toolTag: "axe", minTier: 0 }
    },
    stateDefaults: {
      depleted: false,
      chargesLeft: 1,
    },
    blocksMovement: false,
  },

  stone_cluster: {
    id: "stone_cluster",
    kind: "resourceNode",
    name: "Stone Cluster",
    glyph: "⛰",
    tags: { biomes: ["forest","plains","mountain"], eras: ["era0"], difficulty: ["easy","normal"] },
    placement: { allowedTileKinds: ["floor"] },
    interaction: {
      type: "harvest",
      lootTableId: "lt_stone_basic",
      charges: 2,
      tools: { toolTag: "pickaxe", minTier: 0 },
    },
    stateDefaults: { depleted: false, chargesLeft: 2 },
    blocksMovement: false,
  },

  herb_patch: {
    id: "herb_patch",
    kind: "resourceNode",
    name: "Herb Patch",
    glyph: "✿",
    tags: { biomes: ["forest","plains"], eras: ["era0"], difficulty: ["easy","normal"] },
    placement: { allowedTileKinds: ["floor"], near: { kind: "water", dist: 3 } },
    interaction: {
      type: "harvest",
      lootTableId: "lt_herb_basic",
      charges: 1,
      tools: null,
    },
    stateDefaults: { depleted: false, chargesLeft: 1 },
    blocksMovement: false,
  },
};
```

> Note: `lt_herb_basic` is referenced above; define it when you add herb items.

---

## 5) Entity Defs (examples)

Entities are **encounters** (or placeholders in 0.0.70e).
They can:
- block tiles (optional)
- have HP (future)
- yield loot on defeat
- potentially roam later (events system)

```js
const ENTITY_DEFS = {
  rabbit: {
    id: "rabbit",
    kind: "entity",
    name: "Rabbit",
    glyph: "r",
    tags: { biomes: ["forest","plains"], eras: ["era0"], difficulty: ["easy"] },
    placement: { allowedTileKinds: ["floor"], avoidNear: ["playerSpawn"] },
    encounter: {
      type: "encounter",
      // 0.0.70e placeholder resolution (no combat yet)
      resolution: "auto",
      lootTableId: "lt_rabbit_basic",
    },
    blocksMovement: false,
    stateDefaults: { defeated: false },
  },

  wolf: {
    id: "wolf",
    kind: "entity",
    name: "Wolf",
    glyph: "W",
    tags: { biomes: ["forest"], eras: ["era0"], difficulty: ["normal","hard"] },
    placement: { allowedTileKinds: ["floor"], avoidNear: ["playerSpawn"] },
    encounter: {
      type: "encounter",
      resolution: "auto",
      lootTableId: "lt_wolf_basic",
    },
    blocksMovement: true, // decide now if entities can block
    stateDefaults: { defeated: false },
  },
};
```

---

## 6) POI Defs (examples)

POIs are single-tile interactables:
- stash
- trap
- shrine
- puzzle marker

```js
const POI_DEFS = {
  stash_small: {
    id: "stash_small",
    kind: "poi",
    name: "Small Stash",
    glyph: "□",
    tags: { biomes: ["forest","plains","mountain"], eras: ["era0"], difficulty: ["easy","normal"] },
    placement: { allowedTileKinds: ["floor"], avoidNear: ["playerSpawn"] },
    interaction: {
      type: "open",
      lootTableId: "lt_stash_basic",
      once: true,
    },
    stateDefaults: { opened: false },
    blocksMovement: false,
  },

  trap_snare: {
    id: "trap_snare",
    kind: "poi",
    name: "Snare Trap",
    glyph: "⚠",
    tags: { biomes: ["forest","plains"], eras: ["era0"], difficulty: ["normal","hard"] },
    placement: { allowedTileKinds: ["floor"], avoidNear: ["playerSpawn"] },
    interaction: {
      type: "inspect",
      // future: disarm/minigame
      once: true,
    },
    stateDefaults: { triggered: false, disarmed: false },
    blocksMovement: false,
  },
};
```

---

## 7) Location Defs (examples)

Locations are named “places” in a zone.
For 0.0.70e, keep them as **marker tiles**.

```js
const LOCATION_DEFS = {
  cave_entrance: {
    id: "cave_entrance",
    kind: "location",
    name: "Cave Entrance",
    glyph: "⌂",
    tags: { biomes: ["mountain","forest"], eras: ["era0"], difficulty: ["normal","hard"] },
    placement: {
      allowedTileKinds: ["floor"],
      near: { kind: "wall", dist: 1 }, // cave by a wall edge
    },
    interaction: {
      type: "enter",
      // for now just a UI message; later routes to sub-zone
      action: "enterLocation",
      once: false,
    },
    stateDefaults: { discovered: false },
    blocksMovement: false,
  },

  ruined_clearing: {
    id: "ruined_clearing",
    kind: "location",
    name: "Ruined Clearing",
    glyph: "¤",
    tags: { biomes: ["forest"], eras: ["era0"], difficulty: ["easy","normal"] },
    placement: { allowedTileKinds: ["floor"], requireOpenArea: true },
    interaction: { type: "inspect", once: false },
    stateDefaults: { discovered: false },
    blocksMovement: false,
  },
};
```

---

## 8) Spawn Tables (minimal examples)

Spawn tables translate zone context → actual instances.
Keep them separate from defs.

```js
const SPAWN_TABLES = {
  resourceNodes: {
    forest: {
      era0: {
        easy: {
          countRange: [8, 14],
          entries: [
            { defId: "oak_tree",      w: 60 },
            { defId: "stone_cluster", w: 25 },
            { defId: "herb_patch",    w: 15 },
          ],
        },
      },
    },
  },

  entities: {
    forest: {
      era0: {
        easy: {
          countRange: [1, 3],
          entries: [
            { defId: "rabbit", w: 70 },
            { defId: "wolf",   w: 30 },
          ],
        },
      },
    },
  },

  pois: {
    forest: {
      era0: {
        easy: {
          countRange: [1, 2],
          entries: [
            { defId: "stash_small", w: 75 },
            { defId: "trap_snare",  w: 25 },
          ],
        },
      },
    },
  },

  locations: {
    forest: {
      era0: {
        easy: {
          countRange: [0, 1],
          entries: [
            { defId: "ruined_clearing", w: 70 },
            { defId: "cave_entrance",   w: 30 },
          ],
        },
      },
    },
  },
};
```

---

## 9) Placement Rule Notes (examples)

When placing instances, you’ll usually want:

- Only place on walkable tiles
- Only place on tiles that are reachable (optional)
- Avoid player spawn radius (e.g. dist >= 3)
- Some content requires adjacency constraints:
  - near water
  - near wall
  - in open areas (low wall density)
- Enforce collision rules:
  - if entity blocks movement, no other blocking content on that tile

---

## 10) Example Instance Records (what `content.place.js` produces)

```js
// Example resource node instance
{
  id: "rn_0001",
  defId: "oak_tree",
  x: 12,
  y: 6,
  state: { depleted: false, chargesLeft: 1 }
}

// Example entity instance
{
  id: "e_0001",
  defId: "wolf",
  x: 18,
  y: 10,
  state: { defeated: false }
}

// Example POI instance
{
  id: "poi_0001",
  defId: "stash_small",
  x: 9,
  y: 3,
  state: { opened: false }
}
```

---

## 11) Recommended “Minimum Viable Defs” List (0.0.70e)

### Resource Nodes
- oak_tree
- stone_cluster
- fallen_branches
- herb_patch

### Entities
- rabbit
- wolf
- boar (optional)

### POIs
- stash_small
- trap_snare
- shrine_simple (inspect only)

### Locations
- ruined_clearing
- cave_entrance

---

## 12) Next Step (implementation mapping)

- `content.defs.js` → implement the defs structures shown here
- `content.spawnTables.js` → implement SPAWN_TABLES structure shown here
- `content.rng.js` → deterministic RNG + weighted picking
- `content.place.js` → placement using zone tiles, constraints, and seed-derived RNG
- `zones.core.js` → call into content placement via `initializeZoneContent(zone, def)`

---

End.
