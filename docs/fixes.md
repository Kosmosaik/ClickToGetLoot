# Later in the development, the player will not be able to see the grid size.
So player will not know how big the zone is (if it's 8x8 or 32x32).
So we will have to figure out a way to not render the whole grid and adapt the panel to the size, but maybe instead
have like a camera inside the zone view that is not rendering all tiles if it's over a certain amount.
Kinda like a zoomed in view that will move when the player moves instead.

# Some menus stay outside the page area when resizing the web page. So if I move the inventory, equipment or skill panel
to the right edge in maximized mode (on 1920x1080 screen), and then resize/shrink the web page so the width get smaller,
the panels are staying outside the view. I want them to follow the window when I'm resizing the web page.
This makes me think that we maybe need to change how we render/show some of the menus.
If someone is playing on a smaller aspect ratio (more box-like res) the set width/height values in our css files
may not work for that. Maybe we should create a dynamic system that change the sizes of the menus depending on aspect ratio?

@ If the player expand an item stack and then when removing / equipping an item from inventory so that specific type of item (eg Simple Dagger) is no longer existing in the inventory, 
the next time the player loot a Simple Dagger, that item stack will still be expanded. I want to change it so when a "new" item gets added to the inventory, it will always be minimized.

@ Make Damage on weapon float value with two decimals (example: Damage 3.37), but only to a certain amount of damage.
When reaching > 10 damage it should only show one decimal, and over 100 it should be flat integers.

@ Max character length on character name (2 Words max and 20 total characters?)

@ Required Skill on equipped weapon shows 0 value in tooltip. Tooltip on inventory item hover works as intended

@ Move Qty so it's right after Item Name in both inventory views.

@ The Leet Power Sword of Doom weapon is not increasing DPS when I increase STR or DEX. Why?

@ When equipping items, the gap/margins between each row of item increases a bit compared with when it just says <empty>.
