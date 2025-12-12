// scripts/game.js
console.log(`game.js loaded v${GAME_CONFIG.version}`);

// ---- State bridge (temporary) ----
// Source of truth is PC.state.
// These helpers avoid direct globals and make refactors safe.

// Authoritative state access lives in pc.api.js via STATE()/EXP()/MOV()
const S = () => STATE();

// Initialize fields (these are DATA fields, not functions)
S().currentHP = S().currentHP ?? 0;
S().characterComputed = S().characterComputed ?? null;
S().currentZone = S().currentZone ?? null;
S().isInZone = S().isInZone ?? false;
S().worldMap = S().worldMap ?? null;

// Getters / setters
function getCurrentHP() { return S().currentHP; }
function setCurrentHP(v) { S().currentHP = v; }

function getCharacterComputed() { return S().characterComputed; }
function setCharacterComputed(v) { S().characterComputed = v; }

function getCurrentZone() { return S().currentZone; }
function setCurrentZone(z) { S().currentZone = z; }

function getIsInZone() { return S().isInZone; }
function setIsInZone(v) { S().isInZone = v; }

function getWorldMap() { return S().worldMap; }
function setWorldMap(m) { S().worldMap = m; }


function clearActiveExplorationFlag(zone) {
  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      zone.tiles[y][x].isActiveExplore = false;
    }
  }
}

function enterZoneFromWorldMap(x, y) {
  if (typeof getWorldMapTile !== "function") {
    console.warn("enterZoneFromWorldMap: getWorldMapTile is not available.");
    return;
  }

  const wm = getWorldMap();
  if (!wm) {
    console.warn("enterZoneFromWorldMap: getWorldMap() is not initialized.");
    return;
  }

  const tile = getWorldMapTile(wm, x, y);
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

  // 0.0.70c: Ensure a definition exists for auto-generated zones
  if (typeof ZONE_DEFINITIONS !== "undefined") {
    const existingDef = ZONE_DEFINITIONS[tile.zoneId];

    if (!existingDef && typeof ensureGeneratedZoneDefinitionForWorldTile === "function") {
      ensureGeneratedZoneDefinitionForWorldTile(tile);
    }
  } else {
    console.error("enterZoneFromWorldMap: ZONE_DEFINITIONS is not defined.");
    return;
  }

  // Create zone instance
  const newZone = createZoneFromDefinition(tile.zoneId);
  if (!newZone) {
    console.error("enterZoneFromWorldMap: failed to create zone", tile.zoneId);
    return;
  }

  // Switch state to the new zone
  setCurrentZone(newZone);
  setIsInZone(true);
  
  const zone = getCurrentZone();


  // Place player on entry spawn immediately (0.0.70c+)
  if (zone && zone.entrySpawn && zone.tiles) {
    const sx = zone.entrySpawn.x;
    const sy = zone.entrySpawn.y;

    if (
      typeof sx === "number" && typeof sy === "number" &&
      sy >= 0 && sy < zone.height &&
      sx >= 0 && sx < zone.width
    ) {
      const spawnTile = zone.tiles[sy][sx];
      if (spawnTile) {
        spawnTile.explored = true;
        setZonePlayerPosition(zone, sx, sy);
        zone.playerX = sx;
        zone.playerY = sy;
      }
    } else {
      console.warn("enterZoneFromWorldMap: entrySpawn out of bounds", zone.entrySpawn);
    }
  }

  // Cleanup explored connectivity (0.0.70c+)
  if (typeof normalizeZoneExploredConnectivity === "function") {
    normalizeZoneExploredConnectivity(zone);
  }

  // Update fog + current position on the world map
  if (tile.fogState !== WORLD_FOG_STATE.VISITED) {
    tile.fogState = WORLD_FOG_STATE.VISITED;
  }

  wm.currentX = x;
  wm.currentY = y;
  setWorldMap(wm);

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

// Ensure exploration/movement substates are initialized (covers older saves / partial state)
const exp = EXP();
exp.zoneExplorationActive = exp.zoneExplorationActive ?? false;
exp.zoneExplorationTimerId = exp.zoneExplorationTimerId ?? null;
exp.zoneManualExplorationActive = exp.zoneManualExplorationActive ?? false;
exp.zoneManualTimerId = exp.zoneManualTimerId ?? null;
exp.zoneExploreDelayTimerId = exp.zoneExploreDelayTimerId ?? null;

const mov = MOV();
mov.zoneMovementActive = mov.zoneMovementActive ?? false;
mov.zoneMovementTimerId = mov.zoneMovementTimerId ?? null;
mov.zoneMovementPath = mov.zoneMovementPath ?? null;
mov.zoneMovementOnArrival = mov.zoneMovementOnArrival ?? null;


// Movement speed: tiles per second. You can override this in GAME_CONFIG.zone
// by adding "movementTilesPerSecond" there.
const ZONE_MOVEMENT_TILES_PER_SECOND =
  (GAME_CONFIG.zone && GAME_CONFIG.zone.movementTilesPerSecond) || 4;

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
  const cfg = (GAME_CONFIG.skills && GAME_CONFIG.skills().weapon) || {};
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

  const cc = getCharacterComputed();
  if (!cc || !cc.derivedStats) {
    hpBarContainer.style.display = "none";
    return;
  }

  const max = cc.derivedStats().maxHP || 0;
  if (max <= 0) {
    hpBarContainer.style.display = "none";
    return;
  }

  // For now, always full HP (no damage system yet)
  let hp = getCurrentHP();
  if (!hp || hp > max) {
    hp = max;
    setCurrentHP(hp);
  }

  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  hpBarFill.style.width = `${pct}%`;
  hpBarLabel.textContent = `HP ${Math.round(hp)}/${Math.round(max)}`;
  hpBarContainer.style.display = "block";
}

