// scripts/game.js
console.log(`game.js loaded v${GAME_CONFIG.version}`);

// ----- Screen elements -----
const saveListContainer = document.getElementById("save-list");

let currentHP = 0;

// Holds the fully computed character state (attributes + derived stats)
// so UI or other systems can use it.
let characterComputed = null;

// ----- Zones / Exploration -----
// For now we just track a single current Zone in memory.
let currentZone = null;

// Are we currently "inside" a zone?
let isInZone = false;

// ----- World Map -----
let worldMap = null;

// Enter a zone by clicking it on the world map.
function enterZoneFromWorldMap(x, y) {
  if (typeof getWorldMapTile !== "function") {
    console.warn("enterZoneFromWorldMap: getWorldMapTile is not available.");
    return;
  }
  if (!worldMap) {
    console.warn("enterZoneFromWorldMap: worldMap is not initialized.");
    return;
  }

  const tile = getWorldMapTile(worldMap, x, y);
  if (!tile || !tile.zoneId) {
    console.warn("enterZoneFromWorldMap: no zone mapped at", x, y);
    return;
  }

  // Stop any running auto exploration in the current zone
  if (typeof stopZoneExplorationTicks === "function") {
    stopZoneExplorationTicks();
  }

  if (typeof createZoneFromDefinition !== "function") {
    console.error("enterZoneFromWorldMap: createZoneFromDefinition is missing.");
    return;
  }

  // 0.0.70c:
  // Make sure a definition EXISTS before we ever call createZoneFromDefinition,
  // to avoid the "no definition found" spam for auto_zone_* ids.
  if (typeof ZONE_DEFINITIONS !== "undefined") {
    const existingDef = ZONE_DEFINITIONS[tile.zoneId];

    if (!existingDef && typeof ensureGeneratedZoneDefinitionForWorldTile === "function") {
      ensureGeneratedZoneDefinitionForWorldTile(tile);
    }
  } else {
    console.error("enterZoneFromWorldMap: ZONE_DEFINITIONS is not defined.");
    return;
  }

  // Now we expect there to be a definition (either static or generated).
  const newZone = createZoneFromDefinition(tile.zoneId);

  if (!newZone) {
    console.error("enterZoneFromWorldMap: failed to create zone", tile.zoneId);
    return;
  }

  // Switch state to the new zone
  currentZone = newZone;
  isInZone = true;

  // Update fog and current position on the world map
  if (tile.fogState !== WORLD_FOG_STATE.VISITED) {
    tile.fogState = WORLD_FOG_STATE.VISITED;
  }
  worldMap.currentX = x;
  worldMap.currentY = y;

  // Switch panels: hide world map, show zone
  if (typeof switchToZoneView === "function") {
    switchToZoneView();
  }

  // Refresh UIs
  if (typeof renderZoneUI === "function") {
    renderZoneUI();
  }
  if (typeof renderWorldMapUI === "function") {
    renderWorldMapUI();
  }

  console.log(`Entered zone from world map: ${tile.zoneId}`, newZone);
}

// Tick-based exploration (2–5s) timer
let zoneExplorationActive = false;
let zoneExplorationTimerId = null;
let zoneManualExplorationActive = false;
let zoneManualTimerId = null;

// Delay timer while a tile is being explored
let zoneExploreDelayTimerId = null;

// ----- Zone movement (character walking between tiles) -----
let zoneMovementActive = false;
let zoneMovementTimerId = null;
let zoneMovementPath = null;
let zoneMovementOnArrival = null;

// Movement speed: tiles per second. You can override this in GAME_CONFIG.zone
// by adding "movementTilesPerSecond" there.
const ZONE_MOVEMENT_TILES_PER_SECOND =
  (GAME_CONFIG.zone && GAME_CONFIG.zone.movementTilesPerSecond) || 4;

function findPlayerPositionInZone(zone) {
  if (!zone || !zone.tiles) return null;

  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const t = zone.tiles[y][x];
      if (t && t.hasPlayer) {
        return { x, y };
      }
    }
  }

  return null;
}

