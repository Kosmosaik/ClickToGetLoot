## v0.0.70c — The World Expansion Update

This update introduces the foundation of ProgressCrawl’s world exploration system.  
Zones now exist inside a larger overworld where players can gradually uncover new areas,  
see their connected regions, and enter newly discovered zones at will.  
World progression is now structured, persistent, and fully integrated with exploration.

### New: World Map System
A brand-new world map now exists beyond the Tutorial Zone.

Features:
- Displays all discovered and visited zones
- Shows fog-covered unknown territories
- Zones are marked clearly as:
  - `?` Unknown
  - `o` Discovered
  - `X` Fully Explored (100%)

You can now navigate the world strategically based on your progress.

### New: Zone Selection Window
Clicking a zone on the world map now opens a detailed Zone Info panel.

Information shown:
- Zone name
- Coordinates
- Biome and Era
- Template type
- Difficulty Rating (1–10)
- Current exploration status

Zones are no longer entered immediately by clicking the map —  
you must now press **Enter Zone** from the info panel.

### New: World Slot Templates
Every zone on the world map now uses a world-slot template that defines:
- Biome
- Era
- Difficulty
- Layout generator type
- Zone behavior foundation

This system allows the world to grow with meaningful structure and variety.

### New: Distance-Based World Generation
As you explore outward from the Tutorial Zone:
- World tiles are initialized with appropriate biome/era templates
- Zone difficulty adjusts based on distance from the start
- Each world tile maintains its own metadata, such as:
  - Template ID
  - Biome
  - Era
  - Difficulty Rating
  - World position
  - Unique seed

This lays the groundwork for future biome diversity.

### New: Deterministic Zone Generation
Zones now generate consistently using a unique per-zone seed.

This means:
- A zone’s layout is always the same each time you enter it
- Saves and reloads do not alter previously generated zones
- World exploration feels stable and reliable

### New: Exploration-Based World Unlocking
Exploration now matters more than ever.

- Zones unlock new adjacent world tiles **only** when you fully explore them (100%)
- Exploration progress auto-saves on completion
- World expansion now follows a predictable and rewarding progression loop

### New: Zone Persistence Improvements
The world map is now saved as part of your game file.

Saved data includes:
- All discovered/visited zones
- All world tile metadata (biome, difficulty, template, seed)
- All adjacency unlocks
- The position of your character on the world map

Reloading a game restores the world exactly as you left it.

### Updated: Zone Generation Pipeline
Generated zones now include:
- Proper layout generation using seeded Cellular Automata
- Locked sub-region detection
- Future-ready content scaffolding (`resourceNodes`, `entities`, `pois`)

While zones are still empty in 0.0.70c, the underlying system is now ready for  
the full ecosystem of creatures, materials, and points of interest coming in 0.0.70d.

### UI Improvements
- World Map now has a dedicated view outside the zone screen
- Better separation between Zone View and World Map View
- Improved clarity for exploration and world progression flow
- Entering the world map on game load prevents the “No active zone” issue

### Fixes and General Improvements
- Fixed issues where generated zones logged unnecessary warnings
- Improved save/load reliability for world exploration
- Exploration auto-saving now triggers correctly on 100% completion
- Cleaned and organized zone creation code to prepare for future content
- Updated templates system to support difficulty, biome, and era metadata

### Known Issues
- Difficulty Rating is visible but not yet used for spawn balancing
  (this begins in v0.0.70d).
- Zone content (creatures, resources, POIs) is scaffolded but not yet populated.
- Completed zones and visited zones use similar map symbols —  
  a clearer distinction will be added in a future update.

---

# ProgressCrawl - Patch 0.0.70b  
## **Introducing Locked Subregions**

---

##  **New Feature: Locked Subregions**
Some zones now contain areas that are **cut off from the main region**.  
You’ll notice a special **`L` tile** on the map - this marks a **locked gate**.

- Exploring normally reveals the main region.  
- Locked subregions cannot be explored until the gate is opened.  
- Clicking the **`L` gate** unlocks the passage and opens up the hidden area.  

---

##  **Improved Map Generation**
The zone generator now scans each map layout and:

