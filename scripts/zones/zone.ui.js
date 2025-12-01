// scripts/zones/zones.ui.js
// Small UI layer for the Zone panel (0.0.70a test).

console.log("zones.ui.js loaded");

// ----- DOM references -----
const zonePanel = document.getElementById("zone-panel");
const zoneButton = document.getElementById("zone-btn");

const zoneNameEl = document.getElementById("zone-name");
const zoneStatsEl = document.getElementById("zone-exploration-stats");
const zoneGridEl = document.getElementById("zone-grid-view");

const zoneExploreRandomBtn = document.getElementById("zone-explore-random");
const zoneExploreSequentialBtn = document.getElementById("zone-explore-sequential");

// ----- Helpers -----

// Build a simple ASCII grid from the current zone.
// # = blocked, ? = unexplored walkable, . = explored walkable, L = locked
function buildZoneGridString(zone) {
  if (!zone) return "(No active zone)";

  const lines = [];

  for (let y = 0; y < zone.height; y++) {
    let row = "";
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];

      let ch;
      if (tile.kind === "blocked") {
        ch = "#";
      } else if (tile.kind === "locked") {
        ch = "L";          // always show lock as L
      } else {
        // walkable
        ch = tile.explored ? "." : "?";
      }

      row += ch;
    }
    lines.push(row);
  }

  return lines.join("\n");
}

function renderZoneUI() {
  if (!zonePanel) return;

  // No zone yet
  if (typeof currentZone === "undefined" || !currentZone) {
    if (zoneNameEl) {
      zoneNameEl.textContent = "Zone: (none)";
    }
    if (zoneStatsEl) {
      zoneStatsEl.textContent = "Explored: 0% (0 / 0 tiles)";
    }
    if (zoneGridEl) {
      zoneGridEl.textContent = "(No active zone)";
    }
    return;
  }

  const zone = currentZone;

  // Zone name
  if (zoneNameEl) {
    const name = zone.name || zone.id || "Unknown Zone";
    zoneNameEl.textContent = `Zone: ${name}`;
  }

  // Exploration stats
  let statsText = "Exploration stats unavailable";
  if (window.ZoneDebug && typeof ZoneDebug.getZoneExplorationStats === "function") {
    const stats = ZoneDebug.getZoneExplorationStats(zone);
    statsText = `Explored: ${stats.percentExplored}% (${stats.exploredTiles} / ${stats.totalExplorableTiles} tiles)`;
  }
  if (zoneStatsEl) {
    zoneStatsEl.textContent = statsText;
  }

  // Grid
  if (zoneGridEl) {
    zoneGridEl.textContent = buildZoneGridString(zone);
  }
}

// Expose this so game.creation.js can call it after creating the debug zone.
window.renderZoneUI = renderZoneUI;

// ----- Button wiring -----

// Toggle Zone panel visibility
if (zoneButton && zonePanel) {
  zoneButton.addEventListener("click", () => {
    const visible = zonePanel.style.display === "block";
    zonePanel.style.display = visible ? "none" : "block";

    // If we just opened it, update contents
    if (!visible) {
      renderZoneUI();
    }
  });
}

// Explore once (Random)
if (zoneExploreRandomBtn) {
  zoneExploreRandomBtn.addEventListener("click", () => {
    if (!window.ZoneDebug || typeof ZoneDebug.revealRandomExplorableTile !== "function") return;
    if (!currentZone) return;

    const changed = ZoneDebug.revealRandomExplorableTile(currentZone);
    if (!changed) {
      console.log("Zone already fully explored (random explore).");
    }
    renderZoneUI();
  });
}

// Explore once (Sequential)
if (zoneExploreSequentialBtn) {
  zoneExploreSequentialBtn.addEventListener("click", () => {
    if (!window.ZoneDebug || typeof ZoneDebug.revealNextExplorableTileSequential !== "function") return;
    if (!currentZone) return;

    const changed = ZoneDebug.revealNextExplorableTileSequential(currentZone);
    if (!changed) {
      console.log("Zone already fully explored (sequential explore).");
    }
    renderZoneUI();
  });
});
