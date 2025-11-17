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