- Detects separate walkable regions  
- Connects isolated regions using natural corridors  
- Produces clearer and more dynamic shapes  
- Reduces awkward “island” tiles and dead-ends  

---

##  **Exploration Improvements**
- You can now **leave any zone at any time**.  

---

##  **UI & Interaction**
- Tiles are now interactive, allowing direct clicks on locked gates.  

---

# v0.0.70a2 – Data‑Driven Zones (Part 1)

## Overview
This patch introduces the first step toward fully data‑driven zones in ProgressCrawl.  
Gameplay remains unchanged, but the internal structure for creating and managing zones has been refactored to allow future expansion such as procedural map generation, handcrafted layouts, and scripted tutorial sequences.

---

## Added
- **New data file:** `zones.data.js`
  - Holds all static zone definitions.
  - Contains the new `tutorial_zone` layout as a pure ASCII map.
  - Prepares the structure for future generated zones.
- **Tile symbol mapping (`ZONE_TILE_SYMBOLS`)**
  - Keeps existing UI tile symbols intact (`#`, `.`, `L`, `?`).
  - Separates tile *type* (walkable/blocked/locked) from exploration state.

---

## Changed
- **`createDebugZone()` is now fully data‑driven**
  - No more hardcoded tile placement.
  - Now simply calls `createZoneFromDefinition("tutorial_zone")`.
- **Updated `index.html` script load order**
  - Ensures data is loaded before core logic.

---

## Technical Notes
- Exploration visuals remain 100% unchanged.
- All gameplay behavior remains identical to 0.0.70a.
- New structure enables:
  - Handcrafted tutorial progression.
  - Future procedural generators (cellular automata, biome rules, etc.).
  - Modular and scalable zone creation.

---

## Files Added
- `scripts/zones/zones.data.js`

## Files Updated
- `scripts/zones/zones.core.js`
- `index.html`

---

## Patch v0.0.70a - Zone Exploration Core System

This update introduces the first foundation of the new Zone System.  
You now begin your adventure directly inside the Starting Zone and explore it tile by tile.

---

### New: Starting Zone
- After character creation, you immediately begin inside the **Starting Zone**.
- Exploration is paused until you choose to start.
- This will later support story intros and scripted events.

---

### New: Tile-Based Exploration
Zones now feature a full exploration loop:
- Sequential tile revealing
- Exploration progress percentage
- Walkable, blocked and locked tiles
- Zone completion when all tiles are explored

---

### New: Exploration Controls
Added three buttons inside the Zone panel:
- **Explore Next Tile** – reveals the next tile after a short delay  
- **Explore Auto** – automatically explores tiles every few seconds  
- **Stop Exploring** – stops auto‑exploration  

Only one mode can run at a time.

---

### New: Zone Panel Layout
The Zone panel has been redesigned with:
- Centered ASCII tile grid  
- Clean section headers  
- Zone information (name, status, progress)  
- A dedicated **Messages** log  
- A full-height **Discoveries** sidebar  

---

### New: Zone Completion Options
Once the zone reaches 100% explored:
- **STAY** – remain in the completed zone  
- **LEAVE ZONE** – exit the zone (world map coming later)

---

### Improved: Exploration Messages
Each explored tile triggers a short message (e.g. “You uncover a patch of ground.”).  
Messages appear in the new Messages log within the Zone panel.

---

### Improved: Player Flow
- Entering the zone happens automatically after character creation  
- Exploration no longer begins automatically  
- Manual exploration uses the same delay as auto  
- Status indicators now show: *Idle*, *Exploring (Manual)*, *Exploring (Auto)*, *Completed*

---

This completes all goals for **0.0.70a – Zone Core System (Skeleton)**.

---

## Patch v0.0.67 - UI Polish, Smarter Inventory & Movable Panels!

This update focuses entirely on making the UI feel smoother, look cleaner, and give you more control.  
No new gameplay systems yet - just a ton of improvements that make everything more enjoyable and easier to interact with.

---

### New: All-Items Inventory View
You can now switch between:
- **Category View** - the original grouped list  
- **All Items View** - a clean spreadsheet-style layout

