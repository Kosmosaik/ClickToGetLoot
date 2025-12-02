// scripts/zones/zones.ui.js
// Small UI layer for the Zone panel (0.0.70a test).

console.log("zones.ui.js loaded");

// ----- DOM references -----
const zonePanel = document.getElementById("zone-panel");

const zoneNameEl = document.getElementById("zone-name");
const zoneStatusEl = document.getElementById("zone-status");
const zoneStatsEl = document.getElementById("zone-exploration-stats");
const zoneGridEl = document.getElementById("zone-grid-view");

const zoneExploreRandomBtn = document.getElementById("zone-explore-random");
const zoneExploreSequentialBtn = document.getElementById("zone-explore-sequential");

const zoneDiscoveryListEl = document.getElementById("zone-discovery-list");

const zoneFinishMenuEl = document.getElementById("zone-finish-menu");
const zoneFinishStayBtn = document.getElementById("zone-finish-stay");
const zoneFinishLeaveBtn = document.getElementById("zone-finish-leave");

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

function getZoneStatusText() {
  if (!currentZone || !isInZone) {
    return "Status: Not in a zone";
  }

  if (window.ZoneDebug && typeof ZoneDebug.getZoneExplorationStats === "function") {
    const stats = ZoneDebug.getZoneExplorationStats(currentZone);
    if (stats.percentExplored >= 100) {
      return "Status: Zone completed";
    }
  }

  return "Status: Exploring zone";
}

function renderZoneUI() {
  if (!zonePanel) return;

  // No zone or not in zone
  if (typeof currentZone === "undefined" || !currentZone) {
    if (zoneNameEl) {
      zoneNameEl.textContent = "Zone: (none)";
    }
    if (zoneStatusEl) {
      zoneStatusEl.textContent = "Status: Not in a zone";
    }
    if (zoneStatsEl) {
      zoneStatsEl.textContent = "Explored: 0% (0 / 0 tiles)";
    }
    if (zoneGridEl) {
      zoneGridEl.textContent = "(No active zone)";
    }
    if (zoneFinishMenuEl) {
      zoneFinishMenuEl.style.display = "none";
    }
    return;
  }

  const zone = currentZone;

  // Zone name
  if (zoneNameEl) {
    const name = zone.name || zone.id || "Unknown Zone";
    zoneNameEl.textContent = `Zone: ${name}`;
  }

  // Status text
  if (zoneStatusEl) {
    zoneStatusEl.textContent = getZoneStatusText();
  }

  // Exploration stats
  let statsText = "Exploration stats unavailable";
  let stats = null;
  if (window.ZoneDebug && typeof ZoneDebug.getZoneExplorationStats === "function") {
    stats = ZoneDebug.getZoneExplorationStats(zone);
    statsText = `Explored: ${stats.percentExplored}% (${stats.exploredTiles} / ${stats.totalExplorableTiles} tiles)`;
  }
  if (zoneStatsEl) {
    zoneStatsEl.textContent = statsText;
  }

  // Grid
  if (zoneGridEl) {
    zoneGridEl.textContent = buildZoneGridString(zone);
  }

  // Show/hide finish menu
  if (zoneFinishMenuEl) {
    if (stats && stats.percentExplored >= 100) {
      zoneFinishMenuEl.style.display = "block";
    } else {
      zoneFinishMenuEl.style.display = "none";
    }
  }
}

function addZoneDiscoveryEntry(text) {
  if (!zoneDiscoveryListEl) return;

  const li = document.createElement("li");
  li.textContent = text;
  zoneDiscoveryListEl.prepend(li); // newest at top

  // Limit to, say, 30 entries
  while (zoneDiscoveryListEl.children.length > 30) {
    zoneDiscoveryListEl.removeChild(zoneDiscoveryListEl.lastChild);
  }
}

// Expose so game.js can use it after each tick
window.addZoneDiscoveryEntry = addZoneDiscoveryEntry;

// Expose this so game.creation.js can call it after creating the debug zone.
window.renderZoneUI = renderZoneUI;

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
};

// Finish menu: STAY
if (zoneFinishStayBtn) {
  zoneFinishStayBtn.addEventListener("click", () => {
    console.log("Player chose to STAY in the zone.");
    // For now, just log it. In future, maybe change behavior.
  });
}

// Finish menu: LEAVE ZONE
if (zoneFinishLeaveBtn) {
  zoneFinishLeaveBtn.addEventListener("click", () => {
    console.log("Player chose to LEAVE the zone.");

    isInZone = false;
    currentZone = null;

    if (typeof stopZoneExplorationTicks === "function") {
      stopZoneExplorationTicks();
    }

    // Clear grid and stats
    renderZoneUI();
  });
}

