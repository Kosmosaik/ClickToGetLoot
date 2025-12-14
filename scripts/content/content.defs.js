// scripts/content/content.defs.js
// 0.0.70e — Central content definitions (data-first).
//
// This file is intentionally lightweight scaffolding.
// We will progressively fill these registries with:
// - resource nodes
// - entities
// - POIs
// - locations
//
// IMPORTANT: Keep this file pure data/registries. No placement logic.

(function () {
  const PC = (window.PC = window.PC || {});
  PC.content = PC.content || {};

  // Canonical registries (id -> definition)
  PC.content.DEFS = PC.content.DEFS || {
    resourceNodes: {},
    entities: {},
    pois: {},
    locations: {},
  };

  // Optional: small helper for consistent definition registration.
  // We keep this tiny so content files can be data-only.
  PC.content.register = PC.content.register || function register(kind, def) {
    if (!kind || !def || !def.id) return;
    if (!PC.content.DEFS[kind]) PC.content.DEFS[kind] = {};
    PC.content.DEFS[kind][def.id] = def;
  };

  // ---------------------------------------------------------------------------
  // 0.0.70e — First pass example defs (enough to test deterministic placement)
  //
  // These are intentionally simple and will be expanded over 0.0.70e.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Step 2.4 — Normalized tag vocabulary (first pass)
  //
  // Use:
  //   tags: { eras:[], biomes:[], difficulty:[] }
  //
  // Notes:
  // - difficulty is a numeric range or explicit list (we use list for now)
  // - keep tags optional; spawn tables are the authoritative “what spawns where”
  // ---------------------------------------------------------------------------

  // Resource Nodes
  PC.content.register("resourceNodes", {
    id: "oak_tree",
    kind: "resourceNode",
    name: "Oak Tree",
    glyph: "T",
    tags: { eras: ["primitive"], biomes: ["temperate_forest"], difficulty: [1, 2, 3] },
    stateDefaults: { depleted: false, chargesLeft: 1 },
    blocksMovement: false,
    lootTableId: "tree_basic",
  });

  PC.content.register("resourceNodes", {
    id: "stone_cluster",
    kind: "resourceNode",
    name: "Stone Cluster",
    glyph: "⛰",
    tags: { eras: ["primitive"], biomes: ["temperate_forest"], difficulty: [1, 2, 3] },
    stateDefaults: { depleted: false, chargesLeft: 2 },
    blocksMovement: false,
    lootTableId: "stone_basic",
  });

  PC.content.register("resourceNodes", {
    id: "fallen_branches",
    kind: "resourceNode",
    name: "Fallen Branches",
    glyph: "≡",
    tags: { eras: ["primitive"], biomes: ["temperate_forest"], difficulty: [1, 2] },
    stateDefaults: { depleted: false, chargesLeft: 1 },
    blocksMovement: false,
    lootTableId: "branches_basic",
  });

  // Optional in roadmap, but we include it as a low-impact example.
  PC.content.register("resourceNodes", {
    id: "herb_patch",
    kind: "resourceNode",
    name: "Herb Patch",
    glyph: "✿",
    tags: { eras: ["primitive"], biomes: ["temperate_forest"], difficulty: [1, 2] },
    stateDefaults: { depleted: false, chargesLeft: 1 },
    blocksMovement: false,
    lootTableId: "herb_basic",
  });

  // Entities (encounters later; for now: just a placed marker)
  PC.content.register("entities", {
    id: "rabbit",
    kind: "entity",
    name: "Rabbit",
    glyph: "r",
    tags: { eras: ["primitive"], biomes: ["temperate_forest"], difficulty: [1] },
    stateDefaults: { defeated: false },
    blocksMovement: false,
    lootTableId: "rabbit_basic",
  });

  PC.content.register("entities", {
    id: "wolf",
    kind: "entity",
    name: "Wolf",
    glyph: "w",
    tags: { eras: ["primitive"], biomes: ["temperate_forest"], difficulty: [2, 3] },
    stateDefaults: { defeated: false },
    // For 0.0.70e, entities do not block movement by default (Phase 4 decides).
    blocksMovement: false,
    lootTableId: "wolf_basic",
  });

  // POIs
  PC.content.register("pois", {
    id: "stash_small",
    kind: "poi",
    name: "Small Stash",
    glyph: "§",
    tags: { eras: ["primitive"], biomes: ["temperate_forest"], difficulty: [1, 2] },
    stateDefaults: { opened: false },
    blocksMovement: false,
    lootTableId: "stash_small",
  });

  PC.content.register("pois", {
    id: "trap_snare",
    kind: "poi",
    name: "Snare Trap",
    glyph: "^",
    tags: { eras: ["primitive"], biomes: ["temperate_forest"], difficulty: [1, 2] },
    // Inspect-only for now; later can be armed/disarmed, etc.
    stateDefaults: { inspected: false, triggered: false },
    blocksMovement: false,
    lootTableId: null,
  });

  // Locations (bigger landmarks; still tile-anchored for now)
  PC.content.register("locations", {
    id: "ruined_clearing",
    kind: "location",
    name: "Ruined Clearing",
    glyph: "○",
    tags: { eras: ["primitive"], biomes: ["temperate_forest"], difficulty: [1, 2, 3] },
    stateDefaults: { discovered: false },
    blocksMovement: false,
  });

  PC.content.register("locations", {
    id: "cave_entrance",
    kind: "location",
    name: "Cave Entrance",
    glyph: "◉",
    tags: { eras: ["primitive"], biomes: ["temperate_forest", "plains"], difficulty: [2, 3] },
    stateDefaults: { discovered: false },
    blocksMovement: false,
  });
})();
