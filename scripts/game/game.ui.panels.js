// scripts/game/game.ui.panels.js
// UI DOM references and panel toggles for game screen.

// ----- HP Bar -----
const hpBarContainer = document.getElementById("hp-bar-container");
const hpBarFill = document.getElementById("hp-bar-fill");
const hpBarLabel = document.getElementById("hp-bar-label");

// ----- WorldMap -----
const worldMapButton = document.getElementById("worldmap-btn");

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

// Skills UI
const skillsPanel = document.getElementById("skills-panel");
const skillsButton = document.getElementById("skills-btn");
const skillsListContainer = document.getElementById("skills-list");

// ----- Character summary on game screen -----
const charSummaryName = document.getElementById("char-summary-name");
const charSummaryStats = document.getElementById("char-summary-stats");

// ----- UI events (panel toggles + loot click) -----

// Loot click -> start loot flow (startLoot comes from game.loot.js)
if (lootButton) {
  lootButton.addEventListener("click", startLoot);
}

// Inventory panel toggle
if (inventoryButton) {
  inventoryButton.addEventListener("click", () => {
    if (!inventoryPanel) return;
    inventoryPanel.style.display =
      (inventoryPanel.style.display === "block") ? "none" : "block";
  });
}

// Equipment panel toggle
if (equipmentButton && equipmentPanel) {
  equipmentButton.addEventListener("click", () => {
    equipmentPanel.style.display =
      (equipmentPanel.style.display === "block") ? "none" : "block";
  });
}

// Skills panel toggle
if (skillsButton && skillsPanel) {
  skillsButton.addEventListener("click", () => {
    const visible = skillsPanel.style.display === "block";
    skillsPanel.style.display = visible ? "none" : "block";
  });
}