function findPathToPreparedTile(zone) {
  if (!zone || !zone.tiles) return null;

  const tx = zone.preparedTargetX;
  const ty = zone.preparedTargetY;
  if (typeof tx !== "number" || typeof ty !== "number") {
    return null;
  }

  const start = findPlayerPositionInZone(zone);
  if (!start) {
    // No player marker yet (e.g. very first exploration) – let exploration
    // handle revealing and placing the player instead of moving first.
    return null;
  }

  const width = zone.width;
  const height = zone.height;

  // 1) Build list of "stance" positions: tiles adjacent to the target that
  //    are not blocked AND are already explored OR currently have the player.
  const stanceTargets = [];
  const dirs = [
    { dx:  1, dy:  0 },
    { dx: -1, dy:  0 },
    { dx:  0, dy:  1 },
    { dx:  0, dy: -1 },
  ];

  for (let i = 0; i < dirs.length; i++) {
    const sx = tx + dirs[i].dx;
    const sy = ty + dirs[i].dy;

    if (sy < 0 || sy >= height || sx < 0 || sx >= width) continue;

    const t = zone.tiles[sy][sx];
    if (!t) continue;

    if (t.kind === "blocked") continue;

    // Must be known ground to stand on: explored or already has the player.
    if (!t.explored && !t.hasPlayer) continue;

    stanceTargets.push({ x: sx, y: sy });
  }

  // No valid stance tile: either we're already adjacent in a weird edge case,
  // or this target is isolated from known ground. In that case, don't move.
  if (stanceTargets.length === 0) {
    return null;
  }

  // Treat stance targets as BFS goals.
  const targetSet = new Set(stanceTargets.map(p => `${p.x},${p.y}`));

  const visited = [];
  for (let y = 0; y < height; y++) {
    visited[y] = [];
  }

  const queue = [];
  queue.push({ x: start.x, y: start.y, prev: null });
  visited[start.y][start.x] = true;

  let endNode = null;

  while (queue.length > 0) {
    const node = queue.shift();
    const key = `${node.x},${node.y}`;
    if (targetSet.has(key)) {
      endNode = node;
      break;
    }

    for (let i = 0; i < dirs.length; i++) {
      const nx = node.x + dirs[i].dx;
      const ny = node.y + dirs[i].dy;

      if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
      if (visited[ny][nx]) continue;

      const tile = zone.tiles[ny][nx];
      if (!tile) continue;

      // Only move through:
      //  - non-blocked tiles
      //  - that are already explored OR have the player (start tile)
      if (tile.kind === "blocked") continue;
      if (!tile.explored && !tile.hasPlayer) continue;

      visited[ny][nx] = true;
      queue.push({ x: nx, y: ny, prev: node });
    }
  }

  if (!endNode) {
    // No path from current player position to any stance tile using known ground.
    // In that case, don't move – exploration will still happen, but from afar.
    return null;
  }

  // Reconstruct path from end to start.
  const revPath = [];
  let cur = endNode;
  while (cur) {
    revPath.push({ x: cur.x, y: cur.y });
    cur = cur.prev;
  }
  revPath.reverse();

  // First element is the player's current position; we only need the steps AFTER that.
  if (revPath.length > 0) {
    if (revPath[0].x === start.x && revPath[0].y === start.y) {
      revPath.shift();
    }
  }

  return revPath;
}

