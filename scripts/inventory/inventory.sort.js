// scripts/inventory/inventory.sort.js
// Sorting helpers for inventory stacks.

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

    if (key === "category") {
    const ca = A.stack.items[0]?.category || "Other";
    const cb = B.stack.items[0]?.category || "Other";

    const CATEGORY_ORDER = GAME_CONFIG.inventory.categoryOrder;
    const ia = CATEGORY_ORDER.indexOf(ca);
    const ib = CATEGORY_ORDER.indexOf(cb);

    let diff;
    if (ia === -1 && ib === -1) {
      // If both are unknown categories, fall back to alphabetical
      diff = ca.localeCompare(cb);
    } else if (ia === -1) {
      diff = 1;
    } else if (ib === -1) {
      diff = -1;
    } else {
      diff = ia - ib;
    }

    if (diff !== 0) return diff * mul;
    return A.name.localeCompare(B.name) * mul;
  }
}
