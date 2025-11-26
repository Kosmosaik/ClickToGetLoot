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

  return A.name.localeCompare(B.name) * mul;
}
