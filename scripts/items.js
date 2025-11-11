// scripts/items.js
// Keep your rarity-weighted random, but add optional stat ranges per item.
// Items WITHOUT statRanges will still get a quality, just no rolled stats.

const ItemCatalog = [
  {
    name: "Rusty Dagger",
    category: "Weapon",
    description: "A dull old dagger, but still sharp enough to draw blood.",
    rarity: "Common",
    usage: "Basic melee weapon.",
    // Optional: define stat ranges for RNG
    statRanges: {
      // [min, max]
      damage: [3, 6],           // integers
      attackSpeed: [1.0, 1.3],  // decimals OK
    },
  },
  {
    name: "Slime Core",
    category: "Crafting Component",
    description: "A gelatinous orb pulsating with faint energy.",
    rarity: "Uncommon",
    usage: "Used for alchemy or crafting slime-based tools.",
  },
  {
    name: "Iron Ore",
    category: "Resource",
    description: "A chunk of iron ore ready to be smelted.",
    rarity: "Abundant",
    usage: "Refine into ingots at a forge.",
  },
  {
    name: "Healing Herb",
    category: "Material",
    description: "A fragrant herb used to create basic healing potions.",
    rarity: "Common",
    usage: "Restores 10 HP when brewed or eaten raw.",
  },
  {
    name: "Basic Fishing Rod",
    category: "Tool",
    description: "A basic fishing rod used to fish.",
    rarity: "Uncommon",
    usage: "Fishing",
  },
  {
    name: "Birch Wood",
    category: "Wood",
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
  }
];

// ---- Rarity-weighted random (as you liked)
function getRandomItem() {
  const rarities = {
    Abundant: 40,
    Common: 30,
    Uncommon: 20,
    Rare: 8,
    Exotic: 2
  };

  const total = Object.values(rarities).reduce((a,b)=>a+b,0);
  const roll = Math.random() * total;
  let cumulative = 0, chosenRarity = "Common";

  for (const [r, w] of Object.entries(rarities)) {
    cumulative += w;
    if (roll <= cumulative) { chosenRarity = r; break; }
  }

  const possibleItems = ItemCatalog.filter(i => i.rarity === chosenRarity);
  return possibleItems[Math.floor(Math.random() * possibleItems.length)];
}
