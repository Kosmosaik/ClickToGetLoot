// scripts/inventory.js

// DOM reference
const inventoryList = document.getElementById("inventory-list");

// Inventory data
const inventory = Object.create(null);

// Sorting compare for stacks
function compareStacks(A, B) {
  const { key, dir } = inventorySort;
  const mul = dir === "asc" ? 1 : -1;

  if (key === "name") {
    return A.name.localeCompare(B.name) * mul;
  }

  if (key === "qty") {
    const diff = A.stack.qty - B.stack.qty;
    if (diff !== 0) return diff * mul;
    return A.name.localeCompare(B.name) * mul;
  }

  if (key === "rarity") {
    const ra = A.stack.items[0]?.rarity || "";
    const rb = B.stack.items[0]?.rarity || "";
    const diff = raritySortValue(ra) - raritySortValue(rb);
    if (diff !== 0) return diff * mul;
    return A.name.localeCompare(B.name) * mul;
  }

  return A.name.localeCompare(B.name) * mul;
}

function getEquipSlotForItem(item) {
  // For now we just trust item.slot ("weapon", "chest", etc.)
  if (!item || !item.slot) return null;
  // Optional: validate slot name later
  return item.slot;
}

// Category helpers
function categoryHeaderLabel(category = "Other") {
  const map = {
    "Material": "MATERIALS",
    "Crafting Component": "CRAFTING COMPONENTS",
    "Resource": "RESOURCES",
    "Weapon": "WEAPONS",
    "Tool": "TOOLS",
    "Wood": "WOOD",
    "Food": "FOOD",
  };
  return map[category] || (category || "OTHER").toUpperCase();
}
