// scripts/game.js
console.log(`game.js loaded v${GAME_CONFIG.version}`);

// ----- Screen elements -----
const screenStart = document.getElementById("screen-start");
const screenCharacter = document.getElementById("screen-character");
const screenGame = document.getElementById("screen-game");

const btnNewGame = document.getElementById("btn-new-game");
const btnBackToStart = document.getElementById("btn-back-to-start");
const btnCreateCharacter = document.getElementById("btn-create-character");
const saveListContainer = document.getElementById("save-list");

// Character creation elements
const charNameInput = document.getElementById("char-name");
const btnRerollName = document.getElementById("btn-reroll-name");
const btnRandomStats = document.getElementById("btn-random-stats");

const statStrValue = document.getElementById("stat-str-value");
const statDexValue = document.getElementById("stat-dex-value");
const statIntValue = document.getElementById("stat-int-value");
const statVitValue = document.getElementById("stat-vit-value");
const pointsLeftElem = document.getElementById("points-left");

const btnStrMinus = document.getElementById("btn-str-minus");
const btnStrPlus = document.getElementById("btn-str-plus");
const btnDexMinus = document.getElementById("btn-dex-minus");
const btnDexPlus = document.getElementById("btn-dex-plus");
const btnIntMinus = document.getElementById("btn-int-minus");
const btnIntPlus = document.getElementById("btn-int-plus");
const btnVitMinus = document.getElementById("btn-vit-minus");
const btnVitPlus = document.getElementById("btn-vit-plus");

const hpBarContainer = document.getElementById("hp-bar-container");
const hpBarFill = document.getElementById("hp-bar-fill");
const hpBarLabel = document.getElementById("hp-bar-label");

let currentHP = 0;

// Patch notes
const patchNotesBtn = document.getElementById("patch-notes-btn");
const patchNotesPanel = document.getElementById("patch-notes-panel");
const patchNotesClose = document.getElementById("patch-notes-close");
const patchNotesTitle = document.getElementById("patch-notes-title");
const patchNotesContent = document.getElementById("patch-notes-content");

let patchNotesLoaded = false;

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

  // For debugging:
  console.log("Character computed state:", characterComputed);
}

