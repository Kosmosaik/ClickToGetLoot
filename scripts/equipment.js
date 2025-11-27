// scripts/equipment.js
// Handles equipped items and summarizes their bonuses for the character system.

/**
 * Read-only view of the current equipped items.
 * Returns a shallow copy of the equipped slots.
 */
function getEquippedState() {
  const out = {};
  for (const slot of EQUIP_SLOTS) {
    const item = equipped[slot];
    out[slot] = item
      ? { ...item, stats: { ...(item.stats || {}) } }
      : null;
  }
  return out;
}
