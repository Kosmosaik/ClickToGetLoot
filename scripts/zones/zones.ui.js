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

// IMPORTANT: avoid global const collisions across scripts.
function STATE() { return PC.state; }
function EXP() { return PC.state.exploration; }
function MOV() { return PC.state.movement; }

function getZone() {
  return STATE().currentZone;
}
function inZone() {
  return !!STATE().isInZone;
}

// ----- Helpers -----

// Build an HTML grid from the current zone.
// # = blocked, ? = unexplored walkable, . = explored walkable, L = locked
// Each cell is a <span> so we can click on it.
// Build an HTML grid from the current zone.
// # = blocked, ? = unexplored walkable, . = explored walkable, L = locked
// Each cell is a <span> so we can click on it.
function buildZoneGridString(zone) {
  if (!zone) return "(No active zone)";

  let html = "";

  for (let y = 0; y < zone.height; y++) {
    for (let x = 0; x < zone.width; x++) {
      const tile = zone.tiles[y][x];

      // --- 1) Base character based on tile kind + explored ---
      let ch;
      if (tile.kind === "blocked") {
        ch = "#";
      } else if (tile.kind === "locked") {
        ch = "L"; // lock gate
      } else {
        // walkable
        ch = tile.explored ? "." : "?";
      }

      // --- 2) Base CSS class for the cell ---
      let classes = "zone-cell";

      // --- 3) Blinking for the tile that WILL be explored next ---
      // This is the "pending" tile (during the delay) and should:
      // - show as "?"
      // - have a special CSS class so it can blink
      if (tile.isActiveExplore && !tile.explored) {
        ch = "?";
        classes += " zone-cell-exploring";
      }

      // --- 4) Player marker ☺ on the latest explored tile ---
      // We now track the player directly on the tile as tile.hasPlayer.
      if (tile.hasPlayer) {
        ch = "☻";
      }

      html += `<span class="${classes}" data-x="${x}" data-y="${y}">${ch}</span>`;
    }
    html += "<br>";
  }

  return html;
}

function getZoneStatusText(zone, stats) {
  if (!zone || !inZone()) {
    return "Status: Not in a zone";
  }

  if (!stats) {
    // Stats missing (ZoneDebug not ready)
    return "Status: Exploring";
  }

  if (stats.percentExplored >= 100) {
    return "Status: Zone completed";
  }

  if (EXP().zoneExplorationActive) {
    return "Status: Exploring (Auto)";
  }

  if (EXP().zoneManualExplorationActive) {
    return "Status: Exploring (Manual)";
  }

  return "Status: Idle (Ready to explore)";
}

function renderZoneUI() {
  if (!zonePanel) return;

  const zone = getZone();

  // No zone at all
  if (!zone) {
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

  // Grid (HTML + camera)
  if (zoneGridEl) {
    zoneGridEl.innerHTML = buildZoneGridString(zone);
  }

  // Finish menu: always visible while in a zone
  if (zoneFinishMenuEl) {
    zoneFinishMenuEl.style.display = "block";
  }

  // Button states
  const canExplore =
    inZone() &&
    !MOV().zoneMovementActive &&
    stats &&
    stats.totalExplorableTiles > 0 &&
    stats.percentExplored < 100;

  const anyExploreInProgress =
    EXP().zoneExplorationActive || EXP().zoneManualExplorationActive;

  if (zoneExploreNextBtn) {
    zoneExploreNextBtn.disabled = !canExplore || anyExploreInProgress;
  }
  if (zoneExploreAutoBtn) {
    zoneExploreAutoBtn.disabled = !canExplore || anyExploreInProgress;
  }
  if (zoneExploreStopBtn) {
    zoneExploreStopBtn.disabled = !EXP().zoneExplorationActive;
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
    renderZoneUI();
  });
}


// Explore Auto (start tick-based exploring)
if (zoneExploreAutoBtn) {
  zoneExploreAutoBtn.addEventListener("click", () => {
    if (!getZone() || !inZone()) return;
    if (EXP().zoneExplorationActive) return; // already exploring
    if (typeof startZoneExplorationTicks === "function") {
      startZoneExplorationTicks();
    }
    renderZoneUI();
  });
}

// Stop Exploring (stop tick-based exploring)
if (zoneExploreStopBtn) {
  zoneExploreStopBtn.addEventListener("click", () => {
    if (!EXP().zoneExplorationActive) return;
    if (typeof stopZoneExplorationTicks === "function") {
      stopZoneExplorationTicks();
    }
    addZoneMessage("You stop to catch your breath and look around.");
    renderZoneUI();
  });
}

// ----- Click handling on the zone grid -----
//
// Clicking on an 'L' tile should unlock the corresponding locked subregion.
if (zoneGridEl) {
  zoneGridEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || !target.classList || !target.classList.contains("zone-cell")) {
      return;
    }

    const x = parseInt(target.getAttribute("data-x"), 10);
    const y = parseInt(target.getAttribute("data-y"), 10);
    if (Number.isNaN(x) || Number.isNaN(y)) return;
    const zone = getZone();
    if (!zone) return;
    
    const tile = zone.tiles[y][x];
    
    if (!tile) return;

    // Only handle clicks on locked gate tiles that belong to a locked region.
    if (tile.kind !== "locked" || tile.lockedRegionId == null) {
      return;
    }

    console.log(
      "Clicked locked gate at",
      x,
      y,
      "for lockedRegionId=",
      tile.lockedRegionId
    );

    if (typeof unlockZoneLockedRegion === "function") {
      unlockZoneLockedRegion(zone, tile.lockedRegionId);
    }

    // Mark the gate tile itself as explored so it no longer shows as '?'.
    tile.explored = true;

    if (typeof addZoneMessage === "function") {
      addZoneMessage("You unlock a hidden passage leading deeper into the area.");
    }

    if (typeof renderZoneUI === "function") {
      renderZoneUI();
    }
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
    if (STATE().worldMap && getZone() && typeof markWorldTileVisited === "function") {
      markWorldTileVisited(STATE().worldMap, getZone().id);
    }

    // 3) Update main state to "not in a zone"
    STATE().isInZone = false;
    STATE().currentZone = null;

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