The All-Items view gives you:
- One long list of all your items  
- Sortable columns (Name, Category, Rarity, Quantity, Grades)  
- Column-by-column organization just like an RPG stash or MMO bank  
- Category tag added next to each item name for clarity  

Perfect for players who want full control over their inventory.

---

### New: Resize Inventory Columns (Like Excel!)
All columns in the new All-Items view can be resized by dragging the divider lines.

- Drag left or right to shrink or expand any column  
- The layout updates instantly  
- Column widths are saved  
- Makes browsing and organizing a breeze  

---

### New: Auto-Adjusting Inventory Panel
The inventory panel now automatically resizes to fit whatever columns you create.

- No more hidden stats off-screen  
- No need to stretch the panel manually  
- The panel always remains “tight” around the table  

---

### New: Movable Panels
Inventory, Equipment, and Skills panels can now be freely moved around the screen!

- Grab the title bar and drag anywhere  
- Panels stay within the play area  
- They can’t be dragged below the bottom HUD  
- Their position is saved and restored when you return  

---

### Quality-of-Life Improvements
- “Collapse All” and “Expand All” buttons added  
- Categories are sorted alphabetically in All-Items view  
- Column resize handles no longer accidentally trigger sorting  
- Item rows and column lines now align perfectly  
- Grades column now has a proper divider line  

---

### General UI Clean-up
- Consistent spacing and fonts  
- More readable tooltips  
- Better alignment in lists  
- Improved mouse interaction zones  
- Panels no longer overlap awkwardly  

---



## v0.0.66 - Modularization & UI Foundation

### Refactors & Code Structure

- Split the previously monolithic `game.js` into focused modules:
  - `game.creation.js` – character creation logic (base stats, point spend, randomization, creation button).
  - `game.save.js` – save/load system, save list rendering, snapshot helpers.
  - `game.patchnotes.js` – patch notes panel + `CHANGELOG.md` fetch/parsing.
  - `game.screens.js` – simple screen state machine (`start` / `character` / `game`).
  - `game.loot.js` – loot flow, progress bar timer, stat rolling and item instance creation.
  - `game.ui.panels.js` – DOM lookups + button wiring for inventory, equipment, skills, HP bar and loot button.
- Slimmed down the core `game.js` so it now focuses on:
  - Character-derived state (`characterComputed`, `currentHP`).
  - Equipment helpers (equip/unequip → inventory, auto-save hooks).
  - Recompute pipeline (`summarizeEquipmentForCharacter` → `buildCharacterComputedState` → UI updates).
  - Rendering of the Equipment panel, Skills panel, HP bar, and character summary header.
- Kept all global behavior and data formats intact so existing saves remain compatible.

### Inventory & Equipment Stability

- Fixed category collapsing logic in the inventory:
  - Removed the old `collapsed` variable bug that caused JavaScript errors.
  - Collapsed categories now simply skip rendering their stacks, so categories no longer disappear or behave erratically when equipping items or toggling sections.
- Improved equip/unequip flow:
  - Unequipping via the Equipment panel cleanly returns items to the inventory and triggers a stat recompute.
  - Equip / Unequip both now hook into the shared auto-save path so equipment changes are always persisted.
- Fixed an issue where trashing items did not persist:
  - Deleting items from the inventory now correctly updates the save snapshot, so trashed items stay gone after reload.

### UI & Styling

- Extracted tooltip behavior into a dedicated `ui.tooltip.js` module:
  - Centralized tooltip creation, positioning and show/hide logic.
  - Inventory and equipment tooltips now share the same underlying system.
- Modularized the global CSS:
  - Replaced `main.css` with:
    - `styles/base.css` – global look & feel, start/character screens, save list, character creation, header/menu bar, patch notes modal, tooltip styling.
    - `styles/game.panels.css` – loot button, progress bar, HP bar, inventory panel, equipment panel, skills panel, rarity colors, unlock “glow” effect, and inventory row layout.
  - No intentional visual changes; this is a structural cleanup to make future UI/layout work (like resizable inventory and new views) easier.

### Notes

- No new gameplay systems were added in this version.  
- This update is focused on internal structure, stability, and preparing the codebase for upcoming updates.

---



