// Central place for tweakable settings.
const GAME_CONFIG = {
  version: "0.0.52b",

  loot: {
    // Progress bar behavior
    progressDuration: 0.5,  // seconds for a full loot tick
    progressTick: 0.1,      // seconds per interval tick

    // --- NEW: rarity + loot find tuning ---

    // Base rarity weights (these should match what you currently use in items.js)
    rarityWeights: {
      Abundant: 1000,
      Common:   250,
      Uncommon: 50,
      Rare:      10,
      Exotic:    1,
      Unique:    0.1,
    },

    // How Loot Find % biases those weights.
    // Positive = weight goes UP with Loot Find, negative = weight goes DOWN.
    // We'll use LootFind% as L = LootFind / 100 in the formula later.
    lootFindBias: {
      Abundant: -0.25,
      Common:   -0.15,
      Uncommon:  0.40,
      Rare:      0.25,
      Exotic:    0.15,
      Unique:    0.05
    },
  },

  quality: {
    // Quality tiers in order from worst to best
    tiers: ["F", "E", "D", "C", "B", "A", "S"],

    // Exponential base for rarity curve (lower = steeper, rarer high-end)
    expBase: 0.91,
  },

    character: {
    // HP
    baseHP: 20,        // HP with 0 VIT, no gear
    hpPerVit: 5,       // +5 HP per VIT point

    // Crit chance
    baseCritChance: 5, // % base crit chance
    critPerDex: 0.5,   // % crit chance per 1 DEX

    // Loot find
    lootFindPerInt: 0.5, // % loot find per 1 INT

    // Attack scaling (we'll use these in character.js)
    meleeMainScale: 2.0,   // STR contribution to melee
    meleeOffScale:  0.2,   // DEX contribution to melee

    rangedMainScale: 2.0,  // DEX contribution to ranged
    rangedOffScale:  0.2,  // STR contribution to ranged,
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

  raritySortOrder: ["Abundant", "Common", "Uncommon", "Rare", "Exotic", "Unique"],
};
