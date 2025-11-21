// Central place for tweakable settings.
const GAME_CONFIG = {
  version: "0.0.65-dev",

  loot: {
    // Progress bar behavior
    progressDuration: 0.5,  // seconds for a full loot tick
    progressTick: 0.1,      // seconds per interval tick

    // --- NEW: rarity + loot find tuning ---

    // Base rarity weights (these should match what you currently use in items.js)
    rarityWeights: {
      Abundant: 250,
      Common:   100,
      Uncommon: 50,
      Rare:      25,
      Exotic:    4,
      Unique:    0.5,
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
  
  skills: {
    weapon: {
      // What we call each skill in the UI
      labels: {
        dagger: "Daggers",
        sword: "Swords",
        axe: "Axes",
        bow: "Bows",
        unarmed: "Unarmed",
      },
      // Starting values for a fresh character
      defaultLevels: {
        dagger: 0,
        sword: 0,
        axe: 0,
        bow: 0,
        unarmed: 0,
      },
      minLevel: 0,
      maxLevel: 200,

      requiredFromPower: {
        base: 20,    // requirement even for very weak weapons
        perPower: 5, // +5 required skill per 1 "power"
        min: 0,
        max: 200,
      },
    },
  },

  // Weapon type → which stats matter + how much recommended stats scale with power
  weaponProfiles: {
    dagger: {
      attrWeights: { STR: 0.4, DEX: 0.6 },
      attrPerPower: 1.8,
    },
    sword: {
      attrWeights: { STR: 0.6, DEX: 0.4 },
      attrPerPower: 2.0,
    },
    axe: {
      attrWeights: { STR: 0.8, DEX: 0.2 },
      attrPerPower: 2.2,
    },
    bow: {
      attrWeights: { STR: 0.2, DEX: 0.8 },
      attrPerPower: 2.0,
    },
    unarmed: {
      attrWeights: { STR: 0.5, DEX: 0.3, VIT: 0.2 },
      attrPerPower: 1.5,
    },
  },

  // Small combat constants
  combat: {
    attackAverageFactor: 0.85,  // used later: AttackShown = EDMax * 0.85

    // Unarmed behaviour
    unarmedBaseDamage: 1,
    unarmedDamagePerStr: 0.2,
    unarmedAttackSpeed: 1.2,
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

