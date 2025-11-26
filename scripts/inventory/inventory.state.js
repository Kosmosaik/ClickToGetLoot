// scripts/inventory/inventory.state.js
// State / config used by the inventory UI (sorting + expansion).

// Sorting state for inventory
let inventorySort = {
  key: GAME_CONFIG.inventory.defaultSortKey, // "name" | "rarity" | "qty"
  dir: GAME_CONFIG.inventory.defaultSortDir, // "asc" | "desc"
};

// Rarity sort order
const RARITY_ORDER = GAME_CONFIG.raritySortOrder.slice();
function raritySortValue(r) {
  const idx = RARITY_ORDER.indexOf(r);
  return idx === -1 ? RARITY_ORDER.length : idx;
}

// Remember which stacks and categories are expanded/collapsed
const openStacks = new Set();
const collapsedCategories = new Set();