/**
 * Recompute the character's attributes and derived stats based on:
 * - The current character's base stats (STR, DEX, INT, VIT)
 * - The currently equipped items (summarized by equipment.js)
 */
function recomputeCharacterComputedState() {
  if (!currentCharacter) {
    setCharacterComputed(null);
    updateEquipmentPanel();
    console.warn("recomputeCharacterComputedState: no currentCharacter yet");
    return;
  }

  // Ask the equipment system to summarize bonuses + weapon type
  const equipmentSummary = summarizeEquipmentForCharacter();

  // Ask character.js to build the full computed state
  setCharacterComputed(
    buildCharacterComputedState(currentCharacter, equipmentSummary)
  );

  updateEquipmentPanel();
  updateCharacterSummary();
  updateHPBar();
  updateSkillsPanel(); // NEW

  // For debugging:
  console.log("Character computed state:", getCharacterComputed());
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

  // No character or no computed state? show nothing but early exit
  const cc = getCharacterComputed();
  if (!currentCharacter || !cc) {
    return;
  }

  const equippedState = getEquippedState(); // from equipment.js
  const attrs = cc.attributeTotals;
  const derived = cc.derivedStats;

  const slotDefs = [
    { key: "weapon",  label: "Weapon" },
    { key: "chest",   label: "Chest" },
    { key: "legs",    label: "Legs" },
    { key: "feet",    label: "Feet" },
    { key: "trinket", label: "Trinket" },
  ];

  // ---- Slot rows ----
  slotDefs().forEach((def) => {
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

  const total = attrs().total;
  const bonus = attrS().bonus;

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
 * Render the Skills panel: weapon skills with dev +/- controlS().
 */
function updateSkillsPanel() {
  if (!skillsPanel || !skillsListContainer) return;

  skillsListContainer.innerHTML = "";

  if (!currentCharacter) return;

  const skillsCfg = GAME_CONFIG.skills && GAME_CONFIG.skillS().weapon;
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

  skillKeys().forEach((key) => {
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
    if (charSummaryStats) charSummaryStats().textContent = "";
    return;
  }

  if (charSummaryName) {
    charSummaryName.textContent = currentCharacter.name;
  }

  if (charSummaryStats) {
    charSummaryStatS().textContent = "";
  }
}

// ----- Inventory / Loot / Equipment logic -----

let inventoryUnlocked = false;
let equipmentUnlocked = false;

window.debugCharacterComputed = () => {
  console.log("Character computed state:", getCharacterComputed());
  return getCharacterComputed();
};

window.debugZoneState = () => {
  console.log("Current Zone:", getCurrentZone());
  if (getCurrentZone() && window.ZoneDebug) {
    console.log(
      "Exploration stats:",
      window.ZoneDebug.getZoneExplorationStats(getCurrentZone())
    );
  }
  return getCurrentZone();
};

window.debugWorldMap = () => {
  console.log("World Map:", getWorldMap());
  return getWorldMap();
};

