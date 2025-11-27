# ProgressCrawl – Development Roadmap

This roadmap outlines the upcoming planned versions of ProgressCrawl.  
It focuses on expanding core gameplay systems in the most logical order, ensuring each new feature builds cleanly on top of existing foundations.

This roadmap is flexible and will evolve as development continues.

---

## v0.0.67 — Polish & Inventory improvements
A small update to improve UI and create more options for the player

### Planned:
- UI consistency pass (button styles, panel spacing, tooltip clarity)
- Improve layout logic for Inventory/Equipment/Skills panels when resizing web page.
- Make all menus resizable and movable (free moving and sizing).
- Add a toggle to collapse/expand all inventory categories at once
- Add a toggle to remove categories and keep all items (no matter category) in a single list.
  Add sorting option for category (inside "all items list"-view) and keep the other sorting options for new view.
- Add category next to the item name in inventory if sorting without category (in All items view).
- Add stats in tooltip for "actual stats" that the player will get by equipping an item.
  In other words, there will be "Weapon stats - Comparison with equipped item - characters stats after equipping the item".

---

## v0.0.68 - Level / Experience and armor improvements
- Add Level stat and experience points.
- Make a temporary easy exp formula for exp to next level etc
- Add a "Give EXP" button for testing purposes
- Add a text field to input how much exp to give character per click
- Add a "Give level" button for testing purposes
- Give character 3 attribute points to distribute on level up.

---

## v0.0.69 - Prep for exploration
- Add defense values and other stats to armor/equipment.
- Add more items that are going to exist in the starting zone
- Add all variables, properties/values etc on all items/equipment/character stats in preparation for crafting/gathering and exploring updates. Armor/PDEF, crafting modifier attributes/stats and more.

---

## v0.0.70 — Zones & Exploration (Phase 1)
Unlocks real gameplay beyond clicking “Loot”. Exploring

### Planned:
- Add “Zones” (areas the player can visit , kinda like biomes). 
- Each zone has:
  - Level range / Difficulty system (we need to discuss this a lot to find a good balance), a specific biome, Points of interests (small interactable objects/areas), locations (stage-transitioning areas where new exploration progress starts with its oen POIs and entities), enemies etc. Not all of this will be implemented in 0.0.70, but it till be discussed and a lot of decisions will be made here to set the foundation going forward.
- Zone unlock progression (unlocks adjacent/neighbouring zones to "finished" zones)
- A Starting Zone that the player will begin in. This zone will contain all the tutorials and we will focus on expanding this zone first after the world map and starting zone has been implemented. This zone will have predefined quests/tasks that the player will have to complete before 100%-ing the zone and continue to the next zone, while future zones will have optional/randomly generated quests and progress will be more time based.
- Generate Resource Nodes and POIs (Locations and Entities will come later).
- Make resource nodes contain resources (item/loot table) - No interaction/gathering system yet.


### UI:
- New Zone selection panel (World map - This will be locked and invisible to the player until Starting Zone has been finished).
- Zone descriptions
- Zone completion time bar (similar to loot bar), going from 0% to 100%. During this time resource nodes, entities, POIs, Locations etc will pop up in a list that you can interact with.
- World map -> Zone -> World map transition
- Zone "finished" screen when clicking a button "Exit Zone" when 100% explored. Brings you back to the world map.
- Make it shown that a zone has been "completed".
- Timers when player chooses to interact with things in the list (timers for "Walking to X...", "Preparing ....", "Searching for a place to build shelter..." etc). This will make it feel like the character is actually walking around and doing stuff than just instantly interact with everything in the zome.

---

## v0.0.71 -> 0.0.74 - Polish, Expand & Improve existing systems

### Planned:
- Add more POIs and other interactables to the Starting Zone
- Add more items
- Interact / Use system: Combine items and do basic tasks that's not really a crafting task (Right click a branch -> Make Lean-To Shelter (blueprint), Right Click Campfire -> Add Items -> Raw Meat, Right click cooked meat -> Eat, Drink etc). These small interactions will complete predefined tasks later.
- Blueprint system for Lean-To Shelter. Adds a blueprint. when clicking on blueprint you'll see a small window with required items to complete the shelter.
- Hunger & Thirst System
- Eat / Drink System

---

## v0.0.75 - Quests/Tasks System

### Planned:
- Quest system that first and foremosts define the exploration progress in the Starting Zone. This quests system should be built so it can be reused for randomly generated quests later in other zones.
- Collect x item - Complete - Progress exploration x %
- Add tutorial quests

## v0.0.80 — Combat v1
The first real combat mechanics and enemies appear.

### Planned:
- Basic enemy system
- Entity spawning system (enemies or passive entities).
- Simulation-style combat:
  - Player Attack vs Enemy Defense
  - Enemy Attack vs Player HP
  - Attack Speed calculations
  - Sliders for counting down to attack etc
- Loot obtained from defeating enemies
- Weapon damage and skill levels fully matter
- Give EXP and skills to weapon, survival and what not.

### UI:
- Combat log
- Enemy card with HP and stats
- Reward screen after victory

---

## v0.0.90 — Gathering System v1
Introduces resource gathering

### Planned:
- Resource items from Resource Node.
- Basic crafting stations (campfire → forge → advanced forge)
- Crafting stats and quality bonuses
- Interactables can require specific tools to gather (Axe to cut down tree etc).

 - Resource Nodes (Player interacts - get resources from node)
       Resource nodes to add: "Fallen Branch Pile" (gives Twig and Wooden Branch), "Stone Cluster" (gives Small Stone), "Tall Grass Patch" (gives grass bundle and occasionally Plant Fibre), "Tree (Scarred)"(Gives tree bark and insect/bug(find use for it)", "Tree (Normal), gives wood log, woodern branch and           twigs (needs an axe for cutting down tree to get logs).
  - Resource Node grade (F0 -> S9). This will determine what grade the items will get (no longer rolling random grades on item. It will be decided based on grade when player finishes the gathering for that node".
  - Loot tables/pools for every resource node
- Gathering System: Player click on Resource Node -> Clicks on "Get resources" -> System calculates/rolling success or fail to improve grade. When x amount of fails hits -> Give resources to player (or you can choose to "finish now" and get current grade resources).

### UI:
- Gathering screen (Skill of gathering task (Digging, Foraging, Mining whatever), Knowledge of resource, loading screen/slider, current grade, max grade of node etc).
- List to keep all discovered resource nodes, entities, POIs etc that the player will interact with. When depleted, killed or interacted with, remove that from list etc.

---

## v0.0.91 — Weight, Encumbrance & Storage system

- Item weight & encumbrance system
- Backpacks
- STR affecting encumbrance

---

## v0.1.0 - Crafting v1
- Crafting recipes

---

## v0.1.10 — Gathering Professions (Mining, Herbalism, Woodcutting)
Profession system tied to resources and crafting.

### Planned:
- Leveling for gathering professions
- Rare resource drops, profession perks
- Tools affecting success rate and rarity

---

## v0.1.20 — Equipment Expansion
Builds on the first Equipment Update with deeper gear systems.

### Planned:
- More item slots (ring, necklace, off-hand, belt)
- Item modifiers (prefixes/suffixes)
- Set bonuses
- Durability (optional)

---

## v0.1.30 — Character Development
Adds more RPG depth.

### Planned:
- Primary attributes affect gameplay more strongly
- Passive bonuses from leveling
- Talent tree (or simple perk system)
- Buffs, debuffs, temporary effects

---

## v0.1.40 — Marketplace & Economy (optional milestone)
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