function startZoneMovement(path, onArrival) {
  if (!currentZone || !isInZone) {
    if (typeof onArrival === "function") onArrival();
    return;
  }
  if (!path || path.length === 0) {
    if (typeof onArrival === "function") onArrival();
    return;
  }

  zoneMovementActive = true;
  zoneMovementPath = path.slice(); // copy
  zoneMovementOnArrival = typeof onArrival === "function" ? onArrival : null;

  const stepDelayMs = Math.max(50, 1000 / ZONE_MOVEMENT_TILES_PER_SECOND);

  function step() {
    if (!zoneMovementActive || !currentZone || !isInZone) {
      zoneMovementTimerId = null;
      return;
    }

    if (!zoneMovementPath || zoneMovementPath.length === 0) {
      zoneMovementActive = false;
      zoneMovementTimerId = null;
      const cb = zoneMovementOnArrival;
      zoneMovementOnArrival = null;
      if (typeof cb === "function") cb();
      return;
    }

    const next = zoneMovementPath.shift();
    setZonePlayerPosition(currentZone, next.x, next.y);

    if (typeof renderZoneUI === "function") {
      renderZoneUI();
    }

    zoneMovementTimerId = setTimeout(step, stepDelayMs);
  }

  // Kick off the first movement step
  step();
}

function stopZoneMovement() {
  if (zoneMovementTimerId) {
    clearTimeout(zoneMovementTimerId);
    zoneMovementTimerId = null;
  }
  zoneMovementActive = false;
  zoneMovementPath = null;
  zoneMovementOnArrival = null;
}

// Shared generic messages for exploration
const ZONE_GENERIC_MESSAGES = [
  "You uncover a patch of ground.",
  "You scout a quiet stretch of the zone.",
  "You reveal more of the surrounding area.",
  "You push the boundary of the unknown.",
  "You chart another small piece of this zone.",
  "You smell fart in the air, but decide to continue anyway.",
  "You slipped on a piece of shit."
];

function setZonePlayerPosition(zone, x, y) {
  if (!zone || !zone.tiles) return;

  for (let yy = 0; yy < zone.height; yy++) {
    for (let xx = 0; xx < zone.width; xx++) {
      const t = zone.tiles[yy][xx];
      if (!t) continue;
      t.hasPlayer = (xx === x && yy === y);
    }
  }
}

function addRandomZoneMessage() {
  if (typeof addZoneMessage !== "function") return;
  const msg =
    ZONE_GENERIC_MESSAGES[Math.floor(Math.random() * ZONE_GENERIC_MESSAGES.length)];
  addZoneMessage(msg);
}

// --- Zone exploration tick system (2–5s random delay) ---

function scheduleNextZoneExplorationTick() {
  if (!zoneExplorationActive || !isInZone || !currentZone) return;

  // Small idle delay between finishing one tile and starting the next movement.
  const idleDelay = 200;

  zoneExplorationTimerId = setTimeout(() => {
    zoneExplorationTimerId = null;
    beginZoneExplorationCycle();
  }, idleDelay);
}

// Reveal the next explorable tile (sequential), add a random message, update UI.
// Returns true if a tile was actually revealed, false otherwise.
function revealNextTileWithMessageAndUI() {
  if (
    !window.ZoneDebug ||
    (typeof ZoneDebug.revealPreparedExplorationTile !== "function" &&
      typeof ZoneDebug.revealNextExplorableTileSequential !== "function")
  ) {
    return false;
  }
  if (!currentZone) return false;

  // Prefer revealing a pre-marked tile, fall back to old sequential reveal.
  let changed = false;
  if (typeof ZoneDebug.revealPreparedExplorationTile === "function") {
    changed = ZoneDebug.revealPreparedExplorationTile(currentZone);
  } else {
    changed = ZoneDebug.revealNextExplorableTileSequential(currentZone);
  }
  
  if (changed) {
    addRandomZoneMessage();
  } else {
    if (typeof addZoneMessage === "function") {
      addZoneMessage("There is nothing left to explore here.");
    }
  }

  if (typeof renderZoneUI === "function") {
    renderZoneUI();
  }

  // 0.0.70c — after revealing a tile, check if we just completed the zone.
  if (window.ZoneDebug && typeof ZoneDebug.getZoneExplorationStats === "function") {
    const stats = ZoneDebug.getZoneExplorationStats(currentZone);
    if (stats && stats.isComplete && typeof onZoneFullyExplored === "function") {
      onZoneFullyExplored();
    }
  }

  return changed;
}

