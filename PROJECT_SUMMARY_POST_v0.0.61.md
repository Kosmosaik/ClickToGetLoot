
# ProgressCrawl – Project Summary (Up to Version 0.0.61)

## Introduction
ProgressCrawl (CTGL) is a web-based loot-driven RPG prototype built with HTML, CSS, and JavaScript. The project focuses on a simple core loop (click → loot → upgrade) with expanding RPG systems such as equipment, stats, rarity, quality tiers, and derived combat values.

This summary consolidates *everything implemented, redesigned, or discussed* in the development branch from the beginning of this chat up to **version 0.0.61**, ensuring context continuity for transitioning to a new chat.

## Core Systems Implemented
### 1. Loot System
- Player clicks a central loot button.
- A progress bar fills based on config-driven timing.
- When completed, the game rolls:
  - **Item template**
  - **Rarity**
  - **Quality tier**
  - **Stat rolls** (with stats removed if rolled as exact 0)
- First item unlocks **Inventory UI**.
- First *equippable* item unlocks **Equipment UI** (new in v0.0.61).

### 2. Items, Rarity & Quality
- Items defined in `items.js`.
- Rarity tiers: **Abundant, Common, Uncommon, Rare, Exotic, Unique**.
- Quality tiers: **F0 → S9** with substats for each letter 0-9 (F0 - S9)
- Quality applies a multiplier to stat rolls.
- Weapon templates have:
  - `damage`
  - `attack_speed`
  - optional stats: `crit_Chance`, `loot_Find`, etc.
- Non-zero rolled stats are displayed; zero values are hidden.

### 3. Inventory System
- Stacks items by name.
- Groups duplicate items by identical **quality + stat signature**.
- Maintains quantity counts.
- Sorting:
  - by name
  - by rarity
  - by quantity
- Categories:
  - Weapons, Armor, Crafting, Resource, Materials, etc.
- Each stack expands into item variants.
- **Equip** and **Trash** buttons added to each individual item row.
- Full tooltip support.

### 4. Equipment System
Added in 0.0.60:
- Slots:
  - Weapon
  - Chest
  - Legs
  - Feet
  - Trinket
- Items specify:
  - `slot`
  - `attackType` (melee or ranged)
- Equipping removes the item from inventory.
- Unequipping returns it to inventory.
- Equipment panel displays:
  - All equipped slots
  - Tooltips for equipped items
  - Attribute summary: **STR, DEX, INT, VIT (total + bonus)**
  - Derived stats: **HP, Attack, Crit, LootFind**

### 5. Character Attributes
Base stats: STR, DEX, INT, VIT.
- Player distributes stats during character creation.
- VIT gives **5 HP per point**.
- Attributes influence attack:
  - Melee:
    - STR × 2.0
    - DEX × 0.2
  - Ranged:
    - DEX × 2.0
    - STR × 0.2
  - If no weapon:
    - Unarmed damage = Melee formula without weapon damage.

### 6. Attack System (Temporary Hybrid Model)
- Equipped weapon defines **base damage**.
- Attack value shows **Final Attack Power**, calculated as:
  - `(weapon damage × 0.8) + (character melee_or_ranged_value × 0.2)`
- This is a placeholder until the full **skill-based weapon proficiency** system is implemented in 0.0.70+.

### 7. Save/Load System
Stores:
- Character name + base stats
- Inventory
- Equipment
- Unlock flags (inventoryUnlocked, equipmentUnlocked)
- Autosaves after every loot and equip action
- Loads characters into full game state
- Fix implemented: UI now properly respects saved unlock states.

---

## Version Changes Covered in This Summary

### v0.0.60 – Equipment Update
- Added full equipment system.
- Added derived combat stats.
- Added equipment panel UI.
- Added equip/unequip functionality.
- Added stat bonus integration.
- Modified inventory grouping, sorting, and tooltips to support equipment.

### v0.0.61 – Polish & Fixes
- Equipment button unlocks only when first equippable item drops.
- Button unlock animations match inventory unlock.
- Removed camelCase stat labels.
- Removed Attack (Melee/Ranged) UI split → now unified as "Attack".
- Added stats cleanup (removal of 0-value rolled stats).
- Fixed loading bug where inventory & equipment buttons disappeared.
- Improved tooltip formatting & CSS spacing.
- Moved equip/trash buttons to proper position inside right-aligned actions container.

---

## Planned Systems (Roadmap Context)

### Planned for 0.0.70+
**Attack / Damage Overhaul**
- Damage range generation (min-max)
- Weapon proficiency system (skill-based effective damage)
- Hit rate mechanics

### Future Zones/Exploration
- Unlocking new zones
- Enemy difficulty scaling
- Resource & material gathering

### Future Crafting System
- Stations
- Recipes
- Materials progression

### Future Loot Affix/Suffix System
- Prefix: “Sharp”, “Sturdy”, etc.
- Suffix: “of Precision”, “of the Ox”
- Stat ranges

---