## v0.0.65b - Inventory Category Fix
- Fixed an issue where collapsing an item category and then equipping a weapon or armor would cause all categories beneath it to temporarily disappear.  
All categories now stay visible and behave correctly when equipping, unequipping, or looting items.
- Added a few new items in preparation for exploration, gathering and crafting updates.

---



## v0.0.65 - Character & Combat Revamp

## New Features

### New Combat Calculation System (No combat gameplay though)
Combat has been fully rebuilt. Your character’s Attack, DPS, Crit Chance, Loot Find, and Max HP now scale from:
- Your weapon
- Your attributes (STR / DEX / INT / VIT)
- Your weapon skill levels (new)
- Bonuses from equipped gear

Progression is smoother, weapon upgrades feel impactful, and characters grow in a more meaningful way.

---

### Weapon Skill Levels
Each weapon type now has its own skill:
- Daggers  
- Swords  
- Axes  
- Bows  
- Unarmed  

Higher skill → higher damage with that weapon type.  
Tooltips now show the exact skill requirement for each weapon (however, you can equip any weapon no matter your skills).

---

### Skills Menu Added
A new **Skills** button is now available in the main UI.  
You can view (and for now manually adjust) your weapon skill levels.  
In future updates, skills will increase naturally through gameplay.

---

### Character Sheet Overhaul
The Equipment screen now functions as the full **Character Sheet**.  
It displays:
- Total attributes  
- Max HP  
- Attack  
- Attack Speed  
- DPS  
- Crit Chance  
- Loot Find  

These update instantly when equipping or unequipping items.

---

### HP Bar
A new HP bar has been added below the loot button.  
It shows your current and maximum HP at all times.

---

## Improvements

### Enhanced Weapon Tooltips
Weapon tooltips now include:
- Damage  
- Attack Speed  
- Raw DPS  
- Required skill and your current skill  
- All rolled stats  
- + / – comparison against equipped weapon  

Inventory and equipment tooltips now match in style and information.

---

### Cleaner Inventory Experience
- **Equip** is now on the left; **Trash** on the right.
- Stack headers (e.g., *“Simple Dagger x4”*) no longer show tooltips.
- Only individual items inside the stack show detailed info.
- Sorting updated so **highest-grade items appear first**.

---

## Fixes
- Various minor UI cleanup and consistency fixes.

---

## Balance Updates
- Unarmed and early weapons now scale more smoothly.
- A small base Attack value has been added so very early damage never feels too low.
- Starter weapons now feel more distinct and more rewarding than fighting unarmed.

---

Enjoy the update!

---



## v0.0.61 — Equipment & Stat Polish

### Added
- **Equip / Unequip flow**
  - Every equippable item in the inventory now has an **Equip** button in its row.
  - Equipped items show an **Unequip** button in the Equipment panel that sends them back to the inventory.
  - Equipping and unequipping immediately updates your character’s stats and is saved automatically.

- **Clear character summary in Equipment panel**
  - The Equipment screen now shows:
    - **Attributes:** `STR`, `DEX`, `INT`, `VIT` as `Total (bonus)` so you can see how much is coming from gear.
    - **Derived stats:** `Max HP`, `Attack` (based on current weapon or unarmed), `Crit Chance`, and `Loot Find`.

- **Equipment unlock flow**
  - The **Equipment** menu button is now **locked by default**.
  - It unlocks the first time you loot an equippable item (like a dagger or armor piece).
  - When it unlocks, it gets the same subtle glow + ring effect as the Inventory button to draw attention.

### Changed
- **Attack display**
  - The character summary in the Equipment panel now shows a single **“Attack”** value.
  - The label automatically reflects what you are using:
    - Unarmed → `Unarmed Attack`
    - Weapon equipped → `Attack (using that weapon)`
  - This keeps the UI cleaner and focused on the attack that actually matters for your current setup.

- **Attribute bonuses from gear**
  - Items that grant attribute bonuses (for example, **Bark Chest** with bonus VIT) now:
    - Properly add to the attribute totals (e.g. VIT).
    - Correctly increase **Max HP** based on the new VIT value.
  - The summary shows this as `Total (bonus)`, for example: `VIT: 12 (2)`.