function beginZoneExplorationCycle() {
  if (!zoneExplorationActive || !isInZone || !currentZone) return;
  if (!window.ZoneDebug || typeof ZoneDebug.getZoneExplorationStats !== "function") return;

  const stats = ZoneDebug.getZoneExplorationStats(currentZone);
  if (stats.isComplete || stats.exploredTiles >= stats.totalExplorableTiles) {
    console.log("Zone fully explored. Stopping exploration ticks.");
    stopZoneExplorationTicks();
    if (typeof onZoneFullyExplored === "function") {
      onZoneFullyExplored();
    }
    if (typeof renderZoneUI === "function") {
      renderZoneUI();
    }
    return;
  }

  if (
    !window.ZoneDebug ||
    typeof ZoneDebug.prepareNextExplorationTile !== "function"
  ) {
    return;
  }

  const prepared = ZoneDebug.prepareNextExplorationTile(currentZone);
  if (!prepared) {
    console.log("No more tiles to prepare in this zone.");
    stopZoneExplorationTicks();
    if (typeof renderZoneUI === "function") {
      renderZoneUI();
    }
    return;
  }

  if (typeof renderZoneUI === "function") {
    renderZoneUI();
  }

  const path = findPathToPreparedTile(currentZone);

  if (!path || path.length === 0) {
    // Already on that tile: just run the explore delay + reveal.
    startZoneExploreDelay(() => {
      runZoneExplorationTick();
    });
    return;
  }

  startZoneMovement(path, () => {
    // After walking to the prepared tile, start the explore timer.
    startZoneExploreDelay(() => {
      runZoneExplorationTick();
    });
  });
}

function runZoneExplorationTick() {
  if (!zoneExplorationActive || !isInZone || !currentZone) {
    return;
  }

  if (!window.ZoneDebug || typeof ZoneDebug.getZoneExplorationStats !== "function") {
    return;
  }

  const stats = ZoneDebug.getZoneExplorationStats(currentZone);
  if (stats.isComplete || stats.exploredTiles >= stats.totalExplorableTiles) {
    // Zone already done, stop ticking
    console.log("Zone fully explored. Stopping exploration ticks.");
    stopZoneExplorationTicks();

    // 0.0.70c — world map adjacency unlock
    if (typeof onZoneFullyExplored === "function") {
      onZoneFullyExplored();
    }

    if (typeof renderZoneUI === "function") {
      renderZoneUI();
    }
    return;
  }

  // Reveal one tile + message + UI
  revealNextTileWithMessageAndUI();

  // Schedule the next tick
  scheduleNextZoneExplorationTick();
}

function startZoneExplorationTicks() {
  if (zoneExplorationActive) return;
  if (!isInZone || !currentZone) return;
  if (zoneMovementActive) return; // don't conflict with ongoing movement

  console.log("Starting zone exploration ticks.");
  zoneExplorationActive = true;
  scheduleNextZoneExplorationTick();
}

// Clear the "this tile will be explored next" flag for the current zone.
// This is used when stopping auto exploration so no "?" keeps blinking.
function clearZoneActiveExploreFlags() {
  if (!currentZone || !currentZone.tiles) return;

  for (let y = 0; y < currentZone.height; y++) {
    for (let x = 0; x < currentZone.width; x++) {
      const t = currentZone.tiles[y][x];
      if (t && t.isActiveExplore) {
        t.isActiveExplore = false;
      }
    }
  }
}

function startZoneExploreDelay(onReveal) {
  if (!currentZone || !currentZone.tiles) {
    if (typeof onReveal === "function") onReveal();
    return;
  }

  const tx = currentZone.preparedTargetX;
  const ty = currentZone.preparedTargetY;
  if (typeof tx !== "number" || typeof ty !== "number") {
    if (typeof onReveal === "function") onReveal();
    return;
  }

  // Clear any previous blinking flag.
  clearZoneActiveExploreFlags();

  const tile = currentZone.tiles[ty][tx];
  if (tile) {
    tile.isActiveExplore = true; // this makes the tile blink
  }

  if (typeof renderZoneUI === "function") {
    renderZoneUI();
  }

  // Exploration delay (ms). You can tune these or move to GAME_CONFIG later.
  const delay = 200 + Math.random() * 200; // 1–3 seconds

  zoneExploreDelayTimerId = setTimeout(() => {
    zoneExploreDelayTimerId = null;
    if (typeof onReveal === "function") {
      onReveal();
    }
  }, delay);
}

