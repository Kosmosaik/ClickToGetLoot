// scripts/game/game.creation.js
// Character creation UI and logic.

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

const btnCreateCharacter = document.getElementById("btn-create-character");

// ----- Character creation state -----
const BASE_STAT = 5;
const EXTRA_POINTS = 20;

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
  "Bullen", "Ballen", "Bongen", "Mjolk", "Riskakan",
  "Jared the Greedy", "Four Fingered Westby", "Rawley the Viper",
  "Jessie Smokes", "Teresa Mad Dog", "Kaley the Reaper",
  "Stom", "Elmadreth", "Glurn", "Jurngof", "Grimbald", "Kalylia"
];

function randomName() {
  const idx = Math.floor(Math.random() * NAME_POOL.length);
  return NAME_POOL[idx];
}

function updateCharacterCreationUI() {
  if (statStrValue) statStrValue.textContent = creationStats.str;
  if (statDexValue) statDexValue.textContent = creationStats.dex;
  if (statIntValue) statIntValue.textContent = creationStats.int;
  if (statVitValue) statVitValue.textContent = creationStats.vit;
  if (pointsLeftElem) pointsLeftElem.textContent = pointsLeft;
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

// ----- Event wiring for character creation -----

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

    // currentCharacter comes from game.js (global)
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
    
    // --- 0.0.70a / 0.0.70c+: Enter Starting Zone automatically (exploration paused) ---
    if (typeof createDebugZone === "function") {
      // Build the tutorial zone via the normal definition pipeline.
      currentZone = createZoneFromDefinition("tutorial_zone");
      isInZone = true;
      console.log("Entered Starting Zone (Debug):", currentZone);

// --- 0.0.70a / 0.0.70c+: Enter Starting Zone automatically (exploration paused) ---
if (typeof createDebugZone === "function") {
  const zone = createZoneFromDefinition("tutorial_zone");
  setCurrentZone(zone);
  setIsInZone(true);

  console.log("Entered Starting Zone (Debug):", zone);

  // Place the player on the zone's entry spawn tile, same as world map entry.
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
      console.warn(
        "game.creation: entrySpawn out of bounds for tutorial_zone",
        zone.entrySpawn
      );
    }
  }

  if (typeof normalizeZoneExploredConnectivity === "function") {
    normalizeZoneExploredConnectivity(zone);
  }

  // Create the default world map for this new game.
  // We know our starting zone is the tutorial zone.
  if (typeof createDefaultWorldMap === "function") {
    const wm = createDefaultWorldMap("tutorial_zone");
    setWorldMap(wm);
    console.log("World map created:", wm);

    if (typeof renderWorldMapUI === "function") {
      renderWorldMapUI();
    }
  }

  if (typeof renderZoneUI === "function") {
    renderZoneUI();
  }

  setScreen("game");
}

