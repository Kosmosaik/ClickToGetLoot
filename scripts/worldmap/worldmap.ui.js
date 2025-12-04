// scripts/worldmap/worldmap.ui.js
// Simple UI renderer for the world map panel.

console.log("worldmap.ui.js loaded");

// DOM references
const worldMapPanel = document.getElementById("worldmap-panel");
const worldMapGridEl = document.getElementById("worldmap-grid-view");
const worldMapStatusEl = document.getElementById("worldmap-status");

function switchToWorldMapView() {
    const worldMapPanel = document.getElementById("worldmap-panel");
    const zonePanel = document.getElementById("zone-panel");

    if (zonePanel) {
        zonePanel.style.display = "none";
    }
    if (worldMapPanel) {
        worldMapPanel.style.display = "block";
    }

    if (typeof renderWorldMapUI === "function") {
        renderWorldMapUI();
    }
}

function switchToZoneView() {
    const worldMapPanel = document.getElementById("worldmap-panel");
    const zonePanel = document.getElementById("zone-panel");

    if (worldMapPanel) {
        worldMapPanel.style.display = "none";
    }
    if (zonePanel) {
        zonePanel.style.display = "block";
    }
}

// Convert one world map tile to a single character for the ASCII map.
function worldMapTileToChar(tile) {
  if (!tile || !tile.zoneId) {
    return "."; // empty / no zone here
  }

  switch (tile.fogState) {
    case WORLD_FOG_STATE.VISITED:
      return "X"; // zones we've been in
    case WORLD_FOG_STATE.DISCOVERED:
      return "o"; // known zones we haven't visited yet
    case WORLD_FOG_STATE.UNKNOWN:
    default:
      return "?"; // should not appear in 0.0.70b, but safe fallback
  }
}

// Build the full grid as a string
function buildWorldMapGridString(worldMap) {
  if (!worldMap) {
    return "(World map not created)";
  }

  const lines = [];
  for (let y = 0; y < worldMap.height; y++) {
    let line = "";
    for (let x = 0; x < worldMap.width; x++) {
      const tile = worldMap.tiles[y][x];
      line += worldMapTileToChar(tile);
    }
    lines.push(line);
  }
  return lines.join("\n");
}

// Public render function
function renderWorldMapUI() {
  if (!worldMapPanel || !worldMapGridEl) return;

  if (typeof worldMap === "undefined" || !worldMap) {
    worldMapGridEl.textContent = "(World map not available)";
    if (worldMapStatusEl) {
      worldMapStatusEl.textContent = "No world map created yet.";
    }
    return;
  }

  worldMapGridEl.textContent = buildWorldMapGridString(worldMap);

  if (worldMapStatusEl) {
    worldMapStatusEl.textContent =
      "World map ready (Tutorial Zone + adjacent placeholders).";
  }
}

function switchToWorldMapView() {
  const worldMapPanel = document.getElementById("worldmap-panel");
  const zonePanel = document.getElementById("zone-panel");

  if (zonePanel) {
    zonePanel.style.display = "none";
  }
  if (worldMapPanel) {
    worldMapPanel.style.display = "block";
  }

  if (typeof renderWorldMapUI === "function") {
    renderWorldMapUI();
  }
}


// Expose for other scripts
window.renderWorldMapUI = renderWorldMapUI;

// Debug helper: manually show the World Map panel and hide the Zone panel.
// Use from browser console: WorldMapDebug.showWorldMapPanel()
// Debug helper: manually show the World Map panel and hide the Zone panel.
// Use from browser console: WorldMapDebug.showWorldMapPanel()
WorldMapDebug.showWorldMapPanel = function () {
  if (typeof switchToWorldMapView === "function") {
    switchToWorldMapView();
  }
};


