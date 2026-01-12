# ProgressCrawl — Grade System (Technical Summary for Future Implementation)

**Purpose:** Document the intended “Grade” system so future work can implement it consistently across **Entities**, **Resource Nodes**, **POIs**, and other loot sources.

This document is based on the current agreed design:
- **Grade does NOT control loot rarity/weights.**
- Grade is a **quality attribute of the spawned source** (e.g., a Rabbit, a Tree, a Stash).
- The player can attempt to **improve** the grade of the resulting items during a harvesting/looting process, based on skills/tools/knowledge.

---

## 1) Core Concepts

### 1.1 Grade format
- Grade is represented as a ladder: **Tier + Step**.
- Display format: `F0 … F9`, `E0 … E9`, `D0 … D9`, `C0 … C9`, `B0 … B9`, `A0 … A9`, `S0 … S9`.
- Tiers are ordered (lowest → highest): `F < E < D < C < B < A < S`.
- Steps range: `0..9`.

**Recommendation (internal representation):**
- Store as numeric tuple:
  - `tierIndex` (0..6 for F..S)
  - `step` (0..9)
- Provide conversion helpers for:
  - `toLabel(tierIndex, step)` → `"F4"`
  - `fromLabel("F4")` → `{tierIndex:0, step:4}`
  - `incrementGrade()` handles step rollover into the next tier.

---

## 2) Where Grade Lives

### 2.1 Spawn-time: Grade belongs to the **source instance**
When zone content is generated, each spawned instance (entity/node/poi/location) gets a baseline grade (a minimum and maximum grade range).

Examples:
- A spawned Rabbit instance has `starting grade = F4, maximum grade = F9`.
- A spawned Oak Tree node has `starting grade = E1, maximum grade = E7`.
- A Stash POI has `starting grade = D0, maximum grade = D9`
- This is randomized but based on weights depending on zone difficulty. Lesser difficulty = lower tier, but with a tiny chance of either rolling a high starting grade or just increase the range by increasing maximum range.

**Important:** Grade should be deterministic per instance if the game is using deterministic zone seeding.

### 2.2 Grade is not “loot rarity”
Loot tables define *what items* can come from a source.
Grade defines the *quality level* of those items after extraction, subject to the improvement process.

---

## 3) Player-facing Flow (High Level)

### 3.1 Entity example (Rabbit)
1. **Spawn:** Rabbit spawns with baseline grade `F4`.
2. **Kill:** Rabbit becomes “defeated/lootable”.
3. **Loot process:** Player starts a “Loot Session”.
4. Player performs improvement attempts (e.g., skinning/butchering) that may raise the grade.
5. After:
   - the player finalizes, or
   - the attempt limit is reached (e.g., 3 fails max),
   the game awards items at the **best grade achieved**, or baseline grade if no improvements succeeded.

### 3.2 Resource node example (Tree)
Same loop conceptually:
- baseline grade is on the Tree node instance
- harvesting is an improvement session (woodcutting/gathering)
- final items inherit final grade

---

## 4) Loot / Harvest Sessions (Key Mechanism)

### 4.1 What is a session?
A **session** is a temporary state machine that:
- References a specific source instance (by `zoneId + x,y + kind + instanceId`).
- Tracks baseline grade, current improved grade, attempt counters.
- Decides final grade and commits resulting items to inventory.

### 4.2 Session fields (suggested)
```js
{
  sessionId,
  sourceRef: { zoneId, kind, x, y, instanceId, defId },
  baselineGrade: { tierIndex, step },
  currentGrade: { tierIndex, step }, // starts equal to baselineGrade
  attemptCount: 0,
  failCount: 0,
  maxFails: 3, // configurable by source/kind
  // context used for roll computations
  context: {
    difficultyRating, // zone/world difficulty
    skillIds: [],     // e.g. ["skinning"] or ["woodcutting"]
    toolRef: null,    // e.g. knife/axe/pick
    knowledgeKey: null // e.g. "Knowledge: Rabbit"
  },
  pendingDrops: [
    // items selected from loot table BEFORE grade is finalized
    // grade applied at finalization time
    { itemDefId, qty }
  ],
  state: "active" | "finalized" | "abandoned"
}
```

