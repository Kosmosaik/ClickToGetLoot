// scripts/inventory.js

// DOM reference
const inventoryList = document.getElementById("inventory-list");

// Inventory data
const inventory = Object.create(null);

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
