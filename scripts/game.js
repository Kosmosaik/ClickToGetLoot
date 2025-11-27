// scripts/game.js
console.log(`game.js loaded v${GAME_CONFIG.version}`);

// ----- Screen elements -----
const screenStart = document.getElementById("screen-start");
const screenCharacter = document.getElementById("screen-character");
const screenGame = document.getElementById("screen-game");

const btnNewGame = document.getElementById("btn-new-game");
const btnBackToStart = document.getElementById("btn-back-to-start");
const saveListContainer = document.getElementById("save-list");

const hpBarContainer = document.getElementById("hp-bar-container");
const hpBarFill = document.getElementById("hp-bar-fill");
const hpBarLabel = document.getElementById("hp-bar-label");

let currentHP = 0;

// Holds the fully computed character state (attributes + derived stats)
// so UI or other systems can use it.
let characterComputed = null;

// ----- Equipment / loot / inventory UI elements -----
const lootButton = document.getElementById("loot-button");
const progressBar = document.getElementById("progress");
const progressContainer = document.getElementById("progress-container");
const inventoryPanel = document.getElementById("inventory-panel");
const inventoryButton = document.getElementById("inventory-btn");

const equipmentPanel = document.getElementById("equipment-panel");
const equipmentButton = document.getElementById("equipment-btn");
const equipmentSlotsContainer = document.getElementById("equipment-slots");
const equipmentSummaryContainer = document.getElementById("equipment-summary");

// NEW: skills UI
const skillsPanel = document.getElementById("skills-panel");
const skillsButton = document.getElementById("skills-btn");
const skillsListContainer = document.getElementById("skills-list");

// ----- Character summary on game screen -----
const charSummaryName = document.getElementById("char-summary-name");
const charSummaryStats = document.getElementById("char-summary-stats");

// Simple screen state: "start" | "character" | "game"
let currentScreen = "start";

function setScreen(screen) {
  currentScreen = screen;

  if (screenStart) screenStart.hidden = screen !== "start";
  if (screenCharacter) screenCharacter.hidden = screen !== "character";
  if (screenGame) screenGame.hidden = screen !== "game";
}

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

// Button wiring for start / character screens
if (btnNewGame) {
  btnNewGame.addEventListener("click", () => {
    // New character starts with empty inventory and locked features
    loadInventoryFromSnapshot(null);
    loadEquippedFromSnapshot(null);

    currentCharacter = null;
    currentSaveId = null;
    characterComputed = null;
    updateEquipmentPanel();

    inventoryUnlocked = false;
    equipmentUnlocked = false;

    if (inventoryButton) {
      inventoryButton.style.display = "none";
    }
    if (equipmentButton) {
      equipmentButton.style.display = "none";
    }
    if (equipmentPanel) {
      equipmentPanel.style.display = "none";
    }

    resetCharacterCreation();
    setScreen("character");
  });
}

if (btnBackToStart) {
  btnBackToStart.addEventListener("click", () => {
    setScreen("start");
  });
}

// ----- Inventory / Loot / Equipment logic -----

let inventoryUnlocked = false;
let equipmentUnlocked = false;

// UI events
if (lootButton) {
  lootButton.addEventListener("click", startLoot);
}

if (inventoryButton) {
  inventoryButton.addEventListener("click", () => {
    if (!inventoryPanel) return;
    inventoryPanel.style.display =
      (inventoryPanel.style.display === "block") ? "none" : "block";
  });
}

if (equipmentButton && equipmentPanel) {
  equipmentButton.addEventListener("click", () => {
    equipmentPanel.style.display =
      (equipmentPanel.style.display === "block") ? "none" : "block";
  });
}

if (skillsButton && skillsPanel) {
  skillsButton.addEventListener("click", () => {
    const visible = skillsPanel.style.display === "block";
    skillsPanel.style.display = visible ? "none" : "block";
  });
}

window.debugCharacterComputed = () => {
  console.log("Character computed state:", characterComputed);
  return characterComputed;
};