function cancelZoneExploreDelay() {
  if (zoneExploreDelayTimerId) {
    clearTimeout(zoneExploreDelayTimerId);
    zoneExploreDelayTimerId = null;
  }
}

function stopZoneExplorationTicks() {
  if (!zoneExplorationActive) return;

  zoneExplorationActive = false;
  if (zoneExplorationTimerId) {
    clearTimeout(zoneExplorationTimerId);
    zoneExplorationTimerId = null;
  }

  // Also stop any movement in progress
  stopZoneMovement();

  // Cancel any pending explore delay
  cancelZoneExploreDelay();

  // Clear the "blinking" tile so no ? keeps flashing.
  clearZoneActiveExploreFlags();

  if (typeof renderZoneUI === "function") {
    renderZoneUI();
  }

  console.log("Zone exploration ticks stopped.");
}

// 0.0.70c — Called once when a zone becomes fully explored.
function onZoneFullyExplored() {
  console.log("Zone fully explored. Unlocking adjacent world tiles (0.0.70c).");

  // Need a world map + helper to do anything.
  if (!worldMap) return;
  if (typeof unlockAdjacentWorldTiles !== "function") return;

  const x = worldMap.currentX;
  const y = worldMap.currentY;

  if (typeof x !== "number" || typeof y !== "number") {
    return;
  }

  // Apply the world rule: reveal neighbors around this world tile.
  unlockAdjacentWorldTiles(worldMap, x, y);

  // Optional player feedback.
  if (typeof addZoneMessage === "function") {
    addZoneMessage(
      "You feel the world open up. New areas are now visible on the world map."
    );
  }
    // 0.0.70c — Auto-save after world expansion so unlocked zones persist
  if (typeof saveCurrentGame === "function") {
    saveCurrentGame();
  }
}

function startZoneManualExploreOnce() {
  if (zoneManualExplorationActive) return;
  if (zoneExplorationActive) return;
  if (zoneMovementActive) return;
  if (!isInZone || !currentZone) return;
  if (!window.ZoneDebug || typeof ZoneDebug.getZoneExplorationStats !== "function") return;

  const stats = ZoneDebug.getZoneExplorationStats(currentZone);
  if (stats.isComplete || stats.exploredTiles >= stats.totalExplorableTiles) {
    if (typeof onZoneFullyExplored === "function") {
      onZoneFullyExplored();
    }

    if (typeof addZoneMessage === "function") {
      addZoneMessage("There is nothing left to explore here.");
    }
    if (typeof renderZoneUI === "function") {
      renderZoneUI();
    }
    return;
  }

  if (
    !window.ZoneDebug ||
    typeof ZoneDebug.prepareNextExplorationTile !== "function"
  ) {
    return;
  }

  const prepared = ZoneDebug.prepareNextExplorationTile(currentZone);
  if (!prepared) {
    if (typeof addZoneMessage === "function") {
      addZoneMessage("There is nothing left to explore here.");
    }
    if (typeof renderZoneUI === "function") {
      renderZoneUI();
    }
    return;
  }

  if (typeof renderZoneUI === "function") {
    renderZoneUI();
  }

  const path = findPathToPreparedTile(currentZone);
  zoneManualExplorationActive = true;

  const finishManualExplore = () => {
    zoneManualExplorationActive = false;
    revealNextTileWithMessageAndUI();
    if (typeof renderZoneUI === "function") {
      renderZoneUI();
    }
  };

  if (!path || path.length === 0) {
    // Already on the tile: just run the explore delay + reveal.
    startZoneExploreDelay(finishManualExplore);
    return;
  }

  startZoneMovement(path, () => {
    startZoneExploreDelay(finishManualExplore);
  });
}

