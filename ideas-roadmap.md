===== GRAPHICS: =====
Rarity animation: When the loot slider/progress is finished, if the item is higher than Common (Uncommon, Rare, Exotic etc), animate the slider with a pop up like effect after the first "roll/slider fill",
reset the slider and fill it again, but this time with the Uncommon color. If the item is of rarity higher than Uncommon, repeat the same process and change the color to the next rarity (rare or whatever).
This adds a jackpot-like feel to the looting system. Also, this means we will have to generate the item before we do the first check, so the slider-change process knows how many times it will repeat the slider reset/color change.

   Process summary:
   1. Click to loot, generate item (invisible to player in this state).
   2. Slider starts to fill up (grey color)
         If item is Abundant or Common, give item to player, else continue.
   3. If items rarity is higher than common (Uncommon, Rare, Exotic), reset the slider -> pop up effect -> fill slider with Uncommon color.
      	If item is Uncommon, give item to player, else continue.
   4. If items rarity is higher than uncommon, reset slider -> pop up effect -> fill slider with Rare color.
         If item is Rare, give item to player, else continue.
   5. If items rarity is higher than rare, reset slider -> pop up effect -> fill slider with Exotic color.
         If item is Exotic, give item to player.

===== IMPROVEMENTS: =====
@ Sort items by category (header, lines etc). Add category to hover tooltip. (ONGOING)
@ Change quality drop weight based on tier letter AND tier number (F9 most common, S1 rarest).
@ Add patch notes history (button on top-right side, version (bottom right - text)



===== FEATURES =====
FEATURE: Character & Classes
  @ Add character system with stats (randomized name, Class, Stats (Strength, Vitality, Agility - HP, Encumbrance, Attack Speed, Evade)).
  @ When game starts (opening the website for the first time) - Show character screen (hide loot button etc).
  @ Create Character button -> Roll random name, random class, random stats.
  @ Add Class/Stats calculations. Different stat distribution from different classes (still a bit random but weighted toward class related stats).


FEATURE: Equipment view
  @ Add Equipment menu
  @ Add more equipment related items (chest, head, weapon etc)
  @ Add equip/unequip function (move item from inventory to equipment and vice versa. Make slot busy/available)
  @ Add stats from equipment
   

OTHER:
@ Quality (F9 -> S1 = Higher Quality = Higher stat multipliers / higher enhancement values in crafting / higher success rates etc).
@ Gear Score: Score summarized from item stats (Damage, Attack Speed etc)