## What the Next Chat Should Immediately Know
- Game is already fully functional with inventory, loot, equipment, and stat systems.
- Attack system is temporary and will be redesigned.
- Items are rolled from templates with quality scaling.
- Equipment affects derived stats.
- Save/load preserves everything and UI unlocks are now correctly restored.
- Player wants:
  - Stat-based and skill-based attack system in future
  - More loot generation complexity (affixes)
  - Exploration zones
  - Clean UI improvements
  - Continued expansion of RPG systems


  More in depth summary of the revised attack system with skills etc:

  # Combat System – Attack, Damage & Skill Mechanics (Design Draft)

## 1. Overview
ClickToGetLoot’s combat system is being developed around three interacting components:

1. **Base Attributes** (STR, DEX, INT, VIT)  
2. **Weapon Damage** (the weapon’s true maximum potential)  
3. **Weapon Skills** (the character’s proficiency with each weapon type)

The goal is to create a system similar in spirit to *Entropia Universe*, where:
- A weapon has a **true maximum damage**,  
- But the player can only access its full potential if they have **sufficient skill**,  
- And skill progression affects damage consistency, hit rate, and performance.

This ensures meaningful item progression and character progression.

Using a powerful item when not having the skills for it will drain durability on the item much faster.
You can repair an items durability but everytime you repair an item, the integrity decreases. 
When the integrity reaches 0, you can no longer repair the item or use it. 
You can salvage the item to get some materials back so you don't lose everything.

---

## 2. Weapon Damage: “True Damage”
Every equippable weapon has a **True Damage (TD)** value defined in its item template:

```
Damage: 8
```

This is the **maximum damage the weapon can deliver** when used by a fully competent character.

### Damage Roll Range
Actual damage rolls vary slightly each hit:

```
Roll = randomBetween(TD * 0.70, TD * 1.00)
```

(Exact values are subject to balancing.)

---

## 3. Weapon Skill
Characters will eventually have a unique skill level for each weapon category:

- Dagger Skill  
- Sword Skill  
- Axe Skill  
- Bow Skill  
- Unarmed Skill  
- Etc.

Skill values range between:

```
0.00 → 1.00  (0% to 100% mastery)
```

Skill influences:

1. **Effective Damage (ED)**  
2. **Damage consistency (future feature)**  
3. **Minimum damage floor (future feature)**  

All weapons will have it's own "Skill level required".
Early basic weapons will have low skill level requirement while late game weapons will have higher skill level req.

---

## 4. Effective Damage (ED)
If a player is not sufficiently skilled, they cannot wield the weapon at full power.

Example weapon:

```
True Damage = 8
```

Player's Dagger Skill:

```
Skill = 0.54
```

### Formula
```
Effective Damage (ED) = TD * Skill
```

Result:

```
8 * 0.54 = 4.32
```

### UI Display
Inventory tooltip:

```
Damage: 8 (4.32)
```

Where:
- **8** = weapon’s true potential  
- **4.32** = player’s maximum usable damage with current skill  

---

## 5. Unarmed Combat
Unarmed combat acts like a weapon with its own skill:

```
Unarmed Damage = STR-based formula
```

Plus:

```
Unarmed Effective Damage = BaseUnarmedDamage * UnarmedSkill
```

This prevents unarmed STR builds from outperforming weapons, while still enabling unarmed-focused builds later.

---

## 6. Attack Value (AV)
The **Attack** value shown in the UI will represent **the average damage per hit**, not the maximum damage.

### Formula
```
Attack Value ≈ EffectiveDamage * 0.85
```

This approximates the average roll between 70%–100% of ED.

Example:

```
ED = 4.32
Attack ≈ 4.32 * 0.85 = 3.67
```

This is the number displayed as **Attack**.

---

## 7. Attribute Influence
Attributes modify the combat system, but do **not** replace ED:

### STR
- Improves melee performance  
- Slightly increases melee Effective Damage  
- May increase skill gain for melee weapons  

### DEX
- Improves ranged performance  
- Slightly increases ranged Effective Damage  

### INT
- Reserved for future magic systems  

### VIT
- Increases HP (already implemented)

**Important:**  
Attributes no longer add raw fixed damage on top of weapons.  
Instead, they improve **skill scaling** and **effectiveness**, preserving weapon identity.

---

## 8. Hit Rate & Damage Consistency (Future Feature)
A more advanced system will later adjust minimum roll ranges:

### Low skill:
```
Damage roll = 5%–100% of ED
```

### High skill:
```
Damage roll = 70%–100% of ED
```

This creates:
- More “glancing” hits at low skill  
- More consistent solid hits at high skill  

Optional miss chance / fumble values can also be layered in later.

---

## 9. UI Display Rules

### Inventory tooltip
```
Damage: 8
(Your max: 4.32)
```

### When equipped
Shows the **Attack** (average effective damage):
```
Attack: 3.67
```

### Character screen
Only one attack value is shown:
- If weapon is melee → show Attack  
- If weapon is ranged → show Attack  
- If no weapon → show Unarmed Attack  

No dual values appear simultaneously.

---

## 10. Summary of System Benefits

✔ Rewards skill progression  
✔ Early powerful items feel exciting but not overpowered  
✔ Allows deep weapon specialization builds  
✔ Keeps unarmed balanced without removing STR relevance  
✔ Makes loot meaningful long-term  
✔ Enables future combat layers (crit, hit rate, stance, etc.)  
✔ Clean UI explanation of true damage vs. effective damage  

---

This document is ready to paste into your main summary or ROADMAP file.


