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
    setScreen("game");
  });
}
