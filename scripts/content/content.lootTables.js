// scripts/content/content.lootTables.js
// 0.0.70e — Minimal internal loot tables (defs only).
//
// Purpose (Phase 2):
// - Provide a tiny, deterministic-friendly set of loot tables that content defs
//   can reference via `lootTableId`.
// - No gameplay logic yet; this is data-only.
//
// IMPORTANT:
// - These are *internal test tables*.
// - Item strings here do not need to exist in ItemCatalog yet.
//   (Integration happens later when we implement interactions.)

(function () {
  const PC = (window.PC = window.PC || {});
  PC.content = PC.content || {};

  // Canonical loot table registry.
  // Table shape:
  //   {
  //     rolls: number, // how many picks
  //     entries: [{ item, w, qty: [min,max] }, ...]
  //   }
  PC.content.LOOT_TABLES = PC.content.LOOT_TABLES || {};

  // --- Resource nodes ---
  PC.content.LOOT_TABLES.tree_basic = {
    rolls: 2,
    entries: [
      { item: "Wood", w: 80, qty: [1, 3] },
      { item: "Sap", w: 20, qty: [1, 1] },
    ],
  };

  PC.content.LOOT_TABLES.stone_basic = {
    rolls: 2,
    entries: [
      { item: "Stone", w: 85, qty: [1, 3] },
      { item: "Flint", w: 15, qty: [1, 1] },
    ],
  };

  PC.content.LOOT_TABLES.branches_basic = {
    rolls: 1,
    entries: [
      { item: "Wood", w: 100, qty: [1, 2] },
    ],
  };

  PC.content.LOOT_TABLES.herb_basic = {
    rolls: 1,
    entries: [
      { item: "Healing Herb", w: 100, qty: [1, 2] },
    ],
  };

  // --- POIs ---
  PC.content.LOOT_TABLES.stash_small = {
    rolls: 2,
    entries: [
      { item: "Coin", w: 70, qty: [3, 12] },
      { item: "Bandage", w: 30, qty: [1, 2] },
    ],
  };

  // --- Entities ---
  PC.content.LOOT_TABLES.rabbit_basic = {
    rolls: 1,
    entries: [
      { item: "Meat", w: 60, qty: [1, 1] },
      { item: "Hide", w: 40, qty: [1, 1] },
    ],
  };

  PC.content.LOOT_TABLES.wolf_basic = {
    rolls: 2,
    entries: [
      { item: "Meat", w: 60, qty: [1, 2] },
      { item: "Hide", w: 40, qty: [1, 1] },
    ],
  };
})();
