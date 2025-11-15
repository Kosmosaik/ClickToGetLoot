// scripts/config.js

// Central place for tweakable settings.
const GAME_CONFIG = {
  version: "0.0.41",

  loot: {
    // Progress bar behavior
    progressDuration: 0.5,  // seconds for a full loot tick
    progressTick: 0.1,      // seconds per interval tick
  },

  quality: {
    // Quality tiers in order from worst to best
    tiers: ["F", "E", "D", "C", "B", "A", "S"],

    // Exponential base for rarity curve (lower = steeper, rarer high-end)
    expBase: 0.94,
  },

  inventory: {
    defaultSortKey: "name",   // "name" | "rarity" | "qty"
    defaultSortDir: "asc",    // "asc" | "desc"

    categoryOrder: [
      "Material",
      "Crafting Component",
      "Resource",
      "Weapon",
      "Tool",
      "Other",
    ],
  },

  raritySortOrder: ["Abundant", "Common", "Uncommon", "Rare", "Exotic"],
};
