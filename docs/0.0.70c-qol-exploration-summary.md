# ProgressCrawl – Zone Exploration QoL Branch (Pre–0.0.70e)

This document summarizes the **Zone Exploration Quality-of-Life changes** implemented in this branch before continuing with **0.0.70e - Resource / Entities / POIs system**. It is meant as a handoff / technical summary for the next GPT assistant and for future maintenance.

> Scope: Focused on **zone exploration feel & UX/UI** – character marker, movement, exploration animation/timing, and smarter tile selection.  
> Status: **Partially complete**. Several QoL points are implemented; others remain as clear TODOs (see bottom).

---

This branch does **not** introduce new content, enemies, or resources. It strictly improves the *feel* of moving through a zone.

---

### Known TODOs (from original user list; not yet implemented or only partially addressed)

These should be handled in future QoL passes or adjacent branches:

1. **Remove the STAY button in the zone view**
   - Currently STAY logs to console and otherwise does nothing.  
   - TODO: remove and adjust layout accordingly.

2. **Make the "L" tile invisible until at least one adjacent tile has been explored**
   - Currently, `L` tiles are shown directly based on layout.
   - TODO: hide `L` behind a "?" until an adjacent tile is explored, then reveal it.

3. **Add a "view distance" mechanic (3×3 area around player)**
   - Currently, exploration reveals individual tiles based on exploration logic; there is no concept of **FOV/view distance** beyond “explored vs unexplored”.
   - TODO: introduce a view-distance system where exploring / moving reveals tiles in a radius around the player (N/NE/E/SE/S/SW/W/NW), and make it configurable for future features like torches, light sources, etc.
   - Note: All tiles within the view distance will count as explored when revealed, not only the one "targeted" tile.

4. **Zone Completed text visibility**
   - Original request: only show “Zone Completed” text when 100% explored.
   - Check current UI behavior and adjust if necessary (may already be correct depending on existing `getZoneStatusText` logic vs `zoneStatusEl`).

5. **Make the "L" tile only clickable after it has been discovered AND exploration is idle AND character position is adjacent to the "L" tile**
   - UI currently allows clicking `L` if visible and belonging to a locked region.  
   - TODO: add checks so the click is respected only when:
     - tile is “discovered” (whatever final definition is), and
     - no exploration (auto or manual) is currently in progress, and
     - player sprite/object is near the "L", otherwise the player will move automatically to the "L".

6. **Mark all tiles with "?" (including blocked tiles) until explored**
   - Current render logic shows `#` for blocked tiles right away.
   - TODO: change rendering so all tiles initially show as `?` and only reveal their actual type (`#`, `.`, `L`) after being explored (or revealed by view distance).
   - NOTE: This will only be done if view distance is implemented and increased from one tile as we have today. 

7. **World map coordinate system change**
   - Original objective: set tutorial zone to `(0, 0)` and use:
     - North: `Y + 1`
     - East: `X + 1`
     - South: `Y - 1`
     - West: `X - 1`
   - TODO: update world map generation, movement, and UI representation accordingly.
  
8. **Make the zone ascii fonts handled as a real tilemap**
   - Meaning that when player hovers mouse over zone/map or klick and drag with the mouse we should not be supposed to copy+paste like a text.
   - This is important because later we will probably change the ascii to sprites and we can't handle it as text.
   - This is also important because in the soon future I'd like to be able to pan around the zone with the mouse.
  
9. **Move the Inventory/Equipment/Skills menu bar up on top so we don't have two top panels. The name (on the top left) can be removed for now.

10. **Remove the Overview World map ready (Tutorial Zone + adjacent placeholders) text/field**

11. **Remove the 4 starting zones around the Tutorial Zones and replace them with the new CA generated zones.**

12. **Remove the "Zone" menu text and move up the Zone Info field instead. We need to save on UI height in the zone panel.

---

## 8. Notes for the Next Assistant

- The current implementation is **good enough to feel like a proper “walk → inspect → reveal” loop**, but many numbers (movement speed, explore delay) are **hardcoded** and should later be exposed through `GAME_CONFIG` for balancing.
- Pathfinding intentionally avoids going through unknown `?` tiles to keep movement grounded in what the player has already explored.
- The **separation of responsibilities** is important:
  - `zones.core.js` – low-level tile/zone logic & debug helpers.
  - `game.js` – high-level exploration loop, timers, movement and UI orchestration.
  - `zones.ui.js` – purely visual; reads tile flags and renders them.
- When you add **view distance**, you’ll likely need:
  - Additional per-tile state like `tile.discovered` vs `tile.explored` or similar.
  - Hooks in movement and reveal functions to update “seen” tiles in a radius around `hasPlayer`.
