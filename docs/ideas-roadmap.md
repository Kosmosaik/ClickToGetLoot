===== FIXES: =====


===== GRAPHICS: =====


===== IMPROVEMENTS: =====
@ Add debug mode (type in like a password in console to activate).
  Add statistics, loot rate help, timers, speed up time/progress stuff.

===== TOOLS =====
@ Item creator (Tool that makes it easy adding items that automcatically adds it to the items.js file
@ Biome / Location / POI creator: Tool to add new biomes, locations, pois and loot pools

===== STATISTICS =====
@ Total items looted (to prepare for leaderboard system later)


===== FEATURES =====
  
FEATURE: Equipment view
  @ Add more equipment related items (chest, head, weapons, rings, legs etc)

  Core Combat Stats
  [X] : Weapon Damage
  [X] : Attack Speed
  [X] : DPS (derived)
  [X] : Critical Chance
  [ ] : Critical Damage Multiplier
  [ ] : Accuracy / Hit Chance
  [ ] : Elemental Damage (when elements gets added)
  [ ] : Armor Penetration (ignore % of defense)
  [ ] : Lifesteal (% of damage heals you)

  Defensive Stats
  [ ] : Armor / Defense (reduces incoming physical dmg)
  [ ] : Dodge / Evasion (chance to avoid attacks)
  [ ] : Block Chance (for shields)
  [X] : HP (Max Health)
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
  [X] : Loot Find (increases chance of higher-tier drops)
  [ ] : Gold Find (if money gets added)
  [ ] : Luck (general rare event chance modifier, also increases crit chance)

  Progression / Utility Stats
  [ ] : Carry Weight Limit
  [ ] : Current Weight
  [ ] : Encumbrance Penalty (affects speed, dodge and/or attack speed if overweight)

  [ ] : Movement Speed (Explore maps faster)
  [ ] : Action Speed (crafting/processing)
  [ ] : Gathering Speed
  [ ] : Mining Speed

  Special / Unique Stats
  [ ] : Reflect Damage
  [ ] : Thorns
  [ ] : Life on Hit
  [ ] : Life on Kill

=================== CHARACTER STUFF IDEAS ==========================

Character:

1. NAME: (We already have this implemented, but later on I'd like to expand the random name system to hold more names, and maybe even build a generator combining different character combinations (vowels and consonants in certain ways).

2. CLASS: You don't choose class, you will be placed in a class depending on highest skill/skills (combinations) and base don that gain unique buffs.

3. STR /Strength): This stat affects the "melee" physical power of the character, allowing it to deal damage even if no weapons are equipped if a sufficient amount of STR is invested. The STR value is also multiplied to the Weapon ATK value for even more damage increase.
+1 to BaseATK (BaseATK is derived from the player's Base Level, Str, Dex, and Luk. We will discuss the formula further down).
+0,5% weapon ATK
+20 carry weight.

4. AGI (Agility): This stat affects the speed of the character in many aspects, allowing it to attack faster and dodge attacks more often.
+1 to Flee Rate (Increases chance to flee/avoid forced combat events).
+1% Attack Speed.
Bleeding: -1% chance from being inflicted.
+1 to Movement Speed.

5. VIT (Vitality): This stat affects the endurance, HP, and restorative power of the character, allowing it to last longer against monsters and to regain more life with healing items.
Max HP +1%
Healing Items effectiveness +2% (HP)
Resistance vs following effects:
	Stun: -1% chance from being inflicted + decreases duration
	Poison: -1%  chance, decreases duration
	Deadly Poison: Same stats as above
	Burning: Same as above
	Freezing: Same as above
+0,5 in Soft DEF
+0,1 HP regen/s

6. DEX (Dexterity): This stat affects the accuracy (HIT) of the character in many aspects, allowing it to land hits easier, among other things. It is also the primary stat for "ranged" physical power, and the primary stat for decreasing variable cast time.
+1 to BaseATK for Ranged-type weapons (Bows, Guns etc)
+0,5% weapon ATK (for Ranged)
+1 Hit Rate
+0,1% Attack Speed
+0,1% Success rate to Forging (Blacksmith), Brewing (Alchemist) and similar professions
+0,2% Success rate to Cooking

7. LUK (Luck): This stat affects the fortune of the character in some aspects, allowing it to deal Critical hits more often, luckily dodging enemy attacks more often, among several other small bonuses.
+0,3% Critical Hit Chance
+0,1% Success rate to Forging (Blacksmith), Brewing (Alchemist) and similar professions
+0,1% Success rate to Cooking
-1% chance from being inflicted by Status Effects (All)
+0,3 to BaseATK
+0,3 to MagicATK (Not being implemented until later)
+0,3 to Hit Rate
+0,2 to Flee Rate
+0,1 to Dodge / Evasion


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
   @ Even though enenmies will have their own loot pool /drop table, there will be a chance for an enemy to drop from a "generic" loot pool that is much bigger, 
   	 to randomize it more and give that element of surprise/freshness and jackpot feel.

FEATURE: Combat
   @ Add simple combat system (timer based attacks with a simple log updating when player/enemy attacks, showing damage done etc).
   @ Add "Fight" button on the entity in the exploration list to change game state/interface to fight mode.
   @ Add loot generation based on enemy type, loot pool etc.
   @ LATER: Add ranged weapon mechanics (slider / distance to enemy).

FEATURE: Player Death
   @ When player health reaches <= 0 , 
   
OTHER:
@ Show weight drop table after lootBonus stat added in debug mode, to figure out balancing the attribute.
@ Quality (F0 -> S1 = Higher Quality = Higher stat multipliers / higher enhancement values in crafting / higher success rates etc).
   Maybe add a property on items to set different min/max multiplier so all items can have different quality multipliers?
@ Gear Score: Score summarized from item stats (Damage, Attack Speed etc)
@ DPS: Calculate and show DPS on item (based on character stats + item stats)

BRAINSTORM:
@ Enchance/Enchant system. Like: Add a venomous tip on a weapon to make poison damage (chance to trigger: does damage over time effect)

@ Unlock new crafting recipes by:
 - Buying books from merchants
 - Figure out correct ingredient combinations.
 - 
 - Random Events

@ Escape combat: Character - Enemy. diatance between. movement speed + RNG etc will determine if player escapes. show distance dynamically change based on movement speed of player and enemy

@ Biome Specific recipes / merchant items.
