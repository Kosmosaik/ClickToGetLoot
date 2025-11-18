// scripts/items.js
// Keep rarity-weighted random; some items have optional statRanges.

const ItemCatalog = [
  // ========== WEAPONS ==========
  {
    name: "Rusty Dagger",
    description: "A dull old dagger, but still sharp enough to draw blood.",
    category: "Weapon",
    slot: "weapon",
    attackType: "melee",
    rarity: "Common",
    usage: "Basic melee weapon.",
    statRanges: {
    damage: [3, 6],
    attackSpeed: [1.0, 1.3],
    critChance: [0.5, 2],
    lootFind: [0, 1],
    }
  },
  {
    name: "Simple Dagger",
    description: "A simple sharpened dagger, nothing fancy.",
    category: "Weapon",
    slot: "weapon",
    attackType: "melee",
    rarity: "Uncommon",
    usage: "Basic melee weapon.",
    statRanges: {
    damage: [4, 10],
    attackSpeed: [1.0, 1.4],
    critChance: [1, 3],
    lootFind: [0, 3],
    }
  },
    // ========== MATERIALS ==========
  {
    name: "Slime Core",
    category: "Crafting Component",
    description: "A gelatinous orb pulsating with faint energy.",
    rarity: "Uncommon",
    usage: "Used for alchemy or crafting slime-based tools.",
  },
  {
    name: "Mythic Fragment",
    category: "Material",
    description: "Super rare thingy McDingy",
    rarity: "Exotic",
    usage: "eh oh",
  },
  {
    name: "Healing Herb",
    category: "Material",
    description: "A fragrant herb used to create basic healing potions.",
    rarity: "Common",
    usage: "Restores 10 HP when brewed or eaten raw.",
  },
  // ========== TOOLS ==========
  {
    name: "Basic Fishing Rod",
    category: "Tool",
    description: "A basic fishing rod used to fish.",
    rarity: "Rare",
    usage: "Fishing",
  },
  {
    name: "Primitive Pickaxe",
    category: "Tool",
    description: "A basic pickaxe used to mine basic ores",
    rarity: "Rare",
    usage: "Mining",
  },
  // ========== RESOURCES ==========
  {
    name: "Birch Wood",
    category: "Resource",
    description: "A wood type used in crafting, carpentry etc",
    rarity: "Common",
    usage: "Make planks, carpentry",
  },
  {
    name: "Small Stone",
    category: "Resource",
    description: "Small stone used in primitive crafting.",
    rarity: "Abundant",
    usage: "Craft primitive items",
  },
  {
    name: "Wooden Branch",
    category: "Resource",
    description: "Wooden branch used in primitive crafting, campfires etc.",
    rarity: "Abundant",
    usage: "Craft primitive items",
  },
  {
    name: "Iron Ore",
    category: "Resource",
    description: "A chunk of iron ore ready to be smelted.",
    rarity: "Common",
    usage: "Refine into ingots at a forge.",
  }
];

// Rarity weights (use only buckets that actually exist)
const RARITY_WEIGHTS = {
  Abundant: 90,
  Common:   40,
  Uncommon: 18,
  Rare:      6,
  Exotic:    1,
};

function getRandomItem() {
  // Group items by rarity
  const pools = {};
  ItemCatalog.forEach(it => {
    (pools[it.rarity] ||= []).push(it);
  });

  // Build weighted pairs only for rarities that have items
  const pairs = Object.entries(RARITY_WEIGHTS)
    .filter(([r]) => pools[r]?.length)
    .map(([r, w]) => ({ rarity: r, weight: w }));

  // Fallback: any item
  if (!pairs.length) {
    return ItemCatalog[Math.floor(Math.random() * ItemCatalog.length)];
  }

  // Weighted pick a rarity
  const total = pairs.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * total;
  let chosen = pairs[0].rarity;
  for (const p of pairs) {
    if ((roll -= p.weight) <= 0) { chosen = p.rarity; break; }
  }

  // Pick random item from that rarity pool
  const pool = pools[chosen];
  return pool[Math.floor(Math.random() * pool.length)];
}
