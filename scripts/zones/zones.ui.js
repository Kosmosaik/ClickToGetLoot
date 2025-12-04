// scripts/zones/zones.ui.js
// UI layer for Zone main panel (0.0.70a).

console.log("zones.ui.js loaded");

// ----- DOM references -----
const zonePanel = document.getElementById("zone-panel");

const zoneNameEl = document.getElementById("zone-name");
const zoneStatusEl = document.getElementById("zone-status");
const zoneStatsEl = document.getElementById("zone-exploration-stats");
const zoneGridEl = document.getElementById("zone-grid-view");

const zoneExploreNextBtn = document.getElementById("zone-explore-next");
const zoneExploreAutoBtn = document.getElementById("zone-explore-auto");
const zoneExploreStopBtn = document.getElementById("zone-explore-stop");

const zoneMessagesListEl = document.getElementById("zone-messages-list");
const zoneDiscoveriesListEl = document.getElementById("zone-discoveries-list");

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
        ch = "L"; // lock
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

function getZoneStatusText(zone, stats) {
  if (!zone || !isInZone) {
    return "Status: Not in a zone";
  }

  if (!stats) {
    return "Status: Exploring";
  }

  if (stats.percentExplored >= 100) {
    return "Status: Zone completed";
  }

  const manualActive = !!zoneManualExplorationActive;

  if (zoneExplorationActive) {
    return "Status: Exploring (Auto)";
  }

  if (manualActive) {
    return "Status: Exploring (Manual)";
  }

  return "Status: Idle (Ready to explore)";
}

function renderZoneUI() {
  if (!zonePanel) return;

  // No zone at all
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
    if (zoneExploreNextBtn) zoneExploreNextBtn.disabled = true;
    if (zoneExploreAutoBtn) zoneExploreAutoBtn.disabled = true;
    if (zoneExploreStopBtn) zoneExploreStopBtn.disabled = true;
    return;
  }

  const zone = currentZone;

  // Exploration stats
  let stats = null;
  let statsText = "Exploration stats unavailable";
  if (window.ZoneDebug && typeof ZoneDebug.getZoneExplorationStats === "function") {
    stats = ZoneDebug.getZoneExplorationStats(zone);
    statsText = `Explored: ${stats.percentExplored}% (${stats.exploredTiles} / ${stats.totalExplorableTiles} tiles)`;
  }

  // Zone name
  if (zoneNameEl) {
    const name = zone.name || zone.id || "Unknown Zone";
    zoneNameEl.textContent = `Zone: ${name}`;
  }

  // Status
  if (zoneStatusEl) {
    zoneStatusEl.textContent = getZoneStatusText(zone, stats);
  }

  // Stats text
  if (zoneStatsEl) {
    zoneStatsEl.textContent = statsText;
  }

  // Grid
  if (zoneGridEl) {
    zoneGridEl.textContent = buildZoneGridString(zone);
  }

  // Finish menu
  if (zoneFinishMenuEl) {
    if (stats && stats.percentExplored >= 100) {
      zoneFinishMenuEl.style.display = "block";
    } else {
      zoneFinishMenuEl.style.display = "none";
    }
  }

  // Button states
  const canExplore =
    isInZone &&
    stats &&
    stats.totalExplorableTiles > 0 &&
    stats.percentExplored < 100;

  // Manual or auto in progress?
  const manualActive = !!zoneManualExplorationActive;
  const anyExploreInProgress = zoneExplorationActive || manualActive;

  if (zoneExploreNextBtn) {
    // Manual only allowed when nothing else is running
    zoneExploreNextBtn.disabled = !canExplore || anyExploreInProgress;
  }
  if (zoneExploreAutoBtn) {
    // Auto only allowed when nothing else is running
    zoneExploreAutoBtn.disabled = !canExplore || anyExploreInProgress;
  }
  if (zoneExploreStopBtn) {
    // Stop only for auto
    zoneExploreStopBtn.disabled = !zoneExplorationActive;
  }
}


// Expose so other scripts can trigger UI refresh
window.renderZoneUI = renderZoneUI;

// ----- Message / Discovery helpers -----

function addZoneMessage(text) {
  if (!zoneMessagesListEl) return;

  const li = document.createElement("li");
  li.textContent = text;
  zoneMessagesListEl.prepend(li);

  while (zoneMessagesListEl.children.length > 30) {
    zoneMessagesListEl.removeChild(zoneMessagesListEl.lastChild);
  }
}

function addZoneDiscovery(text) {
  if (!zoneDiscoveriesListEl) return;

  const li = document.createElement("li");
  li.textContent = text;
  zoneDiscoveriesListEl.prepend(li);

  while (zoneDiscoveriesListEl.children.length > 50) {
    zoneDiscoveriesListEl.removeChild(zoneDiscoveriesListEl.lastChild);
  }
}

window.addZoneMessage = addZoneMessage;
window.addZoneDiscovery = addZoneDiscovery;

// ----- Button wiring -----

// Explore Next Tile (manual, one step)
if (zoneExploreNextBtn) {
  zoneExploreNextBtn.addEventListener("click", () => {
    if (typeof startZoneManualExploreOnce !== "function") return;
    startZoneManualExploreOnce();
  });
}


// Explore Auto (start tick-based exploring)
if (zoneExploreAutoBtn) {
  zoneExploreAutoBtn.addEventListener("click", () => {
    if (!currentZone || !isInZone) return;
    if (zoneExplorationActive) return; // already exploring
    if (typeof startZoneExplorationTicks === "function") {
      startZoneExplorationTicks();
    }
    renderZoneUI();
  });
}

// Stop Exploring (stop tick-based exploring)
if (zoneExploreStopBtn) {
  zoneExploreStopBtn.addEventListener("click", () => {
    if (!zoneExplorationActive) return;
    if (typeof stopZoneExplorationTicks === "function") {
      stopZoneExplorationTicks();
    }
    addZoneMessage("You stop to catch your breath and look around.");
    renderZoneUI();
  });
}

// Finish menu: STAY
if (zoneFinishStayBtn) {
  zoneFinishStayBtn.addEventListener("click", () => {
    console.log("Player chose to STAY in the zone.");
    // No special behavior yet; they just remain in the completed zone.
  });
}

// Finish menu: LEAVE ZONE
if (zoneFinishLeaveBtn) {
  zoneFinishLeaveBtn.addEventListener("click", () => {
    console.log("Player chose to LEAVE the zone.");

    // 1) Stop any ongoing auto exploration
    if (typeof stopZoneExplorationTicks === "function") {
      stopZoneExplorationTicks();
    }

    // 2) Mark the world map tile for this zone as VISITED and update currentX/currentY
    //    (only if we have both worldMap and currentZone and the helper exists)
    if (typeof worldMap !== "undefined" &&
        worldMap &&
        currentZone &&
        typeof markWorldTileVisited === "function") {

      // currentZone.id is set by createZoneFromDefinition(zoneId)
      markWorldTileVisited(worldMap, currentZone.id);
    }

    // 3) Update main state to "not in a zone"
    isInZone = false;
    currentZone = null;

    // 4) Add a message (while the zone panel is still visible)
    addZoneMessage("You leave the area behind.");

    // 5) Switch to the world map view if available
    if (typeof switchToWorldMapView === "function") {
      switchToWorldMapView();
    } else {
      // Fallback: at least refresh the zone UI if something is missing
      renderZoneUI();
    }
  });
}

