# ProgressCrawl — Roadmap & Technical Overview for Next GPT Assistant  
## Combined Summary for Versions 0.0.70b → 0.0.70c  
_Last updated by previous assistant — continue development from here._

---

# 📌 Overview

ProgressCrawl is transitioning from simple pre-defined zones into a **procedural world exploration system**.  
Version **0.0.70b** introduced robust *generated zone shapes, locked subregions, and exploration mechanics*.  
Version **0.0.70c** will introduce *world-slot metadata, lazy zone generation, template-driven procedural content, and world expansion rules*.

This file merges:
- The **0.0.70c roadmap**
- The **design direction for era/biome/template-based content**
- The **next steps needed for future assistants**

Use this document as your anchor before making any new changes.

---

# ✔️ Completed in 0.0.70b (Context)

### 1. Cellular Automata Zone Generation
- Zones now generated using CA smoothing (configurable fill chance + iterations).
- Shapes are natural, varied, and support multiple walkable regions.

### 2. Multi-Region Detection
- System detects all contiguous walkable regions.
- Largest region = **primary**, other regions = **locked subregions**.

### 3. Automatic L‑Gate Placement
- A 1-tile corridor is created between primary and secondary regions.
- A special **L tile** (locked gate) is placed.

### 4. Secondary Region Locking
- Secondary region tiles become temporarily blocked.
- Gate tile unlocks region on click → restored original floor tiles.

### 5. Sequential & Random Exploration
- Exploring reveals tiles one per tick or manually one-by-one.
- UI now updates correctly without camera auto-scroll.
- Early bugs (instant full-reveal) were fixed.

### 6. Leave-Zone Flow
- Players may now leave a zone at any time.
- Leaving marks worldmap tile as VISITED.

---

# 🔮 Goals for Version 0.0.70c  
## *World Slot Generation & Era/Biome Unlocking*

0.0.70c moves the project from **generated zones** to a **generated world**.

The goal is to make each world map tile a *Slot* that contains:
- ERA  
- BIOME  
- TEMPLATE ID  
- SEED  
- zoneGenerated state  

---

# 0.0.70c — FULL ROADMAP (Merged)

## 1. Extend World Map Tile Model
Add metadata fields to each tile:

```
tile.era
tile.biome
tile.templateId
tile.seed
tile.zoneGenerated = false
```

These are assigned **when the tile becomes DISCOVERED**, not at world creation.

---

## 2. Zone Templates (Core Feature)

A central structure:

```js
ZONE_TEMPLATES = {
  primitive_forest_easy: {
    era: "primitive",
    biome: "forest",
    generator: { width, height, fillChance, smooth, ... },
    difficulty: 1,
    spawnTables: {
      entities: "...",
      resourceNodes: "...",
      pois: "..."
    }
  },
  ...
}
```

Templates define:
- Which **era** they belong to  
- Which **biomes** they fit  
- Generator parameters  
- Spawn table set  

This becomes the backbone of procedural content going forward.

---

## 3. Slot Assignment on Reveal

When a tile becomes DISCOVERED:
- Choose **ERA** (based on game progression)
- Choose **BIOME** (regional logic)
- Choose **zone template**
- Roll & store **seed**

This enables deterministic regeneration without storing full zones.

---

## 4. Lazy Zone Generation  
When entering a world tile:

```
if (!tile.zoneGenerated):
    generate zone using ZONE_TEMPLATES[tile.templateId] + seed
    store zone
    tile.zoneGenerated = true
```

This keeps the world light and scalable.

---

## 5. World Expansion Through Exploration

New rule:

> When a player fully visits a world tile, the **four orthogonal neighbors** become DISCOVERED.

This produces a fog-of-war expansion and ensures we unlock more zones than just tutorial neighbors.

---

# 🌱 Future Content System (Foundation for Next Versions)

0.0.70c is the foundation for **enriching zones with:**
- entities  
- resource nodes  
- POIs  
- hazards  
- biome/era-specific loot tables  

Key components:

---

## 1. Spawn Tables  
Spawn tables determine *what can appear* in a zone.

Example resource node table:

```js
SPAWN_TABLES["primitive_forest_resources_t1"] = {
  rolls: 40,
  entries: [
    { id: "berry_bush", weight: 30 },
    { id: "herb_patch", weight: 20 },
    { id: "fallen_log", weight: 10 },
    { id: "stone_deposit", weight: 8 },
    { id: "rare_mushrooms", weight: 2 },
  ]
};
```

There will later be separate spawn tables for:
- entities  
- POIs  
- terrain features  
- rare events  

---

## 2. Entities + POIs With Their Own Loot Tables

Entities become definable:

```js
ENTITIES["forest_bandit"] = {
  era: "primitive",
  biomes: ["forest"],
  difficultyRange: [1, 2],
  lootTableId: "loot_forest_bandit"
};
```

POIs likewise:

```js
POIS["abandoned_camp"] = {
  tags: ["camp", "human"],
  lootTableId: "loot_abandoned_camp"
};
```

This keeps content modular and highly extensible.

---

## 3. Deterministic Spawn Placement  
Spawn logic uses:
- template settings  
- zone seed  
- spawn tables  

Meaning the zone is:
- reproducible  
- persistent across loads  
- unique per world  

This is essential for future:
- boss systems  
- treasure maps  
- crafting resource distributions  
- event triggers  

---

# 🔧 Recommended Next Implementation Steps

1. **Add world-slot metadata fields to worldmap.core.js.**
2. Create helper:  
   `assignSlotProperties(tile)`  
   which assigns era, biome, template, seed.
3. Implement DISCOVER event → metadata assignment.
4. Implement world expansion rule:  
   When visiting a zone, reveal orthogonal neighbors.
5. Create minimal template set:
   - primitive_forest_easy  
   - primitive_hills_easy  
6. Update zone generator to accept:
   - template config  
   - seed  
7. Leave the content layer empty for now — implemented in 0.0.70d+.

---

# 🧠 Notes for Next Assistant

- **Do NOT generate zones at world creation anymore.**  
  Everything is lazy-loaded based on slot metadata.

- **The differences between 0.0.70b and 0.0.70c are mostly world-level.**
  Zone generator remains similar, but now takes instructions from templates.

- **Keep all new logic modular.**  
  Templates, spawn tables, and era/biome rules should remain highly decoupled.

- **Ask user before adding new content formats.**
  They want clarity and granular control.

- **Zones will soon contain entities, nodes, POIs.**  
  Prepare data structures, but don’t implement them yet unless requested.

---

# ✅ Ready to Continue Development

This file should give any future assistant enough context to immediately resume building:

- World slot metadata  
- Template binding  
- Lazy generation  
- World-progression unlocking  
- Foundation for content ecosystems

Use this as the authoritative guide until 0.0.70d begins.
