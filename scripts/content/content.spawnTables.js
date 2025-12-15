// scripts/content/content.spawnTables.js
// 0.0.70e — Spawn tables (Phase 3).
//
// Spawn tables describe *what* can appear in a zone, by context.
// This phase introduces the primary lookup structure:
//   biome → era → difficultyRating (ranges)
//
// Important:
// - Keep tables data-only.
// - Do not hardcode game logic here.
// - Determinism is handled by content.populate.js via seeded RNG.
//
// Back-compat:
// - We still support lookup by worldTile.templateId ("byTemplate").
// - tutorial_zone remains a byTemplate special-case.

(function () {
  const PC = (window.PC = window.PC || {});
  PC.content = PC.content || {};

  // ---------------------------------------------------------------------------
  // Shape
  // ---------------------------------------------------------------------------
  // PC.content.SPAWN_TABLES = {
  //   byContext: {
  //     "temperate_forest": {
  //       "primitive": [
  //         {
  //           difficultyRange: [1, 3], // inclusive
  //           table: {
  //             resourceNodes: { countRange:[min,max], entries:[{ defId, w }, ...] },
  //             entities:      { countRange:[min,max], entries:[{ defId, w }, ...] },
  //             pois:          { countRange:[min,max], entries:[{ defId, w }, ...] },
  //             locations:     { countRange:[min,max], entries:[{ defId, w }, ...] },
  //           }
  //         }
  //       ]
  //     }
  //   },
  //   byTemplate: {
  //     "primitive_forest": { ...same kind objects... },
  //     "tutorial_zone": { ... }
  //   },
  // };
  // ---------------------------------------------------------------------------

  PC.content.SPAWN_TABLES = PC.content.SPAWN_TABLES || {};
  PC.content.SPAWN_TABLES.byContext = PC.content.SPAWN_TABLES.byContext || {};
  PC.content.SPAWN_TABLES.byTemplate = PC.content.SPAWN_TABLES.byTemplate || {};

  // ---------------------------------------------------------------------------
  // Phase 3.3 — Spawn constraints vocabulary (documented for later expansion)
  // ---------------------------------------------------------------------------
  // For later phases, each entry/kind may add constraints such as:
  // - allowedTileKinds: ["floor", "grass", ...]
  // - minDistanceFromEntry: 3
  // - nearWater: true
  // - nearWall: true
  // - preferOpenAreas: true
  //
  // In Phase 3 we only document the vocabulary; placement engine will
  // implement constraints in Phase 4.

  // ---------------------------------------------------------------------------
  // Helpers (data-only convenience)
  // ---------------------------------------------------------------------------
  function ensurePath(obj, keys) {
    let cur = obj;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      cur[k] = cur[k] || {};
      cur = cur[k];
    }
    return cur;
  }

  // ---------------------------------------------------------------------------
  // Phase 3.1 — First context table (temperate_forest / primitive / difficulty 1-3)
  // ---------------------------------------------------------------------------
  // Matches world slot metadata:
  // - tile.biome: "temperate_forest"
  // - tile.era: "primitive"
  // - tile.difficultyRating must fall within the range (see populate resolver)
  const ctx_list = ensurePath(PC.content.SPAWN_TABLES.byContext, [
    "temperate_forest",
    "primitive",
  ]);

  // Ensure list container.
  if (!Array.isArray(ctx_list._ranges)) ctx_list._ranges = [];

  const ctx_r1_3 = { difficultyRange: [1, 3], table: {} };
  ctx_list._ranges.push(ctx_r1_3);

  const ctx = ctx_r1_3.table;

  ctx.resourceNodes = {
    // Phase 9: scale by zone size so small zones don't get overstuffed
    // and large zones don't feel empty.
    // We treat countRange as a baseline for ~100 walkable tiles.
    scaleByZoneSize: true,
    baseTiles: 100,
    minCount: 6,
    maxCount: 30,
    countRange: [14, 22],
    entries: [
      { defId: "oak_tree", w: 70 },
      { defId: "stone_cluster", w: 20 },
      { defId: "fallen_branches", w: 10 },
    ],
  };

  ctx.entities = {
    // Phase 9: scale by zone size (baseline for ~100 walkable tiles).
    scaleByZoneSize: true,
    baseTiles: 100,
    minCount: 1,
    maxCount: 10,
    countRange: [2, 5],
    entries: [
      { defId: "rabbit", w: 85 },
      { defId: "wolf", w: 15 },
    ],
  };

  ctx.pois = {
    countRange: [1, 2],
    entries: [
      { defId: "stash_small", w: 75 },
      { defId: "trap_snare", w: 25 },
    ],
  };

  ctx.locations = {
    countRange: [0, 1],
    entries: [
      { defId: "ruined_clearing", w: 70 },
      { defId: "cave_entrance", w: 30 },
    ],
  };

  // ---------------------------------------------------------------------------
  // Phase 3.1 — Template tables (back-compat + handcrafted exceptions)
  // ---------------------------------------------------------------------------


  // Tutorial zone (small static map) — keep the counts tiny.
  PC.content.SPAWN_TABLES.byTemplate.tutorial_zone = {
    resourceNodes: {
      countRange: [2, 4],
      entries: [
        { defId: "oak_tree", w: 70 },
        { defId: "stone_cluster", w: 30 },
      ],
    },
    entities: {
      countRange: [1, 1],
      entries: [
        { defId: "rabbit", w: 100 },
      ],
    },
    pois: {
      countRange: [1, 1],
      entries: [
        { defId: "stash_small", w: 100 },
      ],
    },
    locations: {
      countRange: [0, 0],
      entries: [],
    },
  };
})();