// Expose for UI
window.startZoneManualExploreOnce = startZoneManualExploreOnce;

// Expose for UI script
window.startZoneExplorationTicks = startZoneExplorationTicks;
window.stopZoneExplorationTicks = stopZoneExplorationTicks;

// ----- Equipment helpers -----
function unequipSlotToInventory(slotKey) {
  const item = unequipSlot(slotKey); // from equipment.js
  if (!item) return;

  addToInventory(item);
  if (typeof recomputeCharacterComputedState === "function") {
    recomputeCharacterComputedState();
  }
  if (typeof saveCurrentGame === "function") {
    saveCurrentGame();
  }
}

function changeWeaponSkill(key, delta) {
  if (!currentCharacter) return;
  const cfg = (GAME_CONFIG.skills && GAME_CONFIG.skills.weapon) || {};
  const min = cfg.minLevel ?? 0;
  const max = cfg.maxLevel ?? 200;

  if (!currentCharacter.skills) {
    currentCharacter.skills = createDefaultSkills();
  }

  const oldVal = currentCharacter.skills[key] ?? 0;
  let next = oldVal + delta;

  if (next < min) next = min;
  if (next > max) next = max;
  if (next === oldVal) return;

  currentCharacter.skills[key] = next;

  // Recompute + autosave
  recomputeCharacterComputedState();
  if (typeof saveCurrentGame === "function") {
    saveCurrentGame();
  }
}

// NEW: dev helper to tweak base attributes directly from equipment panel
function changeAttribute(key, delta) {
  if (!currentCharacter || !currentCharacter.stats) return;

  const stats = currentCharacter.stats;
  if (typeof stats[key] !== "number") {
    stats[key] = 0;
  }

  const next = stats[key] + delta;
  if (next < 1) return; // avoid 0 or negative for now

  stats[key] = next;

  recomputeCharacterComputedState();
  if (typeof saveCurrentGame === "function") {
    saveCurrentGame();
  }
}

function updateHPBar() {
  if (!hpBarContainer || !hpBarFill || !hpBarLabel) return;

  if (!characterComputed || !characterComputed.derivedStats) {
    hpBarContainer.style.display = "none";
    return;
  }

  const max = characterComputed.derivedStats.maxHP || 0;
  if (max <= 0) {
    hpBarContainer.style.display = "none";
    return;
  }

  // For now, always full HP (no damage system yet)
  if (!currentHP || currentHP > max) {
    currentHP = max;
  }

  const pct = Math.max(0, Math.min(100, (currentHP / max) * 100));
  hpBarFill.style.width = `${pct}%`;
  hpBarLabel.textContent = `HP ${Math.round(currentHP)}/${Math.round(max)}`;
  hpBarContainer.style.display = "block";
}

/**
 * Recompute the character's attributes and derived stats based on:
 * - The current character's base stats (STR, DEX, INT, VIT)
 * - The currently equipped items (summarized by equipment.js)
 */
function recomputeCharacterComputedState() {
  if (!currentCharacter) {
    characterComputed = null;
    updateEquipmentPanel();
    console.warn("recomputeCharacterComputedState: no currentCharacter yet");
    return;
  }

  // Ask the equipment system to summarize bonuses + weapon type
  const equipmentSummary = summarizeEquipmentForCharacter();

  // Ask character.js to build the full computed state
  characterComputed = buildCharacterComputedState(
    currentCharacter,
    equipmentSummary
  );

  updateEquipmentPanel();
  updateCharacterSummary();
  updateHPBar();
  updateSkillsPanel(); // NEW

  // For debugging:
  console.log("Character computed state:", characterComputed);
}

/**
 * Render the equipment panel: equipped items + character summary.
 * (Equipment view is the "character sheet" now.)
 */
