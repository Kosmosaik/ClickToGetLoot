
# Zones & World Map – Design Document (v1)
Foundational design for Update **0.0.70 – Exploration (Zones)**

## 1. Overview

Zones are the core exploration regions of the game.  
Each Zone is a fully pre-generated area composed of tiles, containing resources, entities, locations, POIs, blocked regions, and locked areas determined by its biome and difficulty.

Zones are **persistent per character**, retaining exploration progress, depletion states, defeated entities, POI outcomes, and other runtime data.

While the Zone’s structural content is entirely pre-generated, **dynamic events** such as ambushes, boss spawns, weather changes, or other scripted events may occur randomly during exploration.

The World Map is a grid of Zones, initially hidden by Fog of War. Only the Starting Zone is visible at character creation; surrounding Zones become visible through adjacency.

---

## 2. Zone Data Model (Conceptual)

### Identity
- `zoneId`
- `biomeId`
- `difficultyRating`
- `isStartingZone`
- `generationSeed`

### Structure
- `tileMap` (walkable, blocked, locked)
- `tilesExplored`
- `tilesTotal`
- `explorationPercent`
- Pre-generated placements for:
  - Resources  
  - Entities  
  - Locations  
  - POIs  
  - Locked regions

### Content
All static content is generated before the player enters the Zone:
- Resource Nodes (trees, stone clusters, herbs, ores, etc)
- Entities (ambient creatures, animals, enemies)
- Locations (sub-zones)
- POIs (traps, puzzles, stashes, objects)
- Locked regions & their gateways

### Dynamic Elements
Triggered randomly during exploration:
- Weather changes (starting from a pre-generated default state)
- Ambushes
- Roaming enemy appearances
- Boss spawns
- Disasters (storms, quakes, etc)
- Travelling merchants / wanderers
- Seasonal effects
- Scripted zone events

These are *not* tied to tile pre-generation.

### Runtime State
- Discovery states  
- Node depletion  
- Entity defeat states  
- POI completion  
- Respawn timers  
- Dynamic event history  

Zones save mid-progress and remain persistent across sessions.

---

## 3. World Map & Fog of War

Zones appear on a grid Map.

### Visibility States
1. **Void (Fog of War)** – hidden, ungenerated  
2. **Discovered** – visible but not entered  
3. **Visited** – entered at least once  
4. **Completed** – 100% explored; still revisit-friendly  

### Generation Timing
Zones are generated when they become discovered on the map  
(not when entering them).

This ensures a consistent world layout.

---

## 4. Tile Types & Visual Language (Inside a Zone)

Each Zone is displayed as a tile grid with clear symbols:

| Tile | Symbol | Notes |
|------|--------|-------|
| Unexplored Walkable | `?` | Hidden tile, counts toward exploration when revealed |
| Explored Walkable | `•` | Revealed tile; shows biome coloration |
| Blocked / Inaccessible | `X` | Natural barriers; not counted toward exploration |
| Locked Tile | `!` | Gateway tile; unlocks hidden subregions |

As the player explores, tiles are revealed one-by-one, exposing the pre-generated content placed on them.

---

## 5. Zone Generation

### Generation Steps
1. **Shape Generation**  
   - Noise masks, cellular automata, or simple rectangles  
2. **Connectivity Pass**  
   - Ensures at least one large walkable region  
3. **Locked Region Generation**  
   - Hidden secondary areas behind a gated tile (`!`)  
4. **Biome-Driven Content Placement (Static)**  
   - All resources placed based on biome+difficulty tables  
   - All entities placed (ambient and hostile)  
   - All locations placed  
   - All POIs placed  
5. **Default Weather Generation**  
   - Sets initial weather state for the Zone  

Everything above is **done before entering the Zone**.

---

## 6. Difficulty System

Each Zone receives a difficulty rating determined by:
- Character progression (weighted influence)
- Random variability (significant variance allowed)

Difficulty influences:
- Resource rarity weights  
- Entity types & spawn weights  
- POI density  
- Location quality  
- Overall danger rating  

Hard zones may appear near the Starting Zone; easy zones may appear far away.

---

## 7. Exploration Loop

Exploration reveals pre-generated map content.  

### Exploration Tick
Every 2–5 seconds:
1. A tile is revealed  
2. Its pre-generated content (if any) is added to the discovery list  
3. Chance-based **dynamic events** may trigger  
4. `tilesExplored` increases  

### At 100%
A menu appears:
- **[STAY]** – continue interacting with discovered content  
- **[LEAVE ZONE]** – return to World Map  

Static content = deterministic  
Dynamic events = random per exploration tick

---

## 8. Resource Respawn Rules

When a resource node is gathered:
- Mark as depleted  
- Start individual respawn timer (e.g., 2–4 in-game days)  
- On respawn:
  - Place at a new valid location  
  - Use biome/difficulty rules  
  - Reroll grade and subtype  

Zones remain fresh upon revisits without being identical.

---

## 9. Starting Zone

Functions as a normal Zone but with:
- Curated tables  
- Predictable difficulty  
- Controlled biome contents  

Later additions:
- Handcrafted quests  
- Predefined node placements  
- Scripted introduction events  

---

## 10. Summary

Zones are **mostly deterministic**: every node, creature, location, POI, and locked region is pre-generated and persists exactly as-is.

Exploration **reveals** this content rather than spawning it.

Only **events** (weather shifts, ambushes, bosses, disasters, wandering NPCs, etc.) are random and triggered by exploration ticks.

The World Map supports a growing, persistent world with visibility tied to adjacency and Fog of War.

This structure forms the foundation for Update **0.0.70 – Exploration**, split into:

1. 0.0.70a – Zone Skeleton  
2. 0.0.70b – World Map + Transitions  
3. 0.0.70c – Resources + Entities Integration  