- **Inventory & equipment layout**
  - The **Inventory** and **Equipment** panels are now aligned side by side from the top,
    so they feel like one combined character screen.
  - The **Equip** and **Trash** buttons are grouped together on the **right side** of each item row, 
    making actions more consistent and easier to hit.
  - The Equipment panel uses a tighter column layout, 
    so stat labels and values are closer together and easier to scan.

- **Item bonus stat presentation**
  - Item bonus stats (like crit and loot find) are now only shown when they actually roll a value.
  - If a stat rolls as `0`, it is **not** displayed on the item at all.
  - Tooltips and summary rows use nicer names instead of internal ones:
    - `critChance` → `Crit Chance`
    - `lootFind` → `Loot Find`
    - etc., via a shared label mapping.

### Fixed
- **Equipment bonuses not applying**
  - Fixed an issue where **VIT bonuses from armor** were not reflected in your character stats or max HP.
  - Equipped items now properly feed into the character’s computed attributes and derived stats.

- **Inventory / Equipment buttons after loading a save**
  - Fixed a bug where **Inventory** and **Equipment** menu buttons sometimes disappeared after loading a saved game.
  - The game now:
    - Remembers whether Inventory and Equipment were unlocked for that character.
    - Restores those buttons correctly on load.
    - For older saves without these flags, it intelligently infers unlocks from whether you have items or equipped gear.

- **Rarity weight safety**
  - Hardened the loot roll logic so it falls back to default rarity weights if the config is missing or invalid.
  - This prevents rare cases where item generation could break due to misconfigured rarity settings.

---

## v0.0.60 — The Equipment Update

This update introduces the first version of the equipment system, 
allowing your character to gear up, gain bonuses, and grow stronger based on what you wear. 
The character sheet has also been expanded with a proper overview of your stats and item effects.

### New: Equipment System
You can now equip items directly onto your character.

Available equipment slots:
- Weapon
- Chest Armor
- Leg Armor
- Footwear
- Trinket

Equipped items:
- Display in the new Equipment panel
- Show their rarity, quality, and stats
- Include a clear tooltip with an “Equipped” indicator
- Can be unequipped at any time


### New: Character Stats Overview
The Equipment panel includes a full character summary that updates immediately when gear changes.

Attributes:
- Strength (STR)
- Dexterity (DEX)
- Intelligence (INT)
- Vitality (VIT)

Each attribute shows:
- Total value
- Bonus gained from gear (for example: `STR: 12 (2)`)

Derived stats:
- Maximum Health
- Attack (Unarmed or Melee depending on your weapon)
- Critical Chance
- Loot Find


### Inventory Improvements
Inventory entries for wearable items now include an Equip button.

Features:
- Equip items directly from inventory
- Works correctly even when items are stacked
- Only one copy of an item is equipped or removed from the stack
- Inventory and Equipment panels can be open simultaneously


### Saving and Loading
Saved characters now remember:
- All equipped items
- All inventory contents
- Character attributes
- Feature unlocks (such as inventory access)

Loading a saved game restores your character exactly as you left them.