function updateEquipmentPanel() {
  if (!equipmentSlotsContainer || !equipmentSummaryContainer) return;

  // Clear existing UI
  equipmentSlotsContainer.innerHTML = "";
  equipmentSummaryContainer.innerHTML = "";

  // No character? show nothing but early exit
  if (!currentCharacter || !characterComputed) {
    return;
  }

  const equippedState = getEquippedState(); // from equipment.js
  const attrs = characterComputed.attributeTotals;
  const derived = characterComputed.derivedStats;

  const slotDefs = [
    { key: "weapon",  label: "Weapon" },
    { key: "chest",   label: "Chest" },
    { key: "legs",    label: "Legs" },
    { key: "feet",    label: "Feet" },
    { key: "trinket", label: "Trinket" },
  ];

  // ---- Slot rows ----
  slotDefs.forEach((def) => {
    const row = document.createElement("div");
    row.className = "equipment-slot-row";

    const labelSpan = document.createElement("span");
    labelSpan.className = "equipment-slot-label";
    labelSpan.textContent = def.label + ":";
    row.appendChild(labelSpan);

    const item = equippedState[def.key];

    if (item) {
      const itemSpan = document.createElement("span");
      itemSpan.className = `equipment-slot-item rarity ${rarityClass(item.rarity)}`;
      itemSpan.textContent = `${item.name} [${item.quality}]`;

      // Tooltip: same structure as inventory tooltip, but without +/- comparisons
      if (typeof buildEquipmentItemTooltip === "function") {
        Tooltip.bind(itemSpan, () =>
          buildEquipmentItemTooltip(item, def.key)
        );
      }

      row.appendChild(itemSpan);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "trash-btn"; // same style as other small buttons
      btn.textContent = "Unequip";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        Tooltip.hide();
        unequipSlotToInventory(def.key);
      });
      row.appendChild(btn);
    } else {
      const emptySpan = document.createElement("span");
      emptySpan.className = "equipment-slot-empty";
      emptySpan.textContent = "(empty)";
      row.appendChild(emptySpan);
    }

    equipmentSlotsContainer.appendChild(row);
  });

  // ---- Summary: attributes ----
  const attrsSection = document.createElement("div");
  attrsSection.className = "equipment-summary-section";

  const attrsTitle = document.createElement("div");
  attrsTitle.className = "equipment-summary-title";
  attrsTitle.textContent = "Attributes";
  attrsSection.appendChild(attrsTitle);

  const total = attrs.total;
  const bonus = attrs.bonus;

  function makeAttrRow(label, key) {
    const row = document.createElement("div");
    row.className = "equipment-summary-row";

    const left = document.createElement("span");
    left.textContent = label;
    row.appendChild(left);

    const mid = document.createElement("span");
    const t = total[key];
    const b = bonus[key];
    mid.textContent = `${fmt(t)} (${fmt(b)})`;
    row.appendChild(mid);

    // Right: dev +/- buttons for testing attributes
    const right = document.createElement("span");

    const minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.className = "trash-btn";
    minusBtn.textContent = "-";
    minusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      changeAttribute(key, -1);
    });

    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "equip-btn";
    plusBtn.textContent = "+";
    plusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      changeAttribute(key, +1);
    });

    right.appendChild(minusBtn);
    right.appendChild(plusBtn);
    row.appendChild(right);

    return row;
  }

  attrsSection.appendChild(makeAttrRow("STR:", "str"));
  attrsSection.appendChild(makeAttrRow("DEX:", "dex"));
  attrsSection.appendChild(makeAttrRow("INT:", "int"));
  attrsSection.appendChild(makeAttrRow("VIT:", "vit"));

  equipmentSummaryContainer.appendChild(attrsSection);

  // ---- Summary: derived stats ----
  const derivedSection = document.createElement("div");
  derivedSection.className = "equipment-summary-section";

  const derivedTitle = document.createElement("div");
  derivedTitle.className = "equipment-summary-title";
  derivedTitle.textContent = "Derived Stats";
  derivedSection.appendChild(derivedTitle);

  function makeDerivedRow(label, value, suffix = "") {
    const row = document.createElement("div");
    row.className = "equipment-summary-row";
    const left = document.createElement("span");
    left.textContent = label;
    const right = document.createElement("span");
    right.textContent = `${fmt(value)}${suffix}`;
    row.appendChild(left);
    row.appendChild(right);
    return row;
  }

  derivedSection.appendChild(makeDerivedRow("Max HP:", derived.maxHP));

  if (derived.attack) {
    derivedSection.appendChild(
      makeDerivedRow(`${derived.attack.label}:`, derived.attack.value)
    );
    derivedSection.appendChild(
      makeDerivedRow("Attack Speed:", derived.attackSpeed)
    );
    derivedSection.appendChild(
      makeDerivedRow("DPS:", derived.dps)
    );
  }

  derivedSection.appendChild(
    makeDerivedRow("Crit Chance:", derived.critChance, "%")
  );
  derivedSection.appendChild(
    makeDerivedRow("Loot Find:", derived.lootFind, "%")
  );

  equipmentSummaryContainer.appendChild(derivedSection);
}

