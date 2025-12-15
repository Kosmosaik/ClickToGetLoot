// scripts/inventory/inventory.core.js
// Mutating operations: add/remove/equip.

function addToInventory(inst) {
  if (!inventory[inst.name]) {
    inventory[inst.name] = { qty: 0, items: [] };
  }
  inventory[inst.name].qty += 1;
  inventory[inst.name].items.push(inst);
  renderInventory();

  // Unlock inventory UI the first time any system adds an item
  // (zone harvesting/kills/POIs as well as the loot button).
  if (typeof window.ensureInventoryUnlocked === "function") {
    window.ensureInventoryUnlocked();
  }

  // Auto-save after loot/change (debounced in Phase 8)
  if (typeof requestSaveCurrentGame === "function") {
    requestSaveCurrentGame();
  } else if (typeof saveCurrentGame === "function") {
    saveCurrentGame();
  }
}

function removeOneFromGroup(itemName, quality, stats) {
  const stack = inventory[itemName];
  if (!stack) return;

  const idx = stack.items.findIndex(
    it => it.quality === quality && statsEqual(it.stats, stats)
  );

  if (idx !== -1) {
    stack.items.splice(idx, 1);
    stack.qty -= 1;

    if (stack.items.length === 0) {
      delete inventory[itemName];
    }

    renderInventory();

    // Auto-save after trashing / removing (debounced in Phase 8)
    if (typeof requestSaveCurrentGame === "function") {
      requestSaveCurrentGame();
    } else if (typeof saveCurrentGame === "function") {
      saveCurrentGame();
    }
  }
}

function getEquipSlotForItem(item) {
  // For now we just trust item.slot ("weapon", "chest", etc.)
  if (!item || !item.slot) return null;
  // Optional: validate slot name later
  return item.slot;
}

function equipOneFromGroup(itemName, quality, stats) {
  const stack = inventory[itemName];
  if (!stack) return;

  // Find specific instance with matching quality + stats
  const idx = stack.items.findIndex(
    it => it.quality === quality && statsEqual(it.stats, stats)
  );
  if (idx === -1) return;

  const item = stack.items[idx];

  // Determine the slot (weapon, chest, etc.)
  const slot = getEquipSlotForItem(item);
  if (!slot) {
    console.warn("Item is not equippable:", item);
    return;
  }

  // Equip and get previously equipped item
  const previousEquipped = equipItemToSlot(slot, item);

  // Remove ONE instance from stack
  removeOneFromGroup(itemName, quality, stats);

  // If a previous item was equipped, return it to inventory
  if (previousEquipped) {
    addToInventory(previousEquipped);
  }

  // Recompute character stats
  if (typeof recomputeCharacterComputedState === "function") {
    recomputeCharacterComputedState();
  }

  // Auto-save (debounced in Phase 8)
  if (typeof requestSaveCurrentGame === "function") {
    requestSaveCurrentGame();
  } else if (typeof saveCurrentGame === "function") {
    saveCurrentGame();
  }
}
