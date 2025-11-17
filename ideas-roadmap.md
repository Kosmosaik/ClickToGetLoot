===== FIXES: =====


===== GRAPHICS: =====


===== IMPROVEMENTS: =====
@ Add debug mode (type in like a password in console to activate).
  Add statistics, loot rate help, timers, speed up time/progress stuff.

===== TOOLS =====
@ Item creator (Tool that makes it easy adding items that automcatically adds it to the items.js file
@ Biome / Location / POI creator: Tool to add new biomes, locations, pois and loot pools

===== STATISTICS =====
@ Total items looted


===== FEATURES =====

FEATURE: Character & Classes
  @ Add Classes (templates for stat distr).
  @ Add Class/Stats calculations. Different stat distribution from different classes (still a bit random but weighted toward class related stats).
  @ LATER: Add skill distribution??
  
FEATURE: Equipment view
  @ Add Equipment menu
  @ Add more equipment related items (chest, head, weapon etc)
  @ Add equip/unequip function (move item from inventory to equipment and vice versa. Make slot busy/available)
  @ Add stats from equipment

  Core Combat Stats
  [X] : Weapon Damage
  [X] : Attack Speed
  [ ] : DPS (derived)
  [ ] : Critical Chance
  [ ] : Critical Damage Multiplier
  [ ] : Accuracy / Hit Chance
  [ ] : Elemental Damage (when elements gets added)
  [ ] : Armor Penetration (ignore % of defense)
  [ ] : Lifesteal (% of damage heals you)

  Defensive Stats
  [ ] : Armor / Defense (reduces incoming physical dmg)
  [ ] : Dodge / Evasion (chance to avoid attacks)
  [ ] : Block Chance (for shields)
  [ ] : HP (Max Health)
  [ ] : HP Regeneration (per second)
  [ ] : Damage Reduction %
  [ ] : Resistance (Fire, Cold, Poison, Magic etc - whene elements gets added)
  [ ] : Tenacity / Status Resist (reduces duration of debuffs)

  Magic / Ability Stats
  [ ] : Mana (Max)
  [ ] : Mana Regeneration
  [ ] : Spell Damage Bonus
  [ ] : Cooldown Reduction
  [ ] : Energy / Resource for abilities (if not using mana)
  [ ] : Aura Power (For passives / Companions)
  [ ] : Summon Power (if minions gets added)

  Loot & Economy Stats
  [ ] : Loot Find (increases chance of higher-tier drops)
  [ ] : Gold Find (if money gets added)
  [ ] : Luck (general rare event chance modifier, also increases crit chance)

  Progression / Utility Stats
  [ ] : Carry Weight Limit
  [ ] : Current Weight
  [ ] : Encumbrance Penalty (affects speed, dodge and/or attack speed if overweight)

  Action Speed / Gathering Speed (fingerfärdighet som ökar (xp) när man gör actions). Generell skill som reducerar tiden det tar för actions.

FEATURE: Zones (Biomes)
   @ Add world map (grid of zones). Each zone is randomly generated when it comes to:
     Biomes, locations, points of interests, size (time it takes to explore), amount of enemies, difficulty rating.
   @ Add starting zone that the player will start in. Let's use this zone as a test zone where we spawn everything to test first, before we balance everything out.
   @ Add biome types (Plains, forest, river, desert etc.)
   @ Add locations related to different biome types. Let biomes choose which locations to be added from a pool (randomized).
   @ Add points of interests. Some are related to biome, and some can be added from a generic pool (like loot chest, weapon cache, broken wagon etc).
   @ Add exploration progress bar: Exploration progress based on zone size. 
   @ Add interaction window: During exploration - locations, pois etc will "spawn" (added to a list).
     Player can then click on the location, poi etc in the list and choose to explore/interact with it.
     Locations: A small description of the location, difficulty rating (could be higher or lower than the zone), and two buttons: Explore and Close. 
     Explore will "teleport" the player to the location (teleport actually means, pause zone progress, load data for location and start location exploration progress)
     A new exploration progress bar for the location will appear (the old for the zone will still be visible, but paused).
     When the exploration progress bar hits 100%, the player can then choose to exit the location and continue to explore the zone.
     Points of Interests: This is more like a small location, an object like a wagon, a trap of some sort, a small room. Anything that isn't big enough to move the player to a location.
     POIs can be puzzles that the players have to solve in order to get loot, skills or other stuff. It could also be a chest or some sort to just loot.

FEATURE: Enemies
   @ Add enemies (1 starter enemy (Rat or something), 1 that is a bit harder and 1 that the player will definitely die to).
   @ Add enemy stats (HP, Damage, Attack Speed, HP Reg)
   @ Add enemies to zones. Add all to starting zone in the beginning to test fighting, balancing, player death etc.
   @ Make some enemies appear in the exploration list (same as locations and pois), but also make some enemies trigger "forced combat".
   @ Add enemy loot pools: Different loot for different enemies.

FEATURE: Combat
   @ Add simple combat system (timer based attacks with a simple log updating when player/enemy attacks, showing damage done etc).
   @ Add "Fight" button on the entity in the exploration list to change game state/interface to fight mode.
   @ Add loot generation based on enemy type, loot pool etc.
   @ LATER: Add ranged weapon mechanics (slider / distance to enemy).

FEATURE: Player Death
   @ When player health reaches <= 0 , 
   
OTHER:
@ Quality (F0 -> S1 = Higher Quality = Higher stat multipliers / higher enhancement values in crafting / higher success rates etc).
   Maybe add a property on items to set different min/max multiplier so all items can have different quality multipliers?
@ Gear Score: Score summarized from item stats (Damage, Attack Speed etc)
@ DPS: Calculate and show DPS on item (based on character stats + item stats)
