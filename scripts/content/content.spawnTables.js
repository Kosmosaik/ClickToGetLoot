// scripts/content/content.spawnTables.js
// 0.0.70e — Spawn table scaffolding.
//
// Spawn tables describe *what* can appear in a zone, by context:
// era / biome / difficulty / templateId (later).
//
// This file is only the container + conventions. The actual tables
// will be populated step-by-step during 0.0.70e.

(function () {
  const PC = (window.PC = window.PC || {});
  PC.content = PC.content || {};

  // NOTE: Keep tables data-only.
  // Structure (first pass):
  // PC.content.SPAWN_TABLES = {
  //   "tutorial_forest": {
  //     resourceNodes: [{ id: "tree_oak", weight: 60 }, ...],
  //     entities: [{ id: "critter_rabbit", weight: 30 }, ...],
  //     pois: [{ id: "stash_small", weight: 10 }, ...],
  //     locations: [{ id: "clearing", weight: 20 }, ...],
  //   }
  // }
  PC.content.SPAWN_TABLES = PC.content.SPAWN_TABLES || {};

  // ---------------------------------------------------------------------------
  // 0.0.70e — First pass spawn tables
  //
  // Each table describes counts + weighted entries per content kind.
  // The keys are currently:
  // - worldTile.templateId (preferred), e.g. "primitive_forest_easy"
  // - or zone.id for handcrafted exceptions, e.g. "tutorial_zone"
  //
  // Shape per kind:
  //   { count: number | [min,max], entries: [{ id, weight }, ...] }
  // ---------------------------------------------------------------------------

  // Main early-game template.
  PC.content.SPAWN_TABLES.primitive_forest_easy = {
    resourceNodes: {
      count: [14, 22],
      entries: [
        { id: "oak_tree", weight: 70 },
        { id: "stone_cluster", weight: 30 },
      ],
    },
    entities: {
      count: [2, 5],
      entries: [
        { id: "rabbit", weight: 100 },
      ],
    },
    pois: {
      count: [1, 2],
      entries: [
        { id: "stash_small", weight: 100 },
      ],
    },
    locations: {
      count: 1,
      entries: [
        { id: "ruined_clearing", weight: 100 },
      ],
    },
  };

  // Tutorial zone (small static map) — keep the counts tiny.
  PC.content.SPAWN_TABLES.tutorial_zone = {
    resourceNodes: {
      count: [2, 4],
      entries: [
        { id: "oak_tree", weight: 70 },
        { id: "stone_cluster", weight: 30 },
      ],
    },
    entities: {
      count: 1,
      entries: [
        { id: "rabbit", weight: 100 },
      ],
    },
    pois: {
      count: 1,
      entries: [
        { id: "stash_small", weight: 100 },
      ],
    },
    locations: {
      count: 0,
      entries: [],
    },
  };
})();
