# PROJECT SUMMARY – Post v0.0.70a  
### (For the next ChatGPT developer assistant)

This document summarizes the current state of ProgressCrawl up to version 0.0.70a, including the design philosophy, implemented systems, and roadmap. It is written specifically for the next ChatGPT assistant so it can seamlessly continue development.

---

# 1. About the Project
ProgressCrawl is a browser-based incremental RPG/survival/crafting game. The player progresses through eras (primitive → medieval → industrial → late‑fantasy → sci‑fi), exploring zones, gathering materials, crafting equipment, unlocking new systems, and experiencing world events.

Key goals:
- Deep progression across multiple “ages”
- Modular systems across all features
- Data-driven design
- Clean and testable UI
- Feature-based version branches

---

# 2. Core Design Principles
1. Everything must be modular and future-proof.  
2. Debug-first: clear and testable UI during prototyping.  
3. Strict feature-branch workflow.  
4. Explain all changes clearly, with exact file placement.  
5. Avoid premature optimization.

---

# 3. Current Systems (Implemented)

## 3.1 Character Creation
- Name input  
- Attribute allocation (STR/DEX/INT/VIT)  
- Weapon skills  
- Summary panel  
- Auto entry into Starting Zone  

## 3.2 Inventory System
- Category view & All-Items flat spreadsheet-style view  
- Sortable columns  
- Column resizing  
- Rarity coloring  
- Tooltip system  
- Equip/unequip interactions  

## 3.3 Equipment System
- Equipment slots  
- Total attributes & derived stats  
- +/- dev buttons  

## 3.4 Loot Button System
- Central loot button  
- Progress animation  

## 3.5 Skills Panel
- Shows weapon skills  
- Editable values for testing  

## 3.6 Zone System – Core (v0.0.70a)
### Zone Entry
- Player enters Starting Zone after character creation  
- Exploration paused until player starts  

### Tilemap Structure
- ASCII grid  
- Tile types: walkable, blocked, locked  
- Explored/unexplored states  
- Sequential reveal  

### Exploration Loop
- Manual: “Explore Next Tile”  
- Auto: explores tiles every 2–5s  
- Cannot run both at once  
- Exploration messages  
- 100% completion when all tiles are revealed  

### Zone Panel UI
- Clean sections  
- Centered ASCII grid  
- Zone info block  
- Messages log  
- Discoveries sidebar  
- Finish Zone menu  

### Status Handling
- Idle  
- Exploring (Manual)  
- Exploring (Auto)  
- Completed  

---

# 4. Roadmap Overview (0.0.70 → future)

## 4.1 0.0.70 Branches
- **0.0.70a – Zone Core System (DONE)**
- **0.0.70b – Events & Discoveries (MOVED TO A FUTURE PATCH)** 
- **0.0.70c – World Map Skeleton (DONE)** 
- **0.0.70d – Zone Definitions** (ONGOING)
- **0.0.70e – Tile Types & Rendering**

## 4.2 Upcoming Systems
- 0.0.71 – Gathering (Mining, Herbalism, Logging, node grades)  
- 0.0.72 – Crafting (stations, recipes, quality)  
- 0.0.73 – Time, seasons & weather  
- 0.0.74 – Combat foundation  
- 0.0.75+ – NPCs, merchants, story, zone bosses  

---

# 5. Dev Guidelines for Next Assistant
- Always specify file names and exact locations for modifications  
- Maintain modularity and clean code separation  
- Use window.* globals only when necessary for cross-script references  
- Avoid touching unrelated systems within a branch  
- UI must follow current dark/minimalist style  
- Do not optimize for mobile unless requested  

---

# 6. File Structure (Simplified)
- /scripts/game/ – core logic  
- /scripts/zones/ – zones, tilemaps, exploration  
- /scripts/inventory/ – items, sorting, lists  
- /scripts/equipment/ – equipment logic  
- /css/ – styling  
- /config/ – data tables  

---

# 7. Notes
- ASCII grid is temporary but stable  
- Future versions may move to tile icons  
- World Map is not implemented yet  
- All expansions should remain data-driven  
- Follow branch sequence carefully  

This summary replaces the previous v0.0.67 document.