### Fixes and General Improvements
- Fixed equipping items from a stack removing more than one item
- Fixed incorrect stat calculations when loading or creating characters
- Improved button visibility logic for new and loaded games
- Improved tooltip formatting and consistency across both panels
- Cleaned UI layout to ensure Inventory and Equipment align properly
- Equipping armor now adds and calculate bonus VIT / HP correctly.
- Equip button moved to the right side right besides the Trash-button
  (make sure you press the right button since Trash doesn't have any confirm-system yet).

### Known Errors/Bugs:
- Attack stat doesn't take item damage into consideration.
  (This will be fixed in the revised Attack/Damage/Skill system).
-

### Coming Soon
Work has begun on a revised Attack and Damage system:

- Weapons will have both “maximum potential damage” and “your actual damage”
- Skills will determine how effectively you can use different weapon types
- Attack will represent expected average performance rather than raw stat values
- Unarmed combat will be treated as its own weapon class

This foundation is now in place for the next major update where we will revise the damage/attack calculations.

---

## v0.0.57 (WIP) – Equipment panel & character summary

### Added
- New Equipment menu button next to the Inventory button on the game screen.
- New Equipment panel displaying:
  - Equipped slots: Weapon, Chest, Legs, Feet, Trinket.
  - Per-slot item names with quality and rarity coloring.
  - `[Unequip]` button per slot which returns items to the inventory.
- Character summary in the Equipment panel:
  - Attributes shown as `TOTAL (bonus)` for STR, DEX, INT, VIT.
  - Derived stats:
    - Max HP
    - Active Attack (Melee/Ranged/Unarmed)
    - Crit Chance (%)
    - Loot Find (%)

### Changed
- Equip buttons now share styling with Trash buttons for visual consistency.
- Inventory unlock now also reveals the Equipment button and allows both panels
  to be open at the same time.

### Notes
- Tooltips for equipped items match inventory tooltips but include an
  additional “Equipped” label under the Quality line.

---

## v0.0.56 (WIP) – Equipment saving and core equip flow

### Added
- Save system now persists equipped items:
  - `saveCurrentGame()` stores `equipped` using `getEquippedSnapshot()`.
  - `loadSave()` restores equipment with `loadEquippedFromSnapshot()` if present.
- New helper in `inventory.js` (conceptually):
  - `getEquipSlotForItem(item)` – resolves which slot an item belongs to (e.g. weapon).
  - `equipOneFromInventory(stackKey, itemIndex)` – equips a single instance from
    a stack, removes it from inventory, and returns previously equipped items
    back into the inventory.

### Changed
- Starting a new game now clears equipped items via `loadEquippedFromSnapshot(null)`.
- After loading a save, character stats are recomputed based on both attributes
  and equipped items.

### Notes
- Equip button UI is partially planned: one Equip button per rolled item line
  next to the Trash button. The actual Equipment panel and Unequip buttons will
  be added in the next steps.

---

## v0.0.55 (WIP) – Weapon item extensions

### Added
- Added `slot: "weapon"` and `attackType: "melee"` to Rusty Dagger and Simple Dagger.
- Added randomized weapon stats for both daggers:
  - `critChance` (in %)
  - `lootFind` (in %)
- These stats scale automatically with item quality tiers.

### Notes
- Damage and attackSpeed remain as before.
- Only weapons have these new properties; non-weapons remain unchanged.

---

## v0.0.54 (WIP) – Wire character & equipment math

### Added
- New `characterComputed` state in `game.js` to hold:
  - Base attributes
  - Total attributes (including bonuses)
  - Derived stats (Max HP, Melee/Ranged Attack, Crit Chance, Loot Find, Active Attack).
- Added `recomputeCharacterComputedState()` helper in `game.js` to:
  - Pull equipment bonuses via `summarizeEquipmentForCharacter()`.
  - Build the full computed state via `buildCharacterComputedState(...)` from `character.js`.
  - Log the result for debugging.

### Changed
- After creating a new character and starting the game, the character's full
  computed state is now recalculated once and logged to the console.

### Notes
- No visible UI changes yet; the game should behave the same, but the console
  will now show the computed character stats after starting a new character.

---

## v0.0.53 (WIP) – Equipment core module

### Added
- New `equipment.js` module to manage equipped items and their bonuses.
- Defined equipment slots for v0.1:
  - `weapon`, `chest`, `legs`, `feet`, `trinket`.
- Added helpers:
  - `equipItemToSlot(slot, item)` – equips a (copied) item into a slot and returns the previously equipped item.
  - `unequipSlot(slot)` – clears a slot and returns the unequipped item.
  - `getEquippedSnapshot()` / `loadEquippedFromSnapshot(snapshot)` – serialize and restore equipped items for saving/loading.
  - `summarizeEquipmentForCharacter()` – aggregates attribute and stat bonuses
    and detects the weapon's attack type for the character calculations.

### Notes
- Attribute bonuses (STR/DEX/INT/VIT), HP bonuses, and direct melee/ranged attack
  bonuses are supported in the data model but currently default to 0 until we
  add items that provide these stats.
- Crit chance and Loot Find bonuses will be drawn from item `stats` values
  (e.g. `stats.critChance`, `stats.lootFind`) when we extend weapon items.


## v0.0.52b (WIP) – Character math module

### Added
- New `character.js` module to centralize all character calculations:
  - Extracts base attributes from the current character.
  - Combines base attributes with bonus attributes from equipment/buffs.
  - Computes derived stats:
    - Max HP
    - Melee Attack and Ranged Attack
    - Crit Chance (%)
    - Loot Find (%)
    - Active Attack, which switches between:
      - `Attack (Melee)` when wielding a melee weapon
      - `Attack (Ranged)` when wielding a ranged weapon
      - `Unarmed Attack` when no weapon is equipped
- Added `buildCharacterComputedState(character, equipmentSummary)` as the
  main helper to get:
  - Base attributes
  - Attribute totals + bonuses
  - All derived stats in one object.

### Notes
- All values remain full-precision floats; rounding/formatting to two decimals
  will be handled in the UI layer later.
- Equipment bonuses are wired via a generic `equipmentSummary` object, which
  will be implemented in the upcoming `equipment.js` module.

---

## v0.0.52 (WIP) – Character config groundwork

### Added
- Added `GAME_CONFIG.character` with tunable values for:
- Base HP and HP per VIT.
- Base crit chance and crit per DEX.
- Loot Find gained per INT.
- Attack scaling factors for melee and ranged builds.
- Added `GAME_CONFIG.loot.rarityWeights` and `GAME_CONFIG.loot.lootFindBias` to centralize
  rarity weights and control how Loot Find subtly biases rarities.

### Changed
- Updated header text and internal version number from v0.0.51 to v0.0.52 for the
  character/equipment branch.

---

## v0.0.51 — Quality tweaks & Polish

### Added
- Reworked the item quality system. Quality now ranges from **F0** (worst) to **S9** (best),
  replacing the old F9 → S1 format so that higher numbers always represent better quality within a tier.
- Updated all quality-based calculations and sorting to use the new F0–S9 ladder, keeping stat multipliers smoothly scaled from low to high quality.

---

## v0.0.50 — Character System & Save Slots

### Added
- **Complete Character Creation System**
  - Players can create unique characters with custom or randomly generated names.
  - Classic stat system implemented: STR, DEX, INT, VIT.
  - Stats start at a base value of 5 with 20 distributable points.
  - Supports manual point allocation and fully random stat distribution.

- **Multi-Character Save Slot System**
  - Characters are saved locally on the device using `localStorage`.
  - Each save slot contains character name, stats, inventory, and feature unlock states.
  - Added load and delete functionality for managing multiple characters.
  - Auto-save triggers after every loot action to ensure persistence.

- **New Game Flow with Multiple Screens**
  - **Start Screen**: Choose to create a new character or load an existing one.
  - **Character Creation Screen**: Enter name, adjust stats, randomize, and finalize character.
  - **Game Screen**: Displays loot button, inventory, and character summary.

- **Character Summary Bar**
  - Shows current character name and stat overview (STR/DEX/INT/VIT) during gameplay.

- **Feature Unlock Persistence**
  - Inventory unlock state is now saved per character.
  - Ensures the UI behaves consistently when loading existing characters.

- **Menu Bar Framework for Future Features**
  - Inventory button moved into a top menu bar.
  - Supports seamless future additions such as Equipment, Crafting, Skills, etc.

- **Patch Notes Button**
  - Added a “Patch Notes” button in the header that opens an in-game panel showing the latest version changes.

---

## v0.0.40b — Tooltip Behavior Fix
### Fixed
- Tooltip remaining on screen after trashing an item.
  - Added `Tooltip.hide()` method in `ui.js`.
  - Trash button in `inventory.js` now calls `Tooltip.hide()` before removing the item.

### Changed
- Slight improvements to tooltip control and cleanup flow.

---

## v0.0.40 — Refactoring & Code Cleanup
### Added
- New modular file structure:
  - `config.js`
  - `items.js`
  - `quality.js`
  - `ui.js`
  - `inventory.js`
  - `game.js`
- Centralized configuration settings in `config.js`.
- Separated quality, item generation, UI, and inventory logic into dedicated scripts.
- Improved project structure to prepare for future systems (equipment, combat, zones).

### Changed
- Moved all tooltip logic to `ui.js`.
- Rewrote inventory rendering into `inventory.js` for better clarity.
- Streamlined loot generation flow in `game.js`.
- Improved internal quality system readability and organization.

### Fixed
- Minor layout inconsistencies after script refactoring.
- Several small issues caused by script load order during the move.

---

## **v0.0.39 — Global Quality Distribution Update**
### Added
- New unified global quality ladder replacing tier-based rolling.

### Changed
- Quality probabilities now follow an exponential curve.
- Each step from F9 → S1 is strictly less common than the previous.

### Fixed
- Inconsistencies where certain sub-qualities were more common than intended.

---

## **v0.0.38 — Final Tooltip Refinements**
### Changed
- Refined tooltip spacing and layout for all items.
- Standardized stat alignment and display formatting.

### Fixed
- Remaining double-line issues between rarity, quality, and stats.

---

## **v0.0.37 — Footer Text Improvements**
### Added
- Improved version label and text clarity.

### Fixed
- Version text clipping on narrow viewports.
- Alignment issues with footer bar content.

---

## **v0.0.36 — Footer Header Bar**
### Added
- Bottom-fixed UI bar showing game title and version.
- Visual styling consistent with overall theme.

### Changed
- Inventory and UI elements repositioned to avoid overlap.

---

## **v0.0.35 — Sorting System**
### Added
- Sorting options for Name, Rarity, and Quantity.
- Sort direction toggling with persistent state.

### Changed
- Category grouping now integrates correctly with sorting logic.

---

## **v0.0.34 — Column Layout for Inventory**
### Added
- Multi-column layout for inventory summary rows.
- Dedicated columns for item name, quantity, and quality range.

### Changed
- Improved readability and layout stability.

---

## **v0.0.33 — Collapsible Categories**
### Added
- Expand/collapse functionality for inventory categories.
- Arrow indicators showing state (expanded/collapsed).

### Changed
- Inventory render persists collapsed state between refreshes.

---

## **v0.0.32 — Category System**
### Added
- Category grouping within the inventory.
- Visual category headers with gradient separators.

### Changed
- Standardized category names across all items.

---

## **v0.0.30 — Inventory Rendering Rewrite**
### Added
- Collapsible item stacks for identical items.
- “Trash” button for removing individual item instances.

### Changed
- Rewritten render logic for stability and clarity.

### Fixed
- Multiple refresh issues causing stacks to collapse unexpectedly.
- Tooltip alignment issues on refreshed items.

---

## **v0.0.27 — Tooltip Spacing Fixes**
### Fixed
- Incorrect or uneven spacing in tooltip block layout.
- Extra line breaks between description and stats.
- Misaligned rarity and quality labels.

---

## **v0.0.26 — General UI Improvements**
### Changed
- Updated rarity color palette for accessibility.
- Improved hover/active animations for Loot button.

### Fixed
- Tooltip shadow and padding inconsistencies.

---

## **v0.0.24 — Tooltip Layout Update**
### Added
- Colored rarity labels in tooltips.

### Changed
- Complete reformat of tooltip content order and spacing.

---

## **v0.0.22 — Inventory Data Structure Update**
### Added
- Support for storing multiple item instances with unique stats & qualities.

### Changed
- Revised stacking logic to differentiate identical vs. non-identical items.

---

## **v0.0.20 — Quality System**
### Added
- F–S quality tiers.
- Sub-levels (1–9) for finer granularity.
- Stat multipliers tied to quality.

---

## **v0.0.18 — Item Stats Framework**
### Added
- Stat ranges for weapons.
- Randomized stat rolling engine.

### Changed
- Tooltips updated to display rolled stats.

---

## **v0.0.15 — Tooltip System**
### Added
- First implementation of dynamic tooltips.
- Basic rarity + description display.

---

## **v0.0.12 — Basic Item Definitions**
### Added
- First batch of item templates in `items.js`.
- Rarity tagging for all items.

---

## **v0.0.10 — Initial Prototype**
### Added
- Initial project structure.
- Central Loot button.
- Basic inventory panel (hidden by default).
