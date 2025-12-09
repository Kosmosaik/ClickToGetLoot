# ProgressCrawl – Updated Roadmap (0.0.70c → 0.0.70k)
### World Expansion, Zone Content, Events, Interactions, and Persistence
---

## **0.0.70c — World Slot & Template Foundation (Completed)**  
**Goal:** Establish a persistent overworld with deterministic zone generation.

### Included:
- World Map system (fog states, adjacency unlocking)
- World Slot metadata (biome, era, template, seed, difficulty)
- Template-based deterministic zone generation
- Zone Info panel + Enter Zone button
- Seamless world exploration + unlocks after 100% exploration
- Persistent world map saving/loading
- Zone content scaffolding (`zone.content.entities`, `resourceNodes`, `pois`)

### **Deliverable:**  
A stable, persistent overworld ready to host dynamic and static content.

---

## **0.0.70d — Static Zone Content Generation (Current Phase)**  
**Goal:** Populate zones with pre-generated content using the new template and scaffolding systems.

### Includes:
### **Biome Definitions (First Pass)**
- Primitive Temperate Forest  
- Primitive Cave  

### **Static Resource Nodes**
- Berry Bush  
- Fallen Branch Pile  
- Stone Shard Deposit  
- Mushrooms (Cave)  
- Loose Rock (Cave)

### **Static Entity Spawns**
- Deer, Forest Hare  
- Wild Boar, Cave Spider  
- Cave Rat, Stone Beetle (Caves)

### **Static Locations**
- Clearings  
- Ruins  
- Cave Entrances  

### **Static POIs**
- Mossy Shrine  
- Abandoned Camp  
- Broken Obelisk  
- Collapsed Tunnel  
- Lantern Circle  

### **Core Features**
- Deterministic placement via content RNG
- Spawn tables embedded into ZONE_TEMPLATES
- Placement respects tile rules (walkable, visibility, entry regions)
- All content revealed through exploration, tile by tile

### **Deliverable:**  
Zones feel full and alive even before adding dynamic systems.

---

## **0.0.70e — Resource Interaction Layer**  
**Goal:** Let the player interact with discovered resources.

### Includes:
- Harvesting resource nodes  
- Marking depleted nodes  
- Respawn timers (2–4 days)  
- Resource node info in discovery list  
- First pass of the “Interaction Menu”

### **Deliverable:**  
Players can begin gathering resources inside each zone.

---

## **0.0.70f — Dynamic Events System**  
**Goal:** Add unpredictable encounters and environmental changes.

### Includes:
- Weather changes  
- Ambushes  
- Roaming enemies  
- Boss spawns  
- Environmental disasters (fire, quake, storm)  
- Travelling merchants & wanderers  
- Seasonal changes  
- Scripted zone-specific events  
- Event UI + notifications  
- Event frequency balancing

### **Deliverable:**  
Exploration becomes dynamic, reactive, and surprising.

---

## **0.0.70g — Entity Behavior Layer (Non-Combat)**  
**Goal:** Add simple creature behaviors without combat.

### Includes:
- Entity behavior flags (passive/neutral/aggressive)  
- Light roaming / wandering  
- Zone discovery list integration  
- Interaction options:
  - Observe  
  - Track (placeholder)  
  - Avoid  

### **Deliverable:**  
Zones feel inhabited with simple life simulation.

---

## **0.0.70h — Location Exploration**  
**Goal:** Add sub-zones and micro-locations.

### Includes:
- Entering/exiting locations (Caves, Ruins, Campsites)  
- Location tilemaps  
- Location-specific generators  
- Independent progress bars  
- Smooth return to parent zone  

### **Deliverable:**  
Adds depth and layered exploration to each biome.

---

## **0.0.70i — POI Interaction System**  
**Goal:** Make POIs meaningful game objects.

### Includes:
- POI interaction screens  
- Skill checks (placeholder implementation)  
- Rewards (loot, notes, keys, shortcuts)  
- Unlock mechanisms (doors, blocked paths)  
- Persistent POI completion states  

### **Deliverable:**  
POIs become rewarding exploration targets.

---

## **0.0.70j — Difficulty Integration & Balancing**  
**Goal:** Make difficulty matter across the entire experience.

### Includes:
- Difficulty affects:
  - Resource rarity  
  - Entity tiers  
  - POI types  
  - Location quality  
- Difficulty indicators on world map (skulls, colors)  
- Rarity + spawn weight rebalancing per biome  

### **Deliverable:**  
Zones feel meaningfully different across difficulty levels.

---

## **0.0.70k — Saving, Loading, Persistence (Extended)**  
**Goal:** Full world permanence.

### Includes:
- Save:
  - Zone states  
  - Depleted nodes  
  - Entity states (alive/dead, positions)  
  - POI states  
  - Respawn timers  
  - Dynamic event history  
- Load:
  - Restore zones exactly as last visited  
- Optimization for large world data  

### **Deliverable:**  
A persistent, replayable world where actions truly matter.

---

## **0.0.70l — Polish Pass & Dev Tools**  
**Goal:** Improve workflow and game feel.

### Includes:
- Zone debugging overlay  
- Dev controls:
  - Regenerate zone  
  - Reveal tiles  
  - Toggle events  
  - Visualize resource and entity spawn maps  
- UI polish:
  - Discovery list  
  - Tile overlays  
  - Zone previews on world map  
- Stability + bug fixes  

### **Deliverable:**  
A smooth, testable, developer-friendly foundation for the next major era of ProgressCrawl.

---

**END OF DOCUMENT**