### 4.3 Where sessions should live
- Sessions can be stored in `PC.state` as a single active session:
  - `PC.state.activeLootSession = …`
- Or managed by a small session manager module.
- Prefer not persisting sessions in save files unless needed; sessions are short-lived.

---

## 5) Inputs to the “Improve Grade” Roll

Each attempt’s success chance (and magnitude) depends on:
- **Skill level** (e.g., Skinning / Woodcutting / Mining)
- **Tool quality** (knife/axe/pick quality, durability, etc.)
- **Knowledge about target** (e.g., `Knowledge: Rabbit`)
- Optional future inputs:
  - conditions (weather, time pressure, player status)
  - perks/traits

**Design intention:** Higher baseline grades exist in harder zones, but the player must have capability to realize that potential.

---

## 6) Improvement Rules

### 6.1 When an attempt succeeds
- Upgrade `currentGrade` upward by:
  - +1 step, or
  - larger leaps if you design critical successes
- Rollover logic:
  - `F9` + 1 → `E0`, etc.

### 6.2 When an attempt fails
- Increment `failCount`.
- After `maxFails`, force finalization:
  - award items at `currentGrade` (which may still equal baseline).

### 6.3 Player choice
- The player may choose “Finalize” early to accept the current grade.
- “Cancel/Close” behavior depends on UX:
  - recommended: cancel does **not** change the source state and does not award items
  - but once an entity is killed, “cancel loot session” should still keep it lootable, or auto-finalize after leaving (design choice)

---

## 7) Finalization & Item Creation

### 7.1 When finalizing
- Apply `currentGrade` to each pending item.
- Create item instances with grade metadata:
  - `itemInstance.grade = {tierIndex, step}` or `"F4"` label
- Add to inventory.
- Update the source instance state:
  - Entities: mark as “looted/consumed” then removed/invisible until respawned.
  - Resource nodes: mark depleted and removed/invisible until respawned.
  - POIs: mark opened and remain visible (non-interactable).

### 7.2 Persistence
Source instance grade must persist via the existing delta system if:
- the source remains in-world across sessions (e.g., killed but not yet looted)
- or if respawn timers later need to know what was there

Minimal approach:
- Store grade on instance at spawn-time.
- If entity is immediately killed+looted in one interaction, grade only needs to exist during that short flow.

---

## 8) Integration Notes (Existing Code Hints)

There is already some grade/quality generation used by the “Loot Button” flow:
- `quality.js` (and possibly hooks in `game.js`) appears to generate quality/grade-like values.
- Future work should:
  1) Reuse/extend that logic for **source baseline grade generation**
  2) Add a session-based **improvement loop**
  3) Apply final grade to actual item instances (modifiers later)

**Important:** Avoid tying grade to loot table weighting. Grade affects the resulting item quality, not drop probabilities.

---

## 9) Implementation Checklist (Future Work)

1. **Define grade helpers**
   - parse/format/increment/compare grade ladder
2. **Add grade to spawned source instances**
   - entities/resource nodes/pois/locations (where appropriate)
3. **Add a Loot/Harvest Session system**
   - start session, attempt improve, finalize
4. **Add UI flow**
   - after “Kill/Harvest/Inspect”, open the session UI (later)
5. **Apply grade to item instances**
   - store grade metadata on item instances
6. **Persistence**
   - ensure grade is included where needed in deltas/saves
7. **Later: modifiers**
   - connect grade to item stat modifiers (separate system)

---

## 10) Non-goals (for clarity)
- Grade is **not** loot rarity.
- Grade is **not** the same as zone difficulty.
- Grade improvements are player-driven and must use skills/tools/knowledge, with fail limits.

---

End of document.
