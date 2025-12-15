# ProgressCrawl – Zone Exploration QoL Branch (Post–0.0.70e)

This document is meant as a handoff / technical summary for the next GPT assistant and for future maintenance.

---
### TODOs made AFTER 0.0.70e (prioritize these first).

1. **Add resource nodes, entities, POIs and Locations to Discoveries-list.**
   - Currently only Locations are stored in Discoveries after interaction has been made.  
   - TODO: whenever content is revealed upon "explored" it should be added to the Discoveries list.
   - Add sorting options (by name, by distance to player, by content/node type"
   - Add interact/move to function. When content is clicked in Discoveries, move player to the tile and then open up the window for harvest/kill etc.
  
2. **Zone Items and Loot-Button items are not unified and grade system is not implemented**
   - Currently items are separated from zone system and loot button. Zone items are not generated from items.js and they have no properties for future expansion.
   - Question: Do we remove items.js, or generate ALL items from items.js instead?
   - Item grades are not generating/randomizing in zones. All items have F0 as grade. The idea is that all resource nodes, entities, POIs etc
     will roll a random grade upon creation/generation, and the items looted from the node, entity, POI etc will derive from that grade generation.
     Higher difficulty in zone = higher chance to generate higher grade (F0-S9).
   - In the future, player will be able to "improve" the grade when harvesting/looting entity etc based on skills, tool handling etc.
  
3. **Stone Cluster glyph/symbol is too big. Can we reduce its size or do we have to change the symbol completely?**

4. **When playing on phone: For some reason the player icon is not centered in the tile. This is NOT an important QoL change, and I don't want it to mess up anything for PC**

     


### TODOs created BEFORE 0.0.70e

These should be handled in future QoL passes or adjacent branches:

1. **Remove the STAY button in the zone view and move LEAVE ZONE to "Explore Next Tile" & "Explore Auto" buttons**
   - Currently STAY logs to console and otherwise does nothing.  
   - TODO: remove and adjust layout accordingly.

2. **Make the "L" tile invisible until at least one adjacent tile has been explored**
   - Currently, `L` tiles are shown directly based on layout.
   - TODO: hide `L` behind a "?" until an adjacent tile is explored, then reveal it.

3. **Remove Zone Completed text under map **
   - Original request: remove "Zone Completed" text under the map and tighten area between zone and messages to save pixel height.
   - Check current UI behavior and adjust/remove if necessary.

4. **Make the "L" tile only clickable after it has been discovered AND exploration is idle AND character position is adjacent to the "L" tile**
   - UI currently allows clicking `L` if visible and belonging to a locked region.  
   - TODO: add checks so the click is respected only when:
     - tile is “discovered” (whatever final definition is), and
     - no exploration (auto or manual) is currently in progress, and
     - player sprite/object is near the "L", otherwise the player will move automatically to the "L" and then trigger the unlock.

6. **World map coordinate system change**
   - Original objective: set tutorial zone to `(0, 0)` and use:
     - North: `Y + 1`
     - East: `X + 1`
     - South: `Y - 1`
     - West: `X - 1`
   - TODO: update world map generation, movement, and UI representation accordingly.
  
7. **Move the Inventory/Equipment/Skills menu bar up on top header so we don't have two top panels. The name (on the top left) can be removed for now.

8. **Remove the "Overview World map ready (Tutorial Zone + adjacent placeholders)" text/field**

9. **Remove the 4 starting zones around the Tutorial Zones and replace them with current CA generated zones.**

10. **Remove the "Zone" menu text in the top and move up the Zone Info field instead. We need to save on UI height in the zone panel.

## IDEAS BELOW ARE NOT TO BE IMPLEMENTED YET. THESE ARE ONLY IDEAS AND NEED TO BE THOUGHT ON FURTHER.
xx. **Add a "view distance" mechanic (3×3 area around player)**
   - Currently, exploration reveals individual tiles based on exploration logic; there is no concept of **FOV/view distance** beyond “explored vs unexplored”.
   - TODO: introduce a view-distance system where exploring / moving reveals tiles in a radius around the player (N/NE/E/SE/S/SW/W/NW), and make it configurable for future features like torches, light sources, etc.
   - Note: All tiles within the view distance will count as explored when revealed, not only the one "targeted" tile.

xx. **Mark all tiles with "?" (including blocked tiles) until explored**
   - Current render logic shows `#` for blocked tiles right away.
   - TODO: change rendering so all tiles initially show as `?` and only reveal their actual type (`#`, `.`, `L`) after being explored (or revealed by view distance).
   - NOTE: This will only be done if view distance is implemented and increased from one tile as we have today. 

---

## 8. Notes for the Next Assistant

- The current implementation is **good enough to feel like a proper “walk → inspect → reveal” loop**, but many numbers (movement speed, explore delay) are **hardcoded** and should later be exposed through `GAME_CONFIG` for balancing.
