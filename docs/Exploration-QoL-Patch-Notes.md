# Patch Notes 0.0.70d – Exploration Quality Update

This update focuses on making zone exploration feel more natural, readable, and satisfying. Movement, tile discovery, and general exploration flow have all been improved.

---

## 🧭 Improved Exploration Flow
Exploring a zone now follows a clear and natural sequence:

- Your character **moves through the zone** instead of instantly jumping across it.
- The tile being explored now **blinks**, so you always know what’s happening.
- Once the investigation finishes, the tile is revealed and the character steps onto it.

This makes exploration feel more grounded and easier to follow visually.

---

## 🚶 Character Movement Through Explored Terrain
- A character marker (`☺`) now appears in every zone.
- The character **walks tile-by-tile** across revealed ground.
- Exploration never teleports the character anymore.
- The movement speed is consistent and smooth.

Movement only happens on tiles you've already explored, giving a natural “carving through the fog” feeling.

---

## ❓ Smarter Tile Selection
Exploration no longer follows a strict top‑left sequence.

Zones are now uncovered using a **smarter frontier system**:
- First, explore tiles directly next to the player.
- Then expand outward to nearby unexplored tiles.
- If all else fails, pick a remaining unexplored tile.

This results in exploration that feels more organic and less predictable.

---

## ⏳ Exploration Timing Improvements
Each tile now has a short “inspection time”:
- The target tile **blinks** while it’s being explored.
- When finished, it gets revealed and the character moves onto it.

This gives players a clear sense of progress and anticipation.

---

## 🧹 General QoL Fixes
- Auto and manual exploration both follow the new movement + inspection flow.
- Tile targeting, exploration timing, and movement no longer conflict.
- The character no longer stands on the blinking tile.
- The system now properly stops blinking when exploration is paused or stopped.

---

## 📌 What’s Coming Next
These items are planned for a future QoL pass before we continue with adding resources/entities/pois:

- Hidden “L” tiles until discovered nearby.
- A proper view‑distance system (in preparation for torches, light radius, etc.).
- Cleanup of unused buttons and small UI improvements.

---

## Summary
This update greatly improves the *feel* of exploring zones. Movement is clearer, tile discovery is more readable, and overall exploration is more immersive and intuitive.

More QoL improvements and the full 0.0.70d event system will follow.

