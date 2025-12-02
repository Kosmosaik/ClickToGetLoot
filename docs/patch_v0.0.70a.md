## Patch v0.0.70a - Zone Exploration Core System

This update introduces the first foundation of the new Zone System.  
You now begin your adventure directly inside the Starting Zone and explore it tile by tile.

---

### New: Starting Zone
- After character creation, you immediately begin inside the **Starting Zone**.
- Exploration is paused until you choose to start.
- This will later support story intros and scripted events.

---

### New: Tile-Based Exploration
Zones now feature a full exploration loop:
- Sequential tile revealing
- Exploration progress percentage
- Walkable, blocked and locked tiles
- Zone completion when all tiles are explored

---

### New: Exploration Controls
Added three buttons inside the Zone panel:
- **Explore Next Tile** – reveals the next tile after a short delay  
- **Explore Auto** – automatically explores tiles every few seconds  
- **Stop Exploring** – stops auto‑exploration  

Only one mode can run at a time.

---

### New: Zone Panel Layout
The Zone panel has been redesigned with:
- Centered ASCII tile grid  
- Clean section headers  
- Zone information (name, status, progress)  
- A dedicated **Messages** log  
- A full-height **Discoveries** sidebar  

---

### New: Zone Completion Options
Once the zone reaches 100% explored:
- **STAY** – remain in the completed zone  
- **LEAVE ZONE** – exit the zone (world map coming later)

---

### Improved: Exploration Messages
Each explored tile triggers a short message (e.g. “You uncover a patch of ground.”).  
Messages appear in the new Messages log within the Zone panel.

---

### Improved: Player Flow
- Entering the zone happens automatically after character creation  
- Exploration no longer begins automatically  
- Manual exploration uses the same delay as auto  
- Status indicators now show: *Idle*, *Exploring (Manual)*, *Exploring (Auto)*, *Completed*

---

This completes all goals for **0.0.70a – Zone Core System (Skeleton)**.
