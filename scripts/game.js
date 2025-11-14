// scripts/game.js
console.log(`game.js loaded v${GAME_CONFIG.version} - Core gameplay wiring`);

const lootButton = document.getElementById("loot-button");
const progressBar = document.getElementById("progress");
const progressContainer = document.getElementById("progress-container");
const inventoryPanel = document.getElementById("inventory-panel");
const inventoryButton = document.getElementById("inventory-btn");

let inventoryUnlocked = false;

// Simple RNG helper for stats
function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// Roll stats (no clamp; can exceed max if your multiplier pushes it)
function rollStats(statRanges, mult) {
  const out = {};
  for (const [key, range] of Object.entries(statRanges)) {
    const [a, b] = range;
    const base = randFloat(a, b) * mult;
    const intEndpoints = Number.isInteger(a) && Number.isInteger(b);
    out[key] = intEndpoints ? Math.round(base) : parseFloat(base.toFixed(2));
  }
  return out;
}

// UI events
lootButton.addEventListener("click", startLoot);
inventoryButton.addEventListener("click", () => {
  inventoryPanel.style.display =
    (inventoryPanel.style.display === "block") ? "none" : "block";
});

// Loot flow
function startLoot() {
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
      };

      addToInventory(instance); // from inventory.js

      if (!inventoryUnlocked) {
        inventoryUnlocked = true;
        inventoryButton.style.display = "block";

        inventoryButton.classList.add("inventory-unlock");
        setTimeout(() => inventoryButton.classList.remove("inventory-unlock"), 3000);
        setTimeout(() => inventoryButton.focus(), 200);
      }
    }
  }, tick * 1000);
}
