# ProgressCrawl – Development Roadmap

This roadmap outlines the upcoming planned versions of ProgressCrawl.  
It focuses on expanding core gameplay systems in the most logical order, ensuring each new feature builds cleanly on top of existing foundations.

This roadmap is flexible and will evolve as development continues.

---

## v0.0.61 — Polish & Stability Update
Small but important improvements following the Equipment Update.

### Planned:
- UI consistency pass (button styles, panel spacing, tooltip clarity)
- Minor refactors in game.js, equipment.js, and character.js
- Improve layout logic for Inventory/Equipment panels when resizing
- Add `config` toggles for easier balancing (HP per VIT, crit/loot find formulas, etc.)
- Optional: Add a toggle to collapse/expand all inventory categories at once

---

## v0.0.70 — Damage, Attack & Weapon Skill Overhaul (Phase 1)
This is a major systems update that restructures how combat-related values are calculated.

### Goals:
- Replace old attribute-only Attack formula
- Implement weapon **potential damage** vs **player effective damage**
- Introduce a basic **Weapon Skill** structure (dagger, sword, unarmed, etc.)
- Add efficiency calculation:
  - `skill efficiency`
  - optional `attribute efficiency`
- Treat unarmed as a proper weapon (fists) with low base damage
- Update Equipment panel to display:
  - Weapon damage range
  - Your effective damage
  - Attack = average expected damage
- Prepare for future Hit Rate, Critical Hit, and Accuracy mechanics

### UI additions:
- Show `Damage: X (Y)` in Equipment panel
- Show Attack as a single, easy-to-read number
- Add internal hooks for future skill leveling

This update does **not** include combat or fighting yet.  
It only establishes the mathematical systems needed for them.

---

## v0.0.80 — Weapon Skill Progression (Phase 2)
Builds on the previous update. Skills now matter and evolve during gameplay.

### Planned:
- Add a full skill system:
  - Skills stored in save file
  - Skills visible in equipment or character panel
- Skills increase through:
  - Increase/Decrease skill buttons (for testing purposes)
  - Skill books (future)
- Skill caps for each weapon type
- Efficiency curves based on skill level vs weapon requirement

### Visual/UI:
- Skill list UI
- Each equipped weapon shows required skill level
- Increase/Decrease skill buttons

---

## v0.0.90 — Zones & Exploration (Phase 1)
Unlocks real gameplay beyond clicking “Loot”.

### Planned:
- Add “Zones” (locations the player can visit)
- Each zone has:
  - Level range / Difficulty system
  - Loot tables
  - Unique resources or items
- Zone unlock progression

### UI:
- New Zone selection panel (World map)
- Zone descriptions and rewards
- Zone completion time bar (similar to loot bar)
- World map -> Zone -> World map transition

---

## v0.1.00 — Combat Encounters (Phase 1)
The first real combat mechanics appear.

### Planned:
- Basic enemy system
- Simulation-style combat:
  - Player Attack vs Enemy Defense
  - Enemy Attack vs Player HP
- Loot obtained from defeating enemies
- Weapon damage and skill levels fully matter

### UI:
- Combat log
- Enemy card with HP and stats
- Reward screen after victory

---

## v0.1.10 — Crafting & Resources (Phase 1)
Introduces resource gathering and item creation.

### Planned:
- Resource items (wood, ore, hides, herbs)
- Crafting recipes
- Basic crafting stations (campfire → forge → advanced forge)
- Crafting stats and quality bonuses
- Items can require specific tools to gather

---

## v0.1.20 — Gathering Professions (Mining, Herbalism, Woodcutting)
Profession system tied to resources and crafting.

### Planned:
- Leveling for gathering professions
- Rare resource drops, profession perks
- Tools affecting success rate and rarity

---

## v0.1.30 — Equipment Expansion
Builds on the first Equipment Update with deeper gear systems.

### Planned:
- More item slots (ring, necklace, off-hand, belt)
- Item modifiers (prefixes/suffixes)
- Set bonuses
- Item weight & encumbrance system
- Durability (optional)

---

## v0.1.40 — Character Development
Adds more RPG depth.

### Planned:
- Primary attributes affect gameplay more strongly
- Passive bonuses from leveling
- Talent tree (or simple perk system)
- Buffs, debuffs, temporary effects

---

## v0.1.50 — Marketplace & Economy (optional milestone)
If the game grows into trading/online features.

### Planned:
- Marketplace UI
- Selling/buying items (single-player economy)
- NPC vendors with rotating inventories
- Optional: global leaderboards (if going online)

---

## Long-Term Ideas (Unscheduled)
These may be slotted later depending on direction:

- Achievements
- Pets / companions
- Housing / base-building
- Farming / resource nodes
- Multiplayer features
- Cosmetics / skins
- World map view

---

## Notes
This roadmap prioritizes:
- Player experience
- Strong core systems
- Avoiding rewrites by planning ahead
- A clear progression from “click-to-loot” into “explore, fight, craft, progress”