/**
 * Render the Skills panel: weapon skills with dev +/- controls.
 */
function updateSkillsPanel() {
  if (!skillsPanel || !skillsListContainer) return;

  skillsListContainer.innerHTML = "";

  if (!currentCharacter) return;

  const skillsCfg = GAME_CONFIG.skills && GAME_CONFIG.skills.weapon;
  const skills = currentCharacter.skills;

  if (!skillsCfg || !skills) {
    skillsListContainer.textContent = "No skills available.";
    return;
  }

  const labels = skillsCfg.labels || {};
  const skillKeys = Object.keys(labels);

  const title = document.createElement("div");
  title.className = "equipment-summary-title";
  title.textContent = "Weapon Skills";
  skillsListContainer.appendChild(title);

  skillKeys.forEach((key) => {
    const row = document.createElement("div");
    row.className = "equipment-summary-row";

    const left = document.createElement("span");
    left.textContent = labels[key] + ":";
    row.appendChild(left);

    const mid = document.createElement("span");
    mid.textContent = skills[key] ?? 0;
    row.appendChild(mid);

    const right = document.createElement("span");

    const minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.className = "trash-btn";
    minusBtn.textContent = "-";
    minusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      changeWeaponSkill(key, -1);
      updateSkillsPanel();
    });

    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "equip-btn";
    plusBtn.textContent = "+";
    plusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      changeWeaponSkill(key, +1);
      updateSkillsPanel();
    });

    right.appendChild(minusBtn);
    right.appendChild(plusBtn);
    row.appendChild(right);

    skillsListContainer.appendChild(row);
  });
}

// ----- Character model / creation state -----
let currentCharacter = null;
let currentSaveId = null;

function updateCharacterSummary() {
  // Only show the character name in the header; all stats are in the equipment view.
  if (!currentCharacter) {
    if (charSummaryName) charSummaryName.textContent = "";
    if (charSummaryStats) charSummaryStats.textContent = "";
    return;
  }

  if (charSummaryName) {
    charSummaryName.textContent = currentCharacter.name;
  }

  if (charSummaryStats) {
    charSummaryStats.textContent = "";
  }
}

// ----- Initial screen -----
setScreen("start");
resetCharacterCreation();
renderSaveList();

// ----- Inventory / Loot / Equipment logic -----

let inventoryUnlocked = false;
let equipmentUnlocked = false;

window.debugCharacterComputed = () => {
  console.log("Character computed state:", characterComputed);
  return characterComputed;
};

window.debugZoneState = () => {
  console.log("Current Zone:", currentZone);
  if (currentZone && window.ZoneDebug) {
    console.log(
      "Exploration stats:",
      window.ZoneDebug.getZoneExplorationStats(currentZone)
    );
  }
  return currentZone;
};

window.debugWorldMap = () => {
  console.log("World Map:", worldMap);
  return worldMap;
};
