// scripts/game/game.loot.js
// Loot flow and stat rolling for dropped items.

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
        quality,
        stats,
        slot: template.slot || null,

        // Pass through combat metadata from items.js
        weaponType: template.weaponType || null,
        skillReq: typeof template.skillReq === "number" ? template.skillReq : null,
        attrPerPower: typeof template.attrPerPower === "number"
          ? template.attrPerPower
          : null,
      };

      addToInventory(instance); // from inventory.js

      if (typeof window.ensureInventoryUnlocked === "function") {
        window.ensureInventoryUnlocked();
      }

      // Unlock equipment only when first equippable item drops
      if (!equipmentUnlocked && instance.slot) {
        equipmentUnlocked = true;
        if (equipmentButton) {
          equipmentButton.style.display = "block";
          // same unlock effect (ring/glow) as inventory
          equipmentButton.classList.add("inventory-unlock");
          setTimeout(() => equipmentButton.classList.remove("inventory-unlock"), 3000);
          setTimeout(() => equipmentButton.classList.remove("inventory-unlock"), 3000);
          setTimeout(() => equipmentButton.focus(), 200);
        }
      }

      // Auto-save after loot (character must exist)
      saveCurrentGame();
    }
  }, tick * 1000);
}
