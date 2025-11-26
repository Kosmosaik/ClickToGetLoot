// scripts/inventory/inventory.persistence.js
// Inventory save/load helpers that are used by game.js and elsewhere.

// Returns a deep-cloned snapshot of the current inventory
function getInventorySnapshot() {
  return JSON.parse(JSON.stringify(inventory));
}

// Loads inventory from a snapshot object (or clears if null/undefined)
function loadInventoryFromSnapshot(snapshot) {
  // Clear current inventory
  for (const key of Object.keys(inventory)) {
    delete inventory[key];
  }

  if (snapshot && typeof snapshot === "object") {
    for (const [name, stack] of Object.entries(snapshot)) {
      inventory[name] = {
        qty: stack.qty,
        items: Array.isArray(stack.items)
          ? stack.items.map(it => ({ ...it }))
          : [],
      };
    }
  }

  renderInventory();
}