/**
 * Render the equipment panel: equipped items + character summary.
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
    const right = document.createElement("span");
    const t = total[key];
    const b = bonus[key];
    right.textContent = `${fmt(t)} (${fmt(b)})`;
    row.appendChild(left);
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

  // ---- Weapon Skills ----
  const skillsCfg = GAME_CONFIG.skills && GAME_CONFIG.skills.weapon;
  const skills = currentCharacter && currentCharacter.skills;

  if (skillsCfg && skills) {
    const skillsSection = document.createElement("div");
    skillsSection.className = "equipment-summary-section";

    const skillsTitle = document.createElement("div");
    skillsTitle.className = "equipment-summary-title";
    skillsTitle.textContent = "Weapon Skills (dev)";
    skillsSection.appendChild(skillsTitle);

    const labels = skillsCfg.labels || {};
    const skillKeys = Object.keys(labels);

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
      });

      const plusBtn = document.createElement("button");
      plusBtn.type = "button";
      plusBtn.className = "equip-btn";
      plusBtn.textContent = "+";
      plusBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        changeWeaponSkill(key, +1);
      });

      right.appendChild(minusBtn);
      right.appendChild(plusBtn);
      row.appendChild(right);

      skillsSection.appendChild(row);
    });

    equipmentSummaryContainer.appendChild(skillsSection);
  }
}

// ----- Patch notes -----
async function loadPatchNotesFromChangelog() {
  if (patchNotesLoaded || !patchNotesContent) return;

  try {
    const res = await fetch("CHANGELOG.md");
    const text = await res.text();

    // Split into sections by "## " headings
    const sections = text.split(/^## /m).filter(Boolean);

    if (!sections.length) {
      patchNotesContent.textContent = "No patch notes found.";
      return;
    }

    // Assuming newest version is at the top of the changelog
    const latest = sections[0];

    const firstLineEnd = latest.indexOf("\n");
    const heading = latest.slice(0, firstLineEnd).trim();
    const body = latest.slice(firstLineEnd).trim();

    if (patchNotesTitle) {
      patchNotesTitle.textContent = `Patch Notes — ${heading}`;
    }

    patchNotesContent.textContent = body;
    patchNotesLoaded = true;
  } catch (err) {
    console.warn("Failed to load CHANGELOG.md", err);
    patchNotesContent.textContent = "Failed to load patch notes.";
  }
}

if (patchNotesBtn && patchNotesPanel) {
  patchNotesBtn.addEventListener("click", () => {
    patchNotesPanel.hidden = false;
    loadPatchNotesFromChangelog();
  });
}

if (patchNotesClose && patchNotesPanel) {
  patchNotesClose.addEventListener("click", () => {
    patchNotesPanel.hidden = true;
  });
}

// Close when clicking backdrop
if (patchNotesPanel) {
  patchNotesPanel.addEventListener("click", (e) => {
    if (e.target.classList.contains("patch-notes-backdrop")) {
      patchNotesPanel.hidden = true;
    }
  });
}

// ----- Character model / creation state -----
const BASE_STAT = 5;
const EXTRA_POINTS = 20;

let currentCharacter = null;
let currentSaveId = null;

const creationStats = {
  str: BASE_STAT,
  dex: BASE_STAT,
  int: BASE_STAT,
  vit: BASE_STAT,
};
let pointsLeft = EXTRA_POINTS;

// Simple random name generator
const NAME_POOL = [
  "Arin", "Lyra", "Drog", "Mira", "Thalen",
  "Kira", "Borin", "Selene", "Rogar", "Elira",
];

function randomName() {
  const idx = Math.floor(Math.random() * NAME_POOL.length);
  return NAME_POOL[idx];
}

function resetCharacterCreation() {
  creationStats.str = BASE_STAT;
  creationStats.dex = BASE_STAT;
  creationStats.int = BASE_STAT;
  creationStats.vit = BASE_STAT;
  pointsLeft = EXTRA_POINTS;

  if (charNameInput) {
    charNameInput.value = "";
  }

  updateCharacterCreationUI();
}

function updateCharacterCreationUI() {
  if (statStrValue) statStrValue.textContent = creationStats.str;
  if (statDexValue) statDexValue.textContent = creationStats.dex;
  if (statIntValue) statIntValue.textContent = creationStats.int;
  if (statVitValue) statVitValue.textContent = creationStats.vit;
  if (pointsLeftElem) pointsLeftElem.textContent = pointsLeft;
}

function adjustStat(key, delta) {
  if (!(key in creationStats)) return;

  if (delta > 0) {
    if (pointsLeft <= 0) return;
    creationStats[key] += 1;
    pointsLeft -= 1;
  } else if (delta < 0) {
    // Don't go below base stat
    if (creationStats[key] <= BASE_STAT) return;
    creationStats[key] -= 1;
    pointsLeft += 1;
  }
  updateCharacterCreationUI();
}

function randomizeStats() {
  // Reset to base
  creationStats.str = BASE_STAT;
  creationStats.dex = BASE_STAT;
  creationStats.int = BASE_STAT;
  creationStats.vit = BASE_STAT;
  pointsLeft = EXTRA_POINTS;

  // Distribute EXTRA_POINTS randomly across stats
  const keys = ["str", "dex", "int", "vit"];
  for (let i = 0; i < EXTRA_POINTS; i++) {
    const k = keys[Math.floor(Math.random() * keys.length)];
    creationStats[k] += 1;
  }
  // All extra points used
  pointsLeft = 0;
  updateCharacterCreationUI();
}

function updateCharacterSummary() {
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

  if (!characterComputed || !characterComputed.derivedStats) {
    charSummaryStats.textContent = "";
    return;
  }

  const d = characterComputed.derivedStats;
  const hp = typeof fmt === "function" ? fmt(d.maxHP || 0) : d.maxHP;
  const atk = d.attack ? fmt(d.attack.value || 0) : 0;
  const as = d.attackSpeed != null ? fmt(d.attackSpeed) : 0;
  const dps = d.dps != null ? fmt(d.dps) : 0;

  charSummaryStats.textContent =
    `HP ${hp} | ATK ${atk} | AS ${as} | DPS ${dps}`;
}

// ----- Save system -----
const SAVE_KEY = "CTGL_SAVES_V1";

function loadAllSaves() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn("Failed to load saves:", e);
    return [];
  }
}

function writeAllSaves(saves) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
  } catch (e) {
    console.warn("Failed to write saves:", e);
  }
}

function renderSaveList(saves = loadAllSaves()) {
  if (!saveListContainer) return;

  saveListContainer.innerHTML = "";

  if (!saves.length) {
    const p = document.createElement("p");
    p.textContent = "No saved characters yet.";
    saveListContainer.appendChild(p);
    return;
  }

  const list = document.createElement("div");
  list.className = "save-list";

  saves.forEach(save => {
    const row = document.createElement("div");
    row.className = "save-row";

    const label = document.createElement("span");
    const st = save.stats || {};
    label.textContent =
      `${save.name} — STR ${st.str} | DEX ${st.dex} | INT ${st.int} | VIT ${st.vit}`;
    row.appendChild(label);

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => {
      loadSave(save.id);
    });
    row.appendChild(loadBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      deleteSave(save.id);
    });
    row.appendChild(deleteBtn);

    list.appendChild(row);
  });

  saveListContainer.appendChild(list);
}

function generateId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `save-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function saveCurrentGame() {
  if (!currentCharacter) return;

  const saves = loadAllSaves();

  const snapshot = {
    id: currentSaveId || generateId(),
    name: currentCharacter.name,
    stats: { ...currentCharacter.stats },
    skills: cloneSkills(currentCharacter.skills),   // NEW
    inventory: getInventorySnapshot(),
    equipped: getEquippedSnapshot(),
    features: {
      inventoryUnlocked: inventoryUnlocked,
      equipmentUnlocked: equipmentUnlocked,
    },
  };

  const idx = saves.findIndex(s => s.id === snapshot.id);
  if (idx === -1) {
    saves.push(snapshot);
  } else {
    saves[idx] = snapshot;
  }

  currentSaveId = snapshot.id;
  writeAllSaves(saves);
  renderSaveList(saves);
}

function loadSave(id) {
  const saves = loadAllSaves();
  const save = saves.find(s => s.id === id);
  if (!save) return;
  
  currentCharacter = {
    name: save.name,
    stats: { ...save.stats },
    skills: save.skills
      ? cloneSkills(save.skills)
      : createDefaultSkills(), // fallback for old saves
  };
  currentSaveId = save.id;

  loadInventoryFromSnapshot(save.inventory || {});
  // Restore equipped items (if present)
  if (save.equipped) {
    loadEquippedFromSnapshot(save.equipped);
  } else {
    // If there was no equipment in the old save format, clear equipped.
    loadEquippedFromSnapshot(null);
  }

  updateCharacterSummary();
  recomputeCharacterComputedState();

  // ----- Restore feature unlocks (with backward-compat) -----
  const feats = save.features || {};

  const hasInventoryItems =
    save.inventory && Object.keys(save.inventory).length > 0;
  const hasEquippedItems =
    save.equipped && Object.values(save.equipped).some(Boolean);

  // If old save (no flags), infer from contents
  inventoryUnlocked =
    typeof feats.inventoryUnlocked === "boolean"
      ? feats.inventoryUnlocked
      : hasInventoryItems;

  equipmentUnlocked =
    typeof feats.equipmentUnlocked === "boolean"
      ? feats.equipmentUnlocked
      : hasEquippedItems;

  if (inventoryButton) {
    inventoryButton.style.display = inventoryUnlocked ? "block" : "none";
  }
  if (equipmentButton) {
    equipmentButton.style.display = equipmentUnlocked ? "block" : "none";
  }
  if (equipmentPanel && !equipmentUnlocked) {
    equipmentPanel.style.display = "none";
  }

  setScreen("game");
}

function deleteSave(id) {
  let saves = loadAllSaves();
  saves = saves.filter(s => s.id !== id);
  writeAllSaves(saves);

  // If you delete the currently loaded character, reset state
  if (currentSaveId === id) {
    currentCharacter = null;
    currentSaveId = null;
    loadInventoryFromSnapshot(null);
    loadEquippedFromSnapshot(null);
    characterComputed = null;
    updateEquipmentPanel();
  }

  renderSaveList();
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

// Character creation events
if (btnRerollName && charNameInput) {
  btnRerollName.addEventListener("click", () => {
    charNameInput.value = randomName();
  });
}

if (btnRandomStats) {
  btnRandomStats.addEventListener("click", () => {
    randomizeStats();
  });
}

if (btnStrPlus) btnStrPlus.addEventListener("click", () => adjustStat("str", +1));
if (btnStrMinus) btnStrMinus.addEventListener("click", () => adjustStat("str", -1));
if (btnDexPlus) btnDexPlus.addEventListener("click", () => adjustStat("dex", +1));
if (btnDexMinus) btnDexMinus.addEventListener("click", () => adjustStat("dex", -1));
if (btnIntPlus) btnIntPlus.addEventListener("click", () => adjustStat("int", +1));
if (btnIntMinus) btnIntMinus.addEventListener("click", () => adjustStat("int", -1));
if (btnVitPlus) btnVitPlus.addEventListener("click", () => adjustStat("vit", +1));
if (btnVitMinus) btnVitMinus.addEventListener("click", () => adjustStat("vit", -1));

if (btnCreateCharacter) {
  btnCreateCharacter.addEventListener("click", () => {
    let name = charNameInput ? charNameInput.value.trim() : "";
    if (!name) {
      name = randomName();
      if (charNameInput) charNameInput.value = name;
    }

    currentCharacter = {
      name,
      stats: {
        str: creationStats.str,
        dex: creationStats.dex,
        int: creationStats.int,
        vit: creationStats.vit,
      },
      // New: weapon skills
      skills: createDefaultSkills(),
    };

    // Compute initial derived stats (unarmed)
    recomputeCharacterComputedState();

    // Fresh save for this character (empty inventory)
    saveCurrentGame();
    updateCharacterSummary();
    setScreen("game");
  });
}

// ----- Inventory / Loot / Equipment logic -----

let inventoryUnlocked = false;
let equipmentUnlocked = false;

// Simple RNG helper for stats
function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function rollStats(statRanges, mult) {
  const out = {};

  for (const [key, range] of Object.entries(statRanges)) {
    const [a, b] = range;
    const base = randFloat(a, b) * mult;
    const intEndpoints = Number.isInteger(a) && Number.isInteger(b);

    const value = intEndpoints
      ? Math.round(base)
      : parseFloat(base.toFixed(2));

    // If the rolled stat ends up as exactly 0, we just skip it.
    // That means it will not appear in tooltips or be counted as a bonus.
    if (value !== 0) {
      out[key] = value;
    }
  }

  return out;
}

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

// Loot flow
function startLoot() {
  if (!lootButton || !progressContainer || !progressBar) return;

  lootButton.disabled = true;
  progressContainer.style.display = "block";

  let time = 0;
  const duration = GAME_CONFIG.loot.progressDuration;
  const tick = GAME_CONFIG.loot.progressTick;

  const interval = setInterval(() => {
    time += tick;
    progressBar.style.width = `${(time / duration) * 100}%`;

    if (time >= duration) {
      clearInterval(interval);
      progressBar.style.width = "0%";
      progressContainer.style.display = "none";
      lootButton.disabled = false;

      const template = getRandomItem(); // from items.js
      const quality = rollQuality();    // from quality.js
      const mult = qualityMultiplier(quality);
      const stats = template.statRanges ? rollStats(template.statRanges, mult) : {};

      const instance = {
        name: template.name,
        category: template.category,
        description: template.description,
        rarity: template.rarity,
        usage: template.usage,
        quality,
        stats,
        slot: template.slot || null,
        attackType: template.attackType || null,

        // NEW: pass through combat metadata
        weaponType: template.weaponType || null,
        skillReq: typeof template.skillReq === "number" ? template.skillReq : null,
        attrPerPower: typeof template.attrPerPower === "number"
          ? template.attrPerPower
          : null,
      };

      addToInventory(instance); // from inventory.js

      if (!inventoryUnlocked) {
        inventoryUnlocked = true;
        if (inventoryButton) {
          inventoryButton.style.display = "block";
          inventoryButton.classList.add("inventory-unlock");
          setTimeout(() => inventoryButton.classList.remove("inventory-unlock"), 3000);
          setTimeout(() => inventoryButton.focus(), 200);
        }
      }

      // Unlock equipment only when first equippable item drops
      if (!equipmentUnlocked && instance.slot) {
        equipmentUnlocked = true;
        if (equipmentButton) {
          equipmentButton.style.display = "block";
          // same unlock effect (ring/glow) as inventory
          equipmentButton.classList.add("inventory-unlock");
          setTimeout(() => equipmentButton.classList.remove("inventory-unlock"), 3000);
          setTimeout(() => equipmentButton.focus(), 200);
        }
      }

      // Auto-save after loot (character must exist)
      saveCurrentGame();
    }
  }, tick * 1000);
}

window.debugCharacterComputed = () => {
  console.log("Character computed state:", characterComputed);
  return characterComputed;
};
