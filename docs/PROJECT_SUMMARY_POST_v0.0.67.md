# 🎮 ProgressCrawl — Project Summary & Development Reference (Post v0.0.67)

This document provides full project context for the next GPT assistant.  
It summarizes all major systems, recent updates (v0.0.67), and upcoming roadmap tasks, ensuring development continues smoothly.

---

# 📘 Project Overview

**ProgressCrawl** is a browser-based survival / crafting / RPG with:
- Item looting and rarity/grade systems  
- Character progression via attributes, skills, and equipment  
- Modular UI panels  
- Deep tooltip/stat systems  
- Future plans for exploration, gathering, zones, combat, and crafting

Design direction:
- Start minimal  
- Build RPG depth gradually  
- Keep every system modular  
- Ensure player clarity through readable UI and detailed tooltips  

Everything is built with **HTML, CSS, Vanilla JS**.

---

# 📦 Current Systems Overview

## ✔ Loot System
- Six rarities: Abundant → Unique  
- Quality grades F0 → S9  and subgrades F1 → S9
- Rolling based on item templates (will be changed to roll from resource nodes later)
- Weighted loot tables (will be per resource node / entity later)
- Stacking with identical grouping  

## ✔ Inventory System
- Category-based layout  
- All-items spreadsheet-style layout (v0.0.67)  
- Sorting by multiple fields  
- Collapsible categories  
- Stack expansion  
- Column resizing (saved in localStorage)  
- Movable and auto-sizing panels  

## ✔ Equipment System
- Weapon slot + armor slots  
- Equipment modifies character attributes  
- Derived stats recalculated on equip  
- Comparison logic being expanded for tooltip system  

## ✔ Character System
Primary stats:
- STR / DEX / INT / VIT

Derived stats:
- Attack  
- DPS  
- AttackSpeed  
- Crit Chance  
- Loot Find  
- Max HP  

## ✔ Skills System
Weapon-type mastery:
- Dagger  
- Sword  
- Axe  
- Bow  
- Club
- Unarmed  

Independent skill levels influence scaling, DPS, and accuracy.

## ✔ Save System
Stored:
- Inventory  
- Equipment  
- Skills  
- Character stats  
- Unlock flags  
- UI panel states (v0.0.67 adds draggable positions & column widths)

## ✔ UI System
Panels:
- Inventory  
- Equipment  
- Skills  
- Patch Notes  
- HP Bar  
- Start/Character creation  

All built with modular scripts and easy to expand.

---

# 🚀 Update v0.0.67 — Summary

The main focus of v0.0.67 was **inventory usability and UI quality**.  
Key additions:

### **Inventory**
- New All-Items flat view  
- Column resizing with persistent widths  
- Auto-sizing inventory panel  
- Collapse/Expand all categories  
- Alphabetical category sorting in All-Items view  
- Vertical column dividers  
- Perfect alignment of column/rows  
- QoL fixes (no accidental sorting on resize, cleaner layout)

### **UI**
- Movable panels (Inventory, Equipment, Skills)  
- Saved panel positions  
- Panels clamped inside viewport and above bottom HUD  
- Consistent styling improvements  
- Unified spacing, alignment, and readability

---

# 🔧 Upcoming (based on Roadmap)

This is critical for the next GPT assistant.  
These tasks **should define the next stages of development**.

## v0.0.67 (remaining) - will be moved to v0.0.67b
**Tooltip Upgrade**  
- Add 3-layer tooltip system:
  1. Raw item stats  
  2. Comparison vs equipped item's stats 
  3. Character actual stats after equipping  (Example: Damage: 10 (equipment stat) (characters actual stat))

---

## v0.0.68 — Level / Experience System
- Add Character Level and EXP  
- Temporary EXP formula  
- Developer testing buttons (“Give EXP”, “Give Level”)  
- Attribute points on level up (+3 per level) that the player can spend on STR, DEX, INT, VIT

---

## v0.0.70 — Zones & Exploration (Phase 1)
- Add “Zone” system with exploration progress  
- Generate resource nodes & POIs  
- World map → Zone → World map navigation  
- Exploration timers and events  
- Starting Zone with tutorials and tasks  

---

## v0.0.71–0.0.74 — Polish & Expansion
- More POIs  
- Early interact/use system  
- Blueprint system  
- Hunger/Thirst  
- More items, especially starter zone content  
- Defense stats & extended item variables  

---

## v0.0.75 — Quest/Task System
- Quest structure for zone progression  
- Tutorial quests  
- Collect X items, exploration percentage increases, etc.

---

## v0.0.80 — Combat v1
- Basic enemy entities  
- Attack vs Defense formula  
- Combat log  
- Enemy UI  
- Rewards/loot on kill  
- Weapon mastery integration  

---

## v0.0.90 — Gathering v1
- Resource nodes (Stone Cluster, Tall Grass, etc.)  
- Gathering success/fail grade system  
- Early crafting stations (campfire, forge)  
- Profession leveling  

---

## v0.0.91 — Weight & Storage
- Encumbrance  
- Backpacks  
- STR → carry weight scaling  

---

## v0.1.0+ — Crafting v1
- Recipes  
- Crafting stations  
- Crafting success calculations  

---

# 🧠 Notes for the Next GPT Assistant

1. Keep code modular — follow existing folder structure.  
2. Avoid rewriting systems; extend them through new functions or modules.  
3. Refer to `config.js` for tunable variables.  
4. Tooltip work is the immediate next priority.  
5. All new UI features should follow the PC-first layout.  
6. Always check save/load compatibility when changing state structures.  
7. Inventory, Equipment, and Character compute logic must stay synced.  

---

# 📄 End of Summary
Load this file into any new session to instantly continue development with full context.
